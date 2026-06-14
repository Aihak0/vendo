import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config'; // Pastikan ConfigModule juga di-import jika diperlukan

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'HIVE_CLIENT',
        imports: [ConfigModule], // Memastikan ConfigService bisa di-inject
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const mqttUser = configService.get<string>('MQTT_USER')!;
          const mqttPass = configService.get<string>('MQTT_PASSWORD')!;
          const mqttHost = configService.get<string>('MQTT_HOST')!; // Sediakan default jika perlu
	        const mqttPort = configService.get<string>('MQTT_PORT')!; 
          return {
            transport: Transport.MQTT,
            options: {
              // Menyusun URL MQTT dengan aman
              url: `mqtt://${mqttUser}:${mqttPass}@${mqttHost}:${mqttPort}`,
              connectTimeout: 10000,
              reconnectPeriod: 5000,
              clientId: `nest_vm_backend_${Math.random().toString(16).substring(2, 10)}`,
            },
          };
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MqttModule {}
