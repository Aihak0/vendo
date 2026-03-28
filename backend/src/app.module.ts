import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProdukController } from './produk/produk.controller';
import { ProdukService } from './produk/produk.service';
import { ProdukModule } from './produk/produk.module';
import { MesinModule } from './mesin/mesin.module';
import { PesanModule } from './pesan/pesan.module';
import { UserModule } from './user/user.module';
import { PergerakanStokModule } from './pergerakan_stok/pergerakan_stok.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MidtransModule } from './midtrans/midtrans.module';
import { TransaksiModule } from './transaksi/transaksi.module';
import { MqttModule } from './mqtt/mqtt.module';

@Module({
  imports: [
    SupabaseModule, AuthModule, ConfigModule.forRoot({
      isGlobal: true,
    }), ProdukModule, MesinModule, PesanModule, UserModule, PergerakanStokModule, MidtransModule, TransaksiModule, MqttModule,],
  
  controllers: [AppController, AuthController, ProdukController],
  providers: [AppService, ProdukService,],
})
export class AppModule {}
