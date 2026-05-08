import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class YearService {
  constructor(private prisma: PrismaService) {}

  /**
   * Initialise une nouvelle année scolaire pour une instance.
   * Si une année précédente existe, recopie toute la configuration (Teams, Groups, Children, LocalActions, Categories).
   */
  async initializeYear(instanceId: number, targetYear: string) {
    // 1. Vérifier si l'année existe déjà
    const existing = await this.prisma.period.findFirst({
      where: { instanceId, schoolYear: targetYear }
    });
    
    // On ne clone que si aucune donnée (période) n'existe encore pour cette année
    if (existing) return { message: 'Année déjà initialisée' };

    // 2. Trouver l'année la plus récente précédente
    const lastYearData = await this.prisma.period.findFirst({
      where: { instanceId },
      orderBy: { startDate: 'desc' },
    });

    if (!lastYearData || !lastYearData.schoolYear) {
      return { message: 'Aucune année précédente à copier' };
    }

    const fromYear = lastYearData.schoolYear;
    if (fromYear === targetYear) return { message: 'Même année' };

    console.log(`[YearService] Cloning configuration from ${fromYear} to ${targetYear} for instance ${instanceId}`);

    return this.prisma.$transaction(async (tx) => {
      // --- A. CLONAGE DES CATEGORIES ---
      const categories = await tx.category.findMany({
        where: { instanceId, schoolYear: fromYear }
      });

      const categoryMap = new Map<number, number>();
      for (const cat of categories) {
        const newCat = await tx.category.create({
          data: {
            name: cat.name,
            icon: cat.icon,
            order: cat.order,
            instanceId: cat.instanceId,
            schoolYear: targetYear
          }
        });
        categoryMap.set(cat.id, newCat.id);
      }

      // --- B. CLONAGE DES TEAMS, GROUPS & CHILDREN ---
      const teams = await tx.team.findMany({
        where: { instanceId, schoolYear: fromYear },
        include: {
          groups: {
            include: {
              children: true
            }
          }
        }
      });

      for (const team of teams) {
        const newTeam = await tx.team.create({
          data: {
            name: team.name,
            color: team.color,
            icon: team.icon,
            instanceId: team.instanceId,
            schoolYear: targetYear
          }
        });

        for (const group of team.groups) {
          const newGroup = await tx.group.create({
            data: {
              name: group.name,
              color: group.color,
              teamId: newTeam.id
            }
          });

          for (const child of group.children) {
            await tx.child.create({
              data: {
                pseudo: child.pseudo,
                password: child.password,
                avatar: child.avatar,
                groupId: newGroup.id
              }
            });
          }
        }
      }

      // --- C. CLONAGE DU CATALOGUE (LOCAL ACTIONS) ---
      const localActions = await tx.localAction.findMany({
        where: { instanceId, schoolYear: fromYear }
      });

      for (const action of localActions) {
        await tx.localAction.create({
          data: {
            label: action.label,
            description: action.description,
            image: action.image,
            instanceId: action.instanceId,
            actionRefId: action.actionRefId,
            schoolYear: targetYear,
            categoryId: action.categoryId ? categoryMap.get(action.categoryId) : null,
            specificCo2: action.specificCo2,
            specificWater: action.specificWater,
            specificWaste: action.specificWaste,
            specificEnergy: action.specificEnergy
          }
        });
      }

      // --- D. CLONAGE DE LA CONFIGURATION DE JEU (GAMECONFIG) ---
      const gameConfig = await tx.gameConfig.findUnique({
        where: { instanceId_schoolYear: { instanceId, schoolYear: fromYear } }
      });

      if (gameConfig) {
        await tx.gameConfig.create({
          data: {
            instanceId,
            schoolYear: targetYear,
            avgActionsPerChildPerPeriod: gameConfig.avgActionsPerChildPerPeriod,
            animalAdvanceMargin: gameConfig.animalAdvanceMargin,
            bienveillanceThreshold: gameConfig.bienveillanceThreshold,
          }
        });
      }

      return { success: true, fromYear, targetYear };
    });
  }
}
