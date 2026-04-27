import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService){}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const supabase = this.supabaseService.getClient();
    const request = context.switchToHttp().getRequest();
    const user = request.user;
     
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new ForbiddenException('Hanya Admin yang diizinkan!');
    }

    return true;
  }
}
