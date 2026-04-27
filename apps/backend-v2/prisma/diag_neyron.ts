import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const neyron = await prisma.instance.findFirst({ where: { schoolName: 'Neyron' } });
  if (!neyron) {
    console.log('Instance Neyron non trouvée');
    return;
  }

  const childCount = await prisma.child.count({
    where: { group: { team: { instanceId: neyron.id } } }
  });

  const actionsCount = await prisma.actionDone.count({
    where: { period: { instanceId: neyron.id } }
  });

  const sums = await prisma.actionDone.aggregate({
    where: { period: { instanceId: neyron.id } },
    _sum: {
      savedCo2: true,
      savedWater: true,
      savedWaste: true
    }
  });

  console.log('--- Diagnostic Neyron ---');
  console.log('ID Instance:', neyron.id);
  console.log('Nombre d\'enfants en base:', childCount);
  console.log('Nombre d\'actions saisies:', actionsCount);
  console.log('Cumul CO2 (kg):', sums._sum.savedCo2);
  console.log('Cumul Eau (L):', sums._sum.savedWater);
  console.log('Cumul Déchets (kg):', sums._sum.savedWaste);
}

check().finally(() => prisma.$disconnect());
