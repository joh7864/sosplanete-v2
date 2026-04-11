import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query, ParseIntPipe } from '@nestjs/common';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Groupes (Groups)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un groupe dans une équipe' })
  async create(@Body() body: { name: string; teamId: number }, @Req() req: any) {
    return this.groupService.create(body, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les groupes d\'une équipe' })
  async findAll(@Query('teamId', ParseIntPipe) teamId: number, @Req() req: any) {
    return this.groupService.findAll(teamId, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un groupe' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.groupService.remove(id, req.user);
  }
}
