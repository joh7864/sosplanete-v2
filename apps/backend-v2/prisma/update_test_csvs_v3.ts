import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function updateCsv(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`Fichier non trouvé : ${filePath}`);
    return;
  }

  console.log(`Traitement de ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const newLines = [lines[0]]; // Header

  // Cache des références pour aller vite
  const refs = await prisma.actionRef.findMany();
  const refMap = new Map();
  refs.forEach(r => refMap.set(r.code, r));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Le séparateur est le point-virgule
    const parts = line.split(';');
    const code = parts[0];
    const comptage = parseFloat(parts[7]) || 1;
    
    const r = refMap.get(code);
    if (r) {
      // Calcul des nouvelles économies basées sur la V3
      // parts[8] = CO2, parts[9] = Eau, parts[10] = Déchets
      parts[8] = ((r.defaultCo2 || 0) * comptage).toString();
      parts[9] = ((r.defaultWater || 0) * comptage).toString();
      parts[10] = ((r.defaultWaste || 0) * comptage).toString();
      newLines.push(parts.join(';'));
    } else {
      newLines.push(line);
    }
  }

  fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
  console.log(`✔ ${filePath} mis à jour.`);
}

async function main() {
  const baseDir = 'c:/Users/User/Documents/Sync Pcloud/Professionnel/Dev/sosplanete-v2/.docs/3-fct/';
  await updateCsv(baseDir + 'Actions_realisees.csv');
  await updateCsv(baseDir + 'Balan_actions_realisees.csv');
}

main().catch(console.error).finally(() => prisma.$disconnect());
