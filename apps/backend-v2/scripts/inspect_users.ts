import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const instanceYears = await prisma.instanceYear.findMany({
    include: {
      instance: true,
      teams: {
        include: {
          groups: {
            include: {
              children: true
            }
          }
        }
      }
    }
  });

  console.log(`Found ${instanceYears.length} InstanceYears:`);
  for (const iy of instanceYears) {
    console.log(`Instance: ${iy.instance.schoolName} (IY id: ${iy.id}, Year: ${iy.schoolYear}, isOpen: ${iy.isOpen}, hostUrl: ${iy.hostUrl})`);
    for (const team of iy.teams.slice(0, 2)) {
      console.log(`  Team: ${team.name}`);
      for (const grp of team.groups.slice(0, 2)) {
        console.log(`    Group: ${grp.name}`);
        for (const child of grp.children.slice(0, 3)) {
          console.log(`      Child: pseudo="${child.pseudo}", password="${child.password}", isDelegate=${child.isDelegate}`);
        }
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
