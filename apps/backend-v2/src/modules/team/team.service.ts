import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import * as Papa from 'papaparse';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTeamDto, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(data.instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Vous ne pouvez pas créer de données pour cette instance');
    }

    return this.prisma.team.create({
      data: {
        name: data.name,
        color: data.color,
        icon: data.icon,
        instanceId: data.instanceId,
      },
    });
  }

  async findAll(instanceId: number, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Accès refusé à cet espace');
    }

    return this.prisma.team.findMany({
      where: { instanceId },
      orderBy: { name: 'asc' },
      include: {
        groups: {
          orderBy: { name: 'asc' },
          include: {
            children: {
              include: {
                actionsDone: true
              }
            },
            _count: {
              select: { children: true }
            }
          }
        }
      }
    });
  }

  async update(id: number, data: UpdateTeamDto, user: any) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Équipe non trouvée');

    if (user.role !== Role.AS && !user.instanceIds?.includes(team.instanceId)) {
      throw new ForbiddenException('Action non autorisée sur cette instance');
    }

    return this.prisma.team.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, user: any) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { groups: true }
    });

    if (!team) throw new NotFoundException('Équipe non trouvée');

    if (user.role !== Role.AS && !user.instanceIds?.includes(team.instanceId)) {
      throw new ForbiddenException('Action non autorisée sur cette instance');
    }

    // Suppression en cascade (gérée par Prisma si configuré, sinon manuelle)
    return this.prisma.$transaction(async (tx) => {
      await tx.child.deleteMany({ where: { group: { teamId: id } } });
      await tx.group.deleteMany({ where: { teamId: id } });
      await tx.team.delete({ where: { id } });
      return { success: true };
    });
  }

  /**
   * Import massif depuis un CSV Advanced
   * Format: Equipe;Group;Pseudo;Password;logo equipe;couleur equipe;couleur groupe
   */
  async importCsv(instanceId: number, csvContent: string, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) {
      throw new ForbiddenException('Accès refusé pour l\'import');
    }

    const { data, errors } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';', // Utilisation du point-virgule comme vu dans le fichier Neyron.csv
      transformHeader: (h) => h.trim().toLowerCase(), // Normalisation des headers
    });

    if (errors.length > 0) {
      throw new BadRequestException('Format CSV invalide : ' + errors[0].message);
    }

    console.log('[CSV Import] Parsed rows:', data.length, 'First row keys:', data.length > 0 ? Object.keys(data[0] as any) : 'EMPTY');
    console.log('[CSV Import] First row data:', data.length > 0 ? JSON.stringify(data[0]) : 'NONE');

    const stats = { teams: 0, groups: 0, players: 0 };

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const row of data as any[]) {
          const teamName = row['equipe']?.toString().trim() || null;
          const groupName = row['group']?.toString().trim() || null;
          const pseudo = row['pseudo']?.toString().trim() || null;
          const password = row['password']?.toString().trim() || null;
          const teamIcon = row['logo equipe']?.toString().trim() || null;
          const teamColor = row['couleur equipe']?.toString().trim() || null;
          const groupColor = row['couleur groupe']?.toString().trim() || null;

          if (!teamName) continue;

          // 1. Gérer l'Équipe
          let team = await tx.team.findFirst({
            where: { name: teamName, instanceId }
          });

          if (!team) {
            console.log(`[CSV Import] Creating new team: ${teamName}`);
            team = await tx.team.create({
              data: { 
                name: teamName, 
                instanceId,
                color: teamColor,
                icon: teamIcon
              }
            });
            stats.teams++;
          } else {
            // Force update of icon and color if they differ or are provided
            console.log(`[CSV Import] Updating existing team: ${teamName} (Icon: ${teamIcon})`);
            team = await tx.team.update({
              where: { id: team.id },
              data: { 
                color: teamColor || team.color,
                icon: teamIcon || team.icon
              }
            });
          }

          if (!groupName) continue;

          // 2. Gérer le Groupe
          let group = await tx.group.findFirst({
            where: { name: groupName, teamId: team.id }
          });

          if (!group) {
            group = await tx.group.create({
              data: { 
                name: groupName, 
                teamId: team.id,
                color: groupColor
              }
            });
            stats.groups++;
          } else if (groupColor) {
            group = await tx.group.update({
              where: { id: group.id },
              data: { color: groupColor }
            });
          }

          if (!pseudo) continue;

          // 3. Gérer le Joueur (upsert)
          const existing = await tx.child.findFirst({
            where: { pseudo, groupId: group.id }
          });

          if (!existing) {
            await tx.child.create({
              data: { 
                pseudo, 
                groupId: group.id,
                password: password
              }
            });
            stats.players++;
          }
        }
      });
    } catch (error) {
      console.error('[CSV Import] FULL ERROR:', error);
      throw new BadRequestException(`Import échoué: ${error.message || error}`);
    }

    console.log('[CSV Import] SUCCESS:', stats);
    return stats;
  }

  // --- GROUPES ---
  async createGroup(teamId: number, name: string, color?: string) {
    return this.prisma.group.create({
      data: { name, teamId, color }
    });
  }

  async updateGroup(id: number, data: { name?: string, color?: string }) {
    return this.prisma.group.update({
      where: { id },
      data
    });
  }

  async removeGroups(ids: number[]) {
    return this.prisma.$transaction(async (tx) => {
      // Cascade manuelle si nécessaire selon schéma prisma
      await tx.child.deleteMany({ where: { groupId: { in: ids } } });
      return tx.group.deleteMany({ where: { id: { in: ids } } });
    });
  }

  // --- JOUEURS (CHILDREN) ---
  async createChild(groupId: number, pseudo: string, password?: string) {
    return this.prisma.child.create({
      data: { pseudo, groupId, password }
    });
  }

  async updateChild(id: number, data: { pseudo?: string, password?: string }) {
    return this.prisma.child.update({
      where: { id },
      data
    });
  }

  async removeChildren(ids: number[]) {
    return this.prisma.child.deleteMany({
      where: { id: { in: ids } }
    });
  }

  // --- TEAMS BULK ---
  async removeTeams(ids: number[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.child.deleteMany({ where: { group: { teamId: { in: ids } } } });
      await tx.group.deleteMany({ where: { teamId: { in: ids } } });
      return tx.team.deleteMany({ where: { id: { in: ids } } });
    });
  }
}
