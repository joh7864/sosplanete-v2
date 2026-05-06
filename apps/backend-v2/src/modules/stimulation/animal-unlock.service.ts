import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnimalUnlockService {
  private readonly logger = new Logger(AnimalUnlockService.name);

  constructor(private prisma: PrismaService) {}

  async calculateForInstance(instanceId: number, periodId: number, periodIndex: number, totalPeriods: number) {
    let config = await this.prisma.gameConfig.findUnique({ where: { instanceId } });
    if (!config) {
      this.logger.warn(`Aucune GameConfig pour l'instance ${instanceId} — création avec les valeurs par défaut`);
      config = await this.prisma.gameConfig.create({
        data: {
          instanceId,
          avgActionsPerChildPerPeriod: 8,
          animalAdvanceMargin: 2,
          bienveillanceThreshold: 0.40,
        }
      });
    }

    const instance = await this.prisma.instance.findUnique({
      where: { id: instanceId },
      include: {
        teams: { include: { groups: { include: { _count: { select: { children: true } } } } } }
      }
    });
    if (!instance) return 0;

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

    // Récupérer les IDs des périodes allant du début jusqu'à cette période incluse
    const periodsUpToNow = await this.prisma.period.findMany({
      where: { instanceId },
      orderBy: { id: 'asc' },
      take: periodIndex
    });
    const periodIds = periodsUpToNow.map(p => p.id);

    // Actions réalisées cumulées (validées) depuis le début jusqu'à cette période (incluse)
    const actionsCount = await this.prisma.actionDone.count({
      where: { 
        child: { group: { team: { instanceId } } },
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

  async getUnlockHistory(instanceId: number) {
    return this.prisma.instanceAnimalUnlock.findMany({
      where: { instanceId },
      orderBy: { period: 'asc' }
    });
  }

  async getCurrentUnlock(instanceId: number) {
    const lastUnlock = await this.prisma.instanceAnimalUnlock.findFirst({
      where: { instanceId },
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


    const allPeriods = await this.prisma.period.findMany({
      where: { instanceId },
      orderBy: { id: 'asc' }
    });
    const periodIndex = allPeriods.findIndex(p => p.id === period.id) + 1;

    const count = await this.calculateForInstance(instanceId, period.id, periodIndex, allPeriods.length);

    // Upsert natif Prisma
    return this.prisma.instanceAnimalUnlock.upsert({
      where: { instanceId_period: { instanceId, period: periodIndex } },
      update: { animalsCount: count, periodDate: period.endDate }, // Utilise la vraie date de fin de la période
      create: {
        instanceId,
        period: periodIndex,
        animalsCount: count,
        periodDate: period.endDate
      }
    });
  }

  async recalculateAllPeriods(instanceId: number) {
    this.logger.log(`Début du recalcul TOTAL pour l'instance ${instanceId}...`);
    
    const allPeriods = await this.prisma.period.findMany({
      where: { instanceId },
      orderBy: { id: 'asc' }
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
        where: { instanceId_period: { instanceId, period: periodIndex } },
        update: { animalsCount: count, periodDate: period.endDate },
        create: {
          instanceId,
          period: periodIndex,
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
