import { Body, Controller, Post } from '@nestjs/common';
import { PesanService } from './pesan.service';

@Controller('pesan')
export class PesanController {
    constructor(private readonly pesanService:PesanService){}

    @Post('add')
    async add(
      @Body() body: any, 
    ) {
      return this.pesanService.add(body);
    }
    
}
