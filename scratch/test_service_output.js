const { PrismaClient } = require('../apps/backend-v2/node_modules/@prisma/client');
const prisma = new PrismaClient();

// Test what the service method returns
async function testService() {
  const allActionsDone = await prisma.actionDone.findMany({
    where: { childId: 99 },
    select: {
      savedCo2: true,
      savedWater: true,
      savedWaste: true,
    },
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

  const result = {
    totalIT,
    personalMetrics: {
      co2: totalCo2,
      water: totalWater,
      waste: totalWaste,
      totalIT,
      totalActionsCount: allActionsDone.length,
    }
  };

  console.log('Result from calculation:', JSON.stringify(result, null, 2));
}

testService().catch(console.error).finally(() => prisma.$disconnect());
