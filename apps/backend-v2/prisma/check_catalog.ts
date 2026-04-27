import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const actions = await prisma.actionRef.findMany({
    take: 30,
    orderBy: { code: 'asc' }
  });
  
  console.log('| Code | Nom | CO2 (kg) | Eau (L) | Déchets (kg) |');
  console.log('|------|-----|----------|---------|--------------|');
  actions.forEach(a => {
    console.log(`| ${a.code} | ${a.referenceName} | ${a.defaultCo2} | ${a.defaultWater} | ${a.defaultWaste} |`);
  });
}

main().finally(() => prisma.$disconnect());
