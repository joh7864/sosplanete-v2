import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { playAntigravitySound } from '../../../utils/easterEggAudio';

export interface AntigravityEffectProps {
  duration?: number;
  onComplete?: () => void;
  onClose?: () => void;
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
  onClose,
}) => {
  useEffect(() => {
    playAntigravitySound();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
        onComplete?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (duration) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, onComplete, onClose]);

  // Bulles et gouttelettes de fluide luminescent flottant en apesanteur organique
  const droplets: FloatingDroplet[] = useMemo(() => {
    const colors = ['#38bdf8', '#818cf8', '#22d3ee', '#34d399', '#ffffff', '#fbbf24'];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 92 + 4, // en vw
      y: Math.random() * 85 + 5, // en vh
      size: Math.random() * 14 + 5,
      duration: Math.random() * 4 + 6,
      delay: Math.random() * 2,
      driftX: (Math.random() - 0.5) * 50,
      driftY: (Math.random() - 0.5) * 60,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, []);

  const handleExit = () => {
    onClose?.();
    onComplete?.();
  };

  return (
    <div
      id="antigravity-scene-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* 1. Passerelle 2070 vide avec vue panoramique sur la Terre de nuit */}
      <motion.div
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{
          scale: [1.02, 1.05, 1.02],
          x: [0, 6, -6, 0],
          y: [0, -5, 5, 0],
          opacity: 1,
        }}
        transition={{
          scale: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
          x: { duration: 26, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 1.2, ease: 'easeOut' },
        }}
        style={{
          position: 'absolute',
          inset: '-20px',
          backgroundImage: "url('/images/easter-eggs/zerog_bridge_empty.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          filter: 'brightness(0.92) contrast(1.08)',
        }}
      />

      {/* 2. Filtre de vignettage central pour garantir la lisibilité */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.15) 0%, rgba(2, 6, 23, 0.40) 65%, rgba(2, 6, 23, 0.75) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 3. Balayage lumineux volumétrique simulant la lévitation de l'air */}
      <motion.div
        animate={{
          opacity: [0.15, 0.35, 0.15],
          rotate: [0, 2, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: '-20%',
          left: '20%',
          width: '60vw',
          height: '140vh',
          background:
            'linear-gradient(105deg, transparent 35%, rgba(56, 189, 248, 0.08) 50%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* 4. Onde de choc initiale de rupture gravitationnelle */}
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

      {/* 5. Gouttelettes et bulles de fluide en apesanteur douce */}
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
            boxShadow: `0 0 14px ${d.color}, inset 0 0 6px rgba(255, 255, 255, 0.8)`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* 6. TROIS PERSONNAGES EN APESANTEUR AVEC PERSPECTIVE 3D & PROFONDEUR */}
      {/* Astronaute 1 : Pilote en combinaison bleue/cyan - dérive lente & rapprochement/éloignement */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, x: '-6vw', y: '12vh', rotate: -8 }}
        animate={{
          opacity: 1,
          scale: [0.92, 1.22, 0.68, 0.92],
          x: ['-6vw', '14vw', '3vw', '-6vw'],
          y: ['12vh', '-8vh', '4vh', '12vh'],
          rotate: [-8, 6, -4, -8],
          filter: [
            'drop-shadow(0 0 18px rgba(56, 189, 248, 0.4)) brightness(0.95)',
            'drop-shadow(0 0 28px rgba(56, 189, 248, 0.6)) brightness(1.05)',
            'drop-shadow(0 0 10px rgba(56, 189, 248, 0.25)) brightness(0.88)',
            'drop-shadow(0 0 18px rgba(56, 189, 248, 0.4)) brightness(0.95)',
          ],
          zIndex: [16, 26, 12, 16],
        }}
        transition={{
          opacity: { duration: 1.8, ease: 'easeOut' },
          scale: { duration: 42, repeat: Infinity, ease: 'easeInOut' },
          x: { duration: 42, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 38, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 44, repeat: Infinity, ease: 'easeInOut' },
          filter: { duration: 42, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          position: 'absolute',
          left: '12%',
          top: '38%',
          width: 'clamp(230px, 25vw, 360px)',
          pointerEvents: 'none',
          transformOrigin: 'center center',
        }}
      >
        <img
          src="/images/easter-eggs/astronaut_float_1.png"
          alt="Spationaute en apesanteur 1"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </motion.div>

      {/* Astronaute 2 : Scientifique avec tablette holographique - commence en profondeur et s'avance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.72, x: '8vw', y: '-12vh', rotate: 5 }}
        animate={{
          opacity: 1,
          scale: [0.72, 1.18, 0.86, 0.72],
          x: ['8vw', '-10vw', '2vw', '8vw'],
          y: ['-12vh', '6vh', '-4vh', '-12vh'],
          rotate: [5, -8, 3, 5],
          filter: [
            'drop-shadow(0 0 12px rgba(34, 211, 238, 0.25)) brightness(0.88)',
            'drop-shadow(0 0 30px rgba(34, 211, 238, 0.65)) brightness(1.05)',
            'drop-shadow(0 0 18px rgba(34, 211, 238, 0.35)) brightness(0.95)',
            'drop-shadow(0 0 12px rgba(34, 211, 238, 0.25)) brightness(0.88)',
          ],
          zIndex: [12, 28, 16, 12],
        }}
        transition={{
          opacity: { duration: 2, delay: 0.4, ease: 'easeOut' },
          scale: { duration: 40, repeat: Infinity, ease: 'easeInOut' },
          x: { duration: 40, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 36, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 42, repeat: Infinity, ease: 'easeInOut' },
          filter: { duration: 40, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          position: 'absolute',
          left: '34%',
          top: '14%',
          width: 'clamp(210px, 23vw, 340px)',
          pointerEvents: 'none',
          transformOrigin: 'center center',
        }}
      >
        <img
          src="/images/easter-eggs/astronaut_float_2.png"
          alt="Spationaute en apesanteur 2"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </motion.div>

      {/* Astronaute 3 : Ingénieur en boule apesanteur - premier plan puis dérive lointaine */}
      <motion.div
        initial={{ opacity: 0, scale: 1.15, x: '15vw', y: '4vh', rotate: 14 }}
        animate={{
          opacity: 1,
          scale: [1.15, 0.65, 0.90, 1.15],
          x: ['15vw', '-12vw', '4vw', '15vw'],
          y: ['4vh', '-14vh', '10vh', '4vh'],
          rotate: [14, -18, 8, 14],
          filter: [
            'drop-shadow(0 0 26px rgba(249, 115, 22, 0.55)) brightness(1.05)',
            'drop-shadow(0 0 10px rgba(249, 115, 22, 0.2)) brightness(0.86)',
            'drop-shadow(0 0 16px rgba(249, 115, 22, 0.35)) brightness(0.95)',
            'drop-shadow(0 0 26px rgba(249, 115, 22, 0.55)) brightness(1.05)',
          ],
          zIndex: [25, 11, 18, 25],
        }}
        transition={{
          opacity: { duration: 2, delay: 0.6, ease: 'easeOut' },
          scale: { duration: 46, repeat: Infinity, ease: 'easeInOut' },
          x: { duration: 46, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 42, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 48, repeat: Infinity, ease: 'easeInOut' },
          filter: { duration: 46, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          position: 'absolute',
          right: '12%',
          top: '32%',
          width: 'clamp(190px, 21vw, 320px)',
          pointerEvents: 'none',
          transformOrigin: 'center center',
        }}
      >
        <img
          src="/images/easter-eggs/astronaut_float_3.png"
          alt="Spationaute en apesanteur 3"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </motion.div>

      {/* 7. Bouton HUD Supérieur Droit : RÉACTIVER LA GRAVITÉ (Sortie de l'animation) */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          zIndex: 100,
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Télémétrie */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '2px',
            padding: '8px 14px',
            background: 'rgba(15, 23, 42, 0.82)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#38bdf8',
            letterSpacing: '1px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
          }}
        >
          <span style={{ fontWeight: 800, color: '#38bdf8' }}>ORBIT // 420 KM</span>
          <span style={{ color: '#22d3ee', fontSize: '10px' }}>GRAVITY : 0.00 G</span>
        </div>

        {/* Bouton pour quitter */}
        <motion.button
          type="button"
          onClick={handleExit}
          whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.92))',
            border: '2px solid #38bdf8',
            borderRadius: '24px',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.5), 0 4px 20px rgba(0, 0, 0, 0.7)',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.8px',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            transition: 'border-color 0.2s ease',
          }}
        >
          <X size={16} color="#38bdf8" />
          <span>RÉACTIVER LA GRAVITÉ (ÉCHAP)</span>
        </motion.button>
      </div>

      {/* 8. Bannière HUD Majestueuse "APESANTEUR ZÉRO-G ACTIVÉE" */}
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
