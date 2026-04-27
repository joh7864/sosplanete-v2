import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function sync() {
  console.log('--- Synchronisation des ActionsDone avec le Catalogue ---');
  
  // On récupère toutes les références pour avoir un dictionnaire en mémoire
  const refs = await prisma.actionRef.findMany();
  const refMap = new Map();
  refs.forEach(r => refMap.set(r.id, r));

  const actions = await prisma.actionDone.findMany({
    include: { localAction: true }
  });

  console.log(`Traitement de ${actions.length} actions...`);

  let count = 0;
  for (const act of actions) {
    const reference = refMap.get(act.localAction.actionRefId);
    if (reference) {
      // On met à jour l'action enregistrée avec les poids du catalogue (ou les surcharges locales si elles existent)
      await prisma.actionDone.update({
        where: { id: act.id },
        data: {
          savedCo2: act.localAction.specificCo2 ?? reference.defaultCo2 ?? 0,
          savedWater: act.localAction.specificWater ?? reference.defaultWater ?? 0,
          savedWaste: act.localAction.specificWaste ?? reference.defaultWaste ?? 0,
        }
      });
      count++;
      if (count % 1000 === 0) console.log(`${count}...`);
    }
  }

  console.log(`✔ Terminé : ${count} actions synchronisées.`);
}

sync().finally(() => prisma.$disconnect());
