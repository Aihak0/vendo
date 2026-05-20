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
      url: 'mqtt://10.10.8.170:1883',
      username: 'mqttuser',
      password: '123'
    },
  });

  await app.startAllMicroservices()
    .then(() => console.log('✅ MQTT connected and listening...'))
    .catch((err) => console.error('❌ MQTT Connection failed:', err));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
