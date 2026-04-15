import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query, ParseIntPipe } from '@nestjs/common';
import { PeriodService } from './period.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Périodes de Saisie (Periods)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('periods')
export class PeriodController {
  constructor(private readonly periodService: PeriodService) {}

  @Post()
  @ApiOperation({ summary: 'Définir une nouvelle période de saisie' })
  async create(@Body() body: { startDate: Date; endDate: Date; instanceId: number }, @Req() req: any) {
    return this.periodService.create(body, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les périodes d\'une instance' })
  async findAll(@Query('instanceId', ParseIntPipe) instanceId: number, @Req() req: any) {
    return this.periodService.findAll(instanceId, req.user);
  }

  @Get(':id/impact')
  @ApiOperation({ summary: 'Obtenir l\'impact de la suppression d\'une période (Nb actions et détails)' })
  async getImpact(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.periodService.getImpact(id, req.user);
  }

  @Post(':id') // Keeping to REST if they want, but let's use Patch
  @ApiOperation({ summary: 'Mettre à jour une période (ex: isOpen)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { startDate?: Date; endDate?: Date; isOpen?: boolean },
    @Req() req: any
  ) {
    return this.periodService.update(id, body, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une période (avec avertissement côté client si non vide)' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.periodService.remove(id, req.user);
  }
}
