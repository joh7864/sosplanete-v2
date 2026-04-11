import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class GroupService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; teamId: number }, user: any) {
    const team = await this.prisma.team.findUnique({ where: { id: data.teamId } });
    if (!team) throw new Error('Équipe non trouvée');

    if (user.role !== Role.AS && !user.instanceIds?.includes(team.instanceId)) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    return this.prisma.group.create({
      data: {
        name: data.name,
        teamId: data.teamId,
      },
    });
  }

  async findAll(teamId: number, user: any) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new Error('Équipe non trouvée');

    if (user.role !== Role.AS && !user.instanceIds?.includes(team.instanceId)) {
      throw new ForbiddenException('Accès refusé à cet espace');
    }

    return this.prisma.group.findMany({
      where: { teamId },
      include: { children: true }
    });
  }

  async remove(id: number, user: any) {
    const group = await this.prisma.group.findUnique({ 
      where: { id },
      include: { team: true }
    });
    if (!group) return { success: false, message: 'Groupe non trouvé' };

    if (user.role !== Role.AS && !user.instanceIds?.includes(group.team.instanceId)) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    await this.prisma.group.delete({ where: { id } });
    return { success: true };
  }
}
