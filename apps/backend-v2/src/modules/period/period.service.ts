import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class PeriodService {
  constructor(private prisma: PrismaService) {}

  async create(data: { startDate: Date; endDate: Date; instanceId: number }, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(data.instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    return this.prisma.period.create({
      data: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        instanceId: data.instanceId,
      },
    });
  }

  async findAll(instanceId: number, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Accès refusé à cet espace');
    }

    return this.prisma.period.findMany({
      where: { instanceId },
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { actionsDone: true }
        }
      }
    });
  }

  async remove(id: number, user: any) {
    const period = await this.prisma.period.findUnique({
      where: { id },
      include: { _count: { select: { actionsDone: true } } }
    });

    if (!period) return { success: false, message: 'Période non trouvée' };

    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(period.instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    // According to plan, we allow deletion with warning if actions exist.
    // The warning is handled by the frontend, here we just execute the deletion.
    await this.prisma.period.delete({ where: { id } });
    return { success: true };
  }
}
