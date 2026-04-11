import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as Papa from 'papaparse';

@Injectable()
export class ChildService {
  constructor(private prisma: PrismaService) {}

  async create(data: { pseudo: string; groupId: number }, user: any) {
    const group = await this.prisma.group.findUnique({ 
      where: { id: data.groupId },
      include: { team: true }
    });
    if (!group) throw new Error('Groupe non trouvé');

    if (user.role !== Role.AS && !user.instanceIds?.includes(group.team.instanceId)) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    return this.prisma.child.create({
      data: {
        pseudo: data.pseudo,
        groupId: data.groupId,
      },
    });
  }

  async importFromCSV(fileContent: string, groupId: number, user: any) {
    const group = await this.prisma.group.findUnique({ 
      where: { id: groupId },
      include: { team: true }
    });
    if (!group) throw new Error('Groupe non trouvé');

    if (user.role !== Role.AS && !user.instanceIds?.includes(group.team.instanceId)) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    const { data, errors } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException('Fichier CSV mal formé');
    }

    const created = [];
    for (const row of data as any[]) {
      const pseudo = row.pseudo || row.Pseudo || row.name || row.Name;
      if (pseudo) {
        try {
          const child = await this.prisma.child.upsert({
            where: {
              pseudo_groupId: {
                pseudo: pseudo.trim(),
                groupId,
              },
            },
            update: {},
            create: {
              pseudo: pseudo.trim(),
              groupId,
            },
          });
          created.push(child);
        } catch (e) {
          // Skip duplicates or errors
        }
      }
    }

    return { count: created.length, players: created };
  }

  async findAll(groupId: number, user: any) {
    const group = await this.prisma.group.findUnique({ 
      where: { id: groupId },
      include: { team: true }
    });
    if (!group) throw new Error('Groupe non trouvé');

    if (user.role !== Role.AS && !user.instanceIds?.includes(group.team.instanceId)) {
      throw new ForbiddenException('Accès refusé à cet espace');
    }

    return this.prisma.child.findMany({
      where: { groupId }
    });
  }

  async remove(id: number, user: any) {
    const child = await this.prisma.child.findUnique({ 
      where: { id },
      include: { group: { include: { team: true } } }
    });
    if (!child) return { success: false, message: 'Enfant non trouvé' };

    if (user.role !== Role.AS && !user.instanceIds?.includes(child.group.team.instanceId)) {
      throw new ForbiddenException('Action non autorisée sur cet espace');
    }

    await this.prisma.child.delete({ where: { id } });
    return { success: true };
  }
}
