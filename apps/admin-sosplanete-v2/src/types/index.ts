// ─── Auth & Session ──────────────────────────────────────────────────────────

export type UserRole = 'AS' | 'AM';

export interface User {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  role: UserRole;
  createdAt?: string;
}

// ─── Instance ────────────────────────────────────────────────────────────────

export interface GameConfig {
  id?: number;
  instanceId: number;
  schoolYear: string;
  gameStartDate: string | null;
  gameEndDate: string | null;
  gamePeriodsCount: number;
  avgActionsPerChildPerPeriod?: number;
  animalAdvanceMargin?: number;
  bienveillanceThreshold?: number;
}

export interface Instance {
  id: number;
  schoolName: string;
  hostUrl: string | null;
  isOpen: boolean;
  icon: string | null;
  currentSchoolYear: string;
  adminId: number | null;
  admin?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>;
  createdAt?: string;
  _count?: {
    teams: number;
    localActions: number;
    periods: number;
  };
  playersCount?: number;
  actionsCount?: number;
  totalImpact?: number;
}

// ─── Organisation ────────────────────────────────────────────────────────────

export interface ActionDone {
  id: number;
  savedCo2: number;
  savedWater: number;
  savedWaste: number;
  savedEnergy?: number | null;
  createdAt?: string;
  childId?: number;
  localActionId?: number;
  periodId?: number;
}

export interface Child {
  id: number;
  pseudo: string;
  avatar?: string | null;
  groupId?: number;
  actionsDone?: ActionDone[];
}

export interface Group {
  id: number;
  name: string;
  children: Child[];
  color?: string | null;
  teamId?: number;
  _count?: {
    children: number;
  };
}

export interface Team {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  instanceId?: number;
  schoolYear?: string | null;
  groups: Group[];
}

// ─── Catalogue ───────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  icon?: string | null;
  order: number;
  instanceId: number;
}

export interface ActionRef {
  id: number;
  code: string;
  referenceName: string;
  category?: string;
  categoryRefId?: number | null;
  impactLabel?: string | null;
  weightedStars: number; // obligatoire pour compatibilité composants catalogue (défaut : 0)
  image?: string | null;
  description?: string | null;
  defaultCo2?: number | null;
  defaultWater?: number | null;
  defaultWaste?: number | null;
  defaultEnergy?: number | null;
}

export interface CategoryRef {
  id: number;
  name: string;
  icon?: string | null;
  order: number;
  _count?: { actionRefs: number };
}


export interface LocalAction {
  id: number;
  label: string;
  categoryId?: number | null;
  category?: Category | null;
  image?: string | null;
  description?: string | null;
  actionRefId: number;
  actionRef: ActionRef;
  instanceId?: number;
  schoolYear?: string | null;
  specificCo2?: number | null;
  specificWater?: number | null;
  specificWaste?: number | null;
  specificEnergy?: number | null;
}

// ─── Périodes ────────────────────────────────────────────────────────────────

export interface Period {
  id: number;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  instanceId: number;
  schoolYear: string | null;
}

// ─── Tracking ────────────────────────────────────────────────────────────────

export interface ChildTrackingStats {
  id: number;
  pseudo: string;
  groupName: string;
  teamName: string;
  weeklyActions: number[];
  totalActions: number;
}

export interface TrackingStats {
  periods: Period[];
  children: ChildTrackingStats[];
  weeklyTotals: number[];
  grandTotal: number;
}

// ─── Stimulation / Eco-Bar-Race ──────────────────────────────────────────────

export interface EcoBarRaceRanking {
  instanceId: number;
  schoolName: string;
  icon: string | null;
  rank: number;
  co2Total: number;
  waterTotal: number;
  wasteTotal: number;
}

export interface EcoBarRaceSnapshot {
  id: number;
  period: number;
  periodDate: string;
  rankings: EcoBarRaceRanking[];
  schoolYear: string;
  createdAt: string;
}
