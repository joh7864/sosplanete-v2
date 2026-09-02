import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { ImpactService } from '../impact/impact.service';
import { AnimalUnlockService } from '../stimulation/animal-unlock.service';
import { TrackingService } from '../tracking/tracking.service';
import { EcoBarRaceService } from '../stimulation/eco-bar-race.service';
import { WhatsAppService } from '../stimulation/whatsapp.service';
import { ChatGateway } from '../stimulation/chat.gateway';

const isValidImageFilename = (s: string | null | undefined): boolean => {
  if (!s) return false;
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(s);
};

const getCurrentSchoolYear = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11 (Jan-Dec)
  if (month >= 8) {
    // September to December
    return `${year}-${year + 1}`;
  } else {
    // January to August
    return `${year - 1}-${year}`;
  }
};

@Injectable()
export class LegacyApiService {
  private readonly logger = new Logger(LegacyApiService.name);

  constructor(
    private prisma: PrismaService,
    private impactService: ImpactService,
    private animalUnlockService: AnimalUnlockService,
    private trackingService: TrackingService,
    private ecoBarRaceService: EcoBarRaceService,
    private whatsAppService?: WhatsAppService,
    private chatGateway?: ChatGateway,
  ) {}

  async checkAuthChild(pseudo: string, pass: string) {
    const children = await this.prisma.child.findMany({
      where: { pseudo },
      include: {
        group: {
          include: {
            team: {
              include: { instanceYear: { include: { instance: true } } },
            },
          },
        },
      },
    });

    if (children.length === 0)
      throw new UnauthorizedException('Enfant introuvable ou pseudo invalide');

    const validChildren = [];
    for (const child of children) {
      let isValid = false;
      if (child.password) {
        isValid = await bcrypt.compare(pass, child.password);
        if (!isValid) {
          const isLikelyBcrypt =
            child.password.startsWith('$2b$') ||
            child.password.startsWith('$2a$');
          if (!isLikelyBcrypt && pass === child.password) {
            const upgraded = await bcrypt.hash(pass, 10);
            await this.prisma.child.update({
              where: { id: child.id },
              data: { password: upgraded },
            });
            isValid = true;
          }
        }
      } else {
        isValid = pass === '' || pass === child.pseudo;
      }
      if (isValid) validChildren.push(child);
    }

    if (validChildren.length === 0)
      throw new UnauthorizedException('Mot de passe incorrect');

    // Priorité aux instances ouvertes (isOpen: true)
    let activeChildren = validChildren.filter(
      (c) => c.group.team.instanceYear.isOpen,
    );
    if (activeChildren.length === 0) {
      activeChildren = validChildren;
    }

    const currentSchoolYear = getCurrentSchoolYear();
    let currentYearChildren = activeChildren.filter(
      (c) => c.group.team.instanceYear.schoolYear === currentSchoolYear,
    );

    if (currentYearChildren.length === 0) {
      // Fallback : Si l'année courante n'est pas encore enregistrée en DB,
      // retenir la dernière année scolaire active où l'élève est inscrit.
      currentYearChildren = [...activeChildren].sort(
        (a, b) => b.group.team.instanceYearId - a.group.team.instanceYearId,
      );
    }

    if (currentYearChildren.length === 1) {
      const child = currentYearChildren[0];
      return {
        status: 'success',
        childId: child.id,
        pseudo: child.pseudo,
        instanceId: child.group.team.instanceYear.instanceId,
        schoolName: child.group.team.instanceYear.instance.schoolName,
        schoolYear: child.group.team.instanceYear.schoolYear,
        isDelegate: child.isDelegate,
        allowAllDelegate: child.group.team.instanceYear.allowAllDelegate,
      };
    }

    return {
      status: 'multiple_choices',
      pseudo,
      choices: currentYearChildren.map((child) => ({
        childId: child.id,
        instanceId: child.group.team.instanceYear.instanceId,
        schoolName: child.group.team.instanceYear.instance.schoolName,
        schoolYear: child.group.team.instanceYear.schoolYear,
        isDelegate: child.isDelegate,
        allowAllDelegate: child.group.team.instanceYear.allowAllDelegate,
      })),
    };
  }

  /**
   * Résoudre le contexte (instanceId + instanceYearId + schoolYear) depuis l'origine ou l'ID.
   * On cherche l'InstanceYear ouverte, et non plus l'Instance avec isOpen.
   */
  async getInstanceContext(
    origin?: string,
    instanceIdStr?: string,
  ): Promise<{
    instanceId: number;
    instanceYearId: number;
    schoolYear: string;
  }> {
    let instanceId: number | null = null;

    if (instanceIdStr) {
      const parsed = parseInt(instanceIdStr, 10);
      if (!isNaN(parsed)) instanceId = parsed;
    }

    if (!instanceId && origin) {
      const iy = await this.prisma.instanceYear.findFirst({
        where: { hostUrl: { contains: origin } },
      });
      if (iy) instanceId = iy.instanceId;
    }

    if (!instanceId) {
      // Fallback : prendre la première InstanceYear ouverte
      const openIy = await this.prisma.instanceYear.findFirst({
        where: { isOpen: true },
      });
      if (!openIy) throw new NotFoundException('Aucune école ouverte.');
      return {
        instanceId: openIy.instanceId,
        instanceYearId: openIy.id,
        schoolYear: openIy.schoolYear,
      };
    }

    // Chercher l'InstanceYear ouverte pour cette instance
    const openIy = await this.prisma.instanceYear.findFirst({
      where: { instanceId, isOpen: true },
      orderBy: { schoolYear: 'desc' },
    });

    if (openIy) {
      return {
        instanceId,
        instanceYearId: openIy.id,
        schoolYear: openIy.schoolYear,
      };
    }

    // Fallback : prendre la plus récente InstanceYear (même si fermée)
    const latestIy = await this.prisma.instanceYear.findFirst({
      where: { instanceId },
      orderBy: { schoolYear: 'desc' },
    });

    if (!latestIy)
      throw new NotFoundException(
        'Aucune année scolaire trouvée pour cette école.',
      );
    return {
      instanceId,
      instanceYearId: latestIy.id,
      schoolYear: latestIy.schoolYear,
    };
  }

  async getOpenPeriod(instanceYearId: number) {
    const now = new Date();

    const openPeriod = await this.prisma.period.findFirst({
      where: {
        instanceYearId,
        isOpen: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (openPeriod) {
      return openPeriod;
    }

    // Auto-correction : chercher une période qui englobe exactement la date actuelle
    const correctPeriod = await this.prisma.period.findFirst({
      where: {
        instanceYearId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (correctPeriod) {
      await this.prisma.period.updateMany({
        where: { instanceYearId, isOpen: true },
        data: { isOpen: false },
      });
      await this.prisma.period.update({
        where: { id: correctPeriod.id },
        data: { isOpen: true },
      });
      return { ...correctPeriod, isOpen: true };
    }

    throw new BadRequestException(
      'Aucune période ouverte, contactez votre administrateur.',
    );
  }

  async getCategories(origin?: string, instanceIdStr?: string) {
    const { instanceYearId } = await this.getInstanceContext(
      origin,
      instanceIdStr,
    );
    const cats = await this.prisma.category.findMany({
      where: { instanceYearId },
      orderBy: { order: 'asc' },
    });
    return cats.map((c) => ({
      id: c.id.toString(),
      name: c.name,
      icon: c.icon ? `categories/${c.icon}` : 'categories/folder.png',
    }));
  }

  async getActionsByCategory(
    categoryId: string,
    origin?: string,
    instanceIdStr?: string,
  ) {
    const catId = parseInt(categoryId);
    const { instanceId, schoolYear } = await this.getInstanceContext(
      origin,
      instanceIdStr,
    );
    const actions = await this.prisma.localAction.findMany({
      where: { categoryId: catId, instanceId, schoolYear },
      include: { actionRef: true },
    });

    return actions.map((a) => {
      const co2 = a.specificCo2 ?? a.actionRef.defaultCo2 ?? 0;
      const water = a.specificWater ?? a.actionRef.defaultWater ?? 0;
      const waste = a.specificWaste ?? a.actionRef.defaultWaste ?? 0;
      const points = Math.round(co2 + water + waste);
      const imageFile = isValidImageFilename(a.image)
        ? a.image
        : isValidImageFilename(a.actionRef.image)
          ? a.actionRef.image
          : null;
      return {
        id: a.id.toString(),
        name: a.label,
        points,
        metadata: a.actionRef.weightedStars?.toString() || '0',
        icon: imageFile ? `actions/${imageFile}` : '',
      };
    });
  }

  async postActionDone(
    childId: string,
    payload: any,
    origin?: string,
    instanceIdStr?: string,
  ) {
    const parsedChildId = parseInt(childId, 10);
    if (isNaN(parsedChildId)) {
      throw new UnauthorizedException('ID enfant invalide');
    }

    const child = await this.prisma.child.findUnique({
      where: { id: parsedChildId },
      include: { group: { include: { team: { include: { instanceYear: true } } } } },
    });
    if (!child) throw new NotFoundException('Élève introuvable');

    const instanceYearId = child.group.team.instanceYearId;
    const period = await this.getOpenPeriod(instanceYearId);

    const data = Array.isArray(payload) ? payload[0] : payload;
    if (!data) throw new UnauthorizedException('Payload invalide');

    const actionIdRaw = data.id_action || data.action_id || data.id;
    const localActionId =
      typeof actionIdRaw === 'number' ? actionIdRaw : parseInt(actionIdRaw, 10);
    if (isNaN(localActionId))
      throw new UnauthorizedException("ID d'action invalide (NaN)");

    const action = await this.prisma.localAction.findUnique({
      where: { id: localActionId },
      include: { actionRef: true },
    });
    if (!action) throw new NotFoundException('Action introuvable');

    if (child.group.team.instanceYearId !== period.instanceYearId) {
      throw new UnauthorizedException(
        "Erreur : Cet utilisateur n'appartient pas à l'année scolaire en cours. Veuillez contacter votre administrateur.",
      );
    }

    const co2 = action.specificCo2 ?? action.actionRef.defaultCo2 ?? 0;
    const water = action.specificWater ?? action.actionRef.defaultWater ?? 0;
    const waste = action.specificWaste ?? action.actionRef.defaultWaste ?? 0;

    // Récupérer le Top 3 avant l'action pour détecter l'entrée sur le podium
    const topBefore = await this.getTop3Players(period.instanceYearId);

    const saved = await this.prisma.actionDone.create({
      data: {
        childId: parseInt(childId),
        localActionId: action.id,
        periodId: period.id,
        savedCo2: co2,
        savedWater: water,
        savedWaste: waste,
      },
    });

    // 1. Résolution automatique des défis actifs pour cette mission
    try {
      const matchingChallenges = await this.prisma.evoeChallenge.findMany({
        where: {
          periodId: period.id,
          localActionId: action.id,
          targetTeamId: child.group.teamId,
          status: { in: ['ACCEPTED', 'PENDING'] },
        },
        include: {
          challengerTeam: true,
          targetTeam: true,
        },
      });

      for (const ch of matchingChallenges) {
        await this.prisma.evoeChallenge.update({
          where: { id: ch.id },
          data: { status: 'SUCCESS' },
        });
        if (this.chatGateway) {
          this.chatGateway.sendSystemAlert(
            `⚡ DÉFI REMPORTÉ ! L'équipe "${ch.targetTeam.name}" a accompli sa mission et triomphe du défi de l'équipe "${ch.challengerTeam.name}" !`,
          );
        }
        if (this.whatsAppService) {
          await this.whatsAppService.sendChallengeWonNotification(
            ch.targetTeam.name,
            ch.challengerTeam.name,
            action.label,
            false,
            child.group.team.instanceYear.schoolYear,
          );
        }
      }
    } catch (e: any) {
      this.logger.error('Erreur lors de la résolution de défi post-action :', e);
    }

    // 2. Vérifier l'évolution technologique du vaisseau (palier propulsion)
    try {
      await this.checkSpaceshipUpgrade(
        child.group.teamId,
        period.instanceYearId,
        period.id,
        child.group.team.instanceYear.schoolYear,
      );
    } catch (e: any) {
      this.logger.error('Erreur lors de la vérification de niveau de vaisseau :', e);
    }

    // 3. Vérifier l'entrée ou la progression sur le podium (Top 3)
    try {
      const topAfter = await this.getTop3Players(period.instanceYearId);
      const playerInTopAfter = topAfter.find((p) => p.childId === child.id);
      if (playerInTopAfter) {
        const playerInTopBefore = topBefore.find((p) => p.childId === child.id);
        if (!playerInTopBefore || playerInTopAfter.rank < playerInTopBefore.rank) {
          if (this.whatsAppService) {
            await this.whatsAppService.sendPodiumArrivalNotification(
              child.pseudo,
              child.group.team.name,
              playerInTopAfter.rank,
              playerInTopAfter.score,
              child.group.team.instanceYear.schoolYear,
            );
          }
        }
      }
    } catch (e: any) {
      this.logger.error('Erreur lors de la vérification du podium :', e);
    }

    return { success: true, message: 'Action enregistrée', actionId: saved.id };
  }

  private async getTop3Players(instanceYearId: number) {
    try {
      const teams = await this.prisma.team.findMany({
        where: { instanceYearId },
        include: {
          groups: {
            include: {
              children: true,
            },
          },
        },
      });

      const childImpacts = await this.prisma.actionDone.groupBy({
        by: ['childId'],
        _count: { id: true },
        _sum: { savedCo2: true },
        where: {
          period: { instanceYearId },
        },
      });

      const impactMap = new Map<number, { count: number; co2: number }>();
      childImpacts.forEach((ci) => {
        impactMap.set(ci.childId, {
          count: ci._count.id || 0,
          co2: ci._sum.savedCo2 || 0,
        });
      });

      const list: Array<{ childId: number; pseudo: string; teamName: string; score: number; count: number }> = [];
      teams.forEach((t) => {
        t.groups.forEach((g) => {
          g.children.forEach((c) => {
            const impact = impactMap.get(c.id) || { count: 0, co2: 0 };
            const score = impact.count * 10 + impact.co2;
            list.push({
              childId: c.id,
              pseudo: c.pseudo,
              teamName: t.name,
              score,
              count: impact.count,
            });
          });
        });
      });

      list.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.count !== a.count) return b.count - a.count;
        return a.pseudo.localeCompare(b.pseudo);
      });

      return list.slice(0, 3).map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));
    } catch {
      return [];
    }
  }

  private async checkSpaceshipUpgrade(
    teamId: number,
    instanceYearId: number,
    periodId: number,
    schoolYear: string,
  ) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        groups: { include: { children: true } },
        instanceYear: true,
        evoeTechnology: true,
      },
    });
    if (!team) return;

    const totalChildren = team.groups.reduce((acc, g) => acc + g.children.length, 0) || 1;
    const gameConfig = await this.prisma.gameConfig.findFirst({
      where: { instanceId: team.instanceYear.instanceId, schoolYear },
    });

    const actionsCountTarget = gameConfig?.avgActionsPerChildPerPeriod || 8;
    const refCo2Target = 5.0 * actionsCountTarget; // 5 kg par action
    const refWaterTarget = 50.0 * actionsCountTarget; // 50 L par action
    const refWasteTarget = 2.0 * actionsCountTarget; // 2 kg par action

    const teamImpact = await this.prisma.actionDone.aggregate({
      _sum: { savedCo2: true, savedWater: true, savedWaste: true },
      where: {
        periodId,
        child: { group: { teamId: team.id } },
      },
    });

    const teamCo2 = teamImpact._sum.savedCo2 || 0;
    const teamWater = teamImpact._sum.savedWater || 0;
    const teamWaste = teamImpact._sum.savedWaste || 0;

    const avgCo2ChildPeriod = teamCo2 / totalChildren;
    const avgWaterChildPeriod = teamWater / totalChildren;
    const avgWasteChildPeriod = teamWaste / totalChildren;

    const rCo2 = refCo2Target > 0 ? Math.min(1, avgCo2ChildPeriod / refCo2Target) : 0;
    const rWater = refWaterTarget > 0 ? Math.min(1, avgWaterChildPeriod / refWaterTarget) : 0;
    const rWaste = refWasteTarget > 0 ? Math.min(1, avgWasteChildPeriod / refWasteTarget) : 0;

    const position = Number(((rCo2 * 0.6 + rWater * 0.2 + rWaste * 0.2) * 100).toFixed(1));

    const PROPULSION_THRESHOLDS = [
      { level: 1, percentRequired: 0, name: 'Friction Thermique' },
      { level: 2, percentRequired: 25, name: 'Voiles Photovoltaïques' },
      { level: 3, percentRequired: 45, name: 'Fusion Magnétique' },
      { level: 4, percentRequired: 65, name: 'Résonance Quantique' },
      { level: 5, percentRequired: 85, name: 'Singularité Protonique' },
    ];

    let calculatedLevel = 1;
    let propTech = PROPULSION_THRESHOLDS[0];
    for (const threshold of PROPULSION_THRESHOLDS) {
      if (position >= threshold.percentRequired) {
        calculatedLevel = threshold.level;
        propTech = threshold;
      }
    }

    const existingTech = team.evoeTechnology;
    const currentMaxLevel = existingTech?.maxLevel || 1;

    if (calculatedLevel > currentMaxLevel) {
      await this.prisma.evoeTeamTechnology.upsert({
        where: { teamId: team.id },
        update: { maxLevel: calculatedLevel },
        create: { teamId: team.id, maxLevel: calculatedLevel },
      });

      if (this.chatGateway) {
        this.chatGateway.sendSystemAlert(
          `🚀 PALIER TECHNOLOGIQUE ! Le vaisseau de l'équipe "${team.name}" passe au Niveau ${calculatedLevel} (${propTech.name}) !`,
        );
      }
      if (this.whatsAppService) {
        await this.whatsAppService.sendPropulsionLevelUpNotification(
          team.name,
          calculatedLevel,
          propTech.name,
          schoolYear,
        );
      }
    }
  }

  async deleteActionDone(actionId: string) {
    await this.prisma.actionDone.delete({ where: { id: parseInt(actionId) } });
    return { success: true };
  }

  async getActionsDone(childId: string, weekId: string) {
    const whereClause: any = { childId: parseInt(childId) };

    if (
      weekId &&
      weekId !== '1' &&
      weekId !== 'undefined' &&
      weekId !== 'null'
    ) {
      const parsedPeriodId = parseInt(weekId, 10);
      if (!isNaN(parsedPeriodId)) {
        whereClause.periodId = parsedPeriodId;
      }
    } else if (weekId !== '1') {
      // Si weekId n'est pas fourni ou est invalide, et qu'on ne demande pas
      // explicitement tout l'historique ('1'), on se rabat sur la période active de l'école de l'enfant.
      const child = await this.prisma.child.findUnique({
        where: { id: parseInt(childId) },
        include: { group: { include: { team: true } } },
      });
      if (child && child.group?.team?.instanceYearId) {
        try {
          const openPeriod = await this.getOpenPeriod(
            child.group.team.instanceYearId,
          );
          whereClause.periodId = openPeriod.id;
        } catch (e) {
          // Fallback silencieux si aucune période n'est configurée/ouverte
        }
      }
    }

    const actions = await this.prisma.actionDone.findMany({
      where: whereClause,
      include: { localAction: true },
    });
    return actions.map((a) => ({
      id: a.id.toString(),
      child_id: a.childId.toString(),
      action_id: a.localActionId.toString(),
      action_name: a.localAction.label,
      category_id: a.localAction.categoryId?.toString() || '0',
      week_id: weekId || '1',
    }));
  }

  async getActionsDoneComplete(childId: string) {
    return this.getActionsDone(childId, '1');
  }

  async getImpact(weekId?: string, origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(
      origin,
      instanceIdStr,
    );
    const impactData: any = await this.impactService.calculateImpact(
      schoolYear,
      instanceId,
    );

    return {
      scoreglobal: impactData.realSums.totalCo2,
      scorewater: impactData.realSums.totalWater,
      scorepollution: impactData.realSums.totalWaste,
      totalCo2: impactData.realSums.totalCo2,
      totalWater: impactData.realSums.totalWater,
      totalWaste: impactData.realSums.totalWaste,
      depassementnombreplanetes: impactData.results.nbPlanetes,
      jourdepassementavec: impactData.results.dateDepassement,
      jourdepassementsans: impactData.results.dateDepassementSans,
      bravotitre: 'Génial !',
      bravotext: `Vos actions ont permis d'économiser collectivement des tonnes de CO2, beaucoup d'eau et d'éviter des déchets !`,
      deblocageanimal: 'Continuez comme ça pour débloquer le prochain animal !',
      animalnum: (
        await this.animalUnlockService.getCurrentUnlock(instanceId, schoolYear)
      ).animalsUnlocked,
    };
  }

  async getTeams(origin?: string, instanceIdStr?: string) {
    const { instanceYearId } = await this.getInstanceContext(
      origin,
      instanceIdStr,
    );
    const teams = await this.prisma.team.findMany({
      where: { instanceYearId },
    });
    return teams.map((t) => ({
      id: t.id.toString(),
      name: t.name,
      color: t.color || '#40916C',
      icon: t.icon ? `teams/${t.icon.split('/').pop()}` : null,
    }));
  }

  async getTeamsTotal(weekId: string, origin?: string, instanceIdStr?: string) {
    const { instanceYearId } = await this.getInstanceContext(
      origin,
      instanceIdStr,
    );
    let period = null;
    if (weekId && weekId !== 'undefined' && weekId !== 'null') {
      period = await this.prisma.period.findUnique({
        where: { id: parseInt(weekId, 10) },
      });
    }
    if (!period) {
      try {
        period = await this.getOpenPeriod(instanceYearId);
      } catch (e) {}
    }

    const periods = await this.prisma.period.findMany({
      where: { instanceYearId },
      select: { id: true },
    });
    const periodIds = periods.map((p) => p.id);

    const teams = await this.prisma.team.findMany({
      where: { instanceYearId },
      include: {
        groups: {
          include: {
            children: {
              include: {
                actionsDone: {
                  where: { periodId: { in: periodIds } },
                },
              },
            },
          },
        },
      },
    });

    return teams.map((t) => {
      let total = 0;
      let weekTotal = 0;
      t.groups.forEach((g) => {
        g.children.forEach((c) => {
          total += c.actionsDone.length;
          c.actionsDone.forEach((a) => {
            if (period && a.periodId === period.id) weekTotal += 1;
          });
        });
      });
      return {
        id: t.id.toString(),
        team_id: t.id.toString(),
        count_total: total,
        count_week: weekTotal,
        total_points: total,
      };
    });
  }

  async getSchool(origin?: string, instanceIdStr?: string) {
    const { instanceId, instanceYearId, schoolYear } =
      await this.getInstanceContext(origin, instanceIdStr);
    const inst = await this.prisma.instance.findUnique({
      where: { id: instanceId },
    });
    if (!inst) throw new NotFoundException('Ecole introuvable');

    const iy = await this.prisma.instanceYear.findUnique({
      where: { id: instanceYearId },
      select: { unlockedChapters: true },
    });

    return {
      name: inst.schoolName,
      objective: 1000,
      numchapter: iy?.unlockedChapters ?? 0,
      schoolYear,
    };
  }

  async getWeek(origin?: string, instanceIdStr?: string) {
    const { instanceYearId } = await this.getInstanceContext(
      origin,
      instanceIdStr,
    );
    let period = null;
    try {
      period = await this.getOpenPeriod(instanceYearId);
    } catch (e) {
      period = await this.prisma.period.findFirst({
        where: { instanceYearId, isOpen: true },
      });
    }
    if (!period) return {};
    return {
      id: period.id.toString(),
      name: 'Période ouverte',
      start_date: period.startDate,
      end_date: period.endDate,
      begin: period.startDate,
      end: period.endDate,
      status: period.isOpen ? '1' : '0',
    };
  }

  async getChildren(origin?: string, instanceIdStr?: string) {
    const { instanceYearId } = await this.getInstanceContext(
      origin,
      instanceIdStr,
    );
    const children = await this.prisma.child.findMany({
      where: { group: { team: { instanceYearId } } },
      include: { group: { include: { team: true } } },
    });
    return children.map((c) => ({
      id: c.id.toString(),
      pseudo: c.pseudo,
      team_id: c.group.teamId.toString(),
      group_id: c.groupId.toString(),
    }));
  }

  async getChildByPseudo(
    pseudo: string,
    origin?: string,
    instanceIdStr?: string,
  ) {
    const { instanceYearId } = await this.getInstanceContext(
      origin,
      instanceIdStr,
    );
    const child = await this.prisma.child.findFirst({
      where: {
        pseudo,
        group: {
          team: {
            instanceYearId,
          },
        },
      },
    });
    if (!child) throw new NotFoundException('Enfant introuvable');
    return { id: child.id.toString(), pseudo: child.pseudo };
  }

  async getChildById(id: number) {
    const child = await this.prisma.child.findUnique({
      where: { id },
      include: {
        group: { include: { team: { include: { instanceYear: true } } } },
      },
    });
    if (!child) throw new NotFoundException('Enfant introuvable');
    return {
      id: child.id.toString(),
      pseudo: child.pseudo,
      color: child.group.color || child.group.team.color || '#000000',
      avatar: child.avatar,
      group_id: child.groupId.toString(),
      group_name: child.group.name,
      team_id: child.group.teamId.toString(),
      team_name: child.group.team.name,
      team_icon: child.group.team.icon
        ? `teams/${child.group.team.icon.split('/').pop()}`
        : null,
      isDelegate: child.isDelegate,
      allowAllDelegate: child.group.team.instanceYear.allowAllDelegate,
    };
  }

  async getActions(origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(
      origin,
      instanceIdStr,
    );
    const actions = await this.prisma.localAction.findMany({
      where: { instanceId, schoolYear },
      include: { actionRef: true },
    });
    return actions.map((a) => {
      const imageFile = isValidImageFilename(a.image)
        ? a.image
        : isValidImageFilename(a.actionRef.image)
          ? a.actionRef.image
          : null;

      const isNumeric = (str: string) => /^\d+(\.\d+)?$/.test(str.trim());
      const localDesc =
        a.description && !isNumeric(a.description) ? a.description : null;
      const refDesc =
        a.actionRef.description && !isNumeric(a.actionRef.description)
          ? a.actionRef.description
          : null;

      return {
        id: a.id.toString(),
        name: a.label,
        description: localDesc || refDesc || null,
        co2: a.specificCo2 ?? a.actionRef.defaultCo2 ?? 0,
        water: a.specificWater ?? a.actionRef.defaultWater ?? 0,
        waste: a.specificWaste ?? a.actionRef.defaultWaste ?? 0,
        category_id: a.categoryId?.toString() || '0',
        icon: imageFile ? `actions/${imageFile}` : '',
      };
    });
  }

  async getChildFromAuth(authHeader: string, instanceIdStr?: string) {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Basic auth required');
    }
    const decoded = Buffer.from(
      authHeader.replace('Basic ', ''),
      'base64',
    ).toString('utf8');
    const [pseudo, password] = decoded.split(':');

    const result: any = await this.checkAuthChild(pseudo, password);
    this.logger.log(
      `getChildFromAuth: status=${result.status}, instanceIdStr=${instanceIdStr}`,
    );

    let childId: number;

    if (result.status === 'multiple_choices') {
      // Utiliser x-instance-id pour choisir la bonne instance
      if (!instanceIdStr) {
        this.logger.warn(
          `getChildFromAuth: multiple_choices mais pas de x-instance-id`,
        );
        throw new UnauthorizedException(
          'Plusieurs comptes trouvés, instanceId requis',
        );
      }
      const parsedInstanceId = parseInt(instanceIdStr, 10);
      const choices: any[] = result.choices ?? [];
      this.logger.log(
        `getChildFromAuth: choices=${JSON.stringify(choices.map((c) => ({ childId: c.childId, instanceId: c.instanceId })))}, looking for instanceId=${parsedInstanceId}`,
      );
      const choice = choices.find(
        (c: any) => c.instanceId === parsedInstanceId,
      );
      if (!choice) {
        throw new UnauthorizedException(
          'Instance non trouvée dans les choix disponibles',
        );
      }
      childId = choice.childId as number;
    } else {
      childId = result.childId as number;
    }

    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        group: { include: { team: { include: { instanceYear: true } } } },
      },
    });

    if (!child) {
      throw new UnauthorizedException('Enfant introuvable');
    }

    return child;
  }

  async getDelegateImpact(authHeader: string, instanceIdStr?: string) {
    const child = await this.getChildFromAuth(authHeader, instanceIdStr);
    const instanceYear = child.group.team.instanceYear;

    if (!child.isDelegate && !instanceYear.allowAllDelegate) {
      throw new UnauthorizedException('Accès non autorisé au tableau de bord');
    }

    const impactData = await this.impactService.calculateImpact(
      instanceYear.schoolYear,
      instanceYear.instanceId,
    );

    const teams = await this.prisma.team.findMany({
      where: { instanceYearId: instanceYear.id },
      include: {
        groups: {
          include: {
            children: {
              include: {
                actionsDone: true,
              },
            },
          },
        },
      },
    });

    const teamsScore = teams.map((t) => {
      let co2 = 0,
        water = 0,
        waste = 0;
      let playersCount = 0;
      let actionsCount = 0;
      t.groups.forEach((g) => {
        playersCount += g.children.length;
        g.children.forEach((c) => {
          actionsCount += c.actionsDone.length;
          c.actionsDone.forEach((a) => {
            co2 += a.savedCo2 || 0;
            water += a.savedWater || 0;
            waste += a.savedWaste || 0;
          });
        });
      });
      return {
        id: t.id,
        name: t.name,
        color: t.color || '#10b981',
        totalCo2: co2,
        totalWater: water,
        totalWaste: waste,
        totalScore: co2 + water + waste,
        playersCount,
        actionsCount,
      };
    });

    return { impactData, teams: teamsScore };
  }

  async getDelegateTracking(authHeader: string, instanceIdStr?: string) {
    const child = await this.getChildFromAuth(authHeader, instanceIdStr);
    const instanceYear = child.group.team.instanceYear;

    if (!child.isDelegate && !instanceYear.allowAllDelegate) {
      throw new UnauthorizedException('Accès non autorisé au tableau de bord');
    }

    const trackingStats = await this.trackingService.getTrackingStats(
      instanceYear.instanceId,
      instanceYear.schoolYear,
    );
    return trackingStats;
  }

  async getDelegateEcoBarRaceHistory(
    authHeader: string,
    instanceIdStr?: string,
  ) {
    const child = await this.getChildFromAuth(authHeader, instanceIdStr);
    const instanceYear = child.group.team.instanceYear;

    if (!child.isDelegate && !instanceYear.allowAllDelegate) {
      throw new UnauthorizedException('Accès non autorisé au tableau de bord');
    }

    return this.ecoBarRaceService.getHistory(instanceYear.schoolYear);
  }
}
