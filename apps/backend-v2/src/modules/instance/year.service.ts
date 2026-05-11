import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class YearService {
  constructor(private prisma: PrismaService) {}

  /**
   * Initialise une nouvelle année scolaire pour une instance.
   * Crée une InstanceYear, puis clone la configuration (Teams, Groups, Children, LocalActions, Categories).
   */
  async initializeYear(instanceId: number, targetYear: string) {
    // 1. Vérifier si l'InstanceYear existe déjà
    const existing = await this.prisma.instanceYear.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear: targetYear } },
    });
    if (existing) return { message: 'Année déjà initialisée' };

    // 2. Trouver la plus récente InstanceYear précédente
    const lastIy = await this.prisma.instanceYear.findFirst({
      where: { instanceId },
      orderBy: { schoolYear: 'desc' },
    });

    if (!lastIy) {
      // Aucune année précédente → créer une InstanceYear vierge
      await this.prisma.instanceYear.create({ data: { instanceId, schoolYear: targetYear } });
      return { message: 'Nouvelle InstanceYear créée (sans clonage)' };
    }

    const fromYear = lastIy.schoolYear;
    if (fromYear === targetYear) return { message: 'Même année' };

    console.log(`[YearService] Cloning from ${fromYear} to ${targetYear} for instance ${instanceId}`);

    return this.prisma.$transaction(async (tx) => {
      // Créer la nouvelle InstanceYear (hérite de la config de jeu)
      const newIy = await tx.instanceYear.create({
        data: {
          instanceId,
          schoolYear:      targetYear,
          gameStartDate:   lastIy.gameStartDate,
          gameEndDate:     lastIy.gameEndDate,
          gamePeriodsCount: lastIy.gamePeriodsCount,
        },
      });

      // --- A. CLONAGE DES CATEGORIES ---
      const categories = await tx.category.findMany({ where: { instanceYearId: lastIy.id } });
      const categoryMap = new Map<number, number>();
      for (const cat of categories) {
        const newCat = await tx.category.create({
          data: {
            name:           cat.name,
            icon:           cat.icon,
            order:          cat.order,
            instanceYearId: newIy.id,
          },
        });
        categoryMap.set(cat.id, newCat.id);
      }

      // --- B. CLONAGE DES TEAMS, GROUPS & CHILDREN ---
      const teams = await tx.team.findMany({
        where:   { instanceYearId: lastIy.id },
        include: { groups: { include: { children: true } } },
      });

      for (const team of teams) {
        const newTeam = await tx.team.create({
          data: { name: team.name, color: team.color, icon: team.icon, instanceYearId: newIy.id },
        });

        for (const group of team.groups) {
          const newGroup = await tx.group.create({
            data: { name: group.name, color: group.color, teamId: newTeam.id },
          });
          for (const child of group.children) {
            await tx.child.create({
              data: { pseudo: child.pseudo, password: child.password, avatar: child.avatar, groupId: newGroup.id },
            });
          }
        }
      }

      // --- C. CLONAGE DU CATALOGUE (LOCAL ACTIONS — reste sur instanceId + schoolYear) ---
      const localActions = await tx.localAction.findMany({ where: { instanceId, schoolYear: fromYear } });
      for (const action of localActions) {
        await tx.localAction.create({
          data: {
            label:          action.label,
            description:    action.description,
            image:          action.image,
            instanceId:     action.instanceId,
            actionRefId:    action.actionRefId,
            schoolYear:     targetYear,
            categoryId:     action.categoryId ? categoryMap.get(action.categoryId) ?? null : null,
            specificCo2:    action.specificCo2,
            specificWater:  action.specificWater,
            specificWaste:  action.specificWaste,
            specificEnergy: action.specificEnergy,
          },
        });
      }

      // --- D. CLONAGE DE LA GAMECONFIG ---
      const gameConfig = await tx.gameConfig.findUnique({
        where: { instanceId_schoolYear: { instanceId, schoolYear: fromYear } },
      });
      if (gameConfig) {
        await tx.gameConfig.create({
          data: {
            instanceId,
            schoolYear:                   targetYear,
            avgActionsPerChildPerPeriod:  gameConfig.avgActionsPerChildPerPeriod,
            animalAdvanceMargin:          gameConfig.animalAdvanceMargin,
            bienveillanceThreshold:       gameConfig.bienveillanceThreshold,
          },
        });
      }

      return { success: true, fromYear, targetYear, instanceYearId: newIy.id };
    });
  }

  /**
   * Résout une InstanceYear depuis (instanceId, schoolYear).
   * Crée l'InstanceYear si elle n'existe pas encore (first-time access).
   */
  async resolveInstanceYear(instanceId: number, schoolYear: string) {
    let iy = await this.prisma.instanceYear.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
      select: { id: true, instanceId: true, schoolYear: true, isOpen: true },
    });
    if (!iy) {
      // Création automatique pour rétrocompatibilité
      iy = await this.prisma.instanceYear.create({
        data: { instanceId, schoolYear },
        select: { id: true, instanceId: true, schoolYear: true, isOpen: true },
      });
    }
    return iy;
  }
}
