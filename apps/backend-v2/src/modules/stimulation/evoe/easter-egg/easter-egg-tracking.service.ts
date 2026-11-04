import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { EasterEggCycleService } from './easter-egg-cycle.service';
import { getRequiredPlayersForEgg } from './easter-egg.utils';

@Injectable()
export class EasterEggTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cycleService: EasterEggCycleService,
  ) {}

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

    const activeEggs = await this.prisma.evoeEasterEgg.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    const {
      currentEgg: defaultEgg,
      explicitInstance: defaultInstance,
      cycleIndex,
      cyclePeriodIds,
    } = await this.cycleService.resolveEggForInstance(
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
        activeEggs.find((e) => e.id === targetEggId) ||
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

    const periodMap = new Map(periods.map((p, idx) => [p.id, idx + 1]));
    const allPeriodIds = periods.map((p) => p.id);
    const allGameDiscoveries = await this.prisma.evoeEasterEggPlayerProgress.findMany({
      where: {
        OR: [
          { periodId: { in: allPeriodIds } },
          { child: { group: { team: { instanceYearId } } } },
        ],
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

    const cyclePeriodsForAdmin = periods.slice(
      cycleIndex * frequency,
      cycleIndex * frequency + frequency,
    );
    const cyclePeriodIdsAdmin = cyclePeriodsForAdmin.map((p) => p.id);

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
      .filter((i) => i.easterEgg && i.easterEgg.isActive)
      .map((i) => {
        const eggId = i.easterEgg.id;
        const eggDiscoveries = allPeriodDiscoveries.filter((d) => d.easterEggId === eggId);
        const eggRewards = allPeriodTeamRewards.filter((tr) => tr.easterEggId === eggId);

        const discoverers = eggDiscoveries.map((d) => ({
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

        const teamsCompleted = eggRewards.map((tr) => ({
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
          forcedHintTeamIds: i.forcedHintTeamIds || [],
          discoverers,
          teamsCompleted,
        };
      });

    const teamsTracking = instanceYear.teams.map((team) => {
      const teamChildren = team.groups.flatMap((g) => g.children);
      const teamTotalPlayers = teamChildren.length;
      const teamDiscoveries = allPeriodDiscoveries.filter(
        (d) => d.child.group?.teamId === team.id,
      );

      const uniqueContributingPlayerIds = new Set(teamDiscoveries.map((d) => d.child.id));
      const contributingPlayers = Array.from(uniqueContributingPlayerIds).map((childId) => {
        const first = teamDiscoveries.find((d) => d.child.id === childId)!;
        return {
          childId: first.child.id,
          pseudo: first.child.pseudo,
          avatar: first.child.avatar,
          gender: first.child.gender,
        };
      });

      const teamAllRewards = allPeriodTeamRewards.filter((tr) => tr.teamId === team.id);
      const totalAwardedPointsIT = teamAllRewards.reduce((sum, tr) => sum + tr.awardedPointsIT, 0);

      const solvedEggs = teamAllRewards.map((tr) => ({
        easterEggId: tr.easterEggId,
        title: tr.easterEgg?.title || `Easter Egg #${tr.easterEggId}`,
        rank: tr.rank,
        awardedPointsIT: tr.awardedPointsIT,
        completedAt: tr.completedAt,
      }));

      const activeEggsTotal = periodActiveEggs.length || 1;

      const activeEggsList = periodActiveEggs.length > 0
        ? periodActiveEggs
        : [{
            eggId: currentEgg.id,
            code: currentEgg.code,
            title: currentEgg.title,
            rewardPointsIT: currentEgg.rewardPointsIT,
          }];

      const eggsProgress = activeEggsList.map((egg) => {
        const eggDiscoveriesForTeam = teamDiscoveries.filter((d) => d.easterEggId === egg.eggId);
        const eggReward = teamAllRewards.find((tr) => tr.easterEggId === egg.eggId);
        const matchingEgg = activeEggs.find((e) => e.id === egg.eggId);
        const eggRequiredPlayers = getRequiredPlayersForEgg(matchingEgg, teamTotalPlayers);
        const players = eggDiscoveriesForTeam.map((d) => ({
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
          requiredPlayers: eggRequiredPlayers,
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

      const teamRequiredPlayers = getRequiredPlayersForEgg(currentEgg, teamTotalPlayers);

      return {
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        teamIcon: team.icon || null,
        totalPlayers: teamTotalPlayers,
        discoveredCount: uniqueContributingPlayerIds.size,
        requiredPlayers: teamRequiredPlayers,
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
        forcedHintTeamIds: explicitInstance?.forcedHintTeamIds || [],
        discoverers: allPeriodDiscoveries
          .filter((d) => d.easterEggId === currentEgg.id)
          .map((d) => ({
            childId: d.child.id,
            pseudo: d.child.pseudo,
            avatar: d.child.avatar,
            gender: d.child.gender,
            teamId: d.child.group?.teamId,
            teamName: d.child.group?.team?.name || 'Équipe',
            teamColor: d.child.group?.team?.color || '#10b981',
            teamIcon: d.child.group?.team?.icon || null,
            discoveredAt: d.discoveredAt,
          })),
        teamsCompleted: allPeriodTeamRewards
          .filter((tr) => tr.easterEggId === currentEgg.id)
          .map((tr) => ({
            teamId: tr.teamId,
            rank: tr.rank,
            awardedPointsIT: tr.awardedPointsIT,
            completedAt: tr.completedAt,
          })),
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
      individualDiscoveries: allGameDiscoveries.map((d) => ({
        childId: d.child.id,
        pseudo: d.child.pseudo,
        avatar: d.child.avatar,
        gender: d.child.gender,
        teamName: d.child.group?.team.name,
        teamColor: d.child.group?.team.color,
        teamIcon: d.child.group?.team.icon || null,
        periodId: d.periodId,
        periodIndex: periodMap.get(d.periodId) || 1,
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
}
