import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du remplissage de la base de données...');

  // 1. Création d'un utilisateur Administrateur (AS)
  const hashedPassword = await bcrypt.hash('jo4=Nnauru04!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'jo@nnauru.org' },
    update: {},
    create: {
      email: 'jo@nnauru.org',
      name: 'Jo Admin',
      password: hashedPassword,
      role: Role.AS,
    },
  });

  console.log(`✅ Utilisateur créé : ${admin.email}`);

  // 2. Création d'une instance (École) de test
  const testInstance = await prisma.instance.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      schoolName: 'École test SOS Planète',
      isOpen: true,
      adminId: admin.id,
    },
  });

  console.log(`✅ École de test créée : ${testInstance.schoolName}`);

  console.log('🚀 Remplissage terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du remplissage :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
