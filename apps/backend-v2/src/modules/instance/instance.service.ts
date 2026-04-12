import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';

@Injectable()
export class InstanceService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInstanceDto) {
    return this.prisma.instance.create({
      data: {
        schoolName: data.schoolName,
        hostUrl: data.hostUrl,
        adminId: data.adminId,
        isOpen: data.isOpen ?? false,
      },
    });
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
    await this.findOne(id);

    const updated = await this.prisma.instance.update({
      where: { id },
      data,
    });

    // Synchronisation automatique des périodes si les paramètres de jeu ont changé
    if (data.gameStartDate || data.gamePeriodsCount !== undefined) {
      await this.syncPeriods(id);
    }

    return updated;
  }

  private async syncPeriods(instanceId: number) {
    const instance = await this.prisma.instance.findUnique({
      where: { id: instanceId },
    });

    if (!instance || !instance.gameStartDate) return;

    const count = instance.gamePeriodsCount;
    const startDate = new Date(instance.gameStartDate);

    const currentPeriods = await this.prisma.period.findMany({
      where: { instanceId },
      orderBy: { startDate: 'asc' },
    });

    for (let i = 0; i < count; i++) {
      const pStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const pEnd = new Date(pStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000); // Fin de la semaine

      if (currentPeriods[i]) {
        await this.prisma.period.update({
          where: { id: currentPeriods[i].id },
          data: { startDate: pStart, endDate: pEnd },
        });
      } else {
        await this.prisma.period.create({
          data: { instanceId, startDate: pStart, endDate: pEnd },
        });
      }
    }

    // Supprimer les périodes en trop si le nombre a diminué
    if (currentPeriods.length > count) {
      const toDelete = currentPeriods.slice(count).map((p) => p.id);
      await this.prisma.period.deleteMany({
        where: { id: { in: toDelete } },
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
