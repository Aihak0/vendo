import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { DatabaseModule } from './database/database.module';

@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
  imports: [DatabaseModule],
})
export class SupabaseModule {}