import { Module } from '@nestjs/common';
import { PesanController } from './pesan.controller';
import { PesanService } from './pesan.service';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [DatabaseModule,  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      // Tambahkan '!' di ujung untuk memastikan ke TS kalau nilai ini pasti ada/tidak undefined
      secret: configService.get<string>('JWT_SECRET')!, 
      signOptions: { 
        // Tambahkan 'as any' di ujung untuk meredam error Type Mismatch
        expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any
      },
    }),
  })], 
  controllers: [PesanController],
  providers: [PesanService]
})
export class PesanModule {}
