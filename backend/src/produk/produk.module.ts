import { Module } from '@nestjs/common';
import { ProdukController } from './produk.controller';
import { ProdukService } from './produk.service';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
    imports: [SupabaseModule], 
    controllers: [ProdukController],
    providers: [ProdukService],
})
export class ProdukModule {}
