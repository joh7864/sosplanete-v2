import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const schoolYear = '2024-2025';
  const periodNumber = 10; // Test avec 10
  
  const instances = await prisma.instance.findMany({
    where: { isOpen: true },
    select: { id: true, schoolName: true }
  });

  console.log(`Instances ouvertes:`, instances);

  for (const instance of instances) {
    const periods = await prisma.period.findMany({
      where: { instanceId: instance.id, schoolYear },
      orderBy: { startDate: 'asc' },
      take: periodNumber
    });
    
    console.log(`Instance ${instance.id} - Périodes trouvées:`, periods.length);
    if (periods.length === 0) continue;
    
    const periodIds = periods.map(p => p.id);
    
    const impacts = await prisma.actionDone.aggregate({
      where: { 
        child: { group: { team: { instanceId: instance.id, schoolYear } } },
        periodId: { in: periodIds }
      },
      _sum: {
        savedCo2: true,
      }
    });
    
    console.log(`Instance ${instance.id} - CO2 Total:`, impacts._sum.savedCo2);
    
    // Check missing fields
    const actionCount = await prisma.actionDone.count({
      where: { periodId: { in: periodIds } }
    });
    console.log(`Instance ${instance.id} - Actions dans ces périodes:`, actionCount);
    
    const matchingActionCount = await prisma.actionDone.count({
      where: { 
        child: { group: { team: { instanceId: instance.id, schoolYear } } },
        periodId: { in: periodIds }
      }
    });
    console.log(`Instance ${instance.id} - Actions qui matchent le filtre:`, matchingActionCount);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
