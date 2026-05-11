import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as Papa from 'papaparse';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  normalizeString(text: string | null | undefined): string | null {
    if (!text) return null;
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private normalizeIcon(icon: string | null | undefined): string | null {
    return this.normalizeString(icon);
  }

  // ----------------------------------------------------------------
  // Helper : retrouver l'instanceId depuis l'instanceYearId
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
  // Résoudre l'instanceYearId depuis (instanceId, schoolYear)
  // Utilisé par les routes qui reçoivent encore instanceId + schoolYear
  // ----------------------------------------------------------------
  async resolveInstanceYearId(instanceId: number, schoolYear: string): Promise<number> {
    const iy = await this.prisma.instanceYear.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });
    if (!iy) throw new NotFoundException(`Aucune InstanceYear pour instance ${instanceId} / ${schoolYear}`);
    return iy.id;
  }

  async create(
    data: { name: string; icon?: string; order?: number; instanceId: number; schoolYear: string },
    user: any,
  ) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(data.instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    const instanceYearId = await this.resolveInstanceYearId(data.instanceId, data.schoolYear);

    return this.prisma.category.create({
      data: {
        name:           data.name,
        icon:           this.normalizeIcon(data.icon),
        order:          data.order || 0,
        instanceYearId,
      },
    });
  }

  async findAll(instanceId: number, user: any, schoolYear?: string, instanceYearIdDirect?: number) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Accès refusé');

    // Court-circuit : si instanceYearId fourni directement, pas besoin de résolution
    const instanceYearId = instanceYearIdDirect
      ?? await this.resolveInstanceYearId(instanceId, schoolYear || '2024-2025');

    return this.prisma.category.findMany({
      where: { instanceYearId },
      include: { _count: { select: { localActions: true } } },
      orderBy: { order: 'asc' },
    });
  }

  async update(id: number, data: any, user: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new ForbiddenException('Introuvable');

    const instanceId = await this.resolveInstanceId(cat.instanceYearId);
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Non autorisé');

    return this.prisma.category.update({
      where: { id },
      data: {
        name:  data.name,
        icon:  this.normalizeIcon(data.icon),
        order: data.order,
      },
    });
  }

  async remove(id: number, user: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) return { success: false, message: 'Introuvable' };

    const instanceId = await this.resolveInstanceId(cat.instanceYearId);
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Non autorisé');

    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  async reorder(data: { categoryIds: number[]; instanceId: number }, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(data.instanceId);
    if (!isAllowed) throw new ForbiddenException('Non autorisé');

    const updates = data.categoryIds.map((id, index) =>
      this.prisma.category.update({ where: { id }, data: { order: index } }),
    );

    await this.prisma.$transaction(updates);
    return { success: true };
  }

  async importCsv(instanceId: number, csvContent: string, schoolYear: string, user: any, instanceYearIdDirect?: number) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Accès refusé pour l\'import');

    // Court-circuit : si instanceYearId fourni directement, pas besoin de résolution
    const instanceYearId = instanceYearIdDirect
      ?? await this.resolveInstanceYearId(instanceId, schoolYear);

    const { data, errors } = Papa.parse(csvContent, {
      header:           true,
      skipEmptyLines:   true,
      delimiter:        ';',
      transformHeader:  (h) => h.trim().toLowerCase(),
    });

    if (errors.length > 0) {
      throw new BadRequestException('Format CSV invalide : ' + errors[0].message);
    }

    const stats = { created: 0, updated: 0 };
    const existingCategories = await this.prisma.category.findMany({
      where: { instanceYearId },
    });

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const row of data as any[]) {
          const rawName = row['nom']?.toString().trim() || row['name']?.toString().trim();
          const icon    = row['icone']?.toString().trim() || row['icon']?.toString().trim() || null;
          const order   = parseInt(row['ordre']?.toString() || row['order']?.toString() || '0', 10);

          if (!rawName) continue;

          const normName = this.normalizeString(rawName);
          const existing = existingCategories.find(c => this.normalizeString(c.name) === normName);

          if (existing) {
            await tx.category.update({
              where: { id: existing.id },
              data: {
                icon:  icon ? this.normalizeIcon(icon) : existing.icon,
                order: isNaN(order) ? existing.order : order,
              },
            });
            stats.updated++;

            // Healing : rattacher les LocalActions sans catégorie
            const actionRefs = await tx.actionRef.findMany({
              where: { category: { equals: rawName, mode: 'insensitive' } },
              select: { id: true },
            });
            if (actionRefs.length > 0) {
              await tx.localAction.updateMany({
                where: {
                  instanceId,
                  schoolYear,
                  categoryId: null,
                  actionRefId: { in: actionRefs.map(r => r.id) },
                },
                data: { categoryId: existing.id },
              });
            }
          } else {
            const created = await tx.category.create({
              data: {
                name:           rawName,
                instanceYearId,
                icon:           this.normalizeIcon(icon),
                order:          isNaN(order) ? 0 : order,
              },
            });
            stats.created++;

            // Healing
            const actionRefs = await tx.actionRef.findMany({
              where: { category: { equals: rawName, mode: 'insensitive' } },
              select: { id: true },
            });
            if (actionRefs.length > 0) {
              await tx.localAction.updateMany({
                where: {
                  instanceId,
                  schoolYear,
                  categoryId:  null,
                  actionRefId: { in: actionRefs.map(r => r.id) },
                },
                data: { categoryId: created.id },
              });
            }
          }
        }
      });
    } catch (error) {
      throw new BadRequestException(`Import échoué: ${error.message}`);
    }

    return stats;
  }
}
