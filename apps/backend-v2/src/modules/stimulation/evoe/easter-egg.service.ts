import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChatGateway } from '../chat.gateway';
import {
  EasterEggTriggerType,
  EasterEggDifficulty,
  EvoeEasterEgg,
} from '@prisma/client';

export interface SubmitAnswerDto {
  easterEggId: number;
  answer: string;
  resolutionTimeSeconds?: number;
}

export interface ValidateTriggerDto {
  easterEggId: number;
  triggerType: EasterEggTriggerType;
  resolutionTimeSeconds?: number;
  metadata?: any;
}

export interface ShareEasterEggDto {
  easterEggId: number;
  targetType: 'TEAM' | 'PLAYER' | 'ALL';
  targetPlayerId?: number;
  shareType: 'CLUE' | 'SOLUTION';
  customText?: string;
}

export interface CreateEasterEggDto {
  code: string;
  title: string;
  prerequisiteType?: string;
  prerequisiteConfig?: any;
  crypticMessage: string;
  explicitHint?: string | null;
  hintDelayMinutes?: number;
  mascotDurationSeconds?: number;
  triggerAction?: string | null;

  senderLore?: string | null;
  clues?: string[];
  imageUrl?: string | null;
  triggerType?: EasterEggTriggerType;
  expectedAnswer?: string | null;
  caseSensitive?: boolean;
  triggerConfig?: any;
  complexity?: EasterEggDifficulty;
  rewardPointsIT?: number;
  specialReward?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface UpdateEasterEggDto extends Partial<CreateEasterEggDto> {}

export interface UpdateEasterEggSettingsDto {
  easterEggsEnabled?: boolean;
  easterEggFrequency?: number;
  easterEggRequiredPlayers?: number;
  easterEggMaxWinningTeams?: number;
  metaEnigmaSecretWord?: string;
  metaEnigmaPeriodGlyphs?: any;
}

const DEFAULT_EASTER_EGGS: CreateEasterEggDto[] = [
  {
    code: 'EE_CADENAS_4CH_ARCHE',
    title: "Le Cadenas à 4 Chiffres de l'Arche",
    crypticMessage:
      "Transmission prioritaire 2070 : Nos scientifiques ont scellé une capsule d'énergie pure dans l'Arche. Pour l'ouvrir, déduisez le code secret à 4 chiffres grâce aux règles d'exclusion de l'hologramme !",
    clues: [
      'Le code est composé de 4 chiffres uniques.',
      'Croisez les règles logiques du schéma pour éliminer les faux chiffres.',
    ],
    explicitHint:
      "Indice Décrypté 2070 : La règle 4 est la clé de voûte : elle élimine 9, 5, 1 et 3 de toutes les combinaisons. En les barrant, croisez les règles 1, 2 et 5 pour déduire la place exacte de chaque chiffre !",
    imageUrl: '/easter-eggs/cadenas_4ch.svg',
    triggerType: EasterEggTriggerType.RIDDLE_ANSWER_INPUT,
    expectedAnswer: '4207',
    caseSensitive: false,
    complexity: EasterEggDifficulty.MEDIUM,
    rewardPointsIT: 60,
    orderIndex: 1,
    isActive: true,
  },
  {
    code: 'EE_KONAMI_80S',
    title: 'Le Protocole des Anciens',
    crypticMessage:
      "Depuis l'an 2070, nos archivistes ont exhumé un antique code de commande pré-spatial : une danse sacrée de 10 touches directionnelles et de lettres...",
    clues: [
      'Une célèbre séquence de jeu vidéo des années 80.',
      'Haut, haut, bas, bas, gauche, droite...',
    ],
    triggerType: EasterEggTriggerType.KONAMI_CODE,
    complexity: EasterEggDifficulty.EASY,
    rewardPointsIT: 40,
    orderIndex: 2,
    isActive: true,
  },
  {
    code: 'EE_MATRIX_COMM_LINK',
    title: "La Matrice de l'Arche",
    crypticMessage:
      'Nos liaisons subissent une interférence quantique verte. Tapez le protocole d’infiltration dans la console du Comm-Link pour stabiliser le flux...',
    clues: [
      'Une commande commençant par un slash dans le Comm-Link.',
      'Le nom d’une célèbre simulation cinématographique en 6 lettres : /m...',
    ],
    triggerType: EasterEggTriggerType.COMM_LINK_COMMAND,
    triggerConfig: { command: '/matrix' },
    complexity: EasterEggDifficulty.EASY,
    rewardPointsIT: 40,
    orderIndex: 3,
    isActive: true,
  },
  {
    code: 'EE_OVERHEAT_EARTH_2026',
    title: 'Le Réveil du Cœur 2026',
    crypticMessage:
      'Les capteurs de l’Arche captent une onde de résonance lorsque l’on stimule avec insistance le globe terrestre de votre camp de base 2026...',
    clues: [
      'Le globe terrestre en 3D au centre du camp de base 2026.',
      'Cliquez 7 fois consécutives et rapides dessus.',
    ],
    triggerType: EasterEggTriggerType.CLICK_REPEATED,
    triggerConfig: { target: 'globe2026', clicks: 7 },
    complexity: EasterEggDifficulty.MEDIUM,
    rewardPointsIT: 60,
    orderIndex: 4,
    isActive: true,
  },
  {
    code: 'EE_ANTIGRAVITY',
    title: 'L’Apesanteur Artificielle',
    crypticMessage:
      'Un mot de passe inverse temporairement les générateurs gravitationnels de la station pour faire flotter l’équipage...',
    clues: [
      'Une commande dans le Comm-Link en rapport avec la gravité zéro.',
      'Essayez /antigravity dans le chat ou secouez votre smartphone.',
    ],
    triggerType: EasterEggTriggerType.COMM_LINK_COMMAND,
    triggerConfig: { command: '/antigravity' },
    complexity: EasterEggDifficulty.MEDIUM,
    rewardPointsIT: 60,
    orderIndex: 5,
    isActive: true,
  },
  {
    code: 'EE_FIVE_NOTES_PROFILE',
    title: 'La Fréquence des 5 Échos',
    crypticMessage:
      'Un schéma d’ondes harmoniques relie vos 3 bilans de ressources vitales dans votre fiche profil d’agent...',
    clues: [
      'Ouvrez votre fiche profil d’agent.',
      'Cliquez dans l’ordre : Carbone ➔ Eau ➔ Déchets ➔ Carbone ➔ Eau.',
    ],
    triggerType: EasterEggTriggerType.METRIC_SEQUENCE,
    triggerConfig: {
      sequence: ['carbon', 'water', 'waste', 'carbon', 'water'],
    },
    complexity: EasterEggDifficulty.MEDIUM,
    rewardPointsIT: 70,
    orderIndex: 6,
    isActive: true,
  },
  {
    code: 'EE_LOGO_ROCKET',
    title: 'L’Impulsion du Grand Décollage',
    crypticMessage:
      'Le sceau supérieur d’EVOE renferme une poussée d’urgence : maintenez la pression pour libérer la propulsion...',
    clues: [
      'Le logo EVOE en haut de l’écran.',
      'Maintenez le clic ou l’appui pendant 3 secondes sans relâcher.',
    ],
    triggerType: EasterEggTriggerType.LOGO_HOLD,
    triggerConfig: { durationSeconds: 3 },
    complexity: EasterEggDifficulty.MEDIUM,
    rewardPointsIT: 60,
    orderIndex: 7,
    isActive: true,
  },
  {
    code: 'EE_CENTRAL_CONSOLE_2026',
    title: 'Le Spectre de la Console Centrale',
    crypticMessage:
      'La console holographique du Codex renferme un diagnostic crypté si vous l’interrogez 5 fois de suite avec persistance...',
    clues: [
      'Au centre du QG 2026, la console holographique du Codex.',
      'Cliquez 5 fois rapidement dessus.',
    ],
    triggerType: EasterEggTriggerType.CLICK_REPEATED,
    triggerConfig: { target: 'codexConsole', clicks: 5 },
    complexity: EasterEggDifficulty.MEDIUM,
    rewardPointsIT: 60,
    orderIndex: 8,
    isActive: true,
  },
  {
    code: 'EE_TEMPORAL_1985',
    title: 'Le Paradoxe Temporel 1985',
    crypticMessage:
      'Doc et Marty ont laissé une commande légendaire dans nos ordinateurs, ou un défi de vitesse entre les époques...',
    clues: [
      'Saisissez /1985 dans le Comm-Link, ou basculez 5 fois entre 2026 et 2070 en moins de 15 secondes.',
    ],
    triggerType: EasterEggTriggerType.COMM_LINK_COMMAND,
    triggerConfig: { command: '/1985', eraSwitches: 5, maxSeconds: 15 },
    complexity: EasterEggDifficulty.HARD,
    rewardPointsIT: 90,
    orderIndex: 9,
    isActive: true,
  },
  {
    code: 'EE_CONSTELLATION_3D',
    title: 'Le Message de la Constellation',
    crypticMessage:
      'Une anomalie stellaire triangulaire clignote dans les coordonnées de l’espace profond...',
    clues: [
      'Dans le ciel étoilé en 3D, 3 étoiles scintillantes forment un triangle.',
      'Cliquez sur ces 3 points lumineux pour faire apparaître un visiteur.',
    ],
    triggerType: EasterEggTriggerType.SCREEN_EDGE,
    triggerConfig: { stars: 3 },
    complexity: EasterEggDifficulty.HARD,
    rewardPointsIT: 100,
    orderIndex: 10,
    isActive: true,
  },
  {
    code: 'EE_PARTY_DISCO',
    title: 'La Fête Orbitale',
    crypticMessage:
      'Même à 400 km d’altitude, nos équipages célèbrent vos victoires avec un mot de passe festif...',
    clues: ['Tapez /party dans le Comm-Link pour allumer la boule à facettes.'],
    triggerType: EasterEggTriggerType.COMM_LINK_COMMAND,
    triggerConfig: { command: '/party' },
    complexity: EasterEggDifficulty.EASY,
    rewardPointsIT: 40,
    orderIndex: 11,
    isActive: true,
  },
];

@Injectable()
export class EasterEggService implements OnModuleInit {
  private readonly logger = new Logger(EasterEggService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly chatGateway?: ChatGateway,
  ) {}

  async onModuleInit() {
    await this.seedDefaultEasterEggs();
    try {
      await this.prisma.evoeEasterEgg.updateMany({
        where: { imageUrl: { contains: 'cadenas_4ch.webp' } },
        data: { imageUrl: '/easter-eggs/cadenas_4ch.svg' },
      });
    } catch {
      // ignore
    }
  }

  async seedDefaultEasterEggs() {
    try {
      const count = await this.prisma.evoeEasterEgg.count();
      if (count === 0) {
        this.logger.log('Initialisation du catalogue d’Easter Eggs par défaut (11 énigmes)...');
        for (const egg of DEFAULT_EASTER_EGGS) {
          await this.prisma.evoeEasterEgg.create({
            data: {
              code: egg.code,
              title: egg.title,
              crypticMessage: egg.crypticMessage || '',
              explicitHint: egg.explicitHint || null,
              imageUrl: egg.imageUrl || null,
              triggerType: egg.triggerType,
              expectedAnswer: egg.expectedAnswer || null,
              caseSensitive: egg.caseSensitive ?? false,
              triggerConfig: egg.triggerConfig || null,
              complexity: egg.complexity || EasterEggDifficulty.MEDIUM,
              rewardPointsIT: egg.rewardPointsIT || 50,
              orderIndex: egg.orderIndex || 0,
              isActive: egg.isActive ?? true,
            },
          });
        }
        this.logger.log('Catalogue d’Easter Eggs initialisé avec succès.');
      }
    } catch (e: any) {
      this.logger.warn(`Erreur lors du seeding des Easter Eggs: ${e.message}`);
    }
  }

  async getPlayerContext(childId: number) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        group: {
          include: {
            team: {
              include: {
                groups: {
                  include: { children: true },
                },
                instanceYear: {
                  include: {
                    periods: { orderBy: { startDate: 'asc' } },
                    teams: {
                      include: {
                        groups: {
                          include: { children: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!child) throw new NotFoundException('Joueur introuvable');
    const team = child.group?.team;
    if (!team) throw new NotFoundException('Équipe du joueur introuvable');
    const instanceYear = team.instanceYear;
    if (!instanceYear) throw new NotFoundException('Année d’instance introuvable');

    const now = new Date();
    const periods = instanceYear.periods || [];
    let currentPeriod = periods.find(p => p.isOpen);
    if (!currentPeriod) {
      currentPeriod =
        periods.find(p => new Date(p.startDate) <= now && new Date(p.endDate) >= now) ||
        periods[periods.length - 1];
    }

    const currentPeriodIndex = currentPeriod
      ? periods.findIndex(p => p.id === currentPeriod!.id) + 1
      : 1;

    return {
      child,
      team,
      instanceYear,
      periods,
      currentPeriod,
      currentPeriodIndex,
    };
  }

  /**
   * Détermine l'Easter Egg actif pour une promotion selon la règle stricte :
   * - Un Easter Egg reste actif pendant toute la durée du cycle de fréquence (ex: 2 périodes).
   * - On ne passe au suivant que dans "frequency" périodes (ex: toutes les 2 périodes),
   * - SAUF demande explicite de l'AM (instance manuelle non clôturée).
   * - Au changement de cycle, si aucun joueur n'a découvert l'œuf précédent, il est reconduit automatiquement.
   */
  private async resolveEggForInstance(
    instanceYearId: number,
    periods: any[],
    currentPeriodIndex: number,
    frequency: number,
    activeEggs: EvoeEasterEgg[],
    childId?: number,
  ): Promise<{
    currentEgg: EvoeEasterEgg | null;
    explicitInstance: any | null;
    cycleIndex: number;
    cyclePeriodIds: number[];
    periodStart: any;
    periodEnd: any;
    multiEggProgress?: {
      total: number;
      solved: number;
      currentIndex: number;
    };
  }> {
    const cycleIndex = Math.floor(Math.max(0, currentPeriodIndex - 1) / frequency);
    const cycleStartPeriodIndex = cycleIndex * frequency;
    const cycleEndPeriodIndex = Math.min(
      periods.length - 1,
      cycleStartPeriodIndex + frequency - 1,
    );

    const periodStart = periods[cycleStartPeriodIndex] || periods[0];
    const periodEnd = periods[cycleEndPeriodIndex] || periods[periods.length - 1];

    const cyclePeriods = periods.slice(cycleStartPeriodIndex, cycleEndPeriodIndex + 1);
    const cyclePeriodIds = cyclePeriods.map((p) => p.id);
    const currentPeriod = periods[currentPeriodIndex - 1] || periods[0];

    // 1. Demande explicite de l'AM pour cette instance (non clôturée)
    const activeInstances = await this.prisma.evoeEasterEggInstance.findMany({
      where: {
        instanceYearId,
        isClosed: false,
        ...(currentPeriod
          ? {
              OR: [
                { periodStartId: currentPeriod.id },
                { periodEndId: currentPeriod.id },
                { periodStartId: { in: cyclePeriodIds } },
              ],
            }
          : {}),
      },
      include: { easterEgg: true },
      orderBy: { id: 'asc' },
    });

    if (activeInstances.length > 0) {
      const validInstances = activeInstances.filter(
        (inst) => inst.easterEgg && inst.easterEgg.isActive,
      );
      const totalCount = Math.max(1, validInstances.length);
      let solvedCount = 0;
      let currentEgg: EvoeEasterEgg | null = null;
      let explicitInstance: any | null = null;

      if (childId) {
        // S'il y a plusieurs Easter Eggs dans la période :
        // Dès que le premier est résolu par le joueur, on passe au suivant dans la période !
        for (const inst of validInstances) {
          const hasDiscovered = await this.prisma.evoeEasterEggPlayerProgress.count({
            where: {
              easterEggId: inst.easterEggId,
              childId,
              discoveredAt: { not: null },
            },
          });

          if (hasDiscovered > 0) {
            solvedCount++;
          } else if (!currentEgg) {
            currentEgg = inst.easterEgg;
            explicitInstance = inst;
          }
        }
      }

      // Si tous sont résolus par le joueur ou pour la vue admin globale : on prend le dernier
      if (!currentEgg && validInstances.length > 0) {
        const targetInst = validInstances[validInstances.length - 1];
        currentEgg = targetInst.easterEgg;
        explicitInstance = targetInst;
      }

      const currentIndex = Math.min(totalCount, solvedCount + 1);

      return {
        currentEgg,
        explicitInstance,
        cycleIndex,
        cyclePeriodIds,
        periodStart,
        periodEnd,
        multiEggProgress: {
          total: totalCount,
          solved: solvedCount,
          currentIndex,
        },
      };
    }

    // 2. Vérifier si l'AM a expressément clôturé tout Easter Egg pour cette période
    if (currentPeriod) {
      const explicitClosedThisPeriod = await this.prisma.evoeEasterEggInstance.findFirst({
        where: {
          instanceYearId,
          isClosed: true,
          periodStartId: currentPeriod.id,
          closedAt: { not: null },
        },
      });

      if (explicitClosedThisPeriod) {
        // Période clôturée sans énigme : l'œuf n'apparaît pas du tout sur cette période
        return {
          currentEgg: null,
          explicitInstance: null,
          cycleIndex,
          cyclePeriodIds,
          periodStart,
          periodEnd,
        };
      }
    }

    if (activeEggs.length === 0) {
      return {
        currentEgg: null,
        explicitInstance: null,
        cycleIndex,
        cyclePeriodIds,
        periodStart,
        periodEnd,
      };
    }

    // 2. Calendrier naturel : recherche du 1er œuf non consommé lors des cycles PASSÉS
    const priorPeriodIds = periods
      .slice(0, cycleStartPeriodIndex)
      .map((p) => p.id);

    const instanceChildren = await this.prisma.child.findMany({
      where: { group: { team: { instanceYearId } } },
      select: { id: true },
    });
    const instanceChildIds = instanceChildren.map((c) => c.id);

    let currentEgg: EvoeEasterEgg | null = null;

    if (priorPeriodIds.length === 0) {
      // 1er cycle de la saison : 1er œuf du catalogue
      currentEgg = activeEggs[0];
    } else {
      // Cycles ultérieurs : on recherche dans l'ordre le premier œuf non résolu dans les cycles passés
      for (const egg of activeEggs) {
        const consumedInPriorCycles = await this.prisma.evoeEasterEggPlayerProgress.count({
          where: {
            easterEggId: egg.id,
            childId: instanceChildIds.length > 0 ? { in: instanceChildIds } : undefined,
            periodId: { in: priorPeriodIds },
            discoveredAt: { not: null },
          },
        });

        if (consumedInPriorCycles === 0) {
          currentEgg = egg;
          break;
        }
      }

      if (!currentEgg) {
        currentEgg = activeEggs[cycleIndex % activeEggs.length];
      }
    }

    return {
      currentEgg,
      explicitInstance: null,
      cycleIndex,
      cyclePeriodIds,
      periodStart,
      periodEnd,
      multiEggProgress: {
        total: 1,
        solved: 0,
        currentIndex: 1,
      },
    };
  }

  async getActiveEasterEgg(childId: number) {
    const { child, team, instanceYear, periods, currentPeriod, currentPeriodIndex } =
      await this.getPlayerContext(childId);

    if (!instanceYear.easterEggsEnabled) {
      return {
        enabled: false,
        message: 'Les Easter Eggs sont désactivés sur cet espace.',
      };
    }

    const frequency = Math.max(1, instanceYear.easterEggFrequency || 2);
    const requiredPlayers = Math.max(1, instanceYear.easterEggRequiredPlayers || 2);
    const maxWinningTeams = instanceYear.easterEggMaxWinningTeams || 0;

    // Récupération de tous les Easter Eggs actifs classés par orderIndex
    const activeEggs = await this.prisma.evoeEasterEgg.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    if (activeEggs.length === 0) {
      return {
        enabled: true,
        hasActiveEgg: false,
        message: 'Aucune énigme programmée pour le moment.',
      };
    }

    const {
      currentEgg,
      explicitInstance,
      cycleIndex,
      cyclePeriodIds,
      periodStart,
      periodEnd,
      multiEggProgress: rawMultiProgress,
    } = await this.resolveEggForInstance(
      instanceYear.id,
      periods,
      currentPeriodIndex,
      frequency,
      activeEggs,
      child.id,
    );

    if (!currentEgg) {
      return {
        enabled: true,
        hasActiveEgg: false,
        message: 'Aucune énigme programmée pour le moment.',
      };
    }

    const effectivePeriodIds =
      cyclePeriodIds.length > 0
        ? cyclePeriodIds
        : (currentPeriod ? [currentPeriod.id] : []);

    // Vérifier si le joueur a déjà découvert cette énigme dans le cycle en cours
    const playerProgress = await this.prisma.evoeEasterEggPlayerProgress.findFirst({
      where: {
        easterEggId: currentEgg.id,
        childId: child.id,
        periodId: { in: effectivePeriodIds },
        discoveredAt: { not: null },
      },
      orderBy: { id: 'desc' },
    });

    // Effectif de l'équipe (tous groupes confondus)
    const teamChildren = team.groups.flatMap(g => g.children);
    const teamTotalPlayers = teamChildren.length;
    const teamChildIds = teamChildren.map(c => c.id);

    // Joueurs de l'équipe ayant validé l'énigme pour ce cycle
    const teamDiscoveries = await this.prisma.evoeEasterEggPlayerProgress.findMany({
      where: {
        easterEggId: currentEgg.id,
        periodId: { in: effectivePeriodIds },
        childId: { in: teamChildIds },
        discoveredAt: { not: null },
      },
      include: {
        child: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
          },
        },
      },
    });

    // Vérifier si l'équipe a déjà validé la récompense pour cette énigme et ce cycle
    const teamReward = await this.prisma.evoeEasterEggTeamReward.findFirst({
      where: {
        easterEggId: currentEgg.id,
        teamId: team.id,
        periodId: { in: effectivePeriodIds },
      },
    });

    // Nombre d'équipes ayant déjà gagné pour ce cycle
    const winningTeamsCount = await this.prisma.evoeEasterEggTeamReward.count({
      where: {
        easterEggId: currentEgg.id,
        team: { instanceYearId: instanceYear.id },
        periodId: { in: effectivePeriodIds },
      },
    });

    const isMaxWinningReached =
      maxWinningTeams > 0 &&
      winningTeamsCount >= maxWinningTeams &&
      !teamReward;

    // --- Immersive Scenario Logic ---
    const nowTime = new Date();
    const isInteractable = await this.checkPrerequisites(
      currentEgg,
      child.id,
      currentPeriod ? currentPeriod.id : 0,
    );

    // Si les prérequis ne sont plus atteints (ex: actions désimpulsées par le joueur) :
    // On réinitialise l'interaction pour revenir strictement à l'état initial (œuf inerte, pas de 2ème indice)
    if (!isInteractable && playerProgress?.firstInteractionAt) {
      await this.prisma.evoeEasterEggPlayerProgress.update({
        where: { id: playerProgress.id },
        data: { firstInteractionAt: null },
      });
      playerProgress.firstInteractionAt = null;
    }

    let isExplicitHintVisible = false;
    if (explicitInstance?.forceHint) {
      isExplicitHintVisible = true;
    } else if (isInteractable && playerProgress?.firstInteractionAt) {
      const delayMs = (currentEgg.hintDelayMinutes || 120) * 60 * 1000;
      if (nowTime.getTime() - playerProgress.firstInteractionAt.getTime() >= delayMs) {
        isExplicitHintVisible = true;
      }
    }

    return {
      enabled: true,
      hasActiveEgg: true,
      easterEgg: {
        id: currentEgg.id,
        code: currentEgg.code,
        title: currentEgg.title,
        crypticMessage: currentEgg.crypticMessage,
        explicitHint: currentEgg.explicitHint,
        mascotDurationSeconds: currentEgg.mascotDurationSeconds,
        triggerAction: currentEgg.triggerAction,
        isInteractable,
        isExplicitHintVisible,
        clues: currentEgg.clues,
        imageUrl: currentEgg.imageUrl,
        triggerType: currentEgg.triggerType,
        complexity: currentEgg.complexity,
        rewardPointsIT: currentEgg.rewardPointsIT,
        orderIndex: currentEgg.orderIndex,
        triggerConfig:
          currentEgg.triggerType === EasterEggTriggerType.RIDDLE_ANSWER_INPUT
            ? null
            : currentEgg.triggerConfig,
      },
      period: {
        id: currentPeriod ? currentPeriod.id : 0,
        periodStartId: periodStart ? periodStart.id : 0,
        periodEndId: periodEnd ? periodEnd.id : 0,
        periodIndex: currentPeriodIndex,
        cycleIndex: cycleIndex + 1,
        frequency,
      },
      playerProgress: {
        isDiscovered: !!playerProgress?.discoveredAt,
        firstInteractionAt: playerProgress?.firstInteractionAt || null,
        discoveredAt: playerProgress?.discoveredAt || null,
        resolutionTimeSeconds: playerProgress?.resolutionTimeSeconds || null,
      },
      teamProgress: {
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        discoveredCount: teamDiscoveries.length,
        totalPlayers: teamTotalPlayers,
        requiredPlayers,
        isTeamRewarded: !!teamReward,
        rewardRank: teamReward?.rank || null,
        awardedPointsIT: teamReward?.awardedPointsIT || null,
        isMaxWinningReached,
        winningTeamsCount,
        maxWinningTeams,
        hasChronoEgg: !!team.hasChronoEgg,
        hasRosettaStone: !!team.hasRosettaStone,
        discoveredPlayers: teamDiscoveries.map(d => ({
          childId: d.child.id,
          pseudo: d.child.pseudo,
          avatar: d.child.avatar,
          discoveredAt: d.discoveredAt,
        })),
      },
      multiEggProgress: {
        total: rawMultiProgress?.total || 1,
        solved:
          rawMultiProgress && rawMultiProgress.total > 1
            ? rawMultiProgress.solved
            : playerProgress?.discoveredAt
              ? 1
              : 0,
        currentIndex:
          rawMultiProgress && rawMultiProgress.total > 1
            ? rawMultiProgress.currentIndex
            : 1,
      },
      metaEnigma: {
        hasChronoEgg: !!team.hasChronoEgg,
        hasRosettaStone: !!team.hasRosettaStone,
        isMetaEnigmaUnlocked: !!team.isMetaEnigmaUnlocked,
        secretWordLength: instanceYear.metaEnigmaSecretWord?.length || 7,
        periodGlyphIndex: currentPeriodIndex,
      },
    };
  }

  /**
   * Vérifie si les prérequis de déverrouillage de l'énigme sont satisfaits par le joueur.
   */
  private async checkPrerequisites(
    egg: { prerequisiteType?: string | null; prerequisiteConfig?: any },
    childId: number,
    periodId: number,
  ): Promise<boolean> {
    const type = egg.prerequisiteType || 'MISSIONS_COUNT';
    const config = (egg.prerequisiteConfig as any) || {};

    if (type === 'NONE') {
      return true;
    }

    if (type === 'MISSIONS_COUNT') {
      const countReq = config.count != null ? Number(config.count) : 3;
      const sectorsReq = config.distinctSectors != null ? Number(config.distinctSectors) : 2;

      const childActions = await this.prisma.actionDone.findMany({
        where: { childId, periodId },
        include: { localAction: true },
      });

      const distinctSectors = new Set(
        childActions
          .map((a) => a.localAction?.categoryId)
          .filter((catId) => catId != null),
      );

      return childActions.length >= countReq && distinctSectors.size >= sectorsReq;
    }

    if (type === 'SPECIFIC_MISSIONS') {
      const requiredCodes: string[] = Array.isArray(config.missionCodes) ? config.missionCodes : [];
      const requiredIds: number[] = Array.isArray(config.missionIds) ? config.missionIds : [];
      const matchMode: 'ALL' | 'ANY' = config.matchMode === 'ANY' ? 'ANY' : 'ALL';

      if (requiredCodes.length === 0 && requiredIds.length === 0) {
        return true;
      }

      const childActions = await this.prisma.actionDone.findMany({
        where: { childId, periodId },
        include: {
          localAction: {
            include: { actionRef: true },
          },
        },
      });

      const doneCodes = new Set(
        childActions
          .map((a) => a.localAction?.actionRef?.code)
          .filter(Boolean),
      );
      const doneIds = new Set(
        childActions
          .map((a) => a.localAction?.actionRefId)
          .filter((id) => id != null),
      );

      const isItemCompleted = (code?: string, id?: number) => {
        if (code && doneCodes.has(code)) return true;
        if (id != null && doneIds.has(id)) return true;
        return false;
      };

      const targetItems: Array<{ code?: string; id?: number }> = [];
      if (requiredCodes.length > 0) {
        requiredCodes.forEach((code, idx) => {
          targetItems.push({ code, id: requiredIds[idx] });
        });
      } else {
        requiredIds.forEach((id) => {
          targetItems.push({ id });
        });
      }

      if (matchMode === 'ALL') {
        return targetItems.every((item) => isItemCompleted(item.code, item.id));
      } else {
        return targetItems.some((item) => isItemCompleted(item.code, item.id));
      }
    }

    return true;
  }

  async recordInteraction(childId: number, easterEggId: number) {
    const { child, currentPeriod } = await this.getPlayerContext(childId);

    const egg = await this.prisma.evoeEasterEgg.findUnique({ where: { id: easterEggId } });
    if (!egg || !egg.isActive) {
      throw new NotFoundException('Énigme introuvable ou inactive');
    }

    const isInteractable = await this.checkPrerequisites(
      egg,
      child.id,
      currentPeriod ? currentPeriod.id : 0,
    );
    if (!isInteractable) {
      return { success: false, message: 'Prérequis non atteints' };
    }

    let playerProgress = await this.prisma.evoeEasterEggPlayerProgress.findFirst({
      where: {
        easterEggId,
        childId: child.id,
        periodId: currentPeriod ? currentPeriod.id : 0,
      },
    });

    if (playerProgress) {
      if (!playerProgress.firstInteractionAt) {
        playerProgress = await this.prisma.evoeEasterEggPlayerProgress.update({
          where: { id: playerProgress.id },
          data: { firstInteractionAt: new Date() },
        });
      }
    } else {
      playerProgress = await this.prisma.evoeEasterEggPlayerProgress.create({
        data: {
          easterEggId,
          childId: child.id,
          periodId: currentPeriod ? currentPeriod.id : 0,
          firstInteractionAt: new Date(),
        },
      });
    }

    return { success: true, firstInteractionAt: playerProgress.firstInteractionAt };
  }

  async verifyAnswer(childId: number, dto: SubmitAnswerDto) {
    const { child, team, instanceYear, currentPeriod } =
      await this.getPlayerContext(childId);

    const egg = await this.prisma.evoeEasterEgg.findUnique({
      where: { id: dto.easterEggId },
    });

    if (!egg || !egg.isActive) {
      throw new NotFoundException('Énigme introuvable ou inactive');
    }

    if (egg.triggerType !== EasterEggTriggerType.RIDDLE_ANSWER_INPUT) {
      throw new BadRequestException('Cette énigme ne requiert pas de saisie textuelle');
    }

    const expected = (egg.expectedAnswer || '').trim();
    const submitted = (dto.answer || '').trim();

    const isMatch = egg.caseSensitive
      ? expected === submitted
      : expected.toLowerCase() === submitted.toLowerCase();

    if (!isMatch) {
      return {
        success: false,
        message: 'Combinaison incorrecte. Analysez attentivement les indices.',
      };
    }

    return this.processPlayerDiscovery(
      child,
      team,
      instanceYear,
      currentPeriod ? currentPeriod.id : 0,
      egg,
      submitted,
      dto.resolutionTimeSeconds,
    );
  }

  async validateTrigger(childId: number, dto: ValidateTriggerDto) {
    const { child, team, instanceYear, currentPeriod } =
      await this.getPlayerContext(childId);

    const egg = await this.prisma.evoeEasterEgg.findUnique({
      where: { id: dto.easterEggId },
    });

    if (!egg || !egg.isActive) {
      throw new NotFoundException('Énigme introuvable ou inactive');
    }

    if (egg.triggerType !== dto.triggerType) {
      throw new BadRequestException('Déclencheur non conforme à cette énigme');
    }

    return this.processPlayerDiscovery(
      child,
      team,
      instanceYear,
      currentPeriod ? currentPeriod.id : 0,
      egg,
      JSON.stringify(dto.metadata || {}),
      dto.resolutionTimeSeconds,
    );
  }

  private async processPlayerDiscovery(
    child: any,
    team: any,
    instanceYear: any,
    periodId: number,
    egg: EvoeEasterEgg,
    answerSubmitted: string,
    resolutionTimeSeconds?: number,
  ) {
    // 1. Enregistrement de la découverte individuelle
    const existingProgress = await this.prisma.evoeEasterEggPlayerProgress.findUnique({
      where: {
        easterEggId_childId_periodId: {
          easterEggId: egg.id,
          childId: child.id,
          periodId,
        },
      },
    });

    if (!existingProgress) {
      await this.prisma.evoeEasterEggPlayerProgress.create({
        data: {
          easterEggId: egg.id,
          childId: child.id,
          periodId,
          discoveredAt: new Date(),
          resolutionTimeSeconds: resolutionTimeSeconds || null,
          answerSubmitted,
        },
      });
    } else {
      await this.prisma.evoeEasterEggPlayerProgress.update({
        where: { id: existingProgress.id },
        data: {
          discoveredAt: new Date(),
          resolutionTimeSeconds: resolutionTimeSeconds || null,
          answerSubmitted,
        },
      });
    }

    // 2. Vérification de l'avancement de l'équipe
    const teamChildren = team.groups.flatMap((g: any) => g.children);
    const teamChildIds = teamChildren.map((c: any) => c.id);
    const teamTotalPlayers = teamChildren.length;

    const teamDiscoveriesCount = await this.prisma.evoeEasterEggPlayerProgress.count({
      where: {
        easterEggId: egg.id,
        periodId,
        childId: { in: teamChildIds },
        discoveredAt: { not: null },
      },
    });

    const requiredPlayers = Math.max(1, instanceYear.easterEggRequiredPlayers || 2);
    const maxWinningTeams = instanceYear.easterEggMaxWinningTeams || 0;

    let teamRewardEarned = false;
    let rank = 1;

    const existingTeamReward = await this.prisma.evoeEasterEggTeamReward.findUnique({
      where: {
        easterEggId_teamId_periodId: {
          easterEggId: egg.id,
          teamId: team.id,
          periodId,
        },
      },
    });

    if (!existingTeamReward && teamDiscoveriesCount >= requiredPlayers) {
      const existingWinnersCount = await this.prisma.evoeEasterEggTeamReward.count({
        where: {
          easterEggId: egg.id,
          periodId,
        },
      });

      if (maxWinningTeams === 0 || existingWinnersCount < maxWinningTeams) {
        rank = existingWinnersCount + 1;
        await this.prisma.evoeEasterEggTeamReward.create({
          data: {
            easterEggId: egg.id,
            teamId: team.id,
            periodId,
            awardedPointsIT: egg.rewardPointsIT,
            rank,
            playersCount: teamDiscoveriesCount,
            teamTotalPlayers,
          },
        });
        teamRewardEarned = true;

        if (this.chatGateway) {
          try {
            this.chatGateway.broadcastTeamEasterEggVictory({
              teamId: team.id,
              teamName: team.name,
              teamColor: team.color,
              teamIcon: team.icon,
              easterEggTitle: egg.title,
              pointsIT: egg.rewardPointsIT,
              rank,
              childPseudo: child.pseudo,
            });
          } catch (err: any) {
            this.logger.warn(`[EasterEggService] Erreur broadcast victoire équipe: ${err?.message}`);
          }
        }
      }
    }

    const isQuotaReached = teamDiscoveriesCount >= requiredPlayers;
    const hasTeamReward = !!existingTeamReward || teamRewardEarned;

    // Déblocage éventuel d'un artefact méta-jeu pour l'équipe
    let unlockedArtifact: string | null = null;
    if (egg.specialReward === 'CHRONO_EGG' && !team.hasChronoEgg) {
      await this.prisma.team.update({
        where: { id: team.id },
        data: { hasChronoEgg: true },
      });
      unlockedArtifact = 'CHRONO_EGG';
    } else if (egg.specialReward === 'ROSETTA_STONE' && !team.hasRosettaStone) {
      await this.prisma.team.update({
        where: { id: team.id },
        data: { hasRosettaStone: true },
      });
      unlockedArtifact = 'ROSETTA_STONE';
    }

    let customSuccessMsg = isQuotaReached
      ? `Félicitations ! L'équipe a validé l'énigme et remporté les +${egg.rewardPointsIT} IT !`
      : `Bravo ! Vous avez trouvé la solution (${teamDiscoveriesCount}/${requiredPlayers}). Prévenez votre équipe pour atteindre le quota et débloquer les points IT !`;

    if (unlockedArtifact === 'CHRONO_EGG') {
      customSuccessMsg += " ⚡ L'outil Chrono-Egg a été débloqué dans votre équipement temporel !";
    } else if (unlockedArtifact === 'ROSETTA_STONE') {
      customSuccessMsg += " 📜 La Pierre de Rosette 2070 a été découverte et décryptée !";
    }

    return {
      success: true,
      message: customSuccessMsg,
      unlockedArtifact,
      pointsIT: hasTeamReward ? egg.rewardPointsIT : 0,
      discoveredByPlayer: true,
      teamDiscoveriesCount,
      teamTotalPlayers,
      requiredPlayers,
      teamRewardEarned,
      isTeamRewarded: hasTeamReward,
      rank: existingTeamReward?.rank || (teamRewardEarned ? rank : null),
    };
  }

  async shareEasterEgg(childId: number, dto: ShareEasterEggDto) {
    const { child, team } = await this.getPlayerContext(childId);

    const egg = await this.prisma.evoeEasterEgg.findUnique({
      where: { id: dto.easterEggId },
    });

    if (!egg) throw new NotFoundException('Énigme introuvable');

    let shareMessage = '';
    if (dto.shareType === 'CLUE') {
      const clues = Array.isArray(egg.clues) ? egg.clues : [];
      const firstClue = clues[0] || 'Explorez l’interface pour repérer l’anomalie.';
      shareMessage = `🕵️ [INDICE 2070] L'Agent @${child.pseudo} partage un indice sur "${egg.title}" : "${firstClue}"`;
    } else {
      shareMessage = `⚡ [SOLUTION 2070] L'Agent @${child.pseudo} a percé l'énigme "${egg.title}" ! ${dto.customText || ''}`;
    }

    return {
      success: true,
      senderPseudo: child.pseudo,
      teamId: team.id,
      targetType: dto.targetType,
      targetPlayerId: dto.targetPlayerId || null,
      message: shareMessage,
    };
  }

  async getDetectiveLeaderboard(instanceYearId?: number) {
    // Joueurs avec le plus d'Easter Eggs découverts
    const allProgress = await this.prisma.evoeEasterEggPlayerProgress.findMany({
      where: {
        discoveredAt: { not: null },
      },
      include: {
        child: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            gender: true,
            group: {
              select: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                    icon: true,
                    instanceYearId: true,
                  },
                },
              },
            },
          },
        },
        easterEgg: {
          select: {
            rewardPointsIT: true,
          },
        },
      },
    });

    const playerMap = new Map<
      number,
      {
        childId: number;
        pseudo: string;
        avatar: string | null;
        gender: string | null;
        teamId: number;
        teamName: string;
        teamColor: string | null;
        teamIcon: string | null;
        instanceYearId: number;
        solvedCount: number;
        totalPointsContributed: number;
      }
    >();

    for (const p of allProgress) {
      if (instanceYearId && p.child.group.team.instanceYearId !== instanceYearId) {
        continue;
      }

      const existing = playerMap.get(p.child.id) || {
        childId: p.child.id,
        pseudo: p.child.pseudo,
        avatar: p.child.avatar,
        gender: p.child.gender,
        teamId: p.child.group.team.id,
        teamName: p.child.group.team.name,
        teamColor: p.child.group.team.color,
        teamIcon: p.child.group.team.icon || null,
        instanceYearId: p.child.group.team.instanceYearId,
        solvedCount: 0,
        totalPointsContributed: 0,
      };

      existing.solvedCount += 1;
      existing.totalPointsContributed += p.easterEgg.rewardPointsIT;
      playerMap.set(p.child.id, existing);
    }

    const playersRanking = Array.from(playerMap.values()).sort(
      (a, b) => b.solvedCount - a.solvedCount || b.totalPointsContributed - a.totalPointsContributed,
    );

    // Classement des équipes
    const allTeamRewards = await this.prisma.evoeEasterEggTeamReward.findMany({
      include: {
        team: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            instanceYearId: true,
          },
        },
      },
    });

    const teamMap = new Map<
      number,
      {
        teamId: number;
        name: string;
        color: string | null;
        icon: string | null;
        instanceYearId: number;
        solvedEnigmasCount: number;
        totalPointsIT: number;
        firstPlacesCount: number;
      }
    >();

    for (const tr of allTeamRewards) {
      if (instanceYearId && tr.team.instanceYearId !== instanceYearId) {
        continue;
      }

      const existing = teamMap.get(tr.team.id) || {
        teamId: tr.team.id,
        name: tr.team.name,
        color: tr.team.color,
        icon: tr.team.icon || null,
        instanceYearId: tr.team.instanceYearId,
        solvedEnigmasCount: 0,
        totalPointsIT: 0,
        firstPlacesCount: 0,
      };

      existing.solvedEnigmasCount += 1;
      existing.totalPointsIT += tr.awardedPointsIT;
      if (tr.rank === 1) existing.firstPlacesCount += 1;
      teamMap.set(tr.team.id, existing);
    }

    const teamsRanking = Array.from(teamMap.values()).sort(
      (a, b) =>
        b.solvedEnigmasCount - a.solvedEnigmasCount ||
        b.totalPointsIT - a.totalPointsIT ||
        b.firstPlacesCount - a.firstPlacesCount,
    );

    return {
      topDetectives: playersRanking.slice(0, 20),
      teamsRanking,
    };
  }

  // --- CRUD Admin ---

  async getAdminCatalog() {
    return this.prisma.evoeEasterEgg.findMany({
      orderBy: { orderIndex: 'asc' },
    });
  }

  async createEasterEgg(dto: CreateEasterEggDto) {
    return this.prisma.evoeEasterEgg.create({
      data: {
        code: dto.code,
        title: dto.title,
        crypticMessage: dto.crypticMessage || dto.senderLore || '',
        explicitHint: dto.explicitHint || null,
        mascotDurationSeconds: dto.mascotDurationSeconds,
        hintDelayMinutes: dto.hintDelayMinutes,
        triggerAction: dto.triggerAction,
        senderLore: dto.senderLore,
        imageUrl: dto.imageUrl || null,
        triggerType: dto.triggerType,
        expectedAnswer: dto.expectedAnswer || null,
        caseSensitive: dto.caseSensitive ?? false,
        triggerConfig: dto.triggerConfig || null,
        complexity: dto.complexity || EasterEggDifficulty.MEDIUM,
        rewardPointsIT: dto.rewardPointsIT || 50,
        specialReward: dto.specialReward || 'NONE',
        orderIndex: dto.orderIndex || 0,
        isActive: dto.isActive ?? true,
        prerequisiteType: dto.prerequisiteType || 'MISSIONS_COUNT',
        prerequisiteConfig: dto.prerequisiteConfig ?? { count: 3, distinctSectors: 2 },
      },
    });
  }

  async updateEasterEgg(id: number, dto: UpdateEasterEggDto) {
    return this.prisma.evoeEasterEgg.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...((dto.crypticMessage != null) ? { crypticMessage: dto.crypticMessage } : (dto.senderLore != null) ? { crypticMessage: dto.senderLore } : {}),
        ...(dto.explicitHint !== undefined && { explicitHint: dto.explicitHint }),
        ...(dto.mascotDurationSeconds !== undefined && { mascotDurationSeconds: dto.mascotDurationSeconds }),
        ...(dto.hintDelayMinutes !== undefined && { hintDelayMinutes: dto.hintDelayMinutes }),
        ...(dto.triggerAction !== undefined && { triggerAction: dto.triggerAction }),
        ...(dto.clues !== undefined && { clues: dto.clues }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.triggerType !== undefined && { triggerType: dto.triggerType }),
        ...(dto.expectedAnswer !== undefined && { expectedAnswer: dto.expectedAnswer }),
        ...(dto.caseSensitive !== undefined && { caseSensitive: dto.caseSensitive }),
        ...(dto.triggerConfig !== undefined && { triggerConfig: dto.triggerConfig }),
        ...(dto.complexity !== undefined && { complexity: dto.complexity }),
        ...(dto.rewardPointsIT !== undefined && { rewardPointsIT: dto.rewardPointsIT }),
        ...(dto.specialReward !== undefined && { specialReward: dto.specialReward }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.prerequisiteType !== undefined && { prerequisiteType: dto.prerequisiteType }),
        ...(dto.prerequisiteConfig !== undefined && { prerequisiteConfig: dto.prerequisiteConfig }),
      },
    });
  }

  async deleteEasterEgg(id: number) {
    return this.prisma.evoeEasterEgg.delete({
      where: { id },
    });
  }

  async reorderCatalog(orderedIds: number[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.evoeEasterEgg.update({
        where: { id },
        data: { orderIndex: index + 1 },
      }),
    );
    await this.prisma.$transaction(updates);
    return { success: true, count: orderedIds.length };
  }

  async updateSettings(instanceYearId: number, dto: UpdateEasterEggSettingsDto) {
    const updated = await this.prisma.instanceYear.update({
      where: { id: instanceYearId },
      data: {
        ...(dto.easterEggsEnabled !== undefined && {
          easterEggsEnabled: dto.easterEggsEnabled,
        }),
        ...(dto.easterEggFrequency !== undefined && {
          easterEggFrequency: dto.easterEggFrequency,
        }),
        ...(dto.easterEggRequiredPlayers !== undefined && {
          easterEggRequiredPlayers: dto.easterEggRequiredPlayers,
        }),
        ...(dto.easterEggMaxWinningTeams !== undefined && {
          easterEggMaxWinningTeams: dto.easterEggMaxWinningTeams,
        }),
        ...(dto.metaEnigmaSecretWord !== undefined && {
          metaEnigmaSecretWord: dto.metaEnigmaSecretWord,
        }),
        ...(dto.metaEnigmaPeriodGlyphs !== undefined && {
          metaEnigmaPeriodGlyphs: dto.metaEnigmaPeriodGlyphs,
        }),
      },
    });
    return updated;
  }

  async getAdminTracking(instanceYearId: number, targetEggId?: number) {
    const instanceYear = await this.prisma.instanceYear.findUnique({
      where: { id: instanceYearId },
      include: {
        periods: { orderBy: { startDate: 'asc' } },
        teams: {
          include: {
            groups: {
              include: { children: true },
            },
          },
        },
      },
    });

    if (!instanceYear) throw new NotFoundException('Année d’instance introuvable');

    const now = new Date();
    const periods = instanceYear.periods || [];
    let currentPeriod = periods.find(p => p.isOpen);
    if (!currentPeriod) {
      currentPeriod =
        periods.find(p => new Date(p.startDate) <= now && new Date(p.endDate) >= now) ||
        periods[periods.length - 1];
    }

    const currentPeriodIndex = currentPeriod
      ? periods.findIndex(p => p.id === currentPeriod!.id) + 1
      : 1;

    const frequency = Math.max(1, instanceYear.easterEggFrequency || 2);

    const activeEggs = await this.prisma.evoeEasterEgg.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    const {
      currentEgg: defaultEgg,
      explicitInstance: defaultInstance,
      cycleIndex,
      cyclePeriodIds,
      periodStart,
      periodEnd,
    } = await this.resolveEggForInstance(
      instanceYear.id,
      periods,
      currentPeriodIndex,
      frequency,
      activeEggs,
    );

    let currentEgg = defaultEgg;
    let explicitInstance = defaultInstance;

    if (targetEggId) {
      const foundEgg =
        activeEggs.find(e => e.id === targetEggId) ||
        (await this.prisma.evoeEasterEgg.findUnique({ where: { id: targetEggId } }));
      if (foundEgg) {
        currentEgg = foundEgg;
        const matchingInst = await this.prisma.evoeEasterEggInstance.findFirst({
          where: { instanceYearId, easterEggId: targetEggId, isClosed: false },
        });
        if (matchingInst) explicitInstance = matchingInst;
      }
    }

    if (!currentEgg || !currentPeriod) {
      return {
        hasActiveEgg: false,
        settings: {
          easterEggsEnabled: instanceYear.easterEggsEnabled ?? true,
          easterEggFrequency: instanceYear.easterEggFrequency ?? 2,
          easterEggRequiredPlayers: instanceYear.easterEggRequiredPlayers ?? 2,
          easterEggMaxWinningTeams: instanceYear.easterEggMaxWinningTeams ?? 0,
        },
        teamsTracking: [],
        individualDiscoveries: [],
      };
    }

    const effectivePeriodIds =
      cyclePeriodIds.length > 0 ? cyclePeriodIds : [currentPeriod.id];

    // 1. Récupération de toutes les découvertes de la période (tous Easter Eggs confondus)
    const allPeriodDiscoveries = await this.prisma.evoeEasterEggPlayerProgress.findMany({
      where: {
        periodId: { in: effectivePeriodIds },
        discoveredAt: { not: null },
      },
      include: {
        easterEgg: {
          select: {
            id: true,
            title: true,
            code: true,
            rewardPointsIT: true,
          },
        },
        child: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            gender: true,
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
                teamId: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                    icon: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { discoveredAt: 'asc' },
    });

    // 2. Récupération de toutes les récompenses d'équipe de la période (tous Easter Eggs confondus)
    const allPeriodTeamRewards = await this.prisma.evoeEasterEggTeamReward.findMany({
      where: {
        periodId: { in: effectivePeriodIds },
      },
      include: {
        easterEgg: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
      orderBy: { completedAt: 'asc' },
    });

    const cyclePeriodsForAdmin = periods.slice(
      cycleIndex * frequency,
      cycleIndex * frequency + frequency,
    );
    const cyclePeriodIdsAdmin = cyclePeriodsForAdmin.map(p => p.id);

    const activePeriodInstances = await this.prisma.evoeEasterEggInstance.findMany({
      where: {
        instanceYearId,
        isClosed: false,
        OR: [
          { periodStartId: currentPeriod.id },
          { periodStartId: { in: cyclePeriodIdsAdmin } },
        ],
      },
      include: { easterEgg: true },
      orderBy: { id: 'asc' },
    });

    const periodActiveEggs = activePeriodInstances
      .filter(i => i.easterEgg && i.easterEgg.isActive)
      .map(i => {
        const eggId = i.easterEgg.id;
        const eggDiscoveries = allPeriodDiscoveries.filter(d => d.easterEggId === eggId);
        const eggRewards = allPeriodTeamRewards.filter(tr => tr.easterEggId === eggId);

        const discoverers = eggDiscoveries.map(d => ({
          childId: d.child.id,
          pseudo: d.child.pseudo,
          avatar: d.child.avatar,
          gender: d.child.gender,
          teamId: d.child.group?.teamId,
          teamName: d.child.group?.team?.name || 'Équipe',
          teamColor: d.child.group?.team?.color || '#10b981',
          teamIcon: d.child.group?.team?.icon || null,
          discoveredAt: d.discoveredAt,
        }));

        const teamsCompleted = eggRewards.map(tr => ({
          teamId: tr.teamId,
          rank: tr.rank,
          awardedPointsIT: tr.awardedPointsIT,
          completedAt: tr.completedAt,
        }));

        return {
          instanceId: i.id,
          eggId: i.easterEgg.id,
          code: i.easterEgg.code,
          title: i.easterEgg.title,
          rewardPointsIT: i.easterEgg.rewardPointsIT,
          forceHint: i.forceHint,
          discoverers,
          teamsCompleted,
        };
      });

    // 3. Suivi par équipe : Global sur la période (indépendant de l'Easter Egg sélectionné)
    const teamsTracking = instanceYear.teams.map(team => {
      const teamChildren = team.groups.flatMap(g => g.children);
      const teamTotalPlayers = teamChildren.length;
      const teamDiscoveries = allPeriodDiscoveries.filter(
        d => d.child.group?.teamId === team.id,
      );

      const uniqueContributingPlayerIds = new Set(teamDiscoveries.map(d => d.child.id));
      const contributingPlayers = Array.from(uniqueContributingPlayerIds).map(childId => {
        const first = teamDiscoveries.find(d => d.child.id === childId)!;
        return {
          childId: first.child.id,
          pseudo: first.child.pseudo,
          avatar: first.child.avatar,
          gender: first.child.gender,
        };
      });

      const teamAllRewards = allPeriodTeamRewards.filter(tr => tr.teamId === team.id);
      const totalAwardedPointsIT = teamAllRewards.reduce((sum, tr) => sum + tr.awardedPointsIT, 0);

      const solvedEggs = teamAllRewards.map(tr => ({
        easterEggId: tr.easterEggId,
        title: tr.easterEgg?.title || `Easter Egg #${tr.easterEggId}`,
        rank: tr.rank,
        awardedPointsIT: tr.awardedPointsIT,
        completedAt: tr.completedAt,
      }));

      const activeEggsTotal = periodActiveEggs.length || 1;

      // Liste des Easter Eggs actifs de la période
      const activeEggsList = periodActiveEggs.length > 0
        ? periodActiveEggs
        : [{
            eggId: currentEgg.id,
            code: currentEgg.code,
            title: currentEgg.title,
            rewardPointsIT: currentEgg.rewardPointsIT,
          }];

      const eggsProgress = activeEggsList.map(egg => {
        const eggDiscoveriesForTeam = teamDiscoveries.filter(d => d.easterEggId === egg.eggId);
        const eggReward = teamAllRewards.find(tr => tr.easterEggId === egg.eggId);
        const players = eggDiscoveriesForTeam.map(d => ({
          childId: d.child.id,
          pseudo: d.child.pseudo,
          avatar: d.child.avatar,
          gender: d.child.gender,
          discoveredAt: d.discoveredAt,
        }));

        return {
          eggId: egg.eggId,
          title: egg.title,
          code: egg.code,
          rewardPointsIT: egg.rewardPointsIT,
          isCompleted: !!eggReward,
          playersCount: players.length,
          requiredPlayers: instanceYear.easterEggRequiredPlayers ?? 2,
          players,
          reward: eggReward
            ? {
                rank: eggReward.rank,
                awardedPointsIT: eggReward.awardedPointsIT,
                completedAt: eggReward.completedAt,
              }
            : null,
        };
      });

      return {
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        teamIcon: team.icon || null,
        totalPlayers: teamTotalPlayers,
        discoveredCount: uniqueContributingPlayerIds.size,
        requiredPlayers: instanceYear.easterEggRequiredPlayers ?? 2,
        activeEggsTotal,
        solvedEggsCount: solvedEggs.length,
        solvedEggs,
        eggsProgress,
        totalAwardedPointsIT,
        isRewarded: solvedEggs.length > 0,
        rewardRank: teamAllRewards[0]?.rank || null,
        awardedPointsIT: totalAwardedPointsIT,
        completedAt: teamAllRewards[teamAllRewards.length - 1]?.completedAt || null,
        contributingPlayers,
      };
    });

    return {
      hasActiveEgg: true,
      currentEgg,
      periodActiveEggs: periodActiveEggs.length > 0 ? periodActiveEggs : [{
        instanceId: explicitInstance?.id || 0,
        eggId: currentEgg.id,
        code: currentEgg.code,
        title: currentEgg.title,
        rewardPointsIT: currentEgg.rewardPointsIT,
        forceHint: !!explicitInstance?.forceHint,
        discoverers: [],
        teamsCompleted: [],
      }],
      activeInstance: explicitInstance ? {
        id: explicitInstance.id,
        easterEggId: explicitInstance.easterEggId,
        forceHint: explicitInstance.forceHint,
        unlockedAt: explicitInstance.unlockedAt,
        isClosed: explicitInstance.isClosed,
      } : null,
      currentPeriod: {
        id: currentPeriod.id,
        periodIndex: currentPeriodIndex,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
      },
      settings: {
        easterEggsEnabled: instanceYear.easterEggsEnabled ?? true,
        easterEggFrequency: instanceYear.easterEggFrequency ?? 2,
        easterEggRequiredPlayers: instanceYear.easterEggRequiredPlayers ?? 2,
        easterEggMaxWinningTeams: instanceYear.easterEggMaxWinningTeams ?? 0,
      },
      teamsTracking,
      individualDiscoveries: allPeriodDiscoveries.map(d => ({
        childId: d.child.id,
        pseudo: d.child.pseudo,
        avatar: d.child.avatar,
        gender: d.child.gender,
        teamName: d.child.group?.team.name,
        teamColor: d.child.group?.team.color,
        teamIcon: d.child.group?.team.icon || null,
        discoveredAt: d.discoveredAt,
        resolutionTimeSeconds: d.resolutionTimeSeconds,
        easterEggId: d.easterEgg.id,
        easterEggTitle: d.easterEgg.title,
        easterEggCode: d.easterEgg.code,
        rewardPointsIT: d.easterEgg.rewardPointsIT,
        answerSubmitted: d.answerSubmitted,
      })),
    };
  }

  async openInstanceEgg(
    instanceYearId: number,
    easterEggId: number,
    closePrevious: boolean = true,
  ) {
    const instanceYear = await this.prisma.instanceYear.findUnique({
      where: { id: instanceYearId },
      include: { periods: { orderBy: { startDate: 'asc' } } },
    });
    if (!instanceYear) throw new NotFoundException('Année d’instance introuvable');

    const now = new Date();
    const periods = instanceYear.periods || [];
    let currentPeriod = periods.find(p => p.isOpen);
    if (!currentPeriod) {
      currentPeriod =
        periods.find(p => new Date(p.startDate) <= now && new Date(p.endDate) >= now) ||
        periods[periods.length - 1];
    }
    if (!currentPeriod) throw new BadRequestException('Aucune période trouvée');

    if (closePrevious) {
      // Clôture des instances actives précédentes
      await this.prisma.evoeEasterEggInstance.updateMany({
        where: { instanceYearId, isClosed: false },
        data: { isClosed: true, closedAt: new Date() },
      });
    }

    const instance = await this.prisma.evoeEasterEggInstance.upsert({
      where: {
        instanceYearId_easterEggId_periodStartId: {
          instanceYearId,
          easterEggId,
          periodStartId: currentPeriod.id,
        },
      },
      update: {
        isClosed: false,
        closedAt: null,
        unlockedAt: new Date(),
      },
      create: {
        instanceYearId,
        easterEggId,
        periodStartId: currentPeriod.id,
        periodEndId: currentPeriod.id,
        isClosed: false,
        forceHint: false,
        unlockedAt: new Date(),
      },
      include: { easterEgg: true },
    });

    return instance;
  }

  async closeInstanceEgg(instanceYearId: number, easterEggId?: number) {
    const instanceYear = await this.prisma.instanceYear.findUnique({
      where: { id: instanceYearId },
      include: { periods: { orderBy: { startDate: 'asc' } } },
    });
    if (!instanceYear) throw new NotFoundException('Année d’instance introuvable');

    const now = new Date();
    const periods = instanceYear.periods || [];
    let currentPeriod = periods.find(p => p.isOpen);
    if (!currentPeriod) {
      currentPeriod =
        periods.find(p => new Date(p.startDate) <= now && new Date(p.endDate) >= now) ||
        periods[periods.length - 1];
    }

    const openInstances = await this.prisma.evoeEasterEggInstance.findMany({
      where: {
        instanceYearId,
        isClosed: false,
        ...(easterEggId ? { easterEggId } : {}),
      },
    });

    if (openInstances.length > 0) {
      await this.prisma.evoeEasterEggInstance.updateMany({
        where: {
          instanceYearId,
          isClosed: false,
          ...(easterEggId ? { easterEggId } : {}),
        },
        data: { isClosed: true, closedAt: new Date() },
      });
    } else if (currentPeriod) {
      // Clôture explicite d'une énigme du cycle automatique pour cette période
      const targetEgg = easterEggId
        ? await this.prisma.evoeEasterEgg.findUnique({ where: { id: easterEggId } })
        : (await this.getAdminTracking(instanceYearId))?.currentEgg;

      if (targetEgg) {
        await this.prisma.evoeEasterEggInstance.upsert({
          where: {
            instanceYearId_easterEggId_periodStartId: {
              instanceYearId,
              easterEggId: targetEgg.id,
              periodStartId: currentPeriod.id,
            },
          },
          update: {
            isClosed: true,
            closedAt: new Date(),
          },
          create: {
            instanceYearId,
            easterEggId: targetEgg.id,
            periodStartId: currentPeriod.id,
            periodEndId: currentPeriod.id,
            isClosed: true,
            closedAt: new Date(),
          },
        });
      }
    }

    return { success: true, message: 'Easter Egg clôturé pour cette période' };
  }

  async forceInstanceHint(instanceYearId: number, easterEggId?: number) {
    const activeInstance = await this.prisma.evoeEasterEggInstance.findFirst({
      where: {
        instanceYearId,
        isClosed: false,
        ...(easterEggId ? { easterEggId } : {}),
      },
      orderBy: { id: 'desc' },
    });

    if (activeInstance) {
      await this.prisma.evoeEasterEggInstance.update({
        where: { id: activeInstance.id },
        data: { forceHint: true },
      });
      return { success: true, message: '2ème indice forcé pour tous les joueurs' };
    } else {
      const targetEgg = easterEggId
        ? await this.prisma.evoeEasterEgg.findUnique({ where: { id: easterEggId } })
        : (await this.getAdminTracking(instanceYearId))?.currentEgg;
      const tracking = await this.getAdminTracking(instanceYearId);

      if (!targetEgg || !tracking.currentPeriod) {
        throw new BadRequestException('Aucun Easter Egg actif à forcer');
      }

      await this.prisma.evoeEasterEggInstance.upsert({
        where: {
          instanceYearId_easterEggId_periodStartId: {
            instanceYearId,
            easterEggId: targetEgg.id,
            periodStartId: tracking.currentPeriod.id,
          },
        },
        update: { forceHint: true },
        create: {
          instanceYearId,
          easterEggId: targetEgg.id,
          periodStartId: tracking.currentPeriod.id,
          periodEndId: tracking.currentPeriod.id,
          forceHint: true,
          isClosed: false,
        },
      });

      return { success: true, message: '2ème indice forcé pour cette période' };
    }
  }

  /**
   * Récupère l'historique complet de la saison pour le Chrono-Egg, découpé en Cycles de 2 semaines
   */
  async getChronoEggArchive(childId: number) {
    const { child: _child, team, instanceYear, periods, currentPeriodIndex } =
      await this.getPlayerContext(childId);

    const frequency = Math.max(1, instanceYear.easterEggFrequency || 2);
    const secretWord = (instanceYear.metaEnigmaSecretWord || 'CHRONOS').trim().toUpperCase();

    const teamChildren = team.groups.flatMap((g: any) => g.children);
    const teamChildIds = teamChildren.map((c: any) => c.id);

    // Nombre total de cycles pour la saison (ex: 46 périodes / 2 = 23 cycles)
    const totalCycles = Math.ceil(periods.length / frequency);
    // Index du cycle en cours (1-indexed)
    const currentCycleIndex = Math.floor(Math.max(0, currentPeriodIndex - 1) / frequency) + 1;

    // Récupération de tous les Easter Eggs actifs classés par orderIndex (11 à 13 énigmes existantes)
    const activeCatalog = await this.prisma.evoeEasterEgg.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    // Cycles sans Easter Egg (pauses temporelles / cycles neutres sans énigme)
    const defaultEmptyCycles = new Set([4, 8, 14, 19]);

    // Mapping séquentiel des énigmes du catalogue pour les cycles avec énigmes
    let eggCatalogCursor = 0;
    const cycleEggMapping: Record<number, number[]> = {};
    for (let cIdx = 1; cIdx <= totalCycles; cIdx++) {
      if (!defaultEmptyCycles.has(cIdx)) {
        if (activeCatalog.length > 0) {
          cycleEggMapping[cIdx] = [activeCatalog[eggCatalogCursor % activeCatalog.length].id];
          eggCatalogCursor++;
        }
      } else {
        cycleEggMapping[cIdx] = [];
      }
    }

    const cycles = [];

    for (let cIdx = 1; cIdx <= totalCycles; cIdx++) {
      const startPIndex = (cIdx - 1) * frequency;
      const endPIndex = Math.min(periods.length - 1, startPIndex + frequency - 1);
      const cyclePeriods = periods.slice(startPIndex, endPIndex + 1);
      const cyclePeriodIds = cyclePeriods.map((p) => p.id);
      const periodStart = cyclePeriods[0] || periods[0];
      const periodEnd = cyclePeriods[cyclePeriods.length - 1] || periods[periods.length - 1];

      const isCurrentCycle = cIdx === currentCycleIndex;
      const isPast = cIdx < currentCycleIndex;
      const isFuture = cIdx > currentCycleIndex;

      // Vérifier les instances programmées par l'AM pour ce cycle
      const explicitInstances = await this.prisma.evoeEasterEggInstance.findMany({
        where: {
          instanceYearId: instanceYear.id,
          OR: [
            { periodStartId: { in: cyclePeriodIds } },
            { periodEndId: { in: cyclePeriodIds } },
          ],
        },
        include: { easterEgg: true },
      });

      let eggIds: number[] = [];
      let hasEgg = false;

      if (explicitInstances.length > 0) {
        const activeInst = explicitInstances.filter(
          (i) => !i.isClosed && i.easterEgg && i.easterEgg.isActive,
        );
        if (activeInst.length > 0) {
          hasEgg = true;
          eggIds = activeInst.map((i) => i.easterEggId);
        } else {
          // Instances explicitement clôturées = cycle sans énigme
          hasEgg = false;
          eggIds = [];
        }
      } else {
        // Distribution par défaut
        if (!defaultEmptyCycles.has(cIdx) && cycleEggMapping[cIdx]?.length > 0) {
          hasEgg = true;
          eggIds = cycleEggMapping[cIdx];
        } else {
          hasEgg = false;
          eggIds = [];
        }
      }

      const totalEggs = hasEgg ? Math.max(1, eggIds.length) : 0;
      let solvedEggs = 0;

      if (hasEgg && eggIds.length > 0) {
        const solvedDistinct = await this.prisma.evoeEasterEggPlayerProgress.findMany({
          where: {
            easterEggId: { in: eggIds },
            childId: { in: teamChildIds },
            discoveredAt: { not: null },
          },
          distinct: ['easterEggId'],
        });
        solvedEggs = solvedDistinct.length;
      }

      const isCompleted = hasEgg && solvedEggs >= totalEggs && totalEggs > 0;
      const canReplay = isPast && hasEgg && !isCompleted;

      const glyphIndex = (cIdx - 1) % 12;

      let eggTitle = '';
      let specialReward = 'NONE';
      // Règle : quand un cycle est futur/verrouillé, masquer l'énigme et la récompense spéciale
      if (!isFuture && hasEgg && eggIds[0]) {
        const eggObj = activeCatalog.find((e) => e.id === eggIds[0]);
        if (eggObj) {
          eggTitle = eggObj.title;
          specialReward = eggObj.specialReward || 'NONE';
        }
      }

      cycles.push({
        cycleId: cIdx,
        cycleIndex: cIdx,
        periodStartId: periodStart.id,
        periodEndId: periodEnd.id,
        startDate: periodStart.startDate,
        endDate: periodEnd.endDate,
        isCurrentCycle,
        isPast,
        isFuture,
        isLocked: isFuture,
        hasEgg,
        eggTitle,
        specialReward,
        totalEggs,
        solvedEggs,
        ratio: totalEggs > 0 ? solvedEggs / totalEggs : 0,
        glyphIndex,
        isCompleted,
        canReplay,
        // Rétro-compatibilité avec les champs attendus par l'UI
        periodId: periodStart.id,
        periodIndex: cIdx,
        isCurrentPeriod: isCurrentCycle,
      });
    }

    return {
      hasChronoEgg: !!team.hasChronoEgg,
      hasRosettaStone: !!team.hasRosettaStone,
      isMetaEnigmaUnlocked: !!team.isMetaEnigmaUnlocked,
      secretWordLength: secretWord.length,
      totalCycles,
      currentCycleIndex,
      cycles,
      periods: cycles, // Rétro-compatibilité
    };
  }

  /**
   * Permet le "Rattrapage Temporel" pour un cycle passé
   */
  async reopenPeriodEgg(childId: number, periodId: number) {
    const { child, team, instanceYear, periods } = await this.getPlayerContext(childId);
    if (!team.hasChronoEgg) {
      throw new BadRequestException("Vous devez posséder l'outil Chrono-Egg pour relancer une archive.");
    }

    const pIdx = periods.findIndex((p) => p.id === periodId);
    if (pIdx === -1) {
      throw new NotFoundException('Période introuvable.');
    }

    const frequency = Math.max(1, instanceYear.easterEggFrequency || 2);
    const targetCycleIndex = Math.floor(pIdx / frequency) + 1;
    const defaultEmptyCycles = new Set([4, 8, 14, 19]);

    if (defaultEmptyCycles.has(targetCycleIndex)) {
      throw new BadRequestException('Ce cycle temporel ne comporte aucun Easter Egg.');
    }

    const activeCatalog = await this.prisma.evoeEasterEgg.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    const startPIndex = (targetCycleIndex - 1) * frequency;
    const endPIndex = Math.min(periods.length - 1, startPIndex + frequency - 1);
    const cyclePeriods = periods.slice(startPIndex, endPIndex + 1);
    const cyclePeriodIds = cyclePeriods.map((p) => p.id);

    const instances = await this.prisma.evoeEasterEggInstance.findMany({
      where: {
        instanceYearId: instanceYear.id,
        OR: [
          { periodStartId: { in: cyclePeriodIds } },
          { periodEndId: { in: cyclePeriodIds } },
        ],
      },
      include: { easterEgg: true },
    });

    let candidateEgg: EvoeEasterEgg | null = null;
    if (instances.length > 0) {
      for (const inst of instances) {
        if (inst.easterEgg && inst.easterEgg.isActive && !inst.isClosed) {
          const solved = await this.prisma.evoeEasterEggPlayerProgress.findFirst({
            where: {
              easterEggId: inst.easterEggId,
              childId: child.id,
              periodId: { in: cyclePeriodIds },
              discoveredAt: { not: null },
            },
          });
          if (!solved) {
            candidateEgg = inst.easterEgg;
            break;
          }
        }
      }
      if (!candidateEgg && instances[0]?.easterEgg) {
        candidateEgg = instances[0].easterEgg;
      }
    } else {
      let eggCatalogCursor = 0;
      for (let c = 1; c <= targetCycleIndex; c++) {
        if (!defaultEmptyCycles.has(c)) {
          if (c === targetCycleIndex) {
            candidateEgg = activeCatalog[eggCatalogCursor % activeCatalog.length];
            break;
          }
          eggCatalogCursor++;
        }
      }
    }

    if (!candidateEgg) {
      throw new NotFoundException('Aucune énigme trouvée pour ce cycle.');
    }

    return {
      periodId,
      cycleIndex: targetCycleIndex,
      easterEgg: candidateEgg,
      isReplayMode: true,
      success: true,
    };
  }

  /**
   * Valide le mot de passe final saisi manuellement par l'élève dans le Terminal
   */
  async submitMetaEnigmaCode(childId: number, code: string) {
    const { team, instanceYear } = await this.getPlayerContext(childId);
    const expected = (instanceYear.metaEnigmaSecretWord || 'CHRONOS').trim().toUpperCase();
    const submitted = (code || '').trim().toUpperCase();

    if (submitted === expected) {
      await this.prisma.team.update({
        where: { id: team.id },
        data: { isMetaEnigmaUnlocked: true },
      });
      return {
        success: true,
        message: 'Protocole Oméga validé avec succès ! La Vision 2050 est désormais déverrouillée.',
        isMetaEnigmaUnlocked: true,
      };
    }

    return {
      success: false,
      message: 'Code temporel erroné. Vérifiez vos glyphes et la Pierre de Rosette 2070.',
      isMetaEnigmaUnlocked: false,
    };
  }
}
