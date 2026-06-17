import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InstanceCleanupService {
  constructor(private prisma: PrismaService) {}

  async removeYear(instanceId: number, schoolYear: string) {
    const iy = await this.prisma.instanceYear.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });
    if (!iy) throw new NotFoundException('InstanceYear non trouvée');

    return this.prisma.$transaction(async (tx) => {
      // ActionsDone liées aux périodes de cette année
      const periods = await tx.period.findMany({
        where: { instanceYearId: iy.id },
        select: { id: true },
      });
      await tx.actionDone.deleteMany({
        where: { periodId: { in: periods.map((p) => p.id) } },
      });

      // Children → Groups → Teams
      const teamIds = (
        await tx.team.findMany({
          where: { instanceYearId: iy.id },
          select: { id: true },
        })
      ).map((t) => t.id);
      const groupIds = (
        await tx.group.findMany({
          where: { teamId: { in: teamIds } },
          select: { id: true },
        })
      ).map((g) => g.id);
      await tx.child.deleteMany({ where: { groupId: { in: groupIds } } });
      await tx.group.deleteMany({ where: { id: { in: groupIds } } });
      await tx.team.deleteMany({ where: { instanceYearId: iy.id } });

      // Périodes et catégories
      await tx.period.deleteMany({ where: { instanceYearId: iy.id } });
      await tx.category.deleteMany({ where: { instanceYearId: iy.id } });

      // InstanceYear elle-même
      await tx.instanceYear.delete({ where: { id: iy.id } });
      return { success: true };
    });
  }

  async remove(id: number) {
    const exists = await this.prisma.instance.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Instance #${id} non trouvée`);

    return this.prisma.$transaction(async (tx) => {
      // 1. ActionsDone (toutes années via les périodes)
      const instanceYears = await tx.instanceYear.findMany({
        where: { instanceId: id },
        select: { id: true },
      });
      const iyIds = instanceYears.map((iy) => iy.id);
      const periods = await tx.period.findMany({
        where: { instanceYearId: { in: iyIds } },
        select: { id: true },
      });
      await tx.actionDone.deleteMany({
        where: { periodId: { in: periods.map((p) => p.id) } },
      });
      // ActionsDone liées aux LocalActions (local action peut survivre plusieurs années)
      await tx.actionDone.deleteMany({
        where: { localAction: { instanceId: id } },
      });

      // 2. Children → Groups → Teams (toutes années)
      const teamIds = (
        await tx.team.findMany({
          where: { instanceYearId: { in: iyIds } },
          select: { id: true },
        })
      ).map((t) => t.id);
      const groupIds = (
        await tx.group.findMany({
          where: { teamId: { in: teamIds } },
          select: { id: true },
        })
      ).map((g) => g.id);
      await tx.child.deleteMany({ where: { groupId: { in: groupIds } } });
      await tx.group.deleteMany({ where: { id: { in: groupIds } } });
      await tx.team.deleteMany({ where: { instanceYearId: { in: iyIds } } });

      // 3. Periods, Categories, InstanceYears
      await tx.period.deleteMany({ where: { instanceYearId: { in: iyIds } } });
      await tx.category.deleteMany({
        where: { instanceYearId: { in: iyIds } },
      });
      await tx.instanceYear.deleteMany({ where: { instanceId: id } });

      // 4. LocalActions, GameConfig, snapshots
      await tx.localAction.deleteMany({ where: { instanceId: id } });
      await tx.gameConfig.deleteMany({ where: { instanceId: id } });
      await tx.instanceAnimalUnlock.deleteMany({ where: { instanceId: id } });
      await tx.terreThermometerSnapshot.deleteMany({
        where: { instanceId: id },
      });

      // 5. Instance elle-même
      return tx.instance.delete({ where: { id } });
    });
  }
}
