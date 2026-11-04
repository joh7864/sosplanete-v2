import { PrismaClient, Role, EasterEggTriggerType, EasterEggDifficulty, ChallengeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Vérification de sécurité stricte
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl.includes(':5434') && !dbUrl.includes('sos_recette')) {
  console.error(`⛔ SÉCURITÉ : seed-recette.ts ne peut s'exécuter QUE sur la base de recette (port 5434 ou nom sos_recette).`);
  console.error(`URL détectée : ${dbUrl}`);
  process.exit(1);
}

function parseSemicolonCsv(content: string) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  const header = lines[0].split(';').map(h => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    const row: Record<string, string> = {};
    header.forEach((col, idx) => {
      row[col] = (parts[idx] ?? '').trim().replace(/^"|"$/g, '');
    });
    rows.push(row);
  }
  return { header, rows };
}

export async function runSeedRecette(p: PrismaClient = prisma) {
  console.log('🚀 Démarrage du seed déterministe sur la base de recette (PostgreSQL:5434)...');

  // 1. Nettoyage ordonné des données existantes pour idempotence parfaite
  console.log('🧹 Nettoyage des anciennes données...');
  await prisma.actionDone.deleteMany({});
  await prisma.evoeEasterEggPlayerProgress.deleteMany({});
  await prisma.evoeEasterEggTeamReward.deleteMany({});
  await prisma.evoeEasterEggInstance.deleteMany({});
  await prisma.evoeEasterEgg.deleteMany({});
  await prisma.evoeChallenge.deleteMany({});
  await prisma.evoeTeamTechnology.deleteMany({});
  await prisma.child.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.period.deleteMany({});
  await prisma.evoeMissionTranslation.deleteMany({});
  await prisma.localAction.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.gameConfig.deleteMany({});
  await prisma.instanceYear.deleteMany({});
  await prisma.instance.deleteMany({});
  await prisma.actionRef.deleteMany({});
  await prisma.categoryRef.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.annualImpactData.deleteMany({});
  await prisma.systemConfig.deleteMany({});

  // 2. Utilisateurs
  console.log('👤 Création des utilisateurs...');
  const hashJo = await bcrypt.hash('jo', 10);
  const hashProf = await bcrypt.hash('prof123', 10);
  const hashVisiteur = await bcrypt.hash('visiteur123', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'jo@dev.fr',
      name: 'Jo SuperAdmin',
      password: hashJo,
      role: Role.AS,
    },
  });

  const profAdmin = await prisma.user.create({
    data: {
      email: 'prof@ecole-recette.fr',
      name: 'Professeur Xavier',
      password: hashProf,
      role: Role.AM,
    },
  });

  const autreProf = await prisma.user.create({
    data: {
      email: 'visiteur@dev.fr',
      name: 'Autre Prof',
      password: hashVisiteur,
      role: Role.AM,
    },
  });

  // 3. Constantes Mondiales & SystemConfig
  console.log('🌍 Insertion des constantes mondiales...');
  const impactData = [
    { year: 2024, dActuel: 214, moyCo2Monde: 4.75, moyEauMonde: 1390000, moyDechetsMonde: 325, popMonde: 8.16 },
    { year: 2025, dActuel: 205, moyCo2Monde: 4.80, moyEauMonde: 1400000, moyDechetsMonde: 330, popMonde: 8.23 },
    { year: 2026, dActuel: 200, moyCo2Monde: 4.85, moyEauMonde: 1410000, moyDechetsMonde: 335, popMonde: 8.30 },
  ];
  for (const imp of impactData) {
    await prisma.annualImpactData.create({ data: imp });
  }

  await prisma.systemConfig.create({
    data: {
      schoolYear: '2025-2026',
      emissionsParHabitantAn: 11.0,
      temperatureMalade: 42.0,
      temperatureSaine: 37.0,
      populationReference: 68000000,
      youtubeBriefingUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      ftuxSteps: [
        { id: 1, title: 'Passerelle 2026', explanation: 'Bienvenue sur la passerelle spatiale.' },
        { id: 2, title: 'Codex Écologique', explanation: 'Consultez les missions de votre vaisseau.' },
        { id: 3, title: 'Impulsions Temporelles', explanation: 'Récoltez des IT pour propulser l Arche.' },
      ],
    },
  });

  // 4. Catégories de référence depuis Catégories.csv
  console.log('📂 Importation des catégories de référence...');
  const catCsvPath = path.join(__dirname, '../../../.docs/5-tests/Catégories.csv');
  const catCsv = parseSemicolonCsv(fs.readFileSync(catCsvPath, 'utf8'));
  const categoryRefMap = new Map<string, number>();

  for (const row of catCsv.rows) {
    const createdCat = await prisma.categoryRef.create({
      data: {
        name: row['Nom'],
        icon: row['Icone'] || null,
        order: parseInt(row['ordre'] || '0', 10),
      },
    });
    categoryRefMap.set(row['Nom'], createdCat.id);
  }

  // 5. Référentiel d'Actions communes (SOSPlanète-v1 + Evoe SF)
  console.log('📜 Importation du référentiel complet d actions...');
  const actionsCsvPath = path.join(__dirname, '../../../.docs/5-tests/Referentiel_actions_complet_v1_et_evoe.csv');
  const actionsCsv = parseSemicolonCsv(fs.readFileSync(actionsCsvPath, 'utf8'));

  const actionRefList: any[] = [];
  for (const row of actionsCsv.rows) {
    const catName = row['Catégorie'] || 'Biodiversité';
    const catRefId = categoryRefMap.get(catName);

    const aRef = await prisma.actionRef.create({
      data: {
        code: row['ID_REF action'],
        referenceName: row['Titre action (SOSPlanète-v1)'],
        description: row['Description action (SOSPlanète-v1)'] || null,
        defaultCo2: parseFloat(row['CO2e (kg CO2e / sem)'] || '0'),
        defaultWater: parseFloat(row['Eau (l /sem)'] || '0'),
        defaultWaste: parseFloat(row['Déchets (kg /sem)'] || '0'),
        co2Year: parseFloat(row['tCO2e /an'] || '0'),
        impactLabel: row['Impact'] || 'Moderate',
        impactTotal: parseFloat(row['Impact total'] || '0'),
        weightedStars: parseInt(row['Etoile pondéré'] || '3', 10),
        image: row['Image v1'] || null,
        hypotheseCalcul: row['Hypothese_Calcul'] || null,
        category: catName,
        categoryRefId: catRefId,
      },
    });
    actionRefList.push({
      ref: aRef,
      titreSF: row['Titre mission SF (Evoe)'],
      descSF: row['Description mission SF (Evoe)'],
    });
  }

  // 6. Instances (Écoles)
  console.log('🏫 Création des instances...');
  // Instance 1 : École de Recette active
  const instRecette = await prisma.instance.create({
    data: {
      schoolName: 'Académie Spatiale Recette',
      adminId: profAdmin.id,
    },
  });

  const instYearRecette = await prisma.instanceYear.create({
    data: {
      instanceId: instRecette.id,
      schoolYear: '2025-2026',
      hostUrl: 'recette.sosplanete.local',
      isOpen: true,
      adminId: profAdmin.id,
    },
  });

  await prisma.gameConfig.create({
    data: {
      instanceId: instRecette.id,
      schoolYear: '2025-2026',
      avgActionsPerChildPerPeriod: 8,
      gamePeriodsCount: 10,
      easterEggsEnabled: true,
      metaEnigmaSecretWord: 'CHRONOS',
    },
  });

  // Catégories locales pour Instance 1
  const localCategoryMap = new Map<string, number>();
  for (const row of catCsv.rows) {
    const locCat = await prisma.category.create({
      data: {
        name: row['Nom'],
        icon: row['Icone'] || null,
        order: parseInt(row['ordre'] || '0', 10),
        instanceYearId: instYearRecette.id,
      },
    });
    localCategoryMap.set(row['Nom'], locCat.id);
  }

  // Actions Locales & Traductions SF pour Instance 1
  const localActionMap = new Map<string, number>();
  for (const item of actionRefList) {
    const catId = localCategoryMap.get(item.ref.category);
    const locAction = await prisma.localAction.create({
      data: {
        label: item.ref.referenceName,
        description: item.ref.description,
        actionRefId: item.ref.id,
        instanceId: instRecette.id,
        categoryId: catId,
        schoolYear: '2025-2026',
        specificCo2: item.ref.defaultCo2,
        specificWater: item.ref.defaultWater,
        specificWaste: item.ref.defaultWaste,
        image: item.ref.image,
        imageEvoe: item.ref.image,
      },
    });
    localActionMap.set(item.ref.code, locAction.id);

    await prisma.evoeMissionTranslation.create({
      data: {
        localActionId: locAction.id,
        titreSF: item.titreSF || `Opération : ${item.ref.referenceName}`,
        descriptionSF: item.descSF || item.ref.description || 'Mission de préservation écologique.',
        pointsGagnes: 20,
        isHacked: false,
      },
    });
  }

  // Instance 2 : École Fermée (pour TST-EVOE-003 "espace fermé")
  const instFermee = await prisma.instance.create({
    data: {
      schoolName: 'Collège Horizon Nord (Fermé)',
      adminId: profAdmin.id,
    },
  });
  await prisma.instanceYear.create({
    data: {
      instanceId: instFermee.id,
      schoolYear: '2025-2026',
      hostUrl: 'horizon.sosplanete.local',
      isOpen: false,
      adminId: profAdmin.id,
    },
  });

  // Instance 3 : École Multi-Nexus (pour TST-EVOE-004 "résolution multi-nexus")
  const instNexus = await prisma.instance.create({
    data: {
      schoolName: 'École Multi-Nexus',
      adminId: autreProf.id,
    },
  });
  const instYearNexus = await prisma.instanceYear.create({
    data: {
      instanceId: instNexus.id,
      schoolYear: '2025-2026',
      hostUrl: 'multinexus.sosplanete.local',
      isOpen: true,
      adminId: autreProf.id,
    },
  });

  // 7. Équipes, Groupes et Élèves
  console.log('🚀 Création des équipes, équipages et joueurs...');
  const childPasswordHash = await bcrypt.hash('password123', 10);

  // Équipe 1 : Vaisseau Orion
  const teamOrion = await prisma.team.create({
    data: {
      name: 'Vaisseau Orion',
      color: '#3b82f6',
      instanceYearId: instYearRecette.id,
      evoeTechnology: {
        create: { maxLevel: 2 },
      },
    },
  });
  const groupOrion = await prisma.group.create({
    data: {
      name: 'Classe CM1 Orion',
      teamId: teamOrion.id,
    },
  });
  const groot = await prisma.child.create({
    data: {
      pseudo: 'groot',
      password: childPasswordHash,
      groupId: groupOrion.id,
      gender: 'M',
      birthDate: new Date('2015-05-12'),
      hasSeenBriefing: true,
      hasSeenOnboarding: true,
      avatar: 'avatars_3D/avatar_astronaut_01.glb',
    },
  });
  await prisma.child.create({
    data: {
      pseudo: 'homonyme',
      password: childPasswordHash,
      groupId: groupOrion.id,
      gender: 'F',
      birthDate: new Date('2015-08-10'),
      hasSeenBriefing: true,
      hasSeenOnboarding: true,
    },
  });

  // Équipe 2 : Vaisseau Phoenix
  const teamPhoenix = await prisma.team.create({
    data: {
      name: 'Vaisseau Phoenix',
      color: '#ef4444',
      instanceYearId: instYearRecette.id,
      evoeTechnology: {
        create: { maxLevel: 1 },
      },
    },
  });
  const groupPhoenix = await prisma.group.create({
    data: {
      name: 'Classe CM2 Phoenix',
      teamId: teamPhoenix.id,
    },
  });
  const mariane = await prisma.child.create({
    data: {
      pseudo: 'mariane',
      password: childPasswordHash,
      groupId: groupPhoenix.id,
      gender: 'F',
      birthDate: new Date('2014-09-20'),
      hasSeenBriefing: true,
      hasSeenOnboarding: true,
    },
  });

  // Équipe 3 : Vaisseau Cyber (Néo : nouvel élève sans onboarding)
  const teamCyber = await prisma.team.create({
    data: {
      name: 'Vaisseau Cyber',
      color: '#10b981',
      instanceYearId: instYearRecette.id,
      evoeTechnology: {
        create: { maxLevel: 1 },
      },
    },
  });
  const groupCyber = await prisma.group.create({
    data: {
      name: 'Classe 6ème Cyber',
      teamId: teamCyber.id,
    },
  });
  const neo = await prisma.child.create({
    data: {
      pseudo: 'neo',
      password: childPasswordHash,
      groupId: groupCyber.id,
      gender: 'M',
      birthDate: new Date('2013-11-05'),
      hasSeenBriefing: false,
      hasSeenOnboarding: false,
    },
  });

  // Équipe dans Instance 3 (pour homonymie de test TST-EVOE-004)
  const teamSatellite = await prisma.team.create({
    data: {
      name: 'Vaisseau Stella',
      color: '#8b5cf6',
      instanceYearId: instYearNexus.id,
    },
  });
  const groupSatellite = await prisma.group.create({
    data: {
      name: 'Classe Satellite',
      teamId: teamSatellite.id,
    },
  });
  await prisma.child.create({
    data: {
      pseudo: 'homonyme',
      password: childPasswordHash,
      groupId: groupSatellite.id,
      gender: 'F',
      birthDate: new Date('2015-08-10'),
    },
  });

  // 8. Périodes de Jeu
  console.log('⏳ Déploiement des périodes temporelles...');
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  // Période 1 : passée (close)
  const periodP1 = await prisma.period.create({
    data: {
      instanceYearId: instYearRecette.id,
      startDate: new Date(now - 14 * dayMs),
      endDate: new Date(now - 7 * dayMs),
      isOpen: false,
    },
  });

  // Période 2 : active (ouverte, courante)
  const periodActive = await prisma.period.create({
    data: {
      instanceYearId: instYearRecette.id,
      startDate: new Date(now - 3 * dayMs),
      endDate: new Date(now + 4 * dayMs),
      isOpen: true,
    },
  });

  // Période 3 : future (fermée)
  const periodFuture = await prisma.period.create({
    data: {
      instanceYearId: instYearRecette.id,
      startDate: new Date(now + 5 * dayMs),
      endDate: new Date(now + 12 * dayMs),
      isOpen: false,
    },
  });

  // 9. Actions Réalisées (ActionDone)
  console.log('⚡ Insertion des impulsions / actions réalisées...');
  const actionB01Id = localActionMap.get('B01')!;
  const actionB04Id = localActionMap.get('B04')!;
  const actionC01Id = localActionMap.get('C01')!;

  // Actions de groot en période 2 (3 actions)
  await prisma.actionDone.create({
    data: {
      childId: groot.id,
      localActionId: actionB01Id,
      periodId: periodActive.id,
      savedCo2: 1.0,
      savedWater: 50.0,
      savedWaste: 0.5,
    },
  });
  await prisma.actionDone.create({
    data: {
      childId: groot.id,
      localActionId: actionB04Id,
      periodId: periodActive.id,
      savedCo2: 4.48,
      savedWater: 0.0,
      savedWaste: 0.0,
    },
  });
  await prisma.actionDone.create({
    data: {
      childId: groot.id,
      localActionId: actionC01Id,
      periodId: periodActive.id,
      savedCo2: 5.0,
      savedWater: 100.0,
      savedWaste: 0.0,
    },
  });

  // Actions de mariane en période 2 (1 action)
  await prisma.actionDone.create({
    data: {
      childId: mariane.id,
      localActionId: actionB01Id,
      periodId: periodActive.id,
      savedCo2: 1.0,
      savedWater: 50.0,
      savedWaste: 0.5,
    },
  });

  // 10. Défis PvP
  console.log('⚔️ Création des défis PvP...');
  // Défi 1 en cours : Orion -> Phoenix sur action B01
  await prisma.evoeChallenge.create({
    data: {
      challengerTeamId: teamOrion.id,
      targetTeamId: teamPhoenix.id,
      localActionId: actionB01Id,
      periodId: periodActive.id,
      status: ChallengeStatus.PENDING,
      pledge: '10 pompes de cosmonaute',
      durationHours: 48,
    },
  });

  // Défi 2 remporté : Phoenix -> Orion sur action C01
  await prisma.evoeChallenge.create({
    data: {
      challengerTeamId: teamPhoenix.id,
      targetTeamId: teamOrion.id,
      localActionId: actionC01Id,
      periodId: periodActive.id,
      status: ChallengeStatus.SUCCESS,
      pledge: 'Chant de victoire galactique',
      durationHours: 24,
    },
  });

  // 11. Catalogue d'Easter Eggs & Déploiements
  console.log('🥚 Déploiement des Easter Eggs de recette...');
  const egg1 = await prisma.evoeEasterEgg.create({
    data: {
      code: 'EGG_01_SOLAR',
      title: 'Le Premier Signal Orbital',
      prerequisiteType: 'NONE',
      crypticMessage: 'Regarde au centre du système.',
      explicitHint: 'Quel astre éclaire la Terre ?',
      triggerType: EasterEggTriggerType.RIDDLE_ANSWER_INPUT,
      expectedAnswer: 'soleil',
      caseSensitive: false,
      complexity: EasterEggDifficulty.EASY,
      rewardPointsIT: 50,
      orderIndex: 1,
      isActive: true,
    },
  });

  const egg2 = await prisma.evoeEasterEgg.create({
    data: {
      code: 'EGG_02_CYBER',
      title: 'Cryptogramme Cybernétique',
      prerequisiteType: 'EASTER_EGG',
      prerequisiteConfig: { requiredEggCodes: ['EGG_01_SOLAR'] },
      crypticMessage: 'Le signal secondaire requiert la première clé.',
      explicitHint: 'Quel est le monde virtuel de Néo ?',
      triggerType: EasterEggTriggerType.RIDDLE_ANSWER_INPUT,
      expectedAnswer: 'matrix',
      caseSensitive: false,
      complexity: EasterEggDifficulty.MEDIUM,
      rewardPointsIT: 100,
      orderIndex: 2,
      isActive: true,
    },
  });

  const egg3 = await prisma.evoeEasterEgg.create({
    data: {
      code: 'EGG_03_PAUSE',
      title: 'Silence Cosmique',
      prerequisiteType: 'NONE',
      prerequisiteConfig: { pauseCycles: [1] },
      crypticMessage: 'Ce canal est silencieux pour le moment.',
      triggerType: EasterEggTriggerType.RIDDLE_ANSWER_INPUT,
      expectedAnswer: '42',
      complexity: EasterEggDifficulty.HARD,
      rewardPointsIT: 150,
      orderIndex: 3,
      isActive: true,
    },
  });

  // Déploiement des œufs dans l'instance 1 pour la période active
  for (const egg of [egg1, egg2, egg3]) {
    await prisma.evoeEasterEggInstance.create({
      data: {
        instanceYearId: instYearRecette.id,
        easterEggId: egg.id,
        periodStartId: periodActive.id,
        periodEndId: periodActive.id,
        isClosed: false,
      },
    });
  }

  console.log('✨ Seed de recette terminé avec succès !');
  console.log('--------------------------------------------------');
  console.log('📌 Comptes configurés :');
  console.log('   - SuperAdmin (AS) : jo@dev.fr / jo');
  console.log('   - Admin École (AM) : prof@ecole-recette.fr / prof123');
  console.log('   - Agent 1 (groot) : groot / password123 (Vaisseau Orion)');
  console.log('   - Agent 2 (mariane) : mariane / password123 (Vaisseau Phoenix)');
  console.log('   - Agent 3 (neo) : neo / password123 (Non-onboardé, Vaisseau Cyber)');
  console.log('   - Homonyme Multi-Nexus : homonyme / password123 (présent dans 2 écoles)');
  console.log('   - Base active : PostgreSQL 5434 (sos_recette)');
  console.log('--------------------------------------------------');
}

if (require.main === module) {
  runSeedRecette()
    .catch((e) => {
      console.error('❌ Erreur lors du seed de recette :', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
