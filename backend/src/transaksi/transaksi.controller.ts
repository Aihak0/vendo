import { Body, Controller, Inject, Post } from '@nestjs/common';
import { TransaksiService } from './transaksi.service';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';

@Controller('transaksi')
export class TransaksiController {
    constructor(private readonly transaksiService: TransaksiService,
        @Inject('HIVE_CLIENT') private client: ClientProxy,
    ){}

    @MessagePattern('/transaksi')
    async handlePaymentReq(@Payload() payload: any){
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        console.log("data aja => ", data);
        console.log("data orderid => ", data.order_id); 
        
        this.transaksiService.paymentReq(data);
    }
    
    @Post('/mitrans_notification')
    async updateStatusTransaksi(@Body() data: any){
        console.log("data notif midtrans",data)
        this.transaksiService.updateStatusTransaksi(data);
    }

}
