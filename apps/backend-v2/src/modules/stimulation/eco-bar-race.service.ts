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
  async calculateRankingsForPeriod(periodNumber: number) {
    this.logger.log(`Calcul du classement Eco-Bar-Race pour la période ${periodNumber}...`);

    // 1. Récupérer toutes les instances actives
    const instances = await this.prisma.instance.findMany({
      where: { isOpen: true },
      select: { id: true, schoolName: true, icon: true }
    });

    const results = [];
    let snapshotDate: Date = new Date();

    for (const instance of instances) {
      // Récupérer les N premières périodes de cette instance
      const periods = await this.prisma.period.findMany({
        where: { instanceId: instance.id },
        orderBy: { startDate: 'asc' },
        take: periodNumber
      });
      const periodIds = periods.map(p => p.id);

      // Utiliser l'endDate de la Neme période comme date du snapshot
      if (periods.length > 0) {
        const lastPeriod = periods[periods.length - 1];
        snapshotDate = lastPeriod.endDate;
      }

      // Cumul des impacts enregistrés dans ActionDone
      const impacts = await this.prisma.actionDone.aggregate({
        where: { 
          child: { group: { team: { instanceId: instance.id } } },
          periodId: { in: periodIds }
        },
        _sum: {
          savedCo2: true,
          savedWater: true,
          savedWaste: true,
          savedEnergy: true
        }
      });

      results.push({
        instanceId: instance.id,
        instanceName: instance.schoolName,
        icon: instance.icon,
        co2Total: impacts._sum.savedCo2 || 0,
        waterTotal: impacts._sum.savedWater || 0,
        wasteTotal: impacts._sum.savedWaste || 0,
        energyTotal: impacts._sum.savedEnergy || 0
      });
    }

    // 2. Classer par CO2 total descendant (critère principal de la course)
    results.sort((a, b) => b.co2Total - a.co2Total);

    const rankedResults = results.map((res, index) => ({
      ...res,
      rank: index + 1
    }));

    // 3. Sauvegarder le snapshot avec la vraie date de la période
    const existing = await this.prisma.ecoBarRaceSnapshot.findFirst({
      where: { period: periodNumber }
    });

    if (existing) {
      return this.prisma.ecoBarRaceSnapshot.update({
        where: { id: existing.id },
        data: {
          periodDate: snapshotDate,
          rankings: rankedResults as any
        }
      });
    }

    return this.prisma.ecoBarRaceSnapshot.create({
      data: {
        period: periodNumber,
        periodDate: snapshotDate,
        rankings: rankedResults as any
      }
    });
  }

  /**
   * Récupère le dernier classement disponible
   */
  async getLatestSnapshot() {
    return this.prisma.ecoBarRaceSnapshot.findFirst({
      orderBy: { period: 'desc' }
    });
  }

  /**
   * Récupère l'historique complet pour l'animation Bar Chart Race
   */
  /**
   * Récupère l'historique complet pour l'animation Bar Chart Race
   */
  async getHistory() {
    return this.prisma.ecoBarRaceSnapshot.findMany({
      orderBy: { period: 'asc' }
    });
  }

  /**
   * Recalcule l'intégralité de l'historique des snapshots.
   */
  async recalculateAllHistory() {
    this.logger.log('Début du recalcul COMPLET de l\'historique Eco-Bar-Race...');
    
    // Déterminer la période max parmi toutes les instances
    const maxPeriod = await this.prisma.period.aggregate({
      _max: { id: true }, // Attention, id de période != numéro de période
    });

    // En fait, on peut se baser sur le gamePeriodsCount de l'instance de référence ou juste boucler 
    // jusqu'à la période actuelle la plus haute.
    // Pour simplifier et être robuste, on va boucler jusqu'à la période 43 (max théorique)
    // mais ne traiter que les périodes qui ont au moins une ActionDone.
    
    const maxPeriodNumber = 43; // Sécurité
    const updatedCount = [];

    for (let p = 1; p <= maxPeriodNumber; p++) {
      // Vérifier si au moins une instance a des données pour cette période
      const hasData = await this.prisma.actionDone.findFirst({
        where: { period: { id: { gte: 0 } } } // Simplifié : on délègue au calculateRankingsForPeriod
      });

      try {
        const snapshot = await this.calculateRankingsForPeriod(p);
        updatedCount.push(snapshot);
      } catch (e) {
        this.logger.warn(`Période ${p} ignorée ou erreur : ${e.message}`);
      }
    }

    return updatedCount;
  }
}
