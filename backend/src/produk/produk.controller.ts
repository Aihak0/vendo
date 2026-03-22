// produk.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ProdukService } from './produk.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('produk')
export class ProdukController {
  constructor(private readonly produkService: ProdukService) {}

  @Get()
  async findAll(@Query('search') search: string) {
    return this.produkService.findAll(search);
  }

  @Post('add')
  @UseInterceptors(FileInterceptor('image')) // 'image' adalah key dari frontend
  async add(
    @Body() body: any, 
    @UploadedFile() file: Express.Multer.File // Tangkap filenya di sini!
  ) {
    // Kirim body dan file ke service
    return this.produkService.add(body, file);
  }
  @Patch('edit/:id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() body: any, 
    @UploadedFile() file: Express.Multer.File //
  ){
   return this.produkService.update(id, body, file);
  }
   // produk.controller.ts

  @Post('delete') // Sesuai dengan api.ts tadi
  async delete(
    @Body() body: { id: string[] },
  ) {
    return this.produkService.delete(body);
  }
}