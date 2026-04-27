import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService){}
  private userCache = new Map<string, {user: any, expiry: number}>();
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedException('Token tidak ditemukan');

    // Verifikasi token ke Supabase
    const cached = this.userCache.get(token);
    if (cached && cached.expiry > Date.now()) {
      request.user = cached.user;
      return true;
    }
    try {
      console.log('🌐 Takon tok...');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) throw new UnauthorizedException('Sesi tidak valid');

      this.userCache.set(token, {
        user: user,
        expiry: Date.now() + 5 * 60 * 1000 
      });
      // Simpan data user ke object request agar bisa dipakai di controller
      request.user = user;
      return true;
    } catch (e) {
      throw e;
    }
   
  }
}
