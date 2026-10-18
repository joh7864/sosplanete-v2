import type { ArcadeGameDefinition } from './types';
import { SpaceInvadersGame } from '../games/space-invaders';

/**
 * Registre des mini-jeux : le front ne conserve que l'association clé -> composant React.
 * Titre, sous-titre, année et couleur proviennent du catalogue centralisé du backend
 * (GET /arcade/games) et sont appliqués via `applyArcadeCatalog`. Les valeurs ci-dessous
 * ne servent que de repli tant que le catalogue n'est pas chargé.
 */
export const ARCADE_GAMES_REGISTRY: Record<string, ArcadeGameDefinition> = {
  'space-invaders': {
    id: 'space-invaders',
    title: 'SPACE INVADERS',
    subtitle: 'Protocole des Anciens (Taito 1978)',
    year: 1978,
    easterEggCode: 'EE_KONAMI_80S',
    color: '#00ff66',
    component: SpaceInvadersGame,
  },
};

export interface ArcadeCatalogEntry {
  key: string;
  title: string;
  subtitle: string;
  year: number;
  color: string;
}

/** Applique les métadonnées du catalogue backend aux jeux connus du front. */
export function applyArcadeCatalog(entries: ArcadeCatalogEntry[]): void {
  for (const entry of entries) {
    const game = ARCADE_GAMES_REGISTRY[entry.key];
    if (!game) continue;
    game.title = entry.title;
    game.subtitle = entry.subtitle;
    game.year = entry.year;
    game.color = entry.color;
  }
}

export function getArcadeGame(gameKey: string): ArcadeGameDefinition | undefined {
  return ARCADE_GAMES_REGISTRY[gameKey];
}

const ARCADE_REWARD_PREFIX = 'ARCADE_GAME:';

/** Extrait la clé du mini-jeu d'un `specialReward` (« ARCADE_GAME:<clé> »), ou undefined. */
export function parseArcadeReward(specialReward?: string | null): string | undefined {
  if (!specialReward || !specialReward.startsWith(ARCADE_REWARD_PREFIX)) return undefined;
  return specialReward.slice(ARCADE_REWARD_PREFIX.length) || undefined;
}
