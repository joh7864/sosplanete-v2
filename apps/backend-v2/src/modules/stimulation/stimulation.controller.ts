import { Controller, Get, Post, Body, Param, UseGuards, Put, Request, Query } from '@nestjs/common';
import { StimulationService } from './stimulation.service';
import { AnimalUnlockService } from './animal-unlock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EcoBarRaceService } from './eco-bar-race.service';

@Controller('stimulation')
@UseGuards(JwtAuthGuard)
export class StimulationController {
  constructor(
    private readonly stimulationService: StimulationService,
    private readonly animalUnlockService: AnimalUnlockService,
    private readonly ecoBarRaceService: EcoBarRaceService,
  ) {}

  @Get('system-config')
  getSystemConfig(@Query('schoolYear') schoolYear: string) {
    return this.stimulationService.getSystemConfig(schoolYear);
  }

  @Put('system-config')
  updateSystemConfig(@Body() data: any, @Query('schoolYear') schoolYear: string, @Request() req: any) {
    return this.stimulationService.updateSystemConfig(data, schoolYear, req.user);
  }

  @Get('game-config/:instanceId')
  getGameConfig(@Param('instanceId') instanceId: string, @Query('schoolYear') schoolYear: string, @Request() req: any) {
    return this.stimulationService.getGameConfig(+instanceId, schoolYear, req.user);
  }

  @Put('game-config/:instanceId')
  updateGameConfig(@Param('instanceId') instanceId: string, @Body() data: any, @Query('schoolYear') schoolYear: string, @Request() req: any) {
    return this.stimulationService.updateGameConfig(+instanceId, data, schoolYear, req.user);
  }

  @Get('animals/:instanceId/history')
  getAnimalUnlockHistory(@Param('instanceId') instanceId: string, @Query('schoolYear') schoolYear: string) {
    const sy = schoolYear || "2024-2025";
    return this.animalUnlockService.getUnlockHistory(+instanceId, sy);
  }

  @Get('animals/:instanceId/current')
  getCurrentAnimalUnlock(@Param('instanceId') instanceId: string, @Query('schoolYear') schoolYear: string) {
    const sy = schoolYear || "2024-2025";
    return this.animalUnlockService.getCurrentUnlock(+instanceId, sy);
  }

  @Post('animals/:instanceId/recalculate')
  recalculateAnimals(@Param('instanceId') instanceId: string, @Query('schoolYear') schoolYear: string) {
    const sy = schoolYear || "2024-2025";
    return this.animalUnlockService.recalculateAllPeriods(+instanceId, sy);
  }

  // --- ECO-BAR-RACE ---

  @Get('eco-bar-race/history')
  getEcoBarRaceHistory(@Query('schoolYear') schoolYear: string) {
    const sy = schoolYear || "2024-2025";
    return this.ecoBarRaceService.getHistory(sy);
  }

  @Post('eco-bar-race/recalculate')
  recalculateEcoBarRace(@Query('schoolYear') schoolYear: string) {
    const sy = schoolYear || "2024-2025";
    return this.ecoBarRaceService.recalculateAllHistory(sy);
  }
}
