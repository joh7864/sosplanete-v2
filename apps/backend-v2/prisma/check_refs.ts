import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const refs = await prisma.actionRef.findMany({
    include: { categoryRef: true },
    orderBy: { id: 'asc' }
  });
  console.log('ActionRef count:', refs.length);
  refs.forEach(r => {
    console.log(`ID: ${r.id} | Code: ${r.code} | Cat: ${r.category || r.categoryRef?.name} | Name: ${r.referenceName}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
