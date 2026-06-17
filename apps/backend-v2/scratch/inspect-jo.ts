import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const child = await prisma.child.findFirst({
    where: { pseudo: 'jo' },
    include: {
      group: {
        include: {
          team: {
            include: {
              instanceYear: true
            }
          }
        }
      }
    }
  });

  if (!child) {
    console.log("Joueur 'jo' introuvable.");
    return;
  }

  console.log(`=== JOUEUR JO ===`);
  console.log(`ID: ${child.id}`);
  console.log(`Team: ${child.group.team.name} (ID: ${child.group.teamId})`);
  console.log(`InstanceYearID: ${child.group.team.instanceYearId}`);

  const activePeriod = await prisma.period.findFirst({
    where: {
      instanceYearId: child.group.team.instanceYearId,
      isOpen: true
    }
  });

  if (!activePeriod) {
    console.log("Aucune période ouverte pour cette instance.");
    return;
  }

  console.log(`\n=== PÉRIODE ACTIVE ===`);
  console.log(`ID: ${activePeriod.id}`);
  console.log(`Start: ${activePeriod.startDate}`);
  console.log(`End: ${activePeriod.endDate}`);

  const actionsDone = await prisma.actionDone.findMany({
    where: {
      childId: child.id,
      periodId: activePeriod.id
    },
    include: {
      localAction: {
        include: {
          actionRef: true
        }
      }
    }
  });

  console.log(`\n=== ACTIONS FAITES SUR LA PÉRIODE COURANTE (Count: ${actionsDone.length}) ===`);
  actionsDone.forEach(ad => {
    console.log(`- Action Done ID: ${ad.id}, LocalAction: ${ad.localAction.label} (ID: ${ad.localActionId})`);
    console.log(`  savedCo2: ${ad.savedCo2}, savedWater: ${ad.savedWater}, savedWaste: ${ad.savedWaste}`);
    console.log(`  co2Year: ${ad.localAction.actionRef?.co2Year}`);
  });

  const challenges = await prisma.evoeChallenge.findMany({
    where: {
      periodId: activePeriod.id
    }
  });

  console.log(`\n=== DÉFIS DE LA PÉRIODE (Count: ${challenges.length}) ===`);
  challenges.forEach(ch => {
    console.log(`- Challenge ID: ${ch.id}, Challenger Team ID: ${ch.challengerTeamId}, Target Team ID: ${ch.targetTeamId}, Status: ${ch.status}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
