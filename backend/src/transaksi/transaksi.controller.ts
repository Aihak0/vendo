import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Res, UseGuards } from '@nestjs/common';
import { TransaksiService } from './transaksi.service';
import { ClientProxy, Ctx, MessagePattern, MqttContext, Payload } from '@nestjs/microservices';
import { MqttAuthGuard } from 'src/mqtt-auth/mqtt-auth.guard';

@Controller('transaksi')
export class TransaksiController {
    constructor(private readonly transaksiService: TransaksiService,
        @Inject('HIVE_CLIENT') private client: ClientProxy,
    ){}

    @UseGuards(MqttAuthGuard)
    @MessagePattern('/transaksi')
    async handlePaymentReq(@Payload() payload: any, @Ctx() context: MqttContext){
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        console.log("data aja => ", data);
        console.log("data orderid => ", data.order_id); 

        const dataMesin = (context as any).mesin;
        
        await this.transaksiService.paymentReq(data, dataMesin).catch(err => {
            this.client.emit(`transaksi/status/${data.order_id}`, {
                success: false,
                message: err.message ||"Error Payment Req" ,
            });
        });
    }

    @UseGuards(MqttAuthGuard)
    @MessagePattern('/transaksi/complete/+')
    async completeOrder(@Payload() payload: any, @Ctx() context: MqttContext){
        const dataMesin = (context as any).mesin;

        const topic = context.getTopic(); 
        const orderIdFromTopic = topic.split('/').pop();

        await this.transaksiService.completeOrder(orderIdFromTopic ?? "", dataMesin).catch(err => {
            this.client.emit(`transaksi/status/${orderIdFromTopic}`, {
                success: false,
                message: err.message ||"Error Complete Order" ,
            });
        });
    }

    @UseGuards(MqttAuthGuard)
    @MessagePattern('/transaksi/cancel/+')
    async cancelOrder(@Payload() payload: any, @Ctx() context: MqttContext){
        const dataMesin = (context as any).mesin;

        const topic = context.getTopic(); 
        const orderIdFromTopic = topic.split('/').pop();

        await this.transaksiService.cancelOrder(orderIdFromTopic ?? "", dataMesin).catch(err => {
            this.client.emit(`transaksi/status/${orderIdFromTopic}`, {
                success: false,
                message: err.message ||"Error Cancel Order" ,
            });
        });
    }

    @UseGuards(MqttAuthGuard)
    @MessagePattern('/transaksi/refund/+')
    async refundOrder(@Payload() payload: any, @Ctx() context: MqttContext){
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        const dataMesin = (context as any).mesin;

        const topic = context.getTopic(); 
        const orderIdFromTopic = topic.split('/').pop();

        await this.transaksiService.refundOrder(orderIdFromTopic ?? "", dataMesin, data).catch(err => {
            this.client.emit(`transaksi/status/${orderIdFromTopic}`, {
                success: false,
                message: err.message ||"Error Refund Order" ,
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

}
