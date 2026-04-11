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

      // Somme des impacts de toutes les actions de l'instance
      const impactsAgg = await this.prisma.actionDone.aggregate({
        _sum: {
          savedCo2: true,
          savedWater: true,
          savedWaste: true
        },
        where: {
          child: { group: { team: { instanceId: instance.id } } }
        }
      });

      return {
        ...instance,
        playersCount,
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

    return this.prisma.instance.update({
      where: { id },
      data,
    });
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
