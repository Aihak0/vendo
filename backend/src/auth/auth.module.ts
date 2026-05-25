import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [SupabaseModule, DatabaseModule], 
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
