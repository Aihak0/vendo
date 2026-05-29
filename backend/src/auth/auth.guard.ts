import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
// KOREKSI 1: Jangan import dari node_modules/, langsung dari packagenya
import { JwtService } from '@nestjs/jwt'; 
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  private userCache = new Map<string, { user: any; expiry: number }>();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
    // Ambil token dari header Authorization
    if (request.method === 'OPTIONS') {
      return true;
    }
    // console.log("METHOD:", request.method);
    // console.log("URL:", request.url);
    // console.log("AUTH:", request.headers.authorization);
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token tidak ditemukan atau format salah');
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Format token salah');
 
    // Cek Cache internal (In-Memory)
    const cached = this.userCache.get(token);
    if (cached && cached.expiry > Date.now()) {
      request.user = cached.user;
      return true;
    }

      console.log('🌐 Memverifikasi token via database VM 3...');
      
      // 1. Verifikasi dan bedah isi JWT Token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET, 
      });
      
      // Ambil user ID dari payload token (Supabase biasanya menggunakan payload.sub)
      const userId = payload.sub; 

      // 2. Ambil client database PostgreSQL VM 3
      const db = this.databaseService.getClient();

      // 3. Query ke tabel user lokal di VM 3
      const queryText = `
        SELECT id, email, username, role 
        FROM users 
        WHERE id = $1 
        LIMIT 1
      `;
      // console.log("userid => ", userId)
      const result = await db.query(queryText, [userId]);

      // KOREKSI 3: Antisipasi jika token valid tapi user-nya sudah dihapus dari database
      if (result.rows.length === 0) {
        throw new UnauthorizedException('User tidak terdaftar di database.');
      }

      const dbUser = result.rows[0];

      // Simpan ke Cache selama 5 menit
      this.userCache.set(token, {
        user: dbUser,
        expiry: Date.now() + 5 * 60 * 1000 
      });

      // Simpan data user ke object request agar bisa dipakai di controller lewat @Req()
      request.user = dbUser;
      return true;

    } catch (e: any) {

      // console.log(e)
      // KOREKSI 2: Tangkap error JWT (seperti expired atau invalid secret) dan bungkus dengan UnauthorizedException
      throw new UnauthorizedException(e.message || 'Token tidak valid atau kedaluwarsa');
    }
  }
}