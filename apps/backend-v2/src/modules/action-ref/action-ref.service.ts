import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as Papa from 'papaparse';

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
                  category,
                  image,
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
                  category,
                  image,
                },
              });
              count++;
            } catch (err) {
              this.logger.error(`Error importing code ${code}: ${err.message}`);
              errors++;
            }
          }

          this.logger.log(`Import finished: ${count} success, ${errors} errors.`);
          resolve({ success: true, count, errors });
        }
      });
    });
  }

  async findAll() {
    return this.prisma.actionRef.findMany({
      orderBy: { category: 'asc' },
    });
  }

  async search(query: string) {
    return this.prisma.actionRef.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { referenceName: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 100,
      orderBy: { code: 'asc' }
    });
  }
}
