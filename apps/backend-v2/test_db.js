const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const actions = await prisma.actionDone.findMany({ include: { period: true } });
  console.log('Total actions:', actions.length);
  if (actions.length > 0) {
    console.log('Sample action period:', actions[0].periodId, 'instanceYearId:', actions[0].period.instanceYearId);
  }
}

main().finally(() => prisma.$disconnect());
