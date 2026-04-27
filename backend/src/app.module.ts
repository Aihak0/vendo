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
// import { ClientsModule, Transport } from '@nestjs/microservices';
import { MidtransModule } from './midtrans/midtrans.module';
import { TransaksiModule } from './transaksi/transaksi.module';
// import { MqttModule } from './mqtt/mqtt.module';
import { PergerakanStockModule } from './pergerakan_stock/pergerakan_stock.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TransaksiController } from './transaksi/transaksi.controller';
import { MqttModule } from './mqtt/mqtt.module';
import { TransaksiService } from './transaksi/transaksi.service';

@Module({
  imports: [ClientsModule.register([
      {
        name: 'MQTT_CLIENT',
        transport: Transport.MQTT,
        options: {
          url: 'mqtts://bc39c402663344478d41da67942456d4.s1.eu.hivemq.cloud:8883',
          username: 'okelah',
          password: 'Okelah12',
          protocol: 'mqtts',
          rejectUnauthorized: false,
        },
      },
    ]),
    SupabaseModule, AuthModule, ConfigModule.forRoot({
      isGlobal: true,
    }), ProdukModule, MesinModule, PesanModule, UserModule, MidtransModule, TransaksiModule, PergerakanStockModule, MqttModule,
  ],  
  controllers: [AppController, AuthController, ProdukController, TransaksiController],
  providers: [AppService, ProdukService, TransaksiService],
})
export class AppModule {}
