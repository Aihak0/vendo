import { Controller, Get, ParseIntPipe, ParseBoolPipe } from '@nestjs/common';
import { PergerakanStockService } from './pergerakan_stock.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';
import { Query } from '@nestjs/common';

@Controller('pergerakan-stock')
export class PergerakanStockController {
    constructor(private readonly pergerakanStockService: PergerakanStockService){}

    @Get()
    @UseGuards(AuthGuard, RolesGuard)    
    async findAll(@Query('page', ParseIntPipe) page: number = 1, @Query('limit', ParseIntPipe) limit: number = 10, @Query("sortAsc", new ParseBoolPipe({optional: true})) sortAsc: boolean, @Query("sortKey") sortKey: string, @Query('search') search: string, @Query("tipePerubahan") tipePerubahan: string){
        return await this.pergerakanStockService.findAll(page, limit, sortAsc, sortKey, search, tipePerubahan);
    }
}
