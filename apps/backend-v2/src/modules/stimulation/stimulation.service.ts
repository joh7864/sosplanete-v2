import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class StimulationService {
  constructor(private prisma: PrismaService) {}

  async getSystemConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      config = await this.prisma.systemConfig.create({ data: {} });
    }
    return config;
  }

  async updateSystemConfig(data: any, user: any) {
    if (user.role !== Role.AS) {
      throw new ForbiddenException('Action non autorisée');
    }
    const config = await this.getSystemConfig();
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

  async getGameConfig(instanceId: number, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Accès refusé');

    let config = await this.prisma.gameConfig.findUnique({
      where: { instanceId },
    });

    if (!config) {
      config = await this.prisma.gameConfig.create({
        data: { instanceId },
      });
    }

    return config;
  }

  async updateGameConfig(instanceId: number, data: any, user: any) {
    const isAllowed = user.role === Role.AS || user.instanceIds?.includes(instanceId);
    if (!isAllowed) throw new ForbiddenException('Action non autorisée');

    const config = await this.getGameConfig(instanceId, user);
    
    return this.prisma.gameConfig.update({
      where: { id: config.id },
      data: {
        avgActionsPerChildPerPeriod: data.avgActionsPerChildPerPeriod,
        animalAdvanceMargin: data.animalAdvanceMargin,
        bienveillanceThreshold: data.bienveillanceThreshold,
      },
    });
  }
}
