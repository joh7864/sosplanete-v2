import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as Papa from 'papaparse';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async getTrackingStats(
    instanceId: number,
    schoolYear: string,
    instanceYearIdDirect?: number,
  ) {
    const instance = await this.prisma.instance.findUnique({
      where: { id: instanceId },
    });
    if (!instance)
      throw new NotFoundException(`Instance #${instanceId} non trouvée`);

    // Court-circuit : si instanceYearId fourni, pas besoin de résolution
    const instanceYear = instanceYearIdDirect
      ? await this.prisma.instanceYear.findUnique({
          where: { id: instanceYearIdDirect },
        })
      : await this.prisma.instanceYear.findUnique({
          where: { instanceId_schoolYear: { instanceId, schoolYear } },
        });
    if (!instanceYear)
      throw new NotFoundException(
        `Aucune InstanceYear pour instance ${instanceId} / ${schoolYear}`,
      );

    const config = await this.prisma.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });

    // 1. Périodes de l'InstanceYear
    const dbPeriods = await this.prisma.period.findMany({
      where: { instanceYearId: instanceYear.id },
      orderBy: { startDate: 'asc' },
    });

    // 2. Actions liées aux périodes
    const allPeriodIds = dbPeriods.map((p) => p.id);
    const actions = await this.prisma.actionDone.findMany({
      where: {
        child: { group: { team: { instanceYearId: instanceYear.id } } },
        periodId: { in: allPeriodIds },
      },
    });

    const activePeriodIds = new Set(actions.map((a) => a.periodId));
    const maxPeriodsCount = config?.gamePeriodsCount || 24;
    const periodsToDisplay = dbPeriods.filter(
      (p, index) => index < maxPeriodsCount || activePeriodIds.has(p.id),
    );

    const periodsCount = periodsToDisplay.length;
    const periodIdToIndex = new Map<number, number>();
    const periodsHeader = periodsToDisplay.map((p, i) => {
      periodIdToIndex.set(p.id, i);
      return {
        label: `S${i + 1}`,
        start: p.startDate.toISOString(),
        end: p.endDate.toISOString(),
      };
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
      actions
        .filter((a) => a.childId === child.id)
        .forEach((action) => {
          const weekIndex = periodIdToIndex.get(action.periodId);
          if (weekIndex !== undefined && weekIndex < periodsCount) {
            weeks[weekIndex]++;
            total++;
          }
        });
      return {
        id: child.id,
        pseudo: child.pseudo,
        teamId: child.group.team.id,
        teamName: child.group.team.name,
        groupId: child.group.id,
        groupName: child.group.name,
        avatar: child.avatar,
        weeks,
        total,
      };
    });

    const weeklyTotals = Array(periodsCount).fill(0);
    childrenStats.forEach((c) =>
      c.weeks.forEach((count, i) => {
        weeklyTotals[i] += count;
      }),
    );

    return {
      config: {
        startDate:
          config?.gameStartDate?.toISOString() ||
          new Date(new Date().getFullYear(), 0, 1).toISOString(),
        periodsCount,
      },
      periods: periodsHeader,
      children: childrenStats,
      weeklyTotals,
      grandTotal: weeklyTotals.reduce((a, b) => a + b, 0),
    };
  }

  async importActionsCsv(
    instanceId: number,
    csvContent: string,
    schoolYear: string,
    instanceYearIdDirect?: number,
  ) {
    const results = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
    });
    const rows = results.data as any[];
    const errors: {
      line: number;
      columns?: string;
      value?: string;
      message: string;
    }[] = [];
    const validData: any[] = [];

    // Court-circuit : si instanceYearId fourni, pas besoin de résolution
    const instanceYear = instanceYearIdDirect
      ? await this.prisma.instanceYear.findUnique({
          where: { id: instanceYearIdDirect },
        })
      : await this.prisma.instanceYear.findUnique({
          where: { instanceId_schoolYear: { instanceId, schoolYear } },
        });
    if (!instanceYear)
      throw new NotFoundException(
        `Aucune InstanceYear pour instance ${instanceId} / ${schoolYear}`,
      );

    const config = await this.prisma.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });
    const maxPeriods = config?.gamePeriodsCount || 24;

    const [
      allChildren,
      allLocalActions,
      allActionRefs,
      allPeriods,
      allCategories,
    ] = await Promise.all([
      this.prisma.child.findMany({
        where: { group: { team: { instanceYearId: instanceYear.id } } },
        include: { group: { include: { team: true } } },
      }),
      this.prisma.localAction.findMany({ where: { instanceId, schoolYear } }),
      this.prisma.actionRef.findMany(),
      this.prisma.period.findMany({
        where: { instanceYearId: instanceYear.id },
      }),
      this.prisma.category.findMany({
        where: { instanceYearId: instanceYear.id },
      }),
    ]);

    const childrenMap = new Map<string, number>();
    allChildren.forEach((c) =>
      childrenMap.set(`${c.pseudo}|${c.group.name}|${c.group.team.name}`, c.id),
    );

    const localActionsMap = new Map<string, number>();
    allLocalActions.forEach((la) => {
      const ref = allActionRefs.find((r) => r.id === la.actionRefId);
      if (ref) localActionsMap.set(ref.code, la.id);
    });

    const actionRefsByCode = new Map(allActionRefs.map((r) => [r.code, r]));
    const categoriesByName = new Map(
      allCategories.map((c) => [
        c.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
        c.id,
      ]),
    );
    const localActionsToCreate = new Map<string, any>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2;
      const actionRefCode = row['Action ref']?.toString().trim();
      const teamName = row['Team']?.toString().trim();
      const groupName = row['Group']?.toString().trim();
      const childPseudo = row['Children']?.toString().trim();
      const dateStr = row['Date']?.toString().trim();

      const missingFields: string[] = [];
      if (!actionRefCode) missingFields.push('Action ref');
      if (!teamName) missingFields.push('Team');
      if (!groupName) missingFields.push('Group');
      if (!childPseudo) missingFields.push('Children');
      if (!dateStr) missingFields.push('Date');

      if (missingFields.length > 0) {
        errors.push({
          line: lineNum,
          columns: missingFields.join(', '),
          value: '',
          message: `Colonnes obligatoires manquantes : ${missingFields.join(', ')}`,
        });
        continue;
      }

      const childId = childrenMap.get(
        `${childPseudo}|${groupName}|${teamName}`,
      );
      if (!childId) {
        errors.push({
          line: lineNum,
          columns: 'Children, Group, Team',
          value: `${childPseudo} | ${groupName} | ${teamName}`,
          message: `L'élève "${childPseudo}" n'a pas pu être trouvé dans le groupe "${groupName}" de l'équipe "${teamName}".`,
        });
        continue;
      }

      let localActionId = localActionsMap.get(actionRefCode);
      if (!localActionId) {
        const actionRef = actionRefsByCode.get(actionRefCode);
        if (!actionRef) {
          errors.push({
            line: lineNum,
            columns: 'Action ref',
            value: actionRefCode,
            message: `Le code d'action "${actionRefCode}" n'est pas reconnu dans le système.`,
          });
          continue;
        }
        if (!localActionsToCreate.has(actionRefCode))
          localActionsToCreate.set(actionRefCode, actionRef);
        localActionId = -1;
      }

      const parts = dateStr.split('/');
      const dateObj =
        parts.length === 3
          ? new Date(
              parseInt(parts[2]),
              parseInt(parts[1]) - 1,
              parseInt(parts[0]),
            )
          : new Date(dateStr);

      if (isNaN(dateObj.getTime())) {
        errors.push({
          line: lineNum,
          columns: 'Date',
          value: dateStr,
          message: `La date "${dateStr}" a un format invalide (format attendu : JJ/MM/AAAA).`,
        });
        continue;
      }

      const period = allPeriods.find(
        (p) => dateObj >= p.startDate && dateObj <= p.endDate,
      );
      if (!period) {
        errors.push({
          line: lineNum,
          columns: 'Date',
          value: dateStr,
          message: `La date "${dateStr}" est en dehors de la période active du jeu (S1 à S${maxPeriods}).`,
        });
        continue;
      }

      const ref = actionRefsByCode.get(actionRefCode);
      let pCo2 = parseFloat(
        row['Eco tCO2e']?.toString().replace(',', '.') || '0',
      );
      let pWater = parseFloat(
        row['Eco eau']?.toString().replace(',', '.') || '0',
      );
      let pWaste = parseFloat(
        row['Eco dechets']?.toString().replace(',', '.') || '0',
      );

      if (isNaN(pCo2) || pCo2 === 0) pCo2 = ref?.defaultCo2 ?? 0;
      if (isNaN(pWater) || pWater === 0) pWater = ref?.defaultWater ?? 0;
      if (isNaN(pWaste) || pWaste === 0) pWaste = ref?.defaultWaste ?? 0;

      validData.push({
        actionRefCode,
        childId,
        localActionId,
        createdAt: dateObj,
        periodId: period.id,
        savedCo2: pCo2,
        savedWater: pWater,
        savedWaste: pWaste,
      });
    }

    if (localActionsToCreate.size > 0 && validData.length > 0) {
      for (const [code, actionRef] of localActionsToCreate.entries()) {
        let catId: number | null = null;
        if (actionRef.category) {
          const normCat = actionRef.category
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          catId = categoriesByName.get(normCat) || null;
        }
        const created = await this.prisma.localAction.create({
          data: {
            label: actionRef.referenceName,
            actionRefId: actionRef.id,
            instanceId,
            schoolYear,
            categoryId: catId,
            specificCo2: actionRef.defaultCo2 || 0,
            specificWater: actionRef.defaultWater || 0,
            specificWaste: actionRef.defaultWaste || 0,
          },
        });
        localActionsMap.set(code, created.id);
      }
      for (const entry of validData) {
        if (entry.localActionId === -1)
          entry.localActionId = localActionsMap.get(entry.actionRefCode);
        delete entry.actionRefCode;
      }
    } else {
      for (const entry of validData) delete entry.actionRefCode;
    }

    // Suppression des anciennes actions de l'InstanceYear
    if (validData.length > 0) {
      await this.prisma.actionDone.deleteMany({
        where: {
          period: { instanceYearId: instanceYear.id },
          child: { group: { team: { instanceYearId: instanceYear.id } } },
        },
      });
    }

    const chunkSize = 5000;
    for (let i = 0; i < validData.length; i += chunkSize) {
      await this.prisma.actionDone.createMany({
        data: validData.slice(i, i + chunkSize),
        skipDuplicates: false,
      });
    }

    return {
      imported: validData.length,
      total: rows.length,
      errors: errors.slice(0, 500),
      hasMoreErrors: errors.length > 500,
    };
  }

  async exportActionsCsv(
    instanceId: number,
    schoolYear: string,
    instanceYearIdDirect?: number,
  ) {
    const instanceYear = instanceYearIdDirect
      ? await this.prisma.instanceYear.findUnique({
          where: { id: instanceYearIdDirect },
          include: { instance: true },
        })
      : await this.prisma.instanceYear.findUnique({
          where: { instanceId_schoolYear: { instanceId, schoolYear } },
          include: { instance: true },
        });

    if (!instanceYear) {
      throw new NotFoundException(
        `Aucune InstanceYear pour instance ${instanceId} / ${schoolYear}`,
      );
    }

    const periods = await this.prisma.period.findMany({
      where: { instanceYearId: instanceYear.id },
      orderBy: { startDate: 'asc' },
    });
    const periodMap = new Map<number, string>();
    periods.forEach((p, idx) => {
      periodMap.set(p.id, `S${idx + 1}`);
    });

    const actions = await this.prisma.actionDone.findMany({
      where: {
        child: { group: { team: { instanceYearId: instanceYear.id } } },
      },
      include: {
        child: {
          include: {
            group: {
              include: {
                team: true,
              },
            },
          },
        },
        localAction: {
          include: {
            actionRef: true,
          },
        },
        period: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const rows = actions.map((a) => {
      const d = new Date(a.createdAt);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const dateFormatted = `${day}/${month}/${year}`;

      return {
        'Action ref':
          a.localAction?.actionRef?.code || a.localAction?.label || '',
        Action: a.localAction?.label || '',
        Team: a.child?.group?.team?.name || '',
        Group: a.child?.group?.name || '',
        Children: a.child?.pseudo || '',
        Date: dateFormatted,
        Periode: periodMap.get(a.periodId) || `P${a.periodId}`,
        'Eco tCO2e': (a.savedCo2 ?? 0).toString().replace('.', ','),
        'Eco eau': (a.savedWater ?? 0).toString().replace('.', ','),
        'Eco dechets': (a.savedWaste ?? 0).toString().replace('.', ','),
        'Eco energie': (a.savedEnergy ?? 0).toString().replace('.', ','),
      };
    });

    const csvContent = Papa.unparse(rows, {
      delimiter: ';',
      quotes: true,
    });

    const rawName =
      instanceYear.instance?.schoolName || `instance_${instanceId}`;
    const instanceName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `actions_done_${instanceName}_${schoolYear}.csv`;

    return {
      csvContent,
      filename,
      count: rows.length,
    };
  }
}
