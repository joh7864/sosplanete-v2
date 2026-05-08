import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.period.findFirst({ orderBy: { startDate: 'asc' }});
  console.log('Plus ancienne période:', p);
}
main().finally(() => prisma.$disconnect());
