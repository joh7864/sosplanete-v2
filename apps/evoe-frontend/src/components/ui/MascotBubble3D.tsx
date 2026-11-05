import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { preloadUnlockAudio } from '../../utils/easterEggAudio';
import LockWowAnimation from './LockWowAnimation';
import { MascotLightbox } from './mascot/MascotLightbox';
import { MascotVictoryPanel } from './mascot/MascotVictoryPanel';
import { MascotInteractiveArea } from './mascot/MascotInteractiveArea';
import { MascotHeader } from './mascot/MascotHeader';
import { MascotLockedPanel } from './mascot/MascotLockedPanel';
import { MascotSchemaThumbnail } from './mascot/MascotSchemaThumbnail';
import { useViewportDimensions } from './mascot/useViewportDimensions';
import { useMascotForm } from './mascot/useMascotForm';
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
  const [showLightbox, setShowLightbox] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const initialDuration = 60;
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [selectedEggIndex, setSelectedEggIndex] = useState(0);

  const { isLandscapeMobile, isDesktopWide, isSmallPortrait } = useViewportDimensions();

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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

  const {
    digits,
    commandInput,
    setCommandInput,
    isVerifying,
    isVerifyingCommand,
    errorMessage,
    setErrorMessage,
    showErrorShake,
    localSuccess,
    isCryptexActive,
    setIsCryptexActive,
    inputRefs,
    lightboxInputRefs,
    handleDigitChange,
    handleKeyDown,
    handleSubmitAnswer,
    handleCommandSubmit,
    resetFormState,
  } = useMascotForm({
    currentEggId,
    effectiveTriggerType,
    onVerifyAnswer,
    onVerifyCommand,
    onSuccess,
    resetTimer,
    setShowLightbox,
  });

  useEffect(() => {
    resetFormState();
    setShowLightbox(false);
  }, [selectedEggIndex, currentEggId, isOpen, resetFormState]);

  // Effet machine à écrire
  useEffect(() => {
    if (!isOpen) {
      setDisplayedText('');
      setIsTypingComplete(false);
      resetFormState();
      setShowLightbox(false);
      setActiveTooltip(null);
      setTimeLeft(initialDuration);
      return;
    }

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
  }, [isOpen, currentMessage, initialDuration, resetFormState]);

  // Compte à rebours de 60 secondes
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Animation Cryptex Da Vinci flottante sans boîte */}
          {isCryptexActive &&
            typeof document !== 'undefined' &&
            createPortal(
              <LockWowAnimation onClose={() => setIsCryptexActive(false)} />,
              document.body,
            )}

          {/* Overlay Conteneur Mascotte */}
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
                type: 'spring',
                stiffness: 240,
                damping: 24,
                mass: 0.8,
              }}
            >
              {/* Mascotte Gribouille sur hoverboard (Cliquer dessus ferme la bulle) */}
              <motion.img
                src={mascotImageUrl}
                alt="Mascotte Gribouille"
                onClick={onClose}
                title="Cliquer sur la mascotte pour fermer"
                style={{
                  width: isLandscapeMobile
                    ? '100px'
                    : isSmallPortrait
                      ? '140px'
                      : '185px',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 18px 28px rgba(0, 0, 0, 0.65))',
                  cursor: 'pointer',
                  userSelect: 'none',
                  flexShrink: 0,
                  marginBottom: isLandscapeMobile ? '0' : '-8px',
                  zIndex: 2,
                }}
                animate={{ y: [0, -8, 0], rotateZ: [-2, 2, -2] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />

              {/* Bulle de Dialogue Principale */}
              <motion.div
                style={{
                  width: '100%',
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: isLandscapeMobile ? '16px' : '20px',
                  padding: isLandscapeMobile ? '12px 14px' : '16px 18px',
                  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.4) inset',
                  border: '2px solid rgba(14, 165, 233, 0.3)',
                  position: 'relative',
                }}
              >
                <MascotHeader
                  currentTitle={currentTitle}
                  isLandscapeMobile={isLandscapeMobile}
                  isReplayMode={isReplayMode}
                  replayedCycleIndex={replayedCycleIndex}
                  onExitReplay={onExitReplay}
                  onClose={onClose}
                  timeLeft={timeLeft}
                  effectiveRewardPointsIT={effectiveRewardPointsIT}
                  showRolloverWarning={showRolloverWarning}
                  unsolvedRolloverCount={unsolvedRolloverCount}
                />

                {/* Badge Alerte 2ème Indice Débloqué si hh:mm écoulé */}
                {!isEggLocked && currentShowExplicitHint && currentExplicitHint && (
                  <div className="mascot-hint-alert">
                    <Sparkles size={16} color="#d97706" />
                    <span>Signal 2070 amplifié : 2ème indice explicite reçu !</span>
                  </div>
                )}

                {/* Corps du message de la mascotte (effet machine à écrire) */}
                <div
                  onClick={handleSkipTyping}
                  className={`mascot-message-text ${isTypingComplete ? '' : 'clickable'} ${
                    isEggLocked ? 'locked' : currentShowExplicitHint ? 'hint-active' : 'normal'
                  }`}
                  title={isTypingComplete ? '' : 'Cliquez pour afficher tout le texte'}
                >
                  {displayedText}
                  {!isTypingComplete && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.4 }}
                      className="mascot-typing-cursor"
                    >
                      |
                    </motion.span>
                  )}
                </div>

                {/* Vignette Schéma / Infographie */}
                {!isEggLocked && currentImageUrl && (
                  <MascotSchemaThumbnail
                    currentImageUrl={currentImageUrl}
                    onOpenLightbox={() => setShowLightbox(true)}
                  />
                )}

                {/* Zone interactive de saisie ou statut verrouillé */}
                {isEggLocked ? (
                  <MascotLockedPanel currentPrereqDesc={currentPrereqDesc} />
                ) : (effectiveTriggerType === 'RIDDLE_ANSWER_INPUT' ||
                  effectiveTriggerType === 'COMM_LINK_COMMAND' ||
                  effectiveIsDiscovered ||
                  localSuccess) ? (
                  <div className="mascot-interactive-box">
                    {effectiveIsDiscovered || localSuccess ? (
                      <MascotVictoryPanel
                        effectiveTriggerType={effectiveTriggerType}
                        effectiveRewardPointsIT={effectiveRewardPointsIT}
                        currentEggId={currentEggId}
                        setIsCryptexActive={setIsCryptexActive}
                        onReplayVictoryAnimation={onReplayVictoryAnimation}
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                        onClose={onClose}
                        onOpenCommLink={onOpenCommLink}
                      />
                    ) : (
                      <MascotInteractiveArea
                        effectiveTriggerType={effectiveTriggerType}
                        digits={digits}
                        inputRefs={inputRefs}
                        handleDigitChange={handleDigitChange}
                        handleKeyDown={handleKeyDown}
                        resetTimer={resetTimer}
                        showErrorShake={showErrorShake}
                        errorMessage={errorMessage}
                        setErrorMessage={setErrorMessage}
                        handleSubmitAnswer={handleSubmitAnswer}
                        isVerifying={isVerifying}
                        commandInput={commandInput}
                        setCommandInput={setCommandInput}
                        handleCommandSubmit={handleCommandSubmit}
                        isVerifyingCommand={isVerifyingCommand}
                      />
                    )}
                  </div>
                ) : null}

                {/* Panneau de Déduction Agrandit (Lightbox) */}
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
