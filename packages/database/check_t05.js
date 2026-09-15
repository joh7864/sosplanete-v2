const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkT05() {
  const t05 = await prisma.actionRef.findUnique({
    where: { code: 'T05' }
  });
  console.log("T05 ActionRef:", t05);
  
  const localT05 = await prisma.localAction.findFirst({
    where: { actionRef: { code: 'T05' } },
    include: { actionRef: true }
  });
  console.log("T05 LocalAction:", localT05);
}

checkT05().catch(console.error).finally(() => prisma.$disconnect());
