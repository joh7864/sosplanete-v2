import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst();
  if (!admin) {
    console.error('No user found to assign as admin');
    return;
  }

  const instances = [
    { schoolName: 'École de la Terre', hostUrl: 'ecole-terre.local', isOpen: false, adminId: admin.id },
    { schoolName: 'Collège de la Paix', hostUrl: 'college-paix.local', isOpen: true, adminId: admin.id },
    { schoolName: 'Lycée Horizon', hostUrl: 'lycee-horizon.local', isOpen: false, adminId: admin.id },
  ];

  for (const inst of instances) {
    await prisma.instance.upsert({
      where: { hostUrl: inst.hostUrl },
      update: inst,
      create: inst,
    });
  }
  
  console.log('3 test instances created/updated.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
