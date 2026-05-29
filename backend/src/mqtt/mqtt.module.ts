import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
    ClientsModule.register([
      {
        name: 'HIVE_CLIENT',
        transport: Transport.MQTT,
        options: {
          url: 'mqtts://okelah:Okelah12@bc39c402663344478d41da67942456d4.s1.eu.hivemq.cloud:8883',
          // Tambahkan ini untuk kestabilan koneksi HiveMQ Cloud
          connectTimeout: 10000,
          reconnectPeriod: 5000,
          clientId: `nest_vm_backend_${Math.random().toString(16).substring(2, 10)}`,
          tls: {
            rejectUnauthorized: false, // Penting agar tidak gagal saat validasi sertifikat
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MqttModule {}
