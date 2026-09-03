import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ImpactService } from './impact.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('impact')
export class ImpactController {
  constructor(private readonly impactService: ImpactService) {}

  @Get('global')
  async getGlobalImpact(@Query('schoolYear') schoolYear?: string) {
    const sy = schoolYear || '2024-2025';
    return this.impactService.calculateImpact(sy, null);
  }

  @Get('summary')
  async getSummary(@Query('schoolYear') schoolYear?: string) {
    const sy = schoolYear || '2024-2025';
    return this.impactService.getImpactSummary(sy);
  }

  @Get('constants')
  async getAnnualConstants(@Query('schoolYear') schoolYear?: string) {
    const sy = schoolYear || '2024-2025';
    return this.impactService.getAnnualConstants(sy);
  }

  @Post('constants')
  @Roles(Role.AS)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateAnnualConstants(@Body() body: any, @Request() req: any) {
    return this.impactService.updateAnnualConstants(body, req.user);
  }

  @Post('annual-tuning/:year')
  @Roles(Role.AS)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateAnnualTuning(@Param('year') year: string, @Body() body: any) {
    return this.impactService.updateAnnualTuning(parseInt(year, 10), body);
  }

  @Get('simulation-base')
  async getSimulationBase(
    @Query('schoolYear') schoolYear?: string,
    @Query('instanceId') instanceId?: string,
  ) {
    const sy = schoolYear || '2024-2025';
    const instId = instanceId ? parseInt(instanceId, 10) : undefined;
    return this.impactService.getSimulationBase(
      sy,
      isNaN(instId as number) ? undefined : instId,
    );
  }

  @Get('history')
  async getGlobalHistory(@Query('schoolYear') schoolYear?: string) {
    const sy = schoolYear || '2024-2025';
    return this.impactService.getImpactHistory(sy, null);
  }

  @Get('history/:instanceId')
  async getInstanceHistory(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear?: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.impactService.getImpactHistory(sy, parseInt(instanceId, 10));
  }

  @Get('instance/:instanceId')
  async getInstanceImpact(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear?: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.impactService.calculateImpact(sy, parseInt(instanceId, 10));
  }
}
