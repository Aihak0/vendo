import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { MqttRecordBuilder } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class MesinService {
    constructor(private supabaseService: SupabaseService,
       @Inject('HIVE_CLIENT') private client: ClientProxy,
    ){}

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
    async findAll(page: number, limit: number, sortAsc: boolean, sortKey?: string, search?: string, status?: string) {
        const supabase = this.supabaseService.getClient();
        try{

          const from = (page -  1) * limit;
          const to = from + limit - 1;
  
          let query = supabase
          .from("mesin")
          .select("*, slot(*)")
          .range(from, to)
          
          if (status && status != "all") {
            console.log("filter status => ", status);
            query = query.eq("status", status);
          }
          if (sortKey){
            query = query.order(sortKey, { ascending: sortAsc });
          }else{
            query = query.order('created_at', { ascending: false });
          }
          if (search) {
            query = query.ilike('nama', `%${search}%`);
          }
      
          const { data, error } = await query;
      
          if (error) {
            throw new InternalServerErrorException(error.message);
          }
  
          const { data: stats, error:errorStats, count } = await supabase
          .from('mesin')
          .select(`
            status
          `, {count: "exact"});
  
          let countOnline, countOffline, countMaintenance;
          if(!errorStats){
            countOnline = stats.filter(u => u.status === 'online').length;
            countOffline = stats.filter(u => u.status === 'offline').length;
            countMaintenance = stats.filter(u => u.status === 'maintenance').length;
          }else{
            countOnline = 0;
            countOffline = 0;
            countMaintenance = 0;
          }
  
          return {
            success: true,
            code: 200,
            data,
            metadata: {
              totalData: count,
              totalDataOnline: countOnline,
              totalDataOffline: countOffline,
              totalDataMaintenance: countMaintenance, 
              currentPage: page,
              totalPages: Math.ceil((count ?? 0) / limit),
              pageSize: limit,
            }
          };
        }catch(err: any){
          return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
        }

    }

     async findAllLogs(page: number, limit: number, search?: string) {
      const supabase = this.supabaseService.getClient();
      try{

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        let query = supabase
          .from('log_mesin')
          .select(`*, mesin!inner(*)`, { count: 'exact' })
          .range(from, to)
          .order('created_at', { ascending: false }); // Urutkan dari yang terbaru
    
        // Jika ada parameter search, filter berdasarkan nama produk
        if (search) {
          query = query.ilike('mesin.nama', `%${search}%`);
        }
    
        const { data, error, count } = await query;
  
        const { data: stats, error:errorStats } = await supabase
          .from('log_mesin')
          .select(`
            tipe
          `);
  
          let countInfo, countSuccess, countWarning, countError, countDebug;
        if(!errorStats){
          countInfo = stats.filter(u => u.tipe === 'info').length;
          countSuccess = stats.filter(u => u.tipe === 'success').length;
          countWarning = stats.filter(u => u.tipe === 'warning').length;
          countError = stats.filter(u => u.tipe === 'error').length;
          countDebug = stats.filter(u => u.tipe === 'debug').length;
        }else{
          countInfo = 0;
          countSuccess = 0;
          countWarning = 0;
          countError = 0;
          countDebug = 0;
        }
        if (error) {
          // Gunakan InternalServerErrorException karena ini biasanya masalah query/database
          throw new InternalServerErrorException(error.message);
        }
        
        return {
          success: true, 
          code: 200,
          data,
          metadata: {
            totalData: count,
            awalEntri: from + 1,
            akhirEntri: to + 1,
            totalDataInfo: countInfo,
            totalDataSuccess: countSuccess,
            totalDataWarning: countWarning,
            totalDataError: countError,
            totalDataDebug: countDebug,
            currentPage: page,
            totalPages: Math.ceil((count ?? 0) / limit),
            pageSize: limit,
          }
        };
      }catch(err: any){
        return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
      }
    }
    async add(body: any){
      const supabase = this.supabaseService.getClient();
      try{

        const {nama, rows, total_slot, latitude, longitude, desa, kecamatan, kabupaten, provinsi, negara, kode_pos, slots } = body;
  
        const { data: dataInsert, error: dbError } = await supabase
        .rpc('tambah_mesin_dengan_slot',
          {
            d_nama: nama, 
            d_row: rows,
            d_total_slot: total_slot,
            d_latitude: latitude,
            d_longitude: longitude,
            d_desa: desa,
            d_kecamatan: kecamatan,
            d_kabupaten: kabupaten,
            d_provinsi: provinsi,
            d_negara: negara,
            d_kode_pos: kode_pos,
            d_data_slot: slots
          }
        );
  
        if (dbError) throw new BadRequestException(dbError.message);
        if (dataInsert.success == false) throw new InternalServerErrorException(dataInsert.error);
  
        return {success: true, message: "Berhasil menambah data mesin", code: 200};
      }catch(err: any){
        return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
      }
    }
    async update(id: string, body: any) {

      const supabase = this.supabaseService.getClient();
      // 1. Ambil data lama
      try{

        const { data: oldMesin } = await supabase.from("mesin").select("*").eq("id", id).single();
        const { data: oldSlots } = await supabase.from("slot").select("*").eq("mesin_id", id);
  
        let itemToUpsert: any[] = [];
        
        // 2. Tentukan mana yang mau disimpan (Upsert)
        body.slots.forEach((s) => {
          s.col.forEach((item) => {
            const oldSlot = oldSlots?.find(old => old.kode === item.kode);
  
            // Cek apakah data baru berbeda dengan data lama (Deep Comparison sederhana)
            const isChanged = !oldSlot || oldSlot.produk_id !== item.produk_id || oldSlot.stock !== item.stock ||
                              oldSlot.metadata?.span !== item.span || 
                              JSON.stringify(oldSlot.metadata?.gabungan) !== JSON.stringify(item.gabungan);
  
            if (isChanged) {
              itemToUpsert.push({
                kode: item.kode,
                mesin_id: id,
                produk_id: item.produk_id || null,
                stock: item.stock || 0,
                metadata: {
                  span: item.span,
                  gabungan: item.gabungan,
                  row_number: s.row_number,
                  col_number: item.col_number,
                }
              });
            }
          });
        });
  
        // 3. Tentukan mana yang mau dihapus
        const incomingKodes = body.slots.flatMap(s => s.col.map(item => item.kode));
        const itemsToDelete = oldSlots?.filter(old => !incomingKodes.includes(old.kode)) || [];
  
        // --- EKSEKUSI DATABASE ---
  
        // A. Upsert (Gunakan satu kali panggil untuk semua data, jangan di .map)
        if (itemToUpsert.length > 0) {
          const { data: dataUpsert, error: errUpsert } = await supabase
            .from("slot")
            .upsert(itemToUpsert, { onConflict: 'mesin_id, kode' }); // Gunakan koma, bukan &&
  
          if (errUpsert) throw new InternalServerErrorException("errUpsert.message");
        }
  
        // B. Delete
        if (itemsToDelete.length > 0) {
          const deleteIds = itemsToDelete.map(item => item.id);
          const { error: errDel } = await supabase.from('slot').delete().in('id', deleteIds);
          if (errDel) throw new InternalServerErrorException(errDel.message);
  
        }
  
        // C. Update Mesin
        const isMesinChanged = 
          (body.nama !== undefined && body.nama !== oldMesin.nama) || 
          (body.lokasi !== undefined && body.lokasi !== oldMesin.lokasi) || 
          (body.latitude !== undefined && body.latitude !== oldMesin.latitude) || 
          (body.longitude !== undefined && body.longitude !== oldMesin.longitude) || 
          (body.desa !== undefined && body.desa !== oldMesin.desa) || 
          (body.kecamatan !== undefined && body.kecamatan !== oldMesin.desa) || 
          (body.kabupaten !== undefined && body.kabupaten !== oldMesin.desa) || 
          (body.negara !== undefined && body.negara !== oldMesin.desa) || 
          (body.provinsi !== undefined && body.provinsi !== oldMesin.provinsi) || 
          (body.kode_pos !== undefined && body.kode_pos !== oldMesin.kode_pos) || 
          (body.row_slot !== undefined && body.row_slot !== oldMesin.row_slot) || 
          (body.total_slot !== undefined && body.total_slot !== oldMesin.total_slot);
  
        if (isMesinChanged) {
          const { data: dataUpdateMesin, error: errUpdateMesin } = await supabase
            .from("mesin")
            .update({
              nama: body.nama,
              lokasi: body.lokasi,
              row_slot: body.row_slot,
              total_slot: body.total_slot,
              latitude: body.latitude,
              longitude: body.longitude,
              desa: body.desa,
              kecamatan: body.kecamatan,
              kabupaten: body.kabupaten,
              provinsi: body.provinsi,
              negara: body.negara,
              kode_pos: body.kode_pos,
              updated_at: new Date(Date.now()).toISOString()
            })
            .select("*, slot(produk_id, kode, stock, metadata, produk(nama, harga, img_url))")
            .eq("id", id)
            .single();
  
            console.log("eror update mesin ->",errUpdateMesin)
          if (errUpdateMesin) throw new InternalServerErrorException(errUpdateMesin.message);
  
          await this.sendMqtt(`mesin/${dataUpdateMesin.kode}/detail`, { dataUpdateMesin }, 1);
        }

        return { success: true, message: "Berhasil mengubah data", code: 200 };
      }catch(err: any){
        return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
      }
    }

    async delete(body: { id: string[] }) {
      const supabase = this.supabaseService.getClient();
      try{

        if (!body.id || body.id.length === 0) {
          throw new BadRequestException('ID produk tidak boleh kosong');
        }
    
        // Gunakan .in() untuk menghapus semua ID dalam satu array sekaligus
          const { error } = await supabase
            .from("mesin")
            .delete()
            .in('id', body.id); // Menghapus baris yang ID-nya ada di dalam array body.id
    
        if (error) {
          throw new BadRequestException(error.message);
        }
    
        return { success: true, message: 'Mesin berhasil dihapus', code: 200 };
      }catch(err:any){
        return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
      }
    }

    async updateStatus(status: string, kode: string){
      const supabase = this.supabaseService.getClient();

      try{
        const { data: oldMesin, error: errOldMesin } = await supabase
        .from("mesin")
        .select("status")
        .eq("kode", kode)
        .single();

        if(errOldMesin) throw new InternalServerErrorException(errOldMesin.message, "Gagal memvalidasi data mohon coba lagi beberapa saat");

        if(oldMesin.status === status) throw new BadRequestException("Permintaan tidak bisa dilanjutkan");

        const { data: dataMesin,error: errorUpdate } = await supabase
          .from("mesin")
          .update({ status: status })
          .eq("kode", kode)
          .select("*, slot(produk_id, kode, stock, metadata, produk(nama, harga, img_url))")
          .single();
        if (errorUpdate) {
          throw new InternalServerErrorException(errorUpdate?.message || "Gagal memperbarui status mesin");
        }
        let messageLog = "";
        if(status === "online"){
          messageLog = `Mesin ${dataMesin?.nama} sekarang Online`;
          await this.sendMqtt(`mesin/${kode}/detail`, { dataMesin }, 1);
          console.log("kekerem ora seh");
        }else if(status === "offline"){
          messageLog = `Mesin ${dataMesin?.nama} sekarang Offline`;
        } else if(status === "maintenance"){
          messageLog = `Mesin ${dataMesin?.nama} sedang dalam perawatan`;
        }
          const { error: errorLogs } = await supabase
          .from("log_mesin")
          .insert({
            mesin_id: dataMesin?.id,
            tipe: status,
            payload : {
              kode: kode,
              message: messageLog,
              waktu: new Date(Date.now()).toISOString(),
            }
          })
          if (errorLogs) {
            throw new InternalServerErrorException(errorLogs?.message || "Gagal memperbarui status mesin");
          }
      }catch(err: any){
        return;
      }

      
    }
    async updateStockSlot(idMesin: string, dataSlot: any[]){
      const supabase = this.supabaseService.getClient();
      try{
        if(!dataSlot || !idMesin) throw new NotFoundException("data tidak lengkap");
        
        const { data: dataMesin, error: errMesin } = await supabase
        .from("mesin")
        .select("*")
        .eq("id", idMesin)
        .single();
        
        if(errMesin) throw new InternalServerErrorException("Gagal Mengambil data mesin");

        if(dataMesin.status != 'maintenance') throw new BadRequestException("Perubahan tidak diperbolehkan");

        const { error: errorUpdate } = await supabase.rpc('bulk_add_stock', {
          d_items: dataSlot,
          p_mesin_id: idMesin 
        });

        if (errorUpdate) {
          throw new InternalServerErrorException(errorUpdate.message || "Gagal memperbarui stock");
        }
      
        return { success: true, message: "Berhasil mengubah stock", code: 200};
      }catch(err: any){
        return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
      }
    }
}
