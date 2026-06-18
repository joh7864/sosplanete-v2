import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LegacyApiService } from '../../legacy-api/legacy-api.service';
import { ImpactService } from '../../impact/impact.service';
import * as bcrypt from 'bcrypt';

const CATEGORY_SF_MAP: Record<string, string> = {
  // Pôle Ressources Vitales
  Eau: 'Secteur Ressources Vitales',
  "L'eau": 'Secteur Ressources Vitales',
  Alimentation: 'Secteur Ressources Vitales',
  "L'alimentation": 'Secteur Ressources Vitales',
  Courses: 'Secteur Ressources Vitales',
  Maison: 'Secteur Ressources Vitales',

  // Pôle Bio-Génétique
  Biodiversité: 'Secteur Bio-Génétique',
  'La biodiversité': 'Secteur Bio-Génétique',
  Animaux: 'Secteur Bio-Génétique',

  // Pôle Énergétique & Industriel
  Energie: 'Secteur Énergétique & Plasma',
  "L'énergie": 'Secteur Énergétique & Plasma',
  Déchets: 'Secteur Recyclage & Plasma',
  'Les déchets': 'Secteur Recyclage & Plasma',

  // Pôle Mobilité & Réseau
  Transport: 'Secteur Propulsion & Mobilité',
  Numérique: 'Secteur Archives & Réseau',
  Ecole: 'Secteur Académie Temporelle',
};

const PROPULSION_THRESHOLDS = [
  {
    level: 1,
    percentRequired: 0,
    name: 'Friction Thermique',
    description: 'Charbon / Fioul spatial',
  },
  {
    level: 2,
    percentRequired: 25,
    name: 'Voiles Photovoltaïques',
    description: 'Solaire / Vents Stellaires',
  },
  {
    level: 3,
    percentRequired: 45,
    name: 'Fusion Magnétique',
    description: 'Tokamak / Nucléaire Propre',
  },
  {
    level: 4,
    percentRequired: 65,
    name: 'Résonance Quantique',
    description: 'Énergie du Vide',
  },
  {
    level: 5,
    percentRequired: 85,
    name: 'Singularité Protonique',
    description: 'Trou Noir Artificiel',
  },
];

const isValidImageFilename = (s: string | null | undefined): boolean => {
  if (!s) return false;
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(s);
};

@Injectable()
export class EvoeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyApiService: LegacyApiService,
    private readonly impactService: ImpactService,
  ) {}

  async getMissions(instanceId: number, schoolYear: string) {
    // Fetch all LocalActions for this instance and join with EvoeMissionTranslation
    const localActions = await this.prisma.localAction.findMany({
      where: {
        instanceId,
        schoolYear,
      },
      include: {
        evoeMission: true,
        actionRef: true,
        category: true,
      },
    });

    return localActions.map((action) => {
      const imageFile = isValidImageFilename(action.image)
        ? action.image
        : isValidImageFilename(action.actionRef?.image)
          ? action.actionRef?.image
          : null;
      const physicalCat = action.category?.name || '';
      const catSF = CATEGORY_SF_MAP[physicalCat] || `Secteur ${physicalCat}`;

      let descSF =
        action.evoeMission?.descriptionSF || action.description || '';
      if (descSF.includes("effectuez l'action écologique correspondante")) {
        let introFun =
          "Une anomalie spatio-temporelle fait trembler les fondations de l'Arche ! Pour stabiliser la matrice, ta mission absolue est de :";

        if (physicalCat.toLowerCase().includes('eau')) {
          introFun =
            "Une fuite critique menace le bouclier hydrique de l'Arche. Pour colmater la brèche temporelle, ta mission est d'accomplir impérativement l'action suivante :";
        } else if (
          physicalCat.toLowerCase().includes('energie') ||
          physicalCat.toLowerCase().includes('énergie')
        ) {
          introFun =
            "L'excès de photons signale notre position aux traqueurs temporels ! Active le mode furtif en accomplissant l'action suivante :";
        } else if (
          physicalCat.toLowerCase().includes('alimentation') ||
          physicalCat.toLowerCase().includes('courses')
        ) {
          introFun =
            "Les réplicateurs de biomasse sont en surchauffe totale ! Pour éviter l'explosion du réacteur gastrique de l'Arche, tu dois :";
        } else if (
          physicalCat.toLowerCase().includes('déchet') ||
          physicalCat.toLowerCase().includes('dechet')
        ) {
          introFun =
            "Alerte : corruption du compacteur moléculaire détectée ! Rétablis l'ordre cosmique en accomplissant la directive :";
        } else if (
          physicalCat.toLowerCase().includes('biodiversité') ||
          physicalCat.toLowerCase().includes('animaux')
        ) {
          introFun =
            "Le champ de stase de notre faune originelle s'effondre ! Pour sauver notre ADN source, ta mission de sauvetage est de :";
        }

        descSF = `${introFun} **${action.label}**`;
      }

      let titreSF = action.evoeMission?.titreSF || action.label;
      if (
        titreSF === 'Intervention Systémique Mineure' ||
        titreSF === `Opération : ${action.label}`
      ) {
        titreSF = `Mission : ${action.label}`;
      }

      const co2 = action.specificCo2 ?? action.actionRef?.defaultCo2 ?? 0;
      const water = action.specificWater ?? action.actionRef?.defaultWater ?? 0;
      const waste = action.specificWaste ?? action.actionRef?.defaultWaste ?? 0;
      const calculated = Math.round(co2 + water + waste);
      const amplitude = calculated > 0 ? calculated : (action.evoeMission?.pointsGagnes || 10);

      // Fusion of physical action and SF mapping
      return {
        id: action.id,
        label: action.label,
        description: action.description,
        categoryId: action.categoryId,
        categoryName: physicalCat,
        categorySF: catSF,
        actionRefId: action.actionRefId,
        co2Year: action.actionRef?.co2Year,
        icon: imageFile ? `actions/${imageFile}` : '',
        evoeMission: {
          titreSF: titreSF,
          descriptionSF: descSF,
          amplitude: amplitude,
          isImpulsed: false,
        },
      };
    });
  }

  async getExtrapolationMetrics(authHeader: string, instanceIdStr?: string) {
    const child = await this.legacyApiService.getChildFromAuth(
      authHeader,
      instanceIdStr,
    );
    const instanceId = child.group.team.instanceYear.instanceId;
    const schoolYear = child.group.team.instanceYear.schoolYear;

    const impactData = await this.impactService.calculateImpact(
      schoolYear,
      instanceId,
    );

    // Scénario climatique : projection mondiale (si 8,1Md de personnes agissaient de même)
    const nbPlanetes = impactData.results?.nbPlanetes || 1.7;
    const dateDepassement = impactData.results?.dateDepassement || '02/08/2026';
    const dateDepassementSans =
      impactData.results?.dateDepassementSans || '02/08/2026';
    // Gardé pour référence dans le sous-titre (info sur le modèle)
    const co2WorldExtrapolatedTonnes = impactData.sums?.totalCo2 || 0;

    // Impact RÉEL de l'instance (vos Gardiens uniquement) — base des équivalences pédagogiques
    const co2RealTonnes = impactData.realSums?.totalCo2 || 0; // tonnes CO2 économisées
    const waterRealLitres = impactData.realSums?.totalWater || 0; // litres d'eau économisés
    const wasteRealKg = impactData.realSums?.totalWaste || 0; // kg de déchets économisés

    // Équivalences basées sur l'impact réel des Gardiens
    // ~3 tonnes de banquise préservées par tonne de CO2 non émise
    const iceSavedKg = co2RealTonnes * 3000; // kg
    const forestFootballFields = co2RealTonnes / 3.5; // terrains de foot (~3.5 tCO2/an absorbées/terrain/an)
    const waterOlympicPools = waterRealLitres / 2500000; // piscines olympiques (2,5 ML)
    const wasteGarbageTrucks = wasteRealKg / 10000; // camions (10 t/camion)

    return {
      nbPlanetes,
      dateDepassement,
      dateDepassementSans,
      co2WorldExtrapolatedTonnes, // pour l'info "scénario mondial"
      co2RealTonnes,
      waterRealLitres,
      wasteRealKg,
      iceSavedKg,
      forestFootballFields,
      waterOlympicPools,
      wasteGarbageTrucks,
    };
  }

  async getDashboardStatusAuth(authHeader: string, instanceIdStr?: string) {
    const child = await this.legacyApiService.getChildFromAuth(
      authHeader,
      instanceIdStr,
    );
    const instanceId = child.group.team.instanceYear.instanceId;
    const schoolYear = child.group.team.instanceYear.schoolYear;
    return this.getDashboardStatus(instanceId, schoolYear);
  }

  async getDashboardStatus(instanceId: number, schoolYear: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        instanceYear: {
          instanceId,
          schoolYear,
        },
      },
      include: {
        groups: {
          include: {
            children: true,
          },
        },
      },
    });

    const instanceYearObj = await this.prisma.instanceYear.findUnique({
      where: {
        instanceId_schoolYear: { instanceId, schoolYear },
      },
    });
    const gamePeriodsCount = instanceYearObj?.gamePeriodsCount || 40;

    const activePeriod = await this.prisma.period.findFirst({
      where: {
        instanceYear: {
          instanceId,
          schoolYear,
        },
        isOpen: true,
      },
    });

    // Charger les constantes annuelles pour le calcul de santé (mêmes références que calculateImpact)
    const year = parseInt(schoolYear.split('-')[0], 10);
    const annualData = await this.prisma.annualImpactData.findUnique({
      where: { year },
    });
    const moyCo2Monde = annualData?.moyCo2Monde ?? 4.7; // tCO2/an/personne
    const moyEauMonde = annualData?.moyEauMonde ?? 1385000; // L/an/personne
    const moyDechetsMonde = annualData?.moyDechetsMonde ?? 270; // kg/an/personne

    // Potentiel max par action du catalogue LOCAL sur une période
    const localActions = await this.prisma.localAction.findMany({
      where: { instanceId, schoolYear },
      include: { actionRef: true },
    });

    const catalogMaxCo2Period = localActions.reduce(
      (s, a) => s + (a.specificCo2 ?? a.actionRef?.defaultCo2 ?? 0),
      0,
    ); // kg CO2/période
    const catalogMaxWaterPeriod = localActions.reduce(
      (s, a) => s + (a.specificWater ?? a.actionRef?.defaultWater ?? 0),
      0,
    ); // L/période
    const catalogMaxWastePeriod = localActions.reduce(
      (s, a) => s + (a.specificWaste ?? a.actionRef?.defaultWaste ?? 0),
      0,
    ); // kg/période

    // Ratio par rapport à l'empreinte de référence annuelle (pour avoir un % cohérent)
    const refCo2Period = (moyCo2Monde * 1000) / 52; // kg CO2/période (4700 kg/an → kg/période)
    const refWaterPeriod = moyEauMonde / 52; // L/période
    const refWastePeriod = moyDechetsMonde / 52; // kg/période

    // Score max atteignable si on réalisait toutes les actions (plafonné à 100%)
    const maxHealthRatioCo2 =
      refCo2Period > 0 ? Math.min(1, catalogMaxCo2Period / refCo2Period) : 1;
    const maxHealthRatioWater =
      refWaterPeriod > 0
        ? Math.min(1, catalogMaxWaterPeriod / refWaterPeriod)
        : 1;
    const maxHealthRatioWaste =
      refWastePeriod > 0
        ? Math.min(1, catalogMaxWastePeriod / refWastePeriod)
        : 1;
    const maxHealthScore =
      Math.min(
        100,
        Math.round(
          (maxHealthRatioCo2 * 0.6 +
            maxHealthRatioWater * 0.2 +
            maxHealthRatioWaste * 0.2) *
            100,
        ),
      ) || 100; // Fallback à 100 si le catalogue est vide

    // Charger le GameConfig de l'instance pour obtenir avgActionsPerChildPerPeriod (8 par défaut)
    const gameConfig = await this.prisma.gameConfig.findFirst({
      where: { instanceId, schoolYear },
    });
    const targetActions = gameConfig?.avgActionsPerChildPerPeriod ?? 8;

    const formattedTeams = [];
    const allPlayersHealth = [];

    // Collect all children of all teams to call getPlayersHealthMap in one go
    const allChildrenList: any[] = [];
    teams.forEach((t) => {
      t.groups.forEach((g) => {
        g.children.forEach((c) => {
          allChildrenList.push({
            ...c,
            teamId: t.id,
          });
        });
      });
    });

    const activePeriodId = activePeriod ? activePeriod.id : null;
    const healthMap = await this.getPlayersHealthMap(
      instanceId,
      schoolYear,
      activePeriodId,
      allChildrenList,
    );

    for (const team of teams) {
      // 1. Calculer le score total d'impact de l'équipe (CO2 + eau + déchets)
      const teamImpact = await this.prisma.actionDone.aggregate({
        where: {
          child: { group: { teamId: team.id } },
          period: {
            instanceYear: {
              instanceId,
              schoolYear,
            },
          },
        },
        _sum: {
          savedCo2: true,
          savedWater: true,
          savedWaste: true,
        },
      });

      const co2 = teamImpact._sum?.savedCo2 || 0;
      const water = teamImpact._sum?.savedWater || 0;
      const waste = teamImpact._sum?.savedWaste || 0;
      const totalPoints = Math.round(co2 + water + waste);

      // 2. Calculer l'avancement (position sur la Timeline de 0 à 100) avec Option C - Target actions
      const teamChildrenCount =
        team.groups.reduce((acc, g) => acc + g.children.length, 0) || 1;

      // Moyenne réalisée par enfant et par période (semaine)
      const avgCo2ChildPeriod = co2 / teamChildrenCount / gamePeriodsCount;
      const avgWaterChildPeriod = water / teamChildrenCount / gamePeriodsCount;
      const avgWasteChildPeriod = waste / teamChildrenCount / gamePeriodsCount;

      // Objectif de référence par axe pour 1 action moyenne * targetActions
      const avgCatalogCo2 =
        catalogMaxCo2Period / Math.max(1, localActions.length);
      const avgCatalogWater =
        catalogMaxWaterPeriod / Math.max(1, localActions.length);
      const avgCatalogWaste =
        catalogMaxWastePeriod / Math.max(1, localActions.length);

      const refCo2Target = avgCatalogCo2 * targetActions;
      const refWaterTarget = avgCatalogWater * targetActions;
      const refWasteTarget = avgCatalogWaste * targetActions;

      // Ratios par axe plafonnés à 100% (1.0)
      const rCo2 =
        refCo2Target > 0 ? Math.min(1, avgCo2ChildPeriod / refCo2Target) : 0;
      const rWater =
        refWaterTarget > 0
          ? Math.min(1, avgWaterChildPeriod / refWaterTarget)
          : 0;
      const rWaste =
        refWasteTarget > 0
          ? Math.min(1, avgWasteChildPeriod / refWasteTarget)
          : 0;

      // Position finale pondérée (60% CO2, 20% Eau, 20% Déchets)
      const position = Number(
        ((rCo2 * 0.6 + rWater * 0.2 + rWaste * 0.2) * 100).toFixed(1),
      );

      // 3. Déterminer le niveau technologique de propulsion (relatif au pourcentage)
      let calculatedLevel = 1;
      let propTech = PROPULSION_THRESHOLDS[0];
      for (const threshold of PROPULSION_THRESHOLDS) {
        if (position >= threshold.percentRequired) {
          calculatedLevel = threshold.level;
          propTech = threshold;
        }
      }

      // 3. Sauvegarder/Récupérer de manière irréversible le niveau max dans EvoeTeamTechnology
      const existingTech = await this.prisma.evoeTeamTechnology.findUnique({
        where: { teamId: team.id },
      });

      let currentMaxLevel = existingTech?.maxLevel || 1;
      if (calculatedLevel > currentMaxLevel) {
        currentMaxLevel = calculatedLevel;
        await this.prisma.evoeTeamTechnology.upsert({
          where: { teamId: team.id },
          update: { maxLevel: calculatedLevel },
          create: { teamId: team.id, maxLevel: calculatedLevel },
        });
        // Mettre à jour l'objet propTech correspondant au maxLevel persistant
        const matchedTech = PROPULSION_THRESHOLDS.find(
          (t) => t.level === currentMaxLevel,
        );
        if (matchedTech) propTech = matchedTech;
      } else if (existingTech) {
        const matchedTech = PROPULSION_THRESHOLDS.find(
          (t) => t.level === currentMaxLevel,
        );
        if (matchedTech) propTech = matchedTech;
      }

      // 4. Calculer la vitesse (basée sur l'activité de la période active)
      let actionsThisPeriod = 0;
      if (activePeriod) {
        actionsThisPeriod = await this.prisma.actionDone.count({
          where: {
            periodId: activePeriod.id,
            child: { group: { teamId: team.id } },
          },
        });
      }
      const speed = 10 * currentMaxLevel + actionsThisPeriod * 5;

      // La position est déjà calculée plus haut pour déterminer le niveau

      // 6. Calculer le score de santé des descendants de l'équipe
      const children: any[] = [];
      team.groups.forEach((g) => children.push(...g.children));

      const teamPlayersHealth = [];
      for (const child of children) {
        const health = healthMap.get(child.id) ?? 0;
        const ph = {
          id: child.id,
          childId: child.id,
          pseudo: child.pseudo,
          avatar: child.avatar,
          gender: child.gender,
          birthDate: child.birthDate,
          color: team.color,
          teamName: team.name,
          health,
        };
        teamPlayersHealth.push(ph);
        allPlayersHealth.push(ph);
      }

      const crewBioStability =
        teamPlayersHealth.length > 0
          ? Math.round(
              teamPlayersHealth.reduce((acc, ph) => acc + ph.health, 0) /
                teamPlayersHealth.length,
            )
          : 100;

      formattedTeams.push({
        id: team.id,
        name: team.name,
        color: team.color,
        icon: team.icon,
        level: currentMaxLevel,
        propulsionType: propTech.name,
        propulsionDesc: propTech.description,
        points: totalPoints,
        speed,
        position,
        crewBioStability,
        co2,
        water,
        waste,
      });
    }

    // Progression globale moyenne
    const globalProgression =
      formattedTeams.length > 0
        ? Number(
            (
              formattedTeams.reduce((acc, t) => acc + t.position, 0) /
              formattedTeams.length
            ).toFixed(1),
          )
        : 0;

    const topPlayers = [...allPlayersHealth]
      .sort((a, b) => b.health - a.health)
      .slice(0, 10);

    return {
      teams: formattedTeams,
      playersHealth: allPlayersHealth,
      topPlayers,
      globalProgression,
    };
  }

  private async getPlayersHealthMap(
    instanceId: number,
    schoolYear: string,
    periodId: number | null,
    children: any[],
  ): Promise<Map<number, number>> {
    const healthMap = new Map<number, number>();
    if (!periodId) {
      children.forEach((c) => healthMap.set(c.id, 0));
      return healthMap;
    }

    const config = await this.prisma.gameConfig.findUnique({
      where: { instanceId_schoolYear: { instanceId, schoolYear } },
    });
    const avgActions = config?.avgActionsPerChildPerPeriod || 12;
    const gamePeriodsCount = config?.gamePeriodsCount || 24;

    const localActionsCtx = await this.prisma.localAction.findMany({
      where: { instanceId, schoolYear },
      include: { actionRef: true },
    });

    let catMaxCo2 = 0;
    let catMaxWater = 0;
    let catMaxWaste = 0;

    localActionsCtx.forEach((a) => {
      const isYearly = (a.actionRef?.co2Year ?? 0) > 0;
      const factor = isYearly ? 52 / gamePeriodsCount : 1;
      catMaxCo2 += (a.specificCo2 ?? a.actionRef?.defaultCo2 ?? 0) * factor;
      catMaxWater += (a.specificWater ?? a.actionRef?.defaultWater ?? 0) * factor;
      catMaxWaste += (a.specificWaste ?? a.actionRef?.defaultWaste ?? 0) * factor;
    });

    const actionCount = localActionsCtx.length || 1;
    const avgCo2Catalog = catMaxCo2 / actionCount;
    const avgWaterCatalog = catMaxWater / actionCount;
    const avgWasteCatalog = catMaxWaste / actionCount;

    const targetCo2 = avgCo2Catalog * avgActions > 0 ? avgCo2Catalog * avgActions : 1;
    const targetWater = avgWaterCatalog * avgActions > 0 ? avgWaterCatalog * avgActions : 1;
    const targetWaste = avgWasteCatalog * avgActions > 0 ? avgWasteCatalog * avgActions : 1;

    const childIds = children.map((c) => c.id);
    const actionsDone = await this.prisma.actionDone.findMany({
      where: {
        periodId,
        childId: { in: childIds },
      },
      include: {
        localAction: {
          include: { actionRef: true },
        },
      },
    });

    const childActionsMap = new Map<number, typeof actionsDone>();
    actionsDone.forEach((ad) => {
      const list = childActionsMap.get(ad.childId) || [];
      list.push(ad);
      childActionsMap.set(ad.childId, list);
    });

    const period = await this.prisma.period.findUnique({
      where: { id: periodId },
    });
    let decay = 0;
    if (period) {
      const totalDuration = period.endDate.getTime() - period.startDate.getTime();
      const elapsed = Math.max(0, Date.now() - period.startDate.getTime());
      const elapsedRatio = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 0;
      decay = Math.round(elapsedRatio * 85); // Perte max de 85 HP (finit à 15 HP si aucune action)
    }

    const activeChallenges = await this.prisma.evoeChallenge.findMany({
      where: {
        periodId,
        status: 'SUCCESS',
      },
    });

    for (const child of children) {
      const childActions = childActionsMap.get(child.id) || [];
      
      let childCo2 = 0;
      let childWater = 0;
      let childWaste = 0;

      childActions.forEach((ad) => {
        const isYearly = (ad.localAction.actionRef?.co2Year ?? 0) > 0;
        const factor = isYearly ? 52 / gamePeriodsCount : 1;
        childCo2 += ad.savedCo2 * factor;
        childWater += ad.savedWater * factor;
        childWaste += ad.savedWaste * factor;
      });

      const hpCo2 = Math.min(60, (childCo2 / targetCo2) * 60);
      const hpWater = Math.min(20, (childWater / targetWater) * 20);
      const hpWaste = Math.min(20, (childWaste / targetWaste) * 20);
      const baseRegen = hpCo2 + hpWater + hpWaste;

      // HP Decay model: start at 100, lose decay, heal baseRegen
      const baseHp = Math.max(0, Math.min(100, 100 - decay + baseRegen));

      let challengeBonus = 0;
      activeChallenges.forEach((ch) => {
        if (ch.targetTeamId === child.teamId) {
          const didIt = childActions.some((ad) => ad.localActionId === ch.localActionId);
          if (didIt) {
            challengeBonus += 15;
          } else {
            challengeBonus += 5;
          }
        }
      });

      const totalHp = Math.min(120, Math.round(baseHp + challengeBonus));
      healthMap.set(child.id, totalHp);
    }

    return healthMap;
  }

  async getContext(authHeader: string, instanceIdStr?: string) {
    // 1. Authentifier l'enfant
    const child = await this.legacyApiService.getChildFromAuth(
      authHeader,
      instanceIdStr,
    );
    const instanceYearId = child.group.team.instanceYearId;
    const instanceId = child.group.team.instanceYear.instanceId;
    const schoolYear = child.group.team.instanceYear.schoolYear;

    // 2. Récupérer le nombre total de joueurs pour la scène 3D
    const teams = await this.prisma.team.findMany({
      where: { instanceYearId },
      include: { groups: { include: { children: true } } },
    });

    const activePeriod = await this.prisma.period.findFirst({
      where: { instanceYearId, isOpen: true },
    });

    const childrenList: any[] = [];
    teams.forEach((t) => {
      t.groups.forEach((g) => {
        g.children.forEach((c) => {
          childrenList.push({
            ...c,
            teamId: t.id,
          });
        });
      });
    });

    const activePeriodId = activePeriod ? activePeriod.id : null;
    const healthMap = await this.getPlayersHealthMap(
      instanceId,
      schoolYear,
      activePeriodId,
      childrenList,
    );

    let teamCount = 0;
    const players: any[] = [];

    teams.forEach((t) => {
      t.groups.forEach((g) => {
        teamCount += g.children.length;
        g.children.forEach((c) => {
          const health = healthMap.get(c.id) ?? 0;

          players.push({
            id: c.id,
            childId: c.id,
            pseudo: c.pseudo,
            avatar: c.avatar,
            color: t.color || '#40916C',
            isCurrent: c.id === child.id,
            groupId: g.id,
            teamId: t.id,
            teamName: t.name,
            gender: c.gender,
            birthDate: c.birthDate,
            health,
          });
        });
      });
    });

    // 3. Récupérer les missions formatées SF
    const missions = await this.getMissions(instanceId, schoolYear);

    const activeActionsDone = activePeriod
      ? await this.prisma.actionDone.findMany({
          where: {
            childId: child.id,
            periodId: activePeriod.id,
          },
          select: {
            localActionId: true,
            id: true,
          },
        })
      : [];
    const activeActionDoneMap = new Map(
      activeActionsDone.map((ad) => [ad.localActionId, ad.id]),
    );

    const mappedMissions = missions.map((mission) => {
      const actionDoneId = activeActionDoneMap.get(mission.id);
      return {
        ...mission,
        evoeMission: {
          ...mission.evoeMission,
          isImpulsed: !!actionDoneId,
          actionDoneId: actionDoneId || null,
        },
      };
    });

    const topPlayers = [...players]
      .sort((a, b) => b.health - a.health)
      .slice(0, 10);

    // 4. Retourner le contexte formaté pour le composant App.tsx / Portal2026
    return {
      childInfos: {
        id: child.id,
        pseudo: child.pseudo,
        teamCount,
      },
      players,
      topPlayers,
      missions: mappedMissions,
    };
  }

  async resetPropulsionLevels(instanceId: number, schoolYear: string) {
    await this.prisma.evoeTeamTechnology.deleteMany({
      where: {
        team: {
          instanceYear: {
            instanceId,
            schoolYear,
          },
        },
      },
    });
    return { success: true };
  }

  async resetPropulsionLevelsAuth(authHeader: string, instanceIdStr?: string) {
    const child = await this.legacyApiService.getChildFromAuth(
      authHeader,
      instanceIdStr,
    );
    const instanceId = child.group.team.instanceYear.instanceId;
    const schoolYear = child.group.team.instanceYear.schoolYear;
    return this.resetPropulsionLevels(instanceId, schoolYear);
  }

  async calculateTeamStabilityForPeriod(teamId: number, periodId: number, instanceYearId: number): Promise<number> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { groups: { include: { children: true } } },
    });
    if (!team) return 100;
    const children: any[] = [];
    team.groups.forEach(g => children.push(...g.children));
    if (children.length === 0) return 100;

    const instanceYearObj = await this.prisma.instanceYear.findUnique({
      where: { id: instanceYearId },
    });
    const schoolYear = instanceYearObj?.schoolYear || '2024-2025';
    const instanceId = instanceYearObj?.instanceId || 1;

    const childrenWithTeam = children.map((c) => ({
      ...c,
      teamId,
    }));

    const healthMap = await this.getPlayersHealthMap(
      instanceId,
      schoolYear,
      periodId,
      childrenWithTeam,
    );

    let totalHealth = 0;
    children.forEach((c) => {
      totalHealth += healthMap.get(c.id) ?? 0;
    });

    return Math.round(totalHealth / children.length);
  }

  async getChallenges(authHeader: string, instanceIdStr?: string) {
    const child = await this.legacyApiService.getChildFromAuth(authHeader, instanceIdStr);
    const teamId = child.group.teamId;
    const period = await this.legacyApiService.getOpenPeriod(child.group.team.instanceYearId);

    const challenges = await this.prisma.evoeChallenge.findMany({
      where: {
        periodId: period.id,
        OR: [
          { challengerTeamId: teamId },
          { targetTeamId: teamId },
        ],
      },
      include: {
        challengerTeam: true,
        targetTeam: true,
        localAction: {
          include: { actionRef: true },
        },
      },
    });

    const mapped = [];
    for (const ch of challenges) {
      let currentStatus = ch.status;
      let isRetroactive = false;

      const actionDone = await this.prisma.actionDone.findFirst({
        where: {
          periodId: period.id,
          localActionId: ch.localActionId,
          child: { group: { teamId: ch.targetTeamId } },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (ch.status === 'ACCEPTED') {
        if (actionDone) {
          currentStatus = 'SUCCESS';
          await this.prisma.evoeChallenge.update({
            where: { id: ch.id },
            data: { status: 'SUCCESS' },
          });
        }
      }

      if (currentStatus === 'SUCCESS' && actionDone) {
        if (actionDone.createdAt < ch.createdAt) {
          isRetroactive = true;
        }
      }

      mapped.push({
        id: ch.id,
        challengerTeamId: ch.challengerTeamId,
        challengerTeamName: ch.challengerTeam.name,
        challengerTeamColor: ch.challengerTeam.color,
        targetTeamId: ch.targetTeamId,
        targetTeamName: ch.targetTeam.name,
        targetTeamColor: ch.targetTeam.color,
        localActionId: ch.localActionId,
        actionLabel: ch.localAction.label,
        pledge: ch.pledge,
        status: currentStatus,
        isRetroactive,
        createdAt: ch.createdAt,
      });
    }
    return mapped;
  }

  async createChallenge(
    authHeader: string,
    instanceIdStr: string,
    data: { targetTeamId: number; localActionId: number; pledge: string },
  ) {
    const child = await this.legacyApiService.getChildFromAuth(authHeader, instanceIdStr);
    const challengerTeamId = child.group.teamId;
    if (challengerTeamId === data.targetTeamId) {
      throw new BadRequestException("Vous ne pouvez pas défier votre propre équipe.");
    }
    const instanceYearId = child.group.team.instanceYearId;
    const period = await this.legacyApiService.getOpenPeriod(instanceYearId);

    // Vérifier la stabilité de la période précédente pour déterminer le quota
    const previousPeriod = await this.prisma.period.findFirst({
      where: {
        instanceYearId,
        endDate: { lt: period.startDate },
      },
      orderBy: { endDate: 'desc' },
    });

    const stability = previousPeriod
      ? await this.calculateTeamStabilityForPeriod(challengerTeamId, previousPeriod.id, instanceYearId)
      : 100; // 100% de stabilité pour la première période si pas d'historique

    let maxChallenges = 0;
    if (stability >= 80) maxChallenges = 5;
    else if (stability >= 60) maxChallenges = 4;
    else if (stability >= 40) maxChallenges = 3;
    else if (stability >= 20) maxChallenges = 2;
    else if (stability >= 10) maxChallenges = 1;
    else maxChallenges = 0;

    const sentCount = await this.prisma.evoeChallenge.count({
      where: {
        challengerTeamId,
        periodId: period.id,
      },
    });

    if (sentCount >= maxChallenges) {
      throw new BadRequestException(
        `Votre équipe a atteint son quota maximum de défis (${maxChallenges}) pour cette période (Stabilité équipage précédente : ${stability}%).`,
      );
    }

    return this.prisma.evoeChallenge.create({
      data: {
        challengerTeamId,
        targetTeamId: data.targetTeamId,
        localActionId: data.localActionId,
        periodId: period.id,
        pledge: data.pledge,
        status: 'PENDING',
      },
    });
  }

  async respondChallenge(
    authHeader: string,
    instanceIdStr: string,
    challengeId: number,
    accept: boolean,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(authHeader, instanceIdStr);
    const teamId = child.group.teamId;

    const challenge = await this.prisma.evoeChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) {
      throw new NotFoundException('Défi non trouvé.');
    }
    if (challenge.targetTeamId !== teamId) {
      throw new BadRequestException("Vous ne pouvez répondre qu'aux défis adressés à votre équipe.");
    }
    if (challenge.status !== 'PENDING') {
      throw new BadRequestException('Ce défi a déjà été traité.');
    }

    let newStatus: 'ACCEPTED' | 'DECLINED' | 'SUCCESS' = accept ? 'ACCEPTED' : 'DECLINED';

    if (accept) {
      const countDone = await this.prisma.actionDone.count({
        where: {
          periodId: challenge.periodId,
          localActionId: challenge.localActionId,
          child: { group: { teamId } },
        },
      });
      if (countDone > 0) {
        newStatus = 'SUCCESS';
      }
    }

    return this.prisma.evoeChallenge.update({
      where: { id: challengeId },
      data: { status: newStatus },
    });
  }

  async getPlayerProfile(childId: number) {
    const getMissionLabel = (localAction: any) => {
      if (!localAction) return 'Mission inconnue';
      let titreSF = localAction.evoeMission?.titreSF || localAction.label;
      if (
        titreSF === 'Intervention Systémique Mineure' ||
        titreSF === `Opération : ${localAction.label}`
      ) {
        titreSF = `Mission : ${localAction.label}`;
      }
      return titreSF;
    };

    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        group: {
          include: {
            team: {
              include: {
                instanceYear: true,
              },
            },
          },
        },
      },
    });

    if (!child) {
      throw new NotFoundException("Joueur non trouvé");
    }

    const team = child.group.team;
    const instanceYearId = team.instanceYearId;
    const instanceId = team.instanceYear.instanceId;
    const schoolYear = team.instanceYear.schoolYear;

    // 1. Trouver la période active
    const activePeriod = await this.prisma.period.findFirst({
      where: { instanceYearId, isOpen: true },
    });
    const activePeriodId = activePeriod ? activePeriod.id : null;

    // 2. Calculer le score de santé actuel (HP)
    const teamChildren = await this.prisma.child.findMany({
      where: { group: { teamId: team.id } },
    });
    const healthMap = await this.getPlayersHealthMap(
      instanceId,
      schoolYear,
      activePeriodId,
      teamChildren.map(c => ({ ...c, teamId: team.id })),
    );
    const health = healthMap.get(child.id) ?? 100;

    // 3. Calculer l'empreinte totale depuis le début du jeu (CO2, eau, déchets personnels)
    const personalImpact = await this.prisma.actionDone.aggregate({
      where: {
        childId,
      },
      _sum: {
        savedCo2: true,
        savedWater: true,
        savedWaste: true,
      },
    });

    const personalMetrics = {
      co2: personalImpact._sum?.savedCo2 || 0,
      water: personalImpact._sum?.savedWater || 0,
      waste: personalImpact._sum?.savedWaste || 0,
    };

    // 4. Éco-missions réalisées sur la période active
    let actionsDonePeriod: any[] = [];
    if (activePeriodId) {
      actionsDonePeriod = await this.prisma.actionDone.findMany({
        where: {
          childId,
          periodId: activePeriodId,
        },
        include: {
          localAction: {
            include: { actionRef: true, evoeMission: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const periodMissions = actionsDonePeriod.map((ad) => ({
      id: ad.id,
      date: ad.createdAt,
      label: getMissionLabel(ad.localAction),
      amplitude: Math.round(ad.savedCo2 + ad.savedWater + ad.savedWaste) || 10,
    }));

    // 5. Top 5 des éco-missions réalisées depuis le début du jeu
    const topMissionsGrouped = await this.prisma.actionDone.groupBy({
      by: ['localActionId'],
      where: { childId },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    const top5Missions = [];
    for (const item of topMissionsGrouped) {
      const localAction = await this.prisma.localAction.findUnique({
        where: { id: item.localActionId },
        include: { actionRef: true, evoeMission: true },
      });
      if (localAction) {
        top5Missions.push({
          localActionId: item.localActionId,
          count: item._count.id,
          label: getMissionLabel(localAction),
          description: localAction.evoeMission?.descriptionSF || localAction.description || '',
        });
      }
    }

    // 6. Liste des défis PvP de la période (reçus et envoyés par son équipe)
    const challenges = activePeriodId
      ? await this.prisma.evoeChallenge.findMany({
          where: {
            periodId: activePeriodId,
            OR: [
              { challengerTeamId: team.id },
              { targetTeamId: team.id },
            ],
          },
          include: {
            challengerTeam: true,
            targetTeam: true,
            localAction: {
              include: { actionRef: true, evoeMission: true },
            },
          },
          orderBy: { id: 'desc' },
        })
      : [];

    const mappedChallenges = [];
    for (const ch of challenges) {
      let currentStatus = ch.status;
      let isRetroactive = false;

      const actionDone = await this.prisma.actionDone.findFirst({
        where: {
          periodId: activePeriodId as number,
          localActionId: ch.localActionId,
          child: { group: { teamId: ch.targetTeamId } },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (ch.status === 'ACCEPTED') {
        if (actionDone) {
          currentStatus = 'SUCCESS';
        }
      }

      if (currentStatus === 'SUCCESS' && actionDone) {
        if (actionDone.createdAt < ch.createdAt) {
          isRetroactive = true;
        }
      }

      mappedChallenges.push({
        id: ch.id,
        isChallenger: ch.challengerTeamId === team.id,
        opponentName: ch.challengerTeamId === team.id ? ch.targetTeam.name : ch.challengerTeam.name,
        opponentColor: ch.challengerTeamId === team.id ? ch.targetTeam.color : ch.challengerTeam.color,
        actionLabel: getMissionLabel(ch.localAction),
        pledge: ch.pledge,
        status: currentStatus,
        localActionId: ch.localActionId,
        isRetroactive,
      });
    }

    return {
      profile: {
        id: child.id,
        pseudo: child.pseudo,
        avatar: child.avatar,
        gender: child.gender,
        birthDate: child.birthDate,
        teamName: team.name,
        teamColor: team.color,
      },
      health,
      personalMetrics,
      periodMissions,
      top5Missions,
      challenges: mappedChallenges,
    };
  }

  async verifyAuth(authHeader: string, instanceIdStr?: string) {
    return this.legacyApiService.getChildFromAuth(authHeader, instanceIdStr);
  }

  async updateProfile(
    authHeader: string,
    instanceIdStr: string,
    data: { pseudo?: string; password?: string; gender?: string | null; birthDate?: string | null; avatar?: string | null }
  ) {
    const child = await this.verifyAuth(authHeader, instanceIdStr);

    const updateData: any = {};
    if (data.pseudo !== undefined) updateData.pseudo = data.pseudo;
    if (data.password && data.password.trim() !== '') {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    if (data.gender !== undefined) {
      let genderCode = null;
      if (data.gender) {
        const str = data.gender.trim().toLowerCase();
        if (str === 'm' || str.startsWith('hom') || str.startsWith('gar') || str.startsWith('mal') || str === 'h') {
          genderCode = 'M';
        } else if (str === 'f' || str.startsWith('fem') || str.startsWith('fil') || str === 'w') {
          genderCode = 'F';
        }
      }
      updateData.gender = genderCode;
    }
    if (data.birthDate !== undefined) {
      let parsedDate = null;
      if (data.birthDate) {
        const dateObj = new Date(data.birthDate);
        if (!isNaN(dateObj.getTime())) {
          parsedDate = dateObj;
        }
      }
      updateData.birthDate = parsedDate;
    }
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    return this.prisma.child.update({ where: { id: child.id }, data: updateData });
  }
}
