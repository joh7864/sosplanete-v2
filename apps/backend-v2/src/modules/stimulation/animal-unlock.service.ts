import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnimalUnlockService {
  private readonly logger = new Logger(AnimalUnlockService.name);

  constructor(private prisma: PrismaService) {}

  async calculateForInstance(instanceId: number, periodId: number, periodIndex: number, totalPeriods: number) {
    // Compter les enfants via l'instanceYear de cette période
    const period = await this.prisma.period.findUnique({
      where: { id: periodId },
      include: { instanceYear: true },
    });
    if (!period) throw new NotFoundException(`Période #${periodId} non trouvée`);

    const { instanceYearId } = period;
    const schoolYear = period.instanceYear.schoolYear;

    const totalChildren = await this.prisma.child.count({
      where: { group: { team: { instanceYearId } } },
    }) || 1;

    let config = await this.prisma.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });

    if (!config) {
      this.logger.warn(`Aucune GameConfig pour l'instance ${instanceId} / ${schoolYear} — création par défaut`);
      config = await this.prisma.gameConfig.create({
        data: { instanceId, schoolYear, avgActionsPerChildPerPeriod: 8, animalAdvanceMargin: 2, bienveillanceThreshold: 0.40 },
      });
    }

    const globalTarget = totalChildren * config.avgActionsPerChildPerPeriod * totalPeriods;

    const periodsUpToNow = await this.prisma.period.findMany({
      where: { instanceYearId },
      orderBy: { startDate: 'asc' },
      take: periodIndex,
    });
    const periodIds = periodsUpToNow.map(p => p.id);

    const actionsCount = await this.prisma.actionDone.count({
      where: {
        child: { group: { team: { instanceYearId } } },
        periodId: { in: periodIds },
      },
    });

    const minimum = Math.round(9 * (periodIndex / totalPeriods));
    const maximum = minimum + config.animalAdvanceMargin;
    let deserved  = Math.floor(9 * (actionsCount / globalTarget));

    if (periodIndex === totalPeriods && (actionsCount / globalTarget) >= config.bienveillanceThreshold) {
      deserved = 9;
    }

    return Math.min(Math.max(minimum, Math.min(maximum, deserved)), 9);
  }

  async getUnlockHistory(instanceId: number, schoolYear: string) {
    return this.prisma.instanceAnimalUnlock.findMany({
      where: { instanceId, schoolYear },
      orderBy: { period: 'asc' },
    });
  }

  async getCurrentUnlock(instanceId: number, schoolYear: string) {
    const lastUnlock = await this.prisma.instanceAnimalUnlock.findFirst({
      where: { instanceId, schoolYear },
      orderBy: { period: 'desc' },
    });
    return { animalsUnlocked: lastUnlock?.animalsCount || 0 };
  }

  async recalculateCurrentPeriod(instanceId: number) {
    // Chercher l'InstanceYear ouverte pour cette instance
    const openIy = await this.prisma.instanceYear.findFirst({
      where: { instanceId, isOpen: true },
    });
    if (!openIy) throw new NotFoundException(`Aucune InstanceYear ouverte pour l'instance ${instanceId}`);

    const period = await this.prisma.period.findFirst({
      where: { instanceYearId: openIy.id, isOpen: true },
      orderBy: { id: 'desc' },
    });
    if (!period) throw new NotFoundException(`Aucune période ouverte pour l'instance ${instanceId}`);

    this.logger.log(`Recalcul instance=${instanceId} période=${period.id}`);

    const allPeriods = await this.prisma.period.findMany({
      where: { instanceYearId: openIy.id },
      orderBy: { startDate: 'asc' },
    });
    const periodIndex = allPeriods.findIndex(p => p.id === period.id) + 1;
    const count = await this.calculateForInstance(instanceId, period.id, periodIndex, allPeriods.length);

    return this.prisma.instanceAnimalUnlock.upsert({
      where: { instanceId_period_schoolYear: { instanceId, period: periodIndex, schoolYear: openIy.schoolYear } },
      update: { animalsCount: count, periodDate: period.endDate },
      create: { instanceId, period: periodIndex, schoolYear: openIy.schoolYear, animalsCount: count, periodDate: period.endDate },
    });
  }

  async recalculateAllPeriods(instanceId: number, schoolYear: string) {
    this.logger.log(`Début du recalcul TOTAL pour l'instance ${instanceId} (année ${schoolYear})...`);

    const instanceYear = await this.prisma.instanceYear.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });
    if (!instanceYear) throw new NotFoundException(`Aucune InstanceYear pour instance ${instanceId} / ${schoolYear}`);

    const allPeriods = await this.prisma.period.findMany({
      where: { instanceYearId: instanceYear.id },
      orderBy: { startDate: 'asc' },
    });
    if (allPeriods.length === 0) throw new NotFoundException('Aucune période trouvée');

    const currentPeriodIndex = allPeriods.findIndex(p => p.isOpen);
    const maxIndexToCalculate = currentPeriodIndex !== -1 ? currentPeriodIndex + 1 : allPeriods.length;

    const results = [];
    for (let i = 0; i < maxIndexToCalculate; i++) {
      const p           = allPeriods[i];
      const periodIndex = i + 1;
      const count       = await this.calculateForInstance(instanceId, p.id, periodIndex, allPeriods.length);

      const result = await this.prisma.instanceAnimalUnlock.upsert({
        where: { instanceId_period_schoolYear: { instanceId, period: periodIndex, schoolYear } },
        update: { animalsCount: count, periodDate: p.endDate },
        create: { instanceId, period: periodIndex, schoolYear, animalsCount: count, periodDate: p.endDate },
      });
      results.push(result);
    }

    this.logger.log(`Recalcul TOTAL terminé : ${results.length} périodes mises à jour.`);
    return results;
  }
}
