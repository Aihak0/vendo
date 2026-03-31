import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MesinService } from './mesin.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('mesin')
export class MesinController {
    constructor(private readonly mesinService: MesinService, @Inject('HIVE_CLIENT') private client: ClientProxy,){}
    @Get()
    @UseGuards(AuthGuard)
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

    @MessagePattern("mesin/status")
    async UpdateStatus(@Payload() payload:any) {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      await this.mesinService.updateStatus(data).catch(err => {
            this.client.emit(`mesin/status/${data.kode}`, {
                success: false,
                message: err.message ||"Error update Status" ,
            });
        });
    }
}
