import { Body, Controller, Get, Inject, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MesinService } from './mesin.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { Ctx, MessagePattern, MqttContext, NatsContext, Payload } from '@nestjs/microservices';

@Controller('mesin')
export class MesinController {
    constructor(private readonly mesinService: MesinService, @Inject('HIVE_CLIENT') private client: ClientProxy,){}
    @Get()
    @UseGuards(AuthGuard)
    async findAll(@Query('page', ParseIntPipe) page: number = 1, @Query('limit', ParseIntPipe) limit: number = 10, @Query('sortAsc', new ParseBoolPipe({ optional: true })) sortAsc: boolean, @Query('sortKey') sortKey?: string,  @Query('search') search?: string, @Query('status') status?: string){
      return await this.mesinService.findAll(page, limit, sortAsc, sortKey, search, status);
    }

    @Get("logs")
    @UseGuards(AuthGuard, RolesGuard)
    async findAllLogs(@Query('page') page: number, @Query('limit') limit: number, @Query('search') search: string){
      return await this.mesinService.findAllLogs(page, limit, search);
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

    @Post('update-stock') // Sesuai dengan api.ts tadi
    async updateStock(
      @Body() body: { mesin_id: string, dataSlot: any[] },
    ) {
      return this.mesinService.updateStockSlot(body.mesin_id, body.dataSlot);
    }

    // @UseGuards(MqttAuthGuard)
    @MessagePattern("mesin/+/status")
    async UpdateStatus(@Payload() payload:any, @Ctx() context: MqttContext) {
      const topic = context.getTopic(); // Ini adalah "mesin/123/status"
      const kodeMesin = topic.split('/')[1];

      console.log("Received MQTT message for mesin/status => ", payload);
      return this.mesinService.updateStatus(payload, kodeMesin);
    }
}
