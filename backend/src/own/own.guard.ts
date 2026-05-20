import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class OwnGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
      
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const paramID = request.params.id;
       
      if (!user || !paramID) {
        throw new ForbiddenException('Data pengguna atau ID tidak valid');
      }
  
      if (user.id !== paramID) {
        throw new ForbiddenException('Hanya Pemilik yang diizinkan!');
      }
  
      return true;
    }
  }