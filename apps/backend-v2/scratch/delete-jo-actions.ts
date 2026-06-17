import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const child = await prisma.child.findFirst({
    where: { pseudo: 'jo' }
  });

  if (!child) {
    console.log("Joueur 'jo' introuvable.");
    return;
  }

  const activePeriod = await prisma.period.findFirst({
    where: {
      instanceYearId: child.groupId ? (await prisma.group.findUnique({
        where: { id: child.groupId },
        include: { team: true }
      }))?.team.instanceYearId : -1,
      isOpen: true
    }
  });

  if (!activePeriod) {
    console.log("Aucune période ouverte.");
    return;
  }

  const result = await prisma.actionDone.deleteMany({
    where: {
      childId: child.id,
      periodId: activePeriod.id
    }
  });

  console.log(`Suppression réussie: ${result.count} actions supprimées de la base pour jo.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
