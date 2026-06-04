const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const teams = await prisma.team.findMany({
    include: {
      instanceYear: {
        include: {
          instance: true
        }
      }
    }
  });
  console.log('--- DB TEAMS INSTANCE YEARS ---');
  teams.forEach(t => {
    console.log(`Team: "${t.name}" | TeamID: ${t.id} | InstanceYearID: ${t.instanceYearId} | Instance: "${t.instanceYear?.instance?.name}" (ID: ${t.instanceYear?.instanceId}) | SchoolYear: "${t.instanceYear?.schoolYear}"`);
  });
}
main().finally(() => prisma.$disconnect());
