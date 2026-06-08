import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const instances = await prisma.instance.findMany();
  console.log('Instances en base :', instances.map(i => i.schoolName));

  const groupir = await prisma.instance.findFirst({
    where: { schoolName: { contains: 'Groupir', mode: 'insensitive' } }
  });

  if (!groupir) {
    console.log('Instance Groupir non trouvée');
    return;
  }

  const childCount = await prisma.child.count({
    where: { group: { team: { instanceYear: { instanceId: groupir.id } } } }
  });

  const actionsCount = await prisma.actionDone.count({
    where: { period: { instanceYear: { instanceId: groupir.id } } }
  });

  const sums = await prisma.actionDone.aggregate({
    where: { period: { instanceYear: { instanceId: groupir.id } } },
    _sum: {
      savedCo2: true,
      savedWater: true,
      savedWaste: true
    }
  });

  console.log('--- Diagnostic Groupir ---');
  console.log('ID Instance:', groupir.id);
  console.log('Nombre d\'enfants en base:', childCount);
  console.log('Nombre d\'actions saisies:', actionsCount);
  console.log('Cumul CO2 (kg):', sums._sum.savedCo2);
  console.log('Cumul Eau (L):', sums._sum.savedWater);
  console.log('Cumul Déchets (kg):', sums._sum.savedWaste);
}

check().finally(() => prisma.$disconnect());
