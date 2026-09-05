import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
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
  senderLore: string;
  clues: string[];
  imageUrl?: string | null;
  triggerType: EasterEggTriggerType;
  expectedAnswer?: string | null;
  caseSensitive?: boolean;
  triggerConfig?: any;
  complexity?: EasterEggDifficulty;
  rewardPointsIT?: number;
  orderIndex?: number;
  isActive?: boolean;
}

export interface UpdateEasterEggDto extends Partial<CreateEasterEggDto> {}

export interface UpdateEasterEggSettingsDto {
  easterEggsEnabled?: boolean;
  easterEggFrequency?: number;
  easterEggRequiredPlayers?: number;
  easterEggMaxWinningTeams?: number;
}

const DEFAULT_EASTER_EGGS: CreateEasterEggDto[] = [
  {
    code: 'EE_CADENAS_4CH_ARCHE',
    title: "Le Cadenas à 4 Chiffres de l'Arche",
    senderLore:
      "Transmission prioritaire 2070 : Nos scientifiques ont scellé une capsule d'énergie pure dans l'Arche. Pour l'ouvrir, déduisez le code secret à 4 chiffres grâce aux règles d'exclusion de l'hologramme !",
    clues: [
      'Le code est composé de 4 chiffres uniques.',
      'Croisez les règles logiques du schéma pour éliminer les faux chiffres.',
    ],
    imageUrl: '/easter-eggs/cadenas_4ch.webp',
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
    senderLore:
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
    senderLore:
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
    senderLore:
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
    senderLore:
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
    senderLore:
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
    senderLore:
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
    senderLore:
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
    senderLore:
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
    senderLore:
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
    senderLore:
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

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultEasterEggs();
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
              senderLore: egg.senderLore,
              clues: egg.clues,
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

    // Calcul du cycle en cours (0, 1, 2...)
    const cycleIndex = Math.floor(Math.max(0, currentPeriodIndex - 1) / frequency);

    // Détermination de la période de début et de fin du cycle
    const cycleStartPeriodIndex = cycleIndex * frequency;
    const cycleEndPeriodIndex = Math.min(
      periods.length - 1,
      cycleStartPeriodIndex + frequency - 1,
    );
    const periodStart = periods[cycleStartPeriodIndex] || currentPeriod;
    const periodEnd = periods[cycleEndPeriodIndex] || currentPeriod;

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

    const selectedEggIndex = cycleIndex % activeEggs.length;
    const currentEgg = activeEggs[selectedEggIndex];

    // Vérifier si le joueur a déjà découvert cette énigme dans la période actuelle
    const playerProgress = await this.prisma.evoeEasterEggPlayerProgress.findFirst({
      where: {
        easterEggId: currentEgg.id,
        childId: child.id,
        periodId: currentPeriod ? currentPeriod.id : 0,
      },
    });

    // Effectif de l'équipe (tous groupes confondus)
    const teamChildren = team.groups.flatMap(g => g.children);
    const teamTotalPlayers = teamChildren.length;
    const teamChildIds = teamChildren.map(c => c.id);

    // Joueurs de l'équipe ayant validé l'énigme pour cette période
    const teamDiscoveries = await this.prisma.evoeEasterEggPlayerProgress.findMany({
      where: {
        easterEggId: currentEgg.id,
        periodId: currentPeriod ? currentPeriod.id : 0,
        childId: { in: teamChildIds },
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

    // Vérifier si l'équipe a déjà validé la récompense pour cette énigme et période
    const teamReward = await this.prisma.evoeEasterEggTeamReward.findFirst({
      where: {
        easterEggId: currentEgg.id,
        teamId: team.id,
        periodId: currentPeriod ? currentPeriod.id : 0,
      },
    });

    // Nombre d'équipes ayant déjà gagné pour cette période
    const winningTeamsCount = await this.prisma.evoeEasterEggTeamReward.count({
      where: {
        easterEggId: currentEgg.id,
        periodId: currentPeriod ? currentPeriod.id : 0,
      },
    });

    const isMaxWinningReached =
      maxWinningTeams > 0 &&
      winningTeamsCount >= maxWinningTeams &&
      !teamReward;

    return {
      enabled: true,
      hasActiveEgg: true,
      easterEgg: {
        id: currentEgg.id,
        code: currentEgg.code,
        title: currentEgg.title,
        senderLore: currentEgg.senderLore,
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
        isDiscovered: !!playerProgress,
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
        discoveredPlayers: teamDiscoveries.map(d => ({
          childId: d.child.id,
          pseudo: d.child.pseudo,
          avatar: d.child.avatar,
          discoveredAt: d.discoveredAt,
        })),
      },
    };
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
      }
    }

    return {
      success: true,
      message: 'Félicitations ! Vous avez déverrouillé l’anomalie temporelle.',
      pointsIT: egg.rewardPointsIT,
      discoveredByPlayer: true,
      teamDiscoveriesCount,
      teamTotalPlayers,
      requiredPlayers,
      teamRewardEarned,
      isTeamRewarded: !!existingTeamReward || teamRewardEarned,
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
      include: {
        child: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            group: {
              select: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
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
        teamId: number;
        teamName: string;
        teamColor: string | null;
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
        teamId: p.child.group.team.id,
        teamName: p.child.group.team.name,
        teamColor: p.child.group.team.color,
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
        senderLore: dto.senderLore,
        clues: dto.clues,
        imageUrl: dto.imageUrl || null,
        triggerType: dto.triggerType,
        expectedAnswer: dto.expectedAnswer || null,
        caseSensitive: dto.caseSensitive ?? false,
        triggerConfig: dto.triggerConfig || null,
        complexity: dto.complexity || EasterEggDifficulty.MEDIUM,
        rewardPointsIT: dto.rewardPointsIT || 50,
        orderIndex: dto.orderIndex || 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateEasterEgg(id: number, dto: UpdateEasterEggDto) {
    return this.prisma.evoeEasterEgg.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.senderLore !== undefined && { senderLore: dto.senderLore }),
        ...(dto.clues !== undefined && { clues: dto.clues }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.triggerType !== undefined && { triggerType: dto.triggerType }),
        ...(dto.expectedAnswer !== undefined && { expectedAnswer: dto.expectedAnswer }),
        ...(dto.caseSensitive !== undefined && { caseSensitive: dto.caseSensitive }),
        ...(dto.triggerConfig !== undefined && { triggerConfig: dto.triggerConfig }),
        ...(dto.complexity !== undefined && { complexity: dto.complexity }),
        ...(dto.rewardPointsIT !== undefined && { rewardPointsIT: dto.rewardPointsIT }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
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
      },
    });
    return updated;
  }

  async getAdminTracking(instanceYearId: number) {
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
    const cycleIndex = Math.floor(Math.max(0, currentPeriodIndex - 1) / frequency);

    const activeEggs = await this.prisma.evoeEasterEgg.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    const currentEgg = activeEggs.length > 0 ? activeEggs[cycleIndex % activeEggs.length] : null;

    if (!currentEgg || !currentPeriod) {
      return {
        hasActiveEgg: false,
        teamsTracking: [],
        individualDiscoveries: [],
      };
    }

    const allDiscoveries = await this.prisma.evoeEasterEggPlayerProgress.findMany({
      where: {
        easterEggId: currentEgg.id,
        periodId: currentPeriod.id,
      },
      include: {
        child: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
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
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { discoveredAt: 'asc' },
    });

    const teamRewards = await this.prisma.evoeEasterEggTeamReward.findMany({
      where: {
        easterEggId: currentEgg.id,
        periodId: currentPeriod.id,
      },
    });

    const teamsTracking = instanceYear.teams.map(team => {
      const teamChildren = team.groups.flatMap(g => g.children);
      const teamTotalPlayers = teamChildren.length;
      const teamDiscoveries = allDiscoveries.filter(
        d => d.child.group?.teamId === team.id,
      );
      const reward = teamRewards.find(tr => tr.teamId === team.id);

      return {
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        totalPlayers: teamTotalPlayers,
        discoveredCount: teamDiscoveries.length,
        requiredPlayers: instanceYear.easterEggRequiredPlayers,
        isRewarded: !!reward,
        rewardRank: reward?.rank || null,
        awardedPointsIT: reward?.awardedPointsIT || null,
        completedAt: reward?.completedAt || null,
      };
    });

    return {
      hasActiveEgg: true,
      currentEgg,
      currentPeriod: {
        id: currentPeriod.id,
        periodIndex: currentPeriodIndex,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
      },
      teamsTracking,
      individualDiscoveries: allDiscoveries.map(d => ({
        childId: d.child.id,
        pseudo: d.child.pseudo,
        avatar: d.child.avatar,
        teamName: d.child.group?.team.name,
        teamColor: d.child.group?.team.color,
        discoveredAt: d.discoveredAt,
        resolutionTimeSeconds: d.resolutionTimeSeconds,
        answerSubmitted: d.answerSubmitted,
      })),
    };
  }
}
