import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EcoBarRaceService {
  private readonly logger = new Logger(EcoBarRaceService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calcule et enregistre le classement global pour une période donnée.
   * Cette fonction compare toutes les instances (écoles) entre elles.
   */
  async calculateRankingsForPeriod(periodNumber: number, schoolYear: string) {
    this.logger.log(
      `Calcul du classement Eco-Bar-Race pour la période ${periodNumber}...`,
    );

    // 1. Récupérer toutes les instances actives
    const instances = await this.prisma.instance.findMany({
      select: { id: true, schoolName: true },
    });

    const results = [];

    for (const instance of instances) {
      // Récupérer l'InstanceYear pour cette instance et cette année scolaire
      const instanceYear = await this.prisma.instanceYear.findUnique({
        where: {
          instanceId_schoolYear: { instanceId: instance.id, schoolYear },
        },
      });
      if (!instanceYear) continue;

      const periods = await this.prisma.period.findMany({
        where: { instanceYearId: instanceYear.id },
        orderBy: { startDate: 'asc' },
        take: periodNumber,
      });
      const periodIds = periods.map((p) => p.id);

      const snapshotDate: Date =
        periods.length > 0 ? periods[periods.length - 1].endDate : new Date();

      const impacts = await this.prisma.actionDone.aggregate({
        where: {
          child: { group: { team: { instanceYearId: instanceYear.id } } },
          periodId: { in: periodIds },
        },
        _sum: {
          savedCo2: true,
          savedWater: true,
          savedWaste: true,
          savedEnergy: true,
        },
      });

      results.push({
        instanceId: instance.id,
        instanceName: instance.schoolName,
        icon: instanceYear.icon,
        snapshotDate,
        co2Total: impacts._sum?.savedCo2 || 0,
        waterTotal: impacts._sum?.savedWater || 0,
        wasteTotal: impacts._sum?.savedWaste || 0,
        energyTotal: impacts._sum?.savedEnergy || 0,
      });
    }

    // 2. Classer par CO2 total descendant (critère principal de la course)
    results.sort((a, b) => b.co2Total - a.co2Total);

    const rankedResults = results.map((res, index) => ({
      ...res,
      rank: index + 1,
    }));

    // La date du snapshot global = date de fin de la Nème période (max parmi toutes les instances)
    const globalSnapshotDate: Date = results.reduce((latest, r) => {
      return r.snapshotDate > latest ? r.snapshotDate : latest;
    }, new Date(0));

    // 3. Sauvegarder le snapshot avec la vraie date de la période et l'année scolaire
    const existing = await this.prisma.ecoBarRaceSnapshot.findFirst({
      where: { period: periodNumber, schoolYear },
    });

    if (existing) {
      return this.prisma.ecoBarRaceSnapshot.update({
        where: { id: existing.id },
        data: {
          periodDate: globalSnapshotDate,
          rankings: rankedResults as any,
        },
      });
    }

    return this.prisma.ecoBarRaceSnapshot.create({
      data: {
        period: periodNumber,
        schoolYear,
        periodDate: globalSnapshotDate,
        rankings: rankedResults as any,
      },
    });
  }

  /**
   * Récupère le dernier classement disponible
   */
  async getLatestSnapshot(schoolYear: string) {
    return this.prisma.ecoBarRaceSnapshot.findFirst({
      where: { schoolYear },
      orderBy: { period: 'desc' },
    });
  }

  /**
   * Récupère l'historique complet pour l'animation Bar Chart Race
   */
  /**
   * Récupère l'historique complet pour l'animation Bar Chart Race
   */
  async getHistory(schoolYear: string) {
    return this.prisma.ecoBarRaceSnapshot.findMany({
      where: { schoolYear },
      orderBy: { period: 'asc' },
    });
  }

  /**
   * Recalcule l'intégralité de l'historique des snapshots.
   */
  async recalculateAllHistory(schoolYear: string) {
    this.logger.log(
      `Début du recalcul COMPLET de l'historique Eco-Bar-Race pour ${schoolYear}...`,
    );

    // Déterminer le nombre RÉEL de périodes à traiter :
    // on prend le max des gamePeriodsCount parmi toutes les instances pour cette année
    const configs = await this.prisma.gameConfig.findMany({
      where: { schoolYear },
      select: { gamePeriodsCount: true },
    });

    const realMaxPeriod =
      configs.length > 0
        ? Math.max(...configs.map((c) => c.gamePeriodsCount ?? 0))
        : 0;

    if (realMaxPeriod === 0) {
      this.logger.warn(
        `Aucune configuration de jeu trouvée pour ${schoolYear}. Recalcul annulé.`,
      );
      return [];
    }

    this.logger.log(
      `Recalcul sur ${realMaxPeriod} périodes réelles pour ${schoolYear}`,
    );

    // Supprimer les snapshots orphelins au-delà du nombre réel de périodes
    await this.prisma.ecoBarRaceSnapshot.deleteMany({
      where: { schoolYear, period: { gt: realMaxPeriod } },
    });

    const updatedCount = [];

    for (let p = 1; p <= realMaxPeriod; p++) {
      try {
        const snapshot = await this.calculateRankingsForPeriod(p, schoolYear);
        if (snapshot) updatedCount.push(snapshot);
      } catch (e) {
        this.logger.warn(`Période ${p} ignorée ou erreur : ${e.message}`);
      }
    }

    this.logger.log(
      `Recalcul terminé : ${updatedCount.length} snapshots mis à jour.`,
    );
    return updatedCount;
  }
}
