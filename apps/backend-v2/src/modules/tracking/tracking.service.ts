import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as Papa from 'papaparse';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async getTrackingStats(instanceId: number) {
    const instance = await this.prisma.instance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException(`Instance #${instanceId} non trouvée`);
    }

    const startDate = instance.gameStartDate || instance.createdAt;
    const periodsCount = instance.gamePeriodsCount || 24;

    // Récupérer toutes les actions de l'instance
    const actions = await this.prisma.actionDone.findMany({
      where: {
        child: { group: { team: { instanceId } } },
      },
      include: {
        child: {
          include: {
            group: {
              include: { team: true },
            },
          },
        },
      },
    });

    // Récupérer tous les enfants de l'instance pour s'assurer qu'ils apparaissent même sans actions
    const allChildren = await this.prisma.child.findMany({
      where: { group: { team: { instanceId } } },
      include: {
        group: {
          include: { team: true },
        },
      },
    });

    // Structure de réponse
    const childrenStats = allChildren.map((child) => {
      const weeks = Array(periodsCount).fill(0);
      let total = 0;

      // Filtrer les actions de cet enfant
      const childActions = actions.filter((a) => a.childId === child.id);

      childActions.forEach((action) => {
        const actionDate = new Date(action.createdAt);
        const diffMs = actionDate.getTime() - new Date(startDate).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);

        if (weekIndex >= 0 && weekIndex < periodsCount) {
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

    // Calculer les totaux par semaine
    const weeklyTotals = Array(periodsCount).fill(0);
    childrenStats.forEach((c) => {
      c.weeks.forEach((count, i) => {
        weeklyTotals[i] += count;
      });
    });

    // Générer les en-têtes de périodes (dates)
    const periods = Array(periodsCount)
      .fill(null)
      .map((_, i) => {
        const start = new Date(startDate);
        start.setDate(start.getDate() + i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        return {
          label: `S${i + 1}`,
          start: start.toISOString(),
          end: end.toISOString(),
        };
      });

    return {
      config: {
        startDate: startDate.toISOString(),
        periodsCount,
      },
      periods,
      children: childrenStats,
      weeklyTotals,
      grandTotal: weeklyTotals.reduce((a, b) => a + b, 0),
    };
  }

  async importActionsCsv(instanceId: number, csvContent: string) {
    const results = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
    });

    const rows = results.data as any[];
    const errors: string[] = [];
    const validData: any[] = [];

    // 1. Récupération de l'instance pour les paramètres de jeu
    const instance = await this.prisma.instance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException(`Instance #${instanceId} non trouvée`);
    const maxPeriods = instance.gamePeriodsCount || 24;

    const [allChildren, allLocalActions, allActionRefs, allPeriods] = await Promise.all([
      this.prisma.child.findMany({
        where: { group: { team: { instanceId } } },
        include: { group: { include: { team: true } } },
      }),
      this.prisma.localAction.findMany({
        where: { instanceId },
      }),
      this.prisma.actionRef.findMany(),
      this.prisma.period.findMany({
        where: { instanceId },
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

      const actionRefCode = row['Arction ref']?.toString().trim();
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

    // 5. Batch Insert par paquets de 5000 pour éviter les limites de requête
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
