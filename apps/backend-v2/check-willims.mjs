import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const child = await prisma.child.findFirst({
  where: { pseudo: 'willims' },
  include: {
    group: {
      include: {
        team: {
          include: {
            instanceYear: { include: { instance: true } }
          }
        }
      }
    }
  }
});

if (!child) {
  console.log('❌ Aucun enfant trouvé avec le pseudo "willims"');
  await prisma.$disconnect();
  process.exit(1);
}

const team = child.group.team;
const instanceYear = team.instanceYear;

console.log('=== WILLIMS ===');
console.log(`childId:          ${child.id}`);
console.log(`pseudo:           ${child.pseudo}`);
console.log(`teamId:           ${team.id}`);
console.log(`teamName:         ${team.name}`);
console.log(`team.whatsappInviteUrl:  "${team.whatsappInviteUrl}"`);
console.log(`instanceId:       ${instanceYear.instanceId}`);
console.log(`schoolYear:       ${instanceYear.schoolYear}`);
console.log(`instance.name:    ${instanceYear.instance?.schoolName}`);

// Vérifier le SystemConfig pour cet schoolYear
const sc = await prisma.systemConfig.findFirst({ where: { schoolYear: instanceYear.schoolYear } });
console.log(`\n=== SystemConfig (${instanceYear.schoolYear}) ===`);
console.log(`whatsappCommunityUrl:  "${sc?.whatsappCommunityUrl}"`);
console.log(`whatsappCommunityName: "${sc?.whatsappCommunityName}"`);

await prisma.$disconnect();
