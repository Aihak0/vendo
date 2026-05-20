import { Module } from '@nestjs/common';
import { PergerakanStockController } from './pergerakan_stock.controller';
import { PergerakanStockService } from './pergerakan_stock.service';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [PergerakanStockController],
  providers: [PergerakanStockService]
})
export class PergerakanStockModule {}
