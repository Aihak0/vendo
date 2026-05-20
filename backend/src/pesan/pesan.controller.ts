import { Body, Controller, Post, Get, UseGuards, Query, ParseIntPipe, ParseBoolPipe } from '@nestjs/common';
import { PesanService } from './pesan.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';

@Controller('pesan')
export class PesanController {
    constructor(private readonly pesanService:PesanService){}

    @Get()
    @UseGuards(AuthGuard, RolesGuard)
    async findAll(@Query('page', ParseIntPipe) page: number = 1, @Query('limit', ParseIntPipe) limit: number = 10, @Query("sortAsc", new ParseBoolPipe({optional: true})) sortAsc: boolean, @Query("sortKey") sortKey: string, @Query('search') search: string){
        return await this.pesanService.findAll(page, limit, sortAsc, sortKey, search);
    }

    @Post('add')
    async add(
      @Body() body: any, 
    ) {
      return this.pesanService.add(body);
    }
    
}
