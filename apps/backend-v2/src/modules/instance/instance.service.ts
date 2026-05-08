import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';

@Injectable()
export class InstanceService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInstanceDto) {
    if (data.gameStartDate && typeof data.gameStartDate === 'string') {
      data.gameStartDate = new Date(data.gameStartDate);
    }
    if (data.gameEndDate && typeof data.gameEndDate === 'string') {
      data.gameEndDate = new Date(data.gameEndDate);
    }

    // Bug #1 — Éviter la violation de contrainte UNIQUE sur hostUrl
    // Une chaîne vide "" n'est pas null : deux instances sans URL crasheraient
    const sanitizedHostUrl = data.hostUrl?.trim() || null;

    const instance = await this.prisma.instance.create({
      data: {
        schoolName: data.schoolName,
        hostUrl: sanitizedHostUrl,
        adminId: data.adminId,
        isOpen: false, // Forcé à false par défaut pour les nouveaux espaces
        // Bug #2 — Persister l'année scolaire active envoyée par le frontend
        currentSchoolYear: data.currentSchoolYear ?? '2024-2025',
      },
    });

    // Création de la configuration de jeu par défaut pour la première année
    await this.prisma.gameConfig.create({
      data: {
        instanceId: instance.id,
        schoolYear: instance.currentSchoolYear,
        gameStartDate: data.gameStartDate,
        gameEndDate: data.gameEndDate,
        gamePeriodsCount: data.gamePeriodsCount ?? 24,
      }
    });


    // Génération initiale des périodes
    await this.syncPeriods(instance.id, instance.currentSchoolYear);

    return instance;
  }

  async findAll(userId?: number, role?: string, schoolYear?: string) {
    const where: any = {};
    if (role === 'AM' && userId) {
      where.adminId = userId;
    }

    const sy = schoolYear || "2024-2025";

    const instances = await this.prisma.instance.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          },
        },
        _count: {
          select: {
            teams: { where: { schoolYear: sy } },
            localActions: { where: { schoolYear: sy } },
            periods: { where: { schoolYear: sy } }
          }
        }
      },
    });

    const instanceIds = instances.map(i => i.id);

    // PERF-01 — Batch queries : 3 lots en parallèle au lieu de 3N requêtes séquentielles
    const [playersData, actionsData, impactsData] = await Promise.all([
      // Lot 1 : Nombre de joueurs par instance
      Promise.all(
        instanceIds.map(id =>
          this.prisma.child
            .count({ where: { group: { team: { instanceId: id, schoolYear: sy } } } })
            .then(count => ({ id, count }))
        )
      ),
      // Lot 2 : Nombre d'actions réalisées par instance
      Promise.all(
        instanceIds.map(id =>
          this.prisma.actionDone
            .count({
              where: {
                child: { group: { team: { instanceId: id, schoolYear: sy } } },
                period: { schoolYear: sy },
              },
            })
            .then(count => ({ id, count }))
        )
      ),
      // Lot 3 : Somme des impacts par instance
      Promise.all(
        instanceIds.map(id =>
          this.prisma.actionDone
            .aggregate({
              _sum: { savedCo2: true, savedWater: true, savedWaste: true },
              where: {
                child: { group: { team: { instanceId: id, schoolYear: sy } } },
                period: { schoolYear: sy },
              },
            })
            .then(agg => ({ id, agg }))
        )
      ),
    ]);

    const playersMap = new Map(playersData.map(d => [d.id, d.count]));
    const actionsMap = new Map(actionsData.map(d => [d.id, d.count]));
    const impactsMap = new Map(impactsData.map(d => [d.id, d.agg]));

    return instances.map((instance) => {
      const impactsAgg = impactsMap.get(instance.id);
      return {
        ...instance,
        playersCount: playersMap.get(instance.id) ?? 0,
        totalActionsDone: actionsMap.get(instance.id) ?? 0,
        totalImpacts: {
          co2: impactsAgg?._sum.savedCo2 || 0,
          water: impactsAgg?._sum.savedWater || 0,
          waste: impactsAgg?._sum.savedWaste || 0,
        },
      };
    });
  }

  async findOne(id: number) {
    const instance = await this.prisma.instance.findUnique({
      where: { id },
      include: {
        admin: true,
        teams: {
          include: {
            groups: {
              include: {
                _count: {
                  select: { children: true }
                }
              }
            }
          }
        },
        _count: {
          select: {
            teams: true,
            localActions: true
          }
        }
      },
    });

    if (!instance) {
      throw new NotFoundException(`Instance #${id} non trouvée`);
    }

    return instance;
  }

  async update(id: number, data: UpdateInstanceDto & { schoolYear?: string; force?: boolean }) {
    const { schoolYear, gameStartDate, gameEndDate, gamePeriodsCount, force, ...updateData } = data;

    const sy = schoolYear || (await this.prisma.instance.findUnique({ where: { id } }))?.currentSchoolYear || "2024-2025";

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.instance.update({
        where: { id },
        data: updateData,
      });

      // Mise à jour de la configuration de jeu si nécessaire
      if (gameStartDate !== undefined || gameEndDate !== undefined || gamePeriodsCount !== undefined) {
        await tx.gameConfig.upsert({
          where: { instanceId_schoolYear: { instanceId: id, schoolYear: sy } },
          update: {
            ...(gameStartDate && { gameStartDate: new Date(gameStartDate) }),
            ...(gameEndDate && { gameEndDate: new Date(gameEndDate) }),
            ...(gamePeriodsCount !== undefined && { gamePeriodsCount }),
          },
          create: {
            instanceId: id,
            schoolYear: sy,
            gameStartDate: gameStartDate ? new Date(gameStartDate) : undefined,
            gameEndDate: gameEndDate ? new Date(gameEndDate) : undefined,
            gamePeriodsCount: gamePeriodsCount ?? 24,
          }
        });
      }

      // Cascade fermeture (uniquement si demandé explicitement à false)
      if (data.isOpen === false) {
        await tx.period.updateMany({
          where: { instanceId: id, schoolYear: sy },
          data: { isOpen: false },
        });
      }

      if (gameStartDate !== undefined || gameEndDate !== undefined || gamePeriodsCount !== undefined) {
        await this.syncPeriods(id, sy, force, tx);
      }

      // Toujours forcer l'activation dynamique de la période courante à l'ouverture
      if (updated.isOpen === true) {
        await this.handleCurrentPeriodActivation(id, sy, tx);
      }

      return updated;
    });
  }

  private getPeriodBoundaries(date: Date): { startDate: Date; endDate: Date } {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    let diffToWednesday = day - 3;
    if (diffToWednesday < 0) {
      diffToWednesday += 7;
    }

    const startDate = new Date(d.getTime() - diffToWednesday * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  private async handleCurrentPeriodActivation(instanceId: number, schoolYear: string, tx?: any) {
    const client = tx || this.prisma;
    const now = new Date();
    const instance = await client.instance.findUnique({ where: { id: instanceId } });
    if (!instance) return;

    const boundaries = this.getPeriodBoundaries(now);

    // Recherche de la période active dans l'année scolaire demandée
    const period = await client.period.findFirst({
      where: {
        instanceId,
        schoolYear,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (period) {
      await client.period.updateMany({
        where: { instanceId, schoolYear, isOpen: true },
        data: { isOpen: false },
      });
      await client.period.update({
        where: { id: period.id },
        data: { isOpen: true },
      });
    }
  }


  private async syncPeriods(instanceId: number, schoolYear: string, force: boolean = false, tx?: any) {
    const client = tx || this.prisma;
    const config = await client.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } }
    });

    if (!config || !config.gameStartDate || !config.gameEndDate) return;

    const gameStart = new Date(config.gameStartDate);
    const gameEnd = new Date(config.gameEndDate);

    const currentPeriods = await client.period.findMany({
      where: { instanceId, schoolYear },
      orderBy: { startDate: 'asc' },
    });

    const firstBoundaries = this.getPeriodBoundaries(gameStart);
    let pStart = firstBoundaries.startDate;
    let pEnd = firstBoundaries.endDate;

    const generatedPeriods: { startDate: Date; endDate: Date }[] = [];

    while (pStart <= gameEnd) {
      generatedPeriods.push({ startDate: new Date(pStart), endDate: new Date(pEnd) });
      pStart = new Date(pStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      pStart.setHours(0, 0, 0, 0);
      pEnd = new Date(pStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      pEnd.setHours(23, 59, 59, 999);
    }

    // --- VALIDATION AVANT TOUTE MUTATION ---
    if (currentPeriods.length > generatedPeriods.length) {
      const toDelete = currentPeriods.slice(generatedPeriods.length);
      const periodIdsToDelete = toDelete.map((p: { id: number }) => p.id);
      const affectedActions = await client.actionDone.count({
        where: { periodId: { in: periodIdsToDelete } }
      });

      if (affectedActions > 0 && !force) {
        throw new ConflictException(JSON.stringify({
          warning: true,
          affectedActions,
          message: `Ce changement de dates supprimera ${affectedActions} actions enregistrées par les élèves. Voulez-vous continuer ?`
        }));
      }

      // Suppression effective
      for (const p of toDelete) {
        await client.actionDone.deleteMany({ where: { periodId: p.id } });
        await client.period.delete({ where: { id: p.id } });
      }
    }

    // --- MISE À JOUR / CRÉATION ---
    for (let i = 0; i < generatedPeriods.length; i++) {
      const p = generatedPeriods[i];
      if (currentPeriods[i]) {
        await client.period.update({
          where: { id: currentPeriods[i].id },
          data: { startDate: p.startDate, endDate: p.endDate },
        });
      } else {
        await client.period.create({
          data: { instanceId, schoolYear, startDate: p.startDate, endDate: p.endDate, isOpen: false },
        });
      }
    }
  }


  async remove(id: number) {
    await this.findOne(id);

    // Suppression en cascade via transaction pour garantir l'intégrité
    return this.prisma.$transaction(async (tx) => {
      // 1. ActionsDone (dépendent de LocalAction qui dépend de Instance)
      await tx.actionDone.deleteMany({
        where: { localAction: { instanceId: id } }
      });

      // 2. Children (dépendent de Group)
      await tx.child.deleteMany({
        where: { group: { team: { instanceId: id } } }
      });

      // 3. Groups (dépendent de Team)
      await tx.group.deleteMany({
        where: { team: { instanceId: id } }
      });

      // 4. Teams
      await tx.team.deleteMany({
        where: { instanceId: id }
      });

      // 5. LocalActions
      await tx.localAction.deleteMany({
        where: { instanceId: id }
      });

      // 6. Periods
      await tx.period.deleteMany({
        where: { instanceId: id }
      });

      // 7. L'Instance elle-même
      return tx.instance.delete({
        where: { id }
      });
    });
  }
}
