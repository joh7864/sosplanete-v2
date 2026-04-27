import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 🚀 PHASE 1 : Audit et Correction exhaustive du Référentiel (V3) ---');
  
  const actions = await prisma.actionRef.findMany();
  const corrections = [];

  for (const a of actions) {
    let co2 = a.defaultCo2 ?? 0;
    let water = a.defaultWater ?? 0;
    let waste = a.defaultWaste ?? 0;
    let modified = false;

    // 1. Correction des poids délirants (Probables annuels saisis en hebdo)
    // Seuil CO2 : > 40kg/semaine est suspect pour un geste individuel
    if (co2 > 40) { co2 /= 52; modified = true; }
    // Seuil Déchets : > 5kg/semaine est suspect (Moyenne mondiale = 6kg total)
    if (waste > 5) { waste /= 52; modified = true; }

    // 2. Correction spécifique D11 (Vrac) si pas déjà fait par le seuil
    if (a.code === 'D11' && waste > 1) { waste = 0.67; modified = true; }

    // 3. Ajout de l'Eau Virtuelle (Moyennes mondiales Water Footprint Network)
    const name = a.referenceName.toLowerCase();
    
    // Textile (D14, D07, etc.) : Un vêtement demande énormément d'eau
    if ((name.includes('vêtement') || name.includes('habille')) && water === 0) {
      water = 2500; // Moyenne pondérée (T-shirt 2500L, Jean 8000L)
      modified = true;
    }

    // Viande (B05, B06, B07, A10) : 1 repas sans viande économise ~800L à 1500L
    if (name.includes('viande') && water === 0) {
      if (name.includes('gros animaux')) water = 1500;
      else water = 800;
      modified = true;
    }

    // Électronique (D16-D20) : Fabrication économisée
    if (name.includes('électronique') || name.includes('reconditionné')) {
      if (water === 0) {
         if (a.code === 'D16') water = 1500;
         else if (a.code === 'D17') water = 800;
         else if (a.code === 'D18') water = 400;
         else water = 100;
         modified = true;
      }
    }

    // Digital & Vidéos (E09) : CO2 serveurs souvent à 0
    if (name.includes('vidéo') && name.includes('internet') && co2 === 0) {
      co2 = 0.05;
      modified = true;
    }

    // Hygiène (Dents, Mains) : CO2 énergétique
    if ((name.includes('douche') || name.includes('dents') || name.includes('mains')) && co2 === 0) {
      if (name.includes('douche')) co2 = 0.25;
      else co2 = 0.05;
      modified = true;
    }

    if (modified) {
      corrections.push({ id: a.id, code: a.code, name: a.referenceName, old: { co2: a.defaultCo2, water: a.defaultWater, waste: a.defaultWaste }, new: { co2, water, waste } });
      await prisma.actionRef.update({
        where: { id: a.id },
        data: { defaultCo2: co2, defaultWater: water, defaultWaste: waste }
      });
    }
  }

  console.log(`✔ ${corrections.length} actions corrigées en base.`);

  // Génération du CSV V3
  const csvPath = 'c:/Users/User/Documents/Sync Pcloud/Professionnel/Dev/sosplanete-v2/.docs/3-fct/SOSPlanete_referentiel_actions_.csv';
  const v3CsvPath = 'c:/Users/User/Documents/Sync Pcloud/Professionnel/Dev/sosplanete-v2/.docs/3-fct/SOSPlanete_referentiel_actions_V3.csv';
  
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n');
  const newLines = [lines[0]]; // Header

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const parts = line.split(';');
    const code = parts[0];
    
    // On va chercher la valeur mise à jour en base
    const updated = await prisma.actionRef.findUnique({ where: { code } });
    if (updated) {
      parts[2] = updated.defaultCo2?.toString() || '0';
      parts[3] = updated.defaultWater?.toString() || '0';
      parts[4] = updated.defaultWaste?.toString() || '0';
      newLines.push(parts.join(';'));
    } else {
      newLines.push(line);
    }
  }

  fs.writeFileSync(v3CsvPath, newLines.join('\n'), 'utf8');
  console.log(`✔ CSV V3 créé : ${v3CsvPath}`);

  // Synchronisation massive des ActionsDone pour nettoyer l'historique
  console.log('--- 🔄 Synchronisation de toutes les actions déjà saisies ---');
  const actionDones = await prisma.actionDone.findMany({ include: { localAction: true } });
  for (const ad of actionDones) {
    const ref = await prisma.actionRef.findUnique({ where: { id: ad.localAction.actionRefId } });
    if (ref) {
      await prisma.actionDone.update({
        where: { id: ad.id },
        data: {
          savedCo2: ad.localAction.specificCo2 ?? ref.defaultCo2 ?? 0,
          savedWater: ad.localAction.specificWater ?? ref.defaultWater ?? 0,
          savedWaste: ad.localAction.specificWaste ?? ref.defaultWaste ?? 0,
        }
      });
    }
  }
  console.log(`✔ ${actionDones.length} historiques synchronisés.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
