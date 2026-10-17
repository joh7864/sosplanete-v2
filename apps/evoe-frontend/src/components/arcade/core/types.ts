import React from 'react';
import type { ArcadeGameProps } from '../games/space-invaders/types';

export interface ArcadeScoreEntry {
  id: number;
  rank: number;
  childId: number;
  childPseudo: string;
  teamId: number;
  teamName: string;
  score: number;
  waveReached: number;
  createdAt: string | Date;
}

export interface ArcadeGameDefinition {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  easterEggCode: string;
  color: string;
  component: React.ComponentType<ArcadeGameProps>;
}
