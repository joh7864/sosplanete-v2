import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const instances = await prisma.instance.findMany({
    select: { id: true, schoolName: true, isOpen: true }
  });

  console.log(`Instances:`, instances);
}

main().catch(console.error).finally(() => prisma.$disconnect());
