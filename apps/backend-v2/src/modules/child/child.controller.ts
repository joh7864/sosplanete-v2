import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query, ParseIntPipe } from '@nestjs/common';
import { ChildService } from './child.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Enfants (Children)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('children')
export class ChildController {
  constructor(private readonly childService: ChildService) {}

  @Post()
  @ApiOperation({ summary: 'Ajouter un enfant dans un groupe' })
  async create(@Body() body: { pseudo: string; groupId: number }, @Req() req: any) {
    return this.childService.create(body, req.user);
  }

  @Post('import/:groupId')
  @ApiOperation({ summary: 'Importer des enfants via CSV dans un groupe' })
  async importCSV(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body('fileContent') fileContent: string,
    @Req() req: any,
  ) {
    return this.childService.importFromCSV(fileContent, groupId, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les enfants d\'un groupe' })
  async findAll(@Query('groupId', ParseIntPipe) groupId: number, @Req() req: any) {
    return this.childService.findAll(groupId, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un enfant' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.childService.remove(id, req.user);
  }
}
