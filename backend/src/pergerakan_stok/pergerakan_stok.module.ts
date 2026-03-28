import { Module } from '@nestjs/common';
import { PergerakanStokService } from './pergerakan_stok.service';
import { PergerakanStokController } from './pergerakan_stok.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [PergerakanStokService],
  controllers: [PergerakanStokController]
})
export class PergerakanStokModule {}
