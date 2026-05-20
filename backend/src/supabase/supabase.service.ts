import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
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
    await this.waitForConnection();
  }

  private async waitForConnection(retries = 5, delayMs = 3000) {
    for (let i = 1; i <= retries; i++) {
      try {
        // Ping ringan ke Supabase
        const { error } = await this.client.from('user_profiles').select('*').limit(1);
;
        
        // Ignore "table not found", yang penting koneksi berhasil
        if (!error || error.code === 'PGRST116' || error.code === '42P01') {
          this.logger.log('Supabase connected successfully');
          return;
        }

        throw error;
      } catch (err: any) {
        this.logger.warn(`Supabase connection attempt ${i}/${retries} failed: ${err.message}`);
        if (i < retries) await this.delay(delayMs);
      }
    }
    this.logger.error('Could not connect to Supabase after all retries — continuing anyway');
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}