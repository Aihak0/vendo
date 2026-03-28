import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
    ClientsModule.register([
      {
        name: 'HIVE_CLIENT',
        transport: Transport.MQTT,
        options: {
          url: 'mqtts://bc39c402663344478d41da67942456d4.s1.eu.hivemq.cloud:8883',
          username: 'okelah',
          password: 'Okelah12',
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MqttModule {}
