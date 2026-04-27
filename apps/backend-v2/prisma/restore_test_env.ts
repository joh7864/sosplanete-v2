import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Restauration de l\'environnement de test ---');

  // 1. Création utilisateur Admin
  const hashedPassword = await bcrypt.hash('jo', 10);
  const jo = await prisma.user.upsert({
    where: { email: 'jo@dev.fr' },
    update: { password: hashedPassword, role: Role.AS, name: 'Jo Admin' },
    create: {
      email: 'jo@dev.fr',
      password: hashedPassword,
      name: 'Jo Admin',
      role: Role.AS,
    },
  });
  console.log('✔ Utilisateur Admin créé : jo@dev.fr / jo');

  // 2. Création des Constantes Mondiales (2023, 2024, 2025)
  const constants = [
    {
      year: 2023,
      dActuel: 214, // 2 Août
      moyCo2Monde: 4.70,
      moyEauMonde: 1385000,
      moyDechetsMonde: 321,
      popMonde: 8.09,
    },
    {
      year: 2024,
      dActuel: 214, // 1er Août (Année bissextile)
      moyCo2Monde: 4.75,
      moyEauMonde: 1390000,
      moyDechetsMonde: 325,
      popMonde: 8.16,
    },
    {
      year: 2025,
      dActuel: 205, // 24 Juillet
      moyCo2Monde: 4.80,
      moyEauMonde: 1400000,
      moyDechetsMonde: 330,
      popMonde: 8.23,
    }
  ];

  for (const c of constants) {
    await prisma.annualImpactData.upsert({
      where: { year: c.year },
      update: c,
      create: c,
    });
  }
  console.log('✔ Constantes mondiales 2023, 2024, 2025 insérées.');

  console.log('--- Fin de restauration ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
