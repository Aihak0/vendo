import { Module } from '@nestjs/common';
import { MesinController } from './mesin.controller';
import { MesinService } from './mesin.service';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { MqttModule } from 'src/mqtt/mqtt.module';

@Module({
  imports: [SupabaseModule, MqttModule],
  controllers: [MesinController],
  providers: [MesinService]
})
export class MesinModule {}
