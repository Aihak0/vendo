import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { Observable } from 'rxjs';
import { SupabaseService } from 'src/supabase/supabase.service';
import { MqttContext, RpcException } from '@nestjs/microservices';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class MqttAuthGuard implements CanActivate {
  constructor(private databaseService: DatabaseService, @Inject('HIVE_CLIENT') private client: ClientProxy,) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const db = this.databaseService.getClient();
    const rpc = context.switchToRpc();
    const payload = rpc.getData(); // Mengambil payload dari MQTT
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

    const mqttContext = rpc.getContext<MqttContext>();
    const topic = mqttContext.getTopic();

    console.log("data dari payload => ",data);
    
    // 1. Ambil ID Mesin dari payload (misal mesin kirim { "deviceId": "VM-001", ... })
    const kode = data.kode;
    console.log("kode mesin => ", kode);

    if (!kode) {
       this.client.emit(`transaksi/status`, {
            success: false,
            message: "Autentikasi Gagal" ,
        });
      return false; 
    }
    
  try {
    const queryParams: any[] = [kode];
    let query = `SELECT id, kode, status FROM mesin WHERE kode = $1`;

    if (topic !== "mesin/status") {
      query += ` AND status = 'online'`;
    }

    // Eksekusi query dengan parameter yang aman
    const mesin = await db.query(query, [kode]);
    if (mesin.rows.length == 0) {
      // Lemparkan RpcException dengan pesan kustom Anda
      throw new RpcException('mesin online tidak ditemukan');
    }

    const client = context.switchToRpc().getContext();
    client.mesin = mesin.rows[0]; 



    return true;

  } catch (error: any) {
    console.log(error)
     this.client.emit(`transaksi/status`, {
          success: false,
          message: error.message || `Akses ditolak untuk mesin: ${kode}` ,
      });
    return false; 

  }

    
  }
}
