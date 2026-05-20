import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService){}
    @Get()
    async dataDashboard(@Query("filter") filter: string, @Query("dari") dari: Date, @Query("sampai") sampai: Date){
        return await this.dashboardService.getDataDashboard(filter, dari, sampai);
    }
}
