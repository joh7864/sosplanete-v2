const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_EASTER_EGGS = [
  {
    code: 'EE_NEPTUNE_BEACON',
    title: 'La Balise S.O.S de Neptune',
    crypticMessage:
      'Transmission lointaine 2070 : Une sonde automatique cryogénisée dérive en orbite de Neptune. Son signal de détresse est verrouillé par un code harmonique à 4 chiffres.',
    clues: [
      'Une équation planétaire basée sur la distance orbitale.',
      'Trouvez le code à 4 chiffres : 3-0-1-4.',
    ],
    explicitHint: 'Les capteurs indiquent la fréquence exacte : 3014.',
    triggerType: 'RIDDLE_ANSWER_INPUT',
    expectedAnswer: '3014',
    caseSensitive: false,
    triggerConfig: {},
    complexity: 'MEDIUM',
    rewardPointsIT: 60,
    orderIndex: 14,
    prerequisiteType: 'NONE',
    isActive: true,
  },
  {
    code: 'EE_SPACESHIPS_FLEET',
    title: "L'Escadrille de l'Arche",
    crypticMessage:
      "Flotte de surveillance 2070 : Les trois vaisseaux de reconnaissance spatiale attendent vos ordres d'alignement pour stabiliser le corridor orbital.",
    clues: [
      'Observez la ronde des navettes autour de la Terre 2070.',
      'Activez les vaisseaux dans l’ordre : Éclaireur ➔ Frégate ➔ Cargo.',
    ],
    explicitHint: 'Cliquez dans l’ordre sur les trois vaisseaux patrouillant en orbite.',
    triggerType: 'CUSTOM_ACTION',
    triggerConfig: { action: 'ships_order_click', sequence: ['scout', 'frigate', 'freighter'] },
    complexity: 'MEDIUM',
    rewardPointsIT: 70,
    orderIndex: 15,
    prerequisiteType: 'NONE',
    isActive: true,
  },
  {
    code: 'EE_SOLAR_ECLIPSE',
    title: "L'Éclipse Solaire Artificielle",
    crypticMessage:
      "Alerte éruption coronale : L'Arche doit déployer son bouclier miroir orbital pour filtrer les rayonnements ultraviolets. Entrez la commande d'urgence dans le Comm-Link !",
    clues: [
      'Une commande Comm-Link commençant par un point d’exclamation !',
      'Tapez !eclipse pour occulter le flux solaire.',
    ],
    explicitHint: 'Saisissez !eclipse dans le canal de communication.',
    triggerType: 'COMM_LINK_COMMAND',
    triggerConfig: { command: '!eclipse' },
    complexity: 'EASY',
    rewardPointsIT: 50,
    orderIndex: 16,
    prerequisiteType: 'NONE',
    isActive: true,
  },
  {
    code: 'EE_TELLURIC_HARMONY',
    title: "L'Harmonie Tellurique",
    crypticMessage:
      'Équilibre biosphérique 2070 : Pour régénérer le cycle naturel de la planète, réalignez les 3 indicateurs de ressources de votre profil d’agent.',
    clues: [
      'Ouvrez votre profil d’agent.',
      'Séquence : Eau ➔ Déchets ➔ Eau ➔ Carbone ➔ Déchets.',
    ],
    explicitHint: 'Cliquez sur les jauges du profil dans l’ordre indiqué pour stabiliser l’écosystème.',
    triggerType: 'METRIC_SEQUENCE',
    triggerConfig: { sequence: ['water', 'waste', 'water', 'carbon', 'waste'] },
    complexity: 'MEDIUM',
    rewardPointsIT: 70,
    orderIndex: 17,
    prerequisiteType: 'NONE',
    isActive: true,
  },
  {
    code: 'EE_PULSAR_SIGNAL',
    title: 'Le Signal Pulsar 2070',
    crypticMessage:
      "Un pulsar radio lointain module une fréquence stellaire contenant le nom d'un projet secret de reboisement boréal.",
    clues: [
      'Le mot de passe correspond aux lueurs célestes polaires magnétiques.',
      '6 lettres commençant par A : A-U-R-O-R-A.',
    ],
    explicitHint: 'Tapez AURORA pour décoder la transmission.',
    triggerType: 'RIDDLE_ANSWER_INPUT',
    expectedAnswer: 'AURORA',
    caseSensitive: false,
    triggerConfig: {},
    complexity: 'MEDIUM',
    rewardPointsIT: 60,
    orderIndex: 18,
    prerequisiteType: 'NONE',
    isActive: true,
  },
  {
    code: 'EE_GRAVITON_LOCK',
    title: 'Le Verrou de Graviton',
    crypticMessage:
      'Les générateurs inertiels de l’Arche subissent une surtension gravitationnelle. Une secousse physique calibrée est requise pour réinitialiser le gyroscope !',
    clues: [
      'Utilisez le gyroscope de votre appareil ou simulez une impulsion cinétique.',
      'Secouez vigoureusement votre smartphone 3 fois.',
    ],
    explicitHint: 'Secouez votre appareil mobile 3 fois consécutives pour relancer les turbines.',
    triggerType: 'CUSTOM_ACTION',
    triggerConfig: { action: 'device_shake' },
    complexity: 'EASY',
    rewardPointsIT: 50,
    orderIndex: 19,
    prerequisiteType: 'NONE',
    isActive: true,
  },
  {
    code: 'EE_OXYGEN_SPECTRUM',
    title: "Le Spectre de l'Oxygène Pur",
    crypticMessage:
      "Analyse spectrographique 2070 : Les capteurs atmosphériques mesurent le seuil critique d'ozone et d'oxygène de l'an de mission.",
    clues: [
      'L’année de référence de notre Arche spatiale.',
      '4 chiffres symbolisant notre siècle futur.',
    ],
    explicitHint: 'L’année cible est 2070.',
    triggerType: 'RIDDLE_ANSWER_INPUT',
    expectedAnswer: '2070',
    caseSensitive: false,
    triggerConfig: {},
    complexity: 'EASY',
    rewardPointsIT: 50,
    orderIndex: 20,
    prerequisiteType: 'NONE',
    isActive: true,
  },
  {
    code: 'EE_WHALE_SONG',
    title: 'Le Chant Bio-Acoustique',
    crypticMessage:
      'Archives sonores de la Terre : Les bancs de données de l’Arche conservent les vibrations des grands fonds océaniques. Invoquez la biosphère marine !',
    clues: [
      'Une commande commençant par !',
      'Tapez !biosphere dans le Comm-Link.',
    ],
    explicitHint: 'Tapez la commande !biosphere dans le chat.',
    triggerType: 'COMM_LINK_COMMAND',
    triggerConfig: { command: '!biosphere' },
    complexity: 'EASY',
    rewardPointsIT: 50,
    orderIndex: 21,
    prerequisiteType: 'NONE',
    isActive: true,
  },
  {
    code: 'EE_QUANTUM_KEY',
    title: 'La Clé Quantique Temporelle',
    crypticMessage:
      "Sas du Réacteur Temporel : L'accès aux générateurs de flux chronologique est scellé par une série de nombres premiers et l'inversion d'une signature légendaire.",
    clues: [
      "Le miroir numérique du mot 'LEET' bien connu des hackers du XXe siècle.",
      '4 chiffres : 7-3-3-1.',
    ],
    explicitHint: 'Entrez le code 7331 pour déverrouiller la passerelle.',
    triggerType: 'RIDDLE_ANSWER_INPUT',
    expectedAnswer: '7331',
    caseSensitive: false,
    triggerConfig: {},
    complexity: 'HARD',
    rewardPointsIT: 80,
    orderIndex: 22,
    prerequisiteType: 'NONE',
    isActive: true,
  },
];

async function main() {
  console.log('=== SEEDING NEW EASTER EGGS (WITHOUT OVERWRITING EXISTING) ===');
  for (const egg of NEW_EASTER_EGGS) {
    const existing = await prisma.evoeEasterEgg.findFirst({
      where: { code: egg.code },
    });
    if (!existing) {
      const created = await prisma.evoeEasterEgg.create({
        data: egg,
      });
      console.log(`✅ Créé: [ID ${created.id}] ${created.code} - "${created.title}" (prerequisiteType: ${created.prerequisiteType})`);
    } else {
      console.log(`ℹ️ Déjà existant (non modifié): [ID ${existing.id}] ${existing.code}`);
    }
  }

  const total = await prisma.evoeEasterEgg.count();
  console.log(`\n🎉 Total d'Easter Eggs dans le catalogue : ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
