import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MidtransService } from 'src/midtrans/midtrans.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { MqttRecordBuilder } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);


@Injectable()
export class TransaksiService {
  constructor(private readonly midtransService: MidtransService,
              private supabaseService: SupabaseService,
              @Inject('HIVE_CLIENT') private client: ClientProxy
  ){}

  async onModuleInit() {
    await this.client.connect(); // ← ini yang sering terlewat
  }
 
  private async sendMqtt(topic: string, payload: any, qos: 0 | 1 | 2 = 1) {
    try {
      await this.client.connect();
      
      const record = new MqttRecordBuilder(payload)
        .setQoS(qos)
        .build();

      // Gunakan lastValueFrom agar NestJS benar-benar mengirim pesan sebelum fungsi selesai
      await lastValueFrom(this.client.emit(topic, record));
      console.log(`[MQTT] Terkirim ke ${topic} dengan QoS ${qos}`);
    } catch (error: any) {
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

  async findAll(page: number, limit: number, sortAsc: boolean, sortKey?: string, search?: string, statusTransaksi?: string, statusPembayaran?: string) {
    const supabase = this.supabaseService.getClient();
    try{
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      let query = supabase
        .from('detailed_transaksi')
        .select(`*`)
        .range(from, to)

      if(statusPembayaran && statusPembayaran != "all"){
        query = query.eq("status_pembayaran", statusPembayaran)
      }
      if(statusTransaksi && statusTransaksi != "all"){
        query = query.eq("status", statusTransaksi)
      }
      if (sortKey){
        query = query.order(sortKey, { ascending: sortAsc });
      }else{
        query = query.order('created_at', { ascending: false });
      }

      if (search) {
       // Pastikan searchQuery sudah mengandung wildcard
        const queryPattern = `%${search}%`;

        // Gunakan format: "kolom.operator.value,kolom.operator.value"
        query = query.or(`mesin_nama.ilike.%${queryPattern}%,order_id.ilike.%${queryPattern}%`);
      }

      const { data, error } = await query;

      const { data: stats, error:errorStats , count} = await supabase
        .from('transaksi')
        .select(`
          status
        `, { count: 'exact' });

        let countPending;
        let countCancel
        let countComplete;
      if(!errorStats){
        countPending = stats.filter(u => u.status === 'pending').length;
        countCancel = stats.filter(u => u.status === 'cancel').length;
        countComplete = stats.filter(u => u.status === 'complete').length;
      }else{
        countPending=0;
        countCancel=0;
        countComplete=0;
      }
      if (error) {
        throw new InternalServerErrorException(error.message);
      }
      
      
      return {
        success: true,
        data,
        metadata: {
          totalData: count,
          totalDataPending: countPending,
          totalDataCancel: countCancel,
          totalDataComplete: countComplete,
          currentPage: page,
          totalPages: Math.ceil((count ?? 0) / limit),
          pageSize: limit,
        }
      };
    }catch(err: any){
      console.log(err);
      throw err;
      // return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
    }
   
  }
  async getSummary(filter:string, dari?: Date, sampai?: Date) {

    const supabase = this.supabaseService.getClient()

    const now = dayjs().tz("Asia/Jakarta");

 

    let startDate, endDate;
    if(filter === "custom"){
      startDate = dayjs.tz(dari, "Asia/Jakarta").startOf('day').format();
      endDate = dayjs.tz(sampai, "Asia/Jakarta").add(1, "day").startOf('day').format();
    }
    if(filter === "hari"){
      startDate = dayjs().startOf('week').format();
      endDate = dayjs().endOf('week').add(1, 'day').format();
    }
    if(filter === "minggu"){
      startDate = dayjs().startOf('month').format();
      endDate = dayjs().endOf('month').format();
    }
    if(filter === "bulan"){ 
      startDate = dayjs().startOf('year').format();
      endDate = dayjs().add(1, "year").startOf('year').format();
    }
    if(filter === "tahun"){
      endDate = dayjs().add(1, "year").startOf('year').format();
      startDate = dayjs().subtract(4, 'year').startOf('year').format();
    }
    // console.log("Start Date:", startDate, "End Date :", endDate);
    // console.log("IS VALID:", dayjs(startDate).isValid());
    const { data, error } = await supabase.rpc('get_transaksi_summary', {
      p_end: endDate,
      p_priode: filter === "custom" ? "hari" : filter,
      p_start: startDate,
    })

    // console.log("1. errpr get data trans sumary => ", error);
    // console.log("2. errpr dari data trans sumary => ", data);

    if (error || (data && data.success === false)) {
      throw new InternalServerErrorException(error?.message || data?.message || "Gagal mengambil data summary");
    }

    return data;
  }
  
  async paymentReq(data: any, dataMesin: any) {
    const supabase = this.supabaseService.getClient();
    const midtrans = this.midtransService.getClient();

    const { count, error } = await supabase
      .from('transaksi')
      .select('mesin_id', { count: 'exact', head: true })
      .eq('mesin_id', dataMesin.id)

    // 1. Validasi Input (Singkat & Padat)
    if (!data.total || !data.kode || !data.items) {
      await this.sendMqtt(`generate/qr`, { success: false, message: "Data Tidak Lengkap.", data: {}}, 0);
      return;
    }

    // 2. Formatting Items
    const formattedItems = data.items.map((item: any) => ({
      id: item.produk_id,
      price: Number(item.harga),
      quantity: Number(item.qty),
      name: item.nama_produk,
    }));

    const formatedOrderID = `${data.kode.slice(0,8)}-${Date.now()}-${count}`;

    const midtransPayload = {
      payment_type: 'qris',
      transaction_details: {
        order_id: formatedOrderID,
        gross_amount: data.total,
      },
      qris: { acquirer: 'gopay' },
      item_details: formattedItems,
    };

  
    try {
    
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
       const { error: errorLogs } = await supabase
        .from("log_mesin")
        .insert({
          mesin_id: dataMesin?.id,
          tipe: 'pending',
          payload : {
            kode: dataMesin.kode,
            message: `Order Berhasil Dibuat ${result.order_id}`,
            waktu: new Date(Date.now()).toISOString(),
          }
        })
      if (errorLogs) console.log(errorLogs);
      await this.sendMqtt(`generate/qr`, payload, 0);

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
        data: {}
      };
      
      await this.sendMqtt(`generate/qr`, payload, 0);
    }
  }
    
  async updateStatusTransaksi(data: any) {
    const supabase = this.supabaseService.getClient();
    const { order_id: orderId, transaction_id: transactionId, transaction_status: transactionStatus, fraud_status: fraudStatus } = data;

    if (transactionStatus === 'pending') {
      return { success: true, message: 'Status masih pending, abaikan.' };
    }

    if (fraudStatus && fraudStatus !== 'accept') {
          this.client.emit(`transaksi/status`, {
            success: false,
            message: "Transaksi terdeteksi fraud.",
            order_id: orderId,
            statusTransaksi: 'cancel'
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
        updated_at: new Date()
      })
      .eq("id", transactionId)
      .eq("order_id", orderId);

    // PENTING: Jika DB gagal, lempar error agar Midtrans melakukan RETRY
    if (errUpdateStatus) {
      throw new InternalServerErrorException(`Gagal Update DB: ${errUpdateStatus.message}`);
    }

    await this.sendMqtt(`transaksi/status`, { success: true, message: this.getFriendlyMessage(transactionStatus), order_id: orderId, statusTransaksi: transactionStatus }, 0);

    return { success: true, orderId };
  }

  async completeOrder(dataPayload: any, dataMesin: any) {
    const supabase = this.supabaseService.getClient();

    if(!dataPayload || !dataPayload.order_id || !dataPayload.status) {
      await this.sendMqtt(`transaksi/status`, { success: false, message: "Data Tidak Lengkap.", order_id: dataPayload?.order_id || null, statusTransaksi: 'failed'}, 0);
      return;
    }

    if(dataPayload.status != 'complete'){
        await this.sendMqtt(`transaksi/status`, { success: false, message: "Permintaan tidak dapat dilanjutkan.", order_id: dataPayload?.order_id || null, statusTransaksi: 'failed'}, 0);
        return;
    }

    const { data : dataOldTrans, error: errorOldTrans } = await supabase.from("transaksi").select("*").eq('order_id', dataPayload.order_id).single();
    
    if(errorOldTrans || !dataOldTrans){
      await this.sendMqtt(`transaksi/status`, { success: false, message: "Order tidak ditemukan.", order_id: dataPayload.order_id, statusTransaksi: 'failed'}, 0);
      return;
    }

    if(dataOldTrans.status_pembayaran != 'settlement' || dataOldTrans.status != 'process'){
      await this.sendMqtt(`transaksi/status`, { success: false, message: "Status Tidak bisa diubah.", order_id: dataPayload.order_id, statusTransaksi: 'failed'}, 0);
      return;
    }


    const { data, error } = await supabase.rpc('complete_transaction', {
      p_order_id: dataPayload.order_id,
      p_mesin_id: dataMesin.id,
    });

    if (error || !data?.success) {
      // console.log("errore => ",error);
      // console.log("datane => ",data);
      return this.sendMqtt(`transaksi/status`, {success: false, message: error?.message || "Kegagalan sistem."}, 0);
    }
    
    const payload = {
      success: true,
      message: "Berhasil menyelesaikan transaksi.",
      order_id: dataPayload.order_id,
      statusTransaksi: 'complete'
    };
    const { error: errorLogs } = await supabase
        .from("log_mesin")
        .insert({
          mesin_id: dataMesin?.id,
          tipe: dataPayload.status,
          payload : {
            kode: dataMesin.kode,
            message: `Mesin menyelesaikan order ${dataPayload.order_id}`,
            waktu: new Date(Date.now()).toISOString(),
          }
        })
    if (errorLogs) console.log(errorLogs);
    await this.sendMqtt(`transaksi/status`, payload, 0);
  }

  async cancelOrder( dataPayload: any, dataMesin: any) {
    const midtrans = this.midtransService.getClient();
    const supabase = this.supabaseService.getClient();
    
     if(!dataPayload || !dataPayload.order_id || !dataPayload.status) {
      await this.sendMqtt(`transaksi/status`, { success: false, message: "Data Tidak Lengkap.", order_id: dataPayload?.order_id || null, statusTransaksi: 'failed'}, 0);
      return;
    }

    if(dataPayload.status != 'cancel'){
        await this.sendMqtt(`transaksi/status`, { success: false, message: "Permintaan tidak dapat dilanjutkan.", order_id: dataPayload?.order_id || null, statusTransaksi: 'failed'}, 0);
        return;
    }

    const { data : dataOldTrans, error: errorOldTrans } = await supabase.from("transaksi").select("*").eq('order_id', dataPayload.order_id).single();
    
    if(errorOldTrans || !dataOldTrans){
      await this.sendMqtt(`transaksi/status`, { success: false, message: "Order tidak ditemukan.", order_id: dataPayload.order_id, statusTransaksi: 'failed'}, 0);
      return;
    }

    if(dataOldTrans.status_pembayaran != 'pending' || dataOldTrans.status != 'pending'){
      await this.sendMqtt(`transaksi/status`, { success: false, message: "Status Tidak bisa diubah.", order_id: dataPayload.order_id, statusTransaksi: 'failed'}, 0);
      return;
    }

    try {
      await midtrans.transaction.cancel(dataPayload.order_id);
    } catch (err: any) {
      const payload = {
        success: false,
        message: err.ApiResponse?.status_message || err.message || "Gagal membatalkan transaksi.",
        order_id: dataPayload.order_id,
        statusTransaksi: 'failed'
      };
      
      await this.sendMqtt(`transaksi/status`, payload, 0);
      

      return; 
    }

    const { error: errorLogs } = await supabase
        .from("log_mesin")
        .insert({
          mesin_id: dataMesin?.id,
          tipe: dataPayload.status,
          payload : {
            kode: dataMesin.kode,
            message: `Mesin Membatalkan order ${dataPayload.order_id}`,
            waktu: new Date(Date.now()).toISOString(),
          }
        })
    if (errorLogs) console.log(errorLogs);
  }

  async refundOrder( dataPayload: any, dataMesin: any) {
    const midtrans = this.midtransService.getClient();
    const supabase = this.supabaseService.getClient();

    if(!dataPayload || !dataPayload.order_id || !dataPayload.status) {
      await this.sendMqtt(`transaksi/status`, { success: false, message: "Data Tidak Lengkap.", order_id: dataPayload?.order_id || null, statusTransaksi: 'failed'}, 0);
      return;
    }

    if(dataPayload.status != 'refund'){
        await this.sendMqtt(`transaksi/status`, { success: false, message: "Permintaan tidak dapat dilanjutkan.", order_id: dataPayload?.order_id || null, statusTransaksi: 'failed'}, 0);
        return;
    }

    const { data : dataOldTrans, error: errorOldTrans } = await supabase.from("transaksi").select("*").eq('order_id', dataPayload.order_id).single();
    
    if(errorOldTrans || !dataOldTrans){
      await this.sendMqtt(`transaksi/status`, { success: false, message: "Order tidak ditemukan.", order_id: dataPayload.order_id, statusTransaksi: 'failed'}, 0);
      return;
    }

    if(dataOldTrans.status_pembayaran != 'settlement'){
      await this.sendMqtt(`transaksi/status`, { success: false, message: "Status Tidak bisa diubah.", order_id: dataPayload.order_id, statusTransaksi: 'failed'}, 0);
      return;
    }


    try{
      await midtrans.transaction.refund(dataPayload.order_id, { amount: dataPayload.total, reason: 'barang tidak jatuh' });
    }catch(err: any){
      const payload = {
        success: false,
        message: err.ApiResponse?.status_message || err.message || "Gagal mengembalikan dana.",
        order_id: dataPayload.order_id,
        statusTransaksi: 'failed'
      };
      
      await this.sendMqtt(`transaksi/status`, payload, 0);
      

      return; 
    }

    const { error: errorLogs } = await supabase
      .from("log_mesin")
      .insert({
        mesin_id: dataMesin?.id,
        tipe: dataPayload.status,
        payload : {
          kode: dataMesin.kode,
          message: `Mesin refund order ${dataPayload.order_id}`,
          waktu: new Date(Date.now()).toISOString(),
        }
      })
    if (errorLogs) console.log(errorLogs);
  }
}
