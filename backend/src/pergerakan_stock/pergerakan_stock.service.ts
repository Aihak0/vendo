import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class PergerakanStockService {
    constructor(private supabaseService: SupabaseService){}

    async findAll(page: number, limit: number, sortAsc: boolean, sortKey?: string, search?: string, tipePerubahan?: string) {
        const supabase = this.supabaseService.getClient();
        try{
          const from = (page - 1) * limit;
          const to = from + limit - 1;
          let query = supabase
            .from('pergerakan_stok')
            .select(`*, produk(nama, harga, img_url)`)
            .range(from, to)

          if(tipePerubahan && tipePerubahan != "all"){
            query = query.eq("tipe_perubahan", tipePerubahan);
          }
          if (sortKey){
              query = query.order(sortKey, { ascending: sortAsc });
          }else{
            query = query.order('created_at', { ascending: false });
          }
          if (search) {
              query = query.or(`nama_mesin.ilike.%${search}%,nama_produk.ilike.%${search}%,kode_slot.ilike.%${search}%`);
          }
      
          const { data, error } = await query;
      
          const { data: stats, error: errorStats, count } = await supabase
            .from('pergerakan_stok')
            .select(`
              tipe_perubahan
            `, { count: 'exact' });
      
            let countPenjualan;
            let countRestock;
            let countAdjustment;
          if(!errorStats){
            countPenjualan = stats.filter(u => u.tipe_perubahan === 'sale').length;
            countRestock = stats.filter(u => u.tipe_perubahan === 'restock').length;
            countAdjustment = stats.filter(u => u.tipe_perubahan === 'adjust').length;
          }else{
            countPenjualan=0;
            countRestock=0;
            countAdjustment=0;
          }
          if (error) {
            throw new InternalServerErrorException(error.message);
          }
          
          return {
              success: true,
              data,
              metadata: {
                  totalData: count,
                  totalDataPenjualan: countPenjualan,
                  totalDataRestock: countRestock,
                  totalDataAdjustment: countAdjustment,
                  currentPage: page,
                  totalPages: Math.ceil((count ?? 0) / limit),
                  pageSize: limit,
              }
          };
        }catch(err: any){
          return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status}
        }
      } 
}
