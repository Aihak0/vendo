import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [SupabaseModule], 
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
