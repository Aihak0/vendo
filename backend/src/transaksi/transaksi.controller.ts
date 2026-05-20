import { Body, Controller, Get, HttpCode, HttpStatus, Inject, ParseBoolPipe, ParseIntPipe, Post, Query, Res, UseGuards } from '@nestjs/common';
import { TransaksiService } from './transaksi.service';
import { ClientProxy, Ctx, MessagePattern, MqttContext, Payload } from '@nestjs/microservices';
import { MqttAuthGuard } from 'src/mqtt-auth/mqtt-auth.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';
import { Timestamp } from 'node_modules/rxjs/dist/types';

@Controller('transaksi')
export class TransaksiController {
    constructor(private readonly transaksiService: TransaksiService,
        @Inject('HIVE_CLIENT') private client: ClientProxy,
    ){}

    @UseGuards(MqttAuthGuard)
    @MessagePattern('transaksi/data', { qos: 1 })
    async handlePaymentReq(@Payload() payload: any, @Ctx() context: MqttContext){
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        const dataMesin = (context as any).mesin;
        
        await this.transaksiService.paymentReq(data, dataMesin).catch(err => {
            this.client.emit(`generate/qr`, {
                success: false,
                message: err.message || "Error Payment Req" ,
                data: {}

            });
        });
    }

    @UseGuards(MqttAuthGuard)
    @MessagePattern('transaksi/complete')
    async completeOrder(@Payload() payload: any, @Ctx() context: MqttContext){
        const dataMesin = (context as any).mesin;
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

        await this.transaksiService.completeOrder(data, dataMesin).catch(err => {
            this.client.emit(`transaksi/status`, {
                success: false,
                message: err.message ||"Error Complete Order" ,
                order_id: data.order_id,
                statusTransaksi: 'failed'
            });
        });
    } 

    @UseGuards(MqttAuthGuard)
    @MessagePattern('transaksi/cancel')
    async cancelOrder(@Payload() payload: any, @Ctx() context: MqttContext){
        const dataMesin = (context as any).mesin;

        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

        await this.transaksiService.cancelOrder(data, dataMesin).catch(err => {
            this.client.emit(`transaksi/status`, {
                success: false,
                message: err.message || "Error Cancel Order" ,
                order_id: data.order_id,
                statusTransaksi: 'failed'
            });
        });
    }

    @UseGuards(MqttAuthGuard)
    @MessagePattern('transaksi/refund')
    async refundOrder(@Payload() payload: any, @Ctx() context: MqttContext){
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        const dataMesin = (context as any).mesin;

        const topic = context.getTopic(); 
        const orderIdFromTopic = topic.split('/').pop();

        await this.transaksiService.refundOrder(data, dataMesin).catch(err => {
            this.client.emit(`transaksi/status`, {
                success: false,
                message: err.message || "Error Refund Order" ,
                order_id: data.order_id,
                statusTransaksi: 'failed'
            });

        });
    }
    
    @Post('/mitrans_notification')
    @HttpCode(HttpStatus.OK)
    async updateStatusTransaksi(@Body() data: any){
        console.log("data notif midtrans",data.order_id); 
        console.log("data notif midtrans",data.transaction_status); 
        
        await this.transaksiService.updateStatusTransaksi(data);
        return { message: 'Webhook processed successfully' };
    }

    
    @Get()
    @UseGuards(AuthGuard, RolesGuard)
    async findAll(@Query('page', ParseIntPipe) page: number = 1, @Query('limit', ParseIntPipe) limit: number = 10, @Query("sortAsc", new ParseBoolPipe({optional: true})) sortAsc: boolean, @Query("sortKey") sortKey: string, @Query('search') search: string,  @Query('statusTransaksi') statusTransaksi: string,  @Query('statusPembayaran') statusPembayaran: string){
        return await this.transaksiService.findAll(page, limit, sortAsc, sortKey, search, statusTransaksi, statusPembayaran);
    }

    @Get('summary')
    @UseGuards(AuthGuard, RolesGuard)
    async getSummary(@Query("filter") filter: string, @Query("dari") dari: Date, @Query("sampai") sampai: Date){
        return await this.transaksiService.getSummary(filter, dari, sampai);
    }

}
