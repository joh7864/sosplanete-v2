import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const actions = await prisma.localAction.findMany({
    take: 10,
    orderBy: { id: 'asc' }
  });
  console.log('| Code | Label | Description |');
  console.log('|------|-------|-------------|');
  actions.forEach(a => {
    console.log(`| ${a.id} | ${a.label} | ${a.description} |`);
  });
}

main().finally(() => prisma.$disconnect());
