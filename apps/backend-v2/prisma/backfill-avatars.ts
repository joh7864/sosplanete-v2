import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== RUNNING AVATARS BACKFILL ===");
  const children = await prisma.child.findMany({
    where: {
      avatar: {
        startsWith: 'avatars_3D/avatar_'
      }
    }
  });

  console.log(`Found ${children.length} children with old avatar format.`);

  let updatedCount = 0;
  for (const child of children) {
    if (!child.avatar) continue;
    const match = child.avatar.match(/^avatars_3D\/avatar_(\d+)\.png$/);
    if (!match) continue;

    const idx = parseInt(match[1], 10);
    let newAvatar = '';

    if (idx >= 1 && idx <= 21) {
      newAvatar = `avatars_3D/H_avatar_0${idx}.png`;
    } else if (idx >= 22 && idx <= 33) {
      newAvatar = `avatars_3D/F_avatar_${(idx - 21).toString().padStart(2, '0')}.png`;
    } else if (idx >= 34 && idx <= 36) {
      newAvatar = `avatars_3D/EF_avatar_0${idx - 33}.png`;
    } else if (idx >= 37 && idx <= 39) {
      newAvatar = `avatars_3D/EH_avatar_0${idx - 36}.png`;
    }

    if (newAvatar) {
      await prisma.child.update({
        where: { id: child.id },
        data: { avatar: newAvatar }
      });
      console.log(`Updated pseudo @${child.pseudo} (ID: ${child.id}): ${child.avatar} -> ${newAvatar}`);
      updatedCount++;
    }
  }

  console.log(`Backfill finished. Successfully updated ${updatedCount} avatars.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
