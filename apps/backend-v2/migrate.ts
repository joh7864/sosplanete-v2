import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const actions = await prisma.localAction.findMany({
    where: { categoryId: null }
  });
  console.log(`Found ${actions.length} LocalActions to migrate.`);
  
  for (const action of actions) {
    if (!action.oldCategory) continue;
    
    // Find or create category for this instance
    let cat = await prisma.category.findFirst({
      where: { name: action.oldCategory, instanceId: action.instanceId }
    });
    
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name: action.oldCategory,
          instanceId: action.instanceId,
          icon: `${action.oldCategory}.png`, // Default guess
          order: 0
        }
      });
      console.log(`Created category ${cat.name} for instance ${cat.instanceId}`);
    }
    
    await prisma.localAction.update({
      where: { id: action.id },
      data: { categoryId: cat.id }
    });
    console.log(`Updated LocalAction ${action.id} -> Category ${cat.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
