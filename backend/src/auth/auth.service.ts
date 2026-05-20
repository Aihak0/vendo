import { Injectable, Session,UnauthorizedException, NotFoundException, InternalServerErrorException, } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async login(email: string, password: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error: errorSignIn } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (errorSignIn) {
      throw new UnauthorizedException(errorSignIn.message);
    }
    
    const userId = data.user.id;

    const {data: UserProfile, error:ErrorUserProfile} = await supabase
    .from("user_profiles") 
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
    // console.log(UserProfile);
    
   

    if (ErrorUserProfile) {
      throw new InternalServerErrorException(ErrorUserProfile.message);
    }

    if (!UserProfile) {
      throw new NotFoundException("data tidak ditemukan");
    }

    return { 
      user: data.user,
      session: data.session,
      role: UserProfile.role
    };
  }
}