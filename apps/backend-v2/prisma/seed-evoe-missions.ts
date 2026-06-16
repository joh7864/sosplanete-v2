import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Normalisation du texte pour comparaison insensible à la casse, aux accents et à la ponctuation
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]/g, ' ')      // Remplace la ponctuation par des espaces
    .replace(/\s+/g, ' ')            // Supprime les espaces multiples
    .trim();
}

// Recherche le meilleur match entre une action de la base de données et les données du CSV
function findBestMatch(dbLabel: string, csvActions: { original: string; titre: string; desc: string }[]) {
  const normDb = normalize(dbLabel);

  // 1. Recherche d'une correspondance exacte
  const exact = csvActions.find(c => normalize(c.original) === normDb);
  if (exact) return exact;

  // 2. Recherche par inclusion (l'un contient l'autre)
  const sub = csvActions.find(c => {
    const normCsv = normalize(c.original);
    return normDb.includes(normCsv) || normCsv.includes(normDb);
  });
  if (sub) return sub;

  // 3. Recherche par mots-clés communs (seuil de mots partagés)
  const dbWords = normDb.split(' ').filter(w => w.length > 3);
  let bestMatch: typeof csvActions[0] | null = null;
  let maxMatches = 0;

  for (const csvAction of csvActions) {
    const csvWords = normalize(csvAction.original).split(' ').filter(w => w.length > 3);
    const matches = dbWords.filter(w => csvWords.includes(w)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = csvAction;
    }
  }

  // Si au moins 2 mots clés importants correspondent, on valide
  if (maxMatches >= 2 && bestMatch) {
    return bestMatch;
  }

  // 4. Mappages spécifiques en dur pour les actions typiques n'existant pas dans le CSV
  const hardcodedMap: Record<string, { titre: string; desc: string }> = {
    'frigo': {
      titre: 'Confinement Cryogénique',
      desc: "La déperdition thermique du module de réfrigération surcharge les condenseurs. **Fermez immédiatement la porte du frigo** après usage pour sceller l'énergie froide."
    },
    'heures creuses': {
      titre: 'Cycle Temporel Synchrone',
      desc: "Le réseau énergétique de l'Arche est surchargé pendant les pics solaires. **Utilisez vos appareils gourmands pendant les heures creuses** pour lisser la courbe de charge globale."
    },
    'tele': {
      titre: 'Extinction des Interfaces Visuelles',
      desc: "Les terminaux de divertissement inactifs consomment une énergie critique. **Éteignez complètement la télévision** dès que vous quittez la zone de visualisation."
    },
    'veille': {
      titre: 'Coupure des Signaux Fantômes',
      desc: "Des signaux fantômes drainent le plasma du réacteur. **Débranchez ou éteignez totalement les appareils en veille** (TV, PC) pour couper ces fuites énergétiques."
    }
  };

  for (const [key, val] of Object.entries(hardcodedMap)) {
    if (normDb.includes(key)) {
      return { original: dbLabel, titre: val.titre, desc: val.desc };
    }
  }

  return null;
}

async function main() {
  console.log("🚀 Début du peuplement du Codex SF Evoe...");

  // 1. Localiser le fichier CSV (recherche multi-chemins dev & production)
  const csvPaths = [
    path.join(__dirname, '../../../.docs/3-fct/Missiosn Evoe.csv'),
    path.join(__dirname, '../../.docs/3-fct/Missiosn Evoe.csv'),
    path.join(__dirname, '../.docs/3-fct/Missiosn Evoe.csv'),
    '/.docs/3-fct/Missiosn Evoe.csv',
    '/app/.docs/3-fct/Missiosn Evoe.csv'
  ];

  let csvFilePath = '';
  for (const p of csvPaths) {
    if (fs.existsSync(p)) {
      csvFilePath = p;
      break;
    }
  }

  if (!csvFilePath) {
    console.error("❌ Fichier CSV 'Missiosn Evoe.csv' introuvable dans les chemins configurés !");
    process.exit(1);
  }

  console.log(`Fichier CSV localisé : ${csvFilePath}`);
  const csvContent = fs.readFileSync(csvFilePath, 'utf8');

  // 2. Parser le CSV de façon robuste
  const lines = csvContent.split(/\r?\n/).slice(1);
  const csvActions = lines
    .map(line => {
      const parts = line.split(';');
      if (parts.length < 3) return null;
      return {
        original: parts[0].trim(),
        titre: parts[1].trim(),
        desc: parts[2].trim()
      };
    })
    .filter(Boolean) as { original: string; titre: string; desc: string }[];

  console.log(`Chargé ${csvActions.length} traductions SF depuis le CSV.`);

  // 3. Récupérer toutes les LocalActions de la base
  const localActions = await prisma.localAction.findMany({
    include: { category: true }
  });
  console.log(`Trouvé ${localActions.length} LocalActions dans la base de données.`);

  let matchedCount = 0;
  let fallbackCount = 0;

  for (const action of localActions) {
    // Tenter de trouver la correspondance la plus proche
    const match = findBestMatch(action.label, csvActions);

    let titreSF = '';
    let descSF = '';

    if (match) {
      titreSF = match.titre;
      descSF = match.desc;
      matchedCount++;
    } else {
      // Fallback générique basé sur la catégorie ou le libellé physique
      const physicalCat = action.category?.name || '';
      let introFun = "Une anomalie spatio-temporelle fait trembler les fondations de l'Arche ! Pour stabiliser la matrice, ta mission absolue est de :";
      
      if (physicalCat.toLowerCase().includes('eau')) {
        introFun = "Une fuite critique menace le bouclier hydrique de l'Arche. Pour colmater la brèche temporelle, ta mission est de :";
      } else if (physicalCat.toLowerCase().includes('energie') || physicalCat.toLowerCase().includes('énergie')) {
        introFun = "L'excès de photons signale notre position aux traqueurs temporels ! Active le mode furtif en accomplissant l'action :";
      } else if (physicalCat.toLowerCase().includes('alimentation') || physicalCat.toLowerCase().includes('courses')) {
        introFun = "Les réplicateurs de biomasse sont en surchauffe totale ! Pour éviter l'explosion du réacteur gastrique, tu dois :";
      } else if (physicalCat.toLowerCase().includes('déchet') || physicalCat.toLowerCase().includes('dechet')) {
        introFun = "Alerte : corruption du compacteur moléculaire détectée ! Rétablis l'ordre cosmique en accomplissant la directive :";
      } else if (physicalCat.toLowerCase().includes('biodiversité') || physicalCat.toLowerCase().includes('animaux')) {
        introFun = "Le champ de stase de notre faune originelle s'effondre ! Pour sauver notre ADN source, ta mission de sauvetage est de :";
      }

      titreSF = `Mission : ${action.label}`;
      descSF = `${introFun} **${action.label}**`;
      fallbackCount++;
    }

    // Calcul des points (ou fallback à 10)
    const pts = (action.specificCo2 || 0) + (action.specificWater || 0) + (action.specificWaste || 0);
    const pointsGagnes = pts > 0 ? Math.round(pts) : 10;

    await prisma.evoeMissionTranslation.upsert({
      where: { localActionId: action.id },
      update: {
        titreSF: titreSF,
        descriptionSF: descSF,
        pointsGagnes: pointsGagnes
      },
      create: {
        localActionId: action.id,
        titreSF: titreSF,
        descriptionSF: descSF,
        pointsGagnes: pointsGagnes
      }
    });
  }

  console.log(`\n🎉 Initialisation terminée !`);
  console.log(`✅ ${matchedCount} actions associées à des missions spécifiques du CSV.`);
  console.log(`⚠️ ${fallbackCount} actions sans correspondance exacte (générées avec la description générique).`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
