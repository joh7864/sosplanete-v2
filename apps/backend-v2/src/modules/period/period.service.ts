import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PeriodService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Helper : retrouver l'instanceYearId depuis une Period (pour les
  //          vérifications d'autorisation qui passaient par instanceId)
  // ----------------------------------------------------------------
  private async resolveInstanceIdFromYear(
    instanceYearId: number,
  ): Promise<number> {
    const iy = await this.prisma.instanceYear.findUnique({
      where: { id: instanceYearId },
      select: { instanceId: true },
    });
    if (!iy) throw new NotFoundException('InstanceYear introuvable');
    return iy.instanceId;
  }

  async create(
    data: {
      startDate: Date;
      endDate: Date;
      instanceYearId: number;
      isOpen?: boolean;
    },
    user: any,
  ) {
    const instanceId = await this.resolveInstanceIdFromYear(
      data.instanceYearId,
    );
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed)
      throw new ForbiddenException('Action non autorisée sur cet espace');

    if (data.isOpen) {
      await this.prisma.period.updateMany({
        where: { instanceYearId: data.instanceYearId, isOpen: true },
        data: { isOpen: false },
      });
    }

    const overlap = await this.prisma.period.findFirst({
      where: {
        instanceYearId: data.instanceYearId,
        OR: [
          {
            startDate: { lte: new Date(data.endDate) },
            endDate: { gte: new Date(data.startDate) },
          },
        ],
      },
    });
    if (overlap)
      throw new ForbiddenException(
        'La période chevauche un calendrier existant',
      );

    return this.prisma.period.create({
      data: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isOpen: data.isOpen || false,
        instanceYearId: data.instanceYearId,
      },
    });
  }

  async findAll(instanceYearId: number, user: any) {
    const instanceId = await this.resolveInstanceIdFromYear(instanceYearId);
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Accès refusé à cet espace');

    return this.prisma.period.findMany({
      where: { instanceYearId },
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { actionsDone: true } } },
    });
  }

  async update(
    id: number,
    data: { startDate?: Date; endDate?: Date; isOpen?: boolean },
    user: any,
  ) {
    const period = await this.prisma.period.findUnique({ where: { id } });
    if (!period) throw new ForbiddenException('Période non trouvée');

    const instanceId = await this.resolveInstanceIdFromYear(
      period.instanceYearId,
    );
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    if (data.isOpen === true) {
      await this.prisma.period.updateMany({
        where: {
          instanceYearId: period.instanceYearId,
          id: { not: id },
          isOpen: true,
        },
        data: { isOpen: false },
      });
    }

    const updatedPeriod = await this.prisma.period.update({
      where: { id },
      data: {
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isOpen: data.isOpen,
      },
    });

    // Recalcul en cascade si les dates changent
    if (data.startDate || data.endDate) {
      const futurePeriods = await this.prisma.period.findMany({
        where: {
          instanceYearId: period.instanceYearId,
          startDate: { gt: period.startDate },
          id: { not: id },
        },
        orderBy: { startDate: 'asc' },
      });

      const iy = await this.prisma.instanceYear.findUnique({
        where: { id: period.instanceYearId },
        select: { periodStartDay: true },
      });
      const startDayOfWeek = iy?.periodStartDay ?? 3;

      let currentEnd = new Date(updatedPeriod.endDate);
      for (const fp of futurePeriods) {
        const nextStart = new Date(currentEnd.getTime() + 1000);
        nextStart.setHours(0, 0, 0, 0);

        const d = new Date(nextStart);
        const day = d.getDay();
        let diff = (day - startDayOfWeek + 7) % 7;

        const pStart = new Date(
          d.getTime() - diff * 24 * 60 * 60 * 1000,
        );
        pStart.setHours(0, 0, 0, 0);
        const pEnd = new Date(pStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        pEnd.setHours(23, 59, 59, 999);

        await this.prisma.period.update({
          where: { id: fp.id },
          data: { startDate: pStart, endDate: pEnd },
        });
        currentEnd = pEnd;
      }
    }

    return updatedPeriod;
  }

  async getImpact(id: number, user: any) {
    const period = await this.prisma.period.findUnique({ where: { id } });
    if (!period) throw new ForbiddenException('Période non trouvée');

    const instanceId = await this.resolveInstanceIdFromYear(
      period.instanceYearId,
    );
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    const actions = await this.prisma.actionDone.findMany({
      where: { periodId: id },
      include: {
        child: { include: { group: { include: { team: true } } } },
        localAction: true,
      },
    });

    return {
      count: actions.length,
      list: actions.map((a) => ({
        id: a.id,
        actionName: a.localAction.label,
        childName: a.child.pseudo,
        teamName: a.child.group.team.name,
      })),
    };
  }

  async remove(id: number, user: any) {
    const period = await this.prisma.period.findUnique({ where: { id } });
    if (!period) return { success: false, message: 'Période non trouvée' };

    const instanceId = await this.resolveInstanceIdFromYear(
      period.instanceYearId,
    );
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed)
      throw new ForbiddenException('Action non autorisée sur cet espace');

    await this.prisma.$transaction(async (tx) => {
      await tx.actionDone.deleteMany({ where: { periodId: id } });
      await tx.period.delete({ where: { id } });
    });

    return { success: true };
  }

  // ----------------------------------------------------------------
  // CRON JOB: 23h59 tous les jours — rotation automatique des périodes
  // ----------------------------------------------------------------
  @Cron('59 23 * * *')
  async handlePeriodRotation() {
    console.log('[CRON] Début de la vérification des périodes (rotation)');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Toutes les InstanceYear ouvertes
    const openInstanceYears = await this.prisma.instanceYear.findMany({
      where: { isOpen: true },
      select: { id: true },
    });

    for (const iy of openInstanceYears) {
      const openPeriod = await this.prisma.period.findFirst({
        where: { instanceYearId: iy.id, isOpen: true },
      });

      if (!openPeriod) continue;

      const endDateOnly = new Date(
        openPeriod.endDate.getFullYear(),
        openPeriod.endDate.getMonth(),
        openPeriod.endDate.getDate(),
      );

      if (endDateOnly <= today) {
        const nextStartDate = new Date(openPeriod.endDate);
        nextStartDate.setDate(nextStartDate.getDate() + 1);
        const nextEndDate = new Date(nextStartDate);
        nextEndDate.setDate(nextEndDate.getDate() + 6);

        const existingNext = await this.prisma.period.findFirst({
          where: {
            instanceYearId: iy.id,
            startDate: { lte: nextEndDate },
            endDate: { gte: nextStartDate },
          },
        });

        if (!existingNext) {
          await this.prisma.period.update({
            where: { id: openPeriod.id },
            data: { isOpen: false },
          });
          await this.prisma.period.create({
            data: {
              startDate: nextStartDate,
              endDate: nextEndDate,
              isOpen: true,
              instanceYearId: iy.id,
            },
          });
          console.log(
            `[CRON] InstanceYear ${iy.id} : Période ${openPeriod.id} fermée. Nouvelle période créée.`,
          );
        }
      }
    }
    console.log('[CRON] Fin de la vérification.');
  }

  getPeriodBoundaries(
    date: Date,
    startDayOfWeek: number = 3,
  ): { startDate: Date; endDate: Date } {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    let diff = (day - startDayOfWeek + 7) % 7;

    const startDate = new Date(
      d.getTime() - diff * 24 * 60 * 60 * 1000,
    );
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  async handleCurrentPeriodActivation(instanceYearId: number, tx?: any) {
    const client = tx || this.prisma;
    const now = new Date();

    const period = await client.period.findFirst({
      where: {
        instanceYearId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (period) {
      await client.period.updateMany({
        where: { instanceYearId, isOpen: true },
        data: { isOpen: false },
      });
      await client.period.update({
        where: { id: period.id },
        data: { isOpen: true },
      });
    }
  }

  async syncPeriods(
    instanceId: number,
    instanceYearId: number,
    schoolYear: string,
    force: boolean = false,
    tx?: any,
  ) {
    const client = tx || this.prisma;
    const config = await client.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });

    if (!config || !config.gameStartDate || !config.gameEndDate) {
      console.warn(
        `[syncPeriods] Skipping for instanceYear ${instanceYearId}: missing config dates.`,
      );
      return;
    }

    const startDayOfWeek = config.periodStartDay ?? 3;
    const gameStart = new Date(config.gameStartDate);
    const gameEnd = new Date(config.gameEndDate);

    const currentPeriods = await client.period.findMany({
      where: { instanceYearId },
      orderBy: { startDate: 'asc' },
    });

    const firstBoundaries = this.getPeriodBoundaries(gameStart, startDayOfWeek);
    let pStart = firstBoundaries.startDate;
    let pEnd = firstBoundaries.endDate;

    const generatedPeriods: { startDate: Date; endDate: Date }[] = [];
    while (pStart <= gameEnd) {
      generatedPeriods.push({
        startDate: new Date(pStart),
        endDate: new Date(pEnd),
      });
      pStart = new Date(pStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      pStart.setHours(0, 0, 0, 0);
      pEnd = new Date(pStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      pEnd.setHours(23, 59, 59, 999);
    }

    if (currentPeriods.length > generatedPeriods.length) {
      const toDelete = currentPeriods.slice(generatedPeriods.length);
      const idsToDelete = toDelete.map((p: { id: number }) => p.id);
      const affectedActions = await client.actionDone.count({
        where: { periodId: { in: idsToDelete } },
      });

      if (affectedActions > 0 && !force) {
        throw new ConflictException(
          JSON.stringify({
            warning: true,
            affectedActions,
            message: `Ce changement supprimera ${affectedActions} actions enregistrées. Continuer ?`,
          }),
        );
      }

      for (const p of toDelete) {
        await client.actionDone.deleteMany({ where: { periodId: p.id } });
        await client.period.delete({ where: { id: p.id } });
      }
    }

    for (let i = 0; i < generatedPeriods.length; i++) {
      const p = generatedPeriods[i];
      if (currentPeriods[i]) {
        await client.period.update({
          where: { id: currentPeriods[i].id },
          data: { startDate: p.startDate, endDate: p.endDate },
        });
      } else {
        await client.period.create({
          data: {
            instanceYearId,
            startDate: p.startDate,
            endDate: p.endDate,
            isOpen: false,
          },
        });
      }
    }

    // Synchronisation automatique du nombre total de périodes
    if (client.instanceYear?.update) {
      await client.instanceYear.update({
        where: { id: instanceYearId },
        data: { gamePeriodsCount: generatedPeriods.length },
      });
    }
    if (client.gameConfig?.update) {
      await client.gameConfig.update({
        where: { id: config.id },
        data: { gamePeriodsCount: generatedPeriods.length },
      });
    }
  }
}
