const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const children = await prisma.child.findMany({
    where: { pseudo: 'jo' },
    include: {
      group: {
        include: {
          team: {
            include: {
              instanceYear: {
                include: {
                  instance: true
                }
              }
            }
          }
        }
      }
    }
  });

  console.log(`Found ${children.length} children with pseudo "jo":`);
  children.forEach(c => {
    console.log(`Child ID: ${c.id}`);
    console.log(`  Group: "${c.group?.name}" (ID: ${c.groupId})`);
    console.log(`  Team: "${c.group?.team?.name}" (ID: ${c.group?.teamId})`);
    console.log(`  Instance: "${c.group?.team?.instanceYear?.instance?.schoolName}" (ID: ${c.group?.team?.instanceYear?.instanceId})`);
    console.log(`  School Year: "${c.group?.team?.instanceYear?.schoolYear}"`);
    console.log(`  InstanceYear isOpen: ${c.group?.team?.instanceYear?.isOpen}`);
  });
}

main().finally(() => prisma.$disconnect());
