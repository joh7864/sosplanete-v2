import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Phase 1 : Mise à jour de la Base de Données ---');
  
  const corrections = [
    { ref: 'D11', co2: 0.38, water: 0, waste: 0.67 },      // Vrac (34kg -> 0.67kg)
    { ref: 'D14', co2: 2.51, water: 2500, waste: 0.14 },   // Vêtement (Eau indirecte)
    { ref: 'D16', co2: 5.49, water: 1500, waste: 1.48 },   // Elec T. Forte (Eau indirecte)
    { ref: 'D17', co2: 1.12, water: 800, waste: 0.52 },    // Elec Forte (Eau indirecte)
    { ref: 'A10', co2: 7.50, water: 800, waste: 0.20 },    // Viande (Eau indirecte) - Note: A10 n'est pas dans le CSV lu mais peut être en base
    { ref: 'W01', co2: 0.25, water: 224, waste: 0 },       // Douche (CO2 énergie)
    { ref: 'E07', co2: 6.10, water: 0, waste: 0 },         // Chauffage (24kg -> 6.10kg)
    { ref: 'D13', co2: 0.36, water: 15, waste: 0.38 },     // Stop Pub (Eau industrielle)
    { ref: 'W02', co2: 0.05, water: 28, waste: 0 }         // Dents (CO2 pompage)
  ];

  for (const c of corrections) {
    const action = await prisma.actionRef.findUnique({ where: { code: c.ref } });
    if (action) {
      await prisma.actionRef.update({
        where: { code: c.ref },
        data: {
          defaultCo2: c.co2,
          defaultWater: c.water,
          defaultWaste: c.waste
        }
      });
      console.log(`✔ Base : ${c.ref} mis à jour.`);
    }
  }

  console.log('\n--- Phase 2 : Génération du nouveau CSV référentiel ---');
  
  const csvPath = 'c:/Users/User/Documents/Sync Pcloud/Professionnel/Dev/sosplanete-v2/.docs/3-fct/SOSPlanete_referentiel_actions_.csv';
  const newCsvPath = 'c:/Users/User/Documents/Sync Pcloud/Professionnel/Dev/sosplanete-v2/.docs/3-fct/SOSPlanete_referentiel_actions_V2.csv';
  
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n');
  const newLines = [];

  // En-tête
  newLines.push(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const parts = line.split(';');
    const ref = parts[0];
    
    // Chercher si on a une correction pour cette ligne
    const corr = corrections.find(c => c.ref === ref);
    
    if (corr) {
      parts[2] = corr.co2.toString();
      parts[3] = corr.water.toString();
      parts[4] = corr.waste.toString();
      newLines.push(parts.join(';'));
    } else {
      newLines.push(line);
    }
  }

  fs.writeFileSync(newCsvPath, newLines.join('\n'), 'utf8');
  console.log(`✔ CSV : Nouveau fichier créé -> ${newCsvPath}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
