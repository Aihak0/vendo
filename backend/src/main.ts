import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {ClientsModule, Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Ambil instance ConfigService dari AppModule
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 2. Hubungkan Microservice menggunakan variabel configService (tanpa 'this')
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      // Menggunakan host langsung dari env (contoh: 'mqtt://localhost:1883' atau host HiveMQ Cloud)
      url: `mqtt://${configService.get<string>('MQTT_HOST')}:${configService.get<string>('MQTT_PORT')}`, 
      username: configService.get<string>('MQTT_USER')!,
      password: configService.get<string>('MQTT_PASSWORD')!,
      // Opsional: Tambahkan clientId dan timeout seperti di modul sebelumnya jika diperlukan
      connectTimeout: 10000,
      reconnectPeriod: 5000,
    },
  });

  // 3. Jalankan semua microservice
  await app.startAllMicroservices()
    .then(() => console.log('✅ MQTT connected and listening...'))
    .catch((err) => console.error('❌ MQTT Connection failed:', err));

  // 4. Jalankan HTTP server
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 HTTP Application is running on: http://localhost:${port}`);
}
bootstrap();
