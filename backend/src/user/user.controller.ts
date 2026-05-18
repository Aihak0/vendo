import { Body, Controller, ExecutionContext, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';
import { FileInterceptor } from 'node_modules/@nestjs/platform-express';
import { OwnGuard } from 'src/own/own.guard';
import { CurrentUser } from './user.decorator';


@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService){}

    @Get()
    @UseGuards(AuthGuard, RolesGuard)
    async findAll(@Query('page', new ParseIntPipe({ optional: true })) page: number, @Query('limit', new ParseIntPipe({ optional: true })) limit: number, @Query("sortAsc", new ParseBoolPipe({optional: true})) sortAsc: boolean, @Query("sortKey") sortKey: string, @Query('search') search: string, @Query("role") role: string){
        return await this.userService.findAll(page, limit, sortAsc, sortKey, search, role);
    }

    @Get('profile')
    @UseGuards(AuthGuard)
    async getUserProfile(@CurrentUser() user: any) {
        // Kamu bisa langsung mendapatkan objek user di sini
        return await this.userService.getUserProfiles(user.id);
    }

    @Post('add')
    @UseInterceptors(FileInterceptor('pasFoto'))
    @UseGuards(AuthGuard, RolesGuard)
    async registerUser(@Body() body: any, @UploadedFile() pasFoto: Express.Multer.File ){
        console.log(body);
        return this.userService.registerUser(body, pasFoto);
    }
    
    @Patch("update/:id")
    @UseGuards(AuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('pasFoto'))
    async update(@Param("id") id: string, @Body() body: any,@UploadedFile() pasFoto?: Express.Multer.File){
        return this.userService.editUser(id, body, pasFoto);
    }
    
    @Patch('change_role/:id')
    @UseGuards(AuthGuard, RolesGuard)
    async changeRole(
        @Param('id') id: string,
        @Body('role') role: string, 
        ){
        return this.userService.changeRole(id, role);
    }

    @Patch('change_profile_by_owner/:id')
    @UseGuards(AuthGuard, OwnGuard)
    @UseInterceptors(FileInterceptor('pasFoto'))
    async updateUserByOwn(
        @Req() req, 
        @Param('id') id: string,
        @Body() body: any, 
        @UploadedFile() pasFoto?: Express.Multer.File
        ){
        //    console.log('Authorization Header:', req.headers.authorization);
        // console.log('User dari Guard:', req.user);
        const token = req.headers.authorization?.split(' ')[1];
        const { nama, password } = body;
        return this.userService.updaetProfileByOwn(token, id, req,  nama, password, pasFoto);
    }

    @Post('deactivate') // Sesuai dengan api.ts tadi
    @UseGuards(AuthGuard, RolesGuard)
    async deactivateUser(
      @Body() body: any[],
    ) {
      return this.userService.deactivateUser(body);
    }
}
