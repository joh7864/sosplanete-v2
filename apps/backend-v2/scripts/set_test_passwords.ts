import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  const child = await prisma.child.findFirst({
    where: { pseudo: 'groot' }
  });
  if (child) {
    await prisma.child.update({
      where: { id: child.id },
      data: { password: hash }
    });
    console.log(`Updated child groot (id: ${child.id}) with password 'password123'`);
  }

  // Also check or create another agent in a different team to test PVP / multi-agent features
  const mariane = await prisma.child.findFirst({
    where: { pseudo: 'mariane' }
  });
  if (mariane) {
    await prisma.child.update({
      where: { id: mariane.id },
      data: { password: hash }
    });
    console.log(`Updated child mariane (id: ${mariane.id}) with password 'password123'`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
