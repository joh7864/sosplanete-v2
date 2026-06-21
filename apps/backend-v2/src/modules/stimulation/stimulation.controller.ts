import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
  Request,
  Query,
  HttpCode,
} from '@nestjs/common';
import { StimulationService } from './stimulation.service';
import { AnimalUnlockService } from './animal-unlock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EcoBarRaceService } from './eco-bar-race.service';
import { ApiOperation } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';

@Controller('stimulation')
@UseGuards(JwtAuthGuard)
export class StimulationController {
  @Get('years')
  @ApiOperation({ summary: 'Liste des années scolaires disponibles' })
  getAvailableYears() {
    return this.stimulationService.getAvailableYears();
  }

  @Post('initialize-year')
  @ApiOperation({ summary: 'Initialiser une nouvelle année scolaire (global)' })
  initializeYear(@Body() data: { schoolYear: string }, @Request() req: any) {
    return this.stimulationService.initializeYear(data.schoolYear, req.user);
  }

  constructor(
    private readonly stimulationService: StimulationService,
    private readonly animalUnlockService: AnimalUnlockService,
    private readonly ecoBarRaceService: EcoBarRaceService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  @Post('whatsapp/send-report')
  @ApiOperation({ summary: 'Déclencher manuellement l\'envoi du rapport WhatsApp' })
  sendWhatsAppReport(@Query('schoolYear') schoolYear: string) {
    return this.whatsAppService.sendReport(schoolYear);
  }

  @Get('system-config')
  getSystemConfig(@Query('schoolYear') schoolYear: string) {
    return this.stimulationService.getSystemConfig(schoolYear);
  }

  @Put('system-config')
  updateSystemConfig(
    @Body() data: any,
    @Query('schoolYear') schoolYear: string,
    @Request() req: any,
  ) {
    return this.stimulationService.updateSystemConfig(
      data,
      schoolYear,
      req.user,
    );
  }

  @Get('game-config/:instanceId')
  getGameConfig(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
    @Request() req: any,
  ) {
    return this.stimulationService.getGameConfig(
      +instanceId,
      schoolYear,
      req.user,
    );
  }

  @Put('game-config/:instanceId')
  @HttpCode(410)
  updateGameConfig() {
    // DÉPRÉCIÉE — La config du jeu est désormais gérée exclusivement via PATCH /instances/:id
    // qui garantit l'atomicité via une transaction Prisma unique.
    // Cette route ne sera plus utilisée et sera supprimée dans une prochaine version.
    throw new Error(
      'Cette route est dépréciée. Utilisez PATCH /instances/:id pour modifier la configuration du jeu.',
    );
  }

  @Get('animals/:instanceId/history')
  getAnimalUnlockHistory(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.animalUnlockService.getUnlockHistory(+instanceId, sy);
  }

  @Get('animals/:instanceId/current')
  getCurrentAnimalUnlock(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.animalUnlockService.getCurrentUnlock(+instanceId, sy);
  }

  @Post('animals/:instanceId/recalculate')
  recalculateAnimals(
    @Param('instanceId') instanceId: string,
    @Query('schoolYear') schoolYear: string,
  ) {
    const sy = schoolYear || '2024-2025';
    return this.animalUnlockService.recalculateAllPeriods(+instanceId, sy);
  }

  // --- ECO-BAR-RACE ---

  @Get('eco-bar-race/history')
  getEcoBarRaceHistory(@Query('schoolYear') schoolYear: string) {
    const sy = schoolYear || '2024-2025';
    return this.ecoBarRaceService.getHistory(sy);
  }

  @Post('eco-bar-race/recalculate')
  recalculateEcoBarRace(@Query('schoolYear') schoolYear: string) {
    const sy = schoolYear || '2024-2025';
    return this.ecoBarRaceService.recalculateAllHistory(sy);
  }
}
