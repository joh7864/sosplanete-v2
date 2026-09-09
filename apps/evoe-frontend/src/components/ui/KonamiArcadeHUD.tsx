import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

interface KonamiArcadeHUDProps {
  isVisible: boolean;
  stepIndex: number;
  isError: boolean;
  showMobileButtons?: boolean;
  onMobileButtonPress?: (button: 'b' | 'a') => void;
  onClose?: () => void;
}

const KONAMI_LABELS = ['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'B', 'A'];

export const KonamiArcadeHUD: React.FC<KonamiArcadeHUDProps> = ({
  isVisible,
  stepIndex,
  isError,
  showMobileButtons = false,
  onMobileButtonPress,
}) => {
  if (!isVisible && !showMobileButtons) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="konami-arcade-hud"
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          style={{
            position: 'fixed',
            top: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30000,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {/* Boîtier Arcade Rétro Néon */}
          <motion.div
            animate={isError ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            style={{
              background: 'rgba(10, 15, 29, 0.92)',
              border: `2px solid ${isError ? '#ef4444' : '#38bdf8'}`,
              borderRadius: '16px',
              padding: '10px 18px',
              boxShadow: isError
                ? '0 0 25px rgba(239, 68, 68, 0.5), inset 0 0 15px rgba(239, 68, 68, 0.2)'
                : '0 0 25px rgba(56, 189, 248, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {/* Titre Arcade */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gamepad2 size={16} color={isError ? '#ef4444' : '#38bdf8'} />
              <span
                style={{
                  fontFamily: "'Courier New', monospace, sans-serif",
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  letterSpacing: '1.5px',
                  color: isError ? '#f87171' : '#7dd3fc',
                  textTransform: 'uppercase',
                  textShadow: isError
                    ? '0 0 8px rgba(239, 68, 68, 0.8)'
                    : '0 0 8px rgba(56, 189, 248, 0.8)',
                }}
              >
                {isError ? 'Séquence Rompue !' : 'Séquence Konami 80s'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                ({Math.min(stepIndex, 10)}/10)
              </span>
            </div>

            {/* Rangée des 10 étapes */}
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              {KONAMI_LABELS.map((lbl, idx) => {
                const isCompleted = idx < stepIndex;
                const isCurrent = idx === stepIndex;

                let bg = 'rgba(30, 41, 59, 0.6)';
                let borderColor = 'rgba(100, 116, 139, 0.3)';
                let textColor = '#64748b';
                let glow = 'none';

                if (isCompleted) {
                  bg = 'linear-gradient(135deg, #10b981, #059669)';
                  borderColor = '#34d399';
                  textColor = '#ffffff';
                  glow = '0 0 10px rgba(16, 185, 129, 0.6)';
                } else if (isCurrent) {
                  bg = 'rgba(56, 189, 248, 0.25)';
                  borderColor = '#38bdf8';
                  textColor = '#38bdf8';
                  glow = '0 0 12px rgba(56, 189, 248, 0.7)';
                }

                if (isError) {
                  borderColor = 'rgba(239, 68, 68, 0.6)';
                  if (idx === stepIndex) {
                    bg = 'rgba(239, 68, 68, 0.3)';
                    textColor = '#f87171';
                  }
                }

                return (
                  <motion.div
                    key={idx}
                    animate={isCurrent ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                    transition={isCurrent ? { repeat: Infinity, duration: 0.8 } : {}}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: bg,
                      border: `1.5px solid ${borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      color: textColor,
                      boxShadow: glow,
                      fontFamily: "'Courier New', monospace",
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {lbl}
                  </motion.div>
                );
              })}
            </div>

            {/* Message d'aide ou indice */}
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1', opacity: 0.85, textAlign: 'center' }}>
              {isError
                ? 'Recommencez depuis le début (↑ ↑ ↓ ↓...)'
                : stepIndex >= 8
                ? 'Appuyez maintenant sur B puis sur A !'
                : 'Touches fléchées physiques ou glissements tactiles'}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Boutons Tactiles Rétro Arcade pour Mobile (B et A) */}
      {showMobileButtons && (
        <motion.div
          id="konami-mobile-buttons"
          initial={{ y: 60, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          style={{
            position: 'fixed',
            bottom: '36px',
            right: '24px',
            zIndex: 30001,
            display: 'flex',
            gap: '16px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '2px solid rgba(245, 158, 11, 0.6)',
            borderRadius: '40px',
            padding: '12px 20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(245, 158, 11, 0.3)',
            backdropFilter: 'blur(10px)',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fcd34d', marginRight: '4px' }}>
            Finalisez :
          </span>

          {/* Bouton B */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={() => onMobileButtonPress?.('b')}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              border: '2px solid #fca5a5',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.2rem',
              boxShadow: '0 0 14px rgba(239, 68, 68, 0.6), inset 0 2px 4px rgba(255,255,255,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            B
          </motion.button>

          {/* Bouton A */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={() => onMobileButtonPress?.('a')}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              border: '2px solid #93c5fd',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.2rem',
              boxShadow: '0 0 14px rgba(59, 130, 246, 0.6), inset 0 2px 4px rgba(255,255,255,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            A
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
