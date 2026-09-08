import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { playRocketThrusterSound } from '../../../utils/easterEggAudio';

interface RocketThrusterEffectProps {
  duration?: number;
  onComplete?: () => void;
}

interface ParticleFlame {
  id: number;
  x: number;
  yEnd: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export const RocketThrusterEffect: React.FC<RocketThrusterEffectProps> = ({
  duration = 3500,
  onComplete,
}) => {
  useEffect(() => {
    playRocketThrusterSound();
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  // Jet de flammes et étincelles jaillissant sous le logo
  const flames: ParticleFlame[] = useMemo(() => {
    const colors = ['#f59e0b', '#ef4444', '#f97316', '#fbbf24', '#38bdf8', '#ffffff'];
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 220, // Dispersion horizontale sous le logo
      yEnd: Math.random() * 500 + 200,
      size: Math.random() * 18 + 8,
      duration: Math.random() * 0.8 + 0.5,
      delay: Math.random() * 0.6,
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
      }}
    >
      {/* Secousse de caméra / Screen Shake */}
      <motion.div
        animate={{
          x: [0, -6, 5, -4, 4, -2, 0],
          y: [0, 4, -4, 3, -2, 1, 0],
        }}
        transition={{ duration: 0.18, repeat: Infinity }}
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        {/* Lueur d'embrasement orange et cyan en haut de l'écran */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '240px',
            background: 'radial-gradient(ellipse at top, rgba(249, 115, 22, 0.75) 0%, rgba(56, 189, 248, 0.35) 45%, rgba(0, 0, 0, 0) 80%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Panache de propulsion / Flammes de réacteur */}
        <div
          style={{
            position: 'absolute',
            top: '70px', // Positionné juste sous le logo dans le header
            left: '50%',
            width: 0,
            height: 0,
          }}
        >
          {flames.map((f) => (
            <motion.div
              key={f.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
              animate={{
                x: f.x * 1.5,
                y: f.yEnd,
                opacity: [1, 0.8, 0],
                scale: [0.4, 1.4, 0.2],
              }}
              transition={{
                duration: f.duration,
                delay: f.delay,
                repeat: Infinity,
                ease: 'easeIn',
              }}
              style={{
                position: 'absolute',
                width: `${f.size}px`,
                height: `${f.size * 2.2}px`,
                borderRadius: '50%',
                background: `radial-gradient(circle at center, #ffffff 10%, ${f.color} 70%, rgba(0,0,0,0) 100%)`,
                boxShadow: `0 0 20px ${f.color}`,
              }}
            />
          ))}
        </div>

        {/* Bannière HUD Propulsion */}
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          style={{
            position: 'absolute',
            top: '32%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 36px',
            background: 'rgba(20, 10, 5, 0.92)',
            border: '2px solid #f97316',
            borderRadius: '22px',
            boxShadow: '0 0 50px rgba(249, 115, 22, 0.6), inset 0 0 25px rgba(245, 158, 11, 0.3)',
            backdropFilter: 'blur(16px)',
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
            🔥 COMBUSTION SUB-ORBITALE ENCLENCHÉE 🔥
          </div>
          <div style={{ color: '#ffffff', fontSize: '1.6rem', fontWeight: 900, textShadow: '0 0 16px #f97316' }}>
            PROPULSION DES RÉACTEURS ENGAGÉE !
          </div>
          <div style={{ color: '#fed7aa', fontSize: '0.88rem' }}>
            Vaisseau EVOE propulsé à pleine poussée plasmique
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
