import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { playTemporal1985Sound } from '../../../utils/easterEggAudio';

interface Temporal1985EffectProps {
  duration?: number;
  onComplete?: () => void;
}

export const Temporal1985Effect: React.FC<Temporal1985EffectProps> = ({
  duration = 3500,
  onComplete,
}) => {
  const [speed, setSpeed] = useState(65);

  useEffect(() => {
    playTemporal1985Sound();

    // Compteur de vitesse 65 -> 88 MPH
    const interval = setInterval(() => {
      setSpeed((prev) => {
        if (prev >= 88) {
          clearInterval(interval);
          return 88;
        }
        return prev + 1;
      });
    }, 45);

    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [duration, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, rgba(30, 58, 138, 0.45) 0%, rgba(2, 6, 23, 0.85) 100%)',
      }}
    >
      {/* 1. Lignes de distorsion supraluminique (Warp Speed) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: 3.5, opacity: [0, 0.9, 0] }}
            transition={{
              duration: 1.2,
              delay: (i * 0.05) % 0.8,
              repeat: Infinity,
              ease: 'easeIn',
            }}
            style={{
              position: 'absolute',
              width: '4px',
              height: '140px',
              background: 'linear-gradient(to bottom, #ffffff, #38bdf8, transparent)',
              transform: `rotate(${i * 15}deg) translateY(-200px)`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* 2. Traînées de feu DeLorean sur le bas de l'écran */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '75%',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {/* Voie gauche */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.7], scaleY: [0.9, 1.2, 0.95] }}
          transition={{ duration: 0.25, repeat: Infinity }}
          style={{
            width: '140px',
            height: '24px',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, transparent, #ff4500, #ffd700, #ffffff)',
            boxShadow: '0 0 35px #ff4500, 0 0 70px #ff8c00',
            filter: 'blur(2px)',
          }}
        />
        {/* Voie droite */}
        <motion.div
          animate={{ opacity: [0.7, 1, 0.6], scaleY: [0.95, 1.2, 0.9] }}
          transition={{ duration: 0.28, repeat: Infinity }}
          style={{
            width: '140px',
            height: '24px',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, #ffffff, #ffd700, #ff4500, transparent)',
            boxShadow: '0 0 35px #ff4500, 0 0 70px #ff8c00',
            filter: 'blur(2px)',
          }}
        />
      </div>

      {/* 3. Arcs électriques temporels (Lightning Arcs) */}
      <motion.div
        animate={{ opacity: [0, 0.85, 0, 0.95, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.35) 0%, transparent 70%)',
          boxShadow: 'inset 0 0 80px rgba(56, 189, 248, 0.5)',
          mixBlendMode: 'screen',
        }}
      />

      {/* 4. Compteur Digital & Bannière Temporelle 1985 */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
        style={{
          position: 'absolute',
          top: '22%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          padding: '24px 44px',
          background: 'rgba(10, 15, 30, 0.94)',
          border: '2px solid #38bdf8',
          borderRadius: '26px',
          boxShadow: '0 0 60px rgba(56, 189, 248, 0.6), inset 0 0 30px rgba(245, 158, 11, 0.25)',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
        }}
      >
        <div style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase' }}>
          ⚡ CONDENSATEUR DE FLUX : 1.21 GIGAWATTS ⚡
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '3.6rem',
              fontWeight: 900,
              color: speed >= 88 ? '#fbbf24' : '#38bdf8',
              textShadow: speed >= 88 ? '0 0 25px #f59e0b' : '0 0 20px #38bdf8',
              lineHeight: 1,
            }}
          >
            {speed}
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '1px' }}>
            MPH
          </span>
        </div>

        <div style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: 900 }}>
          {speed >= 88 ? 'SAUT TEMPOREL VERS 1985 RÉUSSI !' : 'ACCÉLÉRATION TEMPORELLE EN COURS...'}
        </div>
      </motion.div>
    </div>
  );
};
