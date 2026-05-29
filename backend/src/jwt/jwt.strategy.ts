// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config'; // <-- Import ini

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) { // <-- Inject di sini
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Mengambil variabel JWT_SECRET dari file .env
      secretOrKey: configService.get<string>('JWT_SECRET')!, 
      jsonWebTokenOptions: {
        algorithms: ['HS256'], // Mengunci agar hanya menerima algoritma HS256 dari Supabase
        },
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}