import { Module } from '@nestjs/common';
import { MesinController } from './mesin.controller';
import { MesinService } from './mesin.service';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [MesinController],
  providers: [MesinService]
})
export class MesinModule {}
