import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
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
    // console.log(process.env.DB_HOST)
// console.log("EMAIL:", email);
// console.log("TYPE:", typeof email);
// console.log("LENGTH:", email?.length);
    const db = this.databaseService.getClient();

    // 1. Cari user berdasarkan email
    const queryText = `
        SELECT id, email, password
        FROM users 
        WHERE email = $1 
        LIMIT 1
      `;

    try{

      const result = await db.query(queryText, [email]);

    // console.log(result);

    // Jika email tidak terdaftar
    if (result.rows.length === 0) {
      throw new UnauthorizedException('Email salah.');
    }
    
    const user = result.rows[0];
    
    console.log("uuhhh",{
      passwordInput,
      passwordDatabase: user.password
    })
    // 2. Cocokkan password input dengan hash di database
    const isPasswordValid = await bcrypt.compare(passwordInput, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password salah.');
    }
  
    // 3. Ambil data role dari tabel user_profiles
   
    // 4. GENERATE JWT TOKEN (Solusi untuk mengisi user.session yang kosong)
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET, // Ambil dari file .env VM 1 Anda
      expiresIn: '1d', // Token berlaku 1 hari
    });


    console.log("tokeeeeen  ",accessToken)

    // Hilangkan password sebelum data dikirim ke frontend demi keamanan
    delete user.password;

    // 5. Kembalikan data dengan struktur yang sudah rapi
    return { 
      user: user,
      session: {
        access_token: accessToken,
        token_type: 'bearer'
      },
      role: user.role
    };

    }catch(err: any){
      console.log(err.message);
      throw err;
    }
    
  }
}