import {
  Injectable,
  OnModuleInit,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChatGateway } from '../chat.gateway';
import { EasterEggDifficulty, EvoeEasterEgg } from '@prisma/client';

import {
  SubmitAnswerDto,
  ValidateTriggerDto,
  ShareEasterEggDto,
  CreateEasterEggDto,
  UpdateEasterEggDto,
  UpdateEasterEggSettingsDto,
  ResetEggProgressDto,
  ImportCatalogDto,
} from './dto/easter-egg.dto';

// Ré-export pour compatibilité des imports existants
export {
  SubmitAnswerDto,
  ValidateTriggerDto,
  ShareEasterEggDto,
  CreateEasterEggDto,
  UpdateEasterEggDto,
  UpdateEasterEggSettingsDto,
  ResetEggProgressDto,
  ImportCatalogDto,
};

import {
  normalizeAnswer,
  computeDefaultPauseCycles,
  getEffectivePauseCycles,
  getRequiredPlayersForEgg,
} from './easter-egg/easter-egg.utils';
import { EasterEggSeedService } from './easter-egg/easter-egg-seed.service';
import { EasterEggCycleService } from './easter-egg/easter-egg-cycle.service';
import { EasterEggCatalogService } from './easter-egg/easter-egg-catalog.service';
import { EasterEggInstanceService } from './easter-egg/easter-egg-instance.service';
import { EasterEggTrackingService } from './easter-egg/easter-egg-tracking.service';
import { EasterEggChronoService } from './easter-egg/easter-egg-chrono.service';
import { EasterEggPlayerService } from './easter-egg/easter-egg-player.service';

/**
 * Service Façade pour le module Easter Eggs.
 * Regroupe et délègue les opérations vers 7 sous-services spécialisés :
 * - EasterEggSeedService : initialisation et seeding du catalogue
 * - EasterEggCycleService : résolution du cycle et des prérequis
 * - EasterEggCatalogService : CRUD et export/import du catalogue admin
 * - EasterEggInstanceService : pilotage des instances, forçage d'indices, clôtures
 * - EasterEggTrackingService : cockpit et suivi en direct
 * - EasterEggChronoService : Chrono-Egg, rattrapages passés et Méta-Énigme
 * - EasterEggPlayerService : progression joueur, validation, indices et leaderboard
 */
@Injectable()
export class EasterEggService implements OnModuleInit {
  private readonly logger = new Logger(EasterEggService.name);

  public readonly seedService: EasterEggSeedService;
  public readonly cycleService: EasterEggCycleService;
  public readonly catalogService: EasterEggCatalogService;
  public readonly instanceService: EasterEggInstanceService;
  public readonly trackingService: EasterEggTrackingService;
  public readonly chronoService: EasterEggChronoService;
  public readonly playerService: EasterEggPlayerService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly chatGateway?: ChatGateway,
    @Optional() seedService?: EasterEggSeedService,
    @Optional() cycleService?: EasterEggCycleService,
    @Optional() catalogService?: EasterEggCatalogService,
    @Optional() instanceService?: EasterEggInstanceService,
    @Optional() trackingService?: EasterEggTrackingService,
    @Optional() chronoService?: EasterEggChronoService,
    @Optional() playerService?: EasterEggPlayerService,
  ) {
    this.cycleService = cycleService ?? new EasterEggCycleService(prisma);
    this.seedService = seedService ?? new EasterEggSeedService(prisma);
    this.catalogService = catalogService ?? new EasterEggCatalogService(prisma);
    this.instanceService = instanceService ?? new EasterEggInstanceService(prisma, this.cycleService, chatGateway);
    this.trackingService = trackingService ?? new EasterEggTrackingService(prisma, this.cycleService);
    this.chronoService = chronoService ?? new EasterEggChronoService(prisma, this.cycleService);
    this.playerService = playerService ?? new EasterEggPlayerService(prisma, this.cycleService, chatGateway);
  }

  async onModuleInit() {
    await this.seedDefaultEasterEggs();
  }

  async seedDefaultEasterEggs() {
    return this.seedService.seedDefaultEasterEggs();
  }

  // --- Joueur : Contexte, Découvertes, Validation & Partage ---

  async getPlayerContext(childId: number) {
    return this.playerService.getPlayerContext(childId);
  }

  async getActiveEasterEgg(childId: number) {
    return this.playerService.getActiveEasterEgg(childId);
  }

  async recordInteraction(childId: number, easterEggId: number) {
    return this.playerService.recordInteraction(childId, easterEggId);
  }

  async verifyAnswer(childId: number, dto: SubmitAnswerDto) {
    return this.playerService.verifyAnswer(childId, dto);
  }

  async validateTrigger(childId: number, dto: ValidateTriggerDto) {
    return this.playerService.validateTrigger(childId, dto);
  }

  async shareEasterEgg(childId: number, dto: ShareEasterEggDto) {
    return this.playerService.shareEasterEgg(childId, dto);
  }

  async getDetectiveLeaderboard(instanceYearId?: number) {
    return this.playerService.getDetectiveLeaderboard(instanceYearId);
  }

  async getMyDiscoveredEasterEggs(childId: number) {
    return this.playerService.getMyDiscoveredEasterEggs(childId);
  }

  // --- Chrono-Egg & Méta-Énigme ---

  async getChronoEggArchive(childId: number) {
    return this.chronoService.getChronoEggArchive(childId);
  }

  async reopenPeriodEgg(childId: number, periodId: number) {
    return this.chronoService.reopenPeriodEgg(childId, periodId);
  }

  async submitMetaEnigmaCode(childId: number, code: string) {
    return this.chronoService.submitMetaEnigmaCode(childId, code);
  }

  async getAdminChronoFrise(instanceYearId: number) {
    return this.chronoService.getAdminChronoFrise(instanceYearId);
  }

  // --- Catalogue Admin (CRUD) ---

  async getAdminCatalog() {
    return this.catalogService.getAdminCatalog();
  }

  async createEasterEgg(dto: CreateEasterEggDto) {
    return this.catalogService.createEasterEgg(dto);
  }

  async updateEasterEgg(id: number, dto: UpdateEasterEggDto) {
    return this.catalogService.updateEasterEgg(id, dto);
  }

  async deleteEasterEgg(id: number) {
    return this.catalogService.deleteEasterEgg(id);
  }

  async reorderCatalog(orderedIds: number[]) {
    return this.catalogService.reorderCatalog(orderedIds);
  }

  async exportCatalog() {
    return this.catalogService.exportCatalog();
  }

  async importCatalog(dto: ImportCatalogDto) {
    return this.catalogService.importCatalog(dto);
  }

  // --- Instance & Paramètres Admin ---

  async updateSettings(instanceYearId: number, dto: UpdateEasterEggSettingsDto) {
    return this.instanceService.updateSettings(instanceYearId, dto);
  }

  async openInstanceEgg(
    instanceYearId: number,
    easterEggId: number,
    closePrevious: boolean = true,
  ) {
    return this.instanceService.openInstanceEgg(instanceYearId, easterEggId, closePrevious);
  }

  async closeInstanceEgg(instanceYearId: number, easterEggId?: number) {
    return this.instanceService.closeInstanceEgg(instanceYearId, easterEggId);
  }

  async forceInstanceHint(
    instanceYearId: number,
    easterEggId?: number,
    teamId?: number,
    revoke: boolean = false,
  ) {
    return this.instanceService.forceInstanceHint(instanceYearId, easterEggId, teamId, revoke);
  }

  async resetEggProgress(dto: ResetEggProgressDto) {
    return this.instanceService.resetEggProgress(dto);
  }

  // --- Suivi & Cockpit Admin ---

  async getAdminTracking(instanceYearId: number, targetEggId?: number) {
    return this.trackingService.getAdminTracking(instanceYearId, targetEggId);
  }

  // --- Fonctions pures & helpers (compatibilité descendante) ---

  public normalizeAnswer(str: string): string {
    return normalizeAnswer(str);
  }

  public computeDefaultPauseCycles(totalCycles: number): number[] {
    return computeDefaultPauseCycles(totalCycles);
  }

  public getEffectivePauseCycles(
    instanceYear: { easterEggPauseCycles?: number[] | null },
    totalCycles: number,
  ): number[] {
    return getEffectivePauseCycles(instanceYear, totalCycles);
  }

  public getRequiredPlayersForEgg(
    egg?: { complexity?: EasterEggDifficulty | null } | null,
    teamTotalPlayers?: number,
    defaultFallback = 2,
  ): number {
    return getRequiredPlayersForEgg(egg, teamTotalPlayers, defaultFallback);
  }

  // Méthodes privées conservées pour compatibilité avec les tests unitaires existants
  private resolveEggForInstance(
    instanceYearId: number,
    periods: Array<{ id: number }>,
    currentPeriodIndex: number,
    frequency: number,
    activeEggs: EvoeEasterEgg[],
    childId?: number,
  ) {
    return this.cycleService.resolveEggForInstance(
      instanceYearId,
      periods,
      currentPeriodIndex,
      frequency,
      activeEggs,
      childId,
    );
  }

  private checkPrerequisites(
    egg: { prerequisiteType?: string | null; prerequisiteConfig?: any },
    childId: number,
    periodIds: number | number[],
  ) {
    return this.cycleService.checkPrerequisites(egg, childId, periodIds);
  }
}
