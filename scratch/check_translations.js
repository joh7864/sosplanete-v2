const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../apps/backend-v2/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const translations = await prisma.evoeMissionTranslation.findMany({
    take: 20,
    include: {
      localAction: {
        include: {
          actionRef: true
        }
      }
    }
  });
  console.log("Translations count:", translations.length);
  translations.forEach(t => {
    console.log(`Action ${t.localAction?.actionRef?.code} (${t.localAction?.label}): pointsGagnes=${t.pointsGagnes}`);
  });
}

main().finally(() => prisma.$disconnect());
