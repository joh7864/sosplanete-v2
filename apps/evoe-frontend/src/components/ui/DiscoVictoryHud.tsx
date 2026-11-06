import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';

interface DiscoVictoryHudProps {
  eggTitle: string;
  displayPoints: number;
  isTeamRewarded?: boolean;
  onOpenCommLink?: () => void;
  onClose: () => void;
}

export const DiscoVictoryHud: React.FC<DiscoVictoryHudProps> = ({
  eggTitle,
  displayPoints,
  isTeamRewarded,
  onOpenCommLink,
  onClose,
}) => {
  return (
    <>
      {/* Titre Néon Flottant Discret au Sommet */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: '#f472b6',
            textShadow: '0 0 12px rgba(236, 72, 153, 0.8)',
            marginBottom: '4px',
          }}
        >
          {eggTitle || 'FÊTE ORBITALE'}
        </span>
      </motion.div>

      {/* Barre d'Action Basse Translucide Pleine Largeur (Style Copie Écran 1) */}
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '74px',
          zIndex: 40,
          padding: '0 36px',
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, rgba(20, 15, 45, 0.45) 0%, rgba(12, 8, 30, 0.82) 100%)',
          borderTop: '1.5px solid rgba(216, 180, 254, 0.35)',
          boxShadow: '0 -10px 40px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Gauche : Bonus IT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🎉</span>
          <span
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.2px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.6), 0 0 15px rgba(236, 72, 153, 0.5)',
            }}
          >
            +{displayPoints} IT {isTeamRewarded ? "Bonus d'Équipe" : 'Bonus Fête Orbitale'}
          </span>
        </div>

        {/* Centre : Bouton Pillule Alerter l'équipe */}
        <div>
          {onOpenCommLink ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(168, 85, 247, 0.45)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                onClose();
                onOpenCommLink();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 26px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(99, 102, 241, 0.35))',
                border: '1.5px solid rgba(216, 180, 254, 0.65)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 700,
                letterSpacing: '0.3px',
                cursor: 'pointer',
                boxShadow:
                  '0 0 24px rgba(168, 85, 247, 0.5), inset 0 0 15px rgba(192, 132, 252, 0.25)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Bell size={17} color="#fbcfe8" />
              <span>Alerter l’équipe</span>
            </motion.button>
          ) : (
            <div style={{ width: '140px' }} />
          )}
        </div>

        {/* Droite : Continuer ✕ */}
        <div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.06, color: '#ffffff' }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.82)',
              fontSize: '0.98rem',
              fontWeight: 700,
              letterSpacing: '0.3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
            }}
          >
            <span>Continuer</span>
            <span style={{ fontSize: '1.05rem', opacity: 0.85 }}>✕</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};
