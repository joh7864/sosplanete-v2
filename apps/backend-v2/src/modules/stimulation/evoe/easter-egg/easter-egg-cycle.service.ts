import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { EvoeEasterEgg } from '@prisma/client';
import { getEffectivePauseCycles } from './easter-egg.utils';

export interface ResolveEggResult {
  currentEgg: EvoeEasterEgg | null;
  explicitInstance: any | null;
  cycleIndex: number;
  cyclePeriodIds: number[];
  periodStart: any;
  periodEnd: any;
  cycleEggs?: Array<{
    egg: EvoeEasterEgg;
    instance: any;
    isDiscovered: boolean;
    isInteractable: boolean;
    isVisible: boolean;
    isExplicitHintVisible: boolean;
    firstInteractionAt: Date | null;
    discoveredAt: Date | null;
    resolutionTimeSeconds: number | null;
    isRollover?: boolean;
  }>;
  hasAnyInteractable?: boolean;
  unsolvedRolloverCount?: number;
  showRolloverWarning?: boolean;
  multiEggProgress?: {
    total: number;
    solved: number;
    currentIndex: number;
    unsolvedRolloverCount: number;
    showRolloverWarning: boolean;
  };
}

@Injectable()
export class EasterEggCycleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifie si les prérequis de déverrouillage de l'énigme sont satisfaits par le joueur.
   * Accepte un ID de période ou un tableau d'IDs (pour couvrir l'ensemble du cycle orbital).
   */
  async checkPrerequisites(
    egg: { prerequisiteType?: string | null; prerequisiteConfig?: any },
    childId: number,
    periodIds: number | number[],
  ): Promise<boolean> {
    const rawIds = Array.isArray(periodIds) ? periodIds : [periodIds];
    const periodIdsList = rawIds.filter((id) => typeof id === 'number' && id > 0);

    const type = egg.prerequisiteType || 'MISSIONS_COUNT';
    const config = (egg.prerequisiteConfig as any) || {};

    if (type === 'NONE') {
      return true;
    }

    if (type === 'MISSIONS_COUNT') {
      const countReq = config.count != null ? Number(config.count) : 3;
      const sectorsReq = config.distinctSectors != null ? Number(config.distinctSectors) : 2;

      const childActions = await this.prisma.actionDone.findMany({
        where: {
          childId,
          ...(periodIdsList.length > 0 ? { periodId: { in: periodIdsList } } : {}),
        },
        include: {
          localAction: {
            include: { actionRef: true },
          },
        },
      });

      const distinctSectors = new Set(
        childActions
          .map((a) => {
            if (a.localAction?.categoryId != null) {
              return `cat_${a.localAction.categoryId}`;
            }
            if (a.localAction?.actionRef?.category) {
              return `ref_${a.localAction.actionRef.category.toLowerCase().trim()}`;
            }
            return null;
          })
          .filter(Boolean),
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
        where: {
          childId,
          ...(periodIdsList.length > 0 ? { periodId: { in: periodIdsList } } : {}),
        },
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

  /**
   * Détermine l'Easter Egg actif pour une promotion selon la règle stricte :
   * - Un Easter Egg reste actif pendant toute la durée du cycle de fréquence (ex: 2 périodes).
   * - On ne passe au suivant que dans "frequency" périodes,
   * - SAUF demande explicite de l'AM (instance manuelle non clôturée).
   * - Au changement de cycle, si aucun joueur n'a découvert l'œuf précédent, il est reconduit automatiquement.
   */
  async resolveEggForInstance(
    instanceYearId: number,
    periods: any[],
    currentPeriodIndex: number,
    frequency: number,
    activeEggs: EvoeEasterEgg[],
    childId?: number,
  ): Promise<ResolveEggResult> {
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

    const instanceYear = await this.prisma.instanceYear.findUnique({
      where: { id: instanceYearId },
      select: { easterEggPauseCycles: true },
    });
    const totalSeasonCycles = Math.max(1, Math.ceil(periods.length / frequency));
    const effectivePauseCycles = new Set(
      getEffectivePauseCycles(instanceYear || {}, totalSeasonCycles),
    );

    let teamId: number | null = null;
    if (childId) {
      const childData = await this.prisma.child.findUnique({
        where: { id: childId },
        select: { group: { select: { teamId: true } } },
      });
      teamId = childData?.group?.teamId || null;
    }

    const rolloverEggCandidates: Array<{
      egg: EvoeEasterEgg;
      instance: any;
      isRollover: boolean;
      targetPeriodIds: number[];
    }> = [];

    if (childId && teamId && cycleStartPeriodIndex > 0) {
      for (let prevCycleIdx = 0; prevCycleIdx < cycleIndex; prevCycleIdx++) {
        const prevStartPIndex = prevCycleIdx * frequency;
        const prevEndPIndex = Math.min(periods.length - 1, prevStartPIndex + frequency - 1);
        const prevCyclePeriods = periods.slice(prevStartPIndex, prevEndPIndex + 1);
        const prevCyclePeriodIds = prevCyclePeriods.map((p) => p.id);
        const allPeriodsFromOriginToCurrent = periods
          .slice(prevStartPIndex, currentPeriodIndex)
          .map((p) => p.id);

        const prevInstances = await this.prisma.evoeEasterEggInstance.findMany({
          where: {
            instanceYearId,
            periodStartId: { in: prevCyclePeriodIds },
          },
          include: { easterEgg: true },
        });

        const prevEggsForCycle: Array<{ egg: EvoeEasterEgg; instance: any }> = [];
        if (prevInstances.length > 0) {
          for (const pi of prevInstances) {
            if (pi.isClosed) continue;
            if (pi.easterEgg && pi.easterEgg.isActive) {
              prevEggsForCycle.push({ egg: pi.easterEgg, instance: pi });
            }
          }
        } else if (activeEggs.length > 0 && !effectivePauseCycles.has(prevCycleIdx + 1)) {
          const prevAutoEgg = activeEggs[prevCycleIdx % activeEggs.length];
          if (prevAutoEgg) {
            prevEggsForCycle.push({ egg: prevAutoEgg, instance: null });
          }
        }

        for (const pe of prevEggsForCycle) {
          const teamReward = await this.prisma.evoeEasterEggTeamReward.findFirst({
            where: {
              teamId,
              easterEggId: pe.egg.id,
            },
          });

          const playerProgress = childId
            ? await this.prisma.evoeEasterEggPlayerProgress.findFirst({
                where: {
                  childId,
                  easterEggId: pe.egg.id,
                  discoveredAt: { not: null },
                },
              })
            : null;

          if (!teamReward && !playerProgress) {
            if (!rolloverEggCandidates.some((re) => re.egg.id === pe.egg.id)) {
              rolloverEggCandidates.push({
                egg: pe.egg,
                instance: pe.instance,
                isRollover: true,
                targetPeriodIds: allPeriodsFromOriginToCurrent,
              });
            }
          }
        }
      }
    }

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

    const currentCycleEggCandidates: Array<{
      egg: EvoeEasterEgg;
      instance: any;
      isRollover: boolean;
      targetPeriodIds: number[];
    }> = [];

    if (activeInstances.length > 0) {
      for (const inst of activeInstances) {
        if (inst.easterEgg && inst.easterEgg.isActive) {
          const teamReward = teamId
            ? await this.prisma.evoeEasterEggTeamReward.findFirst({
                where: { teamId, easterEggId: inst.easterEgg.id },
              })
            : null;
          const playerProgress = childId
            ? await this.prisma.evoeEasterEggPlayerProgress.findFirst({
                where: { childId, easterEggId: inst.easterEgg.id, discoveredAt: { not: null } },
              })
            : null;

          if (!teamReward && !playerProgress) {
            currentCycleEggCandidates.push({
              egg: inst.easterEgg,
              instance: inst,
              isRollover: false,
              targetPeriodIds:
                cyclePeriodIds.length > 0
                  ? cyclePeriodIds
                  : currentPeriod
                  ? [currentPeriod.id]
                  : [],
            });
          }
        }
      }
    } else if (currentPeriod) {
      const explicitClosedThisPeriod = await this.prisma.evoeEasterEggInstance.findFirst({
        where: {
          instanceYearId,
          isClosed: true,
          periodStartId: currentPeriod.id,
          closedAt: { not: null },
        },
      });

      if (
        !explicitClosedThisPeriod &&
        activeEggs.length > 0 &&
        !effectivePauseCycles.has(cycleIndex + 1)
      ) {
        const autoEgg = activeEggs[cycleIndex % activeEggs.length];
        if (autoEgg) {
          const teamReward = teamId
            ? await this.prisma.evoeEasterEggTeamReward.findFirst({
                where: { teamId, easterEggId: autoEgg.id },
              })
            : null;
          const playerProgress = childId
            ? await this.prisma.evoeEasterEggPlayerProgress.findFirst({
                where: { childId, easterEggId: autoEgg.id, discoveredAt: { not: null } },
              })
            : null;

          if (!teamReward && !playerProgress) {
            currentCycleEggCandidates.push({
              egg: autoEgg,
              instance: null,
              isRollover: false,
              targetPeriodIds:
                cyclePeriodIds.length > 0 ? cyclePeriodIds : [currentPeriod.id],
            });
          }
        }
      }
    }

    const allEggCandidates: Array<{
      egg: EvoeEasterEgg;
      instance: any;
      isRollover: boolean;
      targetPeriodIds: number[];
    }> = [];

    for (const cand of [...rolloverEggCandidates, ...currentCycleEggCandidates]) {
      if (!allEggCandidates.some((c) => c.egg.id === cand.egg.id)) {
        allEggCandidates.push(cand);
      }
    }

    const cycleProgresses = childId
      ? await this.prisma.evoeEasterEggPlayerProgress.findMany({
          where: {
            childId,
            periodId: { in: cyclePeriodIds.length > 0 ? cyclePeriodIds : [currentPeriod.id] },
            discoveredAt: { not: null },
          },
          include: { easterEgg: true },
          orderBy: { discoveredAt: 'asc' },
        })
      : [];

    const solvedCount = cycleProgresses.length;
    const unsolvedCount = allEggCandidates.length;
    const totalCount = Math.max(1, solvedCount + unsolvedCount);
    const currentIndex = Math.min(totalCount, solvedCount + 1);

    const unsolvedRolloverCount = allEggCandidates.length;
    const showRolloverWarning = unsolvedRolloverCount > 4;

    if (allEggCandidates.length === 0) {
      if (cycleProgresses.length > 0) {
        const lastSolved = cycleProgresses[cycleProgresses.length - 1];
        return {
          currentEgg: lastSolved.easterEgg,
          explicitInstance: null,
          cycleIndex,
          cyclePeriodIds,
          periodStart,
          periodEnd,
          cycleEggs: [
            {
              egg: lastSolved.easterEgg,
              instance: null,
              isDiscovered: true,
              isInteractable: false,
              isVisible: true,
              isExplicitHintVisible: false,
              firstInteractionAt: lastSolved.firstInteractionAt,
              discoveredAt: lastSolved.discoveredAt,
              resolutionTimeSeconds: lastSolved.resolutionTimeSeconds,
            },
          ],
          hasAnyInteractable: false,
          unsolvedRolloverCount: 0,
          showRolloverWarning: false,
          multiEggProgress: {
            total: totalCount,
            solved: solvedCount,
            currentIndex: totalCount,
            unsolvedRolloverCount: 0,
            showRolloverWarning: false,
          },
        };
      }
      return {
        currentEgg: null,
        explicitInstance: null,
        cycleIndex,
        cyclePeriodIds,
        periodStart,
        periodEnd,
        cycleEggs: [],
        hasAnyInteractable: false,
        unsolvedRolloverCount: 0,
        showRolloverWarning: false,
        multiEggProgress: {
          total: 0,
          solved: 0,
          currentIndex: 0,
          unsolvedRolloverCount: 0,
          showRolloverWarning: false,
        },
      };
    }

    const cycleEggDetails: Array<{
      egg: EvoeEasterEgg;
      instance: any;
      isDiscovered: boolean;
      isInteractable: boolean;
      isVisible: boolean;
      isExplicitHintVisible: boolean;
      firstInteractionAt: Date | null;
      discoveredAt: Date | null;
      resolutionTimeSeconds: number | null;
      isRollover: boolean;
    }> = [];

    const nowTime = new Date();

    for (const cand of allEggCandidates) {
      let isDiscovered = false;
      let firstInteractionAt: Date | null = null;
      let discoveredAt: Date | null = null;
      let resolutionTimeSeconds: number | null = null;
      let isInteractable = true;

      const combinedPeriods = Array.from(
        new Set([...cand.targetPeriodIds, ...cyclePeriodIds]),
      );

      if (childId) {
        const progress = await this.prisma.evoeEasterEggPlayerProgress.findFirst({
          where: {
            easterEggId: cand.egg.id,
            childId,
            discoveredAt: { not: null },
          },
          orderBy: { id: 'desc' },
        });

        if (progress?.discoveredAt) {
          isDiscovered = true;
          discoveredAt = progress.discoveredAt;
          resolutionTimeSeconds = progress.resolutionTimeSeconds || null;
        }

        const interactionProgress = await this.prisma.evoeEasterEggPlayerProgress.findFirst({
          where: {
            easterEggId: cand.egg.id,
            childId,
          },
          orderBy: { id: 'desc' },
        });
        firstInteractionAt = interactionProgress?.firstInteractionAt || null;

        const hasInteractedPreviously = !!firstInteractionAt;
        if (hasInteractedPreviously) {
          isInteractable = true;
        } else {
          isInteractable = await this.checkPrerequisites(
            cand.egg,
            childId,
            combinedPeriods,
          );
        }
      }

      const isVisible = isDiscovered || isInteractable;

      let isExplicitHintVisible = false;
      if (cand.instance?.forceHint) {
        isExplicitHintVisible = true;
      } else if (teamId && cand.instance?.forcedHintTeamIds?.includes(teamId)) {
        isExplicitHintVisible = true;
      } else if (isInteractable && firstInteractionAt) {
        const delayMs = (cand.egg.hintDelayMinutes || 120) * 60 * 1000;
        if (nowTime.getTime() - firstInteractionAt.getTime() >= delayMs) {
          isExplicitHintVisible = true;
        }
      }

      cycleEggDetails.push({
        egg: cand.egg,
        instance: cand.instance,
        isDiscovered,
        isInteractable,
        isVisible,
        isExplicitHintVisible,
        firstInteractionAt,
        discoveredAt,
        resolutionTimeSeconds,
        isRollover: cand.isRollover,
      });
    }

    const accessibleEggDetails = cycleEggDetails.filter(
      (d) => d.isInteractable || d.isDiscovered,
    );

    const unsolvedAccessible = accessibleEggDetails.filter((d) => !d.isDiscovered);
    const targetUnsolved = unsolvedAccessible[0] || null;

    let chosen: any = null;
    if (targetUnsolved) {
      chosen = targetUnsolved;
    } else if (cycleProgresses.length > 0) {
      const lastSolved = cycleProgresses[cycleProgresses.length - 1];
      chosen = {
        egg: lastSolved.easterEgg,
        instance: null,
        isDiscovered: true,
        isInteractable: false,
        isVisible: true,
        isExplicitHintVisible: false,
        firstInteractionAt: lastSolved.firstInteractionAt,
        discoveredAt: lastSolved.discoveredAt,
        resolutionTimeSeconds: lastSolved.resolutionTimeSeconds,
      };
    }

    const hasAnyInteractable = unsolvedAccessible.length > 0;

    return {
      currentEgg: chosen?.egg || null,
      explicitInstance: chosen?.instance || null,
      cycleIndex,
      cyclePeriodIds,
      periodStart,
      periodEnd,
      cycleEggs: accessibleEggDetails.length > 0 ? accessibleEggDetails : (chosen ? [chosen] : []),
      hasAnyInteractable,
      unsolvedRolloverCount,
      showRolloverWarning,
      multiEggProgress: {
        total: totalCount,
        solved: solvedCount,
        currentIndex,
        unsolvedRolloverCount,
        showRolloverWarning,
      },
    };
  }
}
