const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Initialisation des découvertes de glyphes pour Hubert (Team 16, IY 11) ---');

  const hubert = await prisma.child.findFirst({
    where: { pseudo: 'hubert' },
    include: { group: { include: { team: true } } },
  });

  if (!hubert) {
    console.error('Joueur Hubert introuvable.');
    return;
  }

  const childId = hubert.id;
  const instanceYearId = hubert.group.team.instanceYearId;

  // Récupération des périodes ordonnées
  const periods = await prisma.period.findMany({
    where: { instanceYearId },
    orderBy: { startDate: 'asc' },
  });

  console.log(`Nombre total de périodes de jeu : ${periods.length}`);

  // Définition des énigmes à marquer comme découvertes sur les cycles passés
  // Cycle 1: egg 1 (Période 1)
  // Cycle 2: egg 4 (Période 3)
  // Cycle 5: egg 3 (Période 9)
  // Cycle 7: egg 6 (Période 13)
  // Cycle 11: egg 11 (Période 21)
  // Cycle 16: egg 10 (Période 31)

  const solvedCycles = [
    { cycle: 1, periodIdx: 0, eggId: 1, answer: '4207' },
    { cycle: 2, periodIdx: 2, eggId: 4, answer: '{"clicks":7}' },
    { cycle: 5, periodIdx: 8, eggId: 3, answer: 'NEXUS-MATRIX' },
    { cycle: 7, periodIdx: 12, eggId: 6, answer: 'FREQUENCY-432' },
    { cycle: 11, periodIdx: 20, eggId: 11, answer: 'ORBITAL-PARTY' },
    { cycle: 16, periodIdx: 30, eggId: 10, answer: 'CONSTELLATION-ALPHA' },
  ];

  for (const item of solvedCycles) {
    const period = periods[item.periodIdx];
    if (!period) continue;

    const existing = await prisma.evoeEasterEggPlayerProgress.findFirst({
      where: {
        childId,
        easterEggId: item.eggId,
      },
    });

    if (!existing) {
      await prisma.evoeEasterEggPlayerProgress.create({
        data: {
          childId,
          easterEggId: item.eggId,
          periodId: period.id,
          discoveredAt: new Date(period.startDate || Date.now()),
          firstInteractionAt: new Date(period.startDate || Date.now()),
          answerSubmitted: item.answer,
        },
      });
      console.log(`Cycle ${item.cycle}: Énigme ${item.eggId} marquée comme résolue (Glyphe débloqué).`);
    } else {
      console.log(`Cycle ${item.cycle}: Énigme ${item.eggId} déjà résolue.`);
    }
  }

  // S'assurer que l'équipe Feu a bien le Chrono-Egg pour tester la chrono-frise
  await prisma.team.update({
    where: { id: hubert.group.team.id },
    data: {
      hasChronoEgg: true,
    },
  });

  console.log('✅ Initialisation des cycles et glyphes terminée avec succès !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
