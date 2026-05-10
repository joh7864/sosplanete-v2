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
    private animalUnlockService: AnimalUnlockService
  ) {}

  async checkAuthChild(pseudo: string, pass: string) {
    const children = await this.prisma.child.findMany({
      where: { pseudo },
      include: {
        group: {
          include: {
            team: {
              include: { instance: true }
            }
          }
        }
      }
    });

    if (children.length === 0) throw new UnauthorizedException('Enfant introuvable ou pseudo invalide');

    const validChildren = [];
    for (const child of children) {
      let isValid = false;
      if (child.password) {
        // 1. Essai bcrypt (v2 ou mots de passe déjà migrés)
        isValid = await bcrypt.compare(pass, child.password);

        if (!isValid) {
          // 2. Fallback plaintext legacy : si le hash n'est pas du bcrypt et correspond en clair
          const isLikelyBcrypt = child.password.startsWith('$2b$') || child.password.startsWith('$2a$');
          if (!isLikelyBcrypt && pass === child.password) {
            // SEC-02 — Migration automatique on-login : rehash en bcrypt et autoriser
            const upgraded = await bcrypt.hash(pass, 10);
            await this.prisma.child.update({
              where: { id: child.id },
              data: { password: upgraded }
            });
            isValid = true;
          }
        }
      } else {
        // Enfant sans mot de passe
        isValid = pass === '' || pass === child.pseudo;
      }

      if (isValid) {
        validChildren.push(child);
      }
    }

    if (validChildren.length === 0) throw new UnauthorizedException('Mot de passe incorrect');

    if (validChildren.length === 1) {
      const child = validChildren[0];
      return {
        status: 'success',
        childId: child.id,
        pseudo: child.pseudo,
        instanceId: child.group.team.instance.id,
        schoolName: child.group.team.instance.schoolName
      };
    }

    // Si le joueur est présent dans plusieurs écoles avec le même pseudo/mot de passe
    return {
      status: 'multiple_choices',
      pseudo: pseudo,
      choices: validChildren.map(child => ({
        childId: child.id,
        instanceId: child.group.team.instance.id,
        schoolName: child.group.team.instance.schoolName
      }))
    };
  }

  async getInstanceContext(origin?: string, instanceIdStr?: string): Promise<{ instanceId: number; schoolYear: string }> {
    let instanceId: number | null = null;
    if (instanceIdStr) {
      const parsed = parseInt(instanceIdStr, 10);
      if (!isNaN(parsed)) instanceId = parsed;
    }
    
    if (!instanceId && origin) {
      const inst = await this.prisma.instance.findFirst({
        where: { hostUrl: { contains: origin }, isOpen: true }
      });
      if (inst) instanceId = inst.id;
    }

    if (!instanceId) {
      const fallback = await this.prisma.instance.findFirst({ where: { isOpen: true } });
      if (!fallback) throw new NotFoundException('Aucune école ouverte.');
      instanceId = fallback.id;
    }

    const instance = await this.prisma.instance.findUnique({
      where: { id: instanceId },
      select: { currentSchoolYear: true }
    });

    return { 
      instanceId, 
      schoolYear: instance?.currentSchoolYear || "2024-2025" 
    };
  }

  async getOpenPeriod(instanceId: number) {
    const now = new Date();

    // Récupérer l'année scolaire active de l'instance
    const instance = await this.prisma.instance.findUnique({
      where: { id: instanceId },
      select: { currentSchoolYear: true },
    });
    const schoolYear = instance?.currentSchoolYear;

    const openPeriod = await this.prisma.period.findFirst({
      where: { instanceId, schoolYear, isOpen: true },
    });

    // Cas nominal : la période ouverte est valide (la date du jour est dans sa plage)
    if (openPeriod && openPeriod.startDate <= now && openPeriod.endDate >= now) {
      return openPeriod;
    }

    // Cas dégradé : la période ouverte est périmée ou absente → auto-correction
    const correctPeriod = await this.prisma.period.findFirst({
      where: {
        instanceId,
        schoolYear,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!correctPeriod) throw new NotFoundException('Aucune période de jeu ouverte.');

    // Fermer uniquement les périodes de la même année scolaire, puis ouvrir la correcte
    await this.prisma.period.updateMany({ where: { instanceId, schoolYear, isOpen: true }, data: { isOpen: false } });
    await this.prisma.period.update({ where: { id: correctPeriod.id }, data: { isOpen: true } });

    return { ...correctPeriod, isOpen: true };
  }



  async getCategories(origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const cats = await this.prisma.category.findMany({
      where: { instanceId, schoolYear },
      orderBy: { order: 'asc' }
    });
    return cats.map(c => ({
      id: c.id.toString(),
      name: c.name,
      icon: c.icon ? `categories/${c.icon}` : 'categories/folder.png'
    }));
  }

  async getActionsByCategory(categoryId: string, origin?: string, instanceIdStr?: string) {
    const catId = parseInt(categoryId);
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const actions = await this.prisma.localAction.findMany({
      where: { categoryId: catId, instanceId, schoolYear },
      include: { actionRef: true }
    });

    return actions.map(a => {
      const co2 = a.specificCo2 ?? a.actionRef.defaultCo2 ?? 0;
      const water = a.specificWater ?? a.actionRef.defaultWater ?? 0;
      const waste = a.specificWaste ?? a.actionRef.defaultWaste ?? 0;
      const points = Math.round(co2 + water + waste);
      
      return {
        id: a.id.toString(),
        name: a.label,
        points: points,
        metadata: a.actionRef.weightedStars?.toString() || "0",
        icon: a.image ? `actions/${a.image}` : (a.actionRef.image ? `actions/${a.actionRef.image}` : '')
      };
    });
  }

  async postActionDone(childId: string, payload: any, origin?: string, instanceIdStr?: string) {
    const { instanceId } = await this.getInstanceContext(origin, instanceIdStr);
    const period = await this.getOpenPeriod(instanceId);
    
    // Support array payload format used by game v1
    const data = Array.isArray(payload) ? payload[0] : payload;
    if (!data) throw new UnauthorizedException('Payload invalide');

    // The payload might contain id_action (v1), action_id (v2) or id
    const actionIdRaw = data.id_action || data.action_id || data.id;
    const localActionId = typeof actionIdRaw === 'number' ? actionIdRaw : parseInt(actionIdRaw, 10);
    
    if (isNaN(localActionId)) {
      throw new UnauthorizedException('ID d\'action invalide (NaN)');
    }

    const action = await this.prisma.localAction.findUnique({
      where: { id: localActionId },
      include: { actionRef: true }
    });

    if (!action) throw new NotFoundException('Action introuvable');

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
      }
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
      include: { localAction: true }
    });
    return actions.map(a => ({
      id: a.id.toString(),
      child_id: a.childId.toString(),
      action_id: a.localActionId.toString(),
      action_name: a.localAction.label,
      category_id: a.localAction.categoryId?.toString() || '0',
      week_id: weekId || '1'
    }));
  }

  async getActionsDoneComplete(childId: string) {
    return this.getActionsDone(childId, '1');
  }

  async getImpact(weekId?: string, origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const impactData: any = await this.impactService.calculateImpact(schoolYear, instanceId);

    // Formate les données pour l'affichage attendu par le jeu V1
    return {
      scoreglobal: impactData.realSums.totalCo2,
      scorewater: impactData.realSums.totalWater,
      scorepollution: impactData.realSums.totalWaste,
      totalCo2: impactData.realSums.totalCo2,
      totalWater: impactData.realSums.totalWater,
      totalWaste: impactData.realSums.totalWaste,
      
      // Résultats supplémentaires issus de la nouvelle logique
      depassementnombreplanetes: impactData.results.nbPlanetes,
      jourdepassementavec: impactData.results.dateDepassement,
      jourdepassementsans: impactData.results.dateDepassementSans,
      
      bravotitre: "Génial !",
      bravotext: `Vous avez un impact positif direct aujourd'hui : vos actions ont permis d'économiser collectivement des tonnes de CO2, beaucoup d'eau et d'éviter des déchets !`,
      deblocageanimal: "Continuez comme ça pour débloquer le prochain animal !",
      animalnum: (await this.animalUnlockService.getCurrentUnlock(instanceId, schoolYear)).animalsUnlocked,
    };
  }

  async getTeams(origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const teams = await this.prisma.team.findMany({
      where: { instanceId, schoolYear }
    });
    return teams.map(t => ({
      id: t.id.toString(),
      name: t.name,
      color: t.color || '#40916C',
      icon: t.icon ? `teams/${t.icon.split('/').pop()}` : 'teams/Chat.png'
    }));
  }

  async getTeamsTotal(weekId: string, origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const period = await this.prisma.period.findFirst({ where: { instanceId, schoolYear, isOpen: true } });
    if (!period) return [];

    const teams = await this.prisma.team.findMany({
      where: { instanceId, schoolYear },
      include: {
        groups: {
          include: {
            children: {
              include: {
                actionsDone: {
                  where: {
                    period: { schoolYear }
                  }
                }
              }
            }
          }
        }
      }
    });

    return teams.map(t => {
      let total = 0;
      let weekTotal = 0;
      t.groups.forEach(g => {
        g.children.forEach(c => {
          total += c.actionsDone.length;
          c.actionsDone.forEach(a => {
            if (a.periodId === period.id) {
              weekTotal += 1;
            }
          });
        });
      });
      return {
        id: t.id.toString(),
        team_id: t.id.toString(),
        count_total: total,
        count_week: weekTotal,
        total_points: total
      };
    });
  }

  async getSchool(origin?: string, instanceIdStr?: string) {
    const { instanceId } = await this.getInstanceContext(origin, instanceIdStr);
    const inst = await this.prisma.instance.findUnique({ where: { id: instanceId } });
    if (!inst) throw new NotFoundException('Ecole introuvable');
    return {
      name: inst.schoolName,
      objective: 1000, // À dynamiser si besoin
      numchapter: inst.unlockedChapters // Ajout pour débloquer l'histoire dans le jeu v1
    };
  }

  async getWeek(origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const period = await this.prisma.period.findFirst({ where: { instanceId, schoolYear, isOpen: true } });
    if (!period) return {};
    return {
      id: period.id.toString(),
      name: `Période ouverte`,
      start_date: period.startDate,
      end_date: period.endDate,
      begin: period.startDate, // Alias pour le jeu v1
      end: period.endDate,     // Alias pour le jeu v1
      status: period.isOpen ? '1' : '0'
    };
  }

  async getChildren(origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const children = await this.prisma.child.findMany({
      where: {
        group: { team: { instanceId, schoolYear } }
      },
      include: { group: { include: { team: true } } }
    });
    return children.map(c => ({
      id: c.id.toString(),
      pseudo: c.pseudo,
      team_id: c.group.teamId.toString(),
      group_id: c.groupId.toString()
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
      include: { group: { include: { team: true } } }
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
      team_name: child.group.team.name
    };
  }

  async getActions(origin?: string, instanceIdStr?: string) {
    const { instanceId, schoolYear } = await this.getInstanceContext(origin, instanceIdStr);
    const actions = await this.prisma.localAction.findMany({
      where: { instanceId, schoolYear },
      include: { actionRef: true }
    });
    return actions.map(a => ({
      id: a.id.toString(),
      name: a.label,
      description: a.description,
      co2: a.specificCo2 ?? a.actionRef.defaultCo2 ?? 0,
      water: a.specificWater ?? a.actionRef.defaultWater ?? 0,
      waste: a.specificWaste ?? a.actionRef.defaultWaste ?? 0,
      category_id: a.categoryId?.toString() || '0',
      icon: a.image ? `actions/${a.image}` : (a.actionRef.image ? `actions/${a.actionRef.image}` : '')
    }));
  }
}
