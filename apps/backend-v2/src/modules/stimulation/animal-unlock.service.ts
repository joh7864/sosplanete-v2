import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnimalUnlockService {
  private readonly logger = new Logger(AnimalUnlockService.name);

  constructor(private prisma: PrismaService) {}

  async calculateForInstance(instanceId: number, periodId: number, periodIndex: number, totalPeriods: number) {
    const instance = await this.prisma.instance.findUnique({
      where: { id: instanceId },
      include: {
        teams: { include: { groups: { include: { _count: { select: { children: true } } } } } }
      }
    });
    if (!instance) return 0;

    // Récupérer les métadonnées de la période pivot
    const period = await this.prisma.period.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException(`Période #${periodId} non trouvée`);
    const schoolYear = period.schoolYear ?? "2024-2025";

    let config = await this.prisma.gameConfig.findUnique({ 
      where: { instanceId_schoolYear: { instanceId, schoolYear } } 
    });

    if (!config) {
      this.logger.warn(`Aucune GameConfig pour l'instance ${instanceId} / ${schoolYear} — création avec les valeurs par défaut`);
      config = await this.prisma.gameConfig.create({
        data: {
          instanceId,
          schoolYear,
          avgActionsPerChildPerPeriod: 8,
          animalAdvanceMargin: 2,
          bienveillanceThreshold: 0.40,
        }
      });
    }

    // Calculer le nombre total d'enfants
    let totalChildren = 0;
    for (const team of instance.teams) {
      for (const group of team.groups) {
        totalChildren += group._count.children;
      }
    }
    
    // Si pas d'enfants, on peut pas calculer d'objectif
    if (totalChildren === 0) totalChildren = 1;

    // Objectif total sur l'année
    const globalTarget = totalChildren * config.avgActionsPerChildPerPeriod * totalPeriods;

    // Récupérer les IDs des périodes allant du début jusqu'à cette période incluse (dans la même année scolaire)
    const periodsUpToNow = await this.prisma.period.findMany({
      where: { instanceId, schoolYear },
      orderBy: { startDate: 'asc' },
      take: periodIndex
    });
    const periodIds = periodsUpToNow.map(p => p.id);

    // Actions réalisées cumulées (validées) depuis le début jusqu'à cette période (incluse)
    // Filtre par periodId garantit déjà l'isolation de l'année scolaire
    const actionsCount = await this.prisma.actionDone.count({
      where: { 
        child: { group: { team: { instanceId, schoolYear } } },
        periodId: { in: periodIds } 
      }
    });

    // 1. Minimum (Ligne de vie)
    const minimum = Math.round(9 * (periodIndex / totalPeriods));
    
    // 2. Maximum (Plafond)
    const maximum = minimum + config.animalAdvanceMargin;

    // 3. Actions méritées
    let deserved = Math.floor(9 * (actionsCount / globalTarget));

    // Coup de pouce final
    if (periodIndex === totalPeriods) {
      if ((actionsCount / globalTarget) >= config.bienveillanceThreshold) {
        deserved = 9;
      }
    }

    // Restreindre dans le tunnel
    let finalCount = Math.max(minimum, Math.min(maximum, deserved));
    // S'assurer de ne pas dépasser 9
    finalCount = Math.min(finalCount, 9);

    return finalCount;
  }

  async getUnlockHistory(instanceId: number, schoolYear: string) {
    return this.prisma.instanceAnimalUnlock.findMany({
      where: { instanceId, schoolYear },
      orderBy: { period: 'asc' }
    });
  }

  async getCurrentUnlock(instanceId: number, schoolYear: string) {
    const lastUnlock = await this.prisma.instanceAnimalUnlock.findFirst({
      where: { instanceId, schoolYear },
      orderBy: { period: 'desc' }
    });
    return { animalsUnlocked: lastUnlock?.animalsCount || 0 };
  }

  async recalculateCurrentPeriod(instanceId: number) {
    const period = await this.prisma.period.findFirst({
      where: { instanceId, isOpen: true },
      orderBy: { id: 'desc' }
    });
    if (!period) {
      throw new NotFoundException(`Aucune période ouverte trouvée pour l'instance ${instanceId}`);
    }
    this.logger.log(`Recalcul instance=${instanceId} période=${period.id}`);


    const sy = period.schoolYear ?? "2024-2025";

    const allPeriods = await this.prisma.period.findMany({
      where: { instanceId, schoolYear: sy },
      orderBy: { startDate: 'asc' }
    });
    const periodIndex = allPeriods.findIndex(p => p.id === period.id) + 1;

    const count = await this.calculateForInstance(instanceId, period.id, periodIndex, allPeriods.length);

    // Upsert avec schoolYear
    return this.prisma.instanceAnimalUnlock.upsert({
      where: { 
        instanceId_period_schoolYear: { 
          instanceId, 
          period: periodIndex,
          schoolYear: sy
        } 
      },
      update: { animalsCount: count, periodDate: period.endDate },
      create: {
        instanceId,
        period: periodIndex,
        schoolYear: sy,
        animalsCount: count,
        periodDate: period.endDate
      }
    });
  }

  async recalculateAllPeriods(instanceId: number, schoolYear: string) {
    this.logger.log(`Début du recalcul TOTAL pour l'instance ${instanceId} (année ${schoolYear})...`);
    
    const allPeriods = await this.prisma.period.findMany({
      where: { instanceId, schoolYear },
      orderBy: { startDate: 'asc' }
    });

    if (allPeriods.length === 0) throw new NotFoundException('Aucune période trouvée');

    // On recalcule jusqu'à la période actuellement ouverte (ou la dernière si tout est fermé)
    const currentPeriodIndex = allPeriods.findIndex(p => p.isOpen);
    const maxIndexToCalculate = currentPeriodIndex !== -1 ? currentPeriodIndex + 1 : allPeriods.length;

    const results = [];
    for (let i = 0; i < maxIndexToCalculate; i++) {
      const period = allPeriods[i];
      const periodIndex = i + 1;
      
      const count = await this.calculateForInstance(instanceId, period.id, periodIndex, allPeriods.length);

      const result = await this.prisma.instanceAnimalUnlock.upsert({
        where: { 
          instanceId_period_schoolYear: { 
            instanceId, 
            period: periodIndex,
            schoolYear
          } 
        },
        update: { animalsCount: count, periodDate: period.endDate },
        create: {
          instanceId,
          period: periodIndex,
          schoolYear,
          animalsCount: count,
          periodDate: period.endDate
        }
      });
      results.push(result);
    }
    
    this.logger.log(`Recalcul TOTAL terminé : ${results.length} périodes mises à jour.`);
    return results;
  }
}
