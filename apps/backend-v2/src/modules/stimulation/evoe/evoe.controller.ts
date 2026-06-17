import { Controller, Get, Post, Param, Query, Headers } from '@nestjs/common';
import { EvoeService } from './evoe.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Evoe')
@Controller('evoe')
export class EvoeController {
  constructor(private readonly evoeService: EvoeService) {}

  @Get('missions/:instanceId')
  @ApiOperation({
    summary: 'Liste les missions physiques mappées en mode SF (Codex)',
  })
  getMissions(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.evoeService.getMissions(+instanceId, sy);
  }

  @Get('dashboard/status/:instanceId')
  @ApiOperation({
    summary: 'Statut du nexus temporel et des équipes (glitch, progression)',
  })
  getDashboardStatus(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
    @Headers('authorization') auth?: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    if (!schoolYear && auth) {
      return this.evoeService.getDashboardStatusAuth(
        auth,
        instanceIdStr || instanceId,
      );
    }
    const sy = schoolYear || '2024-2025';
    return this.evoeService.getDashboardStatus(+instanceId, sy);
  }

  @Get('extrapolation/metrics')
  @ApiOperation({
    summary: "Récupère les métriques d'extrapolation mondiale d'Evoe",
  })
  getExtrapolationMetrics(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    return this.evoeService.getExtrapolationMetrics(auth, instanceIdStr);
  }

  @Get('context')
  @ApiOperation({
    summary:
      'Récupère le contexte complet pour le frontend Evoe (3D et missions)',
  })
  getContext(
    @Headers('authorization') auth: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    return this.evoeService.getContext(auth, instanceIdStr);
  }

  @Post('propulsion/reset/:instanceId')
  @ApiOperation({
    summary:
      'Réinitialise de force les niveaux technologiques de propulsion pour recalcul',
  })
  resetPropulsionLevels(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
    @Headers('authorization') auth?: string,
    @Headers('x-instance-id') instanceIdStr?: string,
  ) {
    if (!schoolYear && auth) {
      return this.evoeService.resetPropulsionLevelsAuth(
        auth,
        instanceIdStr || instanceId,
      );
    }
    const sy = schoolYear || '2024-2025';
    return this.evoeService.resetPropulsionLevels(+instanceId, sy);
  }
}
