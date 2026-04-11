import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { InstanceService } from './instance.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Instances (Écoles)')
@Controller('instances')
export class InstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AS)
  @ApiOperation({ summary: "Création d'une nouvelle école (instance)" })
  async create(@Body() createInstanceDto: CreateInstanceDto) {
    return this.instanceService.create(createInstanceDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Liste des écoles (filtrée par rôle)" })
  async findAll(@Request() req: any) {
    return this.instanceService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une école" })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.instanceService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AS)
  @ApiOperation({ summary: "Mettre à jour une école" })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstanceDto: UpdateInstanceDto,
  ) {
    return this.instanceService.update(id, updateInstanceDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AS)
  @ApiOperation({ summary: "Supprimer une école (cascade)" })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.instanceService.remove(id);
  }
}
