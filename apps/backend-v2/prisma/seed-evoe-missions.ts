import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dictionnaire de traduction créative : Action physique -> Mission SF
// Les directives physiques sont en gras pour être très claires.
const sfTranslations: Record<string, { titre: string; desc: string }> = {
  // --- EAU ---
  "Fermer l'eau du robinet pendant le brossage des dents": {
    titre: "Stabilisation des Réserves Hydriques",
    desc: "Une fuite critique menace le bouclier hydrique de l'Arche. Pour colmater la brèche temporelle, votre mission est de **fermer impérativement le robinet d'eau** de votre base terrestre pendant tout le brossage de vos dents."
  },
  "Prendre une douche au lieu d'un bain": {
    titre: "Optimisation de la Capsul-Douche",
    desc: "Les cuves d'immersion totale pompent trop de ressources. Pour maintenir l'énergie de survie, **prenez une douche courte** au lieu d'un bain dans votre module sanitaire."
  },
  
  // --- ENERGIE ---
  "Eteindre les lumières en quittant une pièce": {
    titre: "Furtivité Énergétique",
    desc: "L'excès de photons signale notre position aux algorithmes traqueurs. Activez le mode furtif en **éteignant systématiquement les lumières** de chaque pièce terrestre que vous quittez."
  },
  "Eteindre les appareils en veille": {
    titre: "Coupure des Signaux Fantômes",
    desc: "Des signaux fantômes drainent le plasma du réacteur. Votre directive : **débranchez ou éteignez totalement les appareils en veille** (TV, PC) pour couper ces fuites énergétiques."
  },
  
  // --- DECHETS ---
  "Trier ses déchets": {
    titre: "Tri des Composants Instables",
    desc: "Des matériaux hétérogènes menacent de corrompre le compacteur moléculaire. Votre rôle est de **trier scrupuleusement vos déchets** (carton, plastique, verre) dans les bons réceptacles."
  },
  "Utiliser une gourde au lieu d'une bouteille en plastique": {
    titre: "Ravitaillement Zéro-Polymère",
    desc: "Les polymères à usage unique polluent les conduits de la biosphère. Pour y remédier, **utilisez une gourde réutilisable** pour votre ravitaillement hydrique quotidien."
  },
  
  // --- ALIMENTATION ---
  "Manger un repas végétarien": {
    titre: "Synthèse de Biomasse Optimisée",
    desc: "Les réplicateurs carnés surchargent le cœur du réacteur. Pour réduire l'empreinte thermique du QG, optez pour la **consommation d'un repas 100% végétarien** lors de votre prochain cycle de nutrition."
  },
  "Manger des fruits et légumes de saison": {
    titre: "Synchronisation Bio-Saisonnière",
    desc: "L'importation de biomasse hors-secteur affaiblit nos défenses. Optimisez le réseau en **consommant exclusivement des fruits et légumes de saison et locaux**."
  },
  
  // --- NUMERIQUE ---
  "Supprimer ses emails inutiles": {
    titre: "Purge des Archives Mémorielles",
    desc: "Les serveurs centraux sont saturés par des données obsolètes. Lancez une procédure de nettoyage en **supprimant vos emails inutiles ou anciens** pour libérer la bande passante de l'Arche."
  },

  // FALLBACK GENERIQUE
  "DEFAULT": {
    titre: "Intervention Systémique Mineure",
    desc: "Une anomalie de bas niveau a été repérée dans votre secteur. Pour la résoudre, **effectuez l'action écologique correspondante** dans votre espace temporel terrestre."
  }
};

async function main() {
  console.log("🚀 Début de l'initialisation du Codex SF Evoe...");

  // 1. Récupérer toutes les LocalActions
  const actions = await prisma.localAction.findMany();
  console.log(`Trouvé ${actions.length} actions physiques dans la base de données.`);

  // 2. Créer ou mettre à jour les traductions
  let updatedCount = 0;
  for (const action of actions) {
    // Normaliser la chaîne pour trouver une correspondance (ignorer la casse et les espaces superflus)
    const labelKey = Object.keys(sfTranslations).find(
      key => key.toLowerCase().trim() === action.label.toLowerCase().trim()
    );

    const translation = labelKey ? sfTranslations[labelKey] : sfTranslations["DEFAULT"];

    // Calcul des points (reprend la logique du service si pointsGagnes n'est pas fourni,
    // mais on va forcer une valeur pour s'assurer que ça s'affiche bien)
    const pts = (action.specificCo2 || 0) + (action.specificWater || 0) + (action.specificWaste || 0);
    const pointsGagnes = pts > 0 ? Math.round(pts) : 10;

    await prisma.evoeMissionTranslation.upsert({
      where: {
        localActionId: action.id
      },
      update: {
        titreSF: translation.titre,
        descriptionSF: translation.desc,
        pointsGagnes: pointsGagnes
      },
      create: {
        localActionId: action.id,
        titreSF: translation.titre,
        descriptionSF: translation.desc,
        pointsGagnes: pointsGagnes
      }
    });
    updatedCount++;
  }

  console.log(`✅ Succès : ${updatedCount} missions SF synchronisées dans le Codex !`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
