import { Body, Controller, Get, HttpCode, NotFoundException, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/jwt_auth/jwt_auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: any) {
    if(body.email == null || body.password == null){
      return new NotFoundException("data tidak lengkap");
    }
    return this.authService.login(body.email, body.password);
  }
  
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req) {
    return req.user;
  }
} 