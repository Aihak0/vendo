import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express'; // Pastikan import ini ada

@Injectable() // <--- BIARKAN SINGLETON (Hapus scope: Scope.REQUEST)
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not defined');
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(30000),
          });
        },
      },
    });
  }

  async onModuleInit() {
    await this.waitForConnection(); // <--- INI AKAN BERJALAN NORMAL SEKARANG
  }

  // ... Fungsi waitForConnection() dan delay() milikmu tetap di sini (tidak diubah) ...
  private async waitForConnection(retries = 5, delayMs = 3000) { /* kode kamu */ }
  private delay(ms: number) { /* kode kamu */ }


  // 1. Method bawaan untuk query umum/admin (Singleton)
  getClient(): SupabaseClient {
    return this.client;
  }

  // 2. TAMBAHKAN METHOD INI: Khusus untuk menghandle request spesifik user (Safe Session)
  getClientForUser(request: Request): SupabaseClient {
    const authHeader = request.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    // Buat client cadangan yang terisolasi khusus untuk user ini saja
    const userClient = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!, // Sebaiknya gunakan ANON_KEY untuk context user
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    if (token) {
      userClient.auth.setSession({
        access_token: token,
        refresh_token: token,
      });
    }

    return userClient;
  }
}