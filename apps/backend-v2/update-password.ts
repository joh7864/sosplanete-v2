import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('admin4=Sosplanete', 10);
  await prisma.user.update({
    where: { email: 'jo@sos-planete.fr' },
    data: { password: hash }
  });
  console.log('Mot de passe mis à jour avec succès');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
