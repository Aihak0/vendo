import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/jwt/jwt.strategy';

@Module({
  imports: [ DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Gunakan registerAsync agar bisa inject ConfigService
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // <-- Ambil dari env
        signOptions: { expiresIn: '1d', algorithm: 'HS256', },
      }),
    }),
  ], 
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
