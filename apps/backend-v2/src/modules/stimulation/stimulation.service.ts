import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class StimulationService {
  constructor(private prisma: PrismaService) {}

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
