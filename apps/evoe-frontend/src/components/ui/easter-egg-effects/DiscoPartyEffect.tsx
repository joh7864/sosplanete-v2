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
const STATIC_CONFETTIS: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
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
  const glows = colors.map((c) => `0 0 18px ${c}99, inset 0 0 12px ${c}66`);
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
        backgroundImage: 'url(/images/easter-eggs/disco_space_bay.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Voile sombre d'ambiance néon pour contraster les danseurs et dalles */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 40%, rgba(20, 10, 40, 0.45) 0%, rgba(2, 6, 23, 0.75) 100%)',
        }}
      />

      {/* 1. Projecteurs de lumière volumétriques (Spotlight Laser Beams) */}
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
        {['#ec4899', '#38bdf8', '#a855f7', '#fbbf24', '#06b6d4'].map((col, idx) => (
          <motion.div
            key={idx}
            animate={{
              rotate: [idx * 60 - 35, idx * 60 + 35, idx * 60 - 35],
              opacity: [0.25, 0.6, 0.25],
            }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.4 }}
            style={{
              position: 'absolute',
              top: '40px',
              left: '50%',
              width: '140px',
              height: '110vh',
              background: `linear-gradient(to bottom, ${col}aa 0%, ${col}22 50%, transparent 90%)`,
              transformOrigin: 'top center',
              filter: 'blur(14px)',
              mixBlendMode: 'screen',
            }}
          />
        ))}
      </div>

      {/* 2. Boule disco 3D en rotation avec facettes miroitantes */}
      <div
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
        <div style={{ width: '2px', height: '35px', background: 'linear-gradient(to bottom, #94a3b8, #ffffff)' }} />
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'relative',
            width: '92px',
            height: '92px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 30%, #475569 80%, #0f172a 100%)',
            boxShadow: '0 0 50px rgba(255, 255, 255, 0.85), 0 0 25px rgba(236, 72, 153, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.6)',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            overflow: 'hidden',
          }}
        >
          {/* Facettes miroir animées */}
          <motion.div
            animate={{ backgroundPosition: ['0px 0px', '92px 46px'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.85) 15%, transparent 20%), linear-gradient(0deg, transparent 48%, rgba(255,255,255,0.3) 50%, transparent 52%), linear-gradient(90deg, transparent 48%, rgba(255,255,255,0.3) 50%, transparent 52%)',
              backgroundSize: '16px 16px',
            }}
          />
        </motion.div>
      </div>

      {/* 3. Pluie de confettis festifs */}
      {confettis.map((c) => (
        <motion.div
          key={c.id}
          initial={{ y: -20, x: `${c.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', rotate: c.rotation, opacity: [1, 1, 0.8] }}
          transition={{ duration: c.duration, delay: c.delay, ease: 'linear', repeat: Infinity }}
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

      {/* 4. Piste de Danse Néon 3D Centrée (Perspective & Dalles Glassmorphism) */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%) perspective(850px) rotateX(46deg)',
          width: '920px',
          maxWidth: '105vw',
          height: '240px',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '8px',
          zIndex: 8,
        }}
      >
        {danceFloorTiles.map((tile, i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: tile.colors,
              boxShadow: tile.glows,
              opacity: [0.75, 1, 0.75],
            }}
            transition={{
              duration: 1.15,
              repeat: Infinity,
              delay: tile.delay,
              ease: 'easeInOut',
            }}
            style={{
              borderRadius: '8px',
              border: '1.5px solid rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(4px)',
            }}
          />
        ))}
      </div>

      {/* 5. Danseurs sur la Piste : Clubbers Option B & Gribouille au centre */}
      <div
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '880px',
          height: '240px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 10,
        }}
      >
        {/* Danseurs Gauche (Duo Clubbing) */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotateZ: [-3.5, 3.5, -3.5],
            scaleY: [1, 0.95, 1],
          }}
          transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Halo lumineux sous les pieds */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              width: '150px',
              height: '22px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, transparent 75%)',
              filter: 'blur(8px)',
            }}
          />
          <img
            src="/images/easter-eggs/disco_dancers_left.png"
            alt="Danseurs Disco Gauche"
            style={{
              width: '240px',
              height: 'auto',
              maxHeight: '230px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 24px rgba(236, 72, 153, 0.75))',
            }}
          />
        </motion.div>

        {/* Danseur Centre : Gribouille debout sur ses pieds, grooves funky à 104 BPM */}
        <motion.div
          animate={{
            y: [0, -22, 0],
            rotateZ: [-5.5, 5.5, -5.5],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 0.577, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 14,
            marginBottom: '10px',
          }}
        >
          {/* Halo néon dynamique sous Gribouille */}
          <motion.div
            animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 0.577, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              bottom: '-8px',
              width: '130px',
              height: '26px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.9) 0%, transparent 75%)',
              filter: 'blur(10px)',
            }}
          />
          <img
            src="/images/easter-eggs/gribouille_dancing.png"
            alt="Gribouille Danseur Disco"
            style={{
              width: '155px',
              height: 'auto',
              maxHeight: '215px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 14px 28px rgba(6, 182, 212, 0.85)) drop-shadow(0 0 15px rgba(236, 72, 153, 0.6))',
            }}
          />
        </motion.div>

        {/* Danseurs Droite (Duo Clubbing) */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotateZ: [3.5, -3.5, 3.5],
            scaleY: [1, 0.95, 1],
          }}
          transition={{ duration: 1.15, delay: 0.28, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Halo lumineux sous les pieds */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              width: '150px',
              height: '22px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, transparent 75%)',
              filter: 'blur(8px)',
            }}
          />
          <img
            src="/images/easter-eggs/disco_dancers_right.png"
            alt="Danseurs Disco Droite"
            style={{
              width: '240px',
              height: 'auto',
              maxHeight: '230px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 24px rgba(168, 85, 247, 0.75))',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
