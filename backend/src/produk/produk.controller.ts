// produk.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseInterceptors, ParseBoolPipe, UseGuards } from '@nestjs/common';
import { ProdukService } from './produk.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';

@Controller('produk')
export class ProdukController {
  constructor(private readonly produkService: ProdukService) {}

  @Get()
  // @UseGuards(AuthGuard, RolesGuard)
  async findAll(@Query('page', new ParseIntPipe({ optional: true })) page?: number, @Query('limit', new ParseIntPipe({ optional: true })) limit?: number, @Query("sortAsc", new ParseBoolPipe({optional: true})) sortAsc?: boolean, @Query("sortKey") sortKey?: string, @Query('search') search?: string, @Query("isActive") isActive?: string) {
    return this.produkService.findAll(page, limit, sortAsc, sortKey, search, isActive);
  }

  @Post('add')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('image')) // 'image' adalah key dari frontend
  async add(
    @Body() body: any, 
    @UploadedFile() file: Express.Multer.File // Tangkap filenya di sini!
  ) {
    // Kirim body dan file ke service
    return this.produkService.add(body, file);
  }

  @Patch('edit/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string, 
    @Body() body: any, 
    @UploadedFile() file: Express.Multer.File //
  ){
   return this.produkService.update(id, body, file);
  }
   // produk.controller.ts

  @Post('activate-or-deactivate') // Sesuai dengan api.ts tadi
  @UseGuards(AuthGuard, RolesGuard)
  async activateANDDeactivate(
    @Body() body:any[],
  ) {
    return this.produkService.activateANDDeactivate(body);
  }

}