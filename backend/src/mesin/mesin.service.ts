import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { metadata } from 'reflect-metadata/no-conflict';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class MesinService {
    constructor(private supabaseService: SupabaseService){}
    async findAll(search?: string){
        const supabase = this.supabaseService.getClient();

        let query = supabase
        .from("mesin")
        .select("*, slot(*)")
        .order('created_at', { ascending: false }); // Urutkan dari yang terbaru
        
        // Jika ada parameter search, filter berdasarkan nama produk
        if (search) {
          query = query.ilike('nama', `%${search}%`);
        }
    
        const { data, error } = await query;
    
        if (error) {
          throw new InternalServerErrorException(error.message);
        }
        
        return data;

    }
    async add(body: any){
         const supabase = this.supabaseService.getClient();
    
        const { data: dataInsert, error: dbError } = await supabase
          .rpc('tambah_mesin_dengan_slot',
            {
              d_nama: body.nama, 
              d_lokasi: body.lokasi,
              d_row: body.rows,
              d_total_slot: body.total_slot,
              d_data_slot: body.slots
            }
          );

        if (dbError) throw new BadRequestException(dbError.message);
        if (dataInsert.success == false) throw new InternalServerErrorException(dataInsert.error);
    
        return dataInsert;
    }
    async update(id: string, body: any) {
      const supabase = this.supabaseService.getClient();
      // 1. Ambil data lama
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
        (body.row_slot !== undefined && body.row_slot !== oldMesin.row_slot) || 
        (body.total_slot !== undefined && body.total_slot !== oldMesin.total_slot);

      if (isMesinChanged) {
        const { error: errUpdateMesin } = await supabase
          .from("mesin")
          .update({
            nama: body.nama,
            lokasi: body.lokasi,
            row_slot: body.row_slot,
            total_slot: body.total_slot,
            updated_at: Date.now()
          })
          .eq("id", id);

        if (errUpdateMesin) throw new InternalServerErrorException(errUpdateMesin.message);
      }

      return { success: true, message: "Berhasil mengubah data" };
    }

    async delete(body: { id: string[] }) {
      const supabase = this.supabaseService.getClient();
  
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
  
      return { message: 'Produk berhasil dihapus' };
    }
}
