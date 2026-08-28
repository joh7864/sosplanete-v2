export interface WizardStudent {
  pseudo: string;
  password?: string;
  teamName: string;
  groupName: string;
  isDelegate?: boolean;
  avatar?: string;
}

export interface WizardGroup {
  id?: number;
  tempId?: string;
  name: string;
  color?: string;
  childrenCount?: number;
}

export interface WizardTeam {
  id?: number;
  tempId?: string;
  name: string;
  color: string;
  icon?: string;
  whatsappInviteUrl?: string;
  groups: WizardGroup[];
}

export interface WizardPeriodItem {
  number: number;
  startDate: string;
  endDate: string;
}

export interface WizardDraftState {
  mode: 'ex_nihilo' | 'duplicate';
  currentStep: number;
  completedSteps: number[];
  
  // Étape 2 : Identité & Ancre
  identity: {
    selectedAnchorId: number | null;
    schoolName: string;
    schoolYear: string;
    hostUrl: string;
    icon: string;
    adminId: number | null;
  };

  // Étape de duplication spécifique (si mode == 'duplicate')
  duplication: {
    sourceInstanceId: number | null;
    fromSchoolYear: string;
    toSchoolYear: string;
    cloneChildren: boolean;
  };

  // Étape 3 : Calendrier & Périodes
  calendar: {
    gameStartDate: string;
    gameEndDate: string;
    gamePeriodsCount: number;
    customPeriods: WizardPeriodItem[];
  };

  // Étape 4 : Organisation & Élèves
  organization: {
    teams: WizardTeam[];
    students: WizardStudent[];
  };

  // Étape 5 : Catalogue d'actions
  catalog: {
    selectedActionRefIds: number[];
    customImpacts: Record<number, {
      co2?: number;
      water?: number;
      waste?: number;
      energy?: number;
    }>;
  };

  // Étape 6 : Gamification & Données globales
  gamification: {
    avgActionsPerChildPerPeriod: number;
    animalAdvanceMargin: number;
    bienveillanceThreshold: number;
    unlockedChapters: number;
  };

  // Étape 7 : Communication
  communication: {
    whatsappCommunityUrl: string;
    whatsappGeneralUrl: string;
    youtubeBriefingUrl: string;
  };

  // Méta
  meta: {
    lastSavedAt: string;
    instanceNamePreview: string;
  };
}

export const INITIAL_WIZARD_STATE: WizardDraftState = {
  mode: 'ex_nihilo',
  currentStep: 1,
  completedSteps: [],
  identity: {
    selectedAnchorId: null,
    schoolName: '',
    schoolYear: '2025-2026',
    hostUrl: '',
    icon: '',
    adminId: null,
  },
  duplication: {
    sourceInstanceId: null,
    fromSchoolYear: '2024-2025',
    toSchoolYear: '2025-2026',
    cloneChildren: true,
  },
  calendar: {
    gameStartDate: '2025-09-01',
    gameEndDate: '2026-06-30',
    gamePeriodsCount: 24,
    customPeriods: [],
  },
  organization: {
    teams: [
      {
        tempId: 'team-1',
        name: 'Les Aventuriers de la Terre',
        color: '#10b981',
        icon: '🌿',
        groups: [
          { tempId: 'group-1-1', name: 'Classe Verte', color: '#10b981', childrenCount: 0 },
        ],
      },
      {
        tempId: 'team-2',
        name: 'Les Gardiens de l Eau',
        color: '#0ea5e9',
        icon: '💧',
        groups: [
          { tempId: 'group-2-1', name: 'Classe Bleue', color: '#0ea5e9', childrenCount: 0 },
        ],
      },
    ],
    students: [],
  },
  catalog: {
    selectedActionRefIds: [],
    customImpacts: {},
  },
  gamification: {
    avgActionsPerChildPerPeriod: 8,
    animalAdvanceMargin: 2,
    bienveillanceThreshold: 0.40,
    unlockedChapters: 0,
  },
  communication: {
    whatsappCommunityUrl: '',
    whatsappGeneralUrl: '',
    youtubeBriefingUrl: '',
  },
  meta: {
    lastSavedAt: new Date().toISOString(),
    instanceNamePreview: 'Nouvel Espace',
  },
};
