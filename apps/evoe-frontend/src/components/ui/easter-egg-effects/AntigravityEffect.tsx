import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { playAntigravitySound } from '../../../utils/easterEggAudio';

interface AntigravityEffectProps {
  duration?: number;
  onComplete?: () => void;
}

interface FloatingDroplet {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  color: string;
}

export const AntigravityEffect: React.FC<AntigravityEffectProps> = ({
  duration,
  onComplete,
}) => {
  useEffect(() => {
    playAntigravitySound();
    if (duration) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  // Bulles et gouttelettes de fluide luminescent flottant en apesanteur organique
  const droplets: FloatingDroplet[] = useMemo(() => {
    const colors = ['#38bdf8', '#818cf8', '#22d3ee', '#34d399', '#ffffff', '#fbbf24'];
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 92 + 4, // en vw
      y: Math.random() * 85 + 5, // en vh
      size: Math.random() * 18 + 6,
      duration: Math.random() * 4 + 5, // Dérive lente et gracieuse (5 à 9s)
      delay: Math.random() * 2,
      driftX: (Math.random() - 0.5) * 60,
      driftY: (Math.random() - 0.5) * 70,
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
      {/* 1. Décor Vaisseau Spatial 2070 - Passerelle Panoramique avec Vue Orbitaire */}
      <motion.div
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{
          scale: [1.02, 1.05, 1.02],
          x: [0, 6, -6, 0],
          y: [0, -4, 4, 0],
          opacity: 1,
        }}
        transition={{
          scale: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
          x: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 16, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 1.2, ease: 'easeOut' },
        }}
        style={{
          position: 'absolute',
          inset: '-20px',
          backgroundImage: "url('/images/easter-eggs/zerog_bridge_bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          filter: 'brightness(0.92) contrast(1.08)',
        }}
      />

      {/* 2. Filtre d'ambiance cockpit 2070 & Vignettage de concentration centrale */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.45) 0%, rgba(2, 6, 23, 0.78) 70%, rgba(2, 6, 23, 0.94) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 3. Onde de choc initiale de rupture gravitationnelle (distorsion zéro-G) */}
      <motion.div
        initial={{ scale: 0.1, opacity: 0.9 }}
        animate={{ scale: 4.2, opacity: 0 }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          border: '3px solid #38bdf8',
          boxShadow: '0 0 90px #38bdf8, inset 0 0 60px #818cf8',
          pointerEvents: 'none',
        }}
      />

      {/* 4. Équipage de Spationautes 2070 en Apesanteur */}

      {/* --- Spationaute 1 : Commandant (Côté Gauche) --- */}
      <motion.div
        initial={{ x: -140, y: 30, opacity: 0, rotate: -15 }}
        animate={{
          x: [0, 22, -14, 16, 0],
          y: [0, -32, 12, -22, 0],
          rotate: [-4, 6, -2, 5, -4],
          scale: [1, 1.03, 0.98, 1.02, 1],
          opacity: 1,
        }}
        transition={{
          x: { duration: 11, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 13, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 1.4 },
        }}
        style={{
          position: 'absolute',
          left: 'clamp(10px, 3.5vw, 60px)',
          top: 'clamp(18%, 22vh, 32%)',
          width: 'clamp(210px, 24vw, 360px)',
          zIndex: 10,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          filter: 'drop-shadow(0 0 25px rgba(56, 189, 248, 0.6))',
        }}
      >
        <img
          src="/images/easter-eggs/astronaut_1.jpg"
          alt="Commandant 2070 en apesanteur"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
        {/* Tag HUD télémétrie astronaute */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.6)',
            borderRadius: '9999px',
            padding: '2px 10px',
            fontSize: '10px',
            fontWeight: 800,
            color: '#38bdf8',
            letterSpacing: '1px',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          COMMANDER // ZERO-G
        </div>
      </motion.div>

      {/* --- Spationaute 2 : Spécialiste EVA (Côté Droit Supérieur) --- */}
      <motion.div
        initial={{ x: 140, y: -20, opacity: 0, rotate: 12 }}
        animate={{
          x: [0, -24, 12, -18, 0],
          y: [0, 26, -18, 14, 0],
          rotate: [3, -5, 4, -4, 3],
          scale: [1, 0.98, 1.03, 1],
          opacity: 1,
        }}
        transition={{
          x: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 8.5, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 1.5, delay: 0.2 },
        }}
        style={{
          position: 'absolute',
          right: 'clamp(10px, 2.5vw, 50px)',
          top: 'clamp(16%, 20vh, 28%)',
          width: 'clamp(210px, 25vw, 380px)',
          zIndex: 10,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          filter: 'drop-shadow(0 0 25px rgba(249, 115, 22, 0.45)) drop-shadow(0 0 18px rgba(56, 189, 248, 0.45))',
        }}
      >
        <img
          src="/images/easter-eggs/astronaut_2.jpg"
          alt="Spécialiste EVA 2070 flottant en apesanteur"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
        {/* Tag HUD télémétrie */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(249, 115, 22, 0.6)',
            borderRadius: '9999px',
            padding: '2px 10px',
            fontSize: '10px',
            fontWeight: 800,
            color: '#fb923c',
            letterSpacing: '1px',
            boxShadow: '0 0 12px rgba(249, 115, 22, 0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          EVA SPECIALIST // MICRO-G
        </div>
      </motion.div>

      {/* --- Spationaute 3 : Ingénieur Télémétrie avec Pad Holographique (Bas Droit) --- */}
      <motion.div
        initial={{ y: 120, opacity: 0, rotate: -8 }}
        animate={{
          x: [0, 16, -12, 8, 0],
          y: [0, -22, 16, -10, 0],
          rotate: [-3, 4, -4, 2, -3],
          scale: [1, 1.02, 0.99, 1],
          opacity: 1,
        }}
        transition={{
          x: { duration: 9.5, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 7.8, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 11, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 8.5, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 1.6, delay: 0.4 },
        }}
        style={{
          position: 'absolute',
          right: 'clamp(20px, 14vw, 220px)',
          bottom: 'clamp(10px, 3vh, 50px)',
          width: 'clamp(170px, 19vw, 290px)',
          zIndex: 9,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          filter: 'drop-shadow(0 0 30px rgba(56, 189, 248, 0.65))',
        }}
      >
        <img
          src="/images/easter-eggs/astronaut_3.jpg"
          alt="Ingénieur 2070 avec pad holographique en apesanteur"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
        {/* Tag HUD télémétrie */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.6)',
            borderRadius: '9999px',
            padding: '2px 10px',
            fontSize: '10px',
            fontWeight: 800,
            color: '#38bdf8',
            letterSpacing: '1px',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          QUANTUM TELEMETRY // 0.00 G
        </div>
      </motion.div>

      {/* 5. Gouttelettes et bulles de fluide gravitationnel flottant en microgravité */}
      {droplets.map((d) => (
        <motion.div
          key={d.id}
          initial={{
            left: `${d.x}vw`,
            top: `${d.y}vh`,
            opacity: 0,
            scale: 0.4,
          }}
          animate={{
            x: [0, d.driftX, -d.driftX * 0.5, 0],
            y: [0, d.driftY, -d.driftY * 0.7, 0],
            opacity: [0, 0.85, 0.85, 0.3],
            scale: [0.4, 1.2, 0.8, 1],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: `${d.size}px`,
            height: `${d.size}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${d.color} 55%, rgba(0, 0, 0, 0) 100%)`,
            boxShadow: `0 0 18px ${d.color}, inset 0 0 8px rgba(255, 255, 255, 0.7)`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* 6. Indicateur HUD Télémétrie Orbitaire 2070 (Coin Supérieur Droit) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.9, x: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '3px',
          padding: '8px 14px',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '12px',
          backdropFilter: 'blur(8px)',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#38bdf8',
          letterSpacing: '1px',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontWeight: 800, color: '#38bdf8' }}>ORBIT // 420 KM</span>
        <span style={{ color: '#22d3ee', fontSize: '10px' }}>GRAVITY : 0.00 G (ZERO-G)</span>
        <span style={{ color: '#94a3b8', fontSize: '9px' }}>STATION : ARCHE 2070</span>
      </motion.div>

      {/* 7. Bannière HUD Majestueuse "APESANTEUR ZÉRO-G ACTIVÉE" */}
      <motion.div
        initial={{ y: -70, opacity: 0, scale: 0.88 }}
        animate={{
          y: [0, -6, 0],
          opacity: 1,
          scale: 1,
        }}
        transition={{
          y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.6, ease: 'easeOut' },
          scale: { duration: 0.5 },
        }}
        style={{
          position: 'absolute',
          top: 'clamp(14px, 4.5vh, 40px)',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          padding: '16px 38px',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '2px solid #38bdf8',
          borderRadius: '24px',
          boxShadow:
            '0 0 50px rgba(56, 189, 248, 0.6), inset 0 0 25px rgba(56, 189, 248, 0.25), 0 20px 40px rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            color: '#38bdf8',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            textShadow: '0 0 12px rgba(56, 189, 248, 0.8)',
          }}
        >
          ⚡ ANOMALIE GRAVITATIONNELLE DÉTECTÉE ⚡
        </div>
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 40%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)',
            fontWeight: 900,
            letterSpacing: '-0.3px',
            filter: 'drop-shadow(0 0 18px rgba(56, 189, 248, 0.7))',
          }}
        >
          APESANTEUR ZÉRO-G ACTIVÉE
        </div>
        <div
          style={{
            color: '#cbd5e1',
            fontSize: '0.86rem',
            fontWeight: 600,
            letterSpacing: '0.3px',
          }}
        >
          Générateur de pesanteur désactivé // Lévitation orbitale de l'équipage
        </div>
      </motion.div>
    </div>
  );
};
