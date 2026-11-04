import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ChatGateway } from '../../chat.gateway';
import { EasterEggCycleService } from './easter-egg-cycle.service';
import {
  UpdateEasterEggSettingsDto,
  ResetEggProgressDto,
} from '../dto/easter-egg.dto';

@Injectable()
export class EasterEggInstanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cycleService: EasterEggCycleService,
    @Optional() private readonly chatGateway?: ChatGateway,
  ) {}

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
        ...(dto.easterEggPauseCycles !== undefined && {
          easterEggPauseCycles: dto.easterEggPauseCycles,
        }),
        ...(dto.metaEnigmaSecretWord !== undefined && {
          metaEnigmaSecretWord: dto.metaEnigmaSecretWord,
        }),
        ...(dto.metaEnigmaPeriodGlyphs !== undefined && {
          metaEnigmaPeriodGlyphs: dto.metaEnigmaPeriodGlyphs,
        }),
      },
    });
    this.chatGateway?.broadcastEasterEggUpdate(instanceYearId, { action: 'settings' });
    return updated;
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
    let currentPeriod = periods.find((p) => p.isOpen);
    if (!currentPeriod) {
      currentPeriod =
        periods.find((p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now) ||
        periods[periods.length - 1];
    }
    if (!currentPeriod) throw new BadRequestException('Aucune période trouvée');

    if (closePrevious) {
      await this.prisma.evoeEasterEggInstance.updateMany({
        where: { instanceYearId, isClosed: false },
        data: { isClosed: true, closedAt: new Date() },
      });
    } else {
      const existingOpen = await this.prisma.evoeEasterEggInstance.findMany({
        where: { instanceYearId, isClosed: false, periodStartId: currentPeriod.id },
      });

      if (existingOpen.length === 0) {
        const activeEggs = await this.prisma.evoeEasterEgg.findMany({
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        });
        const periodIdx = periods.indexOf(currentPeriod) + 1;
        const tracking = await this.cycleService.resolveEggForInstance(
          instanceYearId,
          periods,
          periodIdx,
          instanceYear.easterEggFrequency || 2,
          activeEggs,
        );
        const naturalEgg = tracking.currentEgg;
        if (naturalEgg && naturalEgg.id !== easterEggId) {
          await this.prisma.evoeEasterEggInstance.upsert({
            where: {
              instanceYearId_easterEggId_periodStartId: {
                instanceYearId,
                easterEggId: naturalEgg.id,
                periodStartId: currentPeriod.id,
              },
            },
            update: {
              isClosed: false,
              closedAt: null,
            },
            create: {
              instanceYearId,
              easterEggId: naturalEgg.id,
              periodStartId: currentPeriod.id,
              periodEndId: currentPeriod.id,
              isClosed: false,
              forceHint: false,
              unlockedAt: new Date(),
            },
          });
        }
      }
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

    this.chatGateway?.broadcastEasterEggUpdate(instanceYearId, { action: 'open', easterEggId });

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
    let currentPeriod = periods.find((p) => p.isOpen);
    if (!currentPeriod) {
      currentPeriod =
        periods.find((p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now) ||
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
      let targetEgg = easterEggId
        ? await this.prisma.evoeEasterEgg.findUnique({ where: { id: easterEggId } })
        : null;

      if (!targetEgg) {
        const activeEggs = await this.prisma.evoeEasterEgg.findMany({
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        });
        const periodIdx = periods.indexOf(currentPeriod) + 1;
        const tracking = await this.cycleService.resolveEggForInstance(
          instanceYearId,
          periods,
          periodIdx,
          instanceYear.easterEggFrequency || 2,
          activeEggs,
        );
        targetEgg = tracking.currentEgg;
      }

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

    this.chatGateway?.broadcastEasterEggUpdate(instanceYearId, { action: 'close', easterEggId });

    return { success: true, message: 'Easter Egg clôturé pour cette période' };
  }

  async forceInstanceHint(
    instanceYearId: number,
    easterEggId?: number,
    teamId?: number,
    revoke = false,
  ) {
    const activeInstance = await this.prisma.evoeEasterEggInstance.findFirst({
      where: {
        instanceYearId,
        isClosed: false,
        ...(easterEggId ? { easterEggId } : {}),
      },
      orderBy: { id: 'desc' },
    });

    if (activeInstance) {
      let updatedForceHint = activeInstance.forceHint;
      let updatedForcedHintTeamIds = Array.isArray(activeInstance.forcedHintTeamIds)
        ? [...activeInstance.forcedHintTeamIds]
        : [];

      if (revoke) {
        if (teamId) {
          updatedForcedHintTeamIds = updatedForcedHintTeamIds.filter((id) => id !== teamId);
        } else {
          updatedForceHint = false;
          updatedForcedHintTeamIds = [];
        }
      } else {
        if (teamId) {
          if (!updatedForcedHintTeamIds.includes(teamId)) {
            updatedForcedHintTeamIds.push(teamId);
          }
        } else {
          updatedForceHint = true;
        }
      }

      await this.prisma.evoeEasterEggInstance.update({
        where: { id: activeInstance.id },
        data: {
          forceHint: updatedForceHint,
          forcedHintTeamIds: updatedForcedHintTeamIds,
        },
      });

      this.chatGateway?.broadcastEasterEggUpdate(instanceYearId, {
        action: 'force_hint',
        easterEggId: activeInstance.easterEggId,
        teamId,
        revoke,
      });

      const message = revoke
        ? teamId
          ? 'Forçage de l’indice révoqué pour cette équipe (temporisation normale rétablie)'
          : 'Forçage de l’indice révoqué pour toutes les équipes'
        : teamId
          ? '2ème indice forcé pour l’équipe sélectionnée'
          : '2ème indice forcé pour toutes les équipes';

      return {
        success: true,
        message,
        forceHint: updatedForceHint,
        forcedHintTeamIds: updatedForcedHintTeamIds,
      };
    } else {
      const instanceYear = await this.prisma.instanceYear.findUnique({
        where: { id: instanceYearId },
        include: { periods: { orderBy: { startDate: 'asc' } } },
      });
      if (!instanceYear) throw new NotFoundException('Année d’instance introuvable');

      const now = new Date();
      const periods = instanceYear.periods || [];
      const currentPeriod =
        periods.find((p) => p.isOpen) ||
        periods.find((p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now) ||
        periods[periods.length - 1];

      if (!currentPeriod) {
        throw new BadRequestException('Aucun Easter Egg actif à forcer');
      }

      let targetEgg = easterEggId
        ? await this.prisma.evoeEasterEgg.findUnique({ where: { id: easterEggId } })
        : null;

      if (!targetEgg) {
        const activeEggs = await this.prisma.evoeEasterEgg.findMany({
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        });
        const periodIdx = periods.indexOf(currentPeriod) + 1;
        const tracking = await this.cycleService.resolveEggForInstance(
          instanceYearId,
          periods,
          periodIdx,
          instanceYear.easterEggFrequency || 2,
          activeEggs,
        );
        targetEgg = tracking.currentEgg;
      }

      if (!targetEgg) {
        throw new BadRequestException('Aucun Easter Egg actif à forcer');
      }

      const initialForceHint = !revoke && !teamId;
      const initialTeamIds = !revoke && teamId ? [teamId] : [];

      const created = await this.prisma.evoeEasterEggInstance.upsert({
        where: {
          instanceYearId_easterEggId_periodStartId: {
            instanceYearId,
            easterEggId: targetEgg.id,
            periodStartId: currentPeriod.id,
          },
        },
        update: {
          forceHint: initialForceHint,
          forcedHintTeamIds: initialTeamIds,
        },
        create: {
          instanceYearId,
          easterEggId: targetEgg.id,
          periodStartId: currentPeriod.id,
          periodEndId: currentPeriod.id,
          forceHint: initialForceHint,
          forcedHintTeamIds: initialTeamIds,
          isClosed: false,
        },
      });

      this.chatGateway?.broadcastEasterEggUpdate(instanceYearId, {
        action: 'force_hint',
        easterEggId: targetEgg.id,
        teamId,
        revoke,
      });

      const message = revoke
        ? 'Forçage de l’indice révoqué'
        : teamId
          ? '2ème indice forcé pour l’équipe sélectionnée'
          : '2ème indice forcé pour cette période';

      return {
        success: true,
        message,
        forceHint: created.forceHint,
        forcedHintTeamIds: created.forcedHintTeamIds,
      };
    }
  }

  async resetEggProgress(dto: ResetEggProgressDto) {
    const { easterEggIds, all, instanceYearId } = dto;

    let targetEggIds: number[] = [];
    if (all) {
      const allEggs = await this.prisma.evoeEasterEgg.findMany({ select: { id: true } });
      targetEggIds = allEggs.map((e) => e.id);
    } else if (Array.isArray(easterEggIds) && easterEggIds.length > 0) {
      targetEggIds = easterEggIds.map((id) => +id).filter((id) => !isNaN(id));
    }

    if (targetEggIds.length === 0 && !all) {
      throw new BadRequestException("Veuillez spécifier au moins un Easter Egg ou l'option 'all: true'.");
    }

    let periodIdsFilter: number[] | undefined = undefined;
    if (instanceYearId) {
      const periods = await this.prisma.period.findMany({
        where: { instanceYearId: +instanceYearId },
        select: { id: true },
      });
      periodIdsFilter = periods.map((p) => p.id);
    }

    const progressWhere: any = {};
    const rewardsWhere: any = {};

    if (!all || targetEggIds.length > 0) {
      progressWhere.easterEggId = { in: targetEggIds };
      rewardsWhere.easterEggId = { in: targetEggIds };
    }
    if (periodIdsFilter && periodIdsFilter.length > 0) {
      progressWhere.periodId = { in: periodIdsFilter };
      rewardsWhere.periodId = { in: periodIdsFilter };
    }

    const deletedProgress = await this.prisma.evoeEasterEggPlayerProgress.deleteMany({
      where: progressWhere,
    });

    const deletedRewards = await this.prisma.evoeEasterEggTeamReward.deleteMany({
      where: rewardsWhere,
    });

    if (all) {
      if (instanceYearId) {
        const teams = await this.prisma.team.findMany({
          where: { instanceYearId: +instanceYearId },
          select: { id: true },
        });
        if (teams.length > 0) {
          await this.prisma.team.updateMany({
            where: { id: { in: teams.map((t) => t.id) } },
            data: {
              hasChronoEgg: false,
              hasRosettaStone: false,
              isMetaEnigmaUnlocked: false,
            },
          });
        }
      } else {
        await this.prisma.team.updateMany({
          data: {
            hasChronoEgg: false,
            hasRosettaStone: false,
            isMetaEnigmaUnlocked: false,
          },
        });
      }
    }

    const instanceWhere: any = {};
    if (targetEggIds.length > 0) instanceWhere.easterEggId = { in: targetEggIds };
    if (instanceYearId) instanceWhere.instanceYearId = +instanceYearId;
    await this.prisma.evoeEasterEggInstance.updateMany({
      where: instanceWhere,
      data: { forceHint: false },
    });

    return {
      success: true,
      resetEggIds: targetEggIds,
      deletedProgressCount: deletedProgress.count,
      deletedRewardsCount: deletedRewards.count,
      all: !!all,
      message: `Progression réinitialisée avec succès (${deletedProgress.count} découvertes, ${deletedRewards.count} récompenses d'équipe supprimées).`,
    };
  }
}
