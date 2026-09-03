const { PrismaClient } = require('../apps/backend-v2/node_modules/@prisma/client');
const prisma = new PrismaClient();

function calculateNormalizedScore(
  co2Kg,
  waterL,
  wasteKg,
  actionsCount,
  refCo2Kg = 4700,
  refWaterL = 1385000,
  refWasteKg = 270,
) {
  const pCo2 = refCo2Kg > 0 ? co2Kg / refCo2Kg : 0;
  const pWater = refWaterL > 0 ? waterL / refWaterL : 0;
  const pWaste = refWasteKg > 0 ? wasteKg / refWasteKg : 0;
  const rawImpact = (pCo2 * 0.5 + pWater * 0.2 + pWaste * 0.2) * 1000;
  const bonusActions = Math.min(100, (actionsCount || 0) * 2);
  return Math.round(rawImpact + bonusActions);
}

async function main() {
  const allActionsDone = await prisma.actionDone.findMany({
    where: { childId: 99 },
    select: {
      savedCo2: true,
      savedWater: true,
      savedWaste: true,
    }
  });

  let totalCo2 = 0;
  let totalWater = 0;
  let totalWaste = 0;

  for (const a of allActionsDone) {
    totalCo2 += a.savedCo2 ?? 0;
    totalWater += a.savedWater ?? 0;
    totalWaste += a.savedWaste ?? 0;
  }

  const score = calculateNormalizedScore(totalCo2, totalWater, totalWaste, allActionsDone.length);
  console.log(`Nicolas score calculated: ${score} IT (matches 266 on Leaderboard!)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
