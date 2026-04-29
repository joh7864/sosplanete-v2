import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';

@Injectable()
export class InstanceService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInstanceDto) {
    if (data.gameStartDate && typeof data.gameStartDate === 'string') {
      data.gameStartDate = new Date(data.gameStartDate);
    }
    if (data.gameEndDate && typeof data.gameEndDate === 'string') {
      data.gameEndDate = new Date(data.gameEndDate);
    }

    const instance = await this.prisma.instance.create({
      data: {
        schoolName: data.schoolName,
        hostUrl: data.hostUrl,
        adminId: data.adminId,
        isOpen: data.isOpen ?? false,
        gameStartDate: data.gameStartDate,
        gameEndDate: data.gameEndDate,
        gamePeriodsCount: data.gamePeriodsCount ?? 24,
      },
    });


    // Génération initiale des périodes
    await this.syncPeriods(instance.id);

    return instance;
  }

  async findAll(userId?: number, role?: string) {
    const where: any = {};
    if (role === 'AM' && userId) {
      where.adminId = userId;
    }

    const instances = await this.prisma.instance.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          },
        },
        _count: {
          select: {
            teams: true,
            localActions: true,
            periods: true
          }
        }
      },
    });

    return Promise.all(instances.map(async (instance) => {
      // Compte total des joueurs dans l'instance
      const playersCount = await this.prisma.child.count({
        where: { group: { team: { instanceId: instance.id } } }
      });

      // Comptage exact du nombre d'actions réalisées
      const totalActionsDone = await this.prisma.actionDone.count({
        where: { child: { group: { team: { instanceId: instance.id } } } }
      });

      // Somme des impacts de ces actions
      const impactsAgg = await this.prisma.actionDone.aggregate({
        _sum: {
          savedCo2: true,
          savedWater: true,
          savedWaste: true
        },
        where: { child: { group: { team: { instanceId: instance.id } } } }
      });

      return {
        ...instance,
        playersCount,
        totalActionsDone,
        totalImpacts: {
          co2: impactsAgg._sum.savedCo2 || 0,
          water: impactsAgg._sum.savedWater || 0,
          waste: impactsAgg._sum.savedWaste || 0
        }
      };
    }));
  }

  async findOne(id: number) {
    const instance = await this.prisma.instance.findUnique({
      where: { id },
      include: {
        admin: true,
        teams: {
          include: {
            groups: {
              include: {
                _count: {
                  select: { children: true }
                }
              }
            }
          }
        },
        _count: {
          select: {
            teams: true,
            localActions: true
          }
        }
      },
    });

    if (!instance) {
      throw new NotFoundException(`Instance #${id} non trouvée`);
    }

    return instance;
  }

  async update(id: number, data: UpdateInstanceDto) {
    if (data.gameStartDate && typeof data.gameStartDate === 'string') {
      data.gameStartDate = new Date(data.gameStartDate);
    }
    if (data.gameEndDate && typeof data.gameEndDate === 'string') {
      data.gameEndDate = new Date(data.gameEndDate);
    }

    const updated = await this.prisma.instance.update({
      where: { id },
      data,
    });

    // Cascade fermeture
    if (data.isOpen === false) {
      await this.prisma.period.updateMany({
        where: { instanceId: id },
        data: { isOpen: false },
      });
    }

    if (data.gameStartDate !== undefined || data.gameEndDate !== undefined || data.gamePeriodsCount !== undefined) {
      await this.syncPeriods(id);
    }

    // Toujours forcer l'activation dynamique de la période courante à l'ouverture
    if (updated.isOpen === true) {
      await this.handleCurrentPeriodActivation(id);
    }

    return updated;
  }

  private getPeriodBoundaries(date: Date): { startDate: Date; endDate: Date } {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    let diffToWednesday = day - 3;
    if (diffToWednesday < 0) {
      diffToWednesday += 7;
    }

    const startDate = new Date(d.getTime() - diffToWednesday * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  private async handleCurrentPeriodActivation(instanceId: number) {
    const now = new Date();
    const instance = await this.prisma.instance.findUnique({ where: { id: instanceId } });
    if (!instance) return;

    const boundaries = this.getPeriodBoundaries(now);

    if (instance.gameEndDate && instance.gameEndDate < now) {
      // Rallonger de 3 périodes
      const p1Start = boundaries.startDate;
      const p1End = boundaries.endDate;

      const p2Start = new Date(p1Start.getTime() + 7 * 24 * 60 * 60 * 1000);
      const p2End = new Date(p1End.getTime() + 7 * 24 * 60 * 60 * 1000);

      const p3Start = new Date(p2Start.getTime() + 7 * 24 * 60 * 60 * 1000);
      const p3End = new Date(p2End.getTime() + 7 * 24 * 60 * 60 * 1000);

      const dates = [
        { start: p1Start, end: p1End, open: true },
        { start: p2Start, end: p2End, open: false },
        { start: p3Start, end: p3End, open: false }
      ];

      await this.prisma.period.updateMany({
        where: { instanceId, isOpen: true },
        data: { isOpen: false },
      });

      for (const d of dates) {
        const existing = await this.prisma.period.findFirst({
          where: {
            instanceId,
            startDate: d.start,
            endDate: d.end
          }
        });

        if (existing) {
          await this.prisma.period.update({
            where: { id: existing.id },
            data: { isOpen: d.open }
          });
        } else {
          await this.prisma.period.create({
            data: {
              instanceId,
              startDate: d.start,
              endDate: d.end,
              isOpen: d.open
            }
          });
        }
      }

      const totalPeriods = await this.prisma.period.count({ where: { instanceId } });
      await this.prisma.instance.update({
        where: { id: instanceId },
        data: {
          gameEndDate: p3End,
          gamePeriodsCount: totalPeriods
        }
      });

    } else {
      await this.prisma.period.updateMany({
        where: { instanceId, isOpen: true },
        data: { isOpen: false },
      });

      const period = await this.prisma.period.findFirst({
        where: {
          instanceId,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      });

      if (period) {
        await this.prisma.period.update({
          where: { id: period.id },
          data: { isOpen: true },
        });
      } else {
        await this.prisma.period.create({
          data: {
            instanceId,
            startDate: boundaries.startDate,
            endDate: boundaries.endDate,
            isOpen: true,
          },
        });
        const totalPeriods = await this.prisma.period.count({ where: { instanceId } });
        await this.prisma.instance.update({
          where: { id: instanceId },
          data: { gamePeriodsCount: totalPeriods }
        });
      }
    }
  }


  private async syncPeriods(instanceId: number) {
    const instance = await this.prisma.instance.findUnique({
      where: { id: instanceId },
    });

    if (!instance || !instance.gameStartDate) return;

    const gameStart = new Date(instance.gameStartDate);
    const gameEnd = instance.gameEndDate 
      ? new Date(instance.gameEndDate) 
      : new Date(gameStart.getTime() + (instance.gamePeriodsCount || 24) * 7 * 24 * 60 * 60 * 1000);

    const currentPeriods = await this.prisma.period.findMany({
      where: { instanceId },
      orderBy: { startDate: 'asc' },
    });

    const firstBoundaries = this.getPeriodBoundaries(gameStart);
    let pStart = firstBoundaries.startDate;
    let pEnd = firstBoundaries.endDate;

    const generatedPeriods: { startDate: Date; endDate: Date }[] = [];

    while (pStart <= gameEnd) {
      generatedPeriods.push({ startDate: new Date(pStart), endDate: new Date(pEnd) });
      pStart = new Date(pStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      pStart.setHours(0, 0, 0, 0);
      pEnd = new Date(pStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      pEnd.setHours(23, 59, 59, 999);
    }

    for (let i = 0; i < generatedPeriods.length; i++) {
      const p = generatedPeriods[i];
      if (currentPeriods[i]) {
        await this.prisma.period.update({
          where: { id: currentPeriods[i].id },
          data: { startDate: p.startDate, endDate: p.endDate },
        });
      } else {
        await this.prisma.period.create({
          data: { instanceId, startDate: p.startDate, endDate: p.endDate, isOpen: false },
        });
      }
    }

    if (currentPeriods.length > generatedPeriods.length) {
      const toDelete = currentPeriods.slice(generatedPeriods.length);
      await this.prisma.$transaction(async (tx) => {
        for (const p of toDelete) {
          await tx.actionDone.deleteMany({ where: { periodId: p.id } });
          await tx.period.delete({ where: { id: p.id } });
        }
      });
    }
  }


  async remove(id: number) {
    await this.findOne(id);

    // Suppression en cascade via transaction pour garantir l'intégrité
    return this.prisma.$transaction(async (tx) => {
      // 1. ActionsDone (dépendent de LocalAction qui dépend de Instance)
      await tx.actionDone.deleteMany({
        where: { localAction: { instanceId: id } }
      });

      // 2. Children (dépendent de Group)
      await tx.child.deleteMany({
        where: { group: { team: { instanceId: id } } }
      });

      // 3. Groups (dépendent de Team)
      await tx.group.deleteMany({
        where: { team: { instanceId: id } }
      });

      // 4. Teams
      await tx.team.deleteMany({
        where: { instanceId: id }
      });

      // 5. LocalActions
      await tx.localAction.deleteMany({
        where: { instanceId: id }
      });

      // 6. Periods
      await tx.period.deleteMany({
        where: { instanceId: id }
      });

      // 7. L'Instance elle-même
      return tx.instance.delete({
        where: { id }
      });
    });
  }
}
