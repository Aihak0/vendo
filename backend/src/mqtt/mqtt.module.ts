import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
    ClientsModule.register([
      {
        name: 'HIVE_CLIENT',
        transport: Transport.MQTT,
        options: {
          url: 'mqtt://10.10.8.170:1883',
          username: 'mqttuser',
          password: '123',
          rejectUnauthorized: false,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MqttModule {}
