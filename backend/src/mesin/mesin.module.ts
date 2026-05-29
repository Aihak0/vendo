import { Module } from '@nestjs/common';
import { MesinController } from './mesin.controller';
import { MesinService } from './mesin.service';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, MqttModule, JwtModule.registerAsync({
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
  controllers: [MesinController],
  providers: [MesinService]
})
export class MesinModule {}
