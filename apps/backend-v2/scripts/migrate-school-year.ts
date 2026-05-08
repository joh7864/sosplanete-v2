import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting school year migration...');

  const schoolYear = '2024-2025';

  const catRes = await prisma.category.updateMany({
    where: { schoolYear: null },
    data: { schoolYear },
  });
  console.log(`✅ Updated ${catRes.count} categories`);

  const teamRes = await prisma.team.updateMany({
    where: { schoolYear: null },
    data: { schoolYear },
  });
  console.log(`✅ Updated ${teamRes.count} teams`);

  const localRes = await prisma.localAction.updateMany({
    where: { schoolYear: null },
    data: { schoolYear },
  });
  console.log(`✅ Updated ${localRes.count} local actions`);

  const periodRes = await prisma.period.updateMany({
    where: { schoolYear: null },
    data: { schoolYear },
  });
  console.log(`✅ Updated ${periodRes.count} periods`);

  console.log('🎉 Migration finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
