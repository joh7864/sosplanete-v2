import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare } from 'lucide-react';

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
      {/* Titre Néon Flottant au Sommet */}
      <motion.div
        initial={{ opacity: 0, y: -25, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        style={{
          position: 'absolute',
          top: '24px',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '20px',
            background: 'rgba(236, 72, 153, 0.25)',
            border: '1.5px solid #ec4899',
            color: '#f472b6',
            fontSize: '0.74rem',
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '4px',
            boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
          }}
        >
          <Sparkles size={14} /> PISTE DÉBLOQUÉE // DISCO FEVER
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.5px',
            textShadow: '0 0 25px #ec4899, 0 0 50px #8b5cf6',
          }}
        >
          {eggTitle} !
        </h1>
      </motion.div>

      {/* Barre HUD Basse Flottante Option B */}
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 25 }}
        transition={{ type: 'spring', damping: 16 }}
        style={{
          position: 'absolute',
          bottom: '24px',
          zIndex: 40,
          width: '92%',
          maxWidth: '820px',
          padding: '12px 24px',
          borderRadius: '24px',
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1.5px solid rgba(236, 72, 153, 0.7)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85), 0 0 35px rgba(236, 72, 153, 0.45)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={22} color="#f472b6" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbcfe8', textTransform: 'uppercase' }}>
              {isTeamRewarded ? "Bonus IT d'Équipe" : 'Bonus IT Disco'}
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fef3c7', lineHeight: 1 }}>
              +{displayPoints} IT
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenCommLink && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCommLink();
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(236, 72, 153, 0.55)',
              }}
            >
              <MessageSquare size={16} />
              Alerter l’équipe
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#e2e8f0',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Continuer ✕
          </button>
        </div>
      </motion.div>
    </>
  );
};
