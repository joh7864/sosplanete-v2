import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { playRetroSynthwaveSound } from '../../../utils/easterEggAudio';

interface CrtRetroSynthwaveEffectProps {
  duration?: number;
  onComplete?: () => void;
}

export const CrtRetroSynthwaveEffect: React.FC<CrtRetroSynthwaveEffectProps> = ({
  duration = 3500,
  onComplete,
}) => {
  useEffect(() => {
    playRetroSynthwaveSound();
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* 1. Lignes de balayage CRT horizontales (Scanlines) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.28) 0px, rgba(0, 0, 0, 0.28) 2px, transparent 2px, transparent 4px)',
          opacity: 0.85,
          zIndex: 10,
        }}
      />

      {/* 2. Vignette incurvée tube cathodique & lueur phosphore */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 55%, rgba(0, 0, 0, 0.75) 100%)',
          boxShadow: 'inset 0 0 100px rgba(255, 0, 128, 0.25), inset 0 0 80px rgba(0, 255, 255, 0.25)',
          zIndex: 11,
        }}
      />

      {/* 3. Aberration chromatique & flash de scintillement rétro */}
      <motion.div
        animate={{
          opacity: [0.08, 0.18, 0.08, 0.22, 0.08],
        }}
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.35), rgba(0, 255, 255, 0.35))',
          mixBlendMode: 'screen',
          zIndex: 12,
        }}
      />

      {/* 4. Grille de sol 3D Synthwave rétro au bas de l'écran */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '-20%',
          width: '140%',
          height: '42%',
          perspective: '400px',
          overflow: 'hidden',
          zIndex: 8,
        }}
      >
        <motion.div
          animate={{
            backgroundPositionY: ['0px', '40px'],
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '100%',
            height: '200%',
            transform: 'rotateX(68deg) translateY(-20%)',
            backgroundImage: `
              linear-gradient(to right, rgba(255, 0, 128, 0.7) 2px, transparent 2px),
              linear-gradient(to bottom, rgba(0, 255, 255, 0.7) 2px, transparent 2px)
            `,
            backgroundSize: '40px 40px',
            boxShadow: '0 0 60px rgba(255, 0, 128, 0.6)',
          }}
        />
      </div>

      {/* 5. Bannière Arc-en-Ciel Néon 80s "KONAMI ARCADE" */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0, y: -80, rotate: -4 }}
        animate={{ scale: [0.3, 1.15, 1], opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.5, type: 'spring', damping: 10 }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          padding: '20px 40px',
          background: 'linear-gradient(135deg, rgba(30, 10, 45, 0.95), rgba(10, 25, 50, 0.95))',
          border: '3px solid #ff007f',
          borderRadius: '24px',
          boxShadow: '0 0 50px #ff007f, inset 0 0 25px #00ffff',
          textAlign: 'center',
          zIndex: 20,
        }}
      >
        <motion.div
          animate={{ color: ['#ff007f', '#00ffff', '#ffe600', '#ff007f'] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            fontSize: '0.85rem',
            fontWeight: 900,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
          }}
        >
          ▲ ▲ ▼ ▼ ◄ ► ◄ ► B A
        </motion.div>

        <h1
          style={{
            margin: 0,
            fontSize: '2.4rem',
            fontWeight: 900,
            color: '#ffffff',
            fontStyle: 'italic',
            letterSpacing: '2px',
            textShadow: '3px 3px 0px #ff007f, -3px -3px 0px #00ffff, 0 0 30px #ffffff',
            textTransform: 'uppercase',
          }}
        >
          RETRO LEVEL UP !
        </h1>

        <div
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#00ffff',
            letterSpacing: '1px',
            textShadow: '0 0 10px #00ffff',
          }}
        >
          Mode Synthwave 1980 Débloqué
        </div>
      </motion.div>
    </div>
  );
};
