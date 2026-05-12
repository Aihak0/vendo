import { Controller, Get, Query, ParseIntPipe, ParseBoolPipe, Post, Body, Patch, Param } from '@nestjs/common';
import { TaskService } from './task.service';

@Controller('task')
export class TaskController {
    constructor(private readonly taskService: TaskService){}
    
    @Get()
    // @UseGuards(AuthGuard, RolesGuard)
    async findAll(@Query('page', new ParseIntPipe({ optional: true })) page: number, @Query('limit', new ParseIntPipe({ optional: true })) limit: number, @Query("sortAsc", new ParseBoolPipe({optional: true})) sortAsc: boolean, @Query("sortKey") sortKey: string, @Query('search') search: string, @Query("status") status: string,  @Query("prioritas") prioritas: string){
        return await this.taskService.findAll(page, limit, sortAsc, sortKey, search, status, prioritas);
    }

    @Post('add')
    async add(@Body() body: any){
        return await this.taskService.add(body);
    }
    @Patch('update/:id')
    async update(@Body() body: any, @Param('id') id: string){
        return await this.taskService.update(id, body);
    }
    @Patch('update_status/:id')
    async updateStatus(@Query('id') id: string, @Body('status') status: string){
        return await this.taskService.updateStatus(id, status);
    }

    @Post('delete')
    async delete(@Body() body: { id: string[] }){
        return await this.taskService.delete(body);
    }
}
