import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger('DatabaseService');

  constructor(private configService: ConfigService) {
    // Inisialisasi pool koneksi menggunakan data dari .env Anda
    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST') || '192.168.1.6',
      port: this.configService.get<number>('DB_PORT') || 5432,
      user: this.configService.get<string>('DB_USERNAME') || 'ok',
      password: this.configService.get<string>('DB_PASSWORD') || 'ok',
      database: this.configService.get<string>('DB_DATABASE') || 'vending_machine',
      max: 20, // Batas maksimal koneksi yang terbuka bersamaan
      idleTimeoutMillis: 30000, // Tutup koneksi otomatis jika idle 30 detik
    });
  }

  // Tes koneksi saat aplikasi NestJS pertama kali dinyalakan
  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      this.logger.log('✅ Berhasil terhubung ke Database PostgreSQL VM 3');
      client.release(); // Kembalikan koneksi ke pool
    } catch (error: any) {
     this.logger.log('❌ Gagal terhubung ke Database VM 3:', error.message);
    }
  }

  // Sediakan fungsi getClient() seperti yang Anda inginkan
  getClient(): Pool {
    return this.pool;
  }

  async query<T extends QueryResultRow = any>(
    text: string, 
    values?: any[]
  ): Promise<QueryResult<T>> {
    try {
      return await this.pool.query<T>(text, values);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Helper untuk pagination
  getPaginationOffset(page: number, limit: number): { offset: number; limit: number } {
    return {
      offset: (page - 1) * limit,
      limit,
    };
  }

  // Tutup semua koneksi pool jika aplikasi NestJS dimatikan
  async onModuleDestroy() {
    await this.pool.end();
    console.log('🔒 Koneksi pool database ditutup.');
  }
}