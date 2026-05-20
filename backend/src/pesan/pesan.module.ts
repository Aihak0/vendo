import { Module } from '@nestjs/common';
import { PesanController } from './pesan.controller';
import { PesanService } from './pesan.service';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [SupabaseModule], 
  controllers: [PesanController],
  providers: [PesanService]
})
export class PesanModule {}
