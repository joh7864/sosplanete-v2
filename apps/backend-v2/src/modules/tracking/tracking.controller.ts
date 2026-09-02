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
  @ApiQuery({ name: 'instanceYearId', type: Number, required: false })
  async getStats(
    @Query('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear?: string,
    @Query('instanceYearId') instanceYearIdStr?: string,
  ) {
    const yearToFetch = schoolYear || '2024-2025';
    return this.trackingService.getTrackingStats(
      parseInt(instanceId),
      yearToFetch,
      instanceYearIdStr ? parseInt(instanceYearIdStr) : undefined,
    );
  }

  @Post('import-actions-csv')
  @ApiOperation({ summary: 'Importer des saisies via CSV' })
  @ApiQuery({ name: 'instanceId', type: Number })
  @ApiQuery({ name: 'schoolYear', type: String, required: false })
  @ApiQuery({ name: 'instanceYearId', type: Number, required: false })
  async importActionsCsv(
    @Query('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
    @Query('instanceYearId') instanceYearIdStr: string | undefined,
    @Body('csvContent') csvContent: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.trackingService.importActionsCsv(
      parseInt(instanceId),
      csvContent,
      sy,
      instanceYearIdStr ? parseInt(instanceYearIdStr) : undefined,
    );
  }

  @Get('export-actions-csv')
  @ApiOperation({ summary: 'Exporter les saisies d\'actions en CSV' })
  @ApiQuery({ name: 'instanceId', type: Number })
  @ApiQuery({ name: 'schoolYear', type: String, required: false })
  @ApiQuery({ name: 'instanceYearId', type: Number, required: false })
  async exportActionsCsv(
    @Query('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear?: string,
    @Query('instanceYearId') instanceYearIdStr?: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.trackingService.exportActionsCsv(
      parseInt(instanceId),
      sy,
      instanceYearIdStr ? parseInt(instanceYearIdStr) : undefined,
    );
  }
}
