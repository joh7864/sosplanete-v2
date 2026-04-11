import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.actionRef.count();
  console.log('--- ACTION_REF COUNT ---');
  console.log(count);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
