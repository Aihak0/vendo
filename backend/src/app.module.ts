import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProdukController } from './produk/produk.controller';
import { ProdukService } from './produk/produk.service';
import { ProdukModule } from './produk/produk.module';
import { MesinModule } from './mesin/mesin.module';
import { PesanModule } from './pesan/pesan.module';

@Module({
  imports: [SupabaseModule, AuthModule, ConfigModule.forRoot({
      isGlobal: true,
    }), ProdukModule, MesinModule, PesanModule,],
  
  controllers: [AppController, AuthController, ProdukController],
  providers: [AppService, ProdukService,],
})
export class AppModule {}
