import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  const instanceId = parseInt(process.argv[2]);
  if (!instanceId) {
    console.error('Usage: npx tsx scripts/import-excel-actions.ts <instanceId>');
    process.exit(1);
  }

  const filePath = join(__dirname, '..', '..', '..', '.docs', '3-fct', 'Actions_realisees.xlsx');
  console.log(`Loading Excel file from: ${filePath}`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = 'exporttestng';
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    console.error(`Sheet "${sheetName}" not found in Excel file.`);
    process.exit(1);
  }

  const data = XLSX.utils.sheet_to_json(worksheet) as any[];
  console.log(`Found ${data.length} rows to process in "${sheetName}"`);

  // Cache pour éviter de recréer les mêmes entités
  const teamsCache = new Map<string, any>();
  const groupsCache = new Map<string, any>();
  const childrenCache = new Map<string, any>();
  const localActionsCache = new Map<string, any>();

  let importedCount = 0;

  for (const row of data) {
    const { Team, Group, Children, 'Action ref': actionRefCode, Date: actionDateExcel } = row;

    if (!Team || !Group || !Children || !actionRefCode) continue;

    // 1. Gérer la Team
    let team = teamsCache.get(Team);
    if (!team) {
      team = await prisma.team.upsert({
        where: { id: -1 }, // N'existe pas
        create: { name: Team, instanceId },
        update: {},
        // @ts-ignore
        where: { name_instanceId: { name: Team, instanceId } } // Nécessite @@unique([name, instanceId])
      }).catch(async () => {
         // Fallback si pas de contrainte unique composite
         const existing = await prisma.team.findFirst({ where: { name: Team, instanceId } });
         return existing || prisma.team.create({ data: { name: Team, instanceId } });
      });
      teamsCache.set(Team, team);
    }

    // 2. Gérer le Groupe
    const groupKey = `${Team}-${Group}`;
    let group = groupsCache.get(groupKey);
    if (!group) {
      const existing = await prisma.group.findFirst({ where: { name: Group, teamId: team.id } });
      group = existing || await prisma.group.create({ data: { name: Group, teamId: team.id } });
      groupsCache.set(groupKey, group);
    }

    // 3. Gérer l'Enfant
    const childKey = `${groupKey}-${Children}`;
    let child = childrenCache.get(childKey);
    if (!child) {
      const existing = await prisma.child.findFirst({ where: { pseudo: Children, groupId: group.id } });
      child = existing || await prisma.child.create({ data: { pseudo: Children, groupId: group.id } });
      childrenCache.set(childKey, child);
    }

    // 4. Gérer l'Action Locale (Lien vers Action Ref)
    let localAction = localActionsCache.get(actionRefCode);
    if (!localAction) {
      const ref = await prisma.actionRef.findUnique({ where: { code: actionRefCode } });
      if (!ref) {
        console.warn(`ActionRef Code "${actionRefCode}" introuvable.`);
        continue;
      }

      const existing = await prisma.localAction.findFirst({ 
        where: { actionRefId: ref.id, instanceId } 
      });
      
      localAction = existing || await prisma.localAction.create({
        data: {
          label: ref.referenceName,
          actionRefId: ref.id,
          instanceId,
          specificCo2: ref.defaultCo2 || 0,
          specificWater: ref.defaultWater || 0,
          specificWaste: ref.defaultWaste || 0,
        }
      });
      localActionsCache.set(actionRefCode, localAction);
    }

    // 5. Créer l'ActionRéalisée (ActionDone)
    const date = typeof actionDateExcel === 'number' 
      ? new Date((actionDateExcel - 25569) * 86400 * 1000) 
      : new Date(actionDateExcel);

    // Trouver ou créer une période (Period) pour cette date
    // Note: Le système utilise des périodes. S'il n'y en a pas, on en crée une bidon ou on cherche la correspondante.
    // Pour simplifier l'import "historique", on va chercher la période de l'instance.
    const period = await prisma.period.findFirst({
        where: { instanceId, startDate: { lte: date }, endDate: { gte: date } }
    }) || await prisma.period.findFirst({ where: { instanceId } });

    if (!period) {
        // Créer une période par défaut si aucune n'existe
        const defaultPeriod = await prisma.period.create({
            data: {
                instanceId,
                startDate: new Date('2024-09-01'),
                endDate: new Date('2025-07-01')
            }
        });
        // On utilisera celle-ci
    }

    await prisma.actionDone.create({
      data: {
        childId: child.id,
        localActionId: localAction.id,
        createdAt: date,
        periodId: period?.id || (await prisma.period.findFirst({ where: { instanceId } }))?.id || 1,
        savedCo2: localAction.specificCo2,
        savedWater: localAction.specificWater,
        savedWaste: localAction.specificWaste,
      }
    });

    importedCount++;
    if (importedCount % 100 === 0) console.log(`Processed ${importedCount} actions...`);
  }

  console.log(`\nImport terminé avec succès !`);
  console.log(`${importedCount} actions importées pour l'instance #${instanceId}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
