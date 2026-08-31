export interface ChatMessage {
  id: string;
  sender: string;
  role: 'CHILD' | 'ADMIN' | 'SYSTEM';
  teamName?: string;
  targetTeamName?: string;
  targetPseudo?: string;
  content: string;
  imageUrl?: string | null;
  isPrivate?: boolean;
  timestamp: string | Date;
  channel?: 'global' | 'team';
  reactions?: { emoji: string; count: number; users: string[] }[];
  parentId?: string | null;
  isEdited?: boolean;
}

export interface EvoePlayer {
  id: number;
  childId?: number;
  pseudo: string;
  gender: string;
  birthDate?: string;
  avatar?: string;
  color?: string;
  teamName?: string;
  teamId?: number;
  health: number;
  isCurrent?: boolean;
}

export interface EvoeTeam {
  id: number;
  name: string;
  color: string;
  amplitude?: number;
}
