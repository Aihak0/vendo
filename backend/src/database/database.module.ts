import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global() // Menandai modul ini sebagai global sehingga bisa digunakan di seluruh aplikasi tanpa perlu impor ulang
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService], // Mengekspor DatabaseService agar bisa digunakan di modul lain
})
export class DatabaseModule {}
