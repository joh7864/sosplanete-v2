import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Synchronisation des points IT (formule 60% CO2e, 20% Déchets, 20% Eau)...');
  
  const translations = await prisma.evoeMissionTranslation.findMany({
    include: {
      localAction: {
        include: {
          actionRef: true,
        },
      },
    },
  });

  let count = 0;
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
        pointsGagnes: calculated,
      },
    });
    count++;
  }

  console.log(`✅ ${count} fiches de missions synchronisées avec succès en base de données.`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la synchronisation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
