import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, AlertCircle, AlertTriangle, Lock, Unlock, Sparkles, MessageSquare, RotateCcw, Terminal, Gamepad2, Trophy } from 'lucide-react';
import { preloadUnlockAudio } from '../../utils/easterEggAudio';
import LockWowAnimation from './LockWowAnimation';
import { MascotLightbox } from './mascot/MascotLightbox';
import type { CycleEggItem } from '../../types/easterEgg';

/** Résout une URL relative /uploads/... en URL absolue pointant vers le backend */
const resolveAssetUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const root = (import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/').replace(/\/static\/?$/, '');
  return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
};

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
  multiEggProgress?: {
    total: number;
    solved: number;
    currentIndex: number;
  };
  cycleEggs?: CycleEggItem[];
  unsolvedRolloverCount?: number;
  showRolloverWarning?: boolean;
  isReplayMode?: boolean;
  replayedCycleIndex?: number;
  onExitReplay?: () => void;
  onVerifyAnswer?: (answer: string, targetEggId?: number) => Promise<{ success: boolean; message?: string }>;
  onVerifyCommand?: (command: string, targetEggId?: number) => Promise<{ success: boolean; message?: string }>;
  onReplayVictoryAnimation?: (targetEggId?: number) => void;
  onSuccess?: (targetEggId?: number) => void;
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
  mascotDurationSeconds: _mascotDurationSeconds = 60,
  multiEggProgress: _multiEggProgress,
  cycleEggs,
  unsolvedRolloverCount,
  showRolloverWarning,
  isReplayMode = false,
  replayedCycleIndex,
  onExitReplay,
  onVerifyAnswer,
  onVerifyCommand,
  onReplayVictoryAnimation,
  onSuccess,
  onOpenCommLink,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [commandInput, setCommandInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifyingCommand, setIsVerifyingCommand] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorShake, setShowErrorShake] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isCryptexActive, setIsCryptexActive] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [hoveredEggIndex, setHoveredEggIndex] = useState<number | null>(null);
  const initialDuration = 60;
  const [timeLeft, setTimeLeft] = useState(initialDuration);

  // Détection dynamique des dimensions de fenêtre et de l'orientation mobile
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isLandscapeMobile =
    windowDimensions.width > windowDimensions.height && windowDimensions.height < 620;
  const isDesktopWide =
    windowDimensions.width >= 1200 && windowDimensions.height >= 650;
  const isSmallPortrait =
    windowDimensions.height >= windowDimensions.width && windowDimensions.width < 430;

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const lightboxInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const [selectedEggIndex, setSelectedEggIndex] = useState(0);

  // Règle Métier : Les œufs verrouillés par un prérequis ne doivent pas apparaître pour le joueur
  const visibleCycleEggs = useMemo(() => {
    if (!cycleEggs) return [];
    return cycleEggs.filter(
      (e: CycleEggItem) => (e.isInteractable !== false || e.isDiscovered) && (e as any).isVisible !== false,
    );
  }, [cycleEggs]);

  // Synchroniser la sélection de l'œuf à l'ouverture ou quand visibleCycleEggs change
  useEffect(() => {
    if (isOpen && visibleCycleEggs && visibleCycleEggs.length > 0) {
      // Priorité 1 : premier œuf non encore résolu
      const firstUnresolvedIdx = visibleCycleEggs.findIndex((e: CycleEggItem) => !e.isDiscovered);
      if (firstUnresolvedIdx >= 0) {
        setSelectedEggIndex(firstUnresolvedIdx);
      } else {
        setSelectedEggIndex(0);
      }
    } else {
      setSelectedEggIndex(0);
    }
  }, [isOpen, visibleCycleEggs]);

  const currentEgg = visibleCycleEggs && visibleCycleEggs.length > 0 ? visibleCycleEggs[selectedEggIndex] : null;
  const currentEggId = currentEgg?.id;

  useEffect(() => {
    setDigits(['', '', '', '']);
    setCommandInput('');
    setErrorMessage(null);
    setLocalSuccess(false);
    setShowLightbox(false);
    setIsCryptexActive(false);
  }, [selectedEggIndex, currentEggId, isOpen]);

  const currentTitle = currentEgg ? (currentEgg.title || currentEgg.name || '') : title;
  const effectiveTriggerType = currentEgg ? currentEgg.triggerType : triggerType;
  const effectiveIsDiscovered = currentEgg ? !!currentEgg.isDiscovered : isDiscovered;
  const currentIsInteractable = currentEgg ? (currentEgg.isInteractable !== false) : true;
  const currentPrereqDesc = currentEgg?.prerequisiteDesc;
  const effectiveRewardPointsIT = currentEgg ? currentEgg.rewardPointsIT : rewardPointsIT;
  const currentImageUrl = resolveAssetUrl(currentEgg ? currentEgg.imageUrl : imageUrl);
  const currentExplicitHint = currentEgg ? currentEgg.explicitHint : explicitHint;
  const currentShowExplicitHint = currentEgg ? !!currentEgg.isExplicitHintVisible : showExplicitHint;

  const currentRawMessage = currentEgg ? (currentEgg.crypticMessage || '') : (crypticMessage || '');
  const isEggLocked = !currentIsInteractable && !effectiveIsDiscovered;

  const currentMessage = isEggLocked
    ? `Signal quantique scellé. Accomplissez les missions prioritaires dans le jeu pour déverrouiller l'accès à cette anomalie.${currentPrereqDesc ? `\n\nConditions requises : ${currentPrereqDesc}` : ''}`
    : ((currentShowExplicitHint && currentExplicitHint ? currentExplicitHint : currentRawMessage) ||
      "Transmission prioritaire 2070 : Décodez l'anomalie temporelle...");

  const resetTimer = useCallback(() => {
    setTimeLeft(initialDuration);
  }, [initialDuration]);

  // Typewriter effect
  useEffect(() => {
    if (!isOpen) {
      setDisplayedText('');
      setIsTypingComplete(false);
      setDigits(['', '', '', '']);
      setCommandInput('');
      setErrorMessage(null);
      setLocalSuccess(false);
      setShowLightbox(false);
      setIsCryptexActive(false);
      setActiveTooltip(null);
      setTimeLeft(initialDuration);
      return;
    }

    // Précharge le son SFX dédié dès l'ouverture de la mascotte
    preloadUnlockAudio();

    let i = 0;
    setDisplayedText('');
    setIsTypingComplete(false);

    const interval = setInterval(() => {
      i++;
      if (i >= currentMessage.length) {
        setDisplayedText(currentMessage);
        setIsTypingComplete(true);
        clearInterval(interval);
      } else {
        setDisplayedText(currentMessage.slice(0, i));
      }
    }, 28);

    return () => clearInterval(interval);
  }, [isOpen, currentMessage, initialDuration]);

  // Compte à rebours de 60 secondes, réinitialisé à chaque frappe/interaction
  useEffect(() => {
    if (!isOpen || showLightbox || localSuccess) return;

    setTimeLeft(initialDuration);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCloseRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, showLightbox, localSuccess, initialDuration]);

  const handleSkipTyping = () => {
    resetTimer();
    setDisplayedText(currentMessage);
    setIsTypingComplete(true);
  };

  const handleDigitChange = (index: number, val: string, isLightbox = false) => {
    resetTimer();
    setErrorMessage(null);
    const targetRefs = isLightbox ? lightboxInputRefs : inputRefs;

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
      targetRefs[nextIdx]?.current?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal[cleanVal.length - 1];
    setDigits(newDigits);

    // Auto advance to next digit
    if (index < 3 && cleanVal) {
      targetRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, isLightbox = false) => {
    resetTimer();
    const targetRefs = isLightbox ? lightboxInputRefs : inputRefs;
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      targetRefs[index - 1]?.current?.focus();
    } else if (e.key === 'Enter') {
      handleSubmitAnswer();
    }
  };

  const handleSubmitAnswer = async () => {
    resetTimer();
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
      const res = await onVerifyAnswer(answer, currentEggId);
      if (res.success) {
        setLocalSuccess(true);
        setIsCryptexActive(true);
        setShowLightbox(false);
        onSuccess?.(currentEggId);
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

  const handleCommandSubmit = async () => {
    const raw = commandInput.trim();
    if (!raw) return;

    resetTimer();
    setErrorMessage(null);

    if (!onVerifyCommand) {
      setErrorMessage('Validation non disponible pour cette énigme');
      triggerShake();
      return;
    }

    try {
      setIsVerifyingCommand(true);
      const res = await onVerifyCommand(raw, currentEggId);
      if (res.success) {
        setLocalSuccess(true);
        if (effectiveTriggerType === 'RIDDLE_ANSWER_INPUT') {
          setIsCryptexActive(true);
        }
        setShowLightbox(false);
        onSuccess?.(currentEggId);
      } else {
        setErrorMessage(res.message || 'Mot-clé ou commande non reconnu.');
        triggerShake();
      }
    } catch {
      setErrorMessage('Erreur lors de la validation.');
      triggerShake();
    } finally {
      setIsVerifyingCommand(false);
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
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: isLandscapeMobile
                ? '10px 12px 24px 12px'
                : isSmallPortrait
                  ? '14px 10px 24px 10px'
                  : '24px 16px 32px 16px',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              pointerEvents: isCryptexActive ? 'none' : 'auto',
              opacity: isCryptexActive ? 0 : 1,
              transition: 'opacity 0.25s ease',
            }}
          >
            <motion.div
              style={{
                display: 'flex',
                flexDirection: isLandscapeMobile ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isLandscapeMobile ? '16px' : '6px',
                width: '100%',
                maxWidth: isLandscapeMobile ? '820px' : '480px',
                margin: 'auto 0',
              }}
              initial={{ x: isLandscapeMobile ? -400 : -800, y: isLandscapeMobile ? 0 : 280, opacity: 0, scale: 0.4 }}
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
                  width: isLandscapeMobile
                    ? '92px'
                    : isSmallPortrait
                      ? '135px'
                      : '175px',
                  height: 'auto',
                  filter: 'drop-shadow(0 16px 24px rgba(0,0,0,0.65))',
                  cursor: 'pointer',
                  userSelect: 'none',
                  flexShrink: 0,
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
                  resetTimer();
                }}
                style={{
                  background: '#ffffff',
                  border: '3.5px solid #0f172a',
                  borderRadius: '24px',
                  padding: isLandscapeMobile ? '14px 18px' : '20px 24px',
                  color: '#0f172a',
                  width: isLandscapeMobile ? '520px' : '460px',
                  maxWidth: isLandscapeMobile ? 'calc(100% - 110px)' : '94vw',
                  boxShadow: '0 20px 35px rgba(0,0,0,0.4), 6px 6px 0px #0f172a',
                  marginTop: isLandscapeMobile ? '0' : '8px',
                  position: 'relative',
                  lineHeight: 1.45,
                  textAlign: 'left',
                }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 140 }}
              >
                {/* Flèche BD pointant vers la mascotte */}
                {!isLandscapeMobile && (
                  <>
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
                  </>
                )}
                {isLandscapeMobile && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        left: '-20px',
                        top: '36px',
                        width: 0,
                        height: 0,
                        borderTop: '12px solid transparent',
                        borderBottom: '12px solid transparent',
                        borderRight: '20px solid #ffffff',
                        zIndex: 2,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: '-25px',
                        top: '33px',
                        width: 0,
                        height: 0,
                        borderTop: '15px solid transparent',
                        borderBottom: '15px solid transparent',
                        borderRight: '25px solid #0f172a',
                        zIndex: 1,
                      }}
                    />
                  </>
                )}

                {/* En-tête de la bulle : Titre aligné à gauche et points IT alignés à droite */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: isLandscapeMobile ? '8px' : '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: isLandscapeMobile ? '0.95rem' : '1.05rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {currentTitle}
                    </h4>
                    {isReplayMode && (
                      <span
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#b45309',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ⏳ Rattrapage Cycle {replayedCycleIndex}
                      </span>
                    )}
                    {isReplayMode && onExitReplay && (
                      <button
                        type="button"
                        onClick={() => {
                          onExitReplay();
                          onClose();
                        }}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.4)',
                          backgroundColor: 'rgba(241, 245, 249, 0.9)',
                          color: '#475569',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Quitter le rattrapage et revenir au cycle en cours"
                      >
                        Retour cycle actif
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: timeLeft <= 15 ? '#ef4444' : '#64748b',
                        background: timeLeft <= 15 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        border: `1px solid ${timeLeft <= 15 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(100, 116, 139, 0.25)'}`,
                        whiteSpace: 'nowrap',
                      }}
                      title="Temps restant avant fermeture automatique (se réinitialise à 60s à chaque frappe)"
                    >
                      ⏱️ {timeLeft}s
                    </span>
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
                      +{effectiveRewardPointsIT} IT
                    </span>
                    <button
                      type="button"
                      onClick={onClose}
                      title="Fermer la bulle"
                      style={{
                        background: 'rgba(241, 245, 249, 0.95)',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748b',
                        padding: 0,
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = '#fca5a5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(241, 245, 249, 0.95)';
                        e.currentTarget.style.color = '#64748b';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Alerte Retard Accumulation (conditionnée : retard > 4 uniquement) */}
                {showRolloverWarning && unsolvedRolloverCount && unsolvedRolloverCount > 4 && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1.5px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#b91c1c',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    <AlertTriangle size={15} color="#dc2626" />
                    <span>
                      Anomalies accumulées : <strong>{unsolvedRolloverCount} œufs non résolus</strong> en attente de déchiffrage !
                    </span>
                  </div>
                )}

                {/* Sélecteur d'Œufs du Cycle : Symboles d'œufs compacts avec Tooltip */}
                {visibleCycleEggs.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      overflowX: 'auto',
                      marginBottom: '10px',
                      paddingBottom: '4px',
                      paddingTop: '2px',
                    }}
                  >
                    {visibleCycleEggs.map((egg: CycleEggItem, idx: number) => {
                      const isSelected = idx === selectedEggIndex;
                      const isDone = !!egg.isDiscovered;
                      const isLocked = egg.isInteractable === false && !isDone;
                      const tooltipText = `#${idx + 1} : ${egg.title}${isDone ? ' (Résolu ✓)' : isLocked ? ' (Verrouillé 🔒)' : ' (À résoudre)'}`;

                      return (
                        <div key={egg.id} style={{ position: 'relative', display: 'inline-flex' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedEggIndex(idx)}
                            title={tooltipText}
                            onMouseEnter={() => setHoveredEggIndex(idx)}
                            onMouseLeave={() => setHoveredEggIndex(null)}
                            style={{
                              width: '32px',
                              height: '36px',
                              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                              border: isSelected
                                ? '2.5px solid #0284c7'
                                : isDone
                                  ? '1.5px solid #10b981'
                                  : isLocked
                                    ? '1.5px solid #94a3b8'
                                    : '1.5px solid #cbd5e1',
                              background: isSelected
                                ? '#e0f2fe'
                                : isDone
                                  ? '#ecfdf5'
                                  : isLocked
                                    ? '#f1f5f9'
                                    : '#f8fafc',
                              boxShadow: isSelected
                                ? '0 0 10px rgba(2, 132, 199, 0.45)'
                                : '0 1px 3px rgba(0,0,0,0.06)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isDone ? '0.85rem' : '0.95rem',
                              transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                              transition: 'all 0.18s ease',
                              padding: 0,
                              outline: 'none',
                              opacity: isLocked ? 0.6 : 1,
                            }}
                          >
                            <span>{isDone ? '✓' : isLocked ? '🔒' : '🥚'}</span>
                          </button>

                          {/* Tooltip au survol */}
                          {hoveredEggIndex === idx && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginBottom: '6px',
                                background: '#0f172a',
                                color: '#ffffff',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                zIndex: 50,
                                pointerEvents: 'none',
                              }}
                            >
                              {tooltipText}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: '50%',
                                  marginLeft: '-4px',
                                  width: 0,
                                  height: 0,
                                  borderLeft: '4px solid transparent',
                                  borderRight: '4px solid transparent',
                                  borderTop: '4px solid #0f172a',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Badge Alerte 2ème Indice Débloqué si hh:mm écoulé */}
                {!isEggLocked && currentShowExplicitHint && currentExplicitHint && (
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
                    color: isEggLocked ? '#64748b' : currentShowExplicitHint ? '#92400e' : '#1e293b',
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
                {!isEggLocked && currentImageUrl && (
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
                          src={currentImageUrl}
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
                      Résoudre
                    </button>
                  </div>
                )}

                {/* Zone interactive de saisie ou statut verrouillé */}
                {isEggLocked ? (
                  <div
                    style={{
                      background: '#0f172a',
                      borderRadius: '14px',
                      padding: '20px 16px',
                      color: '#ffffff',
                      border: '2px dashed #475569',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1.5px solid rgba(239, 68, 68, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        color: '#f87171',
                      }}
                    >
                      <Lock size={22} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f87171', marginBottom: '6px' }}>
                      Énigme Actuellement Verrouillée
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                      {currentPrereqDesc
                        ? `Conditions de déblocage : ${currentPrereqDesc}`
                        : 'Accomplissez vos missions prioritaires dans le jeu pour débloquer l’accès à cette énigme.'}
                    </p>
                  </div>
                ) : (effectiveTriggerType === 'RIDDLE_ANSWER_INPUT' ||
                  effectiveTriggerType === 'COMM_LINK_COMMAND' ||
                  effectiveIsDiscovered ||
                  localSuccess) ? (
                  <div
                    style={{
                      background: '#0f172a',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      color: '#ffffff',
                      border: '2px solid #334155',
                    }}
                  >
                    {effectiveIsDiscovered || localSuccess ? (
                      /* État Succès : Énigme résolue avec animation wow */
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
                          <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                          <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                          <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                borderRadius: '50%',
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
                            color: effectiveTriggerType === 'KONAMI_CODE' ? '#fb7185' : effectiveTriggerType === 'COMM_LINK_COMMAND' ? '#38bdf8' : '#34d399',
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
                              : "Anomalie temporelle neutralisée. Partagez la découverte avec votre équipe pour remporter le bonus collectif !"}
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
                    ) : effectiveTriggerType === 'RIDDLE_ANSWER_INPUT' ? (
                      /* Formulaire de saisie des 4 chiffres (Cadenas Cryptex conservé) */
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
                              onFocus={() => {
                                resetTimer();
                              }}
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
                    ) : (
                      /* Formulaire de saisie d'ordre / commande textuelle premium (COMM_LINK_COMMAND & KONAMI_CODE) */
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                          }}
                        >
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Terminal size={14} />
                            COMMANDE OU MOT-CLÉ DIRECT
                          </span>
                          <span style={{ fontSize: '0.70rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 7px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700 }}>
                            DIRECT PROTOCOL
                          </span>
                        </div>

                        {/* Champ texte avec secousse en cas d'erreur */}
                        <motion.div
                          animate={showErrorShake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                          transition={{ duration: 0.5 }}
                          style={{ marginBottom: '12px' }}
                        >
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              value={commandInput}
                              onChange={(e) => {
                                resetTimer();
                                setErrorMessage(null);
                                setCommandInput(e.target.value);
                              }}
                              onKeyDown={(e) => {
                                resetTimer();
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCommandSubmit();
                                }
                              }}
                              onFocus={() => {
                                resetTimer();
                              }}
                              placeholder="Saisissez votre commande ou mot-clé (ex: /matrix)..."
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                background: '#1e293b',
                                border: `2px solid ${showErrorShake ? '#ef4444' : commandInput ? '#38bdf8' : '#475569'}`,
                                borderRadius: '10px',
                                color: '#ffffff',
                                fontSize: '0.92rem',
                                fontWeight: 600,
                                padding: '10px 14px',
                                outline: 'none',
                                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                                boxShadow: commandInput ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
                              }}
                            />
                          </div>
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

                        {/* Bouton Valider Commande */}
                        <button
                          type="button"
                          onClick={handleCommandSubmit}
                          disabled={isVerifyingCommand || !commandInput.trim()}
                          style={{
                            width: '100%',
                            background: isVerifyingCommand || !commandInput.trim()
                              ? '#475569'
                              : 'linear-gradient(135deg, #0284c7, #0369a1)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            cursor: isVerifyingCommand || !commandInput.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: commandInput.trim() ? '0 4px 12px rgba(2, 132, 199, 0.35)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isVerifyingCommand && commandInput.trim()) e.currentTarget.style.filter = 'brightness(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isVerifyingCommand && commandInput.trim()) e.currentTarget.style.filter = 'none';
                          }}
                        >
                          <Terminal size={16} />
                          {isVerifyingCommand ? 'Vérification en cours...' : 'TRANSMETTRE LA COMMANDE'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Panneau de Déduction Agrandit (Modal Centré sur Mobile & Tablettes, Docké à droite sur Desktop Large) */}
                <MascotLightbox
                  showLightbox={showLightbox}
                  setShowLightbox={setShowLightbox}
                  currentImageUrl={currentImageUrl}
                  isDesktopWide={isDesktopWide}
                  isLandscapeMobile={isLandscapeMobile}
                  effectiveTriggerType={effectiveTriggerType}
                  digits={digits}
                  lightboxInputRefs={lightboxInputRefs}
                  handleDigitChange={handleDigitChange}
                  handleKeyDown={handleKeyDown}
                  resetTimer={resetTimer}
                  showErrorShake={showErrorShake}
                  errorMessage={errorMessage}
                  handleSubmitAnswer={handleSubmitAnswer}
                  isVerifying={isVerifying}
                />
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
