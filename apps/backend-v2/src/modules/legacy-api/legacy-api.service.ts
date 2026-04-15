import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class LegacyApiService {
  constructor(private prisma: PrismaService) {}

  async getInstanceId(origin?: string): Promise<number> {
    if (origin) {
      const inst = await this.prisma.instance.findFirst({
        where: { hostUrl: { contains: origin }, isOpen: true }
      });
      if (inst) return inst.id;
    }
    const fallback = await this.prisma.instance.findFirst({ where: { isOpen: true } });
    if (!fallback) throw new NotFoundException('Aucune école ouverte.');
    return fallback.id;
  }

  async getOpenPeriod(instanceId: number) {
    const period = await this.prisma.period.findFirst({ where: { instanceId, isOpen: true } });
    if (!period) throw new NotFoundException('Aucune période de jeu ouverte.');
    return period;
  }

  async getCategories(origin?: string) {
    const instanceId = await this.getInstanceId(origin);
    const cats = await this.prisma.category.findMany({
      where: { instanceId },
      orderBy: { order: 'asc' }
    });
    return cats.map(c => ({
      id: c.id.toString(),
      name: c.name,
      icon: c.icon ? c.icon.split('.')[0] : 'folder' // V1 typically doesn't use extension for icons
    }));
  }

  async getActionsByCategory(categoryId: string, origin?: string) {
    const catId = parseInt(categoryId);
    const instanceId = await this.getInstanceId(origin);
    const actions = await this.prisma.localAction.findMany({
      where: { categoryId: catId, instanceId },
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
        icon: (a.image || a.actionRef.image || '').split('.')[0]
      };
    });
  }

  async postActionDone(childId: string, payload: any, origin?: string) {
    const instanceId = await this.getInstanceId(origin);
    const period = await this.getOpenPeriod(instanceId);
    
    // The payload must contain the localActionId (sometimes mapped to action_id in v1)
    const localActionId = parseInt(payload.action_id || payload.id); 
    
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
      week_id: weekId || '1'
    }));
  }

  async getActionsDoneComplete(childId: string) {
    return this.getActionsDone(childId, '1');
  }

  async getImpact(weekId?: string, origin?: string) {
    const instanceId = await this.getInstanceId(origin);
    const period = await this.prisma.period.findFirst({ where: { instanceId, isOpen: true } });
    if (!period) return { totalCo2: 0, totalWater: 0, totalWaste: 0 };

    const actions = await this.prisma.actionDone.findMany({
      where: { periodId: period.id }
    });

    let totalCo2 = 0, totalWater = 0, totalWaste = 0;
    for (const a of actions) {
      totalCo2 += a.savedCo2;
      totalWater += a.savedWater;
      totalWaste += a.savedWaste;
    }

    return { totalCo2: Math.round(totalCo2), totalWater: Math.round(totalWater), totalWaste: Math.round(totalWaste) };
  }

  async getTeams(origin?: string) {
    const instanceId = await this.getInstanceId(origin);
    const teams = await this.prisma.team.findMany({
      where: { instanceId }
    });
    return teams.map(t => ({
      id: t.id.toString(),
      name: t.name,
      color: t.color || '#40916C',
      icon: (t.icon || '').split('.')[0]
    }));
  }

  async getTeamsTotal(weekId: string, origin?: string) {
    const instanceId = await this.getInstanceId(origin);
    const period = await this.prisma.period.findFirst({ where: { instanceId, isOpen: true } });
    if (!period) return [];

    const teams = await this.prisma.team.findMany({
      where: { instanceId },
      include: {
        groups: {
          include: {
            children: {
              include: {
                actionsDone: {
                  where: { periodId: period.id }
                }
              }
            }
          }
        }
      }
    });

    return teams.map(t => {
      let total = 0;
      t.groups.forEach(g => {
        g.children.forEach(c => {
          c.actionsDone.forEach(a => {
            total += Math.round(a.savedCo2 + a.savedWater + a.savedWaste);
          });
        });
      });
      return { team_id: t.id.toString(), total_points: total };
    });
  }

  async getSchool(origin?: string) {
    const instanceId = await this.getInstanceId(origin);
    const inst = await this.prisma.instance.findUnique({ where: { id: instanceId } });
    if (!inst) throw new NotFoundException('Ecole introuvable');
    return {
      name: inst.schoolName,
      objective: 1000 // Fixed for now or computed
    };
  }
}
