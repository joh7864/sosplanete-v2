import { useState, useCallback } from 'react';
import { useEasterEgg } from './useEasterEgg';
import { useEasterEggTriggers } from './useEasterEggTriggers';
import type { ChronoPeriodItem } from '../components/ui/ChronoEggModal';
import type { EcoThemeId } from '../components/ui/TemporalEchoModal';

interface UseEasterEggFlowProps {
  setChatActiveTab: (tab: string) => void;
  setChatOpen: (open: boolean) => void;
}

export function useEasterEggFlow({ setChatActiveTab, setChatOpen }: UseEasterEggFlowProps) {
  const {
    activeEggData,
    hasUnread: hasUnreadEasterEgg,
    hasSeenEnigma,
    markEnigmaAsSeen,
    verifyAnswer: verifyEasterEggAnswer,
    interactWithEgg,
    fetchActiveEgg,
    exitReplayMode,
    validateTrigger,
    fetchChronoEggArchive,
    reopenPeriodEgg,
    submitMetaEnigmaCode,
  } = useEasterEgg();

  const [showMascotBubble, setShowMascotBubble] = useState(false);
  const [showEggCelebration, setShowEggCelebration] = useState(false);
  const [celebrationEgg, setCelebrationEgg] = useState<{
    code?: string;
    triggerType?: string;
    title: string;
    pointsIT: number;
    isTeamRewarded?: boolean;
    remainingPlayers?: number;
  } | null>(null);
  const [prefilledChatText, setPrefilledChatText] = useState<string | null>(null);

  // Méta-Énigme 2070 & Modales Spéciales
  const [showChronoEggModal, setShowChronoEggModal] = useState(false);
  const [showRosettaStoneModal, setShowRosettaStoneModal] = useState(false);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [showTemporalEchoModal, setShowTemporalEchoModal] = useState(false);
  const [selectedEchoTheme, setSelectedEchoTheme] = useState<EcoThemeId>('ENERGY');
  const [chronoPeriods, setChronoPeriods] = useState<ChronoPeriodItem[]>([]);
  const [chronoLoading, setChronoLoading] = useState(false);

  // Salle d'Arcade & Mini-Jeux
  const [unlockedArcadeGames, setUnlockedArcadeGames] = useState<string[]>([]);
  const [showArcadeHub, setShowArcadeHub] = useState(false);
  const [showArcadeCabinet, setShowArcadeCabinet] = useState(false);
  const [arcadeSelectedGameKey, setArcadeSelectedGameKey] = useState<string>('space-invaders');

  const handleOpenChronoEgg = async () => {
    setShowChronoEggModal(true);
    setChronoLoading(true);
    try {
      const res = await fetchChronoEggArchive();
      if (res && res.periods) {
        setChronoPeriods(res.periods);
      }
    } finally {
      setChronoLoading(false);
    }
  };

  const handleReplayPeriod = async (periodId: number) => {
    try {
      const res = await reopenPeriodEgg(periodId);
      if (res?.success) {
        setShowChronoEggModal(false);
        setShowMascotBubble(true);
      }
    } catch (err: any) {
      console.error('Erreur rattrapage temporel:', err);
    }
  };

  const handleOpenVision2050 = (theme?: EcoThemeId) => {
    if (!activeEggData?.metaEnigma?.isMetaEnigmaUnlocked) {
      return;
    }
    if (theme) setSelectedEchoTheme(theme);
    setShowTemporalEchoModal(true);
  };

  const handleEasterEggTrigger = async (triggerType: string, metadata?: any, targetEggId?: number) => {
    let triggeredEgg = targetEggId
      ? activeEggData?.cycleEggs?.find((e) => e.id === targetEggId)
      : undefined;
    if (!triggeredEgg && activeEggData?.cycleEggs) {
      triggeredEgg = activeEggData.cycleEggs.find(
        (e) => e.triggerType === triggerType && (!metadata?.target || e.triggerConfig?.target === metadata.target),
      );
    }
    if (
      !triggeredEgg &&
      activeEggData?.easterEgg?.triggerType === triggerType &&
      activeEggData.easterEgg.isInteractable !== false
    ) {
      triggeredEgg = activeEggData.easterEgg;
    }

    if (!triggeredEgg || triggeredEgg.isInteractable === false) {
      return;
    }

    const result = await validateTrigger(triggerType as any, metadata, undefined, triggeredEgg?.id);
    if (result.success) {
      const unlockedMiniGame = (result as any).unlockedMiniGame as string | undefined;
      if (unlockedMiniGame) {
        setUnlockedArcadeGames((prev) => Array.from(new Set([...prev, unlockedMiniGame])));
      }
      const freshEgg = await fetchActiveEgg();
      const remaining =
        (result as any).remainingPlayers ??
        (freshEgg?.teamProgress
          ? Math.max(0, (freshEgg.teamProgress.requiredPlayers || 2) - (freshEgg.teamProgress.discoveredCount || 0))
          : undefined);

      if (triggeredEgg) {
        setCelebrationEgg({
          code: triggeredEgg.code,
          triggerType: triggeredEgg.triggerType,
          title: triggeredEgg.title,
          pointsIT: triggeredEgg.rewardPointsIT || 60,
          isTeamRewarded: !!freshEgg?.teamProgress?.isTeamRewarded,
          remainingPlayers: remaining,
        });
      }
      setShowEggCelebration(true);
      setChatActiveTab('team');
      const title = triggeredEgg?.title || activeEggData?.easterEgg?.title || '2070';
      if (freshEgg && freshEgg.teamProgress?.isTeamRewarded) {
        setPrefilledChatText(`Victoire ! Notre équipe a validé l'Easter Egg "${title}" et remporté les points IT ! 🎉`);
      } else if (remaining && remaining > 0) {
        setPrefilledChatText(`J'ai trouvé la solution de l'Easter Egg "${title}" ! Venez vite valider, il manque encore ${remaining} joueur${remaining > 1 ? 's' : ''} pour remporter les points IT ! 🚀`);
      } else {
        setPrefilledChatText(`J'ai découvert le déclencheur de l'Easter Egg "${title}" ! Venez vite valider pour débloquer les points IT de l'équipe ! 🚀`);
      }
    }
  };

  const isCurrentKonamiExplicitHint = Boolean(
    activeEggData?.easterEgg?.isExplicitHintVisible ||
    activeEggData?.cycleEggs?.some((e) => (e.triggerType === 'KONAMI_CODE' || e.code === 'EE_KONAMI_80S') && e.isExplicitHintVisible)
  );

  const {
    konamiHUD,
    handleKonamiButtonPress,
    handleCloseKonamiHUD,
    handleLogoMouseDown,
    handleLogoMouseUpOrLeave,
    handleGlobeClick,
    handleCodexConsoleClick,
    handleCommLinkCommand,
    handleEraSwitch,
    handleMetricClick,
    handleStarClick,
  } = useEasterEggTriggers({
    activeTriggerType: activeEggData?.easterEgg?.triggerType,
    triggerConfig: activeEggData?.easterEgg?.triggerConfig,
    activeEggCode: activeEggData?.easterEgg?.code,
    cycleEggs: activeEggData?.cycleEggs,
    isCurrentEggDiscovered: !!activeEggData?.playerProgress?.isDiscovered,
    isCurrentEggInteractable:
      activeEggData?.hasAnyInteractable !== undefined
        ? activeEggData.hasAnyInteractable
        : activeEggData?.easterEgg?.isInteractable === true,
    isExplicitHintVisible: isCurrentKonamiExplicitHint,
    onTrigger: handleEasterEggTrigger,
  });

  const handleVerifyCommand = useCallback(
    async (commandStr: string, targetEggId?: number): Promise<{ success: boolean; message?: string }> => {
      const raw = (commandStr || '').trim().toLowerCase();
      if (!raw) return { success: false, message: 'Veuillez saisir une commande ou un mot-clé.' };

      const cleanCmd = raw.replace(/^[!/]+/, '').trim();

      let cmdEgg = targetEggId ? activeEggData?.cycleEggs?.find((e) => e.id === targetEggId) : undefined;
      if (!cmdEgg) {
        cmdEgg = activeEggData?.cycleEggs?.find((e) => {
          const expectedConfig = ((e.triggerConfig as any)?.command || '').trim().toLowerCase().replace(/^[!/]+/, '');
          const expectedAnswer = ((e as any)?.expectedAnswer || '').trim().toLowerCase().replace(/^[!/]+/, '');
          return (
            (expectedConfig && cleanCmd === expectedConfig) ||
            (expectedAnswer && cleanCmd === expectedAnswer) ||
            (e.code === 'EE_TEMPORAL_1985' && cleanCmd === '1985') ||
            (e.code === 'EE_MATRIX_COMM_LINK' && cleanCmd === 'matrix') ||
            (e.code === 'EE_ANTIGRAVITY' && cleanCmd === 'antigravity') ||
            (e.code === 'EE_PARTY_DISCO' && cleanCmd === 'party')
          );
        }) || (activeEggData?.easterEgg?.triggerType === 'COMM_LINK_COMMAND' ? activeEggData.easterEgg : undefined);
      }

      if (!cmdEgg) {
        return {
          success: false,
          message: 'Mot-clé ou commande non reconnu. Croisez attentivement vos indices.',
        };
      }

      const result = await validateTrigger('COMM_LINK_COMMAND', { command: `!${cleanCmd}`, source: 'bubble_input' }, undefined, cmdEgg.id);
      if (result.success) {
        const freshEgg = await fetchActiveEgg(true);
        setCelebrationEgg({
          code: cmdEgg.code,
          triggerType: cmdEgg.triggerType,
          title: cmdEgg.title,
          pointsIT: cmdEgg.rewardPointsIT || 60,
          isTeamRewarded: !!freshEgg?.teamProgress?.isTeamRewarded,
        });
        setShowEggCelebration(true);
        setChatActiveTab('team');
        setChatOpen(true);
        const title = cmdEgg.title || 'Easter Egg 2070';
        if (freshEgg && freshEgg.teamProgress?.isTeamRewarded) {
          setPrefilledChatText(`Victoire ! Notre équipe a validé l'ordre "${title}" et remporté les points IT ! 🎉`);
        } else {
          setPrefilledChatText(`J'ai découvert l'ordre "${title}" ! Venez vite valider pour débloquer les points IT de l'équipe ! 🚀`);
        }
        return { success: true };
      }

      return {
        success: false,
        message: result.message || 'Erreur lors de la validation du protocole.',
      };
    },
    [activeEggData, validateTrigger, fetchActiveEgg, setChatActiveTab, setChatOpen, setPrefilledChatText, setShowEggCelebration],
  );

  return {
    activeEggData,
    hasUnreadEasterEgg,
    hasSeenEnigma,
    markEnigmaAsSeen,
    verifyEasterEggAnswer,
    interactWithEgg,
    fetchActiveEgg,
    exitReplayMode,
    validateTrigger,
    fetchChronoEggArchive,
    reopenPeriodEgg,
    submitMetaEnigmaCode,
    showMascotBubble,
    setShowMascotBubble,
    showEggCelebration,
    setShowEggCelebration,
    celebrationEgg,
    setCelebrationEgg,
    prefilledChatText,
    setPrefilledChatText,
    showChronoEggModal,
    setShowChronoEggModal,
    showRosettaStoneModal,
    setShowRosettaStoneModal,
    showTerminalModal,
    setShowTerminalModal,
    showTemporalEchoModal,
    setShowTemporalEchoModal,
    selectedEchoTheme,
    setSelectedEchoTheme,
    chronoPeriods,
    chronoLoading,
    unlockedArcadeGames,
    setUnlockedArcadeGames,
    showArcadeHub,
    setShowArcadeHub,
    showArcadeCabinet,
    setShowArcadeCabinet,
    arcadeSelectedGameKey,
    setArcadeSelectedGameKey,
    handleOpenChronoEgg,
    handleReplayPeriod,
    handleOpenVision2050,
    handleEasterEggTrigger,
    isCurrentKonamiExplicitHint,
    konamiHUD,
    handleKonamiButtonPress,
    handleCloseKonamiHUD,
    handleLogoMouseDown,
    handleLogoMouseUpOrLeave,
    handleGlobeClick,
    handleCodexConsoleClick,
    handleCommLinkCommand,
    handleEraSwitch,
    handleMetricClick,
    handleStarClick,
    handleVerifyCommand,
  };
}
