import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Mise à jour des schoolYear null vers 2024-2025...');
  
  const t = await prisma.team.updateMany({
    where: { schoolYear: null },
    data: { schoolYear: '2024-2025' }
  });
  console.log(`Teams mises à jour : ${t.count}`);

  const p = await prisma.period.updateMany({
    where: { schoolYear: null },
    data: { schoolYear: '2024-2025' }
  });
  console.log(`Périodes mises à jour : ${p.count}`);

  const la = await prisma.localAction.updateMany({
    where: { schoolYear: null },
    data: { schoolYear: '2024-2025' }
  });
  console.log(`Actions locales mises à jour : ${la.count}`);
  
  const c = await prisma.category.updateMany({
    where: { schoolYear: null },
    data: { schoolYear: '2024-2025' }
  });
  console.log(`Catégories mises à jour : ${c.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
