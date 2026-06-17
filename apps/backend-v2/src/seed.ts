import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sos-planete.fr' },
    update: {},
    create: {
      email: 'admin@sos-planete.fr',
      password: password,
      role: 'AS',
    },
  });

  const passwordJo = await bcrypt.hash('jo', 10);

  const adminJo = await prisma.user.upsert({
    where: { email: 'jo@dev.fr' },
    update: {
      password: passwordJo,
      role: 'AS',
    },
    create: {
      email: 'jo@dev.fr',
      password: passwordJo,
      role: 'AS',
    },
  });

  // Données d'impact mondiales
  await prisma.annualImpactData.upsert({
    where: { year: 2024 },
    update: {},
    create: {
      year: 2024,
      dActuel: 214, // 1er août env.
      moyCo2Monde: 4.7,
      moyEauMonde: 1200000,
      moyDechetsMonde: 450,
    },
  });

  await prisma.annualImpactData.upsert({
    where: { year: 2025 },
    update: {},
    create: {
      year: 2025,
      dActuel: 211, // Un peu plus tôt
      moyCo2Monde: 4.8,
      moyEauMonde: 1210000,
      moyDechetsMonde: 455,
    },
  });

  console.log('Seed terminé. Admins :', admin.email, adminJo.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
