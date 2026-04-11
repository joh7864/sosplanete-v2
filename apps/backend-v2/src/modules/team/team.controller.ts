import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards, Request, Query } from '@nestjs/common';
import { TeamService } from './team.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@ApiTags('Équipes (Teams)')
@Controller('teams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @ApiOperation({ summary: "Création d'une nouvelle équipe" })
  async create(@Body() createTeamDto: CreateTeamDto, @Request() req: any) {
    return this.teamService.create(createTeamDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: "Liste des équipes d'une instance" })
  @ApiQuery({ name: 'instanceId', type: Number })
  async findAll(@Query('instanceId', ParseIntPipe) instanceId: number, @Request() req: any) {
    return this.teamService.findAll(instanceId, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Mettre à jour une équipe" })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req: any,
  ) {
    return this.teamService.update(id, updateTeamDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Supprimer une équipe (cascade)" })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.teamService.remove(id, req.user);
  }

  @Post('import-csv')
  @ApiOperation({ summary: "Import massif d'équipes, groupes et joueurs via CSV" })
  @ApiQuery({ name: 'instanceId', type: Number })
  async importCsv(
    @Query('instanceId', ParseIntPipe) instanceId: number,
    @Body() body: { csvContent: string },
    @Request() req: any,
  ) {
    return this.teamService.importCsv(instanceId, body.csvContent, req.user);
  }

  // --- BULK DELETE ---
  @Post('bulk-delete')
  @ApiOperation({ summary: "Suppression massive d'équipes" })
  async bulkDeleteTeams(@Body() body: { ids: number[] }) {
    return this.teamService.removeTeams(body.ids);
  }

  @Post('groups/bulk-delete')
  @ApiOperation({ summary: "Suppression massive de groupes" })
  async bulkDeleteGroups(@Body() body: { ids: number[] }) {
    return this.teamService.removeGroups(body.ids);
  }

  @Post('children/bulk-delete')
  @ApiOperation({ summary: "Suppression massive de joueurs" })
  async bulkDeleteChildren(@Body() body: { ids: number[] }) {
    return this.teamService.removeChildren(body.ids);
  }

  // --- GROUPS CRUD ---
  @Post('groups')
  async createGroup(@Body() body: { teamId: number; name: string; color?: string }) {
    return this.teamService.createGroup(body.teamId, body.name, body.color);
  }

  @Patch('groups/:id')
  async updateGroup(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; color?: string }) {
    return this.teamService.updateGroup(id, body);
  }

  // --- CHILDREN CRUD ---
  @Post('children')
  async createChild(@Body() body: { groupId: number; pseudo: string; password?: string }) {
    return this.teamService.createChild(body.groupId, body.pseudo, body.password);
  }

  @Patch('children/:id')
  async updateChild(@Param('id', ParseIntPipe) id: number, @Body() body: { pseudo?: string; password?: string }) {
    return this.teamService.updateChild(id, body);
  }
}
