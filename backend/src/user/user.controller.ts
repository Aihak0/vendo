import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService){}

    @Get()
    @UseGuards(AuthGuard, RolesGuard)
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Query('search') search: string){
        return await this.userService.findAll(Number(page), Number(limit), search);
    }

    @Post('add')
    @UseGuards(AuthGuard, RolesGuard)
    async registerUser(@Body() body: any){
        return this.userService.registerUser(body);
    }

    @Patch('change_role/:id')
    @UseGuards(AuthGuard, RolesGuard)
    async changeRole(
        @Param('id') id: string,
        @Body('role') role: string, 
        ){
        return this.userService.changeRole(id, role);
    }

    @Post('deactivate') // Sesuai dengan api.ts tadi
    @UseGuards(AuthGuard, RolesGuard)
    async deactivateUser(
      @Body() body: any[],
    ) {
      return this.userService.deactivateUser(body);
    }
}
