import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [SupabaseModule, DatabaseModule],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
