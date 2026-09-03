const { PrismaClient } = require('../apps/backend-v2/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    where: { name: { contains: 'for', mode: 'insensitive' } }
  });
  console.log('Teams matching for:', teams);
}

main().catch(console.error).finally(() => prisma.$disconnect());
