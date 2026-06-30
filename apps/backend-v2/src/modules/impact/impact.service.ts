import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ImpactService {
  private readonly logger = new Logger(ImpactService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate impact for a specific year and optional instanceId.
   * If instanceId is null, calculates globally across all instances.
   */
  async calculateImpact(
    yearOrSchoolYear: number | string,
    instanceId: number | null = null,
  ) {
    let year: number;
    let schoolYearFilter: string | null = null;

    if (
      typeof yearOrSchoolYear === 'string' &&
      yearOrSchoolYear.includes('-')
    ) {
      schoolYearFilter = yearOrSchoolYear;
      year = parseInt(yearOrSchoolYear.split('-')[0], 10);
    } else {
      year = Number(yearOrSchoolYear);
    }

    try {
      // 1. Charger les constantes annuelles (DataRef)
      // On cherche l'année de référence (ex: 2024 pour l'année scolaire 2024-2025)
      // Si non trouvé, on prend la plus récente.
      let annualData = await this.prisma.annualImpactData.findUnique({
        where: { year },
      });

      if (!annualData) {
        // Récupérer la plus récente pour copier ses valeurs, ou utiliser des valeurs par défaut
        const mostRecent = await this.prisma.annualImpactData.findFirst({
          orderBy: { year: 'desc' },
        });

        annualData = await this.prisma.annualImpactData.create({
          data: {
            year,
            dActuel: mostRecent?.dActuel ?? 214,
            moyCo2Monde: mostRecent?.moyCo2Monde ?? 4.7,
            moyEauMonde: mostRecent?.moyEauMonde ?? 1385000,
            moyDechetsMonde: mostRecent?.moyDechetsMonde ?? 270,
            popMonde: mostRecent?.popMonde ?? 8.1,
            assiduityWeight: mostRecent?.assiduityWeight ?? 0.0,
            annualMultiplierWeight: mostRecent?.annualMultiplierWeight ?? 1.0,
            difficultyFactor: mostRecent?.difficultyFactor ?? 2.0,
            worldProjectionMultiplier: mostRecent?.worldProjectionMultiplier ?? 1.0,
            isCustomized: false,
          },
        });
        this.logger.log(
          `Création automatique des constantes d'impact globales par défaut pour l'année ${year}`,
        );
      }

      // 2. Nombre total d'enfants inscrits
      let nbChildrenTotal = 1;
      if (instanceId !== null) {
        nbChildrenTotal =
          (await this.prisma.child.count({
            where: { group: { team: { instanceYear: { instanceId } } } },
          })) || 1;
      } else {
        const sy = schoolYearFilter || `${year}-${year + 1}`;
        nbChildrenTotal =
          (await this.prisma.child.count({
            where: { group: { team: { instanceYear: { schoolYear: sy } } } },
          })) || 1;
      }

      // 3. Récupérer les actions effectuées
      const actionFilter: any = {};
      if (instanceId !== null) {
        actionFilter.period = { instanceYear: { instanceId } };
        if (schoolYearFilter) {
          actionFilter.period.instanceYear = {
            instanceId,
            schoolYear: schoolYearFilter,
          };
        }
      } else if (schoolYearFilter) {
        actionFilter.period = {
          instanceYear: { schoolYear: schoolYearFilter },
        };
      }

      const actionsDone = await this.prisma.actionDone.findMany({
        where: actionFilter,
        select: {
          savedCo2: true,
          savedWater: true,
          savedWaste: true,
          childId: true,
        },
      });

      // Sommes réelles collectées
      let realCo2 = 0;
      let realWater = 0;
      let realWaste = 0;
      for (const act of actionsDone) {
        realCo2 += act.savedCo2;
        realWater += act.savedWater;
        realWaste += act.savedWaste;
      }

      // 4. Calcul du Ratio d'Assiduité (V11)
      // On compare les saisies réelles au potentiel maximum (Nb_Enfants * Nb_Actions * Nb_Semaines)
      const catalogSize = (await this.prisma.actionRef.count()) || 62;

      let gameDuration = 52; // Valeur par défaut pour une année scolaire complète
      if (instanceId !== null) {
        const sy = schoolYearFilter || `${year}-${year + 1}`;
        const config = await this.prisma.gameConfig.findUnique({
          where: { instanceId_schoolYear: { instanceId, schoolYear: sy } },
        });
        gameDuration = config?.gamePeriodsCount || 52;
      } else {
        const sy = schoolYearFilter || `${year}-${year + 1}`;
        const configs = await this.prisma.gameConfig.findMany({
          where: { schoolYear: sy },
          select: { gamePeriodsCount: true },
        });
        if (configs.length > 0) {
          gameDuration = configs.reduce((a, b) => a + b.gamePeriodsCount, 0) / configs.length;
        }
      }

      const totalPossibleEntries = nbChildrenTotal * catalogSize * gameDuration;
      const assiduiteRatio =
        totalPossibleEntries > 0
          ? actionsDone.length / totalPossibleEntries
          : 0;

      // 5. Extrapolation Annuelle de l'effort individuel
      const annualMultiplierWeight = annualData.annualMultiplierWeight ?? 1.0;
      const baseAnnualRatio = 52.0 / gameDuration;
      const annualRatio = 1 + (baseAnnualRatio - 1) * annualMultiplierWeight;

      const avgCo2PerChild =
        nbChildrenTotal > 0 ? realCo2 / nbChildrenTotal : 0;
      const avgWaterPerChild =
        nbChildrenTotal > 0 ? realWater / nbChildrenTotal : 0;
      const avgWastePerChild =
        nbChildrenTotal > 0 ? realWaste / nbChildrenTotal : 0;

      const worldProjectionMultiplier = annualData.worldProjectionMultiplier ?? 1.0;
      const effortCo2Indiv = (avgCo2PerChild / 1000) * annualRatio * worldProjectionMultiplier; // Tonnes/an par joueur pondéré
      const effortWaterIndiv = avgWaterPerChild * annualRatio * worldProjectionMultiplier; // Litres/an par joueur pondéré
      const effortWasteIndiv = avgWastePerChild * annualRatio * worldProjectionMultiplier; // kg/an par joueur pondéré

      // 6. Projection Mondiale
      // Le facteur ambassadeur de 4 (foyer) et le diviseur de population de 4 (nombre de foyers) s'annulant mutuellement,
      // l'extrapolation mondiale est directement le produit de l'effort individuel moyen par la population mondiale.
      const refPop = (annualData.popMonde || 8.1) * 1_000_000_000;
      const projectionCo2Monde = effortCo2Indiv * refPop;
      const projectionWaterMonde = effortWaterIndiv * refPop;
      const projectionWasteMonde = effortWasteIndiv * refPop;

      // 7. Ratios de réduction individuels par rapport à l'empreinte mondiale de référence (Modèle Carbone 4)
      const pCo2 = effortCo2Indiv / (annualData.moyCo2Monde || 4.7);
      const pWater = effortWaterIndiv / (annualData.moyEauMonde || 1385000);
      const pWaste = effortWasteIndiv / (annualData.moyDechetsMonde || 270);

      // Pondération : 60% CO2, 20% Eau, 20% Déchets
      const rawEffortRatio = pCo2 * 0.6 + pWater * 0.2 + pWaste * 0.2;

      // Application du poids de l'assiduité
      const assiduityWeight = annualData.assiduityWeight ?? 0.0;
      const weightedEffortRatio = rawEffortRatio * (1 - assiduityWeight) + (rawEffortRatio * assiduiteRatio) * assiduityWeight;
      const safeEffortRatio = Math.min(weightedEffortRatio, 0.99);

      // 8. Calcul des Planètes et Jour J (Modèle Asymptotique 25%)
      const isLeapYear =
        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const jAnnee = isLeapYear ? 366 : 365;

      const basePlanetes = jAnnee / (annualData.dActuel || 214); // Ex: 1.71

      // Plafond d'action individuelle limité à 25%, avec progression asymptotique (facteur 2.0 par défaut pour lisser la courbe)
      const difficultyFactor = annualData.difficultyFactor ?? 2.0;
      const reductionImpactTotal =
        0.25 * (1 - Math.exp(-weightedEffortRatio * difficultyFactor));
      const nbPlanetes = basePlanetes * (1 - reductionImpactTotal);

      const nouveauJourAnnee = jAnnee / nbPlanetes;

      // Formatage des dates
      const eodDate = new Date(`${year}-01-01`);
      eodDate.setDate(eodDate.getDate() + Math.floor(nouveauJourAnnee) - 1);

      const eodDateSans = new Date(`${year}-01-01`);
      eodDateSans.setDate(
        eodDateSans.getDate() + Math.floor(annualData.dActuel || 214) - 1,
      );

      // 9. Informations d'identité (si instance)
      let name = undefined;
      let nbChildren = undefined;
      if (instanceId) {
        const inst = await this.prisma.instance.findUnique({
          where: { id: instanceId },
          select: { schoolName: true },
        });
        if (inst) {
          name = inst.schoolName;
          // Compter les enfants via instanceYear
          nbChildren = await this.prisma.child.count({
            where: { group: { team: { instanceYear: { instanceId } } } },
          });
        }
      }

      return {
        scope: instanceId ? 'instance' : 'global',
        scopeId: instanceId,
        name,
        nbChildren,
        isDefaultConstants: !annualData.isCustomized,
        sums: {
          totalCo2: projectionCo2Monde, // tCO2e projection mondiale
          totalWater: projectionWaterMonde, // Projection mondiale L
          totalWaste: projectionWasteMonde, // Projection mondiale kg
        },
        realSums: {
          totalCo2: realCo2 / 1000,
          totalWater: realWater,
          totalWaste: realWaste,
        },
        ratios: {
          assiduite: Number((assiduiteRatio * 100).toFixed(2)),
          participation: Number((weightedEffortRatio * 100).toFixed(2)), // % de l'objectif citoyen réalisé
        },
        results: {
          effortPlanetairePercent: Number(
            (reductionImpactTotal * 100).toFixed(2),
          ),
          nouveauJourAnnee: Number(nouveauJourAnnee.toFixed(2)),
          nbPlanetes: Number(nbPlanetes.toFixed(2)),
          dateDepassement: eodDate.toLocaleDateString('fr-FR'),
          dateDepassementSans: eodDateSans.toLocaleDateString('fr-FR'),
          dateDepassementFormat: eodDate.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Erreur dans calculateImpact:', error);
      return this.fallbackImpact();
    }
  }

  async getImpactSummary(yearOrSchoolYear: string) {
    // 1. Récupérer toutes les instances pour calculer individuellement
    const instances = await this.prisma.instance.findMany({
      select: { id: true, schoolName: true },
    });

    const instancesImpact = [];
    let totalPlanets = 0;
    let totalEffortPercent = 0;
    let totalJourAnnee = 0;

    let sumRealCo2 = 0;
    let sumRealWater = 0;
    let sumRealWaste = 0;

    let sumProjCo2 = 0;
    let sumProjWater = 0;
    let sumProjWaste = 0;

    for (const inst of instances) {
      const impact = await this.calculateImpact(yearOrSchoolYear, inst.id);
      const impactData = impact as any;

      instancesImpact.push({
        id: inst.id,
        name: impactData.name || inst.schoolName,
        nbChildren: impactData.nbChildren || 0,
        ...impactData.results,
        sums: impactData.sums,
        realSums: impactData.realSums,
        ratios: impactData.ratios,
        isDefaultConstants: impactData.isDefaultConstants,
      });

      // Agrégation pour le global selon les règles de l'utilisateur
      if (impactData.results) {
        totalPlanets += impactData.results.nbPlanetes || 0;
        totalEffortPercent += impactData.results.effortPlanetairePercent || 0;
        totalJourAnnee += impactData.results.nouveauJourAnnee || 214;
      }

      if (impactData.realSums) {
        sumRealCo2 += impactData.realSums.totalCo2 || 0;
        sumRealWater += impactData.realSums.totalWater || 0;
        sumRealWaste += impactData.realSums.totalWaste || 0;
      }

      if (impactData.sums) {
        sumProjCo2 += impactData.sums.totalCo2 || 0;
        sumProjWater += impactData.sums.totalWater || 0;
        sumProjWaste += impactData.sums.totalWaste || 0;
      }
    }

    const count = instances.length || 1;

    // Formatage du Jour du Dépassement Moyen
    const avgJourAnnee = totalJourAnnee / count;
    const year = parseInt(yearOrSchoolYear.split('-')[0], 10);
    const eodDate = new Date(`${year}-01-01`);
    eodDate.setDate(eodDate.getDate() + Math.floor(avgJourAnnee) - 1);

    return {
      global: {
        realSums: {
          totalCo2: sumRealCo2,
          totalWater: sumRealWater,
          totalWaste: sumRealWaste,
        },
        sums: {
          totalCo2: sumProjCo2,
          totalWater: sumProjWater,
          totalWaste: sumProjWaste,
        },
        results: {
          nbPlanetes: Number((totalPlanets / count).toFixed(2)),
          effortPlanetairePercent: Number(
            (totalEffortPercent / count).toFixed(2),
          ),
          dateDepassement: eodDate.toLocaleDateString('fr-FR'),
          nouveauJourAnnee: avgJourAnnee,
        },
        isDefaultConstants: instancesImpact.some((i) => i.isDefaultConstants),
      },
      instances: instancesImpact,
    };
  }

  async getAnnualConstants(schoolYear: string) {
    const year = parseInt(schoolYear.split('-')[0], 10);
    let data = await this.prisma.annualImpactData.findUnique({
      where: { year },
    });
    if (!data) {
      data = await this.prisma.annualImpactData.create({
        data: {
          year,
          dActuel: 214,
          moyCo2Monde: 4.7,
          moyEauMonde: 1385000,
          moyDechetsMonde: 270,
          popMonde: 8.1,
        },
      });
    }
    return data;
  }

  async getSimulationBase(schoolYear: string) {
    const year = parseInt(schoolYear.split('-')[0], 10);
    const annualData = await this.prisma.annualImpactData.findUnique({
      where: { year },
    });

    // En global, on prend tous les enfants actifs dans l'année scolaire
    const nbChildrenTotal =
      (await this.prisma.child.count({
        where: { group: { team: { instanceYear: { schoolYear } } } },
      })) || 1;
    const actionsDone = await this.prisma.actionDone.findMany({
      where: { period: { instanceYear: { schoolYear } } },
      select: { savedCo2: true, savedWater: true, savedWaste: true },
    });

    let realCo2 = 0;
    let realWater = 0;
    let realWaste = 0;
    for (const act of actionsDone) {
      realCo2 += act.savedCo2;
      realWater += act.savedWater;
      realWaste += act.savedWaste;
    }

    const catalogSize = (await this.prisma.actionRef.count()) || 62;
    
    let gameDuration = 52; // Default for global
    const configs = await this.prisma.gameConfig.findMany({
      where: { schoolYear },
      select: { gamePeriodsCount: true },
    });
    if (configs.length > 0) {
      gameDuration = configs.reduce((a, b) => a + b.gamePeriodsCount, 0) / configs.length;
    }

    return {
      annualData: annualData || {
        dActuel: 214,
        moyCo2Monde: 4.7,
        moyEauMonde: 1385000,
        moyDechetsMonde: 270,
        popMonde: 8.1,
        assiduityWeight: 0.0,
        annualMultiplierWeight: 1.0,
        difficultyFactor: 2.0,
        worldProjectionMultiplier: 1.0,
      },
      nbChildrenTotal,
      actionsCount: actionsDone.length,
      realCo2,
      realWater,
      realWaste,
      catalogSize,
      gameDuration,
    };
  }

  async updateAnnualTuning(year: number, payload: any) {
    return this.prisma.annualImpactData.update({
      where: { year },
      data: {
        assiduityWeight: payload.assiduityWeight,
        annualMultiplierWeight: payload.annualMultiplierWeight,
        difficultyFactor: payload.difficultyFactor,
        worldProjectionMultiplier: payload.worldProjectionMultiplier,
      },
    });
  }

  async updateAnnualConstants(payload: any, currentUser?: any) {
    const year = parseInt(payload.schoolYear.split('-')[0], 10);
    const updated = await this.prisma.annualImpactData.upsert({
      where: { year },
      update: {
        dActuel: payload.dActuel,
        moyCo2Monde: payload.moyCo2Monde,
        moyEauMonde: payload.moyEauMonde,
        moyDechetsMonde: payload.moyDechetsMonde,
        popMonde: payload.popMonde,
        isCustomized: true,
      },
      create: {
        year,
        dActuel: payload.dActuel,
        moyCo2Monde: payload.moyCo2Monde,
        moyEauMonde: payload.moyEauMonde,
        moyDechetsMonde: payload.moyDechetsMonde,
        popMonde: payload.popMonde || 8.1,
        isCustomized: true,
      },
    });

    try {
      const targetSchoolYear = payload.schoolYear;
      // 1. Trouver les administrateurs des instances configurées sur cette année (les AMs)
      const instanceYears = await this.prisma.instanceYear.findMany({
        where: { schoolYear: targetSchoolYear },
        include: {
          instance: {
            select: { adminId: true },
          },
        },
      });

      const amIds = new Set<number>();
      for (const iy of instanceYears) {
        if (iy.instance?.adminId) {
          amIds.add(iy.instance.adminId);
        }
      }

      const senderId = currentUser?.userId || 1; // Fallback système
      const titleReply = `Constantes configurées - ${targetSchoolYear}`;
      const contentReply = `L'Administrateur du Référentiel a configuré les constantes mondiales pour l'année ${targetSchoolYear}. Vous pouvez maintenant configurer votre calendrier de jeu et vos équipes.`;

      for (const amId of amIds) {
        const existsReply = await this.prisma.notification.findFirst({
          where: {
            recipientId: amId,
            title: titleReply,
          },
        });
        if (!existsReply) {
          await this.prisma.notification.create({
            data: {
              senderId,
              recipientId: amId,
              title: titleReply,
              content: contentReply,
              status: 'PENDING',
              isRead: false,
            },
          });
        }
      }

      // 2. Mettre à jour le statut des demandes PENDING de cette année en PROCESSED
      await this.prisma.notification.updateMany({
        where: {
          status: 'PENDING',
          title: {
            contains: targetSchoolYear,
          },
        },
        data: { status: 'PROCESSED' },
      });
    } catch (err) {
      this.logger.error(
        `[ImpactService] Error triggering constants updated notifications:`,
        err,
      );
    }

    return updated;
  }

  private fallbackImpact() {
    return {
      scope: 'fallback',
      scopeId: null,
      isDefaultConstants: true,
      sums: {
        totalCo2: 0,
        totalWater: 0,
        totalWaste: 0,
      },
      realSums: {
        totalCo2: 0,
        totalWater: 0,
        totalWaste: 0,
      },
      virtualChild: {
        avgCo2: 0,
        avgWater: 0,
        avgWaste: 0,
      },
      extrapolatedAnnualVirtualChild: {
        extCo2: 0,
        extWater: 0,
        extWaste: 0,
      },
      results: {
        effortPlanetairePercent: 0,
        nouveauJourAnnee: 214,
        nbPlanetes: 1.7,
        dateDepassement: '02/08/2026',
        dateDepassementSans: '02/08/2026',
        dateDepassementFormat: new Date().toISOString(),
      },
    };
  }

  async getImpactHistory(
    yearOrSchoolYear: string,
    targetInstanceId: number | null = null,
  ) {
    try {
      const year = parseInt(yearOrSchoolYear.split('-')[0], 10);
      const annualDataYear = year - 1;
      const annualData = await this.prisma.annualImpactData.findUnique({
        where: { year: annualDataYear },
      });

      if (!annualData || !annualData.dActuel) return [];

      // Récupérer toutes les périodes de l'année scolaire
      const periods = await this.prisma.period.findMany({
        where: {
          instanceYear: {
            schoolYear: yearOrSchoolYear,
            ...(targetInstanceId !== null
              ? { instanceId: targetInstanceId }
              : {}),
          },
        },
        orderBy: { startDate: 'asc' },
        select: { id: true, startDate: true },
      });

      if (periods.length === 0) return [];

      // Récupérer toutes les actions liées à ces périodes
      const periodIds = periods.map((p) => p.id);
      const allActions = await this.prisma.actionDone.findMany({
        where: { periodId: { in: periodIds } },
        select: {
          periodId: true,
          savedCo2: true,
          savedWater: true,
          savedWaste: true,
        },
      });

      // Calculer le nombre total d'enfants (dans l'année scolaire demandée)
      let nbChildren = 1;
      if (targetInstanceId !== null) {
        nbChildren =
          (await this.prisma.child.count({
            where: {
              group: {
                team: {
                  instanceYear: {
                    instanceId: targetInstanceId,
                    schoolYear: yearOrSchoolYear,
                  },
                },
              },
            },
          })) || 1;
      } else {
        nbChildren =
          (await this.prisma.child.count({
            where: {
              group: {
                team: { instanceYear: { schoolYear: yearOrSchoolYear } },
              },
            },
          })) || 1;
      }

      const catalogSize = (await this.prisma.actionRef.count()) || 62;
      const isLeapYear =
        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const jAnnee = isLeapYear ? 366 : 365;
      const basePlanetes = jAnnee / annualData.dActuel;
      const partIncompressible = basePlanetes * 0.6;

      const history: any[] = [];
      let cumulativeActionsCount = 0;
      let cumulativeCo2 = 0;
      let cumulativeWater = 0;
      let cumulativeWaste = 0;

      for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        const periodActions = allActions.filter(
          (a) => a.periodId === period.id,
        );
        cumulativeActionsCount += periodActions.length;
        for (const a of periodActions) {
          cumulativeCo2 += a.savedCo2 || 0;
          cumulativeWater += a.savedWater || 0;
          cumulativeWaste += a.savedWaste || 0;
        }

        // Label de la période (ex: "P1", "P2", ...)
        const label = `P${i + 1}`;

        // Calcul des efforts par enfant (Ratio sur le gisement 40%)
        // Potentiel d'effort max annuel : CO2 (4T), Eau (116m3), Déchets (520kg)
        const effortCo2 = Math.min(
          40,
          (cumulativeCo2 / nbChildren / 4000) * 40,
        );
        const effortWater = Math.min(
          40,
          (cumulativeWater / nbChildren / 116) * 40,
        );
        const effortWaste = Math.min(
          40,
          (cumulativeWaste / nbChildren / 520) * 40,
        );

        // Pondération de l'Indice de Pression (CO2: 60%, Eau: 20%, Déchets: 20%)
        const globalEffort =
          effortCo2 * 0.6 + effortWater * 0.2 + effortWaste * 0.2;

        // L'indice d'impact total : 100 (départ) - effort cumulé
        const totalImpact = 100 - globalEffort;

        history.push({
          label,
          impact: Number(totalImpact.toFixed(2)),
        });
      }

      return history;
    } catch (error) {
      this.logger.error('Erreur dans getImpactHistory:', error);
      return [];
    }
  }
}
