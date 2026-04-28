import { Controller, Get, Param, Query, Post, Body, UseGuards } from '@nestjs/common';
import { ImpactService } from './impact.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('impact')
export class ImpactController {
  constructor(private readonly impactService: ImpactService) {}

  @Get('global')
  async getGlobalImpact(@Query('year') yearStr?: string) {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    return this.impactService.calculateImpact(year, null);
  }

  @Get('summary')
  async getSummary(@Query('year') yearStr?: string) {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    return this.impactService.getImpactSummary(year);
  }

  @Get('constants')
  async getAnnualConstants(@Query('year') yearStr?: string) {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    return this.impactService.getAnnualConstants(year);
  }

  @Post('constants')
  @Roles(Role.AS)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateAnnualConstants(@Body() body: any) {
    return this.impactService.updateAnnualConstants(body);
  }

  @Get('history')
  async getGlobalHistory(@Query('year') yearStr?: string) {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    return this.impactService.getImpactHistory(year, null);
  }

  @Get('history/:instanceId')
  async getInstanceHistory(@Param('instanceId') instanceId: string, @Query('year') yearStr?: string) {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    return this.impactService.getImpactHistory(year, parseInt(instanceId, 10));
  }

  @Get('instance/:instanceId')
  async getInstanceImpact(@Param('instanceId') instanceId: string, @Query('year') yearStr?: string) {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    return this.impactService.calculateImpact(year, parseInt(instanceId, 10));
  }
}
