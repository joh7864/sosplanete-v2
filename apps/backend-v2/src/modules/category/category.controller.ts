import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, ParseIntPipe } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Categories (Per Instance)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new category for an instance' })
  create(@Body() body: { name: string; icon?: string; order?: number; instanceId: number }, @Req() req: any) {
    return this.categoryService.create(body, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'List categories of an instance' })
  findAll(@Query('instanceId', ParseIntPipe) instanceId: number, @Req() req: any) {
    return this.categoryService.findAll(instanceId, req.user);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  reorder(@Body() body: { categoryIds: number[]; instanceId: number }, @Req() req: any) {
    return this.categoryService.reorder(body, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a category' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    return this.categoryService.update(id, body, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.categoryService.remove(id, req.user);
  }
}
