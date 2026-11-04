import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { EvoeEasterEgg } from '@prisma/client';
import { EasterEggCycleService } from './easter-egg-cycle.service';
import {
  normalizeAnswer,
  getEffectivePauseCycles,
  computeDefaultPauseCycles,
  getRequiredPlayersForEgg,
} from './easter-egg.utils';

@Injectable()
export class EasterEggChronoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cycleService: EasterEggCycleService,
  ) {}

  private async getPlayerContext(childId: number) {
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
    let currentPeriod = periods.find((p) => p.isOpen);
    if (!currentPeriod) {
      currentPeriod =
        periods.find((p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now) ||
        periods[periods.length - 1];
    }

    const currentPeriodIndex = currentPeriod
      ? periods.findIndex((p) => p.id === currentPeriod!.id) + 1
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
   * Récupère l'historique complet de la saison pour le Chrono-Egg, découpé en Cycles de 2 semaines
   */
  async getChronoEggArchive(childId: number) {
    const { team, instanceYear, periods, currentPeriodIndex } =
      await this.getPlayerContext(childId);

    const frequency = Math.max(1, instanceYear.easterEggFrequency || 2);
    const secretWord = (instanceYear.metaEnigmaSecretWord || 'CHRONOS').trim().toUpperCase();

    const teamChildren = team.groups.flatMap((g: any) => g.children);
    const teamChildIds = teamChildren.map((c: any) => c.id);

    const totalCycles = Math.ceil(periods.length / frequency);
    const currentCycleIndex = Math.floor(Math.max(0, currentPeriodIndex - 1) / frequency) + 1;

    const activeCatalog = await this.prisma.evoeEasterEgg.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    const effectivePauseCycles = new Set(
      getEffectivePauseCycles(instanceYear, totalCycles),
    );

    let eggCatalogCursor = 0;
    const cycleEggMapping: Record<number, number[]> = {};
    for (let cIdx = 1; cIdx <= totalCycles; cIdx++) {
      if (!effectivePauseCycles.has(cIdx)) {
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
          hasEgg = false;
          eggIds = [];
        }
      } else {
        if (!effectivePauseCycles.has(cIdx) && cycleEggMapping[cIdx]?.length > 0) {
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
      periods: cycles,
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
    const totalCycles = Math.max(1, Math.ceil(periods.length / frequency));
    const effectivePauseCycles = new Set(
      getEffectivePauseCycles(instanceYear, totalCycles),
    );

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

    if (effectivePauseCycles.has(targetCycleIndex) && instances.length === 0) {
      throw new BadRequestException('Ce cycle temporel est une pause temporelle sans Easter Egg.');
    }

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
        if (!effectivePauseCycles.has(c)) {
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

    let playerProgress = await this.prisma.evoeEasterEggPlayerProgress.findFirst({
      where: {
        easterEggId: candidateEgg.id,
        childId: child.id,
        periodId: { in: cyclePeriodIds },
      },
      orderBy: { id: 'desc' },
    });

    const nowTime = new Date();
    if (!playerProgress) {
      playerProgress = await this.prisma.evoeEasterEggPlayerProgress.create({
        data: {
          easterEggId: candidateEgg.id,
          childId: child.id,
          periodId,
          firstInteractionAt: nowTime,
        },
      });
    } else if (!playerProgress.firstInteractionAt) {
      playerProgress = await this.prisma.evoeEasterEggPlayerProgress.update({
        where: { id: playerProgress.id },
        data: { firstInteractionAt: nowTime },
      });
    }

    const explicitInstance = instances.find((i) => i.easterEggId === candidateEgg.id);
    let isExplicitHintVisible = false;

    if (explicitInstance?.forceHint) {
      isExplicitHintVisible = true;
    } else if (playerProgress.firstInteractionAt) {
      const delayMinutes = candidateEgg.hintDelayMinutes ?? 120;
      const delayMs = delayMinutes * 60 * 1000;
      if (nowTime.getTime() - new Date(playerProgress.firstInteractionAt).getTime() >= delayMs) {
        isExplicitHintVisible = true;
      }
    }

    const teamChildren = team.groups.flatMap((g: any) => g.children);
    const teamChildIds = teamChildren.map((c: any) => c.id);

    const teamDiscoveries = await this.prisma.evoeEasterEggPlayerProgress.findMany({
      where: {
        easterEggId: candidateEgg.id,
        periodId: { in: cyclePeriodIds },
        childId: { in: teamChildIds },
        discoveredAt: { not: null },
      },
      include: {
        child: {
          select: { id: true, pseudo: true, avatar: true },
        },
      },
    });

    const teamReward = await this.prisma.evoeEasterEggTeamReward.findFirst({
      where: {
        easterEggId: candidateEgg.id,
        teamId: team.id,
        periodId: { in: cyclePeriodIds },
      },
    });

    const requiredPlayers = Math.max(1, instanceYear.easterEggRequiredPlayers || 2);

    return {
      periodId,
      cycleIndex: targetCycleIndex,
      easterEgg: candidateEgg,
      isReplayMode: true,
      success: true,
      activeEggData: {
        enabled: true,
        hasActiveEgg: true,
        isReplayMode: true,
        easterEgg: {
          id: candidateEgg.id,
          code: candidateEgg.code,
          title: candidateEgg.title,
          senderLore: candidateEgg.senderLore,
          crypticMessage: candidateEgg.crypticMessage,
          explicitHint: candidateEgg.explicitHint,
          isExplicitHintVisible,
          isInteractable: true,
          clues: candidateEgg.clues,
          imageUrl: candidateEgg.imageUrl,
          triggerType: candidateEgg.triggerType,
          triggerConfig: candidateEgg.triggerConfig,
          complexity: candidateEgg.complexity,
          rewardPointsIT: candidateEgg.rewardPointsIT,
          specialReward: candidateEgg.specialReward,
          orderIndex: candidateEgg.orderIndex,
        },
        period: {
          id: periodId,
          periodIndex: pIdx + 1,
          cycleIndex: targetCycleIndex,
          frequency,
        },
        playerProgress: {
          isDiscovered: !!playerProgress?.discoveredAt,
          firstInteractionAt: playerProgress?.firstInteractionAt || nowTime.toISOString(),
          discoveredAt: playerProgress?.discoveredAt || null,
        },
        teamProgress: {
          teamDiscoveriesCount: teamDiscoveries.length,
          requiredPlayers,
          isTeamRewarded: !!teamReward,
          teamRewardPoints: candidateEgg.rewardPointsIT,
          discoveredPlayers: teamDiscoveries.map((d: any) => ({
            childId: d.child.id,
            pseudo: d.child.pseudo,
            avatar: d.child.avatar,
            discoveredAt: d.discoveredAt,
          })),
        },
        metaEnigma: {
          hasChronoEgg: !!team.hasChronoEgg,
          hasRosettaStone: !!team.hasRosettaStone,
          isMetaEnigmaUnlocked: !!team.isMetaEnigmaUnlocked,
          secretWordLength: (instanceYear.metaEnigmaSecretWord || 'CHRONOS').trim().length,
          periodGlyphIndex: (targetCycleIndex - 1) % 12,
        },
      },
    };
  }

  /**
   * Valide le mot de passe final saisi manuellement par l'élève dans le Terminal
   */
  async submitMetaEnigmaCode(childId: number, code: string) {
    const { team, instanceYear } = await this.getPlayerContext(childId);
    const expected = normalizeAnswer(instanceYear.metaEnigmaSecretWord || 'CHRONOS');
    const submitted = normalizeAnswer(code || '');

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

  /**
   * Récupère la Chrono-Frise de la saison pour le cockpit administrateur
   */
  async getAdminChronoFrise(instanceYearId: number) {
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

    if (!instanceYear) {
      throw new NotFoundException('Année d’instance introuvable');
    }

    const periods = instanceYear.periods || [];
    const now = new Date();
    let currentPeriod = periods.find((p) => p.isOpen);
    if (!currentPeriod) {
      currentPeriod =
        periods.find((p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now) ||
        periods[periods.length - 1];
    }
    const currentPeriodIndex = currentPeriod
      ? periods.findIndex((p) => p.id === currentPeriod!.id) + 1
      : 1;

    const frequency = Math.max(1, instanceYear.easterEggFrequency || 2);
    const totalCycles = Math.max(1, Math.ceil(periods.length / frequency));

    const activeEggs = await this.prisma.evoeEasterEgg.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    const instances = await this.prisma.evoeEasterEggInstance.findMany({
      where: { instanceYearId },
      include: { easterEgg: true },
      orderBy: { id: 'asc' },
    });

    const teamRewards = await this.prisma.evoeEasterEggTeamReward.findMany({
      where: { team: { instanceYearId } },
      include: { easterEgg: true, team: true },
    });

    const periodIds = periods.map((p) => p.id);
    const playerProgresses = await this.prisma.evoeEasterEggPlayerProgress.findMany({
      where: {
        periodId: { in: periodIds },
        discoveredAt: { not: null },
      },
      include: {
        child: {
          include: {
            group: true,
          },
        },
      },
    });

    const currentCycleIndex = Math.floor(Math.max(0, currentPeriodIndex - 1) / frequency);
    const effectivePauseCycles = getEffectivePauseCycles(instanceYear, totalCycles);

    const cycles: any[] = [];

    for (let c = 0; c < totalCycles; c++) {
      const cycleStartIdx = c * frequency;
      const cycleEndIdx = Math.min(periods.length - 1, (c + 1) * frequency - 1);
      const periodStart = periods[cycleStartIdx] || periods[0];
      const periodEnd = periods[cycleEndIdx] || periods[periods.length - 1];
      const cyclePeriods = periods.slice(cycleStartIdx, cycleEndIdx + 1);
      const cyclePeriodIds = cyclePeriods.map((p) => p.id);

      const isCurrent = c === currentCycleIndex;
      const isPast = c < currentCycleIndex;
      const isFuture = c > currentCycleIndex;
      const isPause = effectivePauseCycles.includes(c + 1);

      const naturalEgg =
        !isPause && activeEggs.length > 0 ? activeEggs[c % activeEggs.length] : null;

      const cycleInstances = instances.filter(
        (inst) =>
          inst.periodStartId != null &&
          cyclePeriodIds.includes(inst.periodStartId) &&
          inst.easterEgg?.isActive,
      );

      const rolloverEggs: any[] = [];
      if (isCurrent && c > 0) {
        for (let prevC = 0; prevC < c; prevC++) {
          const prevEgg = activeEggs[prevC % activeEggs.length];
          if (prevEgg) {
            const hasUnsolvedTeam = instanceYear.teams.some((team) => {
              const rewarded = teamRewards.some(
                (tr) => tr.teamId === team.id && tr.easterEggId === prevEgg.id,
              );
              return !rewarded;
            });
            if (hasUnsolvedTeam && !rolloverEggs.some((e) => e.id === prevEgg.id)) {
              rolloverEggs.push({
                ...prevEgg,
                originType: 'ROLLOVER' as const,
                originCycleIndex: prevC + 1,
              });
            }
          }
        }
      }

      const rawEggsList: any[] = [];

      if (isPast) {
        if (naturalEgg) {
          const hasRewardInCycle = teamRewards.some(
            (tr) => tr.easterEggId === naturalEgg.id && cyclePeriodIds.includes(tr.periodId),
          );
          if (hasRewardInCycle) {
            rawEggsList.push({
              ...naturalEgg,
              originType: 'NATURAL' as const,
              originCycleIndex: c + 1,
            });
          }
        }

        for (const inst of cycleInstances) {
          const hasRewardInCycle = teamRewards.some(
            (tr) => tr.easterEggId === inst.easterEgg.id && cyclePeriodIds.includes(tr.periodId),
          );
          if (hasRewardInCycle && !rawEggsList.some((e) => e.id === inst.easterEgg.id)) {
            rawEggsList.push({
              ...inst.easterEgg,
              originType: 'MANUAL_ADD' as const,
              originCycleIndex: c + 1,
              instanceId: inst.id,
              forceHint: !!inst.forceHint,
            });
          }
        }

        const otherRewardsInCycle = teamRewards.filter(
          (tr) => cyclePeriodIds.includes(tr.periodId) && !rawEggsList.some((e) => e.id === tr.easterEggId),
        );
        for (const tr of otherRewardsInCycle) {
          const eggObj = activeEggs.find((e) => e.id === tr.easterEggId) || tr.easterEgg;
          if (eggObj) {
            const origIdx = activeEggs.findIndex((e) => e.id === eggObj.id);
            const origCycleIndex = origIdx >= 0 ? (origIdx % totalCycles) + 1 : 1;
            rawEggsList.push({
              ...eggObj,
              originType: 'ROLLOVER' as const,
              originCycleIndex: origCycleIndex,
            });
          }
        }
      } else if (isCurrent) {
        if (naturalEgg) {
          rawEggsList.push({
            ...naturalEgg,
            originType: 'NATURAL' as const,
            originCycleIndex: c + 1,
          });
        }

        for (const inst of cycleInstances) {
          if (!rawEggsList.some((e) => e.id === inst.easterEgg.id)) {
            rawEggsList.push({
              ...inst.easterEgg,
              originType: 'MANUAL_ADD' as const,
              originCycleIndex: c + 1,
              instanceId: inst.id,
              forceHint: !!inst.forceHint,
            });
          }
        }

        for (const ro of rolloverEggs) {
          if (!rawEggsList.some((e) => e.id === ro.id)) {
            rawEggsList.push(ro);
          }
        }
      } else {
        if (naturalEgg) {
          rawEggsList.push({
            ...naturalEgg,
            originType: 'NATURAL' as const,
            originCycleIndex: c + 1,
          });
        }
      }

      const teamStatuses: any[] = [];

      const enrichedEggs = rawEggsList.map((egg) => {
        const eggRewards = teamRewards.filter(
          (tr) => tr.easterEggId === egg.id && cyclePeriodIds.includes(tr.periodId),
        );

        const priorRewards = isCurrent
          ? teamRewards.filter(
              (tr) => tr.easterEggId === egg.id && !cyclePeriodIds.includes(tr.periodId),
            )
          : [];

        const resolvedTeams = eggRewards.map((tr) => {
          const team = instanceYear.teams.find((t) => t.id === tr.teamId);
          const teamChildren = team ? team.groups.flatMap((g) => g.children) : [];
          const teamChildIds = new Set(teamChildren.map((ch) => ch.id));
          const discoverersCount = playerProgresses.filter(
            (pp) => pp.easterEggId === egg.id && teamChildIds.has(pp.childId),
          ).length;

          const requiredPlayers = getRequiredPlayersForEgg(
            egg,
            teamChildren.length,
            instanceYear.easterEggRequiredPlayers || 2,
          );

          return {
            teamId: tr.teamId,
            teamName: team?.name || tr.team?.name || 'Équipe',
            teamColor: team?.color || tr.team?.color || '#10b981',
            teamIcon: team?.icon || tr.team?.icon || null,
            rank: tr.rank,
            awardedPointsIT: tr.awardedPointsIT,
            solvedAt: tr.completedAt,
            periodId: tr.periodId,
            discoverersCount,
            requiredPlayers,
            totalPlayers: teamChildren.length,
          };
        }).sort((a, b) => (a.rank || 99) - (b.rank || 99));

        const previouslyResolvedTeams = priorRewards.map((tr) => {
          const team = instanceYear.teams.find((t) => t.id === tr.teamId);
          const pIdx = periods.findIndex((p) => p.id === tr.periodId);
          const solvedCycleIndex = pIdx >= 0 ? Math.floor(pIdx / frequency) + 1 : null;
          return {
            teamId: tr.teamId,
            teamName: team?.name || tr.team?.name || 'Équipe',
            teamColor: team?.color || tr.team?.color || '#10b981',
            teamIcon: team?.icon || tr.team?.icon || null,
            rank: tr.rank,
            awardedPointsIT: tr.awardedPointsIT,
            solvedAt: tr.completedAt,
            solvedCycleIndex,
          };
        });

        const pendingTeams = instanceYear.teams
          .filter(
            (t) =>
              !eggRewards.some((tr) => tr.teamId === t.id) &&
              !priorRewards.some((tr) => tr.teamId === t.id),
          )
          .map((team) => {
            const teamChildren = team.groups.flatMap((g) => g.children);
            const teamChildIds = new Set(teamChildren.map((ch) => ch.id));
            const discoverersCount = playerProgresses.filter(
              (pp) => pp.easterEggId === egg.id && teamChildIds.has(pp.childId),
            ).length;

            const requiredPlayers = getRequiredPlayersForEgg(
              egg,
              teamChildren.length,
              instanceYear.easterEggRequiredPlayers || 2,
            );

            let status: 'ROLLED_OVER' | 'IN_PROGRESS' | 'UPCOMING' | 'MISSED';
            if (egg.originType === 'ROLLOVER') {
              status = 'ROLLED_OVER';
            } else if (isPast) {
              status = 'ROLLED_OVER';
            } else if (isCurrent) {
              status = 'IN_PROGRESS';
            } else {
              status = 'UPCOMING';
            }

            return {
              teamId: team.id,
              teamName: team.name,
              teamColor: team.color,
              teamIcon: team.icon || null,
              status,
              discoverersCount,
              requiredPlayers,
              totalPlayers: teamChildren.length,
            };
          });

        for (const team of instanceYear.teams) {
          const reward = eggRewards.find((tr) => tr.teamId === team.id);
          const priorReward = priorRewards.find((tr) => tr.teamId === team.id);
          const teamChildren = team.groups.flatMap((g) => g.children);
          const teamChildIds = new Set(teamChildren.map((ch) => ch.id));
          const discoverersCount = playerProgresses.filter(
            (pp) => pp.easterEggId === egg.id && teamChildIds.has(pp.childId),
          ).length;

          let status: 'SOLVED' | 'IN_PROGRESS' | 'ROLLED_OVER' | 'MISSED' | 'UPCOMING';
          if (reward || priorReward) {
            status = 'SOLVED';
          } else if (egg.originType === 'ROLLOVER' || isPast) {
            status = 'ROLLED_OVER';
          } else if (isCurrent) {
            status = 'IN_PROGRESS';
          } else {
            status = 'UPCOMING';
          }

          const effectiveReward = reward || priorReward;
          teamStatuses.push({
            teamId: team.id,
            teamName: team.name,
            teamColor: team.color,
            teamIcon: team.icon || null,
            eggId: egg.id,
            status,
            solvedAt: effectiveReward?.completedAt || null,
            discoverersCount,
            totalPlayers: teamChildren.length,
            isRewarded: !!effectiveReward,
            rank: effectiveReward?.rank || null,
            awardedPointsIT: effectiveReward?.awardedPointsIT || null,
          });
        }

        return {
          id: egg.id,
          title: egg.title,
          code: egg.code,
          enigmaType: egg.enigmaType,
          triggerType: egg.triggerType,
          glyphChar: egg.glyphChar,
          rewardPointsIT: egg.rewardPointsIT,
          originType: egg.originType || 'NATURAL',
          originCycleIndex: egg.originCycleIndex || null,
          instanceId: egg.instanceId || null,
          forceHint: !!egg.forceHint,
          isResolvedByAtLeastOneTeam: resolvedTeams.length > 0 || previouslyResolvedTeams.length > 0,
          resolvedTeams,
          previouslyResolvedTeams,
          pendingTeams,
        };
      });

      const cycleResolvedTeamsMap = new Map<number, any>();
      for (const e of enrichedEggs) {
        for (const rt of e.resolvedTeams) {
          if (cyclePeriodIds.includes(rt.periodId) && !cycleResolvedTeamsMap.has(rt.teamId)) {
            cycleResolvedTeamsMap.set(rt.teamId, {
              teamId: rt.teamId,
              teamName: rt.teamName,
              teamColor: rt.teamColor,
              teamIcon: rt.teamIcon,
            });
          }
        }
      }
      const cycleResolvedTeams = Array.from(cycleResolvedTeamsMap.values());

      cycles.push({
        cycleIndex: c + 1,
        isCurrent,
        isPast,
        isFuture,
        isPause,
        periodStart: periodStart
          ? {
              id: periodStart.id,
              name: (periodStart as any).name || `Période ${cycleStartIdx + 1}`,
              startDate: periodStart.startDate,
            }
          : null,
        periodEnd: periodEnd
          ? {
              id: periodEnd.id,
              name: (periodEnd as any).name || `Période ${cycleEndIdx + 1}`,
              endDate: periodEnd.endDate,
            }
          : null,
        eggs: enrichedEggs,
        cycleResolvedTeams,
        hasAnyEggSolved: cycleResolvedTeams.length > 0,
        teamStatuses,
      });
    }

    return {
      instanceYearId,
      frequency,
      totalCycles,
      currentPeriodId: currentPeriod?.id || null,
      currentPeriodIndex,
      easterEggPauseCycles: instanceYear.easterEggPauseCycles || [],
      effectivePauseCycles,
      defaultPauseProposal: computeDefaultPauseCycles(totalCycles),
      teams: instanceYear.teams.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        icon: t.icon || null,
        totalPlayers: t.groups.flatMap((g) => g.children).length,
      })),
      cycles,
    };
  }
}
