import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Unlock, Terminal, Gamepad2, Trophy, Sparkles, RotateCcw, MessageSquare } from 'lucide-react';

export interface MascotVictoryPanelProps {
  effectiveTriggerType?: string;
  effectiveRewardPointsIT: number;
  currentEggId?: number;
  setIsCryptexActive: (active: boolean) => void;
  onReplayVictoryAnimation?: (targetEggId?: number) => void;
  activeTooltip: string | null;
  setActiveTooltip: (tooltip: string | null) => void;
  onClose: () => void;
  onOpenCommLink?: () => void;
}

export const MascotVictoryPanel: React.FC<MascotVictoryPanelProps> = ({
  effectiveTriggerType,
  effectiveRewardPointsIT,
  currentEggId,
  setIsCryptexActive,
  onReplayVictoryAnimation,
  activeTooltip,
  setActiveTooltip,
  onClose,
  onOpenCommLink,
}) => {
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 14 }}
      style={{ textAlign: 'center', padding: '8px 0' }}
    >
      {/* Visuel de Victoire Spécifique selon le Déclencheur */}
      {effectiveTriggerType === 'RIDDLE_ANSWER_INPUT' ? (
        /* Mini Cadenas Déverrouillé Animé pour les énigmes cadenas */
        <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 10px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: '1.5px dashed rgba(56, 189, 248, 0.45)',
            }}
          />
          <motion.div
            initial={{ y: 0, rotate: 0 }}
            animate={{ y: -10, rotate: -25 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            style={{
              position: 'absolute',
              top: '6px',
              left: '16px',
              width: '28px',
              height: '28px',
              borderTop: '5px solid #e2e8f0',
              borderLeft: '5px solid #e2e8f0',
              borderRight: '5px solid #94a3b8',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              transformOrigin: 'bottom left',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '8px',
              width: '48px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #047857)',
              border: '2px solid #34d399',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Unlock size={20} color="#ffffff" />
          </div>
        </div>
      ) : effectiveTriggerType === 'COMM_LINK_COMMAND' ? (
        /* Emblème Terminal pour les Commandes Comm-Link */
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            margin: '0 auto 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: '1.5px dashed rgba(56, 189, 248, 0.55)',
            }}
          />
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #0f172a)',
              border: '2px solid #38bdf8',
              boxShadow: '0 0 18px rgba(56, 189, 248, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Terminal size={22} color="#38bdf8" />
          </motion.div>
        </div>
      ) : effectiveTriggerType === 'KONAMI_CODE' ? (
        /* Emblème Arcade pour le Konami Code */
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            margin: '0 auto 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: '1.5px dashed rgba(244, 63, 94, 0.55)',
            }}
          />
          <motion.div
            initial={{ scale: 0.8, y: 5 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f43f5e, #881337)',
              border: '2px solid #fb7185',
              boxShadow: '0 0 18px rgba(244, 63, 94, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Gamepad2 size={24} color="#ffffff" />
          </motion.div>
        </div>
      ) : (
        /* Emblème Stellaire / Trophée pour les autres triggers */
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            margin: '0 auto 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: '1.5px dashed rgba(245, 158, 11, 0.55)',
            }}
          />
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #78350f)',
              border: '2px solid #fbbf24',
              boxShadow: '0 0 18px rgba(245, 158, 11, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={22} color="#fef08a" />
          </motion.div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color:
            effectiveTriggerType === 'KONAMI_CODE'
              ? '#fb7185'
              : effectiveTriggerType === 'COMM_LINK_COMMAND'
              ? '#38bdf8'
              : '#34d399',
          fontWeight: 900,
          fontSize: '1.05rem',
          marginBottom: '6px',
          textShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
        }}
      >
        {effectiveTriggerType === 'RIDDLE_ANSWER_INPUT'
          ? 'Cadenas 2070 Déverrouillé !'
          : effectiveTriggerType === 'COMM_LINK_COMMAND'
          ? 'Protocole 2070 Validé !'
          : effectiveTriggerType === 'KONAMI_CODE'
          ? 'Code Secret Arcade Débloqué !'
          : 'Anomalie Temporelle Résolue !'}
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(245, 158, 11, 0.18)',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '4px 12px',
          color: '#fbbf24',
          fontSize: '0.82rem',
          fontWeight: 800,
          marginBottom: '10px',
        }}
      >
        <Sparkles size={14} />
        +{effectiveRewardPointsIT} IT remportés
      </div>

      <p style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.45 }}>
        {effectiveTriggerType === 'COMM_LINK_COMMAND'
          ? "Ordre prioritaire transmis avec succès aux relais de l'Arche spatiale. Partagez la découverte avec votre équipe pour remporter le bonus collectif !"
          : effectiveTriggerType === 'KONAMI_CODE'
          ? "Séquence rétro-arcade authentifiée par l'ordinateur central. Partagez la découverte avec votre équipe pour remporter le bonus collectif !"
          : 'Anomalie temporelle neutralisée. Partagez la découverte avec votre équipe pour remporter le bonus collectif !'}
      </p>

      {/* Actions bar : boutons d'actions carrés premium avec tooltips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          marginTop: '16px',
        }}
      >
        {/* Bouton Revoir l'animation */}
        <div style={{ position: 'relative' }}>
          <motion.button
            type="button"
            onClick={() => {
              if (effectiveTriggerType === 'RIDDLE_ANSWER_INPUT') {
                setIsCryptexActive(true);
              } else if (onReplayVictoryAnimation) {
                onReplayVictoryAnimation(currentEggId);
              }
            }}
            onMouseEnter={() => setActiveTooltip('replay')}
            onMouseLeave={() => setActiveTooltip(null)}
            onFocus={() => setActiveTooltip('replay')}
            onBlur={() => setActiveTooltip(null)}
            whileHover={{ scale: 1.08, filter: 'brightness(1.2)' }}
            whileTap={{ scale: 0.94 }}
            aria-label="Revoir l'animation"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.28))',
              border: '1.5px solid rgba(245, 158, 11, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow:
                '0 4px 14px rgba(245, 158, 11, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              color: '#fbbf24',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <RotateCcw size={20} />
          </motion.button>

          <AnimatePresence>
            {activeTooltip === 'replay' && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#fef3c7',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
                  zIndex: 50,
                }}
              >
                Revoir l'animation
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid rgba(15, 23, 42, 0.95)',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bouton Comm-Link Équipe */}
        {onOpenCommLink && (
          <div style={{ position: 'relative' }}>
            <motion.button
              type="button"
              onClick={() => {
                onClose();
                onOpenCommLink();
              }}
              onMouseEnter={() => setActiveTooltip('comm')}
              onMouseLeave={() => setActiveTooltip(null)}
              onFocus={() => setActiveTooltip('comm')}
              onBlur={() => setActiveTooltip(null)}
              whileHover={{ scale: 1.08, filter: 'brightness(1.2)' }}
              whileTap={{ scale: 0.94 }}
              aria-label="Ouvrir le Comm-Link Équipe"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.32))',
                border: '1.5px solid rgba(16, 185, 129, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow:
                  '0 4px 14px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                color: '#34d399',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <MessageSquare size={20} />
            </motion.button>

            <AnimatePresence>
              {activeTooltip === 'comm' && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#d1fae5',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
                    zIndex: 50,
                  }}
                >
                  Ouvrir le Comm-Link Équipe
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid rgba(15, 23, 42, 0.95)',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};
