import { Module } from '@nestjs/common';
import { TransaksiService } from './transaksi.service';
import { TransaksiController } from './transaksi.controller';
import { MidtransModule } from 'src/midtrans/midtrans.module';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  providers: [TransaksiService],
  controllers: [TransaksiController],
  imports: [MidtransModule, MqttModule, SupabaseModule]
})
export class TransaksiModule {}
