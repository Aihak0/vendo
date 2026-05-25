import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ClientsModule, Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   app.enableCors({
    origin: true,
    credentials: true,
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: 'mqtts://VendingMachine:Vmachine99%23@7c4648a14a1a4a1d889bf7e981418020.s1.eu.hivemq.cloud:8883',
      username: 'VendingMachine',
      password: 'Vmachine99#',
      rejectUnauthorized: false,  // ← untuk debugging TLS dulu
    },
  });

  await app.startAllMicroservices()
    .then(() => console.log('✅ MQTT connected and listening...'))
    .catch((err) => console.error('❌ MQTT Connection failed:', err));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
