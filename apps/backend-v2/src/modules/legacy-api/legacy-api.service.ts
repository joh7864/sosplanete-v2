import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { ImpactService } from '../impact/impact.service';
import { AnimalUnlockService } from '../stimulation/animal-unlock.service';

@Injectable()
export class LegacyApiService {
  private readonly logger = new Logger(LegacyApiService.name);

  constructor(
    private prisma: PrismaService,
    private impactService: ImpactService,
    private animalUnlockService: AnimalUnlockService,
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

    if (children.length === 0) throw new UnauthorizedException('Enfant introuvable ou pseudo invalide');

    const validChildren = [];
    for (const child of children) {
      let isValid = false;
      if (child.password) {
        isValid = await bcrypt.compare(pass, child.password);
        if (!isValid) {
          const isLikelyBcrypt = child.password.startsWith('$2b$') || child.password.startsWith('$2a$');
          if (!isLikelyBcrypt && pass === child.password) {
            const upgraded = await bcrypt.hash(pass, 10);
            await this.prisma.child.update({ where: { id: child.id }, data: { password: upgraded } });
            isValid = true;
          }
        }
      } else {
        isValid = pass === '' || pass === child.pseudo;
      }
      if (isValid) validChildren.push(child);
    }

    if (validChildren.length === 0) throw new UnauthorizedException('Mot de passe incorrect');

    if (validChildren.length === 1) {
      const child = validChildren[0];
      return {
        status:     'success',
        childId:    child.id,
        pseudo:     child.pseudo,
        instanceId: child.group.team.instanceYear.instanceId,
        schoolName: child.group.team.instanceYear.instance.schoolName,
      };
    }

    return {
      status:  'multiple_choices',
      pseudo,
      choices: validChildren.map(child => ({
        childId:    child.id,
        instanceId: child.group.team.instanceYear.instanceId,
        schoolName: child.group.team.instanceYear.instance.schoolName,
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
  ): Promise<{ instanceId: number; instanceYearId: number; schoolYear: string }> {
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
      const openIy = await this.prisma.instanceYear.findFirst({ where: { isOpen: true } });
      if (!openIy) throw new NotFoundException('Aucune école ouverte.');
      return { instanceId: openIy.instanceId, instanceYearId: openIy.id, schoolYear: openIy.schoolYear };
    }

    // Chercher l'InstanceYear ouverte pour cette instance
    const openIy = await this.prisma.instanceYear.findFirst({
      where: { instanceId, isOpen: true },
      orderBy: { schoolYear: 'desc' },
    });

    if (openIy) {
      return { instanceId, instanceYearId: openIy.id, schoolYear: openIy.schoolYear };
    }

    // Fallback : prendre la plus récente InstanceYear (même si fermée)
    const latestIy = await this.prisma.instanceYear.findFirst({
      where: { instanceId },
      orderBy: { schoolYear: 'desc' },
    });

    if (!latestIy) throw new NotFoundException('Aucune année scolaire trouvée pour cette école.');
    return { instanceId, instanceYearId: latestIy.id, schoolYear: latestIy.schoolYear };
  }

  async getOpenPeriod(instanceYearId: number) {
    const now = new Date();

    const openPeriod = await this.prisma.period.findFirst({
      where: { instanceYearId, isOpen: true },
    });

    // Cas nominal
    if (openPeriod && openPeriod.startDate <= now && openPeriod.endDate >= now) {
      return openPeriod;
    }

    // Auto-correction
    const correctPeriod = await this.prisma.period.findFirst({
      where: {
        instanceYearId,
        startDate: { lte: now },
        endDate:   { gte: now },
      },
    });

    if (!correctPeriod) throw new NotFoundException('Aucune période de jeu ouverte.');

    await this.prisma.period.updateMany({ where: { instanceYearId, isOpen: true }, data: { isOpen: false } });
    await this.prisma.period.update({ where: { id: correctPeriod.id }, data: { isOpen: true } });

    return { ...correctPeriod, isOpen: true };
  }

  async getCategories(origin?: string, instanceIdStr?: string) {
    const { instanceYearId } = await this.getInstanceContext(origin, instanceIdStr);
    const cats = await this.prisma.category.findMany({
      where: { instanceYearId },
      orderBy: { order: 'asc' },
    });
    return cats.map(c => ({
      id:   c.id.toString(),
      name: c.name,
      icon: c.icon ? `categories/${c.icon}` : 'categories/folder.png',
    }));
  }

  async getActionsByCategory(categoryId: string, origin?: string, instanceIdStr?: string) {
    const catId = parseInt(categoryId);
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const actions = await this.prisma.localAction.findMany({
      where: { categoryId: catId, instanceId, schoolYear },
      include: { actionRef: true },
    });

    return actions.map(a => {
      const co2    = a.specificCo2   ?? a.actionRef.defaultCo2   ?? 0;
      const water  = a.specificWater ?? a.actionRef.defaultWater ?? 0;
      const waste  = a.specificWaste ?? a.actionRef.defaultWaste ?? 0;
      const points = Math.round(co2 + water + waste);
      return {
        id:       a.id.toString(),
        name:     a.label,
        points,
        metadata: a.actionRef.weightedStars?.toString() || '0',
        icon:     a.image ? `actions/${a.image}` : (a.actionRef.image ? `actions/${a.actionRef.image}` : ''),
      };
    });
  }

  async postActionDone(childId: string, payload: any, origin?: string, instanceIdStr?: string) {
    const { instanceId, instanceYearId } = await this.getInstanceContext(origin, instanceIdStr);
    const period = await this.getOpenPeriod(instanceYearId);

    const data      = Array.isArray(payload) ? payload[0] : payload;
    if (!data) throw new UnauthorizedException('Payload invalide');

    const actionIdRaw  = data.id_action || data.action_id || data.id;
    const localActionId = typeof actionIdRaw === 'number' ? actionIdRaw : parseInt(actionIdRaw, 10);
    if (isNaN(localActionId)) throw new UnauthorizedException('ID d\'action invalide (NaN)');

    const action = await this.prisma.localAction.findUnique({
      where: { id: localActionId },
      include: { actionRef: true },
    });
    if (!action) throw new NotFoundException('Action introuvable');

    const co2   = action.specificCo2   ?? action.actionRef.defaultCo2   ?? 0;
    const water = action.specificWater ?? action.actionRef.defaultWater ?? 0;
    const waste = action.specificWaste ?? action.actionRef.defaultWaste ?? 0;

    const saved = await this.prisma.actionDone.create({
      data: {
        childId:      parseInt(childId),
        localActionId: action.id,
        periodId:     period.id,
        savedCo2:     co2,
        savedWater:   water,
        savedWaste:   waste,
      },
    });

    return { success: true, message: 'Action enregistrée', actionId: saved.id };
  }

  async deleteActionDone(actionId: string) {
    await this.prisma.actionDone.delete({ where: { id: parseInt(actionId) } });
    return { success: true };
  }

  async getActionsDone(childId: string, weekId: string) {
    const actions = await this.prisma.actionDone.findMany({
      where: { childId: parseInt(childId) },
      include: { localAction: true },
    });
    return actions.map(a => ({
      id:           a.id.toString(),
      child_id:     a.childId.toString(),
      action_id:    a.localActionId.toString(),
      action_name:  a.localAction.label,
      category_id:  a.localAction.categoryId?.toString() || '0',
      week_id:      weekId || '1',
    }));
  }

  async getActionsDoneComplete(childId: string) {
    return this.getActionsDone(childId, '1');
  }

  async getImpact(weekId?: string, origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const impactData: any = await this.impactService.calculateImpact(schoolYear, instanceId);

    return {
      scoreglobal:              impactData.realSums.totalCo2,
      scorewater:               impactData.realSums.totalWater,
      scorepollution:           impactData.realSums.totalWaste,
      totalCo2:                 impactData.realSums.totalCo2,
      totalWater:               impactData.realSums.totalWater,
      totalWaste:               impactData.realSums.totalWaste,
      depassementnombreplanetes: impactData.results.nbPlanetes,
      jourdepassementavec:      impactData.results.dateDepassement,
      jourdepassementsans:      impactData.results.dateDepassementSans,
      bravotitre:               'Génial !',
      bravotext:                `Vos actions ont permis d'économiser collectivement des tonnes de CO2, beaucoup d'eau et d'éviter des déchets !`,
      deblocageanimal:          'Continuez comme ça pour débloquer le prochain animal !',
      animalnum:                (await this.animalUnlockService.getCurrentUnlock(instanceId, schoolYear)).animalsUnlocked,
    };
  }

  async getTeams(origin?: string, instanceIdStr?: string) {
    const { instanceYearId } = await this.getInstanceContext(origin, instanceIdStr);
    const teams = await this.prisma.team.findMany({ where: { instanceYearId } });
    return teams.map(t => ({
      id:    t.id.toString(),
      name:  t.name,
      color: t.color || '#40916C',
      icon:  t.icon ? `teams/${t.icon.split('/').pop()}` : 'teams/Chat.png',
    }));
  }

  async getTeamsTotal(weekId: string, origin?: string, instanceIdStr?: string) {
    const { instanceYearId } = await this.getInstanceContext(origin, instanceIdStr);
    let period = null;
    if (weekId && weekId !== 'undefined' && weekId !== 'null') {
      period = await this.prisma.period.findUnique({ where: { id: parseInt(weekId, 10) } });
    }
    if (!period) {
      try { period = await this.getOpenPeriod(instanceYearId); } catch (e) {}
    }

    const periods = await this.prisma.period.findMany({ where: { instanceYearId }, select: { id: true } });
    const periodIds = periods.map(p => p.id);

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

    return teams.map(t => {
      let total = 0;
      let weekTotal = 0;
      t.groups.forEach(g => {
        g.children.forEach(c => {
          total += c.actionsDone.length;
          c.actionsDone.forEach(a => {
            if (period && a.periodId === period.id) weekTotal += 1;
          });
        });
      });
      return {
        id:          t.id.toString(),
        team_id:     t.id.toString(),
        count_total: total,
        count_week:  weekTotal,
        total_points: total,
      };
    });
  }

  async getSchool(origin?: string, instanceIdStr?: string) {
    const { instanceId, instanceYearId } = await this.getInstanceContext(origin, instanceIdStr);
    const inst = await this.prisma.instance.findUnique({ where: { id: instanceId } });
    if (!inst) throw new NotFoundException('Ecole introuvable');

    const iy = await this.prisma.instanceYear.findUnique({
      where: { id: instanceYearId },
      select: { unlockedChapters: true },
    });

    return {
      name:       inst.schoolName,
      objective:  1000,
      numchapter: iy?.unlockedChapters ?? 0,
    };
  }

  async getWeek(origin?: string, instanceIdStr?: string) {
    const { instanceYearId } = await this.getInstanceContext(origin, instanceIdStr);
    const period = await this.prisma.period.findFirst({ where: { instanceYearId, isOpen: true } });
    if (!period) return {};
    return {
      id:         period.id.toString(),
      name:       'Période ouverte',
      start_date: period.startDate,
      end_date:   period.endDate,
      begin:      period.startDate,
      end:        period.endDate,
      status:     period.isOpen ? '1' : '0',
    };
  }

  async getChildren(origin?: string, instanceIdStr?: string) {
    const { instanceYearId } = await this.getInstanceContext(origin, instanceIdStr);
    const children = await this.prisma.child.findMany({
      where: { group: { team: { instanceYearId } } },
      include: { group: { include: { team: true } } },
    });
    return children.map(c => ({
      id:       c.id.toString(),
      pseudo:   c.pseudo,
      team_id:  c.group.teamId.toString(),
      group_id: c.groupId.toString(),
    }));
  }

  async getChildByPseudo(pseudo: string) {
    const child = await this.prisma.child.findFirst({ where: { pseudo } });
    if (!child) throw new NotFoundException('Enfant introuvable');
    return { id: child.id.toString(), pseudo: child.pseudo };
  }

  async getChildById(id: number) {
    const child = await this.prisma.child.findUnique({
      where: { id },
      include: { group: { include: { team: true } } },
    });
    if (!child) throw new NotFoundException('Enfant introuvable');
    return {
      id:         child.id.toString(),
      pseudo:     child.pseudo,
      color:      child.group.color || child.group.team.color || '#000000',
      avatar:     child.avatar,
      group_id:   child.groupId.toString(),
      group_name: child.group.name,
      team_id:    child.group.teamId.toString(),
      team_name:  child.group.team.name,
    };
  }

  async getActions(origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const actions = await this.prisma.localAction.findMany({
      where: { instanceId, schoolYear },
      include: { actionRef: true },
    });
    return actions.map(a => ({
      id:          a.id.toString(),
      name:        a.label,
      description: a.description,
      co2:         a.specificCo2   ?? a.actionRef.defaultCo2   ?? 0,
      water:       a.specificWater ?? a.actionRef.defaultWater ?? 0,
      waste:       a.specificWaste ?? a.actionRef.defaultWaste ?? 0,
      category_id: a.categoryId?.toString() || '0',
      icon:        a.image ? `actions/${a.image}` : (a.actionRef.image ? `actions/${a.actionRef.image}` : ''),
    }));
  }
}
