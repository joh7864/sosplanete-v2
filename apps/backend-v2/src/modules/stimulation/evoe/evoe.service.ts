import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LegacyApiService } from '../../legacy-api/legacy-api.service';
import { ImpactService } from '../../impact/impact.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

function getUploadsDir(): string {
  if (process.env.UPLOADS_DIR && fs.existsSync(process.env.UPLOADS_DIR)) {
    return process.env.UPLOADS_DIR;
  }
  const candidates = [
    path.resolve(__dirname, '../../../../../../uploads'),
    path.resolve(__dirname, '../../../../../uploads'),
    path.resolve(__dirname, '../../../../uploads'),
    path.resolve(__dirname, '../../../uploads'),
    path.resolve(process.cwd(), 'uploads'),
    path.resolve(process.cwd(), '..', '..', 'uploads'),
    path.resolve(process.cwd(), '..', 'uploads'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      const missionsSub = path.join(c, 'missions');
      if (fs.existsSync(missionsSub) && fs.readdirSync(missionsSub).length > 5) {
        return c;
      }
    }
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return path.resolve(process.cwd(), 'uploads');
}

const UPLOADS_DIR = getUploadsDir();

function getAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath || avatarPath === 'avatars/default.png') return null;
  if (avatarPath.startsWith('avatars_3D/')) return avatarPath;
  const fullPath = path.join(UPLOADS_DIR, avatarPath);
  try {
    if (fs.existsSync(fullPath)) return avatarPath;
  } catch (e) {}
  return null;
}

const CATEGORY_SF_MAP: Record<string, string> = {
  // Pôle Ressources Vitales
  Eau: 'Ressources vitales',
  "L'eau": 'Ressources vitales',
  Alimentation: 'Ressources vitales',
  "L'alimentation": 'Ressources vitales',
  Courses: 'Ressources vitales',
  Maison: 'Ressources vitales',

  // Pôle Bio-Génétique
  Biodiversité: 'Bio-génétique',
  'La biodiversité': 'Bio-génétique',
  Biodiversite: 'Bio-génétique',
  Animaux: 'Bio-génétique',

  // Pôle Énergétique & Industriel
  Electricité: 'Energie',
  Electricite: 'Energie',
  Électricité: 'Energie',
  "L'électricité": 'Energie',
  "L'electricité": 'Energie',
  "L'electricite": 'Energie',
  Energie: 'Energie',
  Énergie: 'Energie',
  "L'énergie": 'Energie',
  "L'energie": 'Energie',
  Déchets: 'Recyclage',
  'Les déchets': 'Recyclage',
  Dechets: 'Recyclage',
  'Les dechets': 'Recyclage',

  // Pôle Mobilité & Réseau
  Transport: 'Propulsion',
  Transports: 'Propulsion',
  'Les transports': 'Propulsion',
  Numérique: 'Numérique',
  Numerique: 'Numérique',
  Ecole: 'Académie Temporelle',
  École: 'Académie Temporelle',
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

import { ChatGateway } from '../chat.gateway';
import { WhatsAppService } from '../whatsapp.service';

@Injectable()
export class EvoeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyApiService: LegacyApiService,
    private readonly impactService: ImpactService,
    private readonly chatGateway?: ChatGateway,
    private readonly whatsAppService?: WhatsAppService,
  ) {}

  async getMissions(instanceId: number, schoolYear: string) {
    const basePath = getUploadsDir();
    const missionsDir = path.join(basePath, 'missions');
    const missionsFiles = fs.existsSync(missionsDir)
      ? fs.readdirSync(missionsDir)
      : [];

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
      const code = action.actionRef?.code?.trim() || '';

      // Auto-detect mission image on disk if not explicitly specified in DB
      let autoEvoeImg: string | null = null;
      if (code) {
        const foundMissionFile = missionsFiles.find((f) => {
          const dotIndex = f.lastIndexOf('.');
          if (dotIndex === -1) return false;
          const base = f.substring(0, dotIndex);
          return (
            base.toLowerCase() === `${code}_evoe`.toLowerCase() ||
            base.toLowerCase() === code.toLowerCase()
          );
        });
        if (foundMissionFile) {
          autoEvoeImg = foundMissionFile;
        }
      }

      const rawEvoeImg = [
        action.imageEvoe,
        action.evoeMission?.imageOverride,
        action.actionRef?.imageEvoe,
        autoEvoeImg,
      ].find(isValidImageFilename);
      const rawLegacyImg = [action.image, action.actionRef?.image].find(
        isValidImageFilename,
      );

      let imageFile: string | null = null;
      if (rawEvoeImg && isValidImageFilename(rawEvoeImg)) {
        imageFile =
          rawEvoeImg.startsWith('missions/') ||
          rawEvoeImg.startsWith('actions/') ||
          rawEvoeImg.startsWith('/uploads/')
            ? rawEvoeImg.replace(/^\/uploads\//, '')
            : `missions/${rawEvoeImg}`;
      } else if (rawLegacyImg && isValidImageFilename(rawLegacyImg)) {
        imageFile =
          rawLegacyImg.startsWith('actions/') ||
          rawLegacyImg.startsWith('missions/') ||
          rawLegacyImg.startsWith('/uploads/')
            ? rawLegacyImg.replace(/^\/uploads\//, '')
            : `actions/${rawLegacyImg}`;
      }

      const physicalCat =
        action.category?.name || action.actionRef?.category || '';
      let catSF = 'Général';
      if (physicalCat) {
        const cleanCat = physicalCat.trim();
        const unaccented = cleanCat
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        catSF =
          CATEGORY_SF_MAP[cleanCat] || CATEGORY_SF_MAP[unaccented] || cleanCat;
      }

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
      // Formule de pondération 60% CO2e, 20% Déchets, 20% Eau avec socle de 10 IT
      const calculated = 10 + Math.round(12 * co2 + 4 * waste + 0.04 * water);
      const amplitude = calculated;

      // Fusion of physical action and SF mapping
      return {
        id: action.id,
        label: action.label,
        description: action.description,
        categoryId: action.categoryId,
        categoryName: physicalCat,
        categorySF: catSF,
        actionRefId: action.actionRefId,
        co2: Number(co2.toFixed(1)),
        water: Number(water.toFixed(1)),
        waste: Number(waste.toFixed(1)),
        co2Year: action.actionRef?.co2Year,
        icon: imageFile ? imageFile : '',
        image: imageFile ? imageFile : '',
        imageEvoe: action.imageEvoe || action.actionRef?.imageEvoe || null,
        evoeMission: {
          titreSF: titreSF,
          descriptionSF: descSF,
          amplitude: amplitude,
          pointsIT: amplitude,
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

    const now = new Date();
    let activePeriod = await this.prisma.period.findFirst({
      where: {
        instanceYear: {
          instanceId,
          schoolYear,
        },
        startDate: { lte: now },
        endDate: { gte: now },
        isOpen: true,
      },
    });

    if (!activePeriod) {
      activePeriod = await this.prisma.period.findFirst({
        where: {
          instanceYear: {
            instanceId,
            schoolYear,
          },
          isOpen: true,
        },
        orderBy: { endDate: 'desc' },
      });
    }

    if (!activePeriod) {
      activePeriod = await this.prisma.period.findFirst({
        where: {
          instanceYear: {
            instanceId,
            schoolYear,
          },
        },
        orderBy: { endDate: 'desc' },
      });
    }

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
    const childImpacts = await this.prisma.actionDone.groupBy({
      by: ['childId'],
      _count: { id: true },
      _sum: { savedCo2: true, savedWater: true, savedWaste: true },
      where: {
        period: { instanceYear: { instanceId, schoolYear } },
      },
    });
    const childImpactMap = new Map<
      number,
      { count: number; co2: number; water: number; waste: number }
    >();
    (childImpacts || []).forEach((ci: any) => {
      childImpactMap.set(ci.childId, {
        count: ci._count?.id ?? (typeof ci._count === 'number' ? ci._count : 0),
        co2: ci._sum?.savedCo2 ?? 0,
        water: ci._sum?.savedWater ?? 0,
        waste: ci._sum?.savedWaste ?? 0,
      });
    });

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
      const teamChildrenCount =
        team.groups.reduce((acc, g) => acc + g.children.length, 0) || 1;

      const teamActionsCount = (team.groups || []).reduce((acc, g) => {
        return (
          acc +
          g.children.reduce(
            (cAcc, c) => cAcc + (childImpactMap.get(c.id)?.count || 0),
            0,
          )
        );
      }, 0);

      const totalPoints = this.calculateNormalizedScore(
        co2,
        water,
        waste,
        teamActionsCount / teamChildrenCount,
        moyCo2Monde * 1000 * teamChildrenCount,
        moyEauMonde * teamChildrenCount,
        moyDechetsMonde * teamChildrenCount,
      );

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

        if (this.chatGateway) {
          this.chatGateway.sendSystemAlert(
            `🚀 PALIER TECHNOLOGIQUE ! Le vaisseau de l'équipe "${team.name}" passe au Niveau ${calculatedLevel} (${propTech.name}) !`,
          );
        }
        if (this.whatsAppService) {
          this.whatsAppService.sendPropulsionLevelUpNotification(
            team.name,
            calculatedLevel,
            propTech.name,
            schoolYear,
          );
        }
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
        const impact = childImpactMap.get(child.id) || {
          count: 0,
          co2: 0,
          water: 0,
          waste: 0,
        };
        const score = this.calculateNormalizedScore(
          impact.co2,
          impact.water,
          impact.waste,
          impact.count,
          moyCo2Monde * 1000,
          moyEauMonde,
          moyDechetsMonde,
        );
        const ph = {
          id: child.id,
          childId: child.id,
          pseudo: child.pseudo,
          avatar: getAvatarUrl(child.avatar),
          gender: child.gender,
          birthDate: child.birthDate,
          color: team.color,
          teamName: team.name,
          health,
          actionsCount: impact.count,
          co2: impact.co2,
          water: impact.water,
          waste: impact.waste,
          score,
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

      const systemConfig = this.prisma.systemConfig
        ? await this.prisma.systemConfig.findFirst({
            where: { schoolYear },
          })
        : null;

      formattedTeams.push({
        id: team.id,
        name: team.name,
        color: team.color,
        icon: team.icon,
        whatsappInviteUrl:
          team.whatsappInviteUrl || systemConfig?.whatsappCommunityUrl || null,
        whatsappGroupId: null,
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
      .sort((a, b) => {
        if ((b.score ?? 0) !== (a.score ?? 0))
          return (b.score ?? 0) - (a.score ?? 0);
        if ((b.actionsCount ?? 0) !== (a.actionsCount ?? 0))
          return (b.actionsCount ?? 0) - (a.actionsCount ?? 0);
        if ((b.health ?? 0) !== (a.health ?? 0))
          return (b.health ?? 0) - (a.health ?? 0);
        return (a.pseudo || '').localeCompare(b.pseudo || '');
      })
      .slice(0, 10);

    const systemConfig = this.prisma.systemConfig
      ? await this.prisma.systemConfig.findFirst({
          where: { schoolYear },
        })
      : null;

    return {
      schoolYear,
      whatsappCommunityName: systemConfig?.whatsappCommunityName || null,
      whatsappCommunityUrl: systemConfig?.whatsappCommunityUrl || null,
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
      catMaxWater +=
        (a.specificWater ?? a.actionRef?.defaultWater ?? 0) * factor;
      catMaxWaste +=
        (a.specificWaste ?? a.actionRef?.defaultWaste ?? 0) * factor;
    });

    const actionCount = localActionsCtx.length || 1;
    const avgCo2Catalog = catMaxCo2 / actionCount;
    const avgWaterCatalog = catMaxWater / actionCount;
    const avgWasteCatalog = catMaxWaste / actionCount;

    const targetCo2 =
      avgCo2Catalog * avgActions > 0 ? avgCo2Catalog * avgActions : 1;
    const targetWater =
      avgWaterCatalog * avgActions > 0 ? avgWaterCatalog * avgActions : 1;
    const targetWaste =
      avgWasteCatalog * avgActions > 0 ? avgWasteCatalog * avgActions : 1;

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
      const totalDuration =
        period.endDate.getTime() - period.startDate.getTime();
      const elapsed = Math.max(0, Date.now() - period.startDate.getTime());
      const elapsedRatio =
        totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 0;
      decay = Math.round(elapsedRatio * 85); // Perte max de 85 IT (finit à 15 IT si aucune action)
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

      const itCo2 = Math.min(60, (childCo2 / targetCo2) * 60);
      const itWater = Math.min(20, (childWater / targetWater) * 20);
      const itWaste = Math.min(20, (childWaste / targetWaste) * 20);
      const baseRegen = itCo2 + itWater + itWaste;

      // IT Decay model: start at 100, lose decay, heal baseRegen
      const baseIt = Math.max(0, Math.min(100, 100 - decay + baseRegen));

      let challengeBonus = 0;
      activeChallenges.forEach((ch) => {
        if (ch.targetTeamId === child.teamId) {
          const didIt = childActions.some(
            (ad) => ad.localActionId === ch.localActionId,
          );
          if (didIt) {
            challengeBonus += 15;
          } else {
            challengeBonus += 5;
          }
        }
      });

      const totalIt = Math.min(120, Math.round(baseIt + challengeBonus));
      healthMap.set(child.id, totalIt);
    }

    return healthMap;
  }

  async getOnboardingSteps(authHeader: string, instanceIdStr?: string) {
    const child = await this.legacyApiService.getChildFromAuth(
      authHeader,
      instanceIdStr,
    );
    const schoolYear = child.group.team.instanceYear.schoolYear;
    const config = await this.prisma.systemConfig.findUnique({
      where: { schoolYear },
      select: { ftuxSteps: true },
    });
    return { ftuxSteps: config?.ftuxSteps ?? [] };
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

    const now = new Date();
    const activePeriod = await this.prisma.period.findFirst({
      where: {
        instanceYearId,
        startDate: { lte: now },
        endDate: { gte: now },
        isOpen: true,
      },
    });

    const isPeriodOpen = !!activePeriod;

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

    const year = parseInt(schoolYear.split('-')[0], 10);
    const annualData = await this.prisma.annualImpactData.findUnique({
      where: { year },
    });
    const moyCo2Monde = annualData?.moyCo2Monde ?? 4.7;
    const moyEauMonde = annualData?.moyEauMonde ?? 1385000;
    const moyDechetsMonde = annualData?.moyDechetsMonde ?? 270;

    const childImpacts = await this.prisma.actionDone.groupBy({
      by: ['childId'],
      _count: { id: true },
      _sum: { savedCo2: true, savedWater: true, savedWaste: true },
      where: {
        period: { instanceYear: { instanceId, schoolYear } },
      },
    });
    const childImpactMap = new Map<
      number,
      { count: number; co2: number; water: number; waste: number }
    >();
    childImpacts.forEach((ci: any) => {
      childImpactMap.set(ci.childId, {
        count: ci._count?.id ?? (typeof ci._count === 'number' ? ci._count : 0),
        co2: ci._sum?.savedCo2 ?? 0,
        water: ci._sum?.savedWater ?? 0,
        waste: ci._sum?.savedWaste ?? 0,
      });
    });

    let teamCount = 0;
    const players: any[] = [];

    teams.forEach((t) => {
      t.groups.forEach((g) => {
        teamCount += g.children.length;
        g.children.forEach((c) => {
          const health = healthMap.get(c.id) ?? 0;
          const impact = childImpactMap.get(c.id) || {
            count: 0,
            co2: 0,
            water: 0,
            waste: 0,
          };
          const score = this.calculateNormalizedScore(
            impact.co2,
            impact.water,
            impact.waste,
            impact.count,
            moyCo2Monde * 1000,
            moyEauMonde,
            moyDechetsMonde,
          );

          players.push({
            id: c.id,
            childId: c.id,
            pseudo: c.pseudo,
            avatar: getAvatarUrl(c.avatar),
            color: t.color || '#40916C',
            isCurrent: c.id === child.id,
            groupId: g.id,
            teamId: t.id,
            teamName: t.name,
            gender: c.gender,
            birthDate: c.birthDate,
            health,
            actionsCount: impact.count,
            co2: impact.co2,
            water: impact.water,
            waste: impact.waste,
            score,
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
      .sort((a, b) => {
        if ((b.score ?? 0) !== (a.score ?? 0))
          return (b.score ?? 0) - (a.score ?? 0);
        if ((b.actionsCount ?? 0) !== (a.actionsCount ?? 0))
          return (b.actionsCount ?? 0) - (a.actionsCount ?? 0);
        if ((b.health ?? 0) !== (a.health ?? 0))
          return (b.health ?? 0) - (a.health ?? 0);
        return (a.pseudo || '').localeCompare(b.pseudo || '');
      })
      .slice(0, 10);

    // 4. Récupérer la configuration système (pour l'URL YouTube du briefing)
    const systemConfig = await this.prisma.systemConfig.findFirst({
      where: { schoolYear },
    });

    // 5. Retourner le contexte formaté pour le composant App.tsx / Portal2026
    return {
      childInfos: {
        id: child.id,
        pseudo: child.pseudo,
        hasSeenBriefing: child.hasSeenBriefing,
        hasSeenOnboarding: child.hasSeenOnboarding,
        isPeriodOpen,
        teamCount,
        schoolYear,
        youtubeBriefingUrl: systemConfig?.youtubeBriefingUrl ?? null,
        whatsappCommunityName: systemConfig?.whatsappCommunityName ?? null,
        whatsappCommunityUrl: systemConfig?.whatsappCommunityUrl ?? null,
        whatsappInviteUrl:
          child.group.team.whatsappInviteUrl ||
          systemConfig?.whatsappCommunityUrl ||
          null,
        group: {
          team: {
            id: child.group.team.id,
            name: child.group.team.name,
            color: child.group.team.color,
            whatsappInviteUrl:
              child.group.team.whatsappInviteUrl ||
              systemConfig?.whatsappCommunityUrl ||
              null,
          },
        },
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

  async calculateTeamStabilityForPeriod(
    teamId: number,
    periodId: number,
    instanceYearId: number,
  ): Promise<number> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { groups: { include: { children: true } } },
    });
    if (!team) return 100;
    const children: any[] = [];
    team.groups.forEach((g) => children.push(...g.children));
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
    const child = await this.legacyApiService.getChildFromAuth(
      authHeader,
      instanceIdStr,
    );
    const teamId = child.group.teamId;
    const instanceYearId = child.group.team.instanceYearId;

    let period: any = null;
    try {
      period = await this.legacyApiService.getOpenPeriod(instanceYearId);
    } catch {
      // Si aucune période n'est actuellement ouverte, fallback sur la période active ou la plus récente
      period = await this.prisma.period.findFirst({
        where: { instanceYearId, isOpen: true },
      });
      if (!period) {
        period = await this.prisma.period.findFirst({
          where: { instanceYearId },
          orderBy: { startDate: 'desc' },
        });
      }
    }

    if (!period) {
      return [];
    }

    const challenges = await this.prisma.evoeChallenge.findMany({
      where: {
        periodId: period.id,
      },
      include: {
        challengerTeam: true,
        targetTeam: true,
        localAction: {
          include: { actionRef: true, evoeMission: true },
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

      if (
        (currentStatus === 'PENDING' || currentStatus === 'ACCEPTED') &&
        ch.expiresAt &&
        ch.expiresAt < new Date()
      ) {
        currentStatus = 'FAILED';
        await this.prisma.evoeChallenge.update({
          where: { id: ch.id },
          data: { status: 'FAILED' },
        });
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
        actionTitle:
          (ch.localAction as any).evoeMission?.titreSF || ch.localAction.label,
        actionDescription:
          (ch.localAction as any).evoeMission?.descriptionSF ||
          ch.localAction.description ||
          ch.localAction.actionRef?.description,
        amplitude: (ch.localAction as any).evoeMission?.amplitude || 10,
        pledge: ch.pledge,
        durationHours: ch.durationHours,
        expiresAt: ch.expiresAt,
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
    data: {
      targetTeamId: number;
      localActionId: number;
      pledge: string;
      durationHours?: number;
    },
  ) {
    const child = await this.legacyApiService.getChildFromAuth(
      authHeader,
      instanceIdStr,
    );
    const challengerTeamId = child.group.teamId;
    if (challengerTeamId === data.targetTeamId) {
      throw new BadRequestException(
        'Vous ne pouvez pas défier votre propre équipe.',
      );
    }
    const instanceYearId = child.group.team.instanceYearId;
    const now = new Date();
    const activePeriod = await this.prisma.period.findFirst({
      where: {
        instanceYearId,
        isOpen: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!activePeriod) {
      throw new BadRequestException(
        'Aucune période ouverte, contactez votre administrateur.',
      );
    }
    const period = activePeriod;

    // Vérifier la stabilité de la période précédente pour déterminer le quota
    const previousPeriod = await this.prisma.period.findFirst({
      where: {
        instanceYearId,
        endDate: { lt: period.startDate },
      },
      orderBy: { endDate: 'desc' },
    });

    const stability = previousPeriod
      ? await this.calculateTeamStabilityForPeriod(
          challengerTeamId,
          previousPeriod.id,
          instanceYearId,
        )
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

    const challengerTeam = await this.prisma.team.findUnique({
      where: { id: challengerTeamId },
    });
    const targetTeam = await this.prisma.team.findUnique({
      where: { id: data.targetTeamId },
    });
    const localAction = await this.prisma.localAction.findUnique({
      where: { id: data.localActionId },
    });

    let expiresAt: Date | null = null;
    if (data.durationHours && Number(data.durationHours) > 0) {
      expiresAt = new Date(
        Date.now() + Number(data.durationHours) * 3600 * 1000,
      );
    } else if (period.endDate) {
      expiresAt = new Date(period.endDate);
    }

    const challenge = await this.prisma.evoeChallenge.create({
      data: {
        challengerTeamId,
        targetTeamId: data.targetTeamId,
        localActionId: data.localActionId,
        periodId: period.id,
        pledge: data.pledge,
        durationHours: data.durationHours ? Number(data.durationHours) : null,
        expiresAt,
        status: 'PENDING',
      },
    });

    if (this.chatGateway && challengerTeam && targetTeam && localAction) {
      this.chatGateway.sendSystemAlert(
        `🚨 DÉFI SPATIO-TEMPOREL ! L'équipe "${challengerTeam.name}" défie l'équipe "${targetTeam.name}" sur la mission "${localAction.label}". Gage : "${data.pledge || 'aucun'}"`,
      );
    }
    if (this.whatsAppService && challengerTeam && targetTeam && localAction) {
      const iy = await this.prisma.instanceYear.findUnique({
        where: { id: child.group.team.instanceYearId },
      });
      this.whatsAppService.sendChallengeCreatedNotification(
        challengerTeam.name,
        targetTeam.name,
        localAction.label,
        data.pledge,
        iy?.schoolYear,
      );
    }

    return challenge;
  }

  async respondChallenge(
    authHeader: string,
    instanceIdStr: string,
    challengeId: number,
    accept: boolean,
  ) {
    const child = await this.legacyApiService.getChildFromAuth(
      authHeader,
      instanceIdStr,
    );
    const teamId = child.group.teamId;

    const challenge = await this.prisma.evoeChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) {
      throw new NotFoundException('Défi non trouvé.');
    }
    if (challenge.targetTeamId !== teamId) {
      throw new BadRequestException(
        "Vous ne pouvez répondre qu'aux défis adressés à votre équipe.",
      );
    }
    if (challenge.status !== 'PENDING') {
      throw new BadRequestException('Ce défi a déjà été traité.');
    }

    let newStatus: 'ACCEPTED' | 'DECLINED' | 'SUCCESS' = accept
      ? 'ACCEPTED'
      : 'DECLINED';

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

    const updated = await this.prisma.evoeChallenge.update({
      where: { id: challengeId },
      data: { status: newStatus },
      include: { challengerTeam: true, targetTeam: true, localAction: true },
    });

    if (this.chatGateway) {
      if (newStatus === 'ACCEPTED') {
        this.chatGateway.sendSystemAlert(
          `⚔️ DÉFI ACCEPTÉ ! L'équipe "${updated.targetTeam.name}" relève officiellement le gant lancé par l'équipe "${updated.challengerTeam.name}" sur la mission "${updated.localAction.label}".`,
        );
      } else if (newStatus === 'DECLINED') {
        this.chatGateway.sendSystemAlert(
          `🛡️ DÉFI ESQUIVÉ ! L'équipe "${updated.targetTeam.name}" a décliné le défi de l'équipe "${updated.challengerTeam.name}".`,
        );
      } else if (newStatus === 'SUCCESS') {
        this.chatGateway.sendSystemAlert(
          `⚡ DÉFI REMPORTÉ ! L'équipe "${updated.targetTeam.name}" a accompli sa mission rétroactivement et triomphe du défi de l'équipe "${updated.challengerTeam.name}" !`,
        );
      }
    }

    if (this.whatsAppService) {
      if (newStatus === 'ACCEPTED') {
        this.whatsAppService.sendChallengeAcceptedNotification(
          updated.challengerTeam.name,
          updated.targetTeam.name,
          updated.localAction.label,
        );
      } else if (newStatus === 'DECLINED') {
        this.whatsAppService.sendChallengeDeclinedNotification(
          updated.challengerTeam.name,
          updated.targetTeam.name,
          updated.localAction.label,
        );
      } else if (newStatus === 'SUCCESS') {
        this.whatsAppService.sendChallengeWonNotification(
          updated.targetTeam.name,
          updated.challengerTeam.name,
          updated.localAction.label,
          true,
        );
      }
    }

    return updated;
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
      throw new NotFoundException('Joueur non trouvé');
    }

    const team = child.group.team;
    const instanceYearId = team.instanceYearId;
    const instanceId = team.instanceYear.instanceId;
    const schoolYear = team.instanceYear.schoolYear;

    const systemConfig = this.prisma.systemConfig
      ? await this.prisma.systemConfig.findFirst({
          where: { schoolYear },
        })
      : null;
    const whatsappCommunityUrl = systemConfig?.whatsappCommunityUrl || null;
    const whatsappInviteUrl = team.whatsappInviteUrl || whatsappCommunityUrl;

    // 1. Trouver la période active ou la plus récente
    const now = new Date();
    let activePeriod = await this.prisma.period.findFirst({
      where: {
        instanceYearId,
        startDate: { lte: now },
        endDate: { gte: now },
        isOpen: true,
      },
    });

    if (!activePeriod) {
      activePeriod = await this.prisma.period.findFirst({
        where: {
          instanceYearId,
          isOpen: true,
        },
        orderBy: { endDate: 'desc' },
      });
    }

    if (!activePeriod) {
      activePeriod = await this.prisma.period.findFirst({
        where: {
          instanceYearId,
        },
        orderBy: { endDate: 'desc' },
      });
    }
    const activePeriodId = activePeriod ? activePeriod.id : null;

    // 2. Calculer le score de santé / stabilité actuel (IT)
    const teamChildren = await this.prisma.child.findMany({
      where: { group: { teamId: team.id } },
    });
    const healthMap = await this.getPlayersHealthMap(
      instanceId,
      schoolYear,
      activePeriodId,
      teamChildren.map((c) => ({ ...c, teamId: team.id })),
    );
    const health = healthMap.get(child.id) ?? 100;

    // 3. Calculer l'empreinte totale et les IT depuis le début du jeu
    const allActionsDone = await this.prisma.actionDone.findMany({
      where: { childId },
      select: {
        savedCo2: true,
        savedWater: true,
        savedWaste: true,
      },
    });

    let totalCo2 = 0;
    let totalWater = 0;
    let totalWaste = 0;

    for (const a of allActionsDone) {
      totalCo2 += a.savedCo2 ?? 0;
      totalWater += a.savedWater ?? 0;
      totalWaste += a.savedWaste ?? 0;
    }

    const year = parseInt(schoolYear.split('-')[0], 10);
    const annualData = await this.prisma.annualImpactData.findUnique({
      where: { year },
    });
    const moyCo2Monde = annualData?.moyCo2Monde ?? 4.7;
    const moyEauMonde = annualData?.moyEauMonde ?? 1385000;
    const moyDechetsMonde = annualData?.moyDechetsMonde ?? 270;

    const totalIT = this.calculateNormalizedScore(
      totalCo2,
      totalWater,
      totalWaste,
      allActionsDone.length,
      moyCo2Monde * 1000,
      moyEauMonde,
      moyDechetsMonde,
    );

    const personalMetrics = {
      co2: totalCo2,
      water: totalWater,
      waste: totalWaste,
      totalIT,
      totalActionsCount: allActionsDone.length,
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
          description:
            localAction.evoeMission?.descriptionSF ||
            localAction.description ||
            '',
        });
      }
    }

    // 6. Liste des défis PvP de la période (reçus et envoyés par son équipe)
    const challenges = activePeriodId
      ? await this.prisma.evoeChallenge.findMany({
          where: {
            periodId: activePeriodId,
            OR: [{ challengerTeamId: team.id }, { targetTeamId: team.id }],
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
        opponentName:
          ch.challengerTeamId === team.id
            ? ch.targetTeam.name
            : ch.challengerTeam.name,
        opponentColor:
          ch.challengerTeamId === team.id
            ? ch.targetTeam.color
            : ch.challengerTeam.color,
        actionLabel: getMissionLabel(ch.localAction),
        pledge: ch.pledge,
        status: currentStatus,
        localActionId: ch.localActionId,
        isRetroactive,
      });
    }

    const totalMissionsCount = await this.prisma.actionDone.count({
      where: { childId: child.id },
    });

    return {
      profile: {
        id: child.id,
        pseudo: child.pseudo,
        avatar: getAvatarUrl(child.avatar),
        gender: child.gender,
        birthDate: child.birthDate,
        hasSeenBriefing: child.hasSeenBriefing,
        teamName: team.name,
        teamColor: team.color,
        whatsappInviteUrl,
        whatsappCommunityUrl,
      },
      health,
      totalIT,
      personalMetrics,
      periodMissions,
      top5Missions,
      totalMissionsCount: allActionsDone.length,
      challenges: mappedChallenges,
    };
  }

  async verifyAuth(authHeader: string, instanceIdStr?: string) {
    return this.legacyApiService.getChildFromAuth(authHeader, instanceIdStr);
  }

  async updateProfile(
    authHeader: string,
    instanceIdStr: string,
    data: {
      pseudo?: string;
      password?: string;
      gender?: string | null;
      birthDate?: string | null;
      avatar?: string | null;
    },
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
        if (
          str === 'm' ||
          str.startsWith('hom') ||
          str.startsWith('gar') ||
          str.startsWith('mal') ||
          str === 'h'
        ) {
          genderCode = 'M';
        } else if (
          str === 'f' ||
          str.startsWith('fem') ||
          str.startsWith('fil') ||
          str === 'w'
        ) {
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

    return this.prisma.child.update({
      where: { id: child.id },
      data: updateData,
    });
  }

  async markBriefingSeen(authHeader: string, instanceIdStr?: string) {
    const child = await this.legacyApiService.getChildFromAuth(
      authHeader,
      instanceIdStr,
    );
    await this.prisma.child.update({
      where: { id: child.id },
      data: { hasSeenBriefing: true },
    });
    return { success: true };
  }

  async markOnboardingSeen(authHeader: string, instanceIdStr?: string) {
    const child = await this.legacyApiService.getChildFromAuth(
      authHeader,
      instanceIdStr,
    );
    await this.prisma.child.update({
      where: { id: child.id },
      data: { hasSeenOnboarding: true },
    });
    return { success: true };
  }

  private calculateNormalizedScore(
    co2Kg: number,
    waterL: number,
    wasteKg: number,
    actionsCount: number,
    refCo2Kg = 4700,
    refWaterL = 1385000,
    refWasteKg = 270,
  ): number {
    const pCo2 = refCo2Kg > 0 ? co2Kg / refCo2Kg : 0;
    const pWater = refWaterL > 0 ? waterL / refWaterL : 0;
    const pWaste = refWasteKg > 0 ? wasteKg / refWasteKg : 0;
    const rawImpact = (pCo2 * 0.5 + pWater * 0.2 + pWaste * 0.2) * 1000;
    const bonusActions = Math.min(100, (actionsCount || 0) * 2);
    return Math.round(rawImpact + bonusActions);
  }
}
