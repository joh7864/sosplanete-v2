export interface ArcadeGameProps {
  onGameOver: (result: {
    score: number;
    waveReached: number;
    durationSeconds: number;
  }) => void;
  onQuit?: () => void;
  soundEnabled?: boolean;
  initialLives?: number;
}

export type AlienType = 'squid' | 'crab' | 'octopus';

export interface Alien {
  x: number;
  y: number;
  width: number;
  height: number;
  type: AlienType;
  points: number;
  alive: boolean;
  frame: 0 | 1;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lives: number;
  cannonLevel: 1 | 2 | 3; // 1: Simple, 2: Double, 3: Rapide
  invulnerableTimer: number;
}

export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  isPlayer: boolean;
  isDouble?: boolean;
}

export interface Bunker {
  x: number;
  y: number;
  grid: boolean[][]; // Matrice de pixels (16 colonnes x 12 lignes)
}

export interface Ufo {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  active: boolean;
  points: number;
  timer: number;
}

export type GameStatus = 'ready' | 'playing' | 'wave_cleared' | 'game_over';
