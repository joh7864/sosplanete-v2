import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const instanceId = 2; // Neyron
  const schoolYear = '2024-2025';

  const periods = await prisma.period.findMany({
    where: { instanceId, schoolYear },
    orderBy: { startDate: 'asc' },
  });
  
  if (periods.length > 0) {
    const allPeriodIds = periods.map(p => p.id);

    const actionsCount1 = await prisma.actionDone.count({
      where: { 
        child: { group: { team: { instanceId, schoolYear } } },
        periodId: { in: allPeriodIds }
      }
    });
    console.log(`Actions sans period.schoolYear filter:`, actionsCount1);

    const actionsCount2 = await prisma.actionDone.count({
      where: {
        child: { group: { team: { instanceId, schoolYear } } },
        period: { schoolYear },
        periodId: { in: allPeriodIds },
      },
    });
    console.log(`Actions AVEC period.schoolYear filter:`, actionsCount2);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
