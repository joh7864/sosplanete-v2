import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LegacyApiService } from '../../legacy-api/legacy-api.service';

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

const isValidImageFilename = (s: string | null | undefined): boolean => {
  if (!s) return false;
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(s);
};

@Injectable()
export class EvoeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyApiService: LegacyApiService,
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

    // Mock implementation for the status to be enriched with propulsion logic later
    return {
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
        level: 1, // Progression SF
        points: 0,
      })),
      globalProgression: 0
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
    
    let teamCount = 0;
    const players: any[] = [];

    teams.forEach(t => {
      t.groups.forEach(g => {
        teamCount += g.children.length;
        g.children.forEach(c => {
          players.push({
            id: c.id,
            pseudo: c.pseudo,
            avatar: c.avatar,
            color: t.color || '#40916C', // Team color
            isCurrent: c.id === child.id,
            groupId: g.id,
            teamId: t.id,
            gender: c.gender,
            birthDate: c.birthDate
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
