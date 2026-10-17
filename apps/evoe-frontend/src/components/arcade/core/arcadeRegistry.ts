import type { ArcadeGameDefinition } from './types';
import { SpaceInvadersGame } from '../games/space-invaders';

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

export function getArcadeGame(gameKey: string): ArcadeGameDefinition | undefined {
  return ARCADE_GAMES_REGISTRY[gameKey];
}
