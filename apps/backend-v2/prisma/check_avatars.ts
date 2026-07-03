import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const instanceYearId = 11; // Groupir 2025-2026 en local

  const children = await prisma.child.findMany({
    where: { group: { team: { instanceYearId } } },
    select: {
      id: true,
      pseudo: true,
      avatar: true,
      group: {
        select: {
          name: true,
          team: {
            select: {
              name: true
            }
          }
        }
      },
      _count: {
        select: {
          actionsDone: true
        }
      }
    }
  });

  console.log("=== JOUEURS DE L'INSTANCEYEAR 11 ET ACTIONS ET AVATARS ===");
  console.log(JSON.stringify(children, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
