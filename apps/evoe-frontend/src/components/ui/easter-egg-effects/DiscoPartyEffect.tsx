import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { startDiscoGroove } from '../../../utils/discoGrooveAudio';

interface DiscoPartyEffectProps {
  onAdvance?: () => void;
}

// Poussières de lumière & confettis disco pré-calculés
const DISCO_SPARKLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${4 + (i * 4.1) % 92}%`,
  top: `${15 + (i * 3.7) % 75}%`,
  size: 3 + (i % 4) * 2,
  color: ['#ec4899', '#38bdf8', '#facc15', '#a855f7', '#ffffff'][i % 5],
  duration: 1.8 + (i % 5) * 0.4,
  delay: (i * 0.15) % 1.5,
}));

// Faisceaux laser volumétriques partant de la boule à facettes (x=50%, y=12%)
const LASER_BEAMS = [
  { angle: -42, color: 'rgba(56, 189, 248, 0.45)', duration: 2.2 },
  { angle: -24, color: 'rgba(236, 72, 153, 0.42)', duration: 1.9 },
  { angle: -8, color: 'rgba(168, 85, 247, 0.45)', duration: 2.4 },
  { angle: 10, color: 'rgba(56, 189, 248, 0.42)', duration: 2.1 },
  { angle: 26, color: 'rgba(236, 72, 153, 0.45)', duration: 2.3 },
  { angle: 44, color: 'rgba(250, 204, 21, 0.38)', duration: 2.0 },
];

export const DiscoPartyEffect: React.FC<DiscoPartyEffectProps> = ({ onAdvance }) => {
  // Déclenchement de la musique funky 104 BPM (Stayin' Alive Web Audio)
  useEffect(() => {
    const discoAudio = startDiscoGroove();
    return () => {
      discoAudio.stop();
    };
  }, []);

  return (
    <div
      onClick={onAdvance}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* 1. DÉCOR 3D UNIFIÉ : Baie vitrée spatiale, Terre, Danseurs & Piste néon */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/easter-eggs/disco_scene_club.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* 2. FAISCEAUX LASERS VOLUMÉTRIQUES DE LA BOULE À FACETTES */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {LASER_BEAMS.map((beam, idx) => (
          <motion.div
            key={idx}
            animate={{
              rotate: [beam.angle - 8, beam.angle + 8, beam.angle - 8],
              opacity: [0.35, 0.8, 0.35],
            }}
            transition={{
              duration: beam.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              top: '9%',
              left: '50%',
              width: '16px',
              height: '110vh',
              transformOrigin: 'top center',
              background: `linear-gradient(180deg, ${beam.color} 0%, rgba(255,255,255,0.7) 12%, ${beam.color} 40%, transparent 95%)`,
              filter: 'blur(6px)',
              mixBlendMode: 'screen',
            }}
          />
        ))}

        {/* Halo et éclats scintillants sur la boule */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.55, 0.95, 0.55],
          }}
          transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '7%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.5) 0%, rgba(56,189,248,0.3) 40%, transparent 70%)',
            filter: 'blur(22px)',
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* 3. PULSATION LUMINEUSE AU SOL SYNCHRONISÉE AU RYTHME DISCO */}
      <motion.div
        animate={{
          opacity: [0.2, 0.55, 0.2],
        }}
        transition={{
          duration: 0.577, // 104 BPM (temps par battement)
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          bottom: '2%',
          left: '15%',
          right: '15%',
          height: '35%',
          background: 'radial-gradient(ellipse at 50% 80%, rgba(236, 72, 153, 0.35) 0%, rgba(56, 189, 248, 0.25) 45%, transparent 75%)',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          filter: 'blur(20px)',
        }}
      />

      {/* 4. GRIBOUILLE OFFICIEL QUI DANSE AU CENTRE (SANS OVERBOARD) */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 15,
        }}
      >
        {/* Reflet néon & ombre de contact sous ses pieds */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* Ombre sombre d'occlusion au sol */}
          <motion.div
            animate={{
              scale: [1, 0.85, 1, 0.9, 1],
              opacity: [0.75, 0.55, 0.75, 0.6, 0.75],
            }}
            transition={{
              duration: 1.154,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              bottom: '-8px',
              width: '180px',
              height: '24px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 75%)',
              filter: 'blur(5px)',
            }}
          />

          {/* Reflet néon cyan/magenta sous ses semelles */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1, 1.15, 1],
              opacity: [0.45, 0.85, 0.45, 0.75, 0.45],
            }}
            transition={{
              duration: 1.154,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              bottom: '-12px',
              width: '220px',
              height: '32px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.7) 0%, rgba(236, 72, 153, 0.45) 50%, transparent 80%)',
              filter: 'blur(10px)',
              mixBlendMode: 'screen',
            }}
          />
        </div>

        {/* Personnage Gribouille animé en rythme 104 BPM */}
        <motion.div
          animate={{
            y: [0, -22, 0, -14, 0],
            rotate: [0, -3.5, 0, 3.5, 0],
            scaleX: [1, 0.97, 1.02, 0.98, 1],
            scaleY: [1, 1.04, 0.98, 1.03, 1],
          }}
          transition={{
            duration: 1.154,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'relative',
            filter: 'drop-shadow(0 15px 25px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 20px rgba(56, 189, 248, 0.35))',
          }}
        >
          <img
            src="/images/easter-eggs/gribouille_techno_dance.png"
            alt="Gribouille Danseur Disco"
            style={{
              height: '350px',
              width: 'auto',
              maxHeight: '44vh',
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </motion.div>
      </div>

      {/* 5. POUSSIÈRES D'ÉTOILES ET CONFETTIS FLOTTANTS */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {DISCO_SPARKLES.map((sp) => (
          <motion.div
            key={sp.id}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.9, 0.2],
              scale: [0.8, 1.25, 0.8],
            }}
            transition={{
              duration: sp.duration,
              delay: sp.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: sp.left,
              top: sp.top,
              width: `${sp.size}px`,
              height: `${sp.size}px`,
              borderRadius: '50%',
              backgroundColor: sp.color,
              boxShadow: `0 0 10px ${sp.color}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
