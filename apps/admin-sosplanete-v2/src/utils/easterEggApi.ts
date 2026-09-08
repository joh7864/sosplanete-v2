import { getAuthData } from './storage';

export interface EasterEggCatalogItem {
  id: number;
  code: string;
  title: string;
  prerequisiteType?: string;
  prerequisiteConfig?: any;
  crypticMessage: string;
  explicitHint: string | null;
  hintDelayMinutes: number;
  mascotDurationSeconds: number;
  triggerAction: string | null;
  senderLore: string | null;
  clues: string[];
  imageUrl: string | null;
  triggerType: string;
  expectedAnswer: string | null;
  caseSensitive: boolean;
  triggerConfig: any;
  complexity: 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';
  rewardPointsIT: number;
  specialReward?: 'NONE' | 'CHRONO_EGG' | 'ROSETTA_STONE';
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EasterEggSettings {
  easterEggsEnabled: boolean;
  easterEggFrequency: number;
  easterEggRequiredPlayers: number;
  easterEggMaxWinningTeams: number;
  metaEnigmaSecretWord?: string;
  metaEnigmaPeriodGlyphs?: any;
}

export interface SolvedEggSummary {
  easterEggId: number;
  title: string;
  rank: number;
  awardedPointsIT: number;
  completedAt: string;
}

export interface ContributingPlayer {
  childId: number;
  pseudo: string;
  avatar: string | null;
  gender?: string | null;
}

export interface TeamEggProgress {
  eggId: number;
  title: string;
  code: string;
  rewardPointsIT: number;
  isCompleted: boolean;
  playersCount: number;
  requiredPlayers: number;
  players: Array<{
    childId: number;
    pseudo: string;
    avatar: string | null;
    gender?: string | null;
    discoveredAt: string;
  }>;
  reward?: {
    rank: number;
    awardedPointsIT: number;
    completedAt: string;
  } | null;
}

export interface TeamTrackingItem {
  teamId: number;
  teamName: string;
  teamColor: string;
  teamIcon?: string | null;
  totalPlayers: number;
  discoveredCount: number;
  requiredPlayers: number;
  activeEggsTotal?: number;
  solvedEggsCount?: number;
  solvedEggs?: SolvedEggSummary[];
  eggsProgress?: TeamEggProgress[];
  totalAwardedPointsIT?: number;
  isRewarded: boolean;
  rewardRank: number | null;
  awardedPointsIT: number | null;
  completedAt: string | null;
  contributingPlayers?: ContributingPlayer[];
}

export interface EggDiscoverer {
  childId: number;
  pseudo: string;
  avatar: string | null;
  gender?: string | null;
  teamId?: number;
  teamName: string;
  teamColor: string;
  teamIcon?: string | null;
  discoveredAt: string;
}

export interface EggTeamCompleted {
  teamId: number;
  rank: number;
  awardedPointsIT: number;
  completedAt: string;
}

export interface DiscoveryLogItem {
  childId: number;
  pseudo: string;
  avatar: string | null;
  gender?: string | null;
  teamName: string;
  teamColor: string;
  teamIcon?: string | null;
  discoveredAt: string;
  resolutionTimeSeconds: number | null;
  answerSubmitted?: string | null;
  easterEggId?: number;
  easterEggTitle?: string;
  easterEggCode?: string;
  rewardPointsIT?: number;
}

export interface AdminTrackingResponse {
  hasActiveEgg: boolean;
  currentEgg?: EasterEggCatalogItem;
  periodActiveEggs?: Array<{
    instanceId: number;
    eggId: number;
    code: string;
    title: string;
    rewardPointsIT: number;
    forceHint: boolean;
    discoverers?: EggDiscoverer[];
    teamsCompleted?: EggTeamCompleted[];
  }>;
  activeInstance?: {
    id: number;
    easterEggId: number;
    forceHint: boolean;
    unlockedAt: string;
    isClosed: boolean;
  } | null;
  currentPeriod?: {
    id: number;
    periodIndex: number;
    startDate: string;
    endDate: string;
  };
  settings?: EasterEggSettings;
  teamsTracking: TeamTrackingItem[];
  individualDiscoveries: DiscoveryLogItem[];
}

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011';

function getHeaders(isMultipart = false) {
  const token = typeof window !== 'undefined' ? getAuthData('access_token') : '';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function fetchAdminCatalog(): Promise<EasterEggCatalogItem[]> {
  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/admin/catalog`, {
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error(`Erreur récupération catalogue (${resp.status})`);
  return resp.json();
}

export async function createAdminEgg(data: Partial<EasterEggCatalogItem>): Promise<EasterEggCatalogItem> {
  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/admin/catalog`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `Erreur création énigme (${resp.status})`);
  }
  return resp.json();
}

export async function updateAdminEgg(id: number, data: Partial<EasterEggCatalogItem>): Promise<EasterEggCatalogItem> {
  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/admin/catalog/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `Erreur mise à jour énigme (${resp.status})`);
  }
  return resp.json();
}

export async function deleteAdminEgg(id: number): Promise<{ success: boolean }> {
  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/admin/catalog/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error(`Erreur suppression énigme (${resp.status})`);
  return resp.json();
}

export async function reorderAdminCatalog(orderedIds: number[]): Promise<{ success: boolean }> {
  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/admin/catalog/reorder`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ orderedIds }),
  });
  if (!resp.ok) throw new Error(`Erreur réorganisation catalogue (${resp.status})`);
  return resp.json();
}

export async function uploadEnigmaImage(file: File): Promise<{ imageUrl: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/admin/upload-image`, {
    method: 'POST',
    headers: getHeaders(true),
    body: formData,
  });
  if (!resp.ok) throw new Error(`Erreur upload image (${resp.status})`);
  return resp.json();
}

export async function fetchAdminTracking(
  instanceYearId: number,
  eggId?: number,
): Promise<AdminTrackingResponse> {
  const url = eggId
    ? `${getApiUrl()}/evoe/easter-eggs/admin/tracking/${instanceYearId}?eggId=${eggId}`
    : `${getApiUrl()}/evoe/easter-eggs/admin/tracking/${instanceYearId}`;
  const resp = await fetch(url, {
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error(`Erreur récupération tracking (${resp.status})`);
  return resp.json();
}

export async function updateAdminSettings(instanceYearId: number, settings: Partial<EasterEggSettings>): Promise<any> {
  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/admin/settings/${instanceYearId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(settings),
  });
  if (!resp.ok) throw new Error(`Erreur mise à jour paramètres (${resp.status})`);
  return resp.json();
}

export async function openInstanceEgg(
  instanceYearId: number,
  easterEggId: number,
  closePrevious: boolean = true,
): Promise<any> {
  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/admin/open-instance`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ instanceYearId, easterEggId, closePrevious }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ouverture manuelle (${resp.status})`);
  }
  return resp.json();
}

export async function closeInstanceEgg(instanceYearId: number, easterEggId?: number): Promise<any> {
  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/admin/close-instance`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ instanceYearId, easterEggId }),
  });
  if (!resp.ok) throw new Error(`Erreur clôture manuelle (${resp.status})`);
  return resp.json();
}

export async function forceInstanceHint(instanceYearId: number, easterEggId?: number): Promise<any> {
  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/admin/force-hint`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ instanceYearId, easterEggId }),
  });
  if (!resp.ok) throw new Error(`Erreur forçage indice (${resp.status})`);
  return resp.json();
}

export function resolveEnigmaImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  // Normaliser cadenas_4ch.webp vers .svg
  const normalized = url.replace(/cadenas_4ch\.webp$/i, 'cadenas_4ch.svg');
  if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('data:')) {
    return normalized;
  }
  if (normalized.startsWith('/uploads/')) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011';
    return `${apiBase}${normalized}`;
  }
  return normalized;
}

export interface DetectiveLeaderboard {
  topDetectives: Array<{
    childId: number;
    pseudo: string;
    avatar: string | null;
    gender?: string | null;
    teamId: number;
    teamName: string;
    teamColor: string | null;
    teamIcon?: string | null;
    instanceYearId: number;
    solvedCount: number;
    totalPointsContributed: number;
  }>;
  teamsRanking: Array<{
    teamId: number;
    name: string;
    color: string | null;
    icon?: string | null;
    instanceYearId: number;
    solvedEnigmasCount: number;
    totalPointsIT: number;
    firstPlacesCount: number;
  }>;
}

export async function fetchAdminLeaderboard(instanceYearId?: number): Promise<DetectiveLeaderboard> {
  const query = instanceYearId ? `?instanceYearId=${instanceYearId}` : '';
  const resp = await fetch(`${getApiUrl()}/evoe/easter-eggs/leaderboard${query}`, {
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error(`Erreur leaderboard (${resp.status})`);
  return resp.json();
}

export interface ActionRefSummary {
  id: number;
  code: string;
  referenceName: string;
  category?: string | null;
  image?: string | null;
  imageEvoe?: string | null;
}

export async function fetchActionRefs(): Promise<ActionRefSummary[]> {
  const resp = await fetch(`${getApiUrl()}/action-ref`, {
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error(`Erreur récupération référentiel actions (${resp.status})`);
  return resp.json();
}


