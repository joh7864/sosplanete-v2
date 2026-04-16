export interface ActionDone {
  id: number;
  savedCo2: number;
  savedWater: number;
  savedWaste: number;
}

export interface Child {
  id: number;
  pseudo: string;
  actionsDone?: ActionDone[];
}

export interface Group {
  id: number;
  name: string;
  children: Child[];
  color?: string | null;
  _count?: {
    children: number;
  };
}

export interface Team {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  groups: Group[];
}

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
  category: string;
  impactLabel?: string | null;
  weightedStars: number;
  image?: string | null;
  description?: string | null;
  defaultCo2?: number;
  defaultWater?: number;
  defaultWaste?: number;
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
}
