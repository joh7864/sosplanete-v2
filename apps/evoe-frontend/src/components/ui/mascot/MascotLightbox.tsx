import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Lock, Unlock, AlertCircle } from 'lucide-react';

import { DEDUCTION_CLUES, PadlockSvg } from './PadlockVisual';

export interface MascotLightboxProps {
  showLightbox: boolean;
  setShowLightbox: (show: boolean) => void;
  currentImageUrl?: string | null;
  isDesktopWide: boolean;
  isLandscapeMobile: boolean;
  effectiveTriggerType?: string;
  digits: string[];
  lightboxInputRefs: React.RefObject<HTMLInputElement | null>[];
  handleDigitChange: (index: number, val: string, isLightbox?: boolean) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>, isLightbox?: boolean) => void;
  resetTimer: () => void;
  showErrorShake: boolean;
  errorMessage: string | null;
  handleSubmitAnswer: () => Promise<void> | void;
  isVerifying: boolean;
}

export const MascotLightbox: React.FC<MascotLightboxProps> = ({
  showLightbox,
  setShowLightbox,
  currentImageUrl,
  isDesktopWide,
  isLandscapeMobile,
  effectiveTriggerType,
  digits,
  lightboxInputRefs,
  handleDigitChange,
  handleKeyDown,
  resetTimer,
  showErrorShake,
  errorMessage,
  handleSubmitAnswer,
  isVerifying,
}) => {
  if (!showLightbox || !currentImageUrl) return null;

  const isPadlockClue = currentImageUrl.includes('cadenas');

  const renderClueCards = (isCompact: boolean) => (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isCompact ? '6px' : '8px' }}>
      {DEDUCTION_CLUES.map((clue, i) => (
        <div
          key={i}
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
            border: clue.strikethrough ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1.5px solid #334155',
            borderRadius: '10px',
            padding: isCompact ? '6px 10px' : '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: isCompact ? '1.1rem' : '1.25rem',
                fontWeight: 900,
                color: clue.strikethrough ? '#94a3b8' : '#f8fafc',
                letterSpacing: '5px',
                opacity: clue.strikethrough ? 0.6 : 1,
              }}
            >
              {clue.digits}
            </span>
            {clue.strikethrough && (
              <div
                style={{
                  position: 'absolute',
                  left: -3,
                  right: -3,
                  top: '50%',
                  height: '3px',
                  background: '#ef4444',
                  borderRadius: '2px',
                  boxShadow: '0 0 8px #ef4444',
                }}
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              marginLeft: '12px',
            }}
          >
            {clue.parts.map((p, idx) => (
              <span
                key={idx}
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: isCompact ? '0.78rem' : '0.84rem',
                  fontWeight: 900,
                  color: p.color,
                  letterSpacing: '0.4px',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}
              >
                {p.text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (isDesktopWide) {
    /* Version Desktop Écran Large : Panneau flottant docké à droite de la bulle avec drag */
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: '-50%' }}
        animate={{ opacity: 1, scale: 1, y: '-50%' }}
        exit={{ opacity: 0, scale: 0.95, y: '-50%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        drag
        dragMomentum={false}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '50%',
          left: 'calc(100% + 18px)',
          width: '395px',
          maxHeight: '88vh',
          background: '#040813',
          borderRadius: '20px',
          border: '2px solid rgba(56, 189, 248, 0.55)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.7), 0 0 30px rgba(56, 189, 248, 0.3)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        {/* Header Panneau Déduction */}
        <div
          style={{
            padding: '9px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(30, 41, 59, 0.7)',
            background: 'rgba(15, 23, 42, 0.85)',
            cursor: 'grab',
          }}
        >
          <span style={{ color: '#00ffcc', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.6px' }}>
            🔍 SCHÉMA DE DÉDUCTION — CADENAS 2070
          </span>
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            title="Fermer ce panneau"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenu Déduction */}
        <div
          style={{
            padding: '12px 14px 16px 14px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'radial-gradient(circle at 50% 10%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)',
          }}
        >
          {isPadlockClue ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <PadlockSvg size={76} />
              </div>
              {renderClueCards(false)}
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 900,
                  color: '#00ffcc',
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                  textShadow: '0 0 12px rgba(0, 255, 204, 0.45)',
                }}
              >
                Quelle est la bonne combinaison ?
              </div>
            </div>
          ) : (
            <img
              src={currentImageUrl || undefined}
              alt="Schéma Plein Écran"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
              }}
            />
          )}
        </div>
      </motion.div>
    );
  }

  /* Version Mobile (Portrait & Paysage) et Écrans Étroits : Modal Centré avec Backdrop via Portal */
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="deduction-panel-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10005,
        background: 'rgba(3, 7, 18, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isLandscapeMobile ? '8px 12px' : '16px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      onClick={() => setShowLightbox(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: isLandscapeMobile ? '560px' : '430px',
          maxHeight: isLandscapeMobile ? '94vh' : '90vh',
          background: '#040813',
          borderRadius: '20px',
          border: '2px solid rgba(56, 189, 248, 0.65)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(56, 189, 248, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: 'auto',
          pointerEvents: 'auto',
        }}
      >
        {/* Header Panneau Déduction Sticky */}
        <div
          style={{
            padding: isLandscapeMobile ? '8px 12px' : '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(30, 41, 59, 0.7)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(6px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <span
            style={{
              color: '#00ffcc',
              fontWeight: 800,
              fontSize: isLandscapeMobile ? '0.74rem' : '0.80rem',
              letterSpacing: '0.6px',
            }}
          >
            🔍 SCHÉMA DE DÉDUCTION — CADENAS 2070
          </span>
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            title="Fermer ce panneau"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenu Déduction Arcade Stylisé */}
        <div
          style={{
            padding: isLandscapeMobile ? '10px 12px 14px 12px' : '14px 16px 16px 16px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'radial-gradient(circle at 50% 10%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)',
            gap: isLandscapeMobile ? '6px' : '10px',
          }}
        >
          {isPadlockClue ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: isLandscapeMobile ? '6px' : '10px',
                }}
              >
                <PadlockSvg size={isLandscapeMobile ? 54 : 64} />
              </div>

              {renderClueCards(isLandscapeMobile)}

              <div
                style={{
                  marginTop: isLandscapeMobile ? '8px' : '12px',
                  marginBottom: isLandscapeMobile ? '6px' : '10px',
                  fontSize: isLandscapeMobile ? '0.84rem' : '0.94rem',
                  fontWeight: 900,
                  color: '#00ffcc',
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                  textShadow: '0 0 12px rgba(0, 255, 204, 0.45)',
                }}
              >
                Quelle est la bonne combinaison ?
              </div>

              {/* Saisie directe du code dans le schéma (ultra pratique sur mobile) */}
              {effectiveTriggerType === 'RIDDLE_ANSWER_INPUT' && (
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1.5px solid #334155',
                    borderRadius: '12px',
                    padding: isLandscapeMobile ? '8px 10px' : '10px 14px',
                    boxSizing: 'border-box',
                    marginTop: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: '#38bdf8',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Lock size={12} />
                      SAISIR LE CODE DU CADENAS
                    </span>
                    <span style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
                      {digits.filter(Boolean).length}/4
                    </span>
                  </div>

                  {/* 4 chiffres */}
                  <motion.div
                    animate={showErrorShake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    style={{
                      display: 'flex',
                      gap: isLandscapeMobile ? '6px' : '8px',
                      justifyContent: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    {digits.map((digit, idx) => (
                      <input
                        key={`lightbox-${idx}`}
                        ref={lightboxInputRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value, true)}
                        onKeyDown={(e) => handleKeyDown(idx, e, true)}
                        onFocus={() => resetTimer()}
                        style={{
                          width: isLandscapeMobile ? '38px' : '44px',
                          height: isLandscapeMobile ? '42px' : '48px',
                          background: '#1e293b',
                          border: `2px solid ${showErrorShake ? '#ef4444' : digit ? '#38bdf8' : '#475569'}`,
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: isLandscapeMobile ? '1.3rem' : '1.45rem',
                          fontWeight: 900,
                          textAlign: 'center',
                          outline: 'none',
                          transition: 'border-color 0.15s ease',
                          boxShadow: digit ? '0 0 8px rgba(56, 189, 248, 0.3)' : 'none',
                        }}
                      />
                    ))}
                  </motion.div>

                  {errorMessage && (
                    <div
                      style={{
                        color: '#ef4444',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        marginBottom: '6px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <AlertCircle size={13} />
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={isVerifying}
                    style={{
                      width: '100%',
                      background: isVerifying
                        ? '#475569'
                        : 'linear-gradient(135deg, #0284c7, #0369a1)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: isLandscapeMobile ? '7px 10px' : '9px 12px',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: isVerifying ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                    }}
                  >
                    <Unlock size={14} />
                    {isVerifying ? 'Décodage en cours...' : 'DÉVERROUILLER LE CADENAS'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <img
              src={currentImageUrl || undefined}
              alt="Schéma Plein Écran"
              style={{
                maxWidth: '100%',
                maxHeight: isLandscapeMobile ? '70vh' : '75vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
