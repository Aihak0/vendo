import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MidtransService } from 'src/midtrans/midtrans.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { MqttRecordBuilder } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TransaksiService {
  constructor(private readonly midtransService: MidtransService,
              private supabaseService: SupabaseService,
              @Inject('HIVE_CLIENT') private client: ClientProxy
  ){}

  private async sendMqtt(topic: string, payload: any, qos: 0 | 1 | 2 = 1) {
    try {
      const record = new MqttRecordBuilder(payload)
        .setQoS(qos)
        .build();

      // Gunakan lastValueFrom agar NestJS benar-benar mengirim pesan sebelum fungsi selesai
      await lastValueFrom(this.client.emit(topic, record));
      console.log(`[MQTT] Terkirim ke ${topic} dengan QoS ${qos}`);
    } catch (error) {
      console.error(`[MQTT] Gagal kirim ke ${topic}:`, error.message);
    }
  }
  // Helper untuk pesan yang lebih rapi
  private getFriendlyMessage(status: string): string {
    const messages = {
      settlement: "Pembayaran Berhasil!",
      capture: "Pembayaran Berhasil!",
      deny: "Pembayaran Ditolak.",
      cancel: "Pembayaran Dibatalkan.",
      expire: "Pembayaran Kadaluarsa."
    };
    return messages[status] || "Status Transaksi Berubah";
  }

  async paymentReq(data: any, dataMesin: any) {
    const supabase = this.supabaseService.getClient();
    const midtrans = this.midtransService.getClient();

    // 1. Validasi Input (Singkat & Padat)
    if (!data.order_id || !data.total || !data.kode || !data.items) {
      await this.sendMqtt(`transaksi/status`, { success: false, message: "Data Tidak Lengkap." }, 0);
      return;
    }

    // 2. Formatting Items
    const formattedItems = data.items.map((item: any) => ({
      id: item.produk_id,
      price: Number(item.harga),
      quantity: Number(item.qty),
      name: item.nama_produk,
    }));

    const midtransPayload = {
      payment_type: 'qris',
      transaction_details: {
        order_id: data.order_id,
        gross_amount: data.total,
      },
      qris: { acquirer: 'gopay' },
      item_details: formattedItems,
    };

  
    try {
      // 4. Charge Midtrans
      const result = await midtrans.charge(midtransPayload);

      // Cek Fraud Status
      if (result.fraud_status !== "accept") {
        // Jika fraud, kita tidak perlu lanjut ke DB
        throw { source: 'midtrans', message: "Transaksi terdeteksi penipuan." };
      }

      // 5. Simpan ke Supabase via RPC
      const { data: dataInsert, error: errorInsert } = await supabase.rpc(
        "tambah_transaksi_dengan_items",
        {
          d_id: result.transaction_id,
          d_order_id: result.order_id,
          d_mesin_id: dataMesin.id,
          d_status: "pending",
          d_status_pembayaran: "pending",
          d_total: result.gross_amount,
          d_items: data.items, // Pastikan format JSON di Postgres cocok
        }
      );

      // Cek Error Insert
      if (errorInsert || (dataInsert && dataInsert.success === false)) {
        // Jika DB gagal, kita harus CANCEL transaksi yang sudah terlanjur dibuat di Midtrans
        throw { 
          source: 'supabase', 
          message: errorInsert?.message || dataInsert?.message || "Gagal simpan ke database",
          orderId: result.order_id 
        };
      }

      // 6. BERHASIL - Kirim QR ke Frontend/Mesin
      const payload = {
        success: true,
        message: "Generating QR",
        data: result,
      };
      await this.sendMqtt(`transaksi/status/${result.order_id}`, payload, 0);

    } catch (error: any) {
      let finalMessage = error.message || "Internal Server Error";

      // 7. HANDLING ROLLBACK (Jika DB Gagal tapi Midtrans sudah Charge)
      if (error.source === 'supabase' && error.orderId) {
        try {
          await midtrans.transaction.cancel(error.orderId);
          finalMessage = `Database Error: ${error.message}. Transaksi Midtrans otomatis dibatalkan.`;
        } catch (cancelErr) {
          finalMessage = `Fatal Error: Gagal simpan DB & Gagal Cancel Midtrans.`;
        }
      }

      // 8. Handling Error dari SDK Midtrans (4xx/5xx)
      if (error.ApiResponse) {
        finalMessage = error.ApiResponse.status_message;
      }

      const payload = {
        success: false,
        message: finalMessage,
      };

      await this.sendMqtt(`transaksi/status/${data.order_id}`, payload, 0);
    }
  }
    
  async updateStatusTransaksi(data: any) {
    const supabase = this.supabaseService.getClient();
    const { order_id: orderId, transaction_id: transactionId, transaction_status: transactionStatus, fraud_status: fraudStatus } = data;

    if (transactionStatus === 'pending') {
      return { success: true, message: 'Status masih pending, abaikan.' };
    }

    if (fraudStatus && fraudStatus !== 'accept') {
          this.client.emit(`transaksi/status/${orderId}`, {
            success: false,
            message: "Transaksi terdeteksi fraud.",
            order_id: orderId
          });

      return;
    }

    // 2. Mapping Status (Gunakan Else If agar lebih efisien)
    let statusTransaksi: string;
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      statusTransaksi = "process";
    } else if (['expire', 'cancel', 'deny', 'refund'].includes(transactionStatus)) {
      statusTransaksi = "cancel";
    } else {
      // Jika ada status lain yang tidak kita handle, jangan lanjut update
      return { success: true, message: 'Status tidak relevan.' };
    }

    // 3. Update Supabase
    const { error: errUpdateStatus } = await supabase
      .from("transaksi")
      .update({
        status_pembayaran: transactionStatus,
        status: statusTransaksi, // Simpan status asli Midtrans untuk audit
      })
      .eq("id", transactionId)
      .eq("order_id", orderId);

    // PENTING: Jika DB gagal, lempar error agar Midtrans melakukan RETRY
    if (errUpdateStatus) {
      throw new InternalServerErrorException(`Gagal Update DB: ${errUpdateStatus.message}`);
    }

    // 4. Kirim ke MQTT
    // Gunakan 'await' dan 'toPromise' jika ingin memastikan pesan terkirim sebelum return ke Midtrans
    await this.sendMqtt(`transaksi/status/${orderId}`, { success: true, message: this.getFriendlyMessage(transactionStatus), order_id: orderId }, 1);

    return { success: true, orderId };
  }

  async completeOrder(orderId: string, dataMesin: any) {
    const supabase = this.supabaseService.getClient();

    if(!orderId) {
      await this.sendMqtt(`transaksi/status/${orderId}`, { success: false, message: "Data Tidak Lengkap."}, 0);
      return;
    }

    const { data: dataUpdateStatus, error: errorUpdateStatus } = await supabase.from("transaksi")
        .update({
          status: "complete"
        })
        .eq("order_id", orderId)
        .eq("mesin_id", dataMesin.id)
        .select();

    if(errorUpdateStatus) {
      const payload = {
        success: false,
        message: `Gagal menyelesaikan transaksi`
      };
      await this.sendMqtt(`transaksi/status/${orderId}`, payload, 1);
      return;
    }

        
    const payload = {
      success: true,
      message: "Berhasil menyelesaikan transaksi.",
      data: dataUpdateStatus
    };
    await this.sendMqtt(`transaksi/status/${orderId}`, payload, 1);
  }

  async cancelOrder( orderId: string, dataMesin: any) {
    const midtrans = this.midtransService.getClient();
    const supabase = this.supabaseService.getClient();
    
    const resultMidtrans = await midtrans.transaction.cancel(orderId).catch(async err => {
      const payload = {
        success: false,
        message: err.ApiResponse?.status_message || err.message || "Gagal membatalkan transaksi."
      };
      await this.sendMqtt(`transaksi/status/${orderId}`, payload, 1);
    });

    const { data: dataUpdateStatus, error: errorUpdateStatus } = await supabase.from("transaksi")
      .update({
        status: "cancel",
        status_pembayaran: resultMidtrans.transaction_status,
        updated_at: new Date().toISOString()
      })
      .eq("order_id", orderId)
      .eq("mesin_id", dataMesin.id)
      .select();
    
    if(errorUpdateStatus) {
      const payload = {
        success: false,
        message: `Transaksi berhasil dibatalkan, namun sepertinya server sedang mengalami masalah.`
      };
      await this.sendMqtt(`transaksi/status/${orderId}`, payload, 1);
      return;
    }

    const payload = {
      success: true,
      message: "Berhasil membatalkan transaksi.",
      data: dataUpdateStatus
    };
    await this.sendMqtt(`transaksi/status/${orderId}`, payload, 1);
  }

  async refundOrder( orderId: string, dataMesin: any, data: any) {
    const midtrans = this.midtransService.getClient();
    const supabase = this.supabaseService.getClient();
    
    const resultMidtrans = await midtrans.transaction.refund(orderId, data.refund_parameter).catch(async err => {
      const payload = {
        success: false,
        message: err.ApiResponse?.status_message || err.message || "Gagal mengembalikan dana."
      };
      await this.sendMqtt(`transaksi/status/${orderId}`, payload, 1);
    });

    const { data: dataUpdateStatus, error: errorUpdateStatus } = await supabase.from("transaksi")
      .update({
        status: "cancel",
        status_pembayaran: resultMidtrans.transaction_status,
        updated_at: new Date().toISOString()
      })
      .eq("order_id", orderId)
      .eq("mesin_id", dataMesin.id)
      .select();
    
    if(errorUpdateStatus) {
      const payload = {
        success: false,
        message: `dana berhasil dikembalikan, namun sepertinya server sedang mengalami masalah.`
      };
      await this.sendMqtt(`transaksi/status/${orderId}`, payload, 1);
      return;
    }

    const payload = {
      success: true,
      message: "dana berhasil dikembalikan.",
      data: dataUpdateStatus
    };
    await this.sendMqtt(`transaksi/status/${orderId}`, payload, 1);
  }
}
