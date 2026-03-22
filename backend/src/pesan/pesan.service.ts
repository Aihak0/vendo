import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class PesanService {
    constructor(private supabaseService: SupabaseService){}

    async add(body: any){
        const supabase = this.supabaseService.getClient();

        const { data: dataInsert, error: errorinsert } = await supabase
        .from("pesan")
        .insert(
            body
        ).select()
        .single();

        if (errorinsert) throw new BadRequestException(errorinsert.message);
        if (dataInsert.success == false) throw new InternalServerErrorException("Gagal memasukkan data pesan");

        return dataInsert;
    }
}
