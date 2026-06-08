import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.actionDone.deleteMany({
    where: {
      id: { in: [140274, 140275, 140276, 140277] }
    }
  });
  console.log('Deleted actions count:', result.count);
}
main().finally(() => prisma.$disconnect());