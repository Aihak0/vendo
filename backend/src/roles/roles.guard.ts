import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private databaseService: DatabaseService){}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const db = this.databaseService.getClient();
    const request = context.switchToHttp().getRequest();
    const user = request.user;
     
    // Cara yang benar: masukkan user.id ke dalam array di argumen kedua
    const userRole = await db.query(
      `SELECT role FROM users WHERE id = $1`, 
      [user.id]
    );
    // Untuk mengambil datanya, jangan lupa gunakan .rows
    const profile = userRole.rows[0];

    if (profile?.role !== 'admin') {
      throw new ForbiddenException('Hanya Admin yang diizinkan!');
    }

    return true;
  }
}
