import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function getStartYear(yearStr: string): number {
  const match = yearStr.match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : new Date().getFullYear();
}

function shiftDateByYears(
  date: Date | null | undefined,
  offset: number,
): Date | null {
  if (!date) return null;
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + offset);
  return newDate;
}

import { PeriodService } from '../period/period.service';

@Injectable()
export class YearService {
  constructor(
    private prisma: PrismaService,
    private periodService: PeriodService,
  ) {}

  /**
   * Initialise une nouvelle année scolaire pour une instance.
   * Crée une InstanceYear, puis clone la configuration (Teams, Groups, Children, LocalActions, Categories).
   */
  async initializeYear(
    instanceId: number,
    targetYear: string,
    currentUser?: any,
  ) {
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
      await this.prisma.instanceYear.create({
        data: { instanceId, schoolYear: targetYear },
      });
      await this.triggerYearInitializationNotifications(
        instanceId,
        targetYear,
        currentUser,
      );
      return { message: 'Nouvelle InstanceYear créée (sans clonage)' };
    }

    const fromYear = lastIy.schoolYear;
    if (fromYear === targetYear) return { message: 'Même année' };

    console.log(
      `[YearService] Cloning from ${fromYear} to ${targetYear} for instance ${instanceId}`,
    );

    const fromStartYear = getStartYear(fromYear);
    const toStartYear = getStartYear(targetYear);
    const yearOffset = toStartYear - fromStartYear;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Nettoyage préalable idempotent de tout reliquat éventuel sur l'année cible
      await tx.localAction.deleteMany({
        where: { instanceId, schoolYear: targetYear },
      });
      await tx.gameConfig.deleteMany({
        where: { instanceId, schoolYear: targetYear },
      });
      const existingIy = await tx.instanceYear.findUnique({
        where: {
          instanceId_schoolYear: { instanceId, schoolYear: targetYear },
        },
      });
      if (existingIy) {
        await tx.child.deleteMany({
          where: { group: { team: { instanceYearId: existingIy.id } } },
        });
        await tx.group.deleteMany({
          where: { team: { instanceYearId: existingIy.id } },
        });
        await tx.team.deleteMany({
          where: { instanceYearId: existingIy.id },
        });
        await tx.category.deleteMany({
          where: { instanceYearId: existingIy.id },
        });
        await tx.period.deleteMany({
          where: { instanceYearId: existingIy.id },
        });
        await tx.instanceYear.delete({
          where: { id: existingIy.id },
        });
      }

      // Créer la nouvelle InstanceYear (hérite de la config de jeu)
      const newIy = await tx.instanceYear.create({
        data: {
          instanceId,
          schoolYear: targetYear,
          hostUrl: lastIy.hostUrl,
          icon: lastIy.icon,
          isOpen: lastIy.isOpen,
          gameStartDate: shiftDateByYears(lastIy.gameStartDate, yearOffset),
          gameEndDate: shiftDateByYears(lastIy.gameEndDate, yearOffset),
          gamePeriodsCount: lastIy.gamePeriodsCount,
          adminId: lastIy.adminId,
        },
      });

      // --- A. CLONAGE DES CATEGORIES ---
      const categories = await tx.category.findMany({
        where: { instanceYearId: lastIy.id },
      });
      const categoryMap = new Map<number, number>();
      for (const cat of categories) {
        const newCat = await tx.category.create({
          data: {
            name: cat.name,
            icon: cat.icon,
            order: cat.order,
            instanceYearId: newIy.id,
          },
        });
        categoryMap.set(cat.id, newCat.id);
      }

      // --- B. CLONAGE DES TEAMS, GROUPS & CHILDREN ---
      const teams = await tx.team.findMany({
        where: { instanceYearId: lastIy.id },
        include: { groups: { include: { children: true } } },
      });

      for (const team of teams) {
        const newTeam = await tx.team.create({
          data: {
            name: team.name,
            color: team.color,
            icon: team.icon,
            instanceYearId: newIy.id,
          },
        });

        for (const group of team.groups) {
          const newGroup = await tx.group.create({
            data: { name: group.name, color: group.color, teamId: newTeam.id },
          });
          for (const child of group.children) {
            await tx.child.create({
              data: {
                pseudo: child.pseudo,
                password: child.password,
                avatar: child.avatar,
                groupId: newGroup.id,
              },
            });
          }
        }
      }

      // --- C. CLONAGE DU CATALOGUE (LOCAL ACTIONS & ÉVOÉ MISSIONS) ---
      const localActions = await tx.localAction.findMany({
        where: { instanceId, schoolYear: fromYear },
        include: { evoeMission: true },
      });
      const seenActionRefIds = new Set<number>();
      for (const action of localActions) {
        if (seenActionRefIds.has(action.actionRefId)) continue;
        seenActionRefIds.add(action.actionRefId);

        const newLocalAction = await tx.localAction.create({
          data: {
            label: action.label,
            description: action.description,
            image: action.image, // Icône & image SOS Planète Legacy
            imageEvoe: action.imageEvoe, // Icône & image Évoé
            instanceId: action.instanceId,
            actionRefId: action.actionRefId,
            schoolYear: targetYear,
            categoryId: action.categoryId
              ? (categoryMap.get(action.categoryId) ?? null)
              : null,
            specificCo2: action.specificCo2,
            specificWater: action.specificWater,
            specificWaste: action.specificWaste,
            specificEnergy: action.specificEnergy,
          },
        });

        // Clonage des missions et narrations de science-fiction Évoé associées
        if (action.evoeMission) {
          await tx.evoeMissionTranslation.create({
            data: {
              localActionId: newLocalAction.id,
              titreSF: action.evoeMission.titreSF,
              descriptionSF: action.evoeMission.descriptionSF,
              pointsGagnes: action.evoeMission.pointsGagnes,
              isHacked: action.evoeMission.isHacked,
              imageOverride: action.evoeMission.imageOverride,
            },
          });
        }
      }

      // --- D. CLONAGE DE LA GAMECONFIG ---
      const gameConfig = await tx.gameConfig.findUnique({
        where: { instanceId_schoolYear: { instanceId, schoolYear: fromYear } },
      });
      if (gameConfig) {
        await tx.gameConfig.create({
          data: {
            instanceId,
            schoolYear: targetYear,
            avgActionsPerChildPerPeriod: gameConfig.avgActionsPerChildPerPeriod,
            animalAdvanceMargin: gameConfig.animalAdvanceMargin,
            bienveillanceThreshold: gameConfig.bienveillanceThreshold,
            gameStartDate: shiftDateByYears(
              gameConfig.gameStartDate,
              yearOffset,
            ),
            gameEndDate: shiftDateByYears(gameConfig.gameEndDate, yearOffset),
            gamePeriodsCount: gameConfig.gamePeriodsCount,
          },
        });
      }

      return { success: true, fromYear, targetYear, instanceYearId: newIy.id };
    });

    await this.triggerYearInitializationNotifications(
      instanceId,
      targetYear,
      currentUser,
    );
    return result;
  }

  async triggerYearInitializationNotifications(
    instanceId: number,
    targetYear: string,
    currentUser?: any,
  ) {
    if (!currentUser) return;
    try {
      const yearInt = parseInt(targetYear.split('-')[0], 10);
      const annualData = await this.prisma.annualImpactData.findUnique({
        where: { year: yearInt },
      });
      const isCustomized = annualData ? annualData.isCustomized : false;

      // Seulement si l'utilisateur est un AM et que les constantes ne sont pas personnalisées
      if (!isCustomized && currentUser.role === 'AM') {
        const instance = await this.prisma.instance.findUnique({
          where: { id: instanceId },
          include: { admin: true },
        });
        const schoolName = instance?.schoolName ?? `Espace #${instanceId}`;

        const amUser = await this.prisma.user.findUnique({
          where: { id: currentUser.userId },
        });
        const amName =
          amUser?.name || amUser?.email || currentUser.email || 'un animateur';

        // 1. Trouver les administrateurs AS
        const asUsers = await this.prisma.user.findMany({
          where: { role: 'AS' },
        });

        const titleAS = `Demande d'initialisation des paramètres globaux - ${targetYear}`;
        const contentAS = `L'animateur ${amName} demande l'initialisation des paramètres mondiaux pour l'année ${targetYear} pour son espace ${schoolName}.`;

        for (const asUser of asUsers) {
          const exists = await this.prisma.notification.findFirst({
            where: {
              recipientId: asUser.id,
              status: 'PENDING',
              content: contentAS,
            },
          });
          if (!exists) {
            await this.prisma.notification.create({
              data: {
                senderId: currentUser.userId,
                recipientId: asUser.id,
                title: titleAS,
                content: contentAS,
                status: 'PENDING',
                isRead: false,
              },
            });
          }
        }

        // 2. Notification de confirmation pour l'AM
        const titleAM = `Demande transmise - ${targetYear}`;
        const contentAM = `Votre demande d'initialisation des paramètres mondiaux pour l'année ${targetYear} a bien été transmise à l'Administrateur du Référentiel. Elle est actuellement en attente de traitement.`;

        const existsAM = await this.prisma.notification.findFirst({
          where: {
            recipientId: currentUser.userId,
            status: 'PENDING',
            content: contentAM,
          },
        });
        if (!existsAM) {
          const systemSenderId = asUsers[0]?.id || currentUser.userId;
          await this.prisma.notification.create({
            data: {
              senderId: systemSenderId,
              recipientId: currentUser.userId,
              title: titleAM,
              content: contentAM,
              status: 'PENDING',
              isRead: false,
            },
          });
        }
      }
    } catch (err) {
      console.error(`[YearService] Error triggering notifications:`, err);
    }
  }

  /**
   * Résout une InstanceYear depuis (instanceId, schoolYear).
   * Crée l'InstanceYear si elle n'existe pas encore (first-time access).
   */
  async resolveInstanceYear(instanceId: number, schoolYear: string) {
    const iy = await this.prisma.instanceYear.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
      select: { id: true, instanceId: true, schoolYear: true, isOpen: true },
    });
    // PAS d'auto-création (fix C013IY) — retourne null si inexistant
    return iy;
  }

  /**
   * Duplique les catégories, équipes (avec groupes et optionnellement les élèves), catalogue d'actions locales et GameConfig
   * d'une année source vers une année cible existante vide pour une instance donnée.
   */
  async duplicateYear(
    instanceId: number,
    fromYear: string,
    toYear: string,
    currentUser?: any,
    options?: { cloneChildren?: boolean },
  ) {
    const shouldCloneChildren = options?.cloneChildren !== false;

    if (fromYear === toYear) {
      throw new BadRequestException(
        "L'année source et l'année cible doivent être différentes",
      );
    }

    // 1. Vérifier la source
    const fromIy = await this.prisma.instanceYear.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear: fromYear } },
    });
    if (!fromIy) {
      throw new NotFoundException(
        `Année source ${fromYear} non trouvée pour cet établissement`,
      );
    }

    console.log(
      `[YearService] Creating and duplicating space from ${fromYear} to ${toYear} for instance ${instanceId} (cloneChildren: ${shouldCloneChildren})`,
    );

    const fromStartYear = getStartYear(fromYear);
    const toStartYear = getStartYear(toYear);
    const yearOffset = toStartYear - fromStartYear;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Nettoyage préalable idempotent de tout reliquat éventuel sur l'année cible
      await tx.localAction.deleteMany({
        where: { instanceId, schoolYear: toYear },
      });
      await tx.gameConfig.deleteMany({
        where: { instanceId, schoolYear: toYear },
      });
      const existingIy = await tx.instanceYear.findUnique({
        where: { instanceId_schoolYear: { instanceId, schoolYear: toYear } },
      });
      if (existingIy) {
        await tx.child.deleteMany({
          where: { group: { team: { instanceYearId: existingIy.id } } },
        });
        await tx.group.deleteMany({
          where: { team: { instanceYearId: existingIy.id } },
        });
        await tx.team.deleteMany({
          where: { instanceYearId: existingIy.id },
        });
        await tx.category.deleteMany({
          where: { instanceYearId: existingIy.id },
        });
        await tx.period.deleteMany({
          where: { instanceYearId: existingIy.id },
        });
        await tx.instanceYear.delete({
          where: { id: existingIy.id },
        });
      }

      // --- CREATION DE LA NOUVELLE INSTANCEYEAR CIBLE (Copie des paramètres généraux) ---
      const newIy = await tx.instanceYear.create({
        data: {
          instanceId,
          schoolYear: toYear,
          hostUrl: fromIy.hostUrl,
          icon: fromIy.icon,
          isOpen: false, // Toujours fermé / brouillon par défaut
          gameStartDate: shiftDateByYears(fromIy.gameStartDate, yearOffset),
          gameEndDate: shiftDateByYears(fromIy.gameEndDate, yearOffset),
          gamePeriodsCount: fromIy.gamePeriodsCount,
          adminId: fromIy.adminId,
        },
      });

      // --- A. CLONAGE DES CATEGORIES ---
      const categories = await tx.category.findMany({
        where: { instanceYearId: fromIy.id },
      });
      const categoryMap = new Map<number, number>();
      for (const cat of categories) {
        const newCat = await tx.category.create({
          data: {
            name: cat.name,
            icon: cat.icon,
            order: cat.order,
            instanceYearId: newIy.id,
          },
        });
        categoryMap.set(cat.id, newCat.id);
      }

      // --- B. CLONAGE DES TEAMS, GROUPS & (OPTIONNELLEMENT) CHILDREN ---
      const teams = await tx.team.findMany({
        where: { instanceYearId: fromIy.id },
        include: { groups: { include: { children: true } } },
      });

      for (const team of teams) {
        const newTeam = await tx.team.create({
          data: {
            name: team.name,
            color: team.color,
            icon: team.icon,
            instanceYearId: newIy.id,
          },
        });

        for (const group of team.groups) {
          const newGroup = await tx.group.create({
            data: { name: group.name, color: group.color, teamId: newTeam.id },
          });

          if (shouldCloneChildren) {
            for (const child of group.children) {
              await tx.child.create({
                data: {
                  pseudo: child.pseudo,
                  password: child.password,
                  avatar: child.avatar,
                  isDelegate: child.isDelegate,
                  groupId: newGroup.id,
                },
              });
            }
          }
        }
      }

      // --- C. CLONAGE DU CATALOGUE (LOCAL ACTIONS & ÉVOÉ MISSIONS) ---
      const localActions = await tx.localAction.findMany({
        where: { instanceId, schoolYear: fromYear },
        include: { evoeMission: true },
      });
      const seenActionRefIds = new Set<number>();
      for (const action of localActions) {
        if (seenActionRefIds.has(action.actionRefId)) continue;
        seenActionRefIds.add(action.actionRefId);

        const newLocalAction = await tx.localAction.create({
          data: {
            label: action.label,
            description: action.description,
            image: action.image, // Icône & image SOS Planète Legacy
            imageEvoe: action.imageEvoe, // Icône & image Évoé
            instanceId: action.instanceId,
            actionRefId: action.actionRefId,
            schoolYear: toYear,
            categoryId: action.categoryId
              ? (categoryMap.get(action.categoryId) ?? null)
              : null,
            specificCo2: action.specificCo2,
            specificWater: action.specificWater,
            specificWaste: action.specificWaste,
            specificEnergy: action.specificEnergy,
          },
        });

        // Clonage des missions SF Évoé
        if (action.evoeMission) {
          await tx.evoeMissionTranslation.create({
            data: {
              localActionId: newLocalAction.id,
              titreSF: action.evoeMission.titreSF,
              descriptionSF: action.evoeMission.descriptionSF,
              pointsGagnes: action.evoeMission.pointsGagnes,
              isHacked: action.evoeMission.isHacked,
              imageOverride: action.evoeMission.imageOverride,
            },
          });
        }
      }

      // --- D. CLONAGE/UPSERT DE LA GAMECONFIG ---
      const gameConfig = await tx.gameConfig.findUnique({
        where: { instanceId_schoolYear: { instanceId, schoolYear: fromYear } },
      });
      if (gameConfig) {
        await tx.gameConfig.upsert({
          where: { instanceId_schoolYear: { instanceId, schoolYear: toYear } },
          update: {
            avgActionsPerChildPerPeriod: gameConfig.avgActionsPerChildPerPeriod,
            animalAdvanceMargin: gameConfig.animalAdvanceMargin,
            bienveillanceThreshold: gameConfig.bienveillanceThreshold,
            gameStartDate: shiftDateByYears(
              gameConfig.gameStartDate,
              yearOffset,
            ),
            gameEndDate: shiftDateByYears(gameConfig.gameEndDate, yearOffset),
            gamePeriodsCount: gameConfig.gamePeriodsCount,
          },
          create: {
            instanceId,
            schoolYear: toYear,
            avgActionsPerChildPerPeriod: gameConfig.avgActionsPerChildPerPeriod,
            animalAdvanceMargin: gameConfig.animalAdvanceMargin,
            bienveillanceThreshold: gameConfig.bienveillanceThreshold,
            gameStartDate: shiftDateByYears(
              gameConfig.gameStartDate,
              yearOffset,
            ),
            gameEndDate: shiftDateByYears(gameConfig.gameEndDate, yearOffset),
            gamePeriodsCount: gameConfig.gamePeriodsCount,
          },
        });
      }

      // --- E. GENERATION ET SYNCHRONISATION DES PERIODES ---
      await this.periodService.syncPeriods(
        instanceId,
        newIy.id,
        toYear,
        false,
        tx,
      );

      // --- F. GESTION DE LA PERIODE COURANTE ---
      await this.periodService.handleCurrentPeriodActivation(newIy.id, tx);

      return { success: true, fromYear, toYear, instanceYearId: newIy.id };
    });

    // 3. Garantir l'existence d'AnnualImpactData pour la cible
    try {
      const yearInt = parseInt(toYear.split('-')[0], 10);
      const existingAid = await this.prisma.annualImpactData.findUnique({
        where: { year: yearInt },
      });
      if (!existingAid) {
        const mostRecent = await this.prisma.annualImpactData.findFirst({
          orderBy: { year: 'desc' },
        });
        await this.prisma.annualImpactData.create({
          data: {
            year: yearInt,
            dActuel: mostRecent?.dActuel ?? 214,
            moyCo2Monde: mostRecent?.moyCo2Monde ?? 4.7,
            moyEauMonde: mostRecent?.moyEauMonde ?? 1385000,
            moyDechetsMonde: mostRecent?.moyDechetsMonde ?? 270,
            popMonde: mostRecent?.popMonde ?? 8.1,
            assiduityWeight: mostRecent?.assiduityWeight ?? 0.0,
            annualMultiplierWeight: mostRecent?.annualMultiplierWeight ?? 1.0,
            difficultyFactor: mostRecent?.difficultyFactor ?? 2.0,
            worldProjectionMultiplier:
              mostRecent?.worldProjectionMultiplier ?? 1.0,
            isCustomized: false,
          },
        });
      }
    } catch (e) {
      console.warn(
        `[duplicateYear] Note: AnnualImpactData initialization check failed:`,
        e,
      );
    }

    await this.triggerYearInitializationNotifications(
      instanceId,
      toYear,
      currentUser,
    );

    return result;
  }
}
