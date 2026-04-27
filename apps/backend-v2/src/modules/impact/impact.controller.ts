import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ImpactService } from './impact.service';

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
