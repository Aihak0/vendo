import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class PesanService {
    constructor(private supabaseService: SupabaseService){}

    async findAll(page: number, limit: number, sortAsc: boolean, sortKey?: string, search?: string ) {
        const supabase = this.supabaseService.getClient();
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        try{
            let query = supabase
                .from('pesan')
                .select(`*`)
                .range(from, to)

            if (sortKey){
                query = query.order(sortKey, { ascending: sortAsc });
            }else{
                query = query.order('created_at', { ascending: false });
                }
            if (search) {
                const searchQuery = `%${search}%`;
                query = query.or(`nama.ilike.${searchQuery},email.ilike.${searchQuery},nomor_telepon.ilike.${searchQuery},keperluan.ilike.${searchQuery},pesan.ilike.${searchQuery}`);
            }
        
            const { data, error } = await query;
        
            const { count } = await supabase
                .from('pesan')
                .select(`
                *
                `, { count: 'exact' });

            if (error) {
                throw new InternalServerErrorException(error.message);
            }
                
            return {
                data,
                metadata: {
                    totalData: count,
                    currentPage: Number(page),
                    totalPages: Math.ceil((count ?? 0) / limit),
                    pageSize: limit,
                }
            };
        }catch(err: any){
            return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status}
        }
        
    }

    async add(body: any){
        const supabase = this.supabaseService.getClient();
        try{
            const { data: dataInsert, error: errorinsert } = await supabase
            .from("pesan")
            .insert(
                body
            ).select()
            .single();
    
            if (errorinsert) throw new BadRequestException(errorinsert.message);

            return {success: true, message: "berhasil Mengaktifkan produk", code: 200};
        }catch(err: any){
            return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status}
        }
    }
}
