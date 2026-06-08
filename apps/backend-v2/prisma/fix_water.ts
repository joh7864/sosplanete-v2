import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const actionDones = await prisma.actionDone.findMany({ include: { localAction: { include: { actionRef: true } } } });
  let count = 0;
  for (const ad of actionDones) {
    if (ad.savedWater === 0) {
      const refWater = ad.localAction.specificWater ?? ad.localAction.actionRef?.defaultWater ?? 0;
      if (refWater > 0) {
        await prisma.actionDone.update({ where: { id: ad.id }, data: { savedWater: refWater } });
        count++;
      }
    }
  }
  console.log('Fixed ' + count + ' ActionDone records with water.');
}
main().finally(() => prisma.$disconnect());