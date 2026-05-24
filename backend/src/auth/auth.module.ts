import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ DatabaseModule,
    JwtModule.registerAsync({
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
    })
  ], 
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
