import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const actions = await prisma.localAction.findMany({
    where: {
      label: { contains: 'Manger de la viande de gros' }
    }
  });
  console.log('| ID | Label | Description |');
  console.log('|----|-------|-------------|');
  actions.forEach(a => {
    console.log(`| ${a.id} | ${a.label} | ${a.description} |`);
  });
}

main().finally(() => prisma.$disconnect());
