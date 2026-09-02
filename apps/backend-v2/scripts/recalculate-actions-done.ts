import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 ========================================================');
  console.log('🔄 DÉBUT DU RECALCUL DE L\'HISTORIQUE DES ACTIONS (ActionDone)');
  console.log('🔄 ========================================================\n');

  // 1. Statistiques avant recalcul
  const beforeStats = await prisma.actionDone.aggregate({
    _count: { id: true },
    _sum: {
      savedCo2: true,
      savedWater: true,
      savedWaste: true,
    },
  });

  console.log('📊 STATISTIQUES AVANT RECALCUL :');
  console.log(`- Nombre total d'actions enregistrées : ${beforeStats._count.id}`);
  console.log(`- Total CO2e : ${(beforeStats._sum.savedCo2 || 0).toFixed(2)} kg`);
  console.log(`- Total Eau : ${(beforeStats._sum.savedWater || 0).toFixed(2)} L`);
  console.log(`- Total Déchets : ${(beforeStats._sum.savedWaste || 0).toFixed(2)} kg\n`);

  // 2. Exécution du recalcul SQL
  console.log('⚙️ Mise à jour en cours des enregistrements ActionDone depuis le catalogue...');
  const startTime = Date.now();

  const updatedCount = await prisma.$executeRawUnsafe(`
    UPDATE "ActionDone" ad
    SET 
      "savedCo2"    = COALESCE(la."specificCo2", ar."defaultCo2", 0),
      "savedWater"  = COALESCE(la."specificWater", ar."defaultWater", 0),
      "savedWaste"  = COALESCE(la."specificWaste", ar."defaultWaste", 0),
      "savedEnergy" = COALESCE(la."specificEnergy", ar."defaultEnergy", 0)
    FROM "LocalAction" la
    LEFT JOIN "ActionRef" ar ON la."actionRefId" = ar.id
    WHERE ad."localActionId" = la.id;
  `);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ ${updatedCount} actions mises à jour avec succès en ${duration}s !\n`);

  // 3. Statistiques après recalcul
  const afterStats = await prisma.actionDone.aggregate({
    _count: { id: true },
    _sum: {
      savedCo2: true,
      savedWater: true,
      savedWaste: true,
    },
  });

  console.log('📊 STATISTIQUES APRÈS RECALCUL :');
  console.log(`- Total CO2e : ${(afterStats._sum.savedCo2 || 0).toFixed(2)} kg`);
  console.log(`- Total Eau : ${(afterStats._sum.savedWater || 0).toFixed(2)} L`);
  console.log(`- Total Déchets : ${(afterStats._sum.savedWaste || 0).toFixed(2)} kg (Rééquilibré !)\n`);

  // 4. Vérification spécifique sur les profils de test (ex: MCL vs Nicolas)
  const targetPlayers = await prisma.child.findMany({
    where: {
      pseudo: { in: ['mcl', 'nicolas', 'MCL', 'Nicolas'] },
    },
    include: {
      actionsDone: true,
      group: { include: { team: true } },
    },
  });

  if (targetPlayers.length > 0) {
    console.log('🏆 VÉRIFICATION DES SCORES JOUEURS :');
    for (const player of targetPlayers) {
      if (player.actionsDone.length === 0) continue;
      const co2 = player.actionsDone.reduce((acc, a) => acc + a.savedCo2, 0);
      const water = player.actionsDone.reduce((acc, a) => acc + a.savedWater, 0);
      const waste = player.actionsDone.reduce((acc, a) => acc + a.savedWaste, 0);
      const count = player.actionsDone.length;

      // Score normalisé
      const pCo2 = Math.min(1.0, co2 / 4700);
      const pWater = Math.min(1.0, water / 1385000);
      const pWaste = Math.min(1.0, waste / 270);
      const bonusActions = Math.min(1.0, count / 240);
      const score = Math.round((pCo2 * 0.5 + pWater * 0.2 + pWaste * 0.2) * 1000 + bonusActions * 100);

      console.log(
        `- Joueur: ${player.pseudo.padEnd(10)} | Actions: ${String(count).padStart(4)} | CO2e: ${co2.toFixed(1).padStart(7)} kg | Eau: ${water.toFixed(0).padStart(7)} L | Déchets: ${waste.toFixed(1).padStart(6)} kg | Score: ${score} pts`
      );
    }
  }

  console.log('\n🎉 Recalcul terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du recalcul :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
