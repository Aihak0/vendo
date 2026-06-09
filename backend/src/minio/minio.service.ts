import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from 'node_modules/@nestjs/config';

@Injectable()
export class MinioService {
  private client: Minio.Client;

  constructor(private configService: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT')!, // IP VM 3
      port: this.configService.get<number>('MINIO_PORT'),
      useSSL: false,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
    });
  }

  async uploadFile(
    bucket: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
  ) {
    await this.client.putObject(
      bucket,
      fileName,
      fileBuffer,
      fileBuffer.length,
      {
        'Content-Type': mimeType,
      },
    );

    return `http://${this.configService.get<string>('MINIO_ENDPOINT')}:9001/${bucket}/${fileName}`;
  }

   async deleteFile(
    bucket: string,
    objectName: string,
    ): Promise<void> {
      await this.client.removeObject(bucket, objectName);
    }
}