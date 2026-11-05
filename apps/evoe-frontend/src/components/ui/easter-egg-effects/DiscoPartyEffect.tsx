import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { startDiscoGroove } from '../../../utils/discoGrooveAudio';

interface DiscoPartyEffectProps {
  duration?: number;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
}

interface DanceTile {
  colors: string[];
  glows: string[];
  delay: number;
}

const CONFETTI_COLORS = ['#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#fbbf24', '#f97316'];
const STATIC_CONFETTIS: ConfettiPiece[] = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  x: (i * 37 + 13) % 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + ((i * 7) % 11),
  duration: 1.8 + ((i * 3) % 20) / 10,
  delay: ((i * 5) % 15) / 10,
  rotation: ((i * 73) % 720) - 360,
}));

const TILE_PALETTES = [
  ['#ec4899', '#06b6d4', '#8b5cf6', '#ec4899'],
  ['#06b6d4', '#10b981', '#fbbf24', '#06b6d4'],
  ['#8b5cf6', '#ec4899', '#06b6d4', '#8b5cf6'],
  ['#10b981', '#f59e0b', '#ec4899', '#10b981'],
  ['#f59e0b', '#06b6d4', '#10b981', '#f59e0b'],
];

const STATIC_DANCE_FLOOR_TILES: DanceTile[] = Array.from({ length: 24 }, (_, i) => {
  const colors = TILE_PALETTES[i % TILE_PALETTES.length];
  const glows = colors.map((c) => `0 0 16px ${c}99, inset 0 0 10px ${c}66`);
  return {
    colors,
    glows,
    delay: (i % 8) * 0.08 + Math.floor(i / 8) * 0.12,
  };
});

export const DiscoPartyEffect: React.FC<DiscoPartyEffectProps> = ({
  duration,
  onComplete,
}) => {
  // Lancement du groove disco funky Stayin' Alive (104 BPM)
  useEffect(() => {
    const audioController = startDiscoGroove();
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (duration) {
      timer = setTimeout(() => {
        onComplete?.();
      }, duration);
    }
    return () => {
      audioController.stop();
      if (timer) clearTimeout(timer);
    };
  }, [duration, onComplete]);

  const confettis = STATIC_CONFETTIS;
  const danceFloorTiles = STATIC_DANCE_FLOOR_TILES;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, rgba(30, 10, 50, 0.65) 0%, rgba(2, 6, 23, 0.92) 85%)',
      }}
    >
      {/* 1. Projecteurs de lumière rotatifs (Spotlight Beams) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '100%',
        }}
      >
        {['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map((col, idx) => (
          <motion.div
            key={idx}
            animate={{
              rotate: [idx * 72 - 40, idx * 72 + 40, idx * 72 - 40],
              opacity: [0.25, 0.65, 0.25],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '70px',
              left: '50%',
              width: '180px',
              height: '120vh',
              background: `linear-gradient(to bottom, ${col}99 0%, ${col}22 50%, transparent 90%)`,
              transformOrigin: 'top center',
              filter: 'blur(16px)',
              mixBlendMode: 'screen',
            }}
          />
        ))}
      </div>

      {/* 2. Boule à facettes miroitante (Mirror Disco Ball au sommet) */}
      <motion.div
        initial={{ y: -200 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 100 }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 15,
        }}
      >
        {/* Fil de suspension métallique */}
        <div style={{ width: '2px', height: '40px', background: 'linear-gradient(to bottom, #94a3b8, #cbd5e1)' }} />

        {/* Boule disco avec rotation et reflets facettés */}
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'relative',
            width: '95px',
            height: '95px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 30%, #475569 80%, #0f172a 100%)',
            boxShadow: '0 0 50px rgba(255, 255, 255, 0.85), inset 0 0 20px rgba(255, 255, 255, 0.6)',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            overflow: 'hidden',
          }}
        >
          {/* Grille de facettes miroitantes */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.35) 0px, transparent 1px, transparent 8px),
                repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.35) 0px, transparent 1px, transparent 8px)
              `,
            }}
          />
        </motion.div>
      </motion.div>

      {/* 3. Pluie de confettis festifs */}
      {confettis.map((c) => (
        <motion.div
          key={c.id}
          initial={{ y: -30, x: `${c.x}vw`, opacity: 0, rotate: 0 }}
          animate={{
            y: '105vh',
            opacity: [0, 1, 1, 0],
            rotate: c.rotation,
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: `${c.size}px`,
            height: `${c.size * 0.7}px`,
            background: c.color,
            borderRadius: '2px',
            boxShadow: `0 0 8px ${c.color}`,
          }}
        />
      ))}

      {/* 4. Piste de Danse Néon Rétro-Futuriste (Perspective 3D) */}
      <div
        style={{
          position: 'absolute',
          bottom: '-35px',
          left: '50%',
          transform: 'translateX(-50%) perspective(500px) rotateX(55deg)',
          width: '880px',
          maxWidth: '110vw',
          height: '210px',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '7px',
          zIndex: 8,
        }}
      >
        {danceFloorTiles.map((tile, i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: tile.colors,
              boxShadow: tile.glows,
              opacity: [0.65, 0.95, 0.65],
            }}
            transition={{
              duration: 1.15,
              repeat: Infinity,
              delay: tile.delay,
              ease: 'easeInOut',
            }}
            style={{
              borderRadius: '6px',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
            }}
          />
        ))}
      </div>

      {/* 5. Danseurs sur la Piste : Gribouille en roi du dancefloor + Astronautes funk */}
      <div
        style={{
          position: 'absolute',
          bottom: '25px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '680px',
          height: '190px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          zIndex: 10,
        }}
      >
        {/* Danseur Gauche : Astronaute Funk */}
        <motion.div
          animate={{
            y: [0, -18, 0],
            rotateZ: [-6, 6, -6],
            scaleY: [1, 0.94, 1],
          }}
          transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              width: '80px',
              height: '20px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
          <img
            src="/images/easter-eggs/astronaut_float_1.png"
            alt="Danseur Astronaute 1"
            style={{
              width: '110px',
              height: 'auto',
              filter: 'drop-shadow(0 10px 20px rgba(6, 182, 212, 0.65))',
              transform: 'scaleX(-1)',
            }}
          />
        </motion.div>

        {/* Danseur Centre : Gribouille sur son hoverboard au tempo 104 BPM Stayin' Alive */}
        <motion.div
          animate={{
            y: [0, -26, 0],
            rotateZ: [-7, 7, -7],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 0.577, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 12,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: '-10px',
              width: '130px',
              height: '26px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ec4899 0%, transparent 75%)',
              filter: 'blur(10px)',
            }}
          />
          <img
            src="/images/robot-mascot.png"
            alt="Gribouille Disco King"
            style={{
              width: '150px',
              height: 'auto',
              filter: 'drop-shadow(0 15px 30px rgba(236, 72, 153, 0.8))',
            }}
          />
        </motion.div>

        {/* Danseur Droite : Astronaute Disco Groove */}
        <motion.div
          animate={{
            y: [0, -18, 0],
            rotateZ: [6, -6, 6],
            scaleY: [1, 0.94, 1],
          }}
          transition={{ duration: 1.15, delay: 0.28, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              width: '80px',
              height: '20px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
          <img
            src="/images/easter-eggs/astronaut_float_2.png"
            alt="Danseur Astronaute 2"
            style={{
              width: '110px',
              height: 'auto',
              filter: 'drop-shadow(0 10px 20px rgba(168, 85, 247, 0.65))',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
