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

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une période (avec avertissement côté client si non vide)' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.periodService.remove(id, req.user);
  }
}
