import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class PergerakanStokService {
    constructor(private supabaseService: SupabaseService){}
    
    async findAll(tipe_perubahan?: string) {
        const supabase = this.supabaseService.getClient();
    
        let query = supabase
        .from('pergerakan_stok')
        .select('*')
        .order('created_at', { ascending: false }); // Urutkan dari yang terbaru
    
        // Jika ada parameter search, filter berdasarkan nama produk
        if (tipe_perubahan) {
        query = query.eq('tipe_perubahan', `%${tipe_perubahan}%`);
        }
    
        const { data, error } = await query;
    
        if (error) {
        // Gunakan InternalServerErrorException karena ini biasanya masalah query/database
        throw new InternalServerErrorException(error.message);
        }
        
        return data;
    }

    async add(body: any){
            const supabase = this.supabaseService.getClient();
    
        // 3. Simpan Metadata ke Database
        const { data, error: dbError } = await supabase
            .from('produk') // Ganti dengan nama tabel Anda
            .insert(body)
            .select();
    
        if (dbError) throw new BadRequestException(dbError.message);
    
        return data;
        }
}
