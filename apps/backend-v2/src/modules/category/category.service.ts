import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; icon?: string; order?: number; instanceId: number }, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(data.instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    return this.prisma.category.create({
      data: {
        name: data.name,
        icon: data.icon?.toLowerCase(),
        order: data.order || 0,
        instanceId: data.instanceId,
      },
    });
  }

  async findAll(instanceId: number, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Accès refusé');

    return this.prisma.category.findMany({
      where: { instanceId },
      include: {
        _count: {
          select: { localActions: true }
        }
      },
      orderBy: { order: 'asc' },
    });
  }

  async update(id: number, data: any, user: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new ForbiddenException('Introuvable');

    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(cat.instanceId);
    if (!isAllowed) throw new ForbiddenException('Non autorisé');

    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon?.toLowerCase(),
        order: data.order,
      },
    });
  }

  async remove(id: number, user: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) return { success: false, message: 'Introuvable' };

    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(cat.instanceId);
    if (!isAllowed) throw new ForbiddenException('Non autorisé');

    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
