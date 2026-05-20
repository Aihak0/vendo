import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Gunakan import namespace untuk library CommonJS di TypeScript
import * as MidtransClient from 'midtrans-client';

@Injectable()
export class MidtransService {
    private coreApi: MidtransClient.CoreApi;
    private snap: any;

    constructor(private readonly configService: ConfigService) {
    const midtransServerKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    const midtransClientKey = this.configService.get<string>('MIDTRANS_CLIENT_KEY'); // Perbaikan typo: midtarns -> midtrans

    // Tambahkan pengecekan jika key tidak ditemukan di .env
    if (!midtransServerKey || !midtransClientKey) {
      throw new Error('Midtrans keys are missing in environment variables');
    }

    this.coreApi = new MidtransClient.CoreApi({
      isProduction: false,
      serverKey: midtransServerKey,
      clientKey: midtransClientKey,
    });
  }

  
  getClient(): MidtransClient {
    return this.coreApi;
  }

}