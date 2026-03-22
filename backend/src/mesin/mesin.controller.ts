import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MesinService } from './mesin.service';

@Controller('mesin')
export class MesinController {
    constructor(private readonly mesinService: MesinService){}
    @Get()
    async findAll(@Query('search') search: string){
      return await this.mesinService.findAll(search);
    }
    @Post('add')
    async add(
      @Body() body: any, 
    ) {
      return this.mesinService.add(body);
    }

    @Patch('edit/:id')
    async update(
      @Param('id') id: string,
      @Body() body: any
    ){
     return this.mesinService.update(id, body);
    }
       // produk.controller.ts
    
    @Post('delete') // Sesuai dengan api.ts tadi
    async delete(
      @Body() body: { id: string[] },
    ) {
      return this.mesinService.delete(body);
    }
}
