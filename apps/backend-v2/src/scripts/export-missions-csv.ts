import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const CATEGORY_SF_MAP: Record<string, string> = {
  'Alimentation': 'Secteur Bio-Génétique',
  'Energie': 'Matrice Énergétique',
  'Énergie': 'Matrice Énergétique',
  'Déchets': 'Recycleur Moléculaire',
  'Eau': 'Bouclier Hydrique',
  'Biodiversité': 'Biosphère & Faune',
  'Transport': 'Vecteur de Mobilité',
  'Numérique': 'Réseau Cybernétique',
};

// Helper pour échapper les cellules CSV
function escapeCsv(str: any): string {
  if (str === null || str === undefined) return '""';
  const text = String(str).replace(/"/g, '""');
  return `"${text}"`;
}

async function main() {
  console.log('Fetching missions from database...');

  // 1. Chercher toutes les LocalActions
  const localActions = await prisma.localAction.findMany({
    include: {
      category: true,
      actionRef: true,
      evoeMission: true,
    },
    orderBy: [
      { categoryId: 'asc' },
      { id: 'asc' }
    ]
  });

  console.log(`Found ${localActions.length} local actions.`);

  const rows: string[] = [];
  // Header CSV
  rows.push([
    'ID',
    'Catégorie Réelle',
    'Secteur Futuriste',
    'Titre Futuriste (SF)',
    'Description Narrative (SF)',
    'Objectif / Action Réelle',
    'Description Réelle',
    'Économie CO2 (kg)',
    'Économie Eau (L)',
    'Économie Déchets (kg)',
    'Gain HP / IT'
  ].map(escapeCsv).join(';'));

  // Pour dédupliquer si plusieurs instances partagent les mêmes actions
  const seenActionKeys = new Set<string>();

  for (const action of localActions) {
    const physicalCat = action.category?.name || action.actionRef?.category || 'Général';
    const catSF = CATEGORY_SF_MAP[physicalCat] || `Secteur ${physicalCat}`;

    let titreSF = action.evoeMission?.titreSF || action.label;
    if (
      titreSF === 'Intervention Systémique Mineure' ||
      titreSF === `Opération : ${action.label}`
    ) {
      titreSF = `Mission : ${action.label}`;
    }

    let descSF = action.evoeMission?.descriptionSF || action.description || '';
    if (!descSF || descSF.includes("effectuez l'action écologique correspondante")) {
      let introFun = "Une anomalie spatio-temporelle fait trembler les fondations de l'Arche ! Pour stabiliser la matrice, ta mission absolue est de :";
      if (physicalCat.toLowerCase().includes('eau')) {
        introFun = "Une fuite critique menace le bouclier hydrique de l'Arche. Pour colmater la brèche temporelle, ta mission est d'accomplir impérativement l'action suivante :";
      } else if (physicalCat.toLowerCase().includes('energie') || physicalCat.toLowerCase().includes('énergie')) {
        introFun = "L'excès de photons signale notre position aux traqueurs temporels ! Active le mode furtif en accomplissant l'action suivante :";
      } else if (physicalCat.toLowerCase().includes('alimentation') || physicalCat.toLowerCase().includes('courses')) {
        introFun = "Les réplicateurs de biomasse sont en surchauffe totale ! Pour éviter l'explosion du réacteur gastrique de l'Arche, tu dois :";
      } else if (physicalCat.toLowerCase().includes('déchet') || physicalCat.toLowerCase().includes('dechet')) {
        introFun = "Alerte : corruption du compacteur moléculaire détectée ! Rétablis l'ordre cosmique en accomplissant la directive :";
      } else if (physicalCat.toLowerCase().includes('biodiversité') || physicalCat.toLowerCase().includes('animaux')) {
        introFun = "Le champ de stase de notre faune originelle s'effondre ! Pour sauver notre ADN source, ta mission de sauvetage est de :";
      }
      descSF = `${introFun} **${action.label}**`;
    }

    const co2 = action.specificCo2 ?? action.actionRef?.defaultCo2 ?? 0;
    const water = action.specificWater ?? action.actionRef?.defaultWater ?? 0;
    const waste = action.specificWaste ?? action.actionRef?.defaultWaste ?? 0;
    const calculated = Math.round(co2 + water + waste);
    const hp = calculated > 0 ? calculated : (action.evoeMission?.pointsGagnes || 10);

    const key = `${titreSF}__${action.label}`;
    if (seenActionKeys.has(key)) continue;
    seenActionKeys.add(key);

    rows.push([
      action.id,
      physicalCat,
      catSF,
      titreSF,
      descSF,
      action.label,
      action.description || '',
      co2.toFixed(1),
      water.toFixed(1),
      waste.toFixed(1),
      hp
    ].map(escapeCsv).join(';'));
  }

  // Si pas assez de localActions, exporter aussi depuis ActionRef
  if (localActions.length === 0) {
    const actionRefs = await prisma.actionRef.findMany();
    for (const ref of actionRefs) {
      const physicalCat = ref.category || 'Général';
      const catSF = CATEGORY_SF_MAP[physicalCat] || `Secteur ${physicalCat}`;
      rows.push([
        ref.id,
        physicalCat,
        catSF,
        `Mission : ${ref.referenceName}`,
        ref.description || '',
        ref.referenceName,
        ref.description || '',
        (ref.defaultCo2 || 0).toFixed(1),
        (ref.defaultWater || 0).toFixed(1),
        (ref.defaultWaste || 0).toFixed(1),
        10
      ].map(escapeCsv).join(';'));
    }
  }

  const csvContent = '\uFEFF' + rows.join('\r\n'); // UTF-8 BOM pour Excel
  
  const outputPathDocs = path.resolve(__dirname, '../../../../.docs/MISSIONS_FUTURISTES_EVOE.csv');
  const outputPathRoot = path.resolve(__dirname, '../../../../MISSIONS_FUTURISTES_EVOE.csv');

  fs.writeFileSync(outputPathDocs, csvContent, 'utf-8');
  fs.writeFileSync(outputPathRoot, csvContent, 'utf-8');

  console.log(`CSV Export completed successfully !`);
  console.log(`- ${outputPathDocs}`);
  console.log(`- ${outputPathRoot}`);
  console.log(`Total rows exported: ${rows.length - 1}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
