import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const config = await prisma.gameConfig.findUnique({
    where: { instanceId_schoolYear: { instanceId: 2, schoolYear: '2024-2025' } }
  });
  console.log('GameConfig pour Neyron:', config);
}
main().finally(() => prisma.$disconnect());
