import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, X, ShieldCheck, Zap } from 'lucide-react';
import { playUnlockCadenasSound } from '../../utils/easterEggAudio';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'star' | 'circle' | 'diamond';
  rotation: number;
  duration: number;
  delay: number;
}

interface EasterEggCelebrationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  eggTitle?: string;
  pointsIT?: number;
  onOpenCommLink?: () => void;
  isTeamRewarded?: boolean;
}

export const EasterEggCelebrationOverlay: React.FC<EasterEggCelebrationOverlayProps> = ({
  isOpen,
  onClose,
  eggTitle = 'Cadenas Crypté 2070',
  pointsIT = 60,
  onOpenCommLink,
  isTeamRewarded = false,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [displayPoints, setDisplayPoints] = useState(0);

  // Génération de l'explosion de particules célestes & quantiques
  useEffect(() => {
    if (!isOpen) {
      setParticles([]);
      setDisplayPoints(0);
      return;
    }

    // Jouer le SFX dédié immédiatement
    playUnlockCadenasSound();

    // 55 particules aux couleurs SOS Planète (Émeraude, Or, Cyan, Blanc pur)
    const colors = ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#38bdf8', '#a7f3d0', '#ffffff'];
    const shapes: ('star' | 'circle' | 'diamond')[] = ['star', 'circle', 'diamond'];

    const newParticles: Particle[] = Array.from({ length: 55 }, (_, i) => {
      const angle = (i / 55) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const distance = 120 + Math.random() * 260;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 40,
        size: Math.random() * 9 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * 720 - 360,
        duration: 1.6 + Math.random() * 1.2,
        delay: Math.random() * 0.25,
      };
    });

    setParticles(newParticles);

    // Compteur de points IT qui s'incrémente dynamiquement
    let start = 0;
    const duration = 1200;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = pointsIT / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= pointsIT) {
        setDisplayPoints(pointsIT);
        clearInterval(timer);
      } else {
        setDisplayPoints(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isOpen, pointsIT]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="easter-egg-celebration-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, rgba(6, 78, 59, 0.75) 0%, rgba(2, 6, 23, 0.94) 80%)',
          backdropFilter: 'blur(16px)',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        {/* Onde de choc quantique émeraude */}
        <motion.div
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            border: '4px solid #10b981',
            boxShadow: '0 0 80px #10b981, inset 0 0 60px #34d399',
            pointerEvents: 'none',
          }}
        />

        {/* Deuxième onde de choc cyan décalée */}
        <motion.div
          initial={{ scale: 0.1, opacity: 0.8 }}
          animate={{ scale: 3.2, opacity: 0 }}
          transition={{ duration: 1.6, delay: 0.15, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            border: '2px solid #38bdf8',
            boxShadow: '0 0 60px #38bdf8',
            pointerEvents: 'none',
          }}
        />

        {/* Particules et confettis jaillissants */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
              animate={{
                x: p.x,
                y: [0, p.y * 0.7, p.y + 120],
                opacity: [1, 1, 0],
                scale: [0, 1.4, 0.6],
                rotate: p.rotation,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'diamond' ? '2px' : '3px',
                background: p.color,
                boxShadow: `0 0 12px ${p.color}`,
                transform: p.shape === 'diamond' ? 'rotate(45deg)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Contenu Central de la Célébration */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 15 }}
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '520px',
            padding: '36px 32px',
            background: 'rgba(15, 23, 42, 0.88)',
            border: '2px solid rgba(16, 185, 129, 0.6)',
            borderRadius: '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 50px rgba(16, 185, 129, 0.35)',
          }}
        >
          {/* Bouton fermer en haut à droite */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={18} />
          </button>

          {/* CADENAS MÉCANIQUE QUANTIQUE EN ANIMATION 3D */}
          <div
            style={{
              position: 'relative',
              width: '140px',
              height: '140px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Anneau gyroscopique orbital rotatif */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: '50%',
                border: '2px dashed rgba(56, 189, 248, 0.5)',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.25)',
              }}
            />

            {/* Deuxième anneau énergétique inversé */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: '-22px',
                borderRadius: '50%',
                border: '1.5px dotted rgba(16, 185, 129, 0.45)',
              }}
            />

            {/* L'anse du cadenas mécanique (s'ouvre et pivote vers le haut-gauche) */}
            <motion.div
              initial={{ y: 0, rotate: 0 }}
              animate={{ y: -24, rotate: -28 }}
              transition={{
                delay: 0.12,
                type: 'spring',
                stiffness: 280,
                damping: 14,
              }}
              style={{
                position: 'absolute',
                top: '12px',
                left: '34px',
                width: '60px',
                height: '62px',
                borderTop: '12px solid #e2e8f0',
                borderLeft: '12px solid #e2e8f0',
                borderRight: '12px solid #94a3b8',
                borderTopLeftRadius: '34px',
                borderTopRightRadius: '34px',
                boxShadow: '0 -4px 18px rgba(255, 255, 255, 0.45)',
                transformOrigin: 'bottom left',
                zIndex: 1,
              }}
            />

            {/* Le corps massif du cadenas futuriste */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.9, 1.05, 1] }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{
                position: 'absolute',
                bottom: '10px',
                width: '92px',
                height: '76px',
                background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                borderRadius: '18px',
                border: '3px solid #10b981',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.6), inset 0 0 15px rgba(52, 211, 153, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              {/* Cœur énergétique du cadenas (trou de serrure holographique) */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 10px #10b981',
                    '0 0 24px #34d399',
                    '0 0 10px #10b981',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #34d399 20%, #059669 80%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={14} color="#ffffff" />
              </motion.div>
              <div
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  color: '#34d399',
                  letterSpacing: '1px',
                  marginTop: '4px',
                }}
              >
                UNLOCKED
              </div>
            </motion.div>
          </div>

          {/* Badge statut neutralisé */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1.5px solid #10b981',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '10px',
            }}
          >
            <ShieldCheck size={16} />
            Anomalie Temporelle Neutralisée
          </motion.div>

          {/* Grand Titre Triomphal */}
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: 'spring' }}
            style={{
              margin: '0 0 8px 0',
              fontSize: '1.65rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.4px',
              textShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            {eggTitle} Déverrouillé !
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              margin: '0 0 22px 0',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              lineHeight: 1.45,
            }}
          >
            Félicitations Détective ! Les 5 règles du schéma ont été résolues et le verrou quantique s'est ouvert.
          </motion.p>

          {/* Badge des Points IT avec compteur dynamique et pulsation */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 220, damping: 12 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(16, 185, 129, 0.22))',
              border: '2px solid #f59e0b',
              boxShadow: '0 0 35px rgba(245, 158, 11, 0.35)',
              marginBottom: '28px',
            }}
          >
            <Sparkles size={28} color="#fbbf24" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fde68a', textTransform: 'uppercase' }}>
                Récompense Immédiate
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fef3c7', lineHeight: 1 }}>
                +{displayPoints} IT
              </div>
            </div>
          </motion.div>

          {/* Boutons d'Action : Partage Équipe Comm-Link ou Fermer */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
            }}
          >
            {onOpenCommLink && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCommLink();
                }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.96rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
              >
                <MessageSquare size={18} />
                {isTeamRewarded
                  ? 'Partager la victoire au Comm-Link Équipe'
                  : 'Alerter l’équipe pour le bonus collectif'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
              }}
            >
              Continuer l’exploration
            </button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
