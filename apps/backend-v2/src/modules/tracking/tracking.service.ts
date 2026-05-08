import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as Papa from 'papaparse';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async getTrackingStats(instanceId: number, schoolYear: string) {
    const instance = await this.prisma.instance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException(`Instance #${instanceId} non trouvée`);
    }

    const config = await this.prisma.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } }
    });

    // 1. Récupérer les périodes réelles de l'instance pour cette année scolaire
    const dbPeriods = await this.prisma.period.findMany({
      where: { instanceId, schoolYear },
      orderBy: { startDate: 'asc' },
    });

    // 2. Récupérer les actions liées aux périodes de l'instance (pas de filtre par date)
    const allPeriodIds = dbPeriods.map(p => p.id);
    const actions = await this.prisma.actionDone.findMany({
      where: {
        child: { group: { team: { instanceId, schoolYear } } },
        period: { schoolYear },
        periodId: { in: allPeriodIds },
      },
    });

    // Filtrer pour ne garder que les périodes dans le "count" officiel,
    // ou celles qui possèdent au moins une action.
    const activePeriodIds = new Set(actions.map(a => a.periodId));
    const maxPeriodsCount = config?.gamePeriodsCount || 24;
    const periodsToDisplay = dbPeriods.filter((p, index) => 
      index < maxPeriodsCount || activePeriodIds.has(p.id)
    );

    const periodsCount = periodsToDisplay.length;
    
    // Créer une map pour retrouver l'index de la semaine par periodId
    const periodIdToIndex = new Map<number, number>();
    const periodsHeader = periodsToDisplay.map((p, i) => {
      periodIdToIndex.set(p.id, i);
      return {
        label: `S${i + 1}`,
        start: p.startDate.toISOString(),
        end: p.endDate.toISOString(),
      };
    });

    // 3. Récupérer tous les enfants
    const allChildren = await this.prisma.child.findMany({
      where: { group: { team: { instanceId, schoolYear } } },
      include: {
        group: {
          include: { team: true },
        },
      },
    });

    // 4. Calculer les statistiques par enfant
    const childrenStats = allChildren.map((child) => {
      const weeks = Array(periodsCount).fill(0);
      let total = 0;

      const childActions = actions.filter((a) => a.childId === child.id);

      childActions.forEach((action) => {
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
    childrenStats.forEach((c) => {
      c.weeks.forEach((count, i) => {
        weeklyTotals[i] += count;
      });
    });

    return {
      config: {
        startDate: config?.gameStartDate?.toISOString() || new Date(new Date().getFullYear(), 0, 1).toISOString(),
        periodsCount,
      },
      periods: periodsHeader,
      children: childrenStats,
      weeklyTotals,
      grandTotal: weeklyTotals.reduce((a, b) => a + b, 0),
    };
  }

  async importActionsCsv(instanceId: number, csvContent: string, schoolYear: string) {
    const results = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
    });

    const rows = results.data as any[];
    const errors: string[] = [];
    const validData: any[] = [];

    // 1. Récupération de l'instance pour les paramètres de jeu
    const config = await this.prisma.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } }
    });
    const maxPeriods = config?.gamePeriodsCount || 24;

    const [allChildren, allLocalActions, allActionRefs, allPeriods] = await Promise.all([
      this.prisma.child.findMany({
        where: { group: { team: { instanceId, schoolYear } } },
        include: { group: { include: { team: true } } },
      }),
      this.prisma.localAction.findMany({
        where: { instanceId, schoolYear },
      }),
      this.prisma.actionRef.findMany(),
      this.prisma.period.findMany({
        where: { instanceId, schoolYear },
      }),
    ]);

    // Indexation pour recherche rapide
    const childrenMap = new Map<string, number>(); // pseudo|groupName|teamName -> id
    allChildren.forEach(c => {
      childrenMap.set(`${c.pseudo}|${c.group.name}|${c.group.team.name}`, c.id);
    });

    const localActionsMap = new Map<string, number>(); // actionRefCode -> id
    allLocalActions.forEach(la => {
      const ref = allActionRefs.find(r => r.id === la.actionRefId);
      if (ref) localActionsMap.set(ref.code, la.id);
    });

    const actionRefsByCode = new Map(allActionRefs.map(r => [r.code, r]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2;

      const actionRefCode = row['Action ref']?.toString().trim();
      const teamName = row['Team']?.toString().trim();
      const groupName = row['Group']?.toString().trim();
      const childPseudo = row['Children']?.toString().trim();
      const dateStr = row['Date']?.toString().trim();
      
      if (!actionRefCode || !teamName || !groupName || !childPseudo || !dateStr) {
        errors.push(`Ligne ${lineNum}: Données obligatoires manquantes.`);
        continue;
      }

      // 1. Validation de l'enfant
      const childId = childrenMap.get(`${childPseudo}|${groupName}|${teamName}`);
      if (!childId) {
        errors.push(`Ligne ${lineNum}: Enfant/Groupe/Équipe inconnu (${childPseudo}/${groupName}/${teamName}).`);
        continue;
      }

      // 2. Validation de l'action
      let localActionId = localActionsMap.get(actionRefCode);
      if (!localActionId) {
        const actionRef = actionRefsByCode.get(actionRefCode);
        if (!actionRef) {
          errors.push(`Ligne ${lineNum}: Code action "${actionRefCode}" inconnu.`);
          continue;
        }

        // Création à la volée de la LocalAction si manquante (non interdit par l'utilisateur)
        const newLocalAction = await this.prisma.localAction.create({
          data: {
            label: actionRef.referenceName,
            actionRefId: actionRef.id,
            instanceId,
            schoolYear,
            specificCo2: actionRef.defaultCo2 || 0,
            specificWater: actionRef.defaultWater || 0,
            specificWaste: actionRef.defaultWaste || 0,
          },
        });
        localActionId = newLocalAction.id;
        localActionsMap.set(actionRefCode, localActionId);
      }

      // 3. Parsing date
      const parts = dateStr.split('/');
      let dateObj: Date;
      if (parts.length === 3) {
        dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        dateObj = new Date(dateStr);
      }

      if (isNaN(dateObj.getTime())) {
        errors.push(`Ligne ${lineNum}: Date invalide "${dateStr}".`);
        continue;
      }

      // 4. Trouver la période
      const period = allPeriods.find(p => dateObj >= p.startDate && dateObj <= p.endDate);
      
      if (!period) {
        errors.push(`Ligne ${lineNum}: La date "${dateStr}" ne correspond à aucune période de jeu (S1-S${maxPeriods}).`);
        continue;
      }

      validData.push({
        childId,
        localActionId,
        createdAt: dateObj,
        periodId: period.id,
        savedCo2: parseFloat(row['Eco tCO2e']?.toString().replace(',', '.') || '0'),
        savedWater: parseFloat(row['Eco eau']?.toString().replace(',', '.') || '0'),
        savedWaste: parseFloat(row['Eco dechets']?.toString().replace(',', '.') || '0'),
      });
    }

    // 5. Suppression des anciennes actions de l'instance pour cette année scolaire uniquement
    if (validData.length > 0) {
      await this.prisma.actionDone.deleteMany({
        where: {
          period: { schoolYear },
          child: { group: { team: { instanceId, schoolYear } } },
        },
      });
    }

    // 6. Batch Insert par paquets de 5000 pour éviter les limites de requête
    const chunkSize = 5000;
    for (let i = 0; i < validData.length; i += chunkSize) {
      const chunk = validData.slice(i, i + chunkSize);
      await this.prisma.actionDone.createMany({
        data: chunk,
        skipDuplicates: false,
      });
    }

    return {
      imported: validData.length,
      total: rows.length,
      errors: errors.slice(0, 500), // On peut renvoyer un peu plus de logs maintenant
      hasMoreErrors: errors.length > 500,
    };
  }
}
