import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { Observable } from 'rxjs';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class MqttAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService, @Inject('HIVE_CLIENT') private client: ClientProxy,) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rpc = context.switchToRpc();
    const payload = rpc.getData(); // Mengambil payload dari MQTT
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

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
    const { data: mesin, error } = await this.supabaseService
      .getClient()
      .from('mesin')
      .select('id, kode, nama, lokasi, status')
      .eq('kode', kode)
      .eq('status', 'online') 
      .single();

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
