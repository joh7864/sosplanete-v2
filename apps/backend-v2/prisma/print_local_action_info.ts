import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const actions = await prisma.localAction.findMany({
    where: {
      actionRef: {
        code: { in: ['B05', 'B06', 'B07', 'D14', 'D16', 'A10'] }
      }
    },
    include: { actionRef: true }
  });
  console.log('| ID | Code | Label | Description | Spec Water | Def Water |');
  console.log('|----|------|-------|-------------|------------|-----------|');
  actions.forEach(a => {
    console.log(`| ${a.id} | ${a.actionRef.code} | ${a.label.substring(0, 30)}... | ${a.description} | ${a.specificWater} | ${a.actionRef.defaultWater} |`);
  });
}

main().finally(() => prisma.$disconnect());
