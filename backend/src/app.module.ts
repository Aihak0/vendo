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
import { DashboardModule } from './dashboard/dashboard.module';
import { TaskModule } from './task/task.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [ClientsModule.register([
      {
        name: 'MQTT_CLIENT',
        transport: Transport.MQTT,
        options: {
          url: 'mqtt://10.10.8.170:1883',
          username: 'mqttuser',
          password: '123',
          rejectUnauthorized: false,
        },
      },
    ]),
    SupabaseModule, AuthModule, ConfigModule.forRoot({
      isGlobal: true,
    }), ProdukModule, MesinModule, PesanModule, UserModule, MidtransModule, TransaksiModule, PergerakanStockModule, MqttModule, DashboardModule, TaskModule, DatabaseModule,
  ],  
  controllers: [AppController, AuthController, ProdukController, TransaksiController],
  providers: [AppService, ProdukService, TransaksiService],
})
export class AppModule {}
