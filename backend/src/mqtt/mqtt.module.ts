import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
    ClientsModule.register([
      {
        name: 'HIVE_CLIENT',
        transport: Transport.MQTT,
        options: {
          url: 'mqtts://VendingMachine:Vmachine99%23@7c4648a14a1a4a1d889bf7e981418020.s1.eu.hivemq.cloud:8883',
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
