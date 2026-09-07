export type EasterEggTriggerType =
  | 'RIDDLE_ANSWER_INPUT'
  | 'KONAMI_CODE'
  | 'COMM_LINK_COMMAND'
  | 'CLICK_REPEATED'
  | 'SCREEN_EDGE'
  | 'TIMELINE_WARP'
  | 'METRIC_SEQUENCE'
  | 'LOGO_HOLD'
  | 'CUSTOM_ACTION';

export type EasterEggDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';

export interface EasterEggItem {
  id: number;
  code: string;
  title: string;
  senderLore?: string;
  crypticMessage?: string | null;
  explicitHint?: string | null;
  mascotDurationSeconds?: number;
  triggerAction?: string | null;
  isInteractable?: boolean;
  isExplicitHintVisible?: boolean;
  clues: string[];
  imageUrl?: string | null;
  triggerType: EasterEggTriggerType;
  triggerConfig?: any;
  complexity: EasterEggDifficulty;
  rewardPointsIT: number;
  orderIndex: number;
}

export interface DiscoveredPlayer {
  childId: number;
  pseudo: string;
  avatar: string | null;
  discoveredAt: string;
}

export interface ActiveEasterEggResponse {
  enabled: boolean;
  hasActiveEgg?: boolean;
  message?: string;
  easterEgg?: EasterEggItem;
  period?: {
    id: number;
    periodStartId?: number;
    periodEndId?: number;
    periodIndex: number;
    cycleIndex: number;
    frequency: number;
  };
  playerProgress?: {
    isDiscovered: boolean;
    firstInteractionAt?: string | null;
    discoveredAt: string | null;
    resolutionTimeSeconds: number | null;
  };
  teamProgress?: {
    teamId: number;
    teamName: string;
    teamColor: string | null;
    discoveredCount: number;
    totalPlayers: number;
    requiredPlayers: number;
    isTeamRewarded: boolean;
    rewardRank: number | null;
    awardedPointsIT: number | null;
    isMaxWinningReached: boolean;
    winningTeamsCount: number;
    maxWinningTeams: number;
    discoveredPlayers: DiscoveredPlayer[];
  };
}

export interface TopDetective {
  childId: number;
  pseudo: string;
  avatar: string | null;
  teamId: number;
  teamName: string;
  teamColor: string | null;
  solvedCount: number;
  totalPointsContributed: number;
}

export interface TeamDetectiveRanking {
  teamId: number;
  name: string;
  color: string | null;
  solvedEnigmasCount: number;
  totalPointsIT: number;
  firstPlacesCount: number;
}

export interface DetectiveLeaderboardResponse {
  topDetectives: TopDetective[];
  teamsRanking: TeamDetectiveRanking[];
}
