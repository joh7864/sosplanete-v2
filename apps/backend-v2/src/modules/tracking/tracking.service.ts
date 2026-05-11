import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as Papa from 'papaparse';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async getTrackingStats(instanceId: number, schoolYear: string, instanceYearIdDirect?: number) {
    const instance = await this.prisma.instance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException(`Instance #${instanceId} non trouvée`);

    // Court-circuit : si instanceYearId fourni, pas besoin de résolution
    const instanceYear = instanceYearIdDirect
      ? await this.prisma.instanceYear.findUnique({ where: { id: instanceYearIdDirect } })
      : await this.prisma.instanceYear.findUnique({
          where: { instanceId_schoolYear: { instanceId, schoolYear } },
        });
    if (!instanceYear) throw new NotFoundException(`Aucune InstanceYear pour instance ${instanceId} / ${schoolYear}`);

    const config = await this.prisma.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });

    // 1. Périodes de l'InstanceYear
    const dbPeriods = await this.prisma.period.findMany({
      where: { instanceYearId: instanceYear.id },
      orderBy: { startDate: 'asc' },
    });

    // 2. Actions liées aux périodes
    const allPeriodIds = dbPeriods.map(p => p.id);
    const actions = await this.prisma.actionDone.findMany({
      where: {
        child: { group: { team: { instanceYearId: instanceYear.id } } },
        periodId: { in: allPeriodIds },
      },
    });

    const activePeriodIds = new Set(actions.map(a => a.periodId));
    const maxPeriodsCount = config?.gamePeriodsCount || 24;
    const periodsToDisplay = dbPeriods.filter((p, index) =>
      index < maxPeriodsCount || activePeriodIds.has(p.id)
    );

    const periodsCount = periodsToDisplay.length;
    const periodIdToIndex = new Map<number, number>();
    const periodsHeader = periodsToDisplay.map((p, i) => {
      periodIdToIndex.set(p.id, i);
      return { label: `S${i + 1}`, start: p.startDate.toISOString(), end: p.endDate.toISOString() };
    });

    // 3. Tous les enfants
    const allChildren = await this.prisma.child.findMany({
      where: { group: { team: { instanceYearId: instanceYear.id } } },
      include: { group: { include: { team: true } } },
    });

    // 4. Stats par enfant
    const childrenStats = allChildren.map((child) => {
      const weeks = Array(periodsCount).fill(0);
      let total = 0;
      actions.filter(a => a.childId === child.id).forEach(action => {
        const weekIndex = periodIdToIndex.get(action.periodId);
        if (weekIndex !== undefined && weekIndex < periodsCount) { weeks[weekIndex]++; total++; }
      });
      return {
        id:        child.id,
        pseudo:    child.pseudo,
        teamId:    child.group.team.id,
        teamName:  child.group.team.name,
        groupId:   child.group.id,
        groupName: child.group.name,
        avatar:    child.avatar,
        weeks,
        total,
      };
    });

    const weeklyTotals = Array(periodsCount).fill(0);
    childrenStats.forEach(c => c.weeks.forEach((count, i) => { weeklyTotals[i] += count; }));

    return {
      config: { startDate: config?.gameStartDate?.toISOString() || new Date(new Date().getFullYear(), 0, 1).toISOString(), periodsCount },
      periods:      periodsHeader,
      children:     childrenStats,
      weeklyTotals,
      grandTotal:   weeklyTotals.reduce((a, b) => a + b, 0),
    };
  }

  async importActionsCsv(instanceId: number, csvContent: string, schoolYear: string, instanceYearIdDirect?: number) {
    const results = Papa.parse(csvContent, { header: true, skipEmptyLines: true, delimiter: ';' });
    const rows   = results.data as any[];
    const errors: string[] = [];
    const validData: any[] = [];

    // Court-circuit : si instanceYearId fourni, pas besoin de résolution
    const instanceYear = instanceYearIdDirect
      ? await this.prisma.instanceYear.findUnique({ where: { id: instanceYearIdDirect } })
      : await this.prisma.instanceYear.findUnique({
          where: { instanceId_schoolYear: { instanceId, schoolYear } },
        });
    if (!instanceYear) throw new NotFoundException(`Aucune InstanceYear pour instance ${instanceId} / ${schoolYear}`);

    const config      = await this.prisma.gameConfig.findUnique({ where: { instanceId_schoolYear: { instanceId, schoolYear } } });
    const maxPeriods  = config?.gamePeriodsCount || 24;

    const [allChildren, allLocalActions, allActionRefs, allPeriods, allCategories] = await Promise.all([
      this.prisma.child.findMany({
        where:   { group: { team: { instanceYearId: instanceYear.id } } },
        include: { group: { include: { team: true } } },
      }),
      this.prisma.localAction.findMany({ where: { instanceId, schoolYear } }),
      this.prisma.actionRef.findMany(),
      this.prisma.period.findMany({ where: { instanceYearId: instanceYear.id } }),
      this.prisma.category.findMany({ where: { instanceYearId: instanceYear.id } }),
    ]);

    const childrenMap = new Map<string, number>();
    allChildren.forEach(c => childrenMap.set(`${c.pseudo}|${c.group.name}|${c.group.team.name}`, c.id));

    const localActionsMap = new Map<string, number>();
    allLocalActions.forEach(la => {
      const ref = allActionRefs.find(r => r.id === la.actionRefId);
      if (ref) localActionsMap.set(ref.code, la.id);
    });

    const actionRefsByCode    = new Map(allActionRefs.map(r => [r.code, r]));
    const categoriesByName    = new Map(allCategories.map(c => [c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), c.id]));
    const localActionsToCreate = new Map<string, any>();

    for (let i = 0; i < rows.length; i++) {
      const row          = rows[i];
      const lineNum      = i + 2;
      const actionRefCode = row['Action ref']?.toString().trim();
      const teamName     = row['Team']?.toString().trim();
      const groupName    = row['Group']?.toString().trim();
      const childPseudo  = row['Children']?.toString().trim();
      const dateStr      = row['Date']?.toString().trim();

      if (!actionRefCode || !teamName || !groupName || !childPseudo || !dateStr) {
        errors.push(`Ligne ${lineNum}: Données obligatoires manquantes.`); continue;
      }

      const childId = childrenMap.get(`${childPseudo}|${groupName}|${teamName}`);
      if (!childId) { errors.push(`Ligne ${lineNum}: Enfant/Groupe/Équipe inconnu.`); continue; }

      let localActionId = localActionsMap.get(actionRefCode);
      if (!localActionId) {
        const actionRef = actionRefsByCode.get(actionRefCode);
        if (!actionRef) { errors.push(`Ligne ${lineNum}: Code action "${actionRefCode}" inconnu.`); continue; }
        if (!localActionsToCreate.has(actionRefCode)) localActionsToCreate.set(actionRefCode, actionRef);
        localActionId = -1;
      }

      const parts   = dateStr.split('/');
      const dateObj = parts.length === 3
        ? new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        : new Date(dateStr);

      if (isNaN(dateObj.getTime())) { errors.push(`Ligne ${lineNum}: Date invalide "${dateStr}".`); continue; }

      const period = allPeriods.find(p => dateObj >= p.startDate && dateObj <= p.endDate);
      if (!period) { errors.push(`Ligne ${lineNum}: Date "${dateStr}" hors période (S1-S${maxPeriods}).`); continue; }

      validData.push({
        actionRefCode, childId, localActionId,
        createdAt:  dateObj,
        periodId:   period.id,
        savedCo2:   parseFloat(row['Eco tCO2e']?.toString().replace(',', '.') || '0'),
        savedWater: parseFloat(row['Eco eau']?.toString().replace(',', '.') || '0'),
        savedWaste: parseFloat(row['Eco dechets']?.toString().replace(',', '.') || '0'),
      });
    }

    if (localActionsToCreate.size > 0 && validData.length > 0) {
      for (const [code, actionRef] of localActionsToCreate.entries()) {
        let catId: number | null = null;
        if (actionRef.category) {
          const normCat = actionRef.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          catId = categoriesByName.get(normCat) || null;
        }
        const created = await this.prisma.localAction.create({
          data: { label: actionRef.referenceName, actionRefId: actionRef.id, instanceId, schoolYear, categoryId: catId,
                  specificCo2: actionRef.defaultCo2 || 0, specificWater: actionRef.defaultWater || 0, specificWaste: actionRef.defaultWaste || 0 },
        });
        localActionsMap.set(code, created.id);
      }
      for (const entry of validData) {
        if (entry.localActionId === -1) entry.localActionId = localActionsMap.get(entry.actionRefCode);
        delete entry.actionRefCode;
      }
    } else {
      for (const entry of validData) delete entry.actionRefCode;
    }

    // Suppression des anciennes actions de l'InstanceYear
    if (validData.length > 0) {
      await this.prisma.actionDone.deleteMany({
        where: {
          period:  { instanceYearId: instanceYear.id },
          child:   { group: { team: { instanceYearId: instanceYear.id } } },
        },
      });
    }

    const chunkSize = 5000;
    for (let i = 0; i < validData.length; i += chunkSize) {
      await this.prisma.actionDone.createMany({ data: validData.slice(i, i + chunkSize), skipDuplicates: false });
    }

    return { imported: validData.length, total: rows.length, errors: errors.slice(0, 500), hasMoreErrors: errors.length > 500 };
  }
}
