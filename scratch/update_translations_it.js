const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../apps/backend-v2/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const translations = await prisma.evoeMissionTranslation.findMany({
    include: {
      localAction: {
        include: {
          actionRef: true
        }
      }
    }
  });

  console.log(`Found ${translations.length} translations to update.`);
  let updatedCount = 0;

  for (const t of translations) {
    const action = t.localAction;
    if (!action) continue;

    const co2 = action.specificCo2 ?? action.actionRef?.defaultCo2 ?? 0;
    const water = action.specificWater ?? action.actionRef?.defaultWater ?? 0;
    const waste = action.specificWaste ?? action.actionRef?.defaultWaste ?? 0;
    const calculated = 10 + Math.round((12 * co2) + (4 * waste) + (0.04 * water));

    await prisma.evoeMissionTranslation.update({
      where: { id: t.id },
      data: {
        pointsGagnes: calculated
      }
    });
    updatedCount++;
    if (action.actionRef?.code === 'B05') {
      console.log(`Updated B05 -> pointsGagnes = ${calculated} IT`);
    }
  }

  console.log(`Successfully updated ${updatedCount} translations in DB.`);
}

main().finally(() => prisma.$disconnect());
