import { PrismaClient } from '@prisma/client';
import { ImpactService } from '../src/modules/impact/impact.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const prisma = new PrismaService();
  const impactService = new ImpactService(prisma);

  const neyron = await prisma.instance.findFirst({ where: { schoolName: 'Neyron' } });
  if (!neyron) {
    console.log('Neyron non trouvé');
    return;
  }

  // Calcul du bilan pour l'année 2024-2025 (year 2025)
  const impact = await impactService.calculateImpact(2025, neyron.id);

  console.log('--- NOUVEAU DIAGNOSTIC IMPACT NEYRON (V8 Corrigé) ---');
  console.log('Instance:', neyron.schoolName, `(ID: ${neyron.id})`);
  console.log('----------------------------------------------------');
  console.log('AMÉLIORATION PLANÉTAIRE :', impact.results.effortPlanetairePercent, '%');
  console.log('SCORE PLANÈTES          :', impact.results.nbPlanetes);
  console.log('JOUR DU DÉPASSEMENT     :', impact.results.dateDepassement);
  console.log('(Sans effort             :', impact.results.dateDepassementSans, ')');
  console.log('----------------------------------------------------');
  console.log('PROJECTION MONDIALE (ANNUELLE) :');
  console.log('  CO2     :', impact.sums.totalCo2.toLocaleString(), 'tCO2e');
  console.log('  EAU     :', (impact.sums.totalWater/1000).toLocaleString(), 'm3');
  console.log('  DÉCHETS :', impact.sums.totalWaste.toLocaleString(), 'kg');
}

main().finally(() => process.exit(0));
