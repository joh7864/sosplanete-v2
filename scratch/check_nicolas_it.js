const { PrismaClient } = require('../apps/backend-v2/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const child = await prisma.child.findFirst({
    where: { pseudo: { contains: 'nicolas', mode: 'insensitive' } },
    include: {
      actionsDone: true
    }
  });

  if (!child) {
    console.log('Child not found by pseudo nicolas. Looking for any child with actions:');
    const anyChild = await prisma.child.findFirst({
      where: { actionsDone: { some: {} } },
      include: {
        _count: { select: { actionsDone: true } }
      }
    });
    console.log('Found child:', anyChild);
    return;
  }

  console.log(`Child found: ID=${child.id}, pseudo=${child.pseudo}, actionsCount=${child.actionsDone.length}`);
  
  const allActionsDone = await prisma.actionDone.findMany({
    where: { childId: child.id },
    select: {
      savedCo2: true,
      savedWater: true,
      savedWaste: true,
    }
  });

  let totalCo2 = 0;
  let totalWater = 0;
  let totalWaste = 0;
  let totalIT = 0;

  for (const a of allActionsDone) {
    const co2 = a.savedCo2 ?? 0;
    const water = a.savedWater ?? 0;
    const waste = a.savedWaste ?? 0;
    totalCo2 += co2;
    totalWater += water;
    totalWaste += waste;
    totalIT += 10 + Math.round(12 * co2 + 4 * waste + 0.04 * water);
  }

  console.log({
    totalCo2,
    totalWater,
    totalWaste,
    totalIT,
    actionsCount: allActionsDone.length,
    sampleAction: allActionsDone[0]
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
