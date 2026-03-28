import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;
  

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not defined');
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
          },
          global: {
            fetch: (url, options) => {
              return fetch(url, { 
                ...options, 
                // Tambahne signal timeout manual yen perlu, 
                // tapi secara default Supabase wis cukup oke.
              });
            },
          },
        });
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}