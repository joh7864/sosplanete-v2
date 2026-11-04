import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ChatGateway } from '../../chat.gateway';
import {
  getArcadeGameEntry,
  parseArcadeReward,
} from '../../../arcade/arcade-games.catalog';
import {
  EasterEggTriggerType,
  EvoeEasterEgg,
} from '@prisma/client';
import {
  SubmitAnswerDto,
  ValidateTriggerDto,
  ShareEasterEggDto,
} from '../dto/easter-egg.dto';
import {
  normalizeAnswer,
  getRequiredPlayersForEgg,
} from './easter-egg.utils';
import { EasterEggCycleService } from './easter-egg-cycle.service';

@Injectable()
export class EasterEggPlayerService {
  private readonly logger = new Logger(EasterEggPlayerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cycleService: EasterEggCycleService,
    @Optional() private readonly chatGateway?: ChatGateway,
  ) {}

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
    const defaultRequiredPlayers = Math.max(1, instanceYear.easterEggRequiredPlayers || 2);
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
      cycleEggs,
      hasAnyInteractable,
      multiEggProgress: rawMultiProgress,
    } = await this.cycleService.resolveEggForInstance(
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

    // Vérifier également si l'équipe a remporté une victoire sur l'un des œufs de ce cycle
    const cycleTeamReward = await this.prisma.evoeEasterEggTeamReward.findFirst({
      where: {
        teamId: team.id,
        periodId: { in: effectivePeriodIds },
      },
      orderBy: { id: 'desc' },
    });

    // Nombre d'équipes ayant déjà gagné pour ce cycle
    const winningTeamsCount = await this.prisma.evoeEasterEggTeamReward.count({
      where: {
        easterEggId: currentEgg.id,
        team: { instanceYearId: instanceYear.id },
        periodId: { in: effectivePeriodIds },
      },
    });

    const requiredPlayers = getRequiredPlayersForEgg(
      currentEgg,
      teamTotalPlayers,
      defaultRequiredPlayers,
    );
    const remainingPlayers = Math.max(0, requiredPlayers - teamDiscoveries.length);

    const isMaxWinningReached =
      maxWinningTeams > 0 &&
      winningTeamsCount >= maxWinningTeams &&
      !teamReward;

    // --- Immersive Scenario Logic ---
    const nowTime = new Date();
    const chosenDetail = cycleEggs?.find(d => d.egg.id === currentEgg.id);
    const isInteractable = chosenDetail ? chosenDetail.isInteractable : await this.cycleService.checkPrerequisites(
      currentEgg,
      child.id,
      effectivePeriodIds,
    );

    // Le badge HUD n'est cliquable QUE SI au moins un œuf du cycle a son prérequis rempli
    const badgeInteractable = hasAnyInteractable !== undefined
      ? hasAnyInteractable
      : (isInteractable || !!playerProgress?.discoveredAt);

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
    } else if (team.id && explicitInstance?.forcedHintTeamIds?.includes(team.id)) {
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
        isInteractable: chosenDetail ? chosenDetail.isInteractable : isInteractable,
        isExplicitHintVisible: chosenDetail?.isExplicitHintVisible ?? isExplicitHintVisible,
        clues: currentEgg.clues,
        imageUrl: currentEgg.imageUrl,
        triggerType: currentEgg.triggerType,
        complexity: currentEgg.complexity,
        rewardPointsIT: currentEgg.rewardPointsIT,
        specialReward: currentEgg.specialReward,
        orderIndex: currentEgg.orderIndex,
        triggerConfig:
          currentEgg.triggerType === EasterEggTriggerType.RIDDLE_ANSWER_INPUT
            ? null
            : currentEgg.triggerConfig,
      },
      cycleEggs: (cycleEggs || []).map((d) => ({
        id: d.egg.id,
        code: d.egg.code,
        title: d.egg.title,
        crypticMessage: d.egg.crypticMessage,
        explicitHint: d.egg.explicitHint,
        mascotDurationSeconds: d.egg.mascotDurationSeconds,
        triggerAction: d.egg.triggerAction,
        isInteractable: d.isInteractable,
        isDiscovered: d.isDiscovered,
        isExplicitHintVisible: d.isExplicitHintVisible,
        clues: d.egg.clues,
        imageUrl: d.egg.imageUrl,
        triggerType: d.egg.triggerType,
        complexity: d.egg.complexity,
        rewardPointsIT: d.egg.rewardPointsIT,
        specialReward: d.egg.specialReward,
        orderIndex: d.egg.orderIndex,
        triggerConfig:
          d.egg.triggerType === EasterEggTriggerType.RIDDLE_ANSWER_INPUT
            ? null
            : d.egg.triggerConfig,
        firstInteractionAt: d.firstInteractionAt,
        discoveredAt: d.discoveredAt,
        resolutionTimeSeconds: d.resolutionTimeSeconds,
      })),
      hasAnyInteractable: badgeInteractable,
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
        remainingPlayers,
        isTeamRewarded: !!teamReward || !!cycleTeamReward,
        rewardRank: teamReward?.rank || cycleTeamReward?.rank || null,
        awardedPointsIT: teamReward?.awardedPointsIT || cycleTeamReward?.awardedPointsIT || null,
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
          rawMultiProgress && rawMultiProgress.total > 0
            ? rawMultiProgress.solved
            : playerProgress?.discoveredAt
              ? 1
              : 0,
        currentIndex:
          rawMultiProgress && rawMultiProgress.total > 0
            ? rawMultiProgress.currentIndex
            : 1,
        unsolvedRolloverCount: rawMultiProgress?.unsolvedRolloverCount || 0,
        showRolloverWarning: rawMultiProgress?.showRolloverWarning || false,
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

  async recordInteraction(childId: number, easterEggId: number) {
    const { child, instanceYear, periods, currentPeriod, currentPeriodIndex } =
      await this.getPlayerContext(childId);

    const egg = await this.prisma.evoeEasterEgg.findUnique({ where: { id: easterEggId } });
    if (!egg || !egg.isActive) {
      throw new NotFoundException('Énigme introuvable ou inactive');
    }

    const frequency = Math.max(1, instanceYear.easterEggFrequency || 2);
    const cycleIndex = Math.floor(Math.max(0, currentPeriodIndex - 1) / frequency);
    const cycleStartPeriodIndex = cycleIndex * frequency;
    const cycleEndPeriodIndex = Math.min(periods.length - 1, cycleStartPeriodIndex + frequency - 1);
    const cyclePeriods = periods.slice(cycleStartPeriodIndex, cycleEndPeriodIndex + 1);
    const cyclePeriodIds = cyclePeriods.map((p) => p.id);
    const targetPeriodIds = cyclePeriodIds.length > 0 ? cyclePeriodIds : (currentPeriod ? [currentPeriod.id] : []);

    const isInteractable = await this.cycleService.checkPrerequisites(
      egg,
      child.id,
      targetPeriodIds,
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
      : normalizeAnswer(expected) === normalizeAnswer(submitted);

    if (!isMatch) {
      return {
        success: false,
        message: 'Combinaison incorrecte. Analysez attentivement les indices.',
      };
    }

    const effectivePeriodId = dto.periodId || (currentPeriod ? currentPeriod.id : 0);

    return this.processPlayerDiscovery(
      child,
      team,
      instanceYear,
      effectivePeriodId,
      egg,
      submitted,
      dto.resolutionTimeSeconds,
    );
  }

  async validateTrigger(childId: number, dto: ValidateTriggerDto) {
    const { child, team, instanceYear, currentPeriod, periods, currentPeriodIndex } =
      await this.getPlayerContext(childId);

    const frequency = Math.max(1, instanceYear.easterEggFrequency || 2);
    const cycleIndex = Math.floor(Math.max(0, currentPeriodIndex - 1) / frequency);
    const cycleStartPeriodIndex = cycleIndex * frequency;
    const cycleEndPeriodIndex = Math.min(
      periods.length - 1,
      cycleStartPeriodIndex + frequency - 1,
    );
    const cyclePeriods = periods.slice(cycleStartPeriodIndex, cycleEndPeriodIndex + 1);
    const cyclePeriodIds = cyclePeriods.map((p) => p.id);
    const targetPeriodIds = cyclePeriodIds.length > 0 ? cyclePeriodIds : (currentPeriod ? [currentPeriod.id] : []);

    let egg: EvoeEasterEgg | null = null;
    if (dto.easterEggId) {
      egg = await this.prisma.evoeEasterEgg.findUnique({
        where: { id: dto.easterEggId },
      });
    }

    // Si aucun œuf spécifié ou si le triggerType ne correspond pas à l'ID envoyé,
    // on recherche l'œuf correspondant dans les œufs actifs du cycle
    if (!egg || egg.triggerType !== dto.triggerType) {
      const candidateInstances = await this.prisma.evoeEasterEggInstance.findMany({
        where: {
          instanceYearId: instanceYear.id,
          isClosed: false,
          periodStartId: { in: targetPeriodIds },
          easterEgg: { isActive: true, triggerType: dto.triggerType },
        },
        include: { easterEgg: true },
      });

      const matchedInstance = candidateInstances.find((inst) => {
        if (!dto.metadata?.target) return true;
        const config = inst.easterEgg.triggerConfig as any;
        return !config?.target || config.target === dto.metadata.target;
      });

      if (matchedInstance) {
        egg = matchedInstance.easterEgg;
      }

      // Si non trouvé via instance, rechercher via le cycle résolu (cycle naturel ou reporté)
      if (!egg || egg.triggerType !== dto.triggerType) {
        const activeEggs = await this.prisma.evoeEasterEgg.findMany({
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        });
        const resolved = await this.cycleService.resolveEggForInstance(
          instanceYear.id,
          periods,
          currentPeriodIndex,
          frequency,
          activeEggs,
          child.id,
        );
        const candidateCycleEggs = (resolved.cycleEggs || []).filter(
          (ce) => ce.egg.triggerType === dto.triggerType && !ce.isDiscovered,
        );
        const matchedCycleEgg = candidateCycleEggs.find((ce) => {
          if (!dto.metadata?.target) return true;
          const config = ce.egg.triggerConfig as any;
          return !config?.target || config.target === dto.metadata.target;
        });
        if (matchedCycleEgg) {
          egg = matchedCycleEgg.egg;
        } else if (candidateCycleEggs.length > 0) {
          egg = candidateCycleEggs[0].egg;
        }
      }
    }

    if (!egg || !egg.isActive) {
      throw new NotFoundException('Énigme introuvable ou inactive');
    }

    if (egg.triggerType !== dto.triggerType) {
      throw new BadRequestException('Déclencheur non conforme à cette énigme');
    }

    const effectivePeriodId = dto.periodId || (currentPeriod ? currentPeriod.id : 0);

    // Vérification stricte des prérequis pour cet œuf spécifique (sur le cycle orbital)
    const isInteractable = await this.cycleService.checkPrerequisites(egg, child.id, targetPeriodIds);
    if (!isInteractable) {
      throw new BadRequestException('Prérequis non atteints pour cet Easter Egg');
    }

    return this.processPlayerDiscovery(
      child,
      team,
      instanceYear,
      effectivePeriodId,
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

    const requiredPlayers = getRequiredPlayersForEgg(
      egg,
      teamTotalPlayers,
      instanceYear.easterEggRequiredPlayers || 2,
    );
    const remainingPlayers = Math.max(0, requiredPlayers - teamDiscoveriesCount);
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
            this.logger.warn(`[EasterEggPlayerService] Erreur broadcast victoire équipe: ${err?.message}`);
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

    // Déblocage éventuel d'un mini-jeu d'arcade pour toute l'équipe (dès la première découverte)
    let unlockedMiniGame: string | null = null;
    const targetGameKey = parseArcadeReward(egg.specialReward);
    const targetGameEntry = targetGameKey ? getArcadeGameEntry(targetGameKey) : undefined;
    if (targetGameKey && targetGameEntry) {
      try {
        await this.prisma.teamUnlockedArcadeGame.upsert({
          where: {
            teamId_gameKey: {
              teamId: team.id,
              gameKey: targetGameKey,
            },
          },
          create: {
            teamId: team.id,
            gameKey: targetGameKey,
            easterEggCode: egg.code,
            discoveredByChildId: child.id,
          },
          update: {},
        });
        unlockedMiniGame = targetGameKey;
      } catch (err: any) {
        this.logger.warn(`[EasterEggPlayerService] Erreur unlock arcade game ${targetGameKey}: ${err?.message}`);
      }
    }

    let customSuccessMsg = isQuotaReached
      ? `Félicitations ! L'équipe a validé l'énigme et remporté les +${egg.rewardPointsIT} IT !`
      : `Bravo ! Tu as trouvé la solution ! Préviens tes amis de l'équipe, il faut encore ${remainingPlayers} joueur${remainingPlayers > 1 ? 's' : ''} pour gagner les points IT !`;

    if (unlockedMiniGame && targetGameEntry) {
      customSuccessMsg += ` 👾 Le jeu ${targetGameEntry.title} a été débloqué dans la Salle d'Arcade pour toute votre équipe !`;
    }

    if (unlockedArtifact === 'CHRONO_EGG') {
      customSuccessMsg += " ⚡ L'outil Chrono-Egg a été débloqué dans votre équipement temporel !";
    } else if (unlockedArtifact === 'ROSETTA_STONE') {
      customSuccessMsg += " 📜 La Pierre de Rosette 2070 a été découverte et décryptée !";
    }

    return {
      success: true,
      message: customSuccessMsg,
      unlockedArtifact,
      unlockedMiniGame,
      unlockedMiniGameTitle: targetGameEntry?.title ?? null,
      pointsIT: hasTeamReward ? egg.rewardPointsIT : 0,
      discoveredByPlayer: true,
      teamDiscoveriesCount,
      teamTotalPlayers,
      requiredPlayers,
      remainingPlayers,
      teamRewardEarned,
      isQuotaReached,
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

  async getMyDiscoveredEasterEggs(childId: number) {
    const { team, instanceYear, periods } = await this.getPlayerContext(childId);
    const frequency = Math.max(1, instanceYear.easterEggFrequency || 2);

    const progresses = await this.prisma.evoeEasterEggPlayerProgress.findMany({
      where: {
        childId,
        discoveredAt: { not: null },
      },
      include: {
        easterEgg: true,
      },
      orderBy: { discoveredAt: 'asc' },
    });

    const uniqueMap = new Map<number, any>();

    for (const p of progresses) {
      if (!p.easterEgg || uniqueMap.has(p.easterEgg.id)) continue;

      let cycleIndex: number | null = null;
      if (p.periodId) {
        const periodIdx = periods.findIndex((per) => per.id === p.periodId);
        if (periodIdx !== -1) {
          cycleIndex = Math.floor(periodIdx / frequency) + 1;
        }
      }

      const teamReward = await this.prisma.evoeEasterEggTeamReward.findFirst({
        where: {
          teamId: team.id,
          easterEggId: p.easterEgg.id,
        },
      });

      uniqueMap.set(p.easterEgg.id, {
        id: p.easterEgg.id,
        code: p.easterEgg.code,
        title: p.easterEgg.title,
        crypticMessage: p.easterEgg.crypticMessage,
        explicitHint: p.easterEgg.explicitHint,
        triggerType: p.easterEgg.triggerType,
        rewardPointsIT: p.easterEgg.rewardPointsIT,
        specialReward: p.easterEgg.specialReward,
        imageUrl: p.easterEgg.imageUrl,
        discoveredAt: p.discoveredAt,
        resolutionTimeSeconds: p.resolutionTimeSeconds,
        cycleIndex,
        isTeamRewarded: !!teamReward,
      });
    }

    return {
      discoveries: Array.from(uniqueMap.values()),
    };
  }
}
