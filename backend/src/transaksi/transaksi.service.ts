import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MidtransService } from 'src/midtrans/midtrans.service';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class TransaksiService {
    constructor(private readonly midtransService: MidtransService,
                private supabaseService: SupabaseService,
                @Inject('HIVE_CLIENT') private client: ClientProxy
    ){}
    
  async paymentReq(data: any) {
    const supabase = this.supabaseService.getClient();
    const midtrans = this.midtransService.getClient();

    // 1. Validasi Input (Singkat & Padat)
    if (!data.order_id || !data.total || !data.kode || !data.items) {
      this.client.emit(`transaksi/status`, {
        success: false,
        message: "Data Tidak Lengkap.",
      });
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

    // 3. Autentikasi Mesin (Sebelum Charge Midtrans)
    const { data: dataMesin, error: errorDataMesin } = await supabase
      .from("mesin")
      .select("id")
      .eq("kode", data.kode)
      .single();

    if (errorDataMesin || !dataMesin) {
      this.client.emit(`transaksi/status/${data.order_id}`, {
        success: false, // Perbaikan: tadinya true
        message: "Autentikasi mesin gagal atau mesin tidak ditemukan.",
      });
      return;
    }

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
          d_status: "MENUNGGU",
          d_status_pembayaran: "MENUNGGU",
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
      this.client.emit(`transaksi/${result.order_id}`, {
        success: true,
        message: "Generating QR",
        data: result,
      });

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

      this.client.emit(`transaksi/status/${data.order_id}`, {
        success: false,
        message: finalMessage,
      });

      // Opsional: re-throw agar NestJS logs mencatat error ini
      // throw error; 
    }
  }
    
    async updateStatusTransaksi(data: any){
      const supabase = this.supabaseService.getClient();
      const orderId = data.order_id;
      const transactionId = data.transaction_id;
      const transactionStatus = data.transaction_status;
      const fraudStatus = data.fraud_status;
      if (fraudStatus === 'accept' || !fraudStatus) {
        if(transactionStatus != "pending"){
          const { error: errUpdateStatus } = await supabase.from("transaksi")
          .update({
            status_pembayaran: transactionStatus === "settlement" ? "LUNAS" :
                                transactionStatus === "deny" || transactionStatus === "cancel" ? "DIBATALKAN" :
                                transactionStatus === "expire" ? "KADALUWARSA" : "MENUNGGU"
          })
          .eq("id", transactionId)
          .eq("order_id", orderId)
        
          if(errUpdateStatus) throw new BadRequestException(errUpdateStatus.message);

          this.client.emit(`transaksi/status/${orderId}`, {
            success:  transactionStatus === "settlement" ? true : false,
            message:  transactionStatus === "settlement" ? "Pembayaran Berhasil!" :
                      transactionStatus === "deny" || transactionStatus === "cancel" ? "Pembayaran Dibatalkan" :
                      transactionStatus === "expire" ? "Pembayaran Kadaluarsa" : "Menunggu Pembayaran"
          });
        }
      }      
    }
  async transaksiReqTo(data: any) {
    const supabase = this.supabaseService.getClient();
    const midtrans = this.midtransService.getClient();
    
    const { order_id: orderId, kode: mesinKode, command_req: command } = data;

    // 1. Validasi Input (Simpel)
    if (!orderId || !mesinKode) {
      return this.client.emit(`transaksi/status`, {
        success: false,
        message: "Data Tidak Lengkap."
      });
    }

    // 2. Cek Mesin (Satu kali query)
    const { data: dataMesin, error: errorDataMesin } = await supabase
      .from("mesin")
      .select("id, status")
      .eq("kode", mesinKode)
      .single();

    if (errorDataMesin || !dataMesin) {
      return this.client.emit(`transaksi/status/${orderId}`, {
        success: false,
        message: `Akses Ditolak: Mesin tidak terdaftar.`
      });
    }

    if (dataMesin.status !== 'ONLINE') {
      return this.client.emit(`transaksi/status/${orderId}`, {
        success: false,
        message: `Mesin dalam kondisi tidak baik (Status: ${dataMesin.status}).`
      });
    }

    // 3. Eksekusi Perintah (Cancel / Refund)
    try {
      let result;
      let successMessage = "";

      if (command === 'cancel') {
        result = await midtrans.transaction.cancel(orderId);
        successMessage = "Berhasil membatalkan transaksi.";
      } else if (command === 'refund') {
        result = await midtrans.transaction.refund(orderId, data.refund_parameter);
        successMessage = "Berhasil refund transaksi.";
      } else {
        throw new Error("Perintah tidak diketahui sistem.");
      }

      // Emit Sukses (Satu tempat)
      return this.client.emit(`transaksi/status/${orderId}`, {
        success: true,
        message: successMessage,
        data: result
      });

    } catch (error: any) {
      // Penanganan Error Terpusat
      const errorMessage = error.ApiResponse?.status_message || error.message || "Gagal memproses permintaan.";
      
      this.client.emit(`transaksi/status/${orderId}`, {
        success: false,
        message: errorMessage
      });
    }
  }
}
