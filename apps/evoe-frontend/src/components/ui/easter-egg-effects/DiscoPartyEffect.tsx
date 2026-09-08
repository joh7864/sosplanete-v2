import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { playDiscoPartySound } from '../../../utils/easterEggAudio';

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

export const DiscoPartyEffect: React.FC<DiscoPartyEffectProps> = ({
  duration = 4000,
  onComplete,
}) => {
  useEffect(() => {
    playDiscoPartySound();
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  // Confettis de fête multicolores
  const confettis: ConfettiPiece[] = useMemo(() => {
    const colors = ['#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#fbbf24', '#f97316'];
    return Array.from({ length: 65 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // vw
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 6,
      duration: Math.random() * 2.2 + 1.8,
      delay: Math.random() * 1.2,
      rotation: Math.random() * 720 - 360,
    }));
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.5) 0%, rgba(2, 6, 23, 0.85) 100%)',
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
        {['#ec4899', '#3b82f6', '#10b981', '#f59e0b'].map((col, idx) => (
          <motion.div
            key={idx}
            animate={{
              rotate: [idx * 90 - 45, idx * 90 + 45, idx * 90 - 45],
              opacity: [0.25, 0.65, 0.25],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '80px',
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

      {/* 2. Boule à facettes miroitante (Mirror Disco Ball) */}
      <motion.div
        initial={{ y: -200 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 100 }}
        style={{
          position: 'absolute',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 15,
        }}
      >
        {/* Fil de suspension métallique */}
        <div style={{ width: '2px', height: '50px', background: 'linear-gradient(to bottom, #94a3b8, #cbd5e1)' }} />

        {/* Boule disco avec rotation et reflets facettés */}
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 30%, #475569 80%, #0f172a 100%)',
            boxShadow: '0 0 45px rgba(255, 255, 255, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.5)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
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

      {/* 4. Bannière HUD Disco Party */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', damping: 12 }}
        style={{
          position: 'absolute',
          top: '32%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '18px 40px',
          background: 'rgba(20, 10, 35, 0.92)',
          border: '2px solid #ec4899',
          borderRadius: '24px',
          boxShadow: '0 0 50px rgba(236, 72, 153, 0.6), inset 0 0 25px rgba(59, 130, 246, 0.3)',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
          zIndex: 20,
        }}
      >
        <div style={{ color: '#f472b6', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase' }}>
          🪩 AMBIANCE INTERGALACTIQUE 🪩
        </div>
        <div
          style={{
            fontSize: '1.9rem',
            fontWeight: 900,
            color: '#ffffff',
            textShadow: '0 0 20px #ec4899, 0 0 40px #8b5cf6',
            letterSpacing: '1px',
          }}
        >
          DISCO FEVER ORBITALE !
        </div>
        <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
          Fréquence festive activée sur toute la station spatiale
        </div>
      </motion.div>
    </div>
  );
};
