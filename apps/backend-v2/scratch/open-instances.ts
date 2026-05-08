import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.instance.updateMany({
    data: { isOpen: true }
  });
  console.log(`Instances ouvertes: ${result.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
