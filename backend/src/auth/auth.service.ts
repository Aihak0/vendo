import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; // Ditambahkan untuk membuat session token
import { DatabaseService } from 'src/database/database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  // Masukkan JwtService ke constructor bersama DatabaseService
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService, 
  ) {}

  async login(email: string, passwordInput: string) {
    const db = this.databaseService.getClient();

    // 1. Cari user berdasarkan email
    const queryText = `
        SELECT id, email, password
        FROM users 
        WHERE email = $1 
        LIMIT 1
      `;
    const result = await db.query(queryText, [email]);

    // Jika email tidak terdaftar
    if (result.rows.length === 0) {
      return { 
        data: { session: null, user: null }, 
        error: { message: 'Email atau password salah.' } 
      };
    }

    const user = result.rows[0];

    // 2. Cocokkan password input dengan hash di database
    const isPasswordValid = await bcrypt.compare(passwordInput, user.password);
    
    if (!isPasswordValid) {
      return { 
        data: { session: null, user: null }, 
        error: { message: 'Email atau password salah.' } 
      };
    }
  
    // 3. Ambil data role dari tabel user_profiles
    const queryProfile = `
      SELECT role FROM user_profiles WHERE user_id = $1 LIMIT 1
    `;
    const resultUserProfile = await db.query(queryProfile, [user.id]);

    if (resultUserProfile.rows.length === 0) {
      throw new InternalServerErrorException("User profile tidak ditemukan untuk user ini.");
    }

    const userRole = resultUserProfile.rows[0].role;

    // 4. GENERATE JWT TOKEN (Solusi untuk mengisi user.session yang kosong)
    const payload = { sub: user.id, email: user.email, role: userRole };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET, // Ambil dari file .env VM 1 Anda
      expiresIn: '1d', // Token berlaku 1 hari
    });

    // Hilangkan password sebelum data dikirim ke frontend demi keamanan
    delete user.password;

    // 5. Kembalikan data dengan struktur yang sudah rapi
    return { 
      user: user,
      session: {
        access_token: accessToken,
        token_type: 'bearer'
      },
      role: userRole
    };
  }
}