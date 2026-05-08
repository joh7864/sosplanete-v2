import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const instanceId = 2;
  const schoolYear = '2024-2025';

  console.log(`Checking Instance ${instanceId}...`);
  const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
  console.log('Instance:', instance);

  console.log(`Checking GameConfig for ${instanceId} / ${schoolYear}...`);
  const config = await prisma.gameConfig.findUnique({
    where: { instanceId_schoolYear: { instanceId, schoolYear } }
  });
  console.log('GameConfig:', config);

  console.log(`Checking Periods for ${instanceId} / ${schoolYear}...`);
  const periodsCount = await prisma.period.count({
    where: { instanceId, schoolYear }
  });
  console.log('Periods count:', periodsCount);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
