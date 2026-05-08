import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const instanceId = 2; // Neyron
  const schoolYear = '2024-2025';

  const children = await prisma.child.findMany({
    where: { group: { team: { instanceId, schoolYear } } },
    include: { group: { include: { team: true } } },
  });
  console.log(`Neyron - Enfants:`, children.length);

  const periods = await prisma.period.findMany({
    where: { instanceId, schoolYear },
    orderBy: { startDate: 'asc' },
  });
  console.log(`Neyron - Périodes:`, periods.length);
  
  if (periods.length > 0) {
    const periodIds = periods.map(p => p.id);
    const actionDones = await prisma.actionDone.count({
      where: { periodId: { in: periodIds } }
    });
    console.log(`Neyron - Actions (périodes):`, actionDones);

    const actionDonesFull = await prisma.actionDone.count({
      where: { 
        child: { group: { team: { instanceId, schoolYear } } },
        periodId: { in: periodIds }
      }
    });
    console.log(`Neyron - Actions (filtre complet):`, actionDonesFull);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
