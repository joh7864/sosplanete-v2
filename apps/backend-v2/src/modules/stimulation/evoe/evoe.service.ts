import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LegacyApiService } from '../../legacy-api/legacy-api.service';
import { ImpactService } from '../../impact/impact.service';

const CATEGORY_SF_MAP: Record<string, string> = {
  // Pôle Ressources Vitales
  "Eau": "Secteur Ressources Vitales",
  "L'eau": "Secteur Ressources Vitales",
  "Alimentation": "Secteur Ressources Vitales",
  "L'alimentation": "Secteur Ressources Vitales",
  "Courses": "Secteur Ressources Vitales",
  "Maison": "Secteur Ressources Vitales",
  
  // Pôle Bio-Génétique
  "Biodiversité": "Secteur Bio-Génétique",
  "La biodiversité": "Secteur Bio-Génétique",
  "Animaux": "Secteur Bio-Génétique",

  // Pôle Énergétique & Industriel
  "Energie": "Secteur Énergétique & Plasma",
  "L'énergie": "Secteur Énergétique & Plasma",
  "Déchets": "Secteur Recyclage & Plasma",
  "Les déchets": "Secteur Recyclage & Plasma",
  
  // Pôle Mobilité & Réseau
  "Transport": "Secteur Propulsion & Mobilité",
  "Numérique": "Secteur Archives & Réseau",
  "Ecole": "Secteur Académie Temporelle"
};

const PROPULSION_THRESHOLDS = [
  { level: 1, percentRequired: 0, name: "Friction Thermique", description: "Charbon / Fioul spatial" },
  { level: 2, percentRequired: 20, name: "Voiles Photovoltaïques", description: "Solaire / Vents Stellaires" },
  { level: 3, percentRequired: 40, name: "Fusion Magnétique", description: "Tokamak / Nucléaire Propre" },
  { level: 4, percentRequired: 60, name: "Résonance Quantique", description: "Énergie du Vide" },
  { level: 5, percentRequired: 80, name: "Singularité Protonique", description: "Trou Noir Artificiel" }
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
        schoolYear
      },
      include: {
        evoeMission: true,
        actionRef: true,
        category: true
      }
    });

    return localActions.map(action => {
      const imageFile = isValidImageFilename(action.image) ? action.image : (isValidImageFilename(action.actionRef?.image) ? action.actionRef?.image : null);
      const physicalCat = action.category?.name || "";
      const catSF = CATEGORY_SF_MAP[physicalCat] || `Secteur ${physicalCat}`;

      let descSF = action.evoeMission?.descriptionSF || action.description || "";
      if (descSF.includes("effectuez l'action écologique correspondante")) {
        let introFun = "Une anomalie spatio-temporelle fait trembler les fondations de l'Arche ! Pour stabiliser la matrice, ta mission absolue est de :";
        
        if (physicalCat.toLowerCase().includes("eau")) {
          introFun = "Une fuite critique menace le bouclier hydrique de l'Arche. Pour colmater la brèche temporelle, ta mission est d'accomplir impérativement l'action suivante :";
        } else if (physicalCat.toLowerCase().includes("energie") || physicalCat.toLowerCase().includes("énergie")) {
          introFun = "L'excès de photons signale notre position aux traqueurs temporels ! Active le mode furtif en accomplissant l'action suivante :";
        } else if (physicalCat.toLowerCase().includes("alimentation") || physicalCat.toLowerCase().includes("courses")) {
          introFun = "Les réplicateurs de biomasse sont en surchauffe totale ! Pour éviter l'explosion du réacteur gastrique de l'Arche, tu dois :";
        } else if (physicalCat.toLowerCase().includes("déchet") || physicalCat.toLowerCase().includes("dechet")) {
          introFun = "Alerte : corruption du compacteur moléculaire détectée ! Rétablis l'ordre cosmique en accomplissant la directive :";
        } else if (physicalCat.toLowerCase().includes("biodiversité") || physicalCat.toLowerCase().includes("animaux")) {
          introFun = "Le champ de stase de notre faune originelle s'effondre ! Pour sauver notre ADN source, ta mission de sauvetage est de :";
        }

        descSF = `${introFun} **${action.label}**`;
      }

      let titreSF = action.evoeMission?.titreSF || action.label;
      if (titreSF === "Intervention Systémique Mineure" || titreSF === `Opération : ${action.label}`) {
        titreSF = `Mission : ${action.label}`;
      }

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
        evoeMission: action.evoeMission ? {
          titreSF: titreSF,
          descriptionSF: descSF,
          pointsGagnes: action.evoeMission.pointsGagnes,
          isHacked: action.evoeMission.isHacked,
        } : null,
      };
    });
  }

  async getExtrapolationMetrics(authHeader: string, instanceIdStr?: string) {
    const child = await this.legacyApiService.getChildFromAuth(authHeader, instanceIdStr);
    const instanceId = child.group.team.instanceYear.instanceId;
    const schoolYear = child.group.team.instanceYear.schoolYear;

    const impactData = await this.impactService.calculateImpact(schoolYear, instanceId);

    // Scénario climatique : projection mondiale (si 8,1Md de personnes agissaient de même)
    const nbPlanetes = impactData.results?.nbPlanetes || 1.7;
    const dateDepassement = impactData.results?.dateDepassement || '02/08/2026';
    const dateDepassementSans = impactData.results?.dateDepassementSans || '02/08/2026';
    // Gardé pour référence dans le sous-titre (info sur le modèle)
    const co2WorldExtrapolatedTonnes = impactData.sums?.totalCo2 || 0;

    // Impact RÉEL de l'instance (vos Gardiens uniquement) — base des équivalences pédagogiques
    const co2RealTonnes   = impactData.realSums?.totalCo2   || 0; // tonnes CO2 économisées
    const waterRealLitres = impactData.realSums?.totalWater || 0; // litres d'eau économisés
    const wasteRealKg     = impactData.realSums?.totalWaste || 0; // kg de déchets économisés

    // Équivalences basées sur l'impact réel des Gardiens
    // ~3 tonnes de banquise préservées par tonne de CO2 non émise
    const iceSavedKg          = co2RealTonnes * 3000;      // kg
    const forestFootballFields = co2RealTonnes / 3.5;      // terrains de foot (~3.5 tCO2/an absorbées/terrain/an)
    const waterOlympicPools    = waterRealLitres / 2500000; // piscines olympiques (2,5 ML)
    const wasteGarbageTrucks   = wasteRealKg / 10000;       // camions (10 t/camion)

    return {
      nbPlanetes,
      dateDepassement,
      dateDepassementSans,
      co2WorldExtrapolatedTonnes,  // pour l'info "scénario mondial"
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
    const child = await this.legacyApiService.getChildFromAuth(authHeader, instanceIdStr);
    const instanceId = child.group.team.instanceYear.instanceId;
    const schoolYear = child.group.team.instanceYear.schoolYear;
    return this.getDashboardStatus(instanceId, schoolYear);
  }

  async getDashboardStatus(instanceId: number, schoolYear: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        instanceYear: {
          instanceId,
          schoolYear
        }
      },
      include: {
        groups: {
          include: {
            children: true
          }
        }
      }
    });

    const instanceYearObj = await this.prisma.instanceYear.findUnique({
      where: {
        instanceId_schoolYear: { instanceId, schoolYear }
      }
    });
    const gamePeriodsCount = instanceYearObj?.gamePeriodsCount || 40;

    const activePeriod = await this.prisma.period.findFirst({
      where: {
        instanceYear: {
          instanceId,
          schoolYear
        },
        isOpen: true
      }
    });

    // Charger les constantes annuelles pour le calcul de santé (mêmes références que calculateImpact)
    const year = parseInt(schoolYear.split('-')[0], 10);
    const annualData = await this.prisma.annualImpactData.findUnique({ where: { year } });
    const moyCo2Monde = annualData?.moyCo2Monde ?? 4.7;     // tCO2/an/personne
    const moyEauMonde = annualData?.moyEauMonde ?? 1385000;  // L/an/personne
    const moyDechetsMonde = annualData?.moyDechetsMonde ?? 270; // kg/an/personne

    // Potentiel max par action du catalogue LOCAL sur une période
    const localActions = await this.prisma.localAction.findMany({
      where: { instanceId, schoolYear },
      include: { actionRef: true }
    });

    const catalogMaxCo2Period   = localActions.reduce((s, a) => s + ((a.specificCo2 ?? a.actionRef?.co2Year) ?? 0), 0) / 52; // g CO2/période
    const catalogMaxWaterPeriod = localActions.reduce((s, a) => s + ((a.specificWater ?? a.actionRef?.defaultWater) ?? 0), 0);       // L/période
    const catalogMaxWastePeriod = localActions.reduce((s, a) => s + ((a.specificWaste ?? a.actionRef?.defaultWaste) ?? 0), 0);       // kg/période

    // Ratio par rapport à l'empreinte de référence annuelle (pour avoir un % cohérent)
    const refCo2Period  = (moyCo2Monde * 1000) / 52;  // g CO2/période (4700g/an → g/période)
    const refWaterPeriod = moyEauMonde / 52;            // L/période
    const refWastePeriod = moyDechetsMonde / 52;        // kg/période

    // Score max atteignable si on réalisait toutes les actions (plafonné à 100%)
    const maxHealthRatioCo2  = refCo2Period  > 0 ? Math.min(1, catalogMaxCo2Period  / refCo2Period)  : 1;
    const maxHealthRatioWater = refWaterPeriod > 0 ? Math.min(1, catalogMaxWaterPeriod / refWaterPeriod) : 1;
    const maxHealthRatioWaste = refWastePeriod > 0 ? Math.min(1, catalogMaxWastePeriod / refWastePeriod) : 1;
    const maxHealthScore = Math.min(100, Math.round(
      (maxHealthRatioCo2 * 0.60 + maxHealthRatioWater * 0.20 + maxHealthRatioWaste * 0.20) * 100
    )) || 100; // Fallback à 100 si le catalogue est vide


    const formattedTeams = [];
    const allPlayersHealth = [];

    for (const team of teams) {
      // 1. Calculer le score total d'impact de l'équipe (CO2 + eau + déchets)
      const teamImpact = await this.prisma.actionDone.aggregate({
        where: {
          child: { group: { teamId: team.id } },
          period: {
            instanceYear: {
              instanceId,
              schoolYear
            }
          }
        },
        _sum: {
          savedCo2: true,
          savedWater: true,
          savedWaste: true
        }
      });

      const co2 = teamImpact._sum?.savedCo2 || 0;
      const water = teamImpact._sum?.savedWater || 0;
      const waste = teamImpact._sum?.savedWaste || 0;
      const totalPoints = Math.round(co2 + water + waste);

      // 2. Calculer l'avancement (position sur la Timeline de 0 à 100)
      const teamChildrenCount = team.groups.reduce((acc, g) => acc + g.children.length, 0) || 1;
      const pointsPerChildPerPeriod = catalogMaxCo2Period + catalogMaxWaterPeriod + catalogMaxWastePeriod;
      
      // Choix A : Fixer un objectif "réaliste" de 5 actions par semaine par enfant
      const avgActionPoints = pointsPerChildPerPeriod / Math.max(1, localActions.length);
      const targetPointsPerChildPerPeriod = avgActionPoints * 5;
      const teamTargetPoints = (targetPointsPerChildPerPeriod * gamePeriodsCount * teamChildrenCount) || 5000;
      
      const position = Math.min(100, Number(((totalPoints / teamTargetPoints) * 100).toFixed(1)));

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
        where: { teamId: team.id }
      });

      let currentMaxLevel = existingTech?.maxLevel || 1;
      if (calculatedLevel > currentMaxLevel) {
        currentMaxLevel = calculatedLevel;
        await this.prisma.evoeTeamTechnology.upsert({
          where: { teamId: team.id },
          update: { maxLevel: calculatedLevel },
          create: { teamId: team.id, maxLevel: calculatedLevel }
        });
        // Mettre à jour l'objet propTech correspondant au maxLevel persistant
        const matchedTech = PROPULSION_THRESHOLDS.find(t => t.level === currentMaxLevel);
        if (matchedTech) propTech = matchedTech;
      } else if (existingTech) {
        const matchedTech = PROPULSION_THRESHOLDS.find(t => t.level === currentMaxLevel);
        if (matchedTech) propTech = matchedTech;
      }

      // 4. Calculer la vitesse (basée sur l'activité de la période active)
      let actionsThisPeriod = 0;
      if (activePeriod) {
        actionsThisPeriod = await this.prisma.actionDone.count({
          where: {
            periodId: activePeriod.id,
            child: { group: { teamId: team.id } }
          }
        });
      }
      const speed = 10 * currentMaxLevel + actionsThisPeriod * 5;

      // La position est déjà calculée plus haut pour déterminer le niveau

      // 6. Calculer le score de santé des descendants de l'équipe
      const children: any[] = [];
      team.groups.forEach(g => children.push(...g.children));

      const teamPlayersHealth = [];
      for (const child of children) {
        let health = 0;
        if (activePeriod) {
          // Agréger CO2, eau, déchets réels du joueur sur la période active
          const childImpact = await this.prisma.actionDone.aggregate({
            where: { childId: child.id, periodId: activePeriod.id },
            _sum: { savedCo2: true, savedWater: true, savedWaste: true }
          });
          const childCo2  = childImpact._sum?.savedCo2  ?? 0; // g
          const childWater = childImpact._sum?.savedWater ?? 0; // L
          const childWaste = childImpact._sum?.savedWaste ?? 0; // kg

          // Ratio individuel vs référence de période (même pondération que calculateImpact)
          const rCo2  = refCo2Period  > 0 ? childCo2  / refCo2Period  : 0;
          const rWater = refWaterPeriod > 0 ? childWater / refWaterPeriod : 0;
          const rWaste = refWastePeriod > 0 ? childWaste / refWastePeriod : 0;
          const rawRatio = rCo2 * 0.60 + rWater * 0.20 + rWaste * 0.20;

          // Normaliser : 100% = avoir atteint le même ratio que le max catalogue possible
          const normalized = maxHealthScore > 0 ? rawRatio / (maxHealthScore / 100) : rawRatio;
          health = Math.min(100, Math.round(normalized * 100));
        }
        const ph = {
          childId: child.id,
          pseudo: child.pseudo,
          health
        };
        teamPlayersHealth.push(ph);
        allPlayersHealth.push(ph);
      }

      const crewBioStability = teamPlayersHealth.length > 0
        ? Math.round(teamPlayersHealth.reduce((acc, ph) => acc + ph.health, 0) / teamPlayersHealth.length)
        : 100;

      formattedTeams.push({
        id: team.id,
        name: team.name,
        color: team.color,
        level: currentMaxLevel,
        propulsionType: propTech.name,
        propulsionDesc: propTech.description,
        points: totalPoints,
        speed,
        position,
        crewBioStability
      });
    }

    // Progression globale moyenne
    const globalProgression = formattedTeams.length > 0
      ? Number((formattedTeams.reduce((acc, t) => acc + t.position, 0) / formattedTeams.length).toFixed(1))
      : 0;

    return {
      teams: formattedTeams,
      playersHealth: allPlayersHealth,
      globalProgression
    };
  }

  async getContext(authHeader: string, instanceIdStr?: string) {
    // 1. Authentifier l'enfant
    const child = await this.legacyApiService.getChildFromAuth(authHeader, instanceIdStr);
    const instanceYearId = child.group.team.instanceYearId;
    const instanceId = child.group.team.instanceYear.instanceId;
    const schoolYear = child.group.team.instanceYear.schoolYear;

    // 2. Récupérer le nombre total de joueurs pour la scène 3D
    const teams = await this.prisma.team.findMany({
      where: { instanceYearId },
      include: { groups: { include: { children: true } } }
    });

    const activePeriod = await this.prisma.period.findFirst({
      where: { instanceYearId, isOpen: true }
    });

    // Charger les constantes annuelles pour le calcul de santé
    const yearCtx = parseInt(schoolYear.split('-')[0], 10);
    const annualDataCtx = await this.prisma.annualImpactData.findUnique({ where: { year: yearCtx } });
    const moyCo2Ctx = annualDataCtx?.moyCo2Monde ?? 4.7;       // t CO2/an/personne
    const moyEauCtx = annualDataCtx?.moyEauMonde ?? 1385000;    // L/an/personne
    const moyDechetsCtx = annualDataCtx?.moyDechetsMonde ?? 270; // kg/an/personne

    // Potentiel max du catalogue sur une période
    const catalogActionsCtx = await this.prisma.actionRef.findMany({
      select: { co2Year: true, defaultWater: true, defaultWaste: true }
    });
    const catMaxCo2   = catalogActionsCtx.reduce((s, a) => s + (a.co2Year     ?? 0), 0) / 52;
    const catMaxWater = catalogActionsCtx.reduce((s, a) => s + (a.defaultWater ?? 0), 0);
    const catMaxWaste = catalogActionsCtx.reduce((s, a) => s + (a.defaultWaste ?? 0), 0);

    const refCo2Ctx  = (moyCo2Ctx  * 1000) / 52; // g CO2 de référence par période
    const refWaterCtx = moyEauCtx   / 52;
    const refWasteCtx = moyDechetsCtx / 52;

    const maxRatioCo2  = refCo2Ctx  > 0 ? Math.min(1, catMaxCo2  / refCo2Ctx)  : 1;
    const maxRatioWater = refWaterCtx > 0 ? Math.min(1, catMaxWater / refWaterCtx) : 1;
    const maxRatioWaste = refWasteCtx > 0 ? Math.min(1, catMaxWaste / refWasteCtx) : 1;
    const maxScoreCtx = Math.min(100, Math.round(
      (maxRatioCo2 * 0.60 + maxRatioWater * 0.20 + maxRatioWaste * 0.20) * 100
    )) || 100; // Fallback à 100 si le catalogue est vide


    // Agréger les impacts individuels sur la période active en une seule requête
    const impactsByChild = await this.prisma.actionDone.groupBy({
      by: ['childId'],
      where: {
        periodId: activePeriod ? activePeriod.id : -1,
        child: { group: { team: { instanceYearId } } }
      },
      _sum: { savedCo2: true, savedWater: true, savedWaste: true }
    });
    const childImpactMap = new Map(
      impactsByChild.map(a => [a.childId, {
        co2:   a._sum.savedCo2  ?? 0,
        water: a._sum.savedWater ?? 0,
        waste: a._sum.savedWaste ?? 0,
      }])
    );

    let teamCount = 0;
    const players: any[] = [];

    teams.forEach(t => {
      t.groups.forEach(g => {
        teamCount += g.children.length;
        g.children.forEach(c => {
          const imp = childImpactMap.get(c.id) ?? { co2: 0, water: 0, waste: 0 };

          // Ratio individuel vs référence de période (CO2: 60%, eau: 20%, déchets: 20%)
          const rCo2  = refCo2Ctx  > 0 ? imp.co2  / refCo2Ctx  : 0;
          const rWater = refWaterCtx > 0 ? imp.water / refWaterCtx : 0;
          const rWaste = refWasteCtx > 0 ? imp.waste / refWasteCtx : 0;
          const rawRatio = rCo2 * 0.60 + rWater * 0.20 + rWaste * 0.20;
          const normalized = maxScoreCtx > 0 ? rawRatio / (maxScoreCtx / 100) : rawRatio;
          const health = Math.min(100, Math.round(normalized * 100));

          players.push({
            id: c.id,
            pseudo: c.pseudo,
            avatar: c.avatar,
            color: t.color || '#40916C',
            isCurrent: c.id === child.id,
            groupId: g.id,
            teamId: t.id,
            gender: c.gender,
            birthDate: c.birthDate,
            health
          });
        });
      });
    });

    // 3. Récupérer les missions formatées SF
    const missions = await this.getMissions(instanceId, schoolYear);

    // 4. Retourner le contexte formaté pour le composant App.tsx / Portal2026
    return {
      childInfos: {
        id: child.id,
        pseudo: child.pseudo,
        teamCount,
      },
      players,
      missions,
    };
  }
}
