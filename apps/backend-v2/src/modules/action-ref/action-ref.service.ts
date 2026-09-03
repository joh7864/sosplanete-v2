import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as Papa from 'papaparse';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class ActionRefService {
  private readonly logger = new Logger(ActionRefService.name);

  constructor(private prisma: PrismaService) {}

  async importFromCSV(fileBuffer: Buffer) {
    const csvData = fileBuffer.toString('utf-8');

    return new Promise((resolve) => {
      Papa.parse(csvData, {
        header: false,
        skipEmptyLines: true,
        delimiter: ';',
        complete: async (results) => {
          const rows = results.data as string[][];
          if (rows.length === 0)
            return resolve({ success: true, count: 0, errors: 0 });

          // Extraction des en-têtes (ligne 0) pour trouver les nouvelles colonnes dynamiquement
          const headers = rows[0].map((h) => h?.trim().toLowerCase());
          const hypotheseIndex = headers.findIndex(
            (h) =>
              h === 'hypothese_calcul' ||
              h === 'hypothèse_calcul' ||
              h === 'hypothese calcul' ||
              h === 'hypothèse calcul',
          );

          // On ignore l'en-tête (ligne 0)
          const dataLines = rows.slice(1);

          let count = 0;
          let errors = 0;

          for (const row of dataLines) {
            if (row.length < 10) continue;

            const code = row[0]?.trim();
            const name = row[1]?.trim();

            if (!code || !name) continue;

            const co2 = parseFloat(row[2]?.replace(',', '.') || '0');
            const water = parseFloat(row[3]?.replace(',', '.') || '0');
            const waste = parseFloat(row[4]?.replace(',', '.') || '0');
            const category = row[5]?.trim();
            const co2Year = parseFloat(row[6]?.replace(',', '.') || '0');
            const impactLabel = row[7]?.trim();
            const impactTotal = parseFloat(row[8]?.replace(',', '.') || '0');
            const weightedStars = parseInt(row[9]?.trim() || '0', 10);
            const image = row[10]?.trim();
            const description = row[11]?.trim() || null;
            const imageEvoe = row[12]?.trim() || null;

            // Si la colonne Hypothese_Calcul est présente, on l'ajoute au nouveau champ dédié
            let hypotheseCalcul = null;
            if (hypotheseIndex !== -1 && row[hypotheseIndex]) {
              const hypVal = row[hypotheseIndex].trim();
              if (hypVal) {
                hypotheseCalcul = hypVal;
              }
            }

            try {
              await this.prisma.actionRef.upsert({
                where: { code },
                update: {
                  referenceName: name,
                  defaultCo2: co2,
                  defaultWater: water,
                  defaultWaste: waste,
                  co2Year,
                  impactLabel,
                  impactTotal,
                  weightedStars,
                  image,
                  imageEvoe,
                  description,
                  hypotheseCalcul,
                  category: category || null,
                },
                create: {
                  code,
                  referenceName: name,
                  defaultCo2: co2,
                  defaultWater: water,
                  defaultWaste: waste,
                  co2Year,
                  impactLabel,
                  impactTotal,
                  weightedStars,
                  image,
                  imageEvoe,
                  description,
                  hypotheseCalcul,
                  category: category || null,
                },
              });
              count++;
            } catch (err) {
              this.logger.error(`Error importing code ${code}: ${err.message}`);
              errors++;
            }
          }

          this.logger.log(
            `Import finished: ${count} success, ${errors} errors.`,
          );
          resolve({ success: true, count, errors });
        },
      });
    });
  }

  async findAll() {
    return this.prisma.actionRef.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: number) {
    const ref = await this.prisma.actionRef.findUnique({
      where: { id },
      include: {
        categoryRef: true,
      },
    });
    if (!ref) throw new NotFoundException(`ActionRef #${id} not found`);
    return ref;
  }

  async search(query?: string) {
    const q = query?.trim();
    if (!q) {
      return this.prisma.actionRef.findMany({
        orderBy: { code: 'asc' },
      });
    }
    return this.prisma.actionRef.findMany({
      where: {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { referenceName: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 200,
      orderBy: { code: 'asc' },
    });
  }

  async update(
    id: number,
    data: {
      referenceName?: string;
      description?: string;
      hypotheseCalcul?: string;
      category?: string;
      defaultCo2?: number;
      defaultWater?: number;
      defaultWaste?: number;
      defaultEnergy?: number;
      weightedStars?: number;
      image?: string;
      imageEvoe?: string;
    },
  ) {
    const existing = await this.prisma.actionRef.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`ActionRef #${id} not found`);

    return this.prisma.actionRef.update({
      where: { id },
      data: {
        ...(data.referenceName !== undefined && {
          referenceName: data.referenceName,
        }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.hypotheseCalcul !== undefined && {
          hypotheseCalcul: data.hypotheseCalcul,
        }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.defaultCo2 !== undefined && { defaultCo2: data.defaultCo2 }),
        ...(data.defaultWater !== undefined && {
          defaultWater: data.defaultWater,
        }),
        ...(data.defaultWaste !== undefined && {
          defaultWaste: data.defaultWaste,
        }),
        ...(data.defaultEnergy !== undefined && {
          defaultEnergy: data.defaultEnergy,
        }),
        ...(data.weightedStars !== undefined && {
          weightedStars: data.weightedStars,
        }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.imageEvoe !== undefined && { imageEvoe: data.imageEvoe }),
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.actionRef.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`ActionRef #${id} not found`);

    // Clean up localActions attached to this actionRef first if any
    await this.prisma.localAction.deleteMany({
      where: { actionRefId: id },
    });

    return this.prisma.actionRef.delete({
      where: { id },
    });
  }

  async syncImagesFromDisk() {
    const basePath =
      process.env.UPLOADS_DIR ||
      join(__dirname, '..', '..', '..', '..', '..', 'uploads');

    const actionsDir = join(basePath, 'actions');
    const missionsDir = join(basePath, 'missions');

    const actionsFiles = fs.existsSync(actionsDir)
      ? fs.readdirSync(actionsDir)
      : [];
    const missionsFiles = fs.existsSync(missionsDir)
      ? fs.readdirSync(missionsDir)
      : [];

    const allRefs = await this.prisma.actionRef.findMany();
    let updatedCount = 0;
    const details: { code: string; image?: string; imageEvoe?: string }[] = [];

    for (const ref of allRefs) {
      const code = ref.code.trim();
      let newImage: string | null = null;
      let newImageEvoe: string | null = null;

      // 1. Check in uploads/actions/
      // Matches exact code.extension (e.g. D09.png, D09.jpg, D09.jpeg, D09.webp)
      const actionFile = actionsFiles.find((f) => {
        const dotIndex = f.lastIndexOf('.');
        if (dotIndex === -1) return false;
        const base = f.substring(0, dotIndex);
        return base.toLowerCase() === code.toLowerCase();
      });
      if (actionFile) {
        newImage = actionFile;
      }

      // 2. Check in uploads/missions/
      // Matches code_evoe.extension or code.extension (e.g. D09_evoe.jpg, D09_evoe.png, D09.jpg)
      const missionFile = missionsFiles.find((f) => {
        const dotIndex = f.lastIndexOf('.');
        if (dotIndex === -1) return false;
        const base = f.substring(0, dotIndex);
        return (
          base.toLowerCase() === `${code}_evoe`.toLowerCase() ||
          base.toLowerCase() === code.toLowerCase()
        );
      });
      if (missionFile) {
        newImageEvoe = missionFile;
      }

      const needsUpdate =
        (newImage && newImage !== ref.image) ||
        (newImageEvoe && newImageEvoe !== ref.imageEvoe);

      if (needsUpdate) {
        await this.prisma.actionRef.update({
          where: { id: ref.id },
          data: {
            ...(newImage && { image: newImage }),
            ...(newImageEvoe && { imageEvoe: newImageEvoe }),
          },
        });
        updatedCount++;
        details.push({
          code,
          image: newImage || ref.image || undefined,
          imageEvoe: newImageEvoe || ref.imageEvoe || undefined,
        });
      }
    }

    return {
      success: true,
      totalRefs: allRefs.length,
      updatedCount,
      details,
    };
  }
}
