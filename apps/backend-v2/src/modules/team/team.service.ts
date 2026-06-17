import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import * as Papa from 'papaparse';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Helper : retrouver l'instanceId depuis un instanceYearId
  // ----------------------------------------------------------------
  private async resolveInstanceId(instanceYearId: number): Promise<number> {
    const iy = await this.prisma.instanceYear.findUnique({
      where: { id: instanceYearId },
      select: { instanceId: true },
    });
    if (!iy) throw new NotFoundException('InstanceYear introuvable');
    return iy.instanceId;
  }

  // ----------------------------------------------------------------
  // Helper : résoudre instanceYearId depuis (instanceId, schoolYear)
  // ----------------------------------------------------------------
  async resolveInstanceYearId(
    instanceId: number,
    schoolYear: string,
  ): Promise<number> {
    const iy = await this.prisma.instanceYear.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });
    if (!iy)
      throw new NotFoundException(
        `Aucune InstanceYear pour instance ${instanceId} / ${schoolYear}`,
      );
    return iy.id;
  }

  async create(
    data: CreateTeamDto & {
      instanceId?: number;
      schoolYear?: string;
      instanceYearId?: number;
    },
    user: any,
  ) {
    let instanceYearId = data.instanceYearId;

    // Rétrocompatibilité : si on reçoit instanceId + schoolYear, on résout
    if (!instanceYearId && data.instanceId && data.schoolYear) {
      instanceYearId = await this.resolveInstanceYearId(
        data.instanceId,
        data.schoolYear,
      );
    }
    if (!instanceYearId) throw new BadRequestException('instanceYearId requis');

    const instanceId = await this.resolveInstanceId(instanceYearId);
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed)
      throw new ForbiddenException(
        'Vous ne pouvez pas créer de données pour cette instance',
      );

    return this.prisma.team.create({
      data: {
        name: data.name,
        color: data.color,
        icon: data.icon,
        instanceYearId,
      },
    });
  }

  async findAll(
    instanceId: number,
    user: any,
    schoolYear?: string,
    instanceYearIdDirect?: number,
  ) {
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Accès refusé à cet espace');

    // Court-circuit : si instanceYearId fourni directement, pas besoin de résolution
    const instanceYearId =
      instanceYearIdDirect ??
      (await this.resolveInstanceYearId(instanceId, schoolYear || '2024-2025'));

    return this.prisma.team.findMany({
      where: { instanceYearId },
      orderBy: { name: 'asc' },
      include: {
        groups: {
          orderBy: { name: 'asc' },
          include: {
            children: {
              include: {
                actionsDone: {
                  where: { period: { instanceYearId } },
                },
              },
            },
            _count: { select: { children: true } },
          },
        },
      },
    });
  }

  async update(id: number, data: UpdateTeamDto, user: any) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Équipe non trouvée');

    const instanceId = await this.resolveInstanceId(team.instanceYearId);
    if (user.role !== Role.AS && !user.instanceIds?.includes(instanceId)) {
      throw new ForbiddenException('Action non autorisée sur cette instance');
    }

    // On extrait uniquement les champs appartenant au modèle Team
    const { name, color, icon } = data;
    return this.prisma.team.update({
      where: { id },
      data: { name, color, icon },
    });
  }

  async remove(id: number, user: any) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { groups: true },
    });
    if (!team) throw new NotFoundException('Équipe non trouvée');

    const instanceId = await this.resolveInstanceId(team.instanceYearId);
    if (user.role !== Role.AS && !user.instanceIds?.includes(instanceId)) {
      throw new ForbiddenException('Action non autorisée sur cette instance');
    }

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
  async importCsv(
    instanceId: number,
    csvContent: string,
    schoolYear: string,
    user: any,
    instanceYearIdDirect?: number,
  ) {
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException("Accès refusé pour l'import");

    // Court-circuit : si instanceYearId fourni directement, pas besoin de résolution
    const instanceYearId =
      instanceYearIdDirect ??
      (await this.resolveInstanceYearId(instanceId, schoolYear));

    const { data, errors } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (errors.length > 0)
      throw new BadRequestException(
        'Format CSV invalide : ' + errors[0].message,
      );

    console.log(
      '[CSV Import] Parsed rows:',
      data.length,
      'First row keys:',
      data.length > 0 ? Object.keys(data[0] as any) : 'EMPTY',
    );

    const stats = { teams: 0, groups: 0, players: 0 };

    // ÉTAPE 1 : Pré-hasher tous les mots de passe (hors transaction)
    const rows = data as any[];
    const hashedPasswords = new Map<number, string | null>();
    for (let i = 0; i < rows.length; i++) {
      const password = rows[i]['password']?.toString().trim() || null;
      hashedPasswords.set(i, password ? await bcrypt.hash(password, 10) : null);
    }

    // ÉTAPE 2 : Pré-charger les équipes et groupes existants
    const existingTeams = await this.prisma.team.findMany({
      where: { instanceYearId },
      include: { groups: true },
    });
    const teamCache = new Map<string, any>(
      existingTeams.map((t) => [t.name.toLowerCase(), t]),
    );
    const groupCache = new Map<string, any>();
    for (const team of existingTeams) {
      for (const group of team.groups) {
        groupCache.set(`${team.id}:${group.name.toLowerCase()}`, group);
      }
    }

    const existingGroupIds = existingTeams.flatMap((t) =>
      t.groups.map((g: any) => g.id),
    );
    const existingChildren =
      existingGroupIds.length > 0
        ? await this.prisma.child.findMany({
            where: { groupId: { in: existingGroupIds } },
          })
        : [];
    const childCache = new Map<string, any>();
    for (const child of existingChildren) {
      childCache.set(`${child.groupId}:${child.pseudo.toLowerCase()}`, child);
    }

    // ÉTAPE 3 : Transaction SQL pure
    try {
      await this.prisma.$transaction(
        async (tx) => {
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const teamName = row['equipe']?.toString().trim() || null;
            const groupName = row['group']?.toString().trim() || null;
            const pseudo = row['pseudo']?.toString().trim() || null;
            const teamIcon = row['logo equipe']?.toString().trim() || null;
            const teamColor = row['couleur equipe']?.toString().trim() || null;
            const groupColor = row['couleur groupe']?.toString().trim() || null;
            const hashedPassword = hashedPasswords.get(i);

            const rawGender =
              row['sexe']?.toString().trim() ||
              row['gender']?.toString().trim() ||
              row['genre']?.toString().trim() ||
              null;
            const rawBirthDate =
              row['date de naissance']?.toString().trim() ||
              row['date_naissance']?.toString().trim() ||
              row['naissance']?.toString().trim() ||
              row['birthdate']?.toString().trim() ||
              row['ddn']?.toString().trim() ||
              null;
            const genderCode = normalizeGender(rawGender);
            const parsedBirthDate = parseBirthDate(rawBirthDate);

            if (!teamName) continue;

            let team = teamCache.get(teamName.toLowerCase());
            if (!team) {
              team = await tx.team.create({
                data: {
                  name: teamName,
                  instanceYearId,
                  color: teamColor,
                  icon: teamIcon,
                },
              });
              team.groups = [];
              teamCache.set(teamName.toLowerCase(), team);
              stats.teams++;
            } else if (teamIcon || teamColor) {
              team = await tx.team.update({
                where: { id: team.id },
                data: {
                  color: teamColor || team.color,
                  icon: teamIcon || team.icon,
                },
              });
              team.groups =
                existingTeams.find((t) => t.id === team.id)?.groups || [];
              teamCache.set(teamName.toLowerCase(), team);
            }

            if (!groupName) continue;

            const groupKey = `${team.id}:${groupName.toLowerCase()}`;
            let group = groupCache.get(groupKey);
            if (!group) {
              group = await tx.group.create({
                data: { name: groupName, teamId: team.id, color: groupColor },
              });
              groupCache.set(groupKey, group);
              stats.groups++;
            } else if (groupColor && groupColor !== group.color) {
              group = await tx.group.update({
                where: { id: group.id },
                data: { color: groupColor },
              });
              groupCache.set(groupKey, group);
            }

            if (!pseudo) continue;

            const childKey = `${group.id}:${pseudo.toLowerCase()}`;
            const existing = childCache.get(childKey);
            if (!existing) {
              const created = await tx.child.create({
                data: {
                  pseudo,
                  groupId: group.id,
                  password: hashedPassword,
                  gender: genderCode,
                  birthDate: parsedBirthDate,
                },
              });
              childCache.set(childKey, created);
              stats.players++;
            } else {
              const updateData: any = {};
              if (hashedPassword) updateData.password = hashedPassword;
              if (genderCode !== null) updateData.gender = genderCode;
              if (parsedBirthDate !== null)
                updateData.birthDate = parsedBirthDate;
              if (Object.keys(updateData).length > 0) {
                await tx.child.update({
                  where: { id: existing.id },
                  data: updateData,
                });
              }
            }
          }
        },
        { timeout: 60000 },
      );
    } catch (error) {
      console.error('[CSV Import] FULL ERROR:', error);
      throw new BadRequestException(`Import échoué: ${error.message || error}`);
    }

    console.log('[CSV Import] SUCCESS:', stats);
    return stats;
  }

  // --- GROUPES ---
  async createGroup(teamId: number, name: string, color?: string) {
    return this.prisma.group.create({ data: { name, teamId, color } });
  }

  async updateGroup(id: number, data: { name?: string; color?: string }) {
    return this.prisma.group.update({ where: { id }, data });
  }

  async removeGroups(ids: number[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.child.deleteMany({ where: { groupId: { in: ids } } });
      return tx.group.deleteMany({ where: { id: { in: ids } } });
    });
  }

  async createChild(
    groupId: number,
    pseudo: string,
    password?: string,
    isDelegate?: boolean,
    gender?: string,
    birthDate?: string | Date | null,
    avatar?: string | null,
  ) {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const parsedGender = normalizeGender(gender);
    const parsedBirthDate = parseBirthDate(birthDate);
    return this.prisma.child.create({
      data: {
        pseudo,
        groupId,
        password: hashedPassword,
        isDelegate: isDelegate || false,
        gender: parsedGender,
        birthDate: parsedBirthDate,
        avatar: avatar || null,
      },
    });
  }

  async updateChild(
    id: number,
    data: {
      pseudo?: string;
      password?: string;
      isDelegate?: boolean;
      gender?: string | null;
      birthDate?: string | Date | null;
      avatar?: string | null;
    },
  ) {
    const updateData: any = {};
    if (data.pseudo !== undefined) updateData.pseudo = data.pseudo;
    if (data.password && data.password.trim() !== '') {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    if (data.isDelegate !== undefined) updateData.isDelegate = data.isDelegate;
    if (data.gender !== undefined)
      updateData.gender = normalizeGender(data.gender);
    if (data.birthDate !== undefined)
      updateData.birthDate = parseBirthDate(data.birthDate);
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    return this.prisma.child.update({ where: { id }, data: updateData });
  }

  async removeChildren(ids: number[]) {
    return this.prisma.child.deleteMany({ where: { id: { in: ids } } });
  }

  async removeTeams(ids: number[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.child.deleteMany({ where: { group: { teamId: { in: ids } } } });
      await tx.group.deleteMany({ where: { teamId: { in: ids } } });
      return tx.team.deleteMany({ where: { id: { in: ids } } });
    });
  }
}

// ----------------------------------------------------------------
// Helpers pour la normalisation du genre et le parsing de date
// ----------------------------------------------------------------
function normalizeGender(val: string | null | undefined): string | null {
  if (!val) return null;
  const str = String(val).trim().toLowerCase();
  if (str === '') return null;
  if (
    str === 'm' ||
    str.startsWith('hom') ||
    str.startsWith('gar') ||
    str.startsWith('mal') ||
    str === 'h'
  ) {
    return 'M';
  }
  if (
    str === 'f' ||
    str.startsWith('fem') ||
    str.startsWith('fil') ||
    str.startsWith('femal')
  ) {
    return 'F';
  }
  if (
    str === 'ef' ||
    str === 'enfant f' ||
    str === 'enfant féminin' ||
    str === 'enfant feminin' ||
    str === 'fille'
  ) {
    return 'EF';
  }
  if (
    str === 'eh' ||
    str === 'enfant h' ||
    str === 'enfant masculin' ||
    str === 'garçon' ||
    str === 'garcon'
  ) {
    return 'EH';
  }
  return null;
}

function parseBirthDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const str = String(val).trim();
  if (str === '') return null;

  // Format DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Format YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}
