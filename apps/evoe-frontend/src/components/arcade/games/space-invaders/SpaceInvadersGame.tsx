import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ArcadeGameProps, Alien, Bullet, Bunker, Ufo, GameStatus } from './types';
import { spaceInvadersAudio } from './SpaceInvadersAudio';

// ==========================================
// SPRITES PIXEL ART (Matrices binaires)
// ==========================================

const SPRITE_SQUID_1 = [
  '00011000',
  '00111100',
  '01111110',
  '11011011',
  '11111111',
  '00100100',
  '01011010',
  '10100101',
];

const SPRITE_SQUID_2 = [
  '00011000',
  '00111100',
  '01111110',
  '11011011',
  '11111111',
  '01000010',
  '10011001',
  '01000010',
];

const SPRITE_CRAB_1 = [
  '00100000100',
  '00010001000',
  '00111111100',
  '01101110110',
  '11111111111',
  '10111111101',
  '10100000101',
  '00011011000',
];

const SPRITE_CRAB_2 = [
  '00100000100',
  '10010001001',
  '10111111101',
  '11101110111',
  '11111111111',
  '01111111110',
  '00100000100',
  '01000000010',
];

const SPRITE_OCTOPUS_1 = [
  '000011110000',
  '011111111110',
  '111111111111',
  '111001100111',
  '111111111111',
  '000110011000',
  '001101101100',
  '110000000011',
];

const SPRITE_OCTOPUS_2 = [
  '000011110000',
  '011111111110',
  '111111111111',
  '111001100111',
  '111111111111',
  '001100110000',
  '011000001100',
  '000110011000',
];

const SPRITE_PLAYER = [
  '0000001000000',
  '0000011100000',
  '0000011100000',
  '0111111111110',
  '1111111111111',
  '1111111111111',
  '1111111111111',
  '1111111111111',
];

const SPRITE_UFO = [
  '0000011111100000',
  '0001111111111000',
  '0011111111111100',
  '0110110110110110',
  '1111111111111111',
  '0011100110011100',
  '0001000000001000',
];

// Helper dessin matrice
function drawPixelMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: string[],
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  ctx.fillStyle = color;
  for (let row = 0; row < matrix.length; row++) {
    const line = matrix[row];
    for (let col = 0; col < line.length; col++) {
      if (line[col] === '1') {
        ctx.fillRect(
          Math.floor(x + col * scale),
          Math.floor(y + row * scale),
          scale,
          scale,
        );
      }
    }
  }
}

// Construction initiale d'un bunker (matrice 18 colonnes x 12 lignes)
function createBunkerGrid(): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < 12; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < 18; c++) {
      // Forme en dôme avec arche découpée au bas
      if (r < 3) {
        // Arrondi supérieur
        const distFromCenter = Math.abs(c - 8.5);
        row.push(distFromCenter < 8 - (3 - r) * 1.5);
      } else if (r >= 8 && c >= 5 && c <= 12) {
        // Arche inférieure
        row.push(false);
      } else {
        row.push(true);
      }
    }
    grid.push(row);
  }
  return grid;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 720;

export const SpaceInvadersGame: React.FC<ArcadeGameProps> = ({
  onGameOver,
  soundEnabled = true,
  initialLives = 3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // États réactifs d'affichage pour les boutons et messages
  const [gameStatus, setGameStatus] = useState<GameStatus>('ready');
  const [powerUpMessage, setPowerUpMessage] = useState<string | null>(null);

  // Synchronisation audio
  useEffect(() => {
    spaceInvadersAudio.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Références d'état mutable pour la boucle 60 FPS
  const stateRef = useRef({
    score: 0,
    wave: 1,
    lives: initialLives,
    cannonLevel: 1 as 1 | 2 | 3,
    status: 'ready' as GameStatus,
    playerX: CANVAS_WIDTH / 2 - 18,
    playerSpeed: 4.8,
    invulnerableTimer: 0,
    aliens: [] as Alien[],
    alienDir: 1, // 1: droite, -1: gauche
    alienStepTimer: 0,
    alienStepInterval: 600,
    alienMarchNote: 0,
    bullets: [] as Bullet[],
    bunkers: [] as Bunker[],
    ufo: {
      x: -60,
      y: 65,
      width: 48,
      height: 21,
      vx: 2.2,
      active: false,
      points: 150,
      timer: 0,
    } as Ufo,
    keys: {
      left: false,
      right: false,
      fire: false,
    },
    lastFireTime: 0,
    startTime: Date.now(),
  });

  // Initialisation d'une vague d'aliens
  const initWave = useCallback((waveNum: number) => {
    const aliens: Alien[] = [];
    const rows = 5;
    const cols = 11;
    const startY = Math.min(95 + (waveNum - 1) * 22, 220);
    const spacingX = 42;
    const spacingY = 32;

    for (let r = 0; r < rows; r++) {
      let type: 'squid' | 'crab' | 'octopus' = 'octopus';
      let points = 10;
      if (r === 0) {
        type = 'squid';
        points = 30;
      } else if (r === 1 || r === 2) {
        type = 'crab';
        points = 20;
      }

      for (let c = 0; c < cols; c++) {
        aliens.push({
          x: 75 + c * spacingX,
          y: startY + r * spacingY,
          width: 32,
          height: 24,
          type,
          points,
          alive: true,
          frame: 0,
        });
      }
    }

    // 4 Bunkers verts espacés
    const bunkers: Bunker[] = [];
    const bunkerY = 530;
    const bunkerSpacing = 135;
    for (let i = 0; i < 4; i++) {
      bunkers.push({
        x: 80 + i * bunkerSpacing,
        y: bunkerY,
        grid: createBunkerGrid(),
      });
    }

    stateRef.current.aliens = aliens;
    stateRef.current.bunkers = bunkers;
    stateRef.current.alienDir = 1;
    stateRef.current.alienStepTimer = 0;
    stateRef.current.alienStepInterval = Math.max(620 - (waveNum - 1) * 45, 220);
    stateRef.current.alienMarchNote = 0;
    stateRef.current.bullets = [];
  }, []);

  // Démarrer une nouvelle partie
  const startGame = useCallback(() => {
    stateRef.current.score = 0;
    stateRef.current.wave = 1;
    stateRef.current.lives = initialLives;
    stateRef.current.cannonLevel = 1;
    stateRef.current.status = 'playing';
    stateRef.current.startTime = Date.now();
    stateRef.current.playerX = CANVAS_WIDTH / 2 - 18;
    setGameStatus('playing');
    setPowerUpMessage(null);
    initWave(1);
  }, [initialLives, initWave]);

  // Contrôles Clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
        stateRef.current.keys.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        stateRef.current.keys.right = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        stateRef.current.keys.fire = true;
        if (stateRef.current.status === 'ready') {
          startGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
        stateRef.current.keys.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        stateRef.current.keys.right = false;
      }
      if (e.code === 'Space') {
        stateRef.current.keys.fire = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startGame]);

  // Boucle de Jeu Principale (requestAnimationFrame 60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const state = stateRef.current;

      // ==========================================
      // MISE À JOUR DE LA LOGIQUE
      // ==========================================
      if (state.status === 'playing') {
        // 1. Déplacement du joueur
        if (state.keys.left) {
          state.playerX = Math.max(state.playerX - state.playerSpeed, 30);
        }
        if (state.keys.right) {
          state.playerX = Math.min(state.playerX + state.playerSpeed, CANVAS_WIDTH - 65);
        }

        if (state.invulnerableTimer > 0) {
          state.invulnerableTimer -= dt;
        }

        // 2. Tir du joueur
        const now = currentTime;
        const cooldown = state.cannonLevel === 3 ? 180 : 320;
        const maxBullets = state.cannonLevel === 3 ? 3 : 1;

        const currentPlBullets = state.bullets.filter((b) => b.isPlayer).length;
        if (state.keys.fire && now - state.lastFireTime > cooldown && currentPlBullets < maxBullets) {
          state.lastFireTime = now;
          spaceInvadersAudio.playPlayerLaser();

          if (state.cannonLevel >= 2) {
            // Double canon : deux tirs parallèles
            state.bullets.push({
              x: state.playerX + 4,
              y: 635,
              width: 3,
              height: 12,
              vy: -9,
              isPlayer: true,
              isDouble: true,
            });
            state.bullets.push({
              x: state.playerX + 28,
              y: 635,
              width: 3,
              height: 12,
              vy: -9,
              isPlayer: true,
              isDouble: true,
            });
          } else {
            // Canon standard : un tir central
            state.bullets.push({
              x: state.playerX + 16,
              y: 635,
              width: 3,
              height: 12,
              vy: -8.5,
              isPlayer: true,
            });
          }
        }

        // 3. Déplacement des aliens & tempo sonore
        const aliveAliens = state.aliens.filter((a) => a.alive);
        if (aliveAliens.length === 0) {
          // Vague nettoyée !
          state.status = 'wave_cleared';
          setGameStatus('wave_cleared');
          spaceInvadersAudio.playWaveCleared();

          setTimeout(() => {
            state.wave += 1;

            // Amélioration canon au passage de vague
            if (state.cannonLevel === 1) {
              state.cannonLevel = 2;
              setPowerUpMessage('⚡ CANON AMÉLIORÉ : DOUBLE LASER !');
              spaceInvadersAudio.playPowerUp();
            } else if (state.cannonLevel === 2 && state.wave >= 3) {
              state.cannonLevel = 3;
              setPowerUpMessage('🔥 CANON ÉLITE : CADENCE RAPIDE !');
              spaceInvadersAudio.playPowerUp();
            }

            initWave(state.wave);
            state.status = 'playing';
            setGameStatus('playing');
          }, 1800);
        } else {
          // Accélération progressive en fonction des aliens restants
          const speedFactor = aliveAliens.length / 55;
          const currentInterval = Math.max(
            state.alienStepInterval * speedFactor,
            65, // Tempo frénétique sur le dernier alien !
          );

          state.alienStepTimer += dt * 1000;
          if (state.alienStepTimer >= currentInterval) {
            state.alienStepTimer = 0;

            // Jouer le pas sonore 8-bit
            spaceInvadersAudio.playMarchSound(state.alienMarchNote);
            state.alienMarchNote = (state.alienMarchNote + 1) % 4;

            // Vérifier si les aliens touchent le bord
            let shouldDrop = false;
            for (const alien of aliveAliens) {
              if (
                (state.alienDir === 1 && alien.x + alien.width >= CANVAS_WIDTH - 35) ||
                (state.alienDir === -1 && alien.x <= 35)
              ) {
                shouldDrop = true;
                break;
              }
            }

            if (shouldDrop) {
              state.alienDir = -state.alienDir;
              for (const alien of aliveAliens) {
                alien.y += 18;
                alien.frame = alien.frame === 0 ? 1 : 0;

                // Condition défaite : un alien touche la ligne des bunkers !
                if (alien.y + alien.height >= 540) {
                  state.status = 'game_over';
                  setGameStatus('game_over');
                  spaceInvadersAudio.playPlayerExplosion();
                  const duration = Math.floor((Date.now() - state.startTime) / 1000);
                  onGameOver({
                    score: state.score,
                    waveReached: state.wave,
                    durationSeconds: duration,
                  });
                }
              }
            } else {
              const stepX = state.alienDir * 12;
              for (const alien of aliveAliens) {
                alien.x += stepX;
                alien.frame = alien.frame === 0 ? 1 : 0;
              }
            }

            // Tirs aliens aléatoires
            if (Math.random() < 0.35 + state.wave * 0.08 && aliveAliens.length > 0) {
              const randomAlien = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
              state.bullets.push({
                x: randomAlien.x + randomAlien.width / 2,
                y: randomAlien.y + randomAlien.height,
                width: 3,
                height: 10,
                vy: 4.5 + state.wave * 0.4,
                isPlayer: false,
              });
            }
          }
        }

        // 4. Gestion de la Soucoupe Mystère UFO
        state.ufo.timer += dt;
        if (!state.ufo.active && state.ufo.timer > 18) {
          state.ufo.active = true;
          state.ufo.x = -60;
          state.ufo.timer = 0;
          const ufoPoints = [100, 150, 200, 300];
          state.ufo.points = ufoPoints[Math.floor(Math.random() * ufoPoints.length)];
          spaceInvadersAudio.startUfoSound();
        }

        if (state.ufo.active) {
          state.ufo.x += state.ufo.vx;
          if (state.ufo.x > CANVAS_WIDTH + 60) {
            state.ufo.active = false;
            spaceInvadersAudio.stopUfoSound();
          }
        }

        // 5. Déplacement des projectiles & collisions
        for (let i = state.bullets.length - 1; i >= 0; i--) {
          const bullet = state.bullets[i];
          bullet.y += bullet.vy;

          // Hors de l'écran
          if (bullet.y < 40 || bullet.y > CANVAS_HEIGHT) {
            state.bullets.splice(i, 1);
            continue;
          }

          // A) Collision tir joueur avec aliens
          if (bullet.isPlayer) {
            let hitAlien = false;
            for (const alien of state.aliens) {
              if (
                alien.alive &&
                bullet.x >= alien.x &&
                bullet.x <= alien.x + alien.width &&
                bullet.y >= alien.y &&
                bullet.y <= alien.y + alien.height
              ) {
                alien.alive = false;
                hitAlien = true;
                state.score += alien.points;
                spaceInvadersAudio.playAlienHit();
                break;
              }
            }

            // B) Collision avec la soucoupe rouge UFO
            if (
              !hitAlien &&
              state.ufo.active &&
              bullet.x >= state.ufo.x &&
              bullet.x <= state.ufo.x + state.ufo.width &&
              bullet.y >= state.ufo.y &&
              bullet.y <= state.ufo.y + state.ufo.height
            ) {
              hitAlien = true;
              state.score += state.ufo.points;
              state.ufo.active = false;
              spaceInvadersAudio.stopUfoSound();
              spaceInvadersAudio.playAlienHit();

              // Bonus : déblocage immédiat du double laser
              if (state.cannonLevel === 1) {
                state.cannonLevel = 2;
                setPowerUpMessage('⚡ UFO ABATTU : DOUBLE LASER DÉBLOQUÉ !');
                spaceInvadersAudio.playPowerUp();
              }
            }

            if (hitAlien) {
              state.bullets.splice(i, 1);
              continue;
            }
          }

          // C) Collision tir ennemi avec le joueur
          if (!bullet.isPlayer && state.invulnerableTimer <= 0) {
            const playerBox = {
              x: state.playerX,
              y: 640,
              width: 36,
              height: 22,
            };
            if (
              bullet.x >= playerBox.x &&
              bullet.x <= playerBox.x + playerBox.width &&
              bullet.y >= playerBox.y &&
              bullet.y <= playerBox.y + playerBox.height
            ) {
              state.bullets.splice(i, 1);
              state.lives -= 1;
              state.invulnerableTimer = 2.2;
              spaceInvadersAudio.playPlayerExplosion();

              if (state.lives <= 0) {
                state.status = 'game_over';
                setGameStatus('game_over');
                spaceInvadersAudio.stopUfoSound();
                const duration = Math.floor((Date.now() - state.startTime) / 1000);
                onGameOver({
                  score: state.score,
                  waveReached: state.wave,
                  durationSeconds: duration,
                });
              }
              continue;
            }
          }

          // D) Collision avec les Bunkers verts (dégradation pixel par pixel)
          for (const bunker of state.bunkers) {
            const scale = 4;
            const bW = 18 * scale;
            const bH = 12 * scale;

            if (
              bullet.x >= bunker.x &&
              bullet.x <= bunker.x + bW &&
              bullet.y >= bunker.y &&
              bullet.y <= bunker.y + bH
            ) {
              const gridCol = Math.floor((bullet.x - bunker.x) / scale);
              const gridRow = Math.floor((bullet.y - bunker.y) / scale);

              if (
                gridRow >= 0 &&
                gridRow < 12 &&
                gridCol >= 0 &&
                gridCol < 18 &&
                bunker.grid[gridRow][gridCol]
              ) {
                // Détruire un rayon de 2-3 pixels dans le bunker
                for (let dr = -1; dr <= 1; dr++) {
                  for (let dc = -1; dc <= 1; dc++) {
                    const r = gridRow + dr;
                    const c = gridCol + dc;
                    if (r >= 0 && r < 12 && c >= 0 && c < 18) {
                      bunker.grid[r][c] = false;
                    }
                  }
                }
                state.bullets.splice(i, 1);
                break;
              }
            }
          }
        }
      }

      // ==========================================
      // RENDU GRAPHIQUE CANVAS RETRO COULEUR
      // ==========================================
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Ligne de sol verte rétro
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 680);
      ctx.lineTo(CANVAS_WIDTH - 20, 680);
      ctx.stroke();

      // En-tête HUD d'arcade
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#ff2d75';
      ctx.fillText('SCORE<1>', 40, 30);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(state.score).padStart(5, '0'), 40, 52);

      ctx.fillStyle = '#00f0ff';
      ctx.fillText('HI-SCORE', 260, 30);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('99990', 260, 52);

      ctx.fillStyle = '#ffd000';
      ctx.fillText('WAVE', 520, 30);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(state.wave).padStart(2, '0'), 530, 52);

      // 1. Dessin de la Soucoupe Rouge UFO
      if (state.ufo.active) {
        drawPixelMatrix(ctx, SPRITE_UFO, state.ufo.x, state.ufo.y, 3, '#ff2222');
      }

      // 2. Dessin des Aliens Couleur 1979/80
      for (const alien of state.aliens) {
        if (!alien.alive) continue;

        if (alien.type === 'squid') {
          // Rangée du haut : Rose Néon / Magenta (30 pts)
          const matrix = alien.frame === 0 ? SPRITE_SQUID_1 : SPRITE_SQUID_2;
          drawPixelMatrix(ctx, matrix, alien.x, alien.y, 3.2, '#ff2d75');
        } else if (alien.type === 'crab') {
          // Rangées du milieu : Bleu Cyan (20 pts)
          const matrix = alien.frame === 0 ? SPRITE_CRAB_1 : SPRITE_CRAB_2;
          drawPixelMatrix(ctx, matrix, alien.x, alien.y, 2.7, '#00f0ff');
        } else {
          // Rangées du bas : Jaune Ambré (10 pts)
          const matrix = alien.frame === 0 ? SPRITE_OCTOPUS_1 : SPRITE_OCTOPUS_2;
          drawPixelMatrix(ctx, matrix, alien.x, alien.y, 2.6, '#ffd000');
        }
      }

      // 3. Dessin des 4 Bunkers Verts
      for (const bunker of state.bunkers) {
        ctx.fillStyle = '#00ff66';
        const scale = 4;
        for (let r = 0; r < 12; r++) {
          for (let c = 0; c < 18; c++) {
            if (bunker.grid[r][c]) {
              ctx.fillRect(bunker.x + c * scale, bunker.y + r * scale, scale, scale);
            }
          }
        }
      }

      // 4. Dessin des Projectiles
      for (const b of state.bullets) {
        if (b.isPlayer) {
          ctx.fillStyle = '#00ff66';
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 8;
          ctx.fillRect(b.x, b.y, b.width, b.height);
          ctx.shadowBlur = 0;
        } else {
          // Tir alien blanc en zigzag
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(b.x, b.y, b.width, b.height);
        }
      }

      // 5. Dessin du Joueur (Canon Vert Phosphore)
      if (
        state.invulnerableTimer <= 0 ||
        Math.floor(currentTime / 100) % 2 === 0
      ) {
        drawPixelMatrix(ctx, SPRITE_PLAYER, state.playerX, 640, 2.8, '#00ff66');
      }

      // 6. Pied de page : Vies & Armement
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText(`${state.lives}`, 40, 705);

      for (let l = 0; l < state.lives - 1; l++) {
        drawPixelMatrix(ctx, SPRITE_PLAYER, 60 + l * 32, 692, 1.6, '#00ff66');
      }

      // Badge d'armement du canon
      const cannonLabel =
        state.cannonLevel === 3
          ? 'CANON : ÉLITE (RAPIDE)'
          : state.cannonLevel === 2
          ? 'CANON : DOUBLE LASER'
          : 'CANON : STANDARD';
      ctx.fillStyle = state.cannonLevel > 1 ? '#00f0ff' : '#888888';
      ctx.fillText(cannonLabel, CANVAS_WIDTH - 240, 705);

      // Message d'amélioration temporaire
      if (powerUpMessage) {
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(powerUpMessage, CANVAS_WIDTH / 2, 120);
        ctx.textAlign = 'left';
      }

      // Écrans d'état READY / GAME OVER
      if (state.status === 'ready') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff66';
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, 280);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText('* APPUYEZ SUR ESPACE POUR JOUER *', CANVAS_WIDTH / 2, 340);

        ctx.fillStyle = '#ff2d75';
        ctx.fillText('CALMAR ROSE   = 30 PTS', CANVAS_WIDTH / 2, 400);
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('CRABE CYAN    = 20 PTS', CANVAS_WIDTH / 2, 430);
        ctx.fillStyle = '#ffd000';
        ctx.fillText('POULPE JAUNE  = 10 PTS', CANVAS_WIDTH / 2, 460);
        ctx.fillStyle = '#ff2222';
        ctx.fillText('SOUCOUPE UFO  = ??? PTS', CANVAS_WIDTH / 2, 490);

        ctx.textAlign = 'left';
      } else if (state.status === 'game_over') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff2222';
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 320);

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px "Courier New", monospace';
        ctx.fillText(`SCORE FINAL : ${state.score} PTS`, CANVAS_WIDTH / 2, 370);
        ctx.fillText(`VAGUE ATTEINTE : VAGUE ${state.wave}`, CANVAS_WIDTH / 2, 405);

        ctx.textAlign = 'left';
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      spaceInvadersAudio.stopUfoSound();
    };
  }, [onGameOver, initWave, powerUpMessage]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
        userSelect: 'none',
      }}
    >
      {/* Écran Canvas Borne Arcade */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          background: '#050508',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 0 35px rgba(0, 255, 102, 0.25), inset 0 0 30px rgba(0, 0, 0, 0.9)',
          border: '3px solid #112211',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            imageRendering: 'pixelated',
          }}
        />

        {/* Scanlines CRT rétro */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)',
            backgroundSize: '100% 4px',
            pointerEvents: 'none',
            opacity: 0.75,
          }}
        />

        {/* Effet lueur de phosphore aux coins de l'écran */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 60px rgba(0, 255, 102, 0.12)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Boutons Virtuels Rétro pour Tactile / Mobile */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginTop: '14px',
          padding: '0 10px',
          gap: '12px',
        }}
      >
        {/* Contrôles directionnels */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              stateRef.current.keys.left = true;
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stateRef.current.keys.left = false;
            }}
            onMouseDown={() => (stateRef.current.keys.left = true)}
            onMouseUp={() => (stateRef.current.keys.left = false)}
            style={{
              width: '64px',
              height: '52px',
              borderRadius: '10px',
              background: 'rgba(0, 255, 102, 0.15)',
              border: '2px solid #00ff66',
              color: '#00ff66',
              fontSize: '22px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(0, 255, 102, 0.3)',
            }}
          >
            ◄
          </button>
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              stateRef.current.keys.right = true;
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stateRef.current.keys.right = false;
            }}
            onMouseDown={() => (stateRef.current.keys.right = true)}
            onMouseUp={() => (stateRef.current.keys.right = false)}
            style={{
              width: '64px',
              height: '52px',
              borderRadius: '10px',
              background: 'rgba(0, 255, 102, 0.15)',
              border: '2px solid #00ff66',
              color: '#00ff66',
              fontSize: '22px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(0, 255, 102, 0.3)',
            }}
          >
            ►
          </button>
        </div>

        {/* Bouton Démarrer si prêt */}
        {gameStatus === 'ready' && (
          <button
            type="button"
            onClick={startGame}
            style={{
              flex: 1,
              height: '52px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '2px solid #34d399',
              color: '#ffffff',
              fontSize: '15px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.5)',
            }}
          >
            JOUER
          </button>
        )}

        {/* Bouton de Tir Rétro */}
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            stateRef.current.keys.fire = true;
            if (stateRef.current.status === 'ready') startGame();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stateRef.current.keys.fire = false;
          }}
          onMouseDown={() => {
            stateRef.current.keys.fire = true;
            if (stateRef.current.status === 'ready') startGame();
          }}
          onMouseUp={() => (stateRef.current.keys.fire = false)}
          style={{
            minWidth: '110px',
            height: '52px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            border: '2px solid #f87171',
            color: '#ffffff',
            fontSize: '16px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(239, 68, 68, 0.5)',
          }}
        >
          FIRE 🔥
        </button>
      </div>
    </div>
  );
};
