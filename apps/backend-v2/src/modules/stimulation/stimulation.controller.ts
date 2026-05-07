import { Controller, Get, Post, Body, Param, UseGuards, Put, Request } from '@nestjs/common';
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
  getSystemConfig() {
    return this.stimulationService.getSystemConfig();
  }

  @Put('system-config')
  updateSystemConfig(@Body() data: any, @Request() req: any) {
    return this.stimulationService.updateSystemConfig(data, req.user);
  }

  @Get('game-config/:instanceId')
  getGameConfig(@Param('instanceId') instanceId: string, @Request() req: any) {
    return this.stimulationService.getGameConfig(+instanceId, req.user);
  }

  @Put('game-config/:instanceId')
  updateGameConfig(@Param('instanceId') instanceId: string, @Body() data: any, @Request() req: any) {
    return this.stimulationService.updateGameConfig(+instanceId, data, req.user);
  }

  @Get('animals/:instanceId/history')
  getAnimalUnlockHistory(@Param('instanceId') instanceId: string) {
    return this.animalUnlockService.getUnlockHistory(+instanceId);
  }

  @Get('animals/:instanceId/current')
  getCurrentAnimalUnlock(@Param('instanceId') instanceId: string) {
    return this.animalUnlockService.getCurrentUnlock(+instanceId);
  }

  @Post('animals/:instanceId/recalculate')
  recalculateAnimals(@Param('instanceId') instanceId: string) {
    return this.animalUnlockService.recalculateAllPeriods(+instanceId);
  }

  // --- ECO-BAR-RACE ---

  @Get('eco-bar-race/history')
  getEcoBarRaceHistory() {
    return this.ecoBarRaceService.getHistory();
  }

  @Post('eco-bar-race/recalculate')
  recalculateEcoBarRace() {
    return this.ecoBarRaceService.recalculateAllHistory();
  }
}
