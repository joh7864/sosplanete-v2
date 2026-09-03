const { PrismaClient } = require('../apps/backend-v2/node_modules/@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function getUploadsDir() {
  if (process.env.UPLOADS_DIR && fs.existsSync(process.env.UPLOADS_DIR)) {
    return process.env.UPLOADS_DIR;
  }
  const candidates = [
    // 1. Root monorepo uploads (via __dirname relative from evoe.service.ts)
    path.resolve(__dirname, '..', '..', 'uploads'),
    path.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'uploads'),
    path.resolve(process.cwd(), 'uploads'),
    path.resolve(process.cwd(), '..', '..', 'uploads'),
    path.resolve(process.cwd(), '..', 'uploads'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      const missionsSub = path.join(c, 'missions');
      if (fs.existsSync(missionsSub) && fs.readdirSync(missionsSub).length > 5) {
        return c;
      }
    }
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return path.resolve(process.cwd(), 'uploads');
}

const isValidImageFilename = (s) => {
  if (!s) return false;
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(s);
};

async function testMissions() {
  const basePath = getUploadsDir();
  const missionsDir = path.join(basePath, 'missions');
  const missionsFiles = fs.existsSync(missionsDir) ? fs.readdirSync(missionsDir) : [];

  console.log(`Missions dir: ${missionsDir}`);
  console.log(`Missions files count: ${missionsFiles.length}`);

  const localActions = await prisma.localAction.findMany({
    where: { instanceId: 1 },
    include: {
      evoeMission: true,
      actionRef: true,
      category: true,
    },
    take: 5
  });

  for (const action of localActions) {
    const code = action.actionRef?.code?.trim() || '';

    let autoEvoeImg = null;
    if (code) {
      const foundMissionFile = missionsFiles.find((f) => {
        const dotIndex = f.lastIndexOf('.');
        if (dotIndex === -1) return false;
        const base = f.substring(0, dotIndex);
        return (
          base.toLowerCase() === `${code}_evoe`.toLowerCase() ||
          base.toLowerCase() === code.toLowerCase()
        );
      });
      if (foundMissionFile) {
        autoEvoeImg = foundMissionFile;
      }
    }

    const rawEvoeImg = [
      action.imageEvoe,
      action.evoeMission?.imageOverride,
      action.actionRef?.imageEvoe,
      autoEvoeImg,
    ].find(isValidImageFilename);

    let imageFile = null;
    if (rawEvoeImg && isValidImageFilename(rawEvoeImg)) {
      imageFile = `missions/${rawEvoeImg}`;
    }

    console.log({
      code,
      label: action.label,
      autoEvoeImg,
      rawEvoeImg,
      resulting_imageFile: imageFile
    });
  }
}

testMissions().catch(console.error).finally(() => prisma.$disconnect());
