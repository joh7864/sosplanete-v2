import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ActionRefService {
  private readonly logger = new Logger(ActionRefService.name);

  constructor(private prisma: PrismaService) {}

  async importFromCSV() {
    const csvPath = path.resolve(process.cwd(), '../../.docs/3-fct/Import SUIVI - Référentiel actions SOS Planète.csv');
    this.logger.log(`Attempting to import CSV from: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      this.logger.error(`CSV not found at ${csvPath}`);
      return { success: false, error: 'File not found' };
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');
    const headerLine = lines[0].split(';');
    
    // Mapping précis basé sur l'audit du fichier
    const findIndex = (name: string) => headerLine.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
    
    const idxCode = 0;
    const idxName = 1;
    const idxCo2 = 2;
    const idxWater = 3;
    const idxWaste = 4;
    const idxCategory = 5;
    const idxCo2Year = 6;
    const idxImpact = 7;
    const idxImpactTotal = 8;
    const idxStars = 9;
    const idxImage = 10;

    const dataLines = lines.slice(1);

    let count = 0;
    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      const parts = line.split(';');
      if (parts.length < 11) continue;

      const code = parts[idxCode]?.trim();
      const name = parts[idxName]?.trim();
      
      if (!code || !name) continue;

      const co2 = parseFloat(parts[idxCo2]?.replace(',', '.') || '0');
      const water = parseFloat(parts[idxWater]?.replace(',', '.') || '0');
      const waste = parseFloat(parts[idxWaste]?.replace(',', '.') || '0');
      const category = parts[idxCategory]?.trim();
      const co2Year = parseFloat(parts[idxCo2Year]?.replace(',', '.') || '0');
      const impactLabel = parts[idxImpact]?.trim();
      const impactTotal = parseFloat(parts[idxImpactTotal]?.replace(',', '.') || '0');
      const weightedStars = parseInt(parts[idxStars]?.trim() || '0', 10);
      const image = parts[idxImage]?.trim();

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
        this.logger.error(`Error importing line: ${line}. Error: ${err.message}`);
      }
    }

    this.logger.log(`Imported ${count} actions from CSV.`);
    return { success: true, count };
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
