import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { ImpactService } from '../impact/impact.service';
import { AnimalUnlockService } from '../stimulation/animal-unlock.service';
import { TrackingService } from '../tracking/tracking.service';
import { EcoBarRaceService } from '../stimulation/eco-bar-race.service';

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

    const currentSchoolYear = getCurrentSchoolYear();
    let currentYearChildren = validChildren.filter(
      (c) => c.group.team.instanceYear.schoolYear === currentSchoolYear,
    );

    if (currentYearChildren.length === 0) {
      // Fallback : Si l'année courante n'est pas encore enregistrée en DB,
      // retenir la dernière année scolaire active où l'élève est inscrit.
      currentYearChildren = [...validChildren].sort(
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
      where: { instanceYearId, isOpen: true },
    });

    // Cas nominal
    if (
      openPeriod &&
      openPeriod.startDate <= now &&
      openPeriod.endDate >= now
    ) {
      return openPeriod;
    }

    // Auto-correction
    const correctPeriod = await this.prisma.period.findFirst({
      where: {
        instanceYearId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!correctPeriod)
      throw new NotFoundException('Aucune période de jeu ouverte.');

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
      // localAction.image peut contenir des valeurs numériques corrompues : on valide l'extension
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
    const { instanceId, instanceYearId } = await this.getInstanceContext(
      origin,
      instanceIdStr,
    );
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

    const child = await this.prisma.child.findUnique({
      where: { id: parseInt(childId) },
      include: { group: { include: { team: true } } },
    });
    if (!child || child.group.team.instanceYearId !== period.instanceYearId) {
      throw new UnauthorizedException(
        "Erreur : Cet utilisateur n'appartient pas à l'année scolaire en cours. Veuillez contacter votre administrateur.",
      );
    }

    const co2 = action.specificCo2 ?? action.actionRef.defaultCo2 ?? 0;
    const water = action.specificWater ?? action.actionRef.defaultWater ?? 0;
    const waste = action.specificWaste ?? action.actionRef.defaultWaste ?? 0;

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

    return { success: true, message: 'Action enregistrée', actionId: saved.id };
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
