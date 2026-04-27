import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function audit() {
  const actions = await prisma.actionRef.findMany();
  
  // Baselines mondiales par semaine (env.)
  // CO2: 90kg / Eau: 26000L / Déchets: 6.25kg
  
  const report = [];
  
  for (const a of actions) {
    let suspect = false;
    let reasons = [];
    
    // Test de détection
    if ((a.defaultCo2 || 0) > 20) { suspect = true; reasons.push('CO2 excessif'); }
    if ((a.defaultWater || 0) > 2000) { suspect = true; reasons.push('Eau excessive'); }
    if ((a.defaultWaste || 0) > 2) { suspect = true; reasons.push('Déchets excessifs'); }
    
    // Test des 0 suspects
    if (a.referenceName.toLowerCase().includes('vêtement') && a.defaultWater === 0) { suspect = true; reasons.push('Eau manquante (textile)'); }
    if (a.referenceName.toLowerCase().includes('électronique') && a.defaultWater === 0) { suspect = true; reasons.push('Eau manquante (numérique)'); }
    if (a.referenceName.toLowerCase().includes('alimentaire') && a.defaultWater === 0) { suspect = true; reasons.push('Eau manquante (boucle alimentaire)'); }

    if (suspect) {
       report.push({
         ref: a.code,
         name: a.referenceName,
         co2: a.defaultCo2 || 0,
         water: a.defaultWater || 0,
         waste: a.defaultWaste || 0,
         reason: reasons.join(', ')
       });
    }
  }

  console.log('| Réf | Nom | Raison de suspicion | CO2 (kg) | Eau (L) | Déchets (kg) |');
  console.log('|-----|-----|----------------------|----------|---------|--------------|');
  report.forEach(r => {
    console.log(`| ${r.ref} | ${r.name} | ${r.reason} | ${r.co2.toFixed(2)} | ${r.water.toFixed(0)} | ${r.waste.toFixed(2)} |`);
  });
}

audit().finally(() => prisma.$disconnect());
