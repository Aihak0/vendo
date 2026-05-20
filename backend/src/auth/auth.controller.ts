import { Body, Controller, HttpCode, NotFoundException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

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
}