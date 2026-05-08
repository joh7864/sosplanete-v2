import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const periods = await prisma.period.groupBy({
    by: ['schoolYear'],
    _count: true,
  });
  console.log('Periods:', JSON.stringify(periods, null, 2));

  const teams = await prisma.team.groupBy({
    by: ['schoolYear'],
    _count: true,
  });
  console.log('Teams:', JSON.stringify(teams, null, 2));

  const actionDones = await prisma.actionDone.count();
  console.log('ActionDone total count:', actionDones);
  
  const snapshots = await prisma.ecoBarRaceSnapshot.groupBy({
    by: ['schoolYear'],
    _count: true,
  });
  console.log('Snapshots:', JSON.stringify(snapshots, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
