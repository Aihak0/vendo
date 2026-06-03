import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService} from '@nestjs/config';
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
import { JwtModule } from '@nestjs/jwt';
import { MinioService } from './minio/minio.service';
import { MinioModule } from './minio/minio.module';

@Module({
  imports: [ClientsModule.registerAsync([
      {
	
        name: 'MQTT_CLIENT',
	imports: [ConfigModule], // Memastikan ConfigService bisa di-inject
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const mqttUser = configService.get<string>('MQTT_USER');
          const mqttPass = configService.get<string>('MQTT_PASSWORD');
          const mqttHost = configService.get<string>('MQTT_HOST');
	  const mqttPort = configService.get<string>('MQTT_PORT');
          return {
            transport: Transport.MQTT,
            options: {
              // Menyusun URL MQTT dengan aman
              url: `mqtt://${mqttHost}:${mqttPort}`,
              username: mqttUser!,
              password: mqttPass,
              rejectUnauthorized: false,
            },
          };
        }
      },
    ]),
    SupabaseModule, AuthModule, ConfigModule.forRoot({
      isGlobal: true,
    }), ProdukModule, MesinModule, PesanModule, UserModule, MidtransModule, TransaksiModule, PergerakanStockModule, MqttModule, DashboardModule, TaskModule, DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // Tambahkan '!' di ujung untuk memastikan ke TS kalau nilai ini pasti ada/tidak undefined
        secret: configService.get<string>('JWT_SECRET')!, 
        signOptions: { 
          // Tambahkan 'as any' di ujung untuk meredam error Type Mismatch
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any
        },
      }),
    }),
    MinioModule
  ],  
  controllers: [AppController, AuthController, ProdukController, TransaksiController],
  providers: [AppService, ProdukService, TransaksiService, MinioService],
})
export class AppModule {}
