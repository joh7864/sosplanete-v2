const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const instanceYearId = 30; // From previous script
  const period = await prisma.period.findFirst({ where: { instanceYearId, isOpen: true } });
  console.log('Open period:', period);
}

main().finally(() => prisma.$disconnect());
