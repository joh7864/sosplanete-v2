import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrackingService } from './tracking.service';

@ApiTags('tracking')
@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques de suivi hebdomadaire' })
  @ApiQuery({ name: 'instanceId', type: Number })
  @ApiQuery({ name: 'year', type: Number, required: false })
  async getStats(@Query('instanceId') instanceId: string, @Query('year') yearStr?: string) {
    const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
    return this.trackingService.getTrackingStats(parseInt(instanceId), year);
  }

  @Post('import-actions-csv')
  @ApiOperation({ summary: 'Importer des saisies via CSV' })
  @ApiQuery({ name: 'instanceId', type: Number })
  async importActionsCsv(
    @Query('instanceId') instanceId: string,
    @Body('csvContent') csvContent: string,
  ) {
    return this.trackingService.importActionsCsv(parseInt(instanceId), csvContent);
  }
}
