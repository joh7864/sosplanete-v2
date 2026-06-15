import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';

const prisma = new PrismaClient();

async function main() {
  const csvFilePath = path.join(__dirname, '../../../.docs/3-fct/Missiosn Evoe.csv');
  console.log(`Lecture du fichier CSV: ${csvFilePath}`);

  const csvFile = fs.readFileSync(csvFilePath, 'utf8');
  
  // Parse CSV
  const parsed = Papa.parse(csvFile, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  });

  const rows = parsed.data as any[];
  console.log(`${rows.length} lignes trouvées dans le CSV.`);

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const row of rows) {
    const actionOriginale = row.action_originale?.trim();
    const missionTitre = row.mission_titre?.trim();
    const description = row.description?.trim();

    if (!actionOriginale || !missionTitre || !description) continue;

    // Chercher toutes les LocalActions correspondantes
    // (Il peut y en avoir plusieurs car elles sont instanciées par école/année)
    const localActions = await prisma.localAction.findMany({
      where: {
        label: actionOriginale
      }
    });

    if (localActions.length === 0) {
      console.warn(`⚠️ Aucune LocalAction trouvée pour: "${actionOriginale}"`);
      notFoundCount++;
      continue;
    }

    for (const la of localActions) {
      await prisma.evoeMissionTranslation.upsert({
        where: { localActionId: la.id },
        update: {
          titreSF: missionTitre,
          descriptionSF: description,
        },
        create: {
          localActionId: la.id,
          titreSF: missionTitre,
          descriptionSF: description,
          pointsGagnes: 10,
          isHacked: false,
        }
      });
      updatedCount++;
    }
  }

  console.log(`\n🎉 Import terminé !`);
  console.log(`✅ ${updatedCount} traductions Evoe insérées/mises à jour.`);
  if (notFoundCount > 0) {
    console.log(`❌ ${notFoundCount} actions du CSV n'ont pas trouvé de correspondance en base.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
