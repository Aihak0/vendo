import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [SupabaseModule, DatabaseModule],
  providers: [DashboardService],
  controllers: [DashboardController]
})
export class DashboardModule {}
