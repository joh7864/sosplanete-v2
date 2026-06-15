import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EvoeService {
  constructor(private readonly prisma: PrismaService) {}

  async getMissions(instanceId: number, schoolYear: string) {
    // Fetch all LocalActions for this instance and join with EvoeMissionTranslation
    const localActions = await this.prisma.localAction.findMany({
      where: {
        instanceId,
        schoolYear
      },
      include: {
        evoeMission: true,
        actionRef: true,
        category: true
      }
    });

    return localActions.map(action => {
      // Fusion of physical action and SF mapping
      return {
        id: action.id,
        label: action.label,
        description: action.description,
        categoryId: action.categoryId,
        categoryName: action.category?.name,
        actionRefId: action.actionRefId,
        co2Year: action.actionRef?.co2Year,
        evoeMission: action.evoeMission ? {
          titreSF: action.evoeMission.titreSF,
          descriptionSF: action.evoeMission.descriptionSF,
          pointsGagnes: action.evoeMission.pointsGagnes,
          isHacked: action.evoeMission.isHacked,
        } : null,
      };
    });
  }

  async getDashboardStatus(instanceId: number, schoolYear: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        instanceYear: {
          instanceId,
          schoolYear
        }
      },
      include: {
        groups: {
          include: {
            children: true
          }
        }
      }
    });

    // Mock implementation for the status to be enriched with propulsion logic later
    return {
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
        level: 1, // Progression SF
        points: 0,
      })),
      globalProgression: 0
    };
  }
}
