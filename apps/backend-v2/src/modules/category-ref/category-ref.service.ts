import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as Papa from 'papaparse';

@Injectable()
export class CategoryRefService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.categoryRef.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { actionRefs: true } } },
    });
  }

  async create(data: { name: string; icon?: string; order?: number }) {
    return this.prisma.categoryRef.create({
      data: {
        name: data.name,
        icon: data.icon?.toLowerCase() || null,
        order: data.order ?? 0,
      },
    });
  }

  async update(id: number, data: { name?: string; icon?: string; order?: number }) {
    const existing = await this.prisma.categoryRef.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`CategoryRef ${id} introuvable`);
    return this.prisma.categoryRef.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon !== undefined ? data.icon?.toLowerCase() || null : existing.icon,
        order: data.order,
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.categoryRef.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`CategoryRef ${id} introuvable`);
    // Délier les ActionRef avant la suppression
    await this.prisma.actionRef.updateMany({
      where: { categoryRefId: id },
      data: { categoryRefId: null },
    });
    return this.prisma.categoryRef.delete({ where: { id } });
  }

  async reorder(orderedIds: number[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.categoryRef.update({ where: { id }, data: { order: index } }),
    );
    await this.prisma.$transaction(updates);
    return { success: true };
  }

  /**
   * Import CSV des catégories globales.
   * Format attendu : nom;icone;ordre
   */
  async importCsv(csvContent: string) {
    const { data, errors } = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true,
      delimiter: ';',
    });

    if (errors.length > 0) throw new Error('CSV invalide : ' + errors[0].message);

    const rows = (data as string[][]).slice(1); // ignore header
    const stats = { created: 0, updated: 0 };

    for (const row of rows) {
      const name = row[0]?.trim();
      if (!name) continue;
      const icon = row[1]?.trim().toLowerCase() || null;
      const order = parseInt(row[2]?.trim() || '0', 10);

      const existing = await this.prisma.categoryRef.findUnique({ where: { name } });
      await this.prisma.categoryRef.upsert({
        where: { name },
        update: { icon, order: isNaN(order) ? 0 : order },
        create: { name, icon, order: isNaN(order) ? 0 : order },
      });
      if (existing) {
        stats.updated++;
      } else {
        stats.created++;
      }
    }
    return stats;
  }

  /**
   * Lie les ActionRef à leurs CategoryRef en faisant correspondre le champ textuel `category`
   * au champ `name` des CategoryRef. À appeler après un import CSV de CategoryRef.
   */
  async syncActionRefLinks() {
    const allRefs = await this.prisma.categoryRef.findMany();
    let linked = 0;

    for (const catRef of allRefs) {
      const result = await this.prisma.actionRef.updateMany({
        where: {
          category: { equals: catRef.name, mode: 'insensitive' },
          categoryRefId: null,
        },
        data: { categoryRefId: catRef.id },
      });
      linked += result.count;
    }

    return { linked };
  }

  /**
   * Copie les CategoryRef dans les Category locales d'une instance/année scolaire.
   * N'écrase pas les catégories existantes (skipDuplicates par nom normalisé).
   */
  async inheritToInstance(instanceId: number, schoolYear: string) {
    const refs = await this.prisma.categoryRef.findMany({ orderBy: { order: 'asc' } });
    const existing = await this.prisma.category.findMany({ where: { instanceId, schoolYear } });
    const existingNames = existing.map(c => c.name.toLowerCase().trim());

    const toCreate = refs.filter(r => !existingNames.includes(r.name.toLowerCase().trim()));

    if (toCreate.length === 0) return { created: 0 };

    await this.prisma.category.createMany({
      data: toCreate.map(r => ({
        name: r.name,
        icon: r.icon,
        order: r.order,
        instanceId,
        schoolYear,
      })),
    });

    return { created: toCreate.length };
  }
}
