import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { Observable } from 'rxjs';
import { SupabaseService } from 'src/supabase/supabase.service';
import { MqttContext } from '@nestjs/microservices';

@Injectable()
export class MqttAuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService, @Inject('HIVE_CLIENT') private client: ClientProxy,) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const supabase = this.supabaseService.getClient();
    const rpc = context.switchToRpc();
    const payload = rpc.getData(); // Mengambil payload dari MQTT
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

    const mqttContext = rpc.getContext<MqttContext>();
    const topic = mqttContext.getTopic();

    console.log("data dari payload => ",data);
    
    // 1. Ambil ID Mesin dari payload (misal mesin kirim { "deviceId": "VM-001", ... })
    const kode = data.kode;

    if (!kode) {
       this.client.emit(`transaksi/status`, {
            success: false,
            message: "Autentikasi Gagal" ,
        });
      return false; 
    }

    // 2. Cek ke Database Supabase

    let query = supabase
      .from('mesin')
      .select('id, kode, nama, status')
      .eq('kode', kode)

    if (topic != "mesin/status") {
      query = query.eq('status', 'online');
    }

    const { data: mesin, error } = await query.single();
    console.log("mesin auth =>", mesin);
    console.log("mesin error auth emesin =>", error);
    if (error || !mesin) {
       this.client.emit(`transaksi/status`, {
            success: false,
            message: `Akses ditolak untuk mesin: ${kode}` ,
        });
      return false; 
    }

    const client = context.switchToRpc().getContext();
    client.mesin = mesin; 

    return true;
  }
}
