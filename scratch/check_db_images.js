const { PrismaClient } = require('../apps/backend-v2/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const actions = await prisma.localAction.findMany({
    take: 10,
    include: {
      actionRef: true,
      evoeMission: true,
    }
  });

  console.log('--- SAMPLE LOCAL ACTIONS ---');
  for (const a of actions) {
    console.log({
      id: a.id,
      label: a.label,
      code: a.actionRef?.code,
      localAction_image: a.image,
      localAction_imageEvoe: a.imageEvoe,
      actionRef_image: a.actionRef?.image,
      actionRef_imageEvoe: a.actionRef?.imageEvoe,
      evoeMission_imageOverride: a.evoeMission?.imageOverride,
    });
  }

  const allRefWithEvoe = await prisma.actionRef.findMany({
    where: {
      imageEvoe: { not: null }
    }
  });
  console.log(`\nActionRef with imageEvoe count: ${allRefWithEvoe.length}`);

  const allLocalWithEvoe = await prisma.localAction.findMany({
    where: {
      imageEvoe: { not: null }
    }
  });
  console.log(`LocalAction with imageEvoe count: ${allLocalWithEvoe.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
