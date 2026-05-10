import { PrismaClient } from '@prisma/client';

async function resetSequences() {
  const prisma = new PrismaClient();
  console.log('Resetting all PostgreSQL sequences...');

  const tables = [
    'User', 'ActionRef', 'Category', 'AnnualImpactData', 'CategoryRef', 
    'Instance', 'Team', 'Group', 'Child', 'LocalAction', 'Period', 
    'ActionDone', 'AnimalRelease', 'GameConfig', 'SystemConfig', 
    'InstanceAnimalUnlock', 'EcoBarRaceSnapshot', 'TerreThermometerSnapshot'
  ];

  for (const table of tables) {
    try {
      // Use raw SQL to reset sequence
      // Table names in SQL are usually same as Prisma models or lowercase/quoted
      // Here we assume they match the model names (default in many cases)
      const seqName = `"${table}_id_seq"`;
      console.log(`Resetting sequence for ${table}...`);
      await prisma.$executeRawUnsafe(`
        SELECT setval('${seqName}', (SELECT MAX(id) FROM "${table}"))
      `);
    } catch (e) {
      console.warn(`Could not reset sequence for ${table}: ${e.message}`);
    }
  }

  await prisma.$disconnect();
  console.log('Sequence reset finished.');
}

resetSequences();
