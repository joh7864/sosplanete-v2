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
  @ApiQuery({ name: 'schoolYear', type: String, required: false })
  async getStats(@Query('instanceId') instanceId: string, @Query('schoolYear') schoolYear?: string) {
    const yearToFetch = schoolYear || '2024-2025';
    return this.trackingService.getTrackingStats(parseInt(instanceId), yearToFetch);
  }

  @Post('import-actions-csv')
  @ApiOperation({ summary: 'Importer des saisies via CSV' })
  @ApiQuery({ name: 'instanceId', type: Number })
  @ApiQuery({ name: 'schoolYear', type: String, required: false })
  async importActionsCsv(
    @Query('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
    @Body('csvContent') csvContent: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.trackingService.importActionsCsv(parseInt(instanceId), csvContent, sy);
  }
}
