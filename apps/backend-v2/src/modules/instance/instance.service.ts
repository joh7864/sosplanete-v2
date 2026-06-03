import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { PeriodService } from '../period/period.service';
import { InstanceCleanupService } from './instance-cleanup.service';

@Injectable()
export class InstanceService {
  constructor(
    private prisma: PrismaService,
    private periodService: PeriodService,
    private cleanupService: InstanceCleanupService,
  ) {}

  async searchByName(name: string) {
    if (!name || name.trim().length < 2) return [];
    return this.prisma.instance.findMany({
      where: {
        schoolName: {
          contains: name.trim(),
          mode: 'insensitive'
        }
      },
      include: {
        instanceYears: {
          orderBy: { schoolYear: 'desc' },
          take: 1
        }
      },
      take: 10
    });
  }

  async create(data: CreateInstanceDto) {
    const sanitizedHostUrl = data.hostUrl?.trim() || null;
    const schoolYear = data.currentSchoolYear ?? '2024-2025';

    const gameStartDate = data.gameStartDate ? new Date(data.gameStartDate) : undefined;
    const gameEndDate   = data.gameEndDate   ? new Date(data.gameEndDate)   : undefined;

    return this.prisma.$transaction(async (tx) => {
      let instance;

      // 1. Récupérer ou Créer l'Instance Ancre
      if (data.instanceId) {
        instance = await tx.instance.findUnique({ where: { id: data.instanceId } });
        if (!instance) throw new NotFoundException('Instance non trouvée');
      } else {
        if (!data.schoolName) throw new ConflictException('Le nom de l\'école est obligatoire pour une nouvelle instance');
        instance = await tx.instance.create({
          data: {
            schoolName: data.schoolName,
            adminId: data.adminId, // Gardé comme propriétaire historique
          },
        });
      }

      // 2. Créer l'InstanceYear pour l'année active
      // Vérifier si elle existe déjà
      let instanceYear = await tx.instanceYear.findUnique({
        where: {
          instanceId_schoolYear: {
            instanceId: instance.id,
            schoolYear
          }
        }
      });

      if (instanceYear) {
        // Si elle existe, on met juste à jour l'URL et l'icône si fournis
        instanceYear = await tx.instanceYear.update({
          where: { id: instanceYear.id },
          data: {
            hostUrl: sanitizedHostUrl !== null ? sanitizedHostUrl : undefined,
            icon: data.icon !== undefined ? data.icon : undefined,
            adminId: data.adminId,
          }
        });
      } else {
        instanceYear = await tx.instanceYear.create({
          data: {
            instanceId: instance.id,
            schoolYear,
            hostUrl: sanitizedHostUrl,
            icon: data.icon ?? null,
            isOpen: false,
            gameStartDate,
            gameEndDate,
            gamePeriodsCount: data.gamePeriodsCount ?? 24,
            adminId: data.adminId,
          },
        });

        // 3. Création de la configuration de jeu par défaut
        await tx.gameConfig.create({
          data: {
            instanceId: instance.id,
            schoolYear,
            gameStartDate,
            gameEndDate,
            gamePeriodsCount: data.gamePeriodsCount ?? 24,
          },
        });

        // 4. Génération initiale des périodes
        await this.periodService.syncPeriods(instance.id, instanceYear.id, schoolYear, false, tx);

        // 5. Ouverture automatique de la période courante
        await this.periodService.handleCurrentPeriodActivation(instanceYear.id, tx);
      }

      return { ...instance, instanceYear };
    });
  }

  async findAll(userId?: number, role?: string, schoolYear?: string) {
    const where: any = {};
    const sy = schoolYear || '2024-2025';

    if (role === 'AM' && userId) {
      where.instanceYears = {
        some: { adminId: userId }
      };
    }

    if (sy !== 'all') {
      where.instanceYears = {
        ...(where.instanceYears || {}),
        some: { ...(where.instanceYears?.some || {}), schoolYear: sy }
      };
    }

    const instances = await this.prisma.instance.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        admin: {
          select: { id: true, email: true, name: true, avatar: true },
        },
        instanceYears: {
          ...(sy !== 'all' ? { where: { schoolYear: sy } } : {}),
          select: {
            id: true,
            schoolYear: true,
            hostUrl: true,
            icon: true,
            adminId: true,
            isOpen: true,
            gameStartDate: true,
            gameEndDate: true,
            gamePeriodsCount: true,
            unlockedChapters: true,
            _count: {
              select: { teams: true, periods: true },
            },
            admin: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { localActions: { where: { schoolYear: sy } } },
        },
      },
    });

    const instanceIds = instances.map(i => i.id);

    const [playersData, actionsData, impactsData] = await Promise.all([
      Promise.all(
        instanceIds.map(id =>
          this.prisma.child
            .count({ where: { group: { team: { instanceYear: { instanceId: id, schoolYear: sy } } } } })
            .then(count => ({ id, count }))
        )
      ),
      Promise.all(
        instanceIds.map(id =>
          this.prisma.actionDone
            .count({
              where: {
                child: { group: { team: { instanceYear: { instanceId: id, schoolYear: sy } } } },
                period: { instanceYear: { instanceId: id, schoolYear: sy } },
              },
            })
            .then(count => ({ id, count }))
        )
      ),
      Promise.all(
        instanceIds.map(id =>
          this.prisma.actionDone
            .aggregate({
              _sum: { savedCo2: true, savedWater: true, savedWaste: true },
              where: {
                child: { group: { team: { instanceYear: { instanceId: id, schoolYear: sy } } } },
                period: { instanceYear: { instanceId: id, schoolYear: sy } },
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
      const iy = instance.instanceYears?.[0] ?? null;
      const impactsAgg = impactsMap.get(instance.id);
      return {
        ...instance,
        // Champs de jeu et identité surfacés depuis instanceYear pour rétrocompatibilité frontend
        hostUrl: iy?.hostUrl ?? null,
        icon: iy?.icon ?? null,
        isOpen: iy?.isOpen ?? false,
        gameStartDate: iy?.gameStartDate ?? null,
        gameEndDate: iy?.gameEndDate ?? null,
        gamePeriodsCount: iy?.gamePeriodsCount ?? 24,
        currentSchoolYear: iy?.schoolYear ?? sy,
        instanceYearId: iy?.id ?? null,
        adminId: iy?.adminId ?? instance.adminId ?? null,
        unlockedChapters: iy?.unlockedChapters ?? 0,
        teamsCount: iy?._count?.teams ?? 0,
        playersCount: playersMap.get(instance.id) ?? 0,
        totalActionsDone: actionsMap.get(instance.id) ?? 0,
        totalImpacts: {
          co2:   impactsAgg?._sum.savedCo2  || 0,
          water: impactsAgg?._sum.savedWater || 0,
          waste: impactsAgg?._sum.savedWaste || 0,
        },
      };
    });
  }

  async findOne(id: number, schoolYear?: string) {
    const sy = schoolYear || '2024-2025';
    const instance = await this.prisma.instance.findUnique({
      where: { id },
      include: {
        admin: true,
        instanceYears: {
          where: { schoolYear: sy },
          include: {
            teams: {
              include: {
                groups: { include: { _count: { select: { children: true } } } },
              },
            },
          },
        },
        _count: {
          select: { localActions: true },
        },
      },
    });

    if (!instance) throw new NotFoundException(`Instance #${id} non trouvée`);
    
    const iy = instance.instanceYears?.[0] ?? null;
    return {
      ...instance,
      hostUrl: iy?.hostUrl ?? null,
      icon: iy?.icon ?? null,
      adminId: iy?.adminId ?? instance.adminId ?? null,
      unlockedChapters: iy?.unlockedChapters ?? 0,
      isOpen: iy?.isOpen ?? false,
    };
  }

  async update(id: number, data: UpdateInstanceDto & { schoolYear?: string; force?: boolean }) {
    const { schoolYear, currentSchoolYear, gameStartDate, gameEndDate, gamePeriodsCount, isOpen, force, hostUrl, icon, adminId, unlockedChapters, instanceId: _instanceId, ...updateData } = data as any;

    const sy = schoolYear || '2024-2025';

    // Rendre adminId à l'instance principale seulement si PAS de schoolYear spécifié (fix isolation annuelle)
    if (adminId !== undefined && !data.schoolYear) {
      updateData.adminId = adminId;
    }

    return this.prisma.$transaction(async (tx) => {
      // Mise à jour de l'Instance (champs non-jeu uniquement + adminId)
      const updated = await tx.instance.update({ where: { id }, data: updateData });

      // Résolution de l'InstanceYear — PAS d'auto-création (fix C013IY)
      let instanceYear = await tx.instanceYear.findUnique({
        where: { instanceId_schoolYear: { instanceId: id, schoolYear: sy } },
      });

      // Si l'InstanceYear n'existe pas, on ne la crée PAS.
      // On ne met à jour que les champs de l'Instance (ex: adminId, schoolName).
      if (!instanceYear) {
        return updated;
      }

      // Mise à jour des paramètres de jeu sur instanceYear
      const iyUpdate: any = {};
      if (isOpen !== undefined)           iyUpdate.isOpen           = isOpen;
      if (gameStartDate !== undefined)    iyUpdate.gameStartDate    = new Date(gameStartDate);
      if (gameEndDate !== undefined)      iyUpdate.gameEndDate      = new Date(gameEndDate);
      if (gamePeriodsCount !== undefined) iyUpdate.gamePeriodsCount = gamePeriodsCount;
      if (hostUrl !== undefined)          iyUpdate.hostUrl          = hostUrl;
      if (icon !== undefined)             iyUpdate.icon             = icon;
      if (adminId !== undefined)          iyUpdate.adminId          = adminId;
      if (unlockedChapters !== undefined) iyUpdate.unlockedChapters = unlockedChapters;

      if (Object.keys(iyUpdate).length > 0) {
        instanceYear = await tx.instanceYear.update({
          where: { id: instanceYear.id },
          data: iyUpdate,
        });
      }

      // Mise à jour de la GameConfig si nécessaire
      if (gameStartDate !== undefined || gameEndDate !== undefined || gamePeriodsCount !== undefined) {
        await tx.gameConfig.upsert({
          where: { instanceId_schoolYear: { instanceId: id, schoolYear: sy } },
          update: {
            ...(gameStartDate && { gameStartDate: new Date(gameStartDate) }),
            ...(gameEndDate   && { gameEndDate:   new Date(gameEndDate) }),
            ...(gamePeriodsCount !== undefined && { gamePeriodsCount }),
          },
          create: {
            instanceId: id,
            schoolYear: sy,
            gameStartDate: gameStartDate ? new Date(gameStartDate) : undefined,
            gameEndDate:   gameEndDate   ? new Date(gameEndDate)   : undefined,
            gamePeriodsCount: gamePeriodsCount ?? 24,
          },
        });

        await this.periodService.syncPeriods(id, instanceYear.id, sy, force, tx);
      }

      // Cascade fermeture des périodes si on ferme l'espace
      if (isOpen === false) {
        await tx.period.updateMany({
          where: { instanceYearId: instanceYear.id },
          data:  { isOpen: false },
        });
      }

      // Activation dynamique de la période courante à l'ouverture
      if (isOpen === true) {
        await this.periodService.handleCurrentPeriodActivation(instanceYear.id, tx);
      }

      return { ...updated, instanceYear };
    }, { timeout: 30000 });
  }

  // ----------------------------------------------------------------
  // Méthode publique : résoudre l'instanceYearId depuis instanceId + schoolYear
  // ----------------------------------------------------------------
  async resolveInstanceYearId(instanceId: number, schoolYear: string): Promise<number> {
    const iy = await this.prisma.instanceYear.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });
    if (!iy) throw new NotFoundException(`Aucune InstanceYear trouvée pour l'instance ${instanceId} et l'année ${schoolYear}`);
    return iy.id;
  }

  // ----------------------------------------------------------------
  // Suppression de l'InstanceYear d'une année (soft delete) - Déléguée
  // ----------------------------------------------------------------
  async removeYear(instanceId: number, schoolYear: string) {
    return this.cleanupService.removeYear(instanceId, schoolYear);
  }

  // ----------------------------------------------------------------
  // Suppression complète de l'Instance (toutes années) - Déléguée
  // ----------------------------------------------------------------
  async remove(id: number) {
    return this.cleanupService.remove(id);
  }
}
