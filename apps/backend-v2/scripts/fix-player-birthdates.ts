import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Démarrage de la correction des dates d\'anniversaire (+1 jour, UTC 12:00) ---');

  const children = await prisma.child.findMany({
    where: {
      birthDate: { not: null },
    },
    select: {
      id: true,
      pseudo: true,
      birthDate: true,
    },
  });

  console.log(`Nombre d'agents avec une date d'anniversaire renseignée : ${children.length}`);

  let updatedCount = 0;

  for (const child of children) {
    if (!child.birthDate) continue;

    const oldDate = new Date(child.birthDate);
    const oldIso = oldDate.toISOString();

    // On extrait l'année, mois et jour en UTC de la date enregistrée
    const year = oldDate.getUTCFullYear();
    const month = oldDate.getUTCMonth();
    const day = oldDate.getUTCDate();

    // On ajoute +1 jour et on normalise strictement à midi UTC (12:00:00Z)
    const newDate = new Date(Date.UTC(year, month, day + 1, 12, 0, 0, 0));
    const newIso = newDate.toISOString();

    await prisma.child.update({
      where: { id: child.id },
      data: { birthDate: newDate },
    });

    console.log(
      `✓ Agent @${child.pseudo} (ID ${child.id}) : ${oldIso.substring(0, 10)} -> ${newIso.substring(0, 10)} (${newIso})`
    );
    updatedCount++;
  }

  console.log(`\n--- Terminé : ${updatedCount} date(s) d'anniversaire corrigée(s) avec succès ! ---`);
}

main()
  .catch((e) => {
    console.error('Erreur lors de la correction des dates :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
