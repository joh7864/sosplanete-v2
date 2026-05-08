
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkScores() {
  const instanceId = 1; // On suppose que c'est l'instance de test
  
  const period = await prisma.period.findFirst({ where: { instanceId, isOpen: true } });
  console.log('Période active:', period?.id);

  const teams = await prisma.team.findMany({
    where: { instanceId },
    include: {
      groups: {
        include: {
          children: {
            include: {
              actionsDone: true
            }
          }
        }
      }
    }
  });

  teams.forEach(t => {
    let total = 0;
    let weekTotal = 0;
    let actionsCount = 0;
    t.groups.forEach(g => {
      g.children.forEach(c => {
        actionsCount += c.actionsDone.length;
        c.actionsDone.forEach(a => {
          const points = Math.round(a.savedCo2 + a.savedWater + a.savedWaste);
          total += points;
          if (period && a.periodId === period.id) {
            weekTotal += points;
          }
        });
      });
    });
    console.log(`Team: ${t.name} | Total Actions: ${actionsCount} | Week Points: ${weekTotal} | Total Points: ${total}`);
  });
}

checkScores().finally(() => prisma.$disconnect());
