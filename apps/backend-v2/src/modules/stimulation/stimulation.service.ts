import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
    const sy = schoolYear || '2024-2025';
    let config = await this.prisma.systemConfig.findUnique({
      where: { schoolYear: sy },
    });
    if (!config) {
      config = await this.prisma.systemConfig.create({
        data: { schoolYear: sy },
      });
    }
    return config;
  }

  async getAvailableYears() {
    const years = await this.prisma.systemConfig.findMany({
      select: { schoolYear: true },
      orderBy: { schoolYear: 'asc' },
    });

    let yearList = years.map((y) => y.schoolYear);

    // Sécurité : Si la base est vide (reset), on s'assure que les années par défaut existent
    if (yearList.length === 0) {
      await this.getSystemConfig('2023-2024');
      await this.getSystemConfig('2024-2025');
      yearList = ['2023-2024', '2024-2025'];
    }

    return yearList;
  }

  async initializeYear(schoolYear: string, user: any) {
    if (user.role !== Role.AS) {
      throw new ForbiddenException('Action non autorisée');
    }

    // 1. Créer le SystemConfig pour la nouvelle année
    const systemConfig = await this.getSystemConfig(schoolYear);

    // 2. Créer les GameConfig par défaut et hériter les categories pour chaque instance
    const instances = await this.prisma.instance.findMany();
    for (const inst of instances) {
      await this.getGameConfig(inst.id, schoolYear, user);
      // Résoudre l'InstanceYear pour cette instance et cette année
      const instanceYear = await this.prisma.instanceYear.findUnique({
        where: { instanceId_schoolYear: { instanceId: inst.id, schoolYear } },
      });
      if (instanceYear) {
        await this.categoryRefService.inheritToInstance(instanceYear.id);
      }
    }

    return systemConfig;
  }

  async updateSystemConfig(data: any, schoolYear: string, user: any) {
    if (user.role !== Role.AS) {
      throw new ForbiddenException('Action non autorisée');
    }
    const sy = schoolYear || '2024-2025';
    const config = await this.getSystemConfig(sy);
    return this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        emissionsParHabitantAn: data.emissionsParHabitantAn,
        temperatureMalade: data.temperatureMalade,
        temperatureSaine: data.temperatureSaine,
        populationReference: data.populationReference,
        youtubeBriefingUrl: data.youtubeBriefingUrl,
        whatsappCommunityName: data.whatsappCommunityName,
        whatsappCommunityUrl: data.whatsappCommunityUrl,
        whatsappGeneralUrl: data.whatsappGeneralUrl,
        whatsappGeneralId: data.whatsappGeneralId,
        ...(data.ftuxSteps !== undefined && { ftuxSteps: data.ftuxSteps }),
      },
    });
  }

  async getGameConfig(instanceId: number, schoolYear: string, user: any) {
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Accès refusé');

    const sy = schoolYear || '2024-2025';
    let config = await this.prisma.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear: sy } },
    });

    if (!config) {
      // Vérifier que l'instance existe avant de créer la GameConfig
      const instance = await this.prisma.instance.findUnique({
        where: { id: instanceId },
      });
      if (!instance)
        throw new NotFoundException(`Instance ${instanceId} introuvable`);

      const match = sy.match(/^(\d{4})/);
      const startYear = match
        ? parseInt(match[1], 10)
        : new Date().getFullYear();
      const endYear = startYear + 1;
      const gameStartDate = new Date(Date.UTC(startYear, 10, 1, 0, 0, 0, 0));
      const gameEndDate = new Date(Date.UTC(endYear, 6, 31, 23, 59, 59, 999));

      config = await this.prisma.gameConfig.create({
        data: {
          instanceId,
          schoolYear: sy,
          gameStartDate,
          gameEndDate,
        },
      });

      // Synchroniser avec InstanceYear si elle existe
      const iy = await this.prisma.instanceYear.findUnique({
        where: { instanceId_schoolYear: { instanceId, schoolYear: sy } },
      });
      if (iy) {
        await this.prisma.instanceYear.update({
          where: { id: iy.id },
          data: { gameStartDate, gameEndDate },
        });
      }
    }

    return config;
  }

  async updateGameConfig(
    instanceId: number,
    data: any,
    schoolYear: string,
    user: any,
  ) {
    const isAllowed =
      user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    const sy = schoolYear || '2024-2025';
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
