import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { playAntigravitySound } from '../../../utils/easterEggAudio';

interface AntigravityEffectProps {
  duration?: number;
  onComplete?: () => void;
}

interface FloatingBubble {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  color: string;
}

export const AntigravityEffect: React.FC<AntigravityEffectProps> = ({
  duration = 4000,
  onComplete,
}) => {
  useEffect(() => {
    playAntigravitySound();
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  // Bulles et particules gravitationnelles ascendantes
  const bubbles: FloatingBubble[] = useMemo(() => {
    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#2dd4bf', '#ffffff'];
    return Array.from({ length: 42 }, (_, i) => ({
      id: i,
      x: Math.random() * 96 + 2, // en vw
      size: Math.random() * 26 + 10,
      duration: Math.random() * 2.5 + 2.0,
      delay: Math.random() * 1.5,
      driftX: (Math.random() - 0.5) * 80,
      color: colors[Math.floor(Math.random() * colors.length)],
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
        background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.15) 0%, rgba(30, 27, 75, 0.45) 100%)',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Onde de distortion gravitationnelle */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0.8 }}
        animate={{ scale: 4.5, opacity: 0 }}
        transition={{ duration: 2.2, ease: 'easeOut', repeat: 1 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          border: '3px solid #38bdf8',
          boxShadow: '0 0 80px #818cf8, inset 0 0 50px #38bdf8',
        }}
      />

      {/* Bulles d'antigravité montant vers le ciel */}
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          initial={{
            bottom: '-40px',
            left: `${b.x}vw`,
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            bottom: '105vh',
            x: b.driftX,
            opacity: [0, 0.9, 0.9, 0],
            scale: [0.5, 1.2, 1],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: `${b.size}px`,
            height: `${b.size}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${b.color} 50%, rgba(0, 0, 0, 0) 100%)`,
            boxShadow: `0 0 16px ${b.color}, inset 0 0 8px rgba(255, 255, 255, 0.7)`,
          }}
        />
      ))}

      {/* Bannière HUD Zero-G */}
      <motion.div
        initial={{ y: -60, opacity: 0, scale: 0.85 }}
        animate={{ y: [0, -8, 0], opacity: 1, scale: 1 }}
        transition={{
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.4 },
        }}
        style={{
          position: 'absolute',
          top: '14%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          padding: '16px 36px',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '2px solid #38bdf8',
          borderRadius: '22px',
          boxShadow: '0 0 45px rgba(56, 189, 248, 0.5), inset 0 0 20px rgba(129, 140, 248, 0.25)',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
        }}
      >
        <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
          ⚡ ANOMALIE GRAVITATIONNELLE DÉTECTÉE ⚡
        </div>
        <div style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, textShadow: '0 0 16px #38bdf8' }}>
          APESANTEUR ZÉRO-G ACTIVÉE
        </div>
        <div style={{ color: '#cbd5e1', fontSize: '0.86rem' }}>
          Générateur de pesanteur désactivé // Lévitation orbitale
        </div>
      </motion.div>
    </div>
  );
};
