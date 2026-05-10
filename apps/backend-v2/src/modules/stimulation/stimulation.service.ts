import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryRefService } from '../category-ref/category-ref.service';
import { Role } from '@prisma/client';

@Injectable()
export class StimulationService {
  constructor(
    private prisma: PrismaService,
    private categoryRefService: CategoryRefService,
  ) {}

  async getSystemConfig(schoolYear: string) {
    const sy = schoolYear || "2024-2025";
    let config = await this.prisma.systemConfig.findUnique({
      where: { schoolYear: sy }
    });
    if (!config) {
      config = await this.prisma.systemConfig.create({ data: { schoolYear: sy } });
    }
    return config;
  }

  async getAvailableYears() {
    const years = await this.prisma.systemConfig.findMany({
      select: { schoolYear: true },
      orderBy: { schoolYear: 'asc' }
    });
    
    let yearList = years.map(y => y.schoolYear);
    
    // Sécurité : Si la base est vide (reset), on s'assure que les années par défaut existent
    if (yearList.length === 0) {
      await this.getSystemConfig("2023-2024");
      await this.getSystemConfig("2024-2025");
      yearList = ["2023-2024", "2024-2025"];
    }
    
    return yearList;
  }

  async initializeYear(schoolYear: string, user: any) {
    if (user.role !== Role.AS) {
      throw new ForbiddenException('Action non autorisée');
    }
    
    // 1. Créer le SystemConfig pour la nouvelle année
    const systemConfig = await this.getSystemConfig(schoolYear);
    
    // 2. Créer les GameConfig par défaut pour toutes les instances existantes
    // 3. Hériter les CategoryRef vers les Category locales de chaque instance
    const instances = await this.prisma.instance.findMany();
    for (const inst of instances) {
      await this.getGameConfig(inst.id, schoolYear, user);
      await this.categoryRefService.inheritToInstance(inst.id, schoolYear);
    }
    
    return systemConfig;
  }

  async updateSystemConfig(data: any, schoolYear: string, user: any) {
    if (user.role !== Role.AS) {
      throw new ForbiddenException('Action non autorisée');
    }
    const sy = schoolYear || "2024-2025";
    const config = await this.getSystemConfig(sy);
    return this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        emissionsParHabitantAn: data.emissionsParHabitantAn,
        temperatureMalade: data.temperatureMalade,
        temperatureSaine: data.temperatureSaine,
        populationReference: data.populationReference,
      },
    });
  }

  async getGameConfig(instanceId: number, schoolYear: string, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Accès refusé');

    const sy = schoolYear || "2024-2025";
    let config = await this.prisma.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear: sy } },
    });

    if (!config) {
      // Vérifier que l'instance existe avant de créer la GameConfig
      const instance = await this.prisma.instance.findUnique({ where: { id: instanceId } });
      if (!instance) throw new NotFoundException(`Instance ${instanceId} introuvable`);

      config = await this.prisma.gameConfig.create({
        data: { instanceId, schoolYear: sy },
      });
    }

    return config;
  }

  async updateGameConfig(instanceId: number, data: any, schoolYear: string, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    const sy = schoolYear || "2024-2025";
    const config = await this.getGameConfig(instanceId, sy, user);
    
    return this.prisma.gameConfig.update({
      where: { id: config.id },
      data: {
        avgActionsPerChildPerPeriod: data.avgActionsPerChildPerPeriod,
        animalAdvanceMargin: data.animalAdvanceMargin,
        bienveillanceThreshold: data.bienveillanceThreshold,
        gameStartDate: data.gameStartDate ? new Date(data.gameStartDate) : null,
        gameEndDate: data.gameEndDate ? new Date(data.gameEndDate) : null,
        gamePeriodsCount: data.gamePeriodsCount,
      },
    });
  }
}
