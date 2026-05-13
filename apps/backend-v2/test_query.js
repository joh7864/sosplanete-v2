const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const instanceYearId = 30; // From previous script
  const periods = await prisma.period.findMany({ where: { instanceYearId }, select: { id: true } });
  const periodIds = periods.map(p => p.id);

  const teams = await prisma.team.findMany({
    where: { instanceYearId },
    include: {
      groups: {
        include: {
          children: {
            include: {
              actionsDone: {
                where: { periodId: { in: periodIds } },
              },
            },
          },
        },
      },
    },
  });

  let total = 0;
  teams.forEach(t => {
    t.groups.forEach(g => {
      g.children.forEach(c => {
        total += c.actionsDone.length;
      });
    });
  });

  console.log('Total teams:', teams.length);
  console.log('Total actions mapped:', total);
}

main().finally(() => prisma.$disconnect());
