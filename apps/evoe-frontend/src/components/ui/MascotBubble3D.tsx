import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, AlertCircle, Lock, Unlock, Sparkles, MessageSquare, RotateCcw } from 'lucide-react';
import { preloadUnlockAudio } from '../../utils/easterEggAudio';
import LockWowAnimation from './LockWowAnimation';
import type { LockWowAnimationHandles } from './LockWowAnimation';

interface MascotBubble3DProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  crypticMessage: string;
  explicitHint?: string | null;
  showExplicitHint: boolean;
  imageUrl?: string | null;
  triggerType?: string;
  isDiscovered?: boolean;
  rewardPointsIT?: number;
  mascotImageUrl?: string;
    mascotDurationSeconds?: number;
  onVerifyAnswer?: (answer: string) => Promise<{ success: boolean; message?: string }>;
  onSuccess?: () => void;
  onOpenCommLink?: () => void;
}

export const MascotBubble3D: React.FC<MascotBubble3DProps> = ({
  isOpen,
  onClose,
  title,
  crypticMessage,
  explicitHint,
  showExplicitHint,
  imageUrl,
  triggerType,
  isDiscovered = false,
  rewardPointsIT = 60,
  mascotImageUrl = '/images/robot-mascot.png',
  mascotDurationSeconds = 45,
  onVerifyAnswer,
  onSuccess,
  onOpenCommLink,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorShake, setShowErrorShake] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isCryptexActive, setIsCryptexActive] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const lockAnimRef = useRef<LockWowAnimationHandles>(null);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const currentMessage =
    (showExplicitHint && explicitHint ? explicitHint : crypticMessage) ||
    "Transmission prioritaire 2070 : Décodez l'anomalie temporelle...";

  // Typewriter effect
  useEffect(() => {
    if (!isOpen) {
      setDisplayedText('');
      setIsTypingComplete(false);
      setDigits(['', '', '', '']);
      setErrorMessage(null);
      setLocalSuccess(false);
      setShowLightbox(false);
      setIsInteracting(false);
      setIsCryptexActive(false);
      setActiveTooltip(null);
      return;
    }

    // Précharge le son SFX dédié dès l'ouverture de la mascotte
    preloadUnlockAudio();

    let i = 0;
    setDisplayedText('');
    setIsTypingComplete(false);

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + currentMessage.charAt(i));
      i++;
      if (i >= currentMessage.length) {
        clearInterval(interval);
        setIsTypingComplete(true);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [isOpen, currentMessage]);

  // Auto-close countdown (only if not actively typing or looking at lightbox)
  useEffect(() => {
    if (!isOpen || isInteracting || showLightbox || localSuccess) return;

    const timer = setTimeout(() => {
      onClose();
    }, mascotDurationSeconds * 1000);

    return () => clearTimeout(timer);
  }, [isOpen, isInteracting, showLightbox, localSuccess, mascotDurationSeconds, onClose]);

  const handleSkipTyping = () => {
    setDisplayedText(currentMessage);
    setIsTypingComplete(true);
  };

  const handleDigitChange = (index: number, val: string) => {
    setIsInteracting(true);
    setErrorMessage(null);

    // Filter only numeric characters
    const cleanVal = val.replace(/\D/g, '');
    if (cleanVal.length === 0) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // If pasted multi-digit code (e.g. "4207")
    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 4).split('');
      const newDigits = [...digits];
      chars.forEach((c, idx) => {
        if (index + idx < 4) newDigits[index + idx] = c;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(3, index + chars.length);
      inputRefs[nextIdx]?.current?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal[cleanVal.length - 1];
    setDigits(newDigits);

    // Auto advance to next digit
    if (index < 3 && cleanVal) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsInteracting(true);
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    } else if (e.key === 'Enter') {
      handleSubmitAnswer();
    }
  };

  const handleSubmitAnswer = async () => {
    const answer = digits.join('');
    if (answer.length < 4) {
      setErrorMessage('Veuillez saisir les 4 chiffres du code.');
      triggerShake();
      return;
    }

    if (!onVerifyAnswer) return;

    try {
      setIsVerifying(true);
      setErrorMessage(null);
      const res = await onVerifyAnswer(answer);
      if (res.success) {
        setLocalSuccess(true);
        setIsCryptexActive(true);
        onSuccess?.();
      } else {
        setErrorMessage(res.message || 'Code erroné. Croisez bien les 5 règles du schéma !');
        triggerShake();
      }
    } catch {
      setErrorMessage('Erreur lors de la vérification.');
      triggerShake();
    } finally {
      setIsVerifying(false);
    }
  };

  const triggerShake = () => {
    setShowErrorShake(true);
    setTimeout(() => setShowErrorShake(false), 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Animation Cryptex Da Vinci flottante sans boîte, floutant directement le dashboard 2026 */}
          {isCryptexActive &&
            typeof document !== 'undefined' &&
            createPortal(
              <LockWowAnimation onClose={() => setIsCryptexActive(false)} />,
              document.body
            )}

          {/* Overlay Conteneur Mascotte (masqué pendant l'animation du cryptex) */}
          <div
            id="mascot-bubble-overlay"
            style={{
              position: 'fixed',
              top: '28px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: isCryptexActive ? 'none' : 'auto',
              opacity: isCryptexActive ? 0 : 1,
              transition: 'opacity 0.25s ease',
              maxWidth: '92vw',
            }}
          >
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              initial={{ x: -800, y: 280, opacity: 0, scale: 0.4 }}
              animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.3 } }}
              transition={{
                x: { ease: 'linear', duration: 1.1 },
                y: { ease: 'easeOut', duration: 1.1 },
                opacity: { duration: 0.3 },
                scale: { type: 'spring', stiffness: 85, damping: 14 },
              }}
            >
              {/* Mascotte 3D (Cliquer dessus ferme le pop-up) */}
              <motion.img
                src={mascotImageUrl}
                alt="Mascotte 2070"
                onClick={onClose}
                title="Cliquer sur la mascotte pour fermer"
                style={{
                  width: '185px',
                  height: 'auto',
                  filter: 'drop-shadow(0 16px 24px rgba(0,0,0,0.65))',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                animate={{ y: [0, -8, 0], rotateZ: [-2, 2, -2] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />

              {/* Bulle BD Holographique (Ne ferme pas au clic à l'intérieur) */}
              <motion.div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInteracting(true);
                }}
                style={{
                  background: '#ffffff',
                  border: '3.5px solid #0f172a',
                  borderRadius: '24px',
                  padding: '20px 24px',
                  color: '#0f172a',
                  width: '460px',
                  maxWidth: '92vw',
                  boxShadow: '0 20px 35px rgba(0,0,0,0.4), 6px 6px 0px #0f172a',
                  marginTop: '8px',
                  position: 'relative',
                  lineHeight: 1.45,
                  textAlign: 'left',
                }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 140 }}
              >
                {/* Flèche BD pointant vers le hoverboard */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    marginLeft: '-14px',
                    width: 0,
                    height: 0,
                    borderLeft: '14px solid transparent',
                    borderRight: '14px solid transparent',
                    borderBottom: '20px solid #ffffff',
                    zIndex: 2,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '-25px',
                    left: '50%',
                    marginLeft: '-17px',
                    width: 0,
                    height: 0,
                    borderLeft: '17px solid transparent',
                    borderRight: '17px solid transparent',
                    borderBottom: '25px solid #0f172a',
                    zIndex: 1,
                  }}
                />

                {/* En-tête de la bulle : Titre aligné à gauche et points IT alignés à droite */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      letterSpacing: '-0.2px',
                      flex: 1,
                    }}
                  >
                    {title}
                  </h4>
                  <span
                    style={{
                      background: '#fef3c7',
                      color: '#b45309',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1.5px solid #fde68a',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    +{rewardPointsIT} IT
                  </span>
                </div>

                {/* Badge Alerte 2ème Indice Débloqué si hh:mm écoulé */}
                {showExplicitHint && explicitHint && (
                  <div
                    style={{
                      background: '#fef3c7',
                      border: '2px solid #f59e0b',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#92400e',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    <Sparkles size={16} color="#d97706" />
                    <span>Signal 2070 amplifié : 2ème indice explicite reçu !</span>
                  </div>
                )}

                {/* Corps du message de la mascotte (effet machine à écrire) */}
                <div
                  onClick={handleSkipTyping}
                  style={{
                    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive, sans-serif',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    lineHeight: 1.5,
                    marginBottom: '14px',
                    cursor: isTypingComplete ? 'default' : 'pointer',
                    userSelect: 'none',
                    color: showExplicitHint ? '#92400e' : '#1e293b',
                  }}
                  title={isTypingComplete ? '' : 'Cliquez pour afficher tout le texte'}
                >
                  {displayedText}
                  {!isTypingComplete && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.4 }}
                      style={{ color: '#0284c7', fontWeight: 900 }}
                    >
                      |
                    </motion.span>
                  )}
                </div>

                {/* Vignette Schéma / Infographie (1.3) */}
                {imageUrl && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '8px 10px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        onClick={() => setShowLightbox(true)}
                        style={{
                          width: '46px',
                          height: '36px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1.5px solid #94a3b8',
                          cursor: 'pointer',
                          background: '#090d16',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt="Schéma"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                          Schéma de Déduction 2070
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          5 règles d'exclusion cryptées
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLightbox(true)}
                      style={{
                        background: '#0284c7',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#0369a1')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#0284c7')}
                    >
                      <ZoomIn size={13} />
                      Agrandir
                    </button>
                  </div>
                )}

                {/* Option A : Pavé de saisie 4 chiffres pour énigmes de type RIDDLE_ANSWER_INPUT */}
                {triggerType === 'RIDDLE_ANSWER_INPUT' && (
                  <div
                    style={{
                      background: '#0f172a',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      color: '#ffffff',
                      border: '2px solid #334155',
                    }}
                  >
                    {isDiscovered || localSuccess ? (
                      /* État Succès : Énigme résolue avec animation wow */
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                        style={{ textAlign: 'center', padding: '8px 0' }}
                      >
                        {/* Mini Cadenas Déverrouillé Animé */}
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

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            color: '#34d399',
                            fontWeight: 900,
                            fontSize: '1.05rem',
                            marginBottom: '6px',
                            textShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
                          }}
                        >
                          Cadenas 2070 Déverrouillé !
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
                          +{rewardPointsIT} IT remportés
                        </div>

                        <p style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.45 }}>
                          Anomalie temporelle neutralisée. Partagez la découverte avec votre équipe pour remporter le bonus collectif !
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
                              onClick={() => setIsCryptexActive(true)}
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
                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
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
                                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
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
                    ) : (
                      /* Formulaire de saisie des 4 chiffres */
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                          }}
                        >
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>
                            <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                            CODE DU CADENAS (4 CHIFFRES)
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {digits.filter(Boolean).length}/4
                          </span>
                        </div>

                        {/* Rangée des 4 cases de chiffres avec shake en cas d'erreur */}
                        <motion.div
                          animate={showErrorShake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                          transition={{ duration: 0.5 }}
                          style={{
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'center',
                            marginBottom: '12px',
                          }}
                        >
                          {digits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={inputRefs[idx]}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(idx, e)}
                              onFocus={() => setIsInteracting(true)}
                              style={{
                                width: '46px',
                                height: '52px',
                                background: '#1e293b',
                                border: `2px solid ${showErrorShake ? '#ef4444' : digit ? '#38bdf8' : '#475569'}`,
                                borderRadius: '10px',
                                color: '#ffffff',
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                textAlign: 'center',
                                outline: 'none',
                                transition: 'border-color 0.15s ease',
                                boxShadow: digit ? '0 0 10px rgba(56, 189, 248, 0.3)' : 'none',
                              }}
                            />
                          ))}
                        </motion.div>

                        {/* Message d'erreur */}
                        {errorMessage && (
                          <div
                            style={{
                              color: '#ef4444',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              marginBottom: '10px',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <AlertCircle size={14} />
                            {errorMessage}
                          </div>
                        )}

                        {/* Bouton Déverrouiller */}
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
                            borderRadius: '10px',
                            padding: '10px',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            cursor: isVerifying ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isVerifying) e.currentTarget.style.filter = 'brightness(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isVerifying) e.currentTarget.style.filter = 'none';
                          }}
                        >
                          <Unlock size={16} />
                          {isVerifying ? 'Décodage temporel en cours...' : 'DÉVERROUILLER LE CADENAS'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Panneau de Déduction Agrandit (Non-Modal, Affiché à droite et aligné au centre de la bulle) */}
                {showLightbox && imageUrl && (
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
                    {/* Header Panneau Déduction (Poignée Draggable) */}
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

                    {/* Contenu Déduction Arcade Stylisé */}
                    <div
                      style={{
                        padding: '14px 16px 16px 16px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: 'radial-gradient(circle at 50% 10%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)',
                      }}
                    >
                      {imageUrl.includes('cadenas') ? (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {/* Cadenas 3D Stylisé */}
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                            <svg
                              width="76"
                              height="84"
                              viewBox="0 0 84 94"
                              fill="none"
                              style={{ filter: 'drop-shadow(0 4px 14px rgba(245, 158, 11, 0.4))' }}
                            >
                              <defs>
                                <linearGradient id="shackleGradSide" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#94a3b8" />
                                  <stop offset="25%" stopColor="#ffffff" />
                                  <stop offset="60%" stopColor="#cbd5e1" />
                                  <stop offset="100%" stopColor="#64748b" />
                                </linearGradient>
                                <linearGradient id="lockBodyGradSide" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#fbbf24" />
                                  <stop offset="50%" stopColor="#f59e0b" />
                                  <stop offset="100%" stopColor="#d97706" />
                                </linearGradient>
                              </defs>

                              {/* Anse Métallique */}
                              <path
                                d="M 23 38 V 20 C 23 10 31 3 42 3 C 53 3 61 10 61 20 V 38"
                                stroke="url(#shackleGradSide)"
                                strokeWidth="10"
                                strokeLinecap="round"
                                fill="none"
                              />

                              {/* Corps Doré */}
                              <rect
                                x="8"
                                y="30"
                                width="68"
                                height="54"
                                rx="13"
                                fill="url(#lockBodyGradSide)"
                                stroke="rgba(254, 240, 138, 0.8)"
                                strokeWidth="1.2"
                              />

                              {/* 4 Roulettes / Dials */}
                              {[0, 1, 2, 3].map((i) => (
                                <g key={i} transform={`translate(${14 + i * 14.5}, 38)`}>
                                  <rect width="11" height="38" rx="3.5" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                                  <polygon points="5.5,2.5 2.5,6 8.5,6" fill="#fde047" />
                                  <text
                                    x="5.5"
                                    y="22"
                                    fill="#ffffff"
                                    fontSize="9.5"
                                    fontWeight="900"
                                    textAnchor="middle"
                                    fontFamily="sans-serif"
                                  >
                                    ?
                                  </text>
                                  <polygon points="5.5,35.5 2.5,32 8.5,32" fill="#fde047" />
                                </g>
                              ))}
                            </svg>
                          </div>

                          {/* 5 Cartes de Déduction (Chaque règle sur une seule ligne) */}
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                              {
                                digits: '4839',
                                strikethrough: false,
                                borderColor: '#38bdf8',
                                glowColor: 'rgba(56, 189, 248, 0.45)',
                                parts: [{ text: '1 BON, BIEN PLACÉ', color: '#22c55e' }],
                              },
                              {
                                digits: '7251',
                                strikethrough: false,
                                borderColor: '#38bdf8',
                                glowColor: 'rgba(56, 189, 248, 0.45)',
                                parts: [{ text: '2 BONS DONT 1 BIEN PLACÉ', color: '#22c55e' }],
                              },
                              {
                                digits: '8063',
                                strikethrough: false,
                                borderColor: '#38bdf8',
                                glowColor: 'rgba(56, 189, 248, 0.45)',
                                parts: [
                                  { text: '1 BON, ', color: '#22c55e' },
                                  { text: 'MAL PLACÉ', color: '#ef4444' },
                                ],
                              },
                              {
                                digits: '9513',
                                strikethrough: true,
                                borderColor: '#ef4444',
                                glowColor: 'rgba(239, 68, 68, 0.4)',
                                parts: [{ text: "AUCUN N'EST BON", color: '#ef4444' }],
                              },
                              {
                                digits: '7046',
                                strikethrough: false,
                                borderColor: '#38bdf8',
                                glowColor: 'rgba(56, 189, 248, 0.45)',
                                parts: [
                                  { text: '3 BONS, ', color: '#22c55e' },
                                  { text: 'MAL PLACÉS', color: '#ef4444' },
                                ],
                              },
                            ].map((clue) => (
                              <div
                                key={clue.digits}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '7px 14px',
                                  borderRadius: '13px',
                                  border: `2px solid ${clue.borderColor}`,
                                  boxShadow: `0 0 12px ${clue.glowColor}, inset 0 0 10px rgba(15, 23, 42, 0.7)`,
                                  background: 'linear-gradient(180deg, #0f172a 0%, #080e1a 100%)',
                                  position: 'relative',
                                }}
                              >
                                {/* Chiffres à gauche */}
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                  <span
                                    style={{
                                      fontFamily: "'Impact', 'Arial Black', -apple-system, sans-serif",
                                      fontSize: '1.9rem',
                                      fontWeight: 900,
                                      color: '#ffffff',
                                      letterSpacing: '2px',
                                      lineHeight: 1,
                                      textShadow:
                                        '0 2px 4px rgba(0,0,0,0.95), 1px 1px 0 #000, -1px -1px 0 #000',
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

                                {/* Règle sur une seule ligne à droite */}
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
                                        fontSize: '0.84rem',
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

                          {/* Question finale demandée par l'utilisateur */}
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
                          src={imageUrl}
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
                )}
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
