import { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, RefreshCw, X, RotateCcw } from 'lucide-react';
import Portal2026 from './components/Portal2026';
import Portal2070 from './components/Portal2070';
import { useAuth } from './context/AuthContext';
import { evoeClient } from './lib/api';
import Login from './pages/Login';
import TemporalBriefing from './components/TemporalBriefing';
import ChatPanel from './components/ChatPanel';
import { OnboardingGuide } from './components/ui/OnboardingGuide';
import { MissionsCarousel3D } from './components/ui/MissionsCarousel3D';
import { ChallengesCarousel3D } from './components/ui/ChallengesCarousel3D';
import { OrbitalSectorRibbon } from './components/ui/OrbitalSectorRibbon';
import { MissionSearchBar } from './components/ui/MissionSearchBar';
import { TopHud } from './components/ui/TopHud';
import { MobileBottomNav } from './components/ui/MobileBottomNav';
import { ClosedPeriodAlertModal } from './components/ui/ClosedPeriodAlertModal';
import { Dashboard2070Overlays } from './components/ui/Dashboard2070Overlays';

import { preloadEvoeAssets } from './utils/preloadAssets';
import pkg from '../package.json';

// Hooks & UI Components
import { useEvoeData } from './hooks/useEvoeData';
import { Dashboard2026Loader } from './components/ui/Dashboard2026Loader';

import { MissionsWeekModal } from './components/ui/MissionsWeekModal';
import { type ChronoPeriodItem } from './components/ui/ChronoEggModal';
import { AboutModal } from './components/ui/AboutModal';
import { useBirthday } from './hooks/useBirthday';
import { GribouilleBirthdayBubble } from './components/birthday/GribouilleBirthdayBubble';
import { type EcoThemeId } from './components/ui/TemporalEchoModal';
import { useEasterEgg } from './hooks/useEasterEgg';
import { applyArcadeCatalog } from './components/arcade';
import { useEasterEggTriggers } from './hooks/useEasterEggTriggers';
import { EasterEggModalsLayer } from './components/ui/EasterEggModalsLayer';
import { lazy, Suspense } from 'react';
const AgentProfileModal = lazy(() => import('./components/ui/AgentProfileModal').then(m => ({ default: m.AgentProfileModal })));
const ChallengeModal = lazy(() => import('./components/ui/ChallengeModal').then(m => ({ default: m.ChallengeModal })));
const ConfirmCancelModal = lazy(() => import('./components/ui/ConfirmCancelModal').then(m => ({ default: m.ConfirmCancelModal })));

import './App.css';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

import { parseBold } from './utils/format';

function MainApp() {
  const {
    era, handleSwitchEra: baseHandleSwitchEra,
    isTransitioning,
    selectedSector, setSelectedSector,
    isCodexCollapsed, setIsCodexCollapsed,
    expandedMission, setExpandedMission,
    popoverPos, setPopoverPos,
    showBriefing, setShowBriefing,
    extrapolation,
    dashboardStatus,
    showExtrapolation, setShowExtrapolation,
    showRadar, setShowRadar,
    isResettingPropulsion,
    earthOracleLevel, setEarthOracleLevel,
    earthOracleText, setEarthOracleText,
    earthOracleTyping, setEarthOracleTyping,
    codexTab, setCodexTab,
    challenges,
    loadingChallenges,
    isGlitching,
    loadingMissionId,
    showChallengeModal, setShowChallengeModal,
    challengeTargetTeamId, setChallengeTargetTeamId,
    challengeLocalActionId, setChallengeLocalActionId,
    challengePledge, setChallengePledge,
    challengeDurationHours, setChallengeDurationHours,
    challengeError, setChallengeError,
    isSubmittingChallenge,
    cancelMissionConfirm, setCancelMissionConfirm,
    showNoPeriodModal, setShowNoPeriodModal,
    selectedProfileId, setSelectedProfileId,
    allowPortrait, setAllowPortrait,
    isStealthMode, toggleStealthMode,
    isUnbridledDpr, toggleUnbridledDpr,
    onlineUsers, setOnlineUsers,
    unreadChat, setUnreadChat,
    chatOpen, setChatOpen,
    chatActiveTab, setChatActiveTab,
    isEvoeDataLoading,
    fetchEvoeData, fetchChallenges,
    handleImpulseMission, handleCancelMission,
    handleSendChallenge, handleRespondChallenge,
    handleResetPropulsion, handleCompleteBriefing
  } = useEvoeData();

  const [scrollToUnreadTrigger, setScrollToUnreadTrigger] = useState<number | null>(null);
  const [searchCloseTrigger, setSearchCloseTrigger] = useState<number | null>(null);

  // Mémorisation via sessionStorage : le loader ne s'affiche qu'une seule fois par session d'onglet.
  // Si l'onglet est fermé ou rafraîci manuellement (F5), il revient normalement.
  const [loader2026Dismissed, setLoader2026Dismissed] = useState(
    () => sessionStorage.getItem('evoe_loader2026_dismissed') === 'true'
  );

  const dismissLoader = () => {
    sessionStorage.setItem('evoe_loader2026_dismissed', 'true');
    setLoader2026Dismissed(true);
  };

  const [view2026, setView2026] = useState<'codex' | 'leaderboard'>('codex');
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'all' | 'period'>('all');
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showMissionsWeekModal, setShowMissionsWeekModal] = useState(false);
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [selectedRadarTeamId, setSelectedRadarTeamId] = useState<number | string | null>(null);
  const [searchedPlayerId, setSearchedPlayerId] = useState<number | string | null>(null);


  // Easter Egg System
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

  // Bridage intelligent du ratio de pixels (DPR) : [1, 1.25] par défaut pour garantir 60 FPS, débridable si configuré
  const dpr = useMemo<[number, number]>(() => {
    const maxDpr = isUnbridledDpr ? 2 : 1.25;
    const winDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    return [1, Math.min(winDpr, maxDpr)];
  }, [isUnbridledDpr]);

  // Boucle 3D adaptative : frameloop="demand" lorsque des modales lourdes masquent la scène 3D
  const isHeavyModalOpen = Boolean(
    selectedProfileId ||
    showOnboardingGuide ||
    showAboutModal ||
    showMissionsWeekModal ||
    showChallengeModal ||
    showChronoEggModal ||
    showRosettaStoneModal ||
    showTerminalModal ||
    showTemporalEchoModal ||
    showArcadeHub ||
    showArcadeCabinet ||
    showNoPeriodModal ||
    cancelMissionConfirm ||
    showEggCelebration ||
    (selectedSector && (codexTab === 'missions' || codexTab === 'challenges') && !isCodexCollapsed)
  );

  const handleReplayPeriod = async (periodId: number) => {
    try {
      const res = await reopenPeriodEgg(periodId);
      if (res?.success) {
        setShowChronoEggModal(false);
        // Ne pas appeler fetchActiveEgg() ici pour conserver l'énigme du cycle sélectionné
        setShowMascotBubble(true);
      }
    } catch (err: any) {
      console.error('Erreur rattrapage temporel:', err);
    }
  };

  const handleOpenVision2050 = (theme?: EcoThemeId) => {
    // Prevent access if the meta-enigma is locked
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
    if (!triggeredEgg) {
      triggeredEgg = activeEggData?.easterEgg;
    }

    const result = await validateTrigger(triggerType as any, metadata, undefined, triggeredEgg?.id);
    if (result.success) {
      // Artefact unique de l'énigme : mini-jeu débloqué pour l'équipe (défini côté admin)
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
    isExplicitHintVisible: isCurrentKonamiExplicitHint,
    onTrigger: handleEasterEggTrigger,
  });

  const handleVerifyCommand = useCallback(
    async (commandStr: string, targetEggId?: number): Promise<{ success: boolean; message?: string }> => {
      const raw = (commandStr || '').trim().toLowerCase();
      if (!raw) return { success: false, message: 'Veuillez saisir une commande ou un mot-clé.' };

      const cleanCmd = raw.replace(/^[!/]+/, '').trim();

      // Cas Commande Comm-Link / Mot-clé parmi les œufs du cycle (Le Konami Code s'exécute uniquement par la séquence physique ou touches arcade)
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
    [activeEggData, validateTrigger, fetchActiveEgg, setChatActiveTab, setPrefilledChatText, setShowEggCelebration],
  );

  const handleSwitchEra = () => {
    handleEraSwitch();
    baseHandleSwitchEra();
  };

  const handleVesselClick = (teamId: number | string) => {
    if (teamId === null || teamId === undefined) return;
    setShowRadar(true);
    setSelectedRadarTeamId((prev) => (prev !== null && prev !== undefined && String(prev) === String(teamId) ? null : teamId));
  };

  useEffect(() => {
    preloadEvoeAssets();
  }, []);

  useEffect(() => {
    if (selectedRadarTeamId !== null && showRadar) {
      setTimeout(() => {
        const el = document.getElementById(`radar-team-${selectedRadarTeamId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [selectedRadarTeamId, showRadar]);

  const handleSelectSector = (sector: string) => {
    if (childInfos && childInfos.isPeriodOpen === false) {
      setShowNoPeriodModal(true);
      return;
    }
    setSelectedSector(sector);
    setMissionSearchQuery('');
    setIsMobileSearchOpen(false);
    setCodexTab('missions');
    setIsCodexCollapsed(false);
    setView2026('codex');
    setChatOpen(false);
    setSelectedProfileId(null);
  };


  // Callback pour basculer automatiquement les onglets pendant la visite guidée (11 étapes)
  const handleNavigateGuideStep = (stepIndex: number) => {
    setSelectedProfileId(null);

    if (stepIndex === 0) { // Étape 1: Bienvenue & Profil Agent
      if (era !== '2026') handleSwitchEra();
      setView2026('codex');
      setSelectedSector(null);
      setIsCodexCollapsed(true);
      setShowExtrapolation(false);
      setShowRadar(false);
      setChatOpen(false);
    } else if (stepIndex === 1) { // Étape 2: Passerelle & Orbes 3D
      if (era !== '2026') handleSwitchEra();
      setView2026('codex');
      setSelectedSector(null);
      setIsCodexCollapsed(true);
      setShowExtrapolation(false);
      setShowRadar(false);
      setChatOpen(false);
    } else if (stepIndex === 2 || stepIndex === 3) { // Étape 3 & 4: Codex & Impulsion + Puissance des IT
      if (era !== '2026') handleSwitchEra();
      setView2026('codex');
      setCodexTab('missions');
      setIsCodexCollapsed(false);
      setShowExtrapolation(false);
      setShowRadar(false);
      setChatOpen(false);
      const cats = missionsByCategory ? Object.keys(missionsByCategory) : [];
      if (cats.length > 0 && !selectedSector) setSelectedSector(cats[0]);
    } else if (stepIndex === 4) { // Étape 5: Arène des Défis (Lune 3D)
      if (era !== '2026') handleSwitchEra();
      setView2026('codex');
      setSelectedSector(null); // Fermeture complète du Codex pour voir la Lune 3D
      setIsCodexCollapsed(true);
      setShowExtrapolation(false);
      setShowRadar(false);
      setChatOpen(false);
    } else if (stepIndex === 5) { // Étape 6: TERRE 2070 : % RÉGÉNÉRÉE
      if (era !== '2026') handleSwitchEra();
      setView2026('codex');
      setSelectedSector(null); // Fermeture complète du Codex pour voir la jauge
      setIsCodexCollapsed(true);
      setShowExtrapolation(false);
      setShowRadar(false);
      setChatOpen(false);
    } else if (stepIndex === 6) { // Étape 7: Projection Temporelle (Bascule 2070)
      if (era !== '2070') handleSwitchEra();
      setSelectedSector(null);
      setIsCodexCollapsed(true);
      setShowExtrapolation(false); // Laisser fermé pour voir la Terre 2070 et la bascule
      setShowRadar(false);
      setChatOpen(false);
    } else if (stepIndex === 7) { // Étape 8: Extrapolation 2070 (Bilan d'impact)
      if (era !== '2070') handleSwitchEra();
      setSelectedSector(null);
      setIsCodexCollapsed(true);
      setShowExtrapolation(true); // Ouvrir le volet Extrapolation ici
      setShowRadar(false);
      setChatOpen(false);
    } else if (stepIndex === 8) { // Étape 9: Radar Temporel (Constantes & Vaisseaux)
      if (era !== '2070') handleSwitchEra();
      setSelectedSector(null);
      setIsCodexCollapsed(true);
      setShowExtrapolation(false);
      setShowRadar(true); // Ouvrir le volet Radar ici
      setChatOpen(false);
    } else if (stepIndex === 9) { // Étape 10: Podium 3D & Leaderboard
      if (era !== '2026') handleSwitchEra();
      setView2026('leaderboard');
      setSelectedSector(null); // Fermeture complète du Codex pour voir le Podium 3D
      setIsCodexCollapsed(true);
      setShowExtrapolation(false);
      setShowRadar(false);
      setChatOpen(false);
    } else if (stepIndex === 10) { // Étape 11: Com-Link (Chat Spatial)
      if (era !== '2026') handleSwitchEra();
      setView2026('codex');
      setSelectedSector(null);
      setIsCodexCollapsed(true);
      setShowExtrapolation(false);
      setShowRadar(false);
      setChatOpen(true);
    } else if (stepIndex === 11) { // Étape 12: Groupe WhatsApp Équipe
      if (era !== '2026') handleSwitchEra();
      setView2026('codex');
      setSelectedSector(null);
      setIsCodexCollapsed(true);
      setShowExtrapolation(false);
      setShowRadar(false);
      setChatOpen(false);
    }
  };


  // --- Gestion de l'orientation mobile ---
  const [isPhysicalPortrait, setIsPhysicalPortrait] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const onOrientationChange = () => {
      setTimeout(() => {
        setIsPhysicalPortrait(window.innerHeight > window.innerWidth);
      }, 150);
    };
    window.addEventListener('resize', onOrientationChange);
    window.addEventListener('orientationchange', onOrientationChange);
    return () => {
      window.removeEventListener('resize', onOrientationChange);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, []);

  // Verrouillage natif désactivé : l'orientation est gérée par le manifest PWA ("any")
  // et par le bouton dédié dans le header. screen.orientation.lock() était redondant
  // et empêchait le portrait sur les appareils qui le supportent.

  const showPortraitOverlay = !allowPortrait && isPhysicalPortrait;
  // ---------------------------------------


  const { user, childInfos, pseudo, missions, logoutUser, instanceChoices, players, instanceId } = useAuth();
  const currentUserId = childInfos?.id || childInfos?.childId || pseudo || user || 'default_agent';

  // Année active du Dashboard calculée dynamiquement (schoolYear ou année civile courante)
  const currentYear = useMemo(() => {
    const sy = childInfos?.schoolYear || childInfos?.group?.team?.instanceYear?.schoolYear || dashboardStatus?.schoolYear;
    if (sy && typeof sy === 'string') {
      const parts = sy.split('-');
      if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        return Number(parts[1]);
      }
    }
    return new Date().getFullYear();
  }, [childInfos, dashboardStatus]);

  const isDashboard2026Ready = Boolean(
    !isEvoeDataLoading &&
    dashboardStatus &&
    childInfos &&
    missions &&
    missions.length > 0
  );

  const impulsedMissionsCount = useMemo(() => {
    return missions?.filter((m: any) => m.evoeMission?.isImpulsed)?.length || 0;
  }, [missions]);

  // L'early return doit être après tous les hooks
  const shouldRedirect = !user || instanceChoices;

  // hasSeenOnboarding : source de vérité côté serveur (via childInfos), localStorage en cache local
  const hasSeenOnboarding: boolean = (childInfos as any)?.hasSeenOnboarding === true;

  // Lancement automatique du guide d'onboarding spécifique à l'utilisateur connecté
  useEffect(() => {
    if (!currentUserId || shouldRedirect || hasSeenOnboarding) return;
    const userKey = `evoe_has_seen_onboarding_v2_${currentUserId}`;
    const hasSeen = localStorage.getItem(userKey);
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowOnboardingGuide(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, shouldRedirect, hasSeenOnboarding]);

  // Récupération des jeux d'arcade débloqués par l'équipe du joueur
  useEffect(() => {
    let isMounted = true;
    const fetchUnlockedArcade = async () => {
      try {
        const BASE_API_URL = (
          import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy'
        ).replace('/legacy', '');
        const res = await evoeClient.get<{ unlockedGames: string[] }>(
          `${BASE_API_URL}/arcade/unlocked`,
        );
        if (isMounted && res.data?.unlockedGames) {
          setUnlockedArcadeGames(res.data.unlockedGames);
        }
        // Catalogue centralisé des mini-jeux (titres, couleurs…) fourni par le backend
        const catalog = await evoeClient.get<{ games: Parameters<typeof applyArcadeCatalog>[0] }>(
          `${BASE_API_URL}/arcade/games`,
        );
        if (isMounted && catalog.data?.games) {
          applyArcadeCatalog(catalog.data.games);
        }
      } catch {
        // Silencieux si non connecté
      }
    };

    if (user) {
      fetchUnlockedArcade();
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Fermer le pop-over holographique si on clique n'importe où en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mission-popover') && !target.closest('.mission-card')) {
        setExpandedMission(null);
      }
    };
    if (expandedMission) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedMission]);

  // 2.A — Récupérer les données de projection / course / défis avec suspension intelligente
  const isArcadeOpen = Boolean(showArcadeCabinet || showArcadeHub);

  useEffect(() => {
    fetchEvoeData();
    if (era === '2026') {
      fetchChallenges();
    }

    const poll = () => {
      // Suspension du polling si onglet masqué ou si borne/hub arcade ouvert
      if (document.hidden || isArcadeOpen) {
        return;
      }
      if (era === '2070') {
        fetchEvoeData(true);
      } else if (era === '2026') {
        fetchEvoeData(true);
        fetchChallenges(true);
      }
    };

    const interval = setInterval(poll, 10000);

    // Rattrapage immédiat lors du retour sur l'onglet
    const handleVisibilityChange = () => {
      if (!document.hidden && !isArcadeOpen) {
        if (era === '2070') {
          fetchEvoeData(true);
        } else if (era === '2026') {
          fetchEvoeData(true);
          fetchChallenges(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [era, instanceId, isArcadeOpen]);



  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  // ---- Messages Oracle Terrestre ----
  const EARTH_ORACLE_MESSAGES: Record<number, string> = {
    1: `La Terre de 2070 est silencieuse... Les archives des Agents Temporels ont été retrouvées dans les ruines. Leur courage a laissé une trace. Mais le temps manque encore. Revenez à ${currentYear} — chaque action compte.`,
    2: `Les premiers signes de vie réapparaissent sur la Terre de 2070. Des forêts timides, de l’eau plus pure. La mission avance. Mais les Agents ont encore le pouvoir d’écrire la suite. Chaque geste en ${currentYear} résonne ici.`,
    3: `La Terre de 2070 reprend son souffle. Les rivières coulent à nouveau, les villes verdissent. Les Agents de ${currentYear} ont changé le cours du temps. Continuez — le futur vous entend.`,
    4: `En 2070, la Terre respire. Vos actions à ${currentYear} ont réécrit notre avenir. Les écosystèmes se reconstituent, la biodiversité revient. Vous avez accompli ce que beaucoup croyaient impossible.`,
    5: "La vie a triomphé sur la Terre de 2070. Les Archives des Agents Temporels sont gravées dans l’histoire de l’humanité. Vous avez sauvé notre futur. Le voyage se termine ici — en victoire.",
  };

  const handleEarthClick = (level: number) => {
    setEarthOracleLevel(level);
    setEarthOracleText('');
    setEarthOracleTyping(true);
    const fullText = EARTH_ORACLE_MESSAGES[level] || '';
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setEarthOracleText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setEarthOracleTyping(false);
      }
    }, 28);
  };

  // Trouver les informations de profil du Gardien connecté
  const currentPlayer = players?.find(p => p.id === childInfos?.id || p.childId === childInfos?.id);
  const myTeamId = currentPlayer?.teamId || childInfos?.group?.teamId;

  // Système d'Anniversaire de l'Agent Temporel (Option D)
  const {
    isBirthdayActive,
    isCatchup: isBirthdayCatchup,
    isLate: isBirthdayLate,
    boostsRemaining: birthdayBoostsRemaining,
    hasCelebrationPending: hasBirthdayCelebrationPending,
    hasLateModalPending: hasBirthdayLateModalPending,
    wishes: birthdayWishes,
    acknowledgeCelebration: acknowledgeBirthdayCelebration,
    consumeBoost: consumeBirthdayBoost,
  } = useBirthday(
    childInfos?.id,
    childInfos?.birthDate || currentPlayer?.birthDate,
    currentPlayer?.birthdayCelebratedYear ?? (childInfos as any)?.birthdayCelebratedYear,
    currentPlayer?.birthdayCelebratedDate ?? (childInfos as any)?.birthdayCelebratedDate,
  );

  // Mascotte Gribouille pour l'anniversaire (soi-même ou un coéquipier)
  const [gribouilleBirthdayPlayer, setGribouilleBirthdayPlayer] = useState<any | null>(null);

  // Apparition automatique de Gribouille après l'affichage du dashboard 2026
  useEffect(() => {
    if ((hasBirthdayCelebrationPending || hasBirthdayLateModalPending) && loader2026Dismissed && currentPlayer) {
      const timer = setTimeout(() => {
        setGribouilleBirthdayPlayer(currentPlayer);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [hasBirthdayCelebrationPending, hasBirthdayLateModalPending, loader2026Dismissed, currentPlayer]);

  const handleSelectBirthdayCake = (player: any) => {
    setGribouilleBirthdayPlayer(player);
  };

  const handleCloseGribouille = () => {
    if (
      gribouilleBirthdayPlayer &&
      (gribouilleBirthdayPlayer.id === childInfos?.id || gribouilleBirthdayPlayer.childId === childInfos?.id || gribouilleBirthdayPlayer.isCurrent)
    ) {
      if (hasBirthdayCelebrationPending) {
        acknowledgeBirthdayCelebration(false);
      } else if (hasBirthdayLateModalPending) {
        acknowledgeBirthdayCelebration(true);
      }
    }
    setGribouilleBirthdayPlayer(null);
  };

  const handleShareBirthdayWithTeam = () => {
    handleCloseGribouille();
    setPrefilledChatText(`🎂 C'est mon anniversaire aujourd'hui ! Le Commandement m'a activé un boost x2 sur mes 3 prochaines missions pour faire grimper notre vaisseau ! 🚀🎉`);
    setChatActiveTab('team');
    setChatOpen(true);
  };

  const handleWishTeammateBirthday = async (targetPseudo: string) => {
    const targetPlayer = gribouilleBirthdayPlayer;
    handleCloseGribouille();
    setPrefilledChatText(`🎂 Joyeux anniversaire ${targetPseudo} ! Que la force cosmique soit avec toi aujourd'hui ! 🎉🚀`);
    setChatActiveTab('team');
    setChatOpen(true);

    // Enregistrement du message de souhait en base (conservé pendant 3 périodes)
    if (targetPlayer?.id) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/birthday/wish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            recipientId: Number(targetPlayer.id),
            message: `Joyeux anniversaire ${targetPseudo} ! 🎉 Que la force cosmique soit avec toi !`,
            senderAvatar: currentPlayer?.avatar,
            senderTeamColor: currentPlayer?.color || '#3b82f6',
          }),
        });
      } catch (err) {
        console.warn('[BirthdayWish] Erreur envoi souhait en base:', err);
      }
    }
  };

  const handleImpulseMissionWithBirthday = async (missionId: number) => {
    if (isBirthdayActive && birthdayBoostsRemaining > 0) {
      consumeBirthdayBoost();
    }
    await handleImpulseMission(missionId);
  };

  const enrichedPlayers = useMemo(() => {
    if (!players) return [];
    return players.map((p: any) => {
      if (p.id === childInfos?.id || p.childId === childInfos?.id) {
        return { ...p, isBirthdayActive };
      }
      return p;
    });
  }, [players, childInfos?.id, isBirthdayActive]);

  const activeChallengeActionIds = challenges
    .filter(c => c.status === 'ACCEPTED' && c.targetTeamId === myTeamId)
    .map(c => c.localActionId);

  // Grouper les missions par categorySF. On exclut les défis actifs car ils auront leur propre section en haut.
  const missionsByCategory = missions?.reduce((acc: Record<string, any[]>, mission: any) => {
    const isChallengeActif = activeChallengeActionIds.includes(mission.id);
    if (isChallengeActif) return acc; // Exclus des catégories classiques
    
    const cat = mission.categorySF || 'Inconnu';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mission);
    return acc;
  }, {});

  // Filtrage mémoïsé pour la recherche de mission (sur toutes les missions de l'instance)
  const searchedMissions = useMemo(() => {
    const rawQ = missionSearchQuery.trim();
    if (!rawQ || !missions) return [];
    
    const normalize = (str?: string | null) => 
      (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const q = normalize(rawQ);

    return missions.filter((m: any) => {
      const titreSF = normalize(m.evoeMission?.titreSF);
      const label = normalize(m.label);
      const descSF = normalize(m.evoeMission?.descriptionSF);
      const desc = normalize(m.description);
      const catSF = normalize(m.categorySF);
      const cat = normalize(m.category);

      return (
        titreSF.includes(q) ||
        label.includes(q) ||
        descSF.includes(q) ||
        desc.includes(q) ||
        catSF.includes(q) ||
        cat.includes(q)
      );
    });
  }, [missions, missionSearchQuery]);

  const receivedChallenges = challenges.filter(c => c.targetTeamId === myTeamId);
  const sentChallenges = challenges.filter(c => c.challengerTeamId === myTeamId);
  const otherTeams = dashboardStatus?.teams?.filter((t: any) => t.id !== myTeamId) || [];
  const myTeam = dashboardStatus?.teams?.find((t: any) => t.id === myTeamId) || childInfos?.group?.team;
  const whatsappInviteUrl = childInfos?.group?.team?.whatsappInviteUrl || myTeam?.whatsappInviteUrl || childInfos?.whatsappInviteUrl || childInfos?.whatsappCommunityUrl || dashboardStatus?.whatsappCommunityUrl;


  
  
  const availableMissionsForChallenge = missions || [];

  const formatRemainingTime = (expiresAtStr?: string | null) => {
    if (!expiresAtStr) return null;
    const diffMs = new Date(expiresAtStr).getTime() - Date.now();
    if (diffMs <= 0) return 'Expiré';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      return `${days}j ${remHours}h`;
    }
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getAvatarUrl = () => {
    if (currentPlayer?.avatar && currentPlayer.avatar !== 'avatars/default.png') {
      return `${EVOE_IMG_URL}${currentPlayer.avatar}`;
    }
    let hash = 0;
    const name = childInfos?.pseudo || '';
    for (let i = 0; i < name.length; i++) {
      hash += name.charCodeAt(i);
    }
    
    // Approximation de l'âge à partir de birthDate si disponible
    let age = 18;
    if (currentPlayer?.birthDate) {
      age = new Date().getFullYear() - new Date(currentPlayer.birthDate).getFullYear();
    }

    // Détermination du genre
    let genre = '';
    if (currentPlayer?.gender === 'EF') {
      genre = 'EF';
    } else if (currentPlayer?.gender === 'EH') {
      genre = 'EH';
    } else if (currentPlayer?.gender === 'E' || age < 15) {
      genre = (hash % 2 === 0) ? 'EF' : 'EH';
    } else if (currentPlayer?.gender === 'F') {
      genre = 'F';
    } else if (currentPlayer?.gender === 'M') {
      genre = 'H';
    } else {
      const genres = ['EF', 'EH', 'F', 'H'];
      genre = genres[hash % 4];
    }

    let file = '';
    if (genre === 'EF') {
      const idx = (hash % 3) + 1;
      file = `EF_avatar_0${idx}.png`;
    } else if (genre === 'EH') {
      const idx = (hash % 3) + 1;
      file = `EH_avatar_0${idx}.png`;
    } else if (genre === 'F') {
      const idx = (hash % 12) + 1;
      file = `F_avatar_${idx.toString().padStart(2, '0')}.png`;
    } else { // 'H'
      const idx = (hash % 21) + 1;
      file = `H_avatar_0${idx}.png`;
    }

    return `${EVOE_IMG_URL}avatars_3D/${file}`;
  };

  // Calcul du pourcentage de la période d'été (1er Juillet - 30 Septembre / ~3 mois) pour la jauge EOD
  const getEodPercent = (dateStr: string) => {
    if (!dateStr) return 50;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const date = new Date(Date.UTC(year, month, day));
      const start = new Date(Date.UTC(year, 0, 1));
      const diff = date.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      
      // Fenêtre zoomée sur 3 mois : 1er Juillet (jour 182) au 30 Septembre (jour 273)
      const winStart = 182;
      const winSpan = 91;
      const percent = ((dayOfYear - winStart) / winSpan) * 100;
      return Math.min(96, Math.max(4, percent));
    }
    return 50;
  };

  const eodN1Percent = extrapolation ? getEodPercent(extrapolation.dateDepassementSans) : 35.2;
  const eodNPercent = extrapolation ? getEodPercent(extrapolation.dateDepassement) : 48.4;

  const handleSelectPlayer = (player: any) => {
    // Si une recherche de joueur était active (joueur positionné face à l'écran avec les cercles),
    // le clic sur ce joueur sélectionné doit ouvrir sa fiche profil, repositionner le cercle et fermer la recherche.
    if (searchedPlayerId !== null) {
      setSearchedPlayerId(null);
      setSearchCloseTrigger(Date.now());
      setSelectedProfileId(player.childId || player.id);
      return;
    }

    const isMe = player.childId === childInfos?.id || player.id === childInfos?.id || player.isCurrent;
    
    if (isMe) {
      // Priorité 1 : message privé (le premier trouvé dans les MP)
      const unreadMpUsers = Object.keys(unreadChat.unreadMps || {}).filter(k => (unreadChat.unreadMps?.[k] || 0) > 0);
      if (unreadMpUsers.length > 0) {
        setChatActiveTab(`mp:${unreadMpUsers[0]}`);
        setChatOpen(true);
        setScrollToUnreadTrigger(Date.now());
        return;
      }

      // Priorité 2 : message d'équipe (inter-équipes ou interne)
      const unreadTeamNames = Object.keys(unreadChat.unreadTeams || {}).filter(k => (unreadChat.unreadTeams?.[k] || 0) > 0);
      if (unreadChat.team > 0 || unreadTeamNames.length > 0) {
        setChatActiveTab(unreadTeamNames.length > 0 ? `team:${unreadTeamNames[0]}` : 'team');
        setChatOpen(true);
        setScrollToUnreadTrigger(Date.now());
        return;
      }

      // Priorité 3 : message système
      if (unreadChat.system > 0) {
        setChatActiveTab('system');
        setChatOpen(true);
        setScrollToUnreadTrigger(Date.now());
        return;
      }
      
      // Priorité 4 : message global
      if (unreadChat.global > 0) {
        setChatActiveTab('global');
        setChatOpen(true);
        setScrollToUnreadTrigger(Date.now());
        return;
      }
    } else {
      // Si on clique sur un autre joueur
      const pseudo = player.pseudo.toLowerCase();
      // S'il a envoyé un message non lu, on ouvre directement son salon de chat
      if ((unreadChat.unreadMps?.[pseudo] || 0) > 0) {
        setChatActiveTab(`mp:${pseudo}`);
        setChatOpen(true);
        setScrollToUnreadTrigger(Date.now());
        return;
      }
    }
    
    // Comportement par défaut si pas de message : ouvrir la fiche profil
    setSelectedProfileId(player.childId || player.id);
  };

  const handleSelectEnvelope = useCallback((player?: any) => {
    // Priorité stricte au clic sur l'enveloppe :
    // 1. Privée perso
    const unreadMpUsers = Object.keys(unreadChat.unreadMps || {}).filter(k => (unreadChat.unreadMps?.[k] || 0) > 0);
    const clickedPseudo = player?.pseudo?.toLowerCase();
    const targetMp = (clickedPseudo && (unreadChat.unreadMps?.[clickedPseudo] || 0) > 0)
      ? clickedPseudo
      : unreadMpUsers[0];

    if (targetMp) {
      setChatActiveTab(`mp:${targetMp}`);
      setChatOpen(true);
      setScrollToUnreadTrigger(Date.now());
      return;
    }

    // 2. Équipe
    const unreadTeamNames = Object.keys(unreadChat.unreadTeams || {}).filter(k => (unreadChat.unreadTeams?.[k] || 0) > 0);
    if (unreadChat.team > 0 || unreadTeamNames.length > 0) {
      setChatActiveTab(unreadTeamNames.length > 0 ? `team:${unreadTeamNames[0]}` : 'team');
      setChatOpen(true);
      setScrollToUnreadTrigger(Date.now());
      return;
    }

    // 3. Système
    if (unreadChat.system > 0) {
      setChatActiveTab('system');
      setChatOpen(true);
      setScrollToUnreadTrigger(Date.now());
      return;
    }

    // 4. Général
    if (unreadChat.global > 0) {
      setChatActiveTab('global');
      setChatOpen(true);
      setScrollToUnreadTrigger(Date.now());
      return;
    }

    // Fallback par défaut si cliqué sans non-lu
    setChatActiveTab('team');
    setChatOpen(true);
    setScrollToUnreadTrigger(Date.now());
  }, [unreadChat, setChatActiveTab, setChatOpen]);

  const handleSearchMatchChange = useCallback((player: any | null) => {
    const targetId = player ? (player.childId || player.id) : null;
    setSearchedPlayerId((prev) => (prev === targetId ? prev : targetId));
  }, []);

  return (
    <div className="app-container">

      {/* Overlay Portrait — affiché quand le mode paysage est requis et l'appareil est en portrait */}
      {showPortraitOverlay && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(4, 8, 18, 0.97)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <RotateCcw size={64} color="#00ffcc" style={{ animation: 'spin 3s linear infinite' }} />
          <div>
            <h2 style={{ color: '#00ffcc', fontFamily: '"Courier New", monospace', fontSize: '1.1rem', margin: '0 0 8px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Mode Paysage Requis
            </h2>
            <p style={{ color: 'rgba(160,174,192,0.8)', fontSize: '0.875rem', margin: 0 }}>
              Tournez votre appareil pour accéder au portail temporel.
            </p>
          </div>
          <button
            onClick={() => { setAllowPortrait(true); localStorage.setItem('evoe_allow_portrait', 'true'); }}
            style={{
              marginTop: '8px',
              background: 'transparent',
              border: '1px solid rgba(160,174,192,0.35)',
              color: 'rgba(160,174,192,0.6)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            Autoriser le mode Portrait
          </button>
        </div>
      )}

      {showBriefing && childInfos?.youtubeBriefingUrl && (
        <TemporalBriefing 
          onComplete={(skipNextTime) => handleCompleteBriefing(!!skipNextTime)} 
          youtubeUrl={childInfos.youtubeBriefingUrl} 
          childId={childInfos.id}
        />
      )}

      {/* Glitch Écran Temporel */}
      {isGlitching && <div className="screen-glitch" />}

      {/* Écran de Chargement Haute Définition / Barre de progression Dashboard */}
      <AnimatePresence>
        {era === '2026' && !loader2026Dismissed && (
          <Dashboard2026Loader
            isReady={isDashboard2026Ready}
            currentYear={currentYear}
            maxDurationMs={4000}
            onComplete={dismissLoader}
          />
        )}
      </AnimatePresence>

      {/* Three.js Canvas Container */}
      <div className="canvas-container">
        <Canvas 
          camera={{ position: [0, 2.4, 10.9], fov: 60 }} 
          dpr={dpr}
          frameloop={isHeavyModalOpen ? 'demand' : 'always'}
          gl={{
            powerPreference: 'high-performance',
            antialias: true,
            alpha: true,
            stencil: false,
            depth: true,
            precision: 'highp',
          }}
        >
          {era === '2026' && (
            <Portal2026 
              isActive={true}
              focusedPlayerId={searchedPlayerId}
              categories={missionsByCategory ? Object.keys(missionsByCategory) : []} 
              onSelectSector={handleSelectSector} 
              onSelectPlayer={handleSelectPlayer}
              onGlobeClick={handleGlobeClick}
              onCodexConsoleClick={handleCodexConsoleClick}
              onStarClick={handleStarClick}
              onSelectChallenges={() => {
                if (childInfos && childInfos.isPeriodOpen === false) {
                  setShowNoPeriodModal(true);
                  return;
                }
                setSelectedProfileId(null);
                setChatOpen(false);
                setCodexTab('challenges');
                setIsCodexCollapsed(false);
                if (era !== '2026') handleSwitchEra();
                if (!selectedSector) {
                  const cats = missionsByCategory ? Object.keys(missionsByCategory) : [];
                  if (cats.length > 0) setSelectedSector(cats[0]);
                }
              }}
              onSelectChallengeBadge={() => {
                if (childInfos && childInfos.isPeriodOpen === false) {
                  setShowNoPeriodModal(true);
                  return;
                }
                setSelectedProfileId(null);
                setChatOpen(false);
                setCodexTab('challenges');
                setIsCodexCollapsed(false);
                if (era !== '2026') handleSwitchEra();
                if (!selectedSector) {
                  const cats = missionsByCategory ? Object.keys(missionsByCategory) : [];
                  if (cats.length > 0) setSelectedSector(cats[0]);
                }
              }}
              onlineUsers={onlineUsers}
              unreadTeam={unreadChat.team}
              unreadGlobal={unreadChat.global}
              unreadSystem={unreadChat.system}
              unreadMps={unreadChat.unreadMps}
              onSelectEnvelope={handleSelectEnvelope}
              isMobile={isMobile}
              view={view2026}
              leaderboardTimeframe={leaderboardTimeframe}
              dashboardStatus={dashboardStatus}
              challenges={challenges}
              missionsWeekCount={impulsedMissionsCount}
              isStealthMode={isStealthMode}
              onToggleStealth={toggleStealthMode}
              customPlayersList={enrichedPlayers}
              onSelectBirthdayCake={handleSelectBirthdayCake}
              onSelectMissionsWeek={() => {
                setSelectedProfileId(null);
                setChatOpen(false);
                setShowMissionsWeekModal(true);
              }}
              onCloseLeaderboard={() => setView2026('codex')}
            />
          )}
          {era === '2070' && (
            <Portal2070 
              isActive={true}
              dashboardStatus={dashboardStatus} 
              selectedTeamId={selectedRadarTeamId}
              onEarthClick={handleEarthClick} 
              onVesselClick={handleVesselClick}
              isMobile={isMobile}
            />
          )}
        </Canvas>
      </div>

      {/* Oracle Terrestre — Overlay machine à écrire au clic sur la Terre */}
      {era === '2070' && earthOracleLevel !== null && (
        <div
          onClick={() => setEarthOracleLevel(null)}
          style={{
            position: 'fixed',
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            maxWidth: '560px',
            width: '90vw',
            background: 'rgba(5, 10, 22, 0.88)',
            border: '1px solid rgba(0, 255, 204, 0.4)',
            borderRadius: '16px',
            padding: '20px 24px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(0, 255, 204, 0.12), 0 20px 50px rgba(0,0,0,0.7)',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.18em', color: '#00ffcc', textTransform: 'uppercase', textShadow: '0 0 8px rgba(0,255,204,0.5)' }}>
              🌍 Oracle Terrestre — 2070
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(160,174,192,0.6)', fontStyle: 'italic' }}>Cliquer pour fermer</span>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            lineHeight: '1.7',
            color: '#e2e8f0',
            fontFamily: '"Courier New", Courier, monospace',
            minHeight: '60px',
          }}>
            {earthOracleText}
            {earthOracleTyping && <span style={{ display: 'inline-block', width: '2px', height: '1em', background: '#00ffcc', marginLeft: '2px', animation: 'blink 0.7s step-end infinite', verticalAlign: 'text-bottom' }} />}
          </p>
        </div>
      )}

      {/* Transition Effect (Flash Visière Vif & Fluide) */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="transition-overlay"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 35, opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* UI Overlay HTML */}
      <div className="ui-overlay">
        <TopHud
          childInfos={childInfos}
          setSelectedProfileId={setSelectedProfileId}
          getAvatarUrl={getAvatarUrl}
          currentPlayer={currentPlayer}
          unreadChat={unreadChat}
          handleLogoMouseDown={handleLogoMouseDown}
          handleLogoMouseUpOrLeave={handleLogoMouseUpOrLeave}
          era={era}
          activeEggData={activeEggData}
          hasUnreadEasterEgg={hasUnreadEasterEgg}
          hasSeenEnigma={hasSeenEnigma}
          markEnigmaAsSeen={markEnigmaAsSeen}
          setShowMascotBubble={setShowMascotBubble}
          interactWithEgg={interactWithEgg}
          fetchActiveEgg={fetchActiveEgg}
          handleOpenChronoEgg={handleOpenChronoEgg}
          isBirthdayActive={isBirthdayActive}
          view2026={view2026}
          isPhysicalPortrait={isPhysicalPortrait}
          leaderboardTimeframe={leaderboardTimeframe}
          setLeaderboardTimeframe={setLeaderboardTimeframe}
          dashboardStatus={dashboardStatus}
          players={players}
          setSearchedPlayerId={setSearchedPlayerId}
          handleSearchMatchChange={handleSearchMatchChange}
          searchCloseTrigger={searchCloseTrigger}
          isMobile={isMobile}
          handleSwitchEra={handleSwitchEra}
          isTransitioning={isTransitioning}
          currentYear={currentYear}
          setChatOpen={setChatOpen}
          setShowExtrapolation={setShowExtrapolation}
          setShowRadar={setShowRadar}
          setView2026={setView2026}
          whatsappInviteUrl={whatsappInviteUrl}
          setShowOnboardingGuide={setShowOnboardingGuide}
          setShowAboutModal={setShowAboutModal}
          logoutUser={logoutUser}
          pkgVersion={pkg.version}
          isUnbridledDpr={isUnbridledDpr}
          toggleUnbridledDpr={toggleUnbridledDpr}
          unlockedArcadeGames={unlockedArcadeGames}
          setShowArcadeHub={setShowArcadeHub}
        />



        {/* CONTENU 2026 : Le Codex Temporel (Panel UI) */}
        {era === '2026' && selectedSector && (codexTab === 'missions' || codexTab === 'challenges') && !isCodexCollapsed ? (
          <div style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100dvh',
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            padding: isMobile ? 0 : '20px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: isMobile ? '100vw' : 'min(1040px, 94vw)',
              height: isMobile ? '100dvh' : 'min(700px, calc(100dvh - 40px))',
              background: 'rgba(10, 15, 30, 0.94)',
              border: isMobile ? 'none' : '1px solid rgba(0, 255, 204, 0.2)',
              borderRadius: isMobile ? 0 : '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)',
              animation: 'popup-scale 0.3s ease-out forwards',
            }}>
              {/* En-tête HUD responsive — flexShrink:0 garantit qu'il ne se réduit pas */}
              <div style={{
                display: 'flex',
                position: 'relative',
                zIndex: 20,
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                padding: isMobile ? '8px 12px 6px' : '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                gap: isMobile ? '6px' : '12px',
                background: 'rgba(0, 255, 204, 0.02)',
                flexShrink: 0
              }}>
                {/* Ligne 1 sur Mobile: Titre + Contrôles (Loupe + Fermer) / Gauche sur Desktop */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <h2 style={{
                    margin: 0,
                    color: '#fff',
                    fontSize: isMobile ? '1.05rem' : '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                    whiteSpace: 'nowrap'
                  }}>
                    Missions & Défis
                  </h2>

                  {isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MissionSearchBar
                        value={missionSearchQuery}
                        onChange={(val) => {
                          setMissionSearchQuery(val);
                          if (val && codexTab !== 'missions') {
                            setCodexTab('missions');
                          }
                        }}
                        isMobile={true}
                        isOpenMobile={isMobileSearchOpen}
                        onToggleMobile={(open) => {
                          setIsMobileSearchOpen(open);
                        }}
                        resultsCount={searchedMissions.length}
                      />

                      <button 
                        onClick={() => {
                          setSelectedSector(null);
                          setMissionSearchQuery('');
                          setIsMobileSearchOpen(false);
                        }}
                        style={{
                          background: 'rgba(255, 100, 100, 0.1)',
                          border: '1px solid rgba(255,100,100,0.4)',
                          borderRadius: '50%',
                          width: '34px',
                          height: '34px',
                          color: '#ff6666',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'auto'
                        }}
                        title="Fermer"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Ruban des secteurs — Ligne 2 mobile, inline desktop */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  justifyContent: isMobile ? 'flex-start' : 'center',
                  overflowX: 'auto',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  flex: isMobile ? 'none' : '1 1 auto',
                  minWidth: 0
                }}>
                  <OrbitalSectorRibbon 
                    categories={[...(missionsByCategory ? Object.keys(missionsByCategory) : []), 'Défis']}
                    selectedSector={missionSearchQuery.trim() ? null : (codexTab === 'challenges' ? 'Défis' : selectedSector)}
                    onSelect={(sector) => {
                      setMissionSearchQuery('');
                      setIsMobileSearchOpen(false);
                      if (sector === 'Défis') {
                        setCodexTab('challenges');
                      } else {
                        setCodexTab('missions');
                        setSelectedSector(sector);
                      }
                    }}
                  />

                  {!isMobile && (
                    <>
                      <MissionSearchBar
                        value={missionSearchQuery}
                        onChange={(val) => {
                          setMissionSearchQuery(val);
                          if (val && codexTab !== 'missions') {
                            setCodexTab('missions');
                          }
                        }}
                        isMobile={false}
                        resultsCount={searchedMissions.length}
                      />

                      <button 
                        onClick={() => {
                          setSelectedSector(null);
                          setMissionSearchQuery('');
                          setIsMobileSearchOpen(false);
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(255,100,100,0.5)',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          color: '#ff6666',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'auto',
                          flexShrink: 0
                        }}
                        title="Fermer"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Corps du popup — height:100% transmet la hauteur au carousel enfant */}
              <div style={{
                flex: 1,
                minHeight: 0,
                position: 'relative',
                height: '100%',
              }}>
                {missionSearchQuery.trim().length > 0 ? (
                  <MissionsCarousel3D
                    missions={searchedMissions}
                    loadingMissionId={loadingMissionId}
                    selectedSector={`search_${missionSearchQuery}`}
                    isSearchMode={true}
                    onClearSearch={() => {
                      setMissionSearchQuery('');
                      setIsMobileSearchOpen(false);
                    }}
                    onImpulse={(id) => handleImpulseMission(id)}
                    onCancelConfirm={(actionDoneId, label) => setCancelMissionConfirm({actionDoneId, label})}
                    onOpenMissionsWeek={() => setShowMissionsWeekModal(true)}
                    onOpenVision2050={handleOpenVision2050}
                    isVision2050Unlocked={!!activeEggData?.metaEnigma?.isMetaEnigmaUnlocked}
                  />
                ) : codexTab === 'missions' ? (
                  <MissionsCarousel3D
                    missions={missionsByCategory?.[selectedSector] || []}
                    loadingMissionId={loadingMissionId}
                    selectedSector={selectedSector}
                    onImpulse={(id) => handleImpulseMission(id)}
                    onCancelConfirm={(actionDoneId, label) => setCancelMissionConfirm({actionDoneId, label})}
                    onOpenMissionsWeek={() => setShowMissionsWeekModal(true)}
                    onOpenVision2050={handleOpenVision2050}
                    isVision2050Unlocked={!!activeEggData?.metaEnigma?.isMetaEnigmaUnlocked}
                  />
                ) : (
                  <ChallengesCarousel3D
                    receivedChallenges={receivedChallenges}
                    sentChallenges={sentChallenges}
                    missions={availableMissionsForChallenge}
                    loadingMissionId={loadingMissionId}
                    onRespond={handleRespondChallenge}
                    onImpulse={(id) => handleImpulseMission(id)}
                    onSendChallenge={() => {
                      if (childInfos && childInfos.isPeriodOpen === false) {
                        setShowNoPeriodModal(true);
                      } else {
                        setShowChallengeModal(true);
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ) : era === '2026' && selectedSector && (
          <aside 
            className={`codex-panel ${isCodexCollapsed ? 'collapsed' : ''}`}
            onScroll={() => setExpandedMission(null)} // Ferme le pop-over au scroll
          >
            <div 
              className="codex-header" 
              onClick={handleCodexConsoleClick}
              title="Console Centrale du Codex"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isCodexCollapsed ? 'column' : 'row', gap: '8px', padding: '10px 15px', cursor: 'pointer' }}
            >
              {!isCodexCollapsed && <h2 style={{ margin: 0 }}>Codex Temporel {childInfos?.pseudo ? `- ${childInfos.pseudo}` : ''}</h2>}
              <div style={{ display: 'flex', flexDirection: isCodexCollapsed ? 'column' : 'row', alignItems: 'center', gap: '8px', marginLeft: isCodexCollapsed ? 'auto' : '0', marginRight: isCodexCollapsed ? 'auto' : '0' }}>
                <button 
                  className="collapse-btn" 
                  onClick={() => {
                    setIsCodexCollapsed(!isCodexCollapsed);
                    setExpandedMission(null);
                  }}
                  title={isCodexCollapsed ? "Agrandir le Codex" : "Réduire le Codex"}
                  style={{ background: 'transparent', border: 'none', color: '#00ffcc', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isCodexCollapsed ? <ChevronRight /> : <ChevronLeft />}
                </button>
                <button 
                  className="collapse-btn" 
                  onClick={() => setSelectedSector(null)}
                  title="Fermer le Codex"
                  style={{ background: 'transparent', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Sélecteur d'Onglets */}
            {!isCodexCollapsed && (
              <div className="codex-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid rgba(0, 255, 204, 0.15)', paddingBottom: '10px' }}>
                <button 
                  onClick={() => setCodexTab('missions')} 
                  style={{
                    flex: 1,
                    background: codexTab === 'missions' ? 'rgba(0, 255, 204, 0.15)' : 'transparent',
                    border: '1px solid rgba(0, 255, 204, 0.3)',
                    borderRadius: '6px',
                    color: '#00ffcc',
                    padding: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}
                >
                  Missions
                </button>
                <button 
                  onClick={() => setCodexTab('challenges')} 
                  style={{
                    flex: 1,
                    background: codexTab === 'challenges' ? 'rgba(0, 255, 204, 0.15)' : 'transparent',
                    border: '1px solid rgba(0, 255, 204, 0.3)',
                    borderRadius: '6px',
                    color: '#00ffcc',
                    padding: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}
                >
                  Défis ({challenges.length})
                </button>
              </div>
            )}
            
            <div className="mission-list">
              {isCodexCollapsed || codexTab === 'missions' ? (
                <>
                  {activeChallengeActionIds.length > 0 && (
                    <div className="category-section" style={{ marginBottom: '20px' }}>
                      {!isCodexCollapsed && <div className="category-title" style={{ color: '#ff3b3b', borderColor: '#ff3b3b', textShadow: '0 0 10px rgba(255,59,59,0.3)' }}>⚔️ DÉFIS PRIORITAIRES</div>}
                      {missions?.filter((m: any) => activeChallengeActionIds.includes(m.id)).map((missionWithChallenge: any) => (
                        <div 
                          key={`challenge-${missionWithChallenge.id}`} 
                          className="mission-card"
                          onClick={(e) => {
                            if (isCodexCollapsed) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopoverPos(rect.top + rect.height / 2);
                              setExpandedMission(missionWithChallenge);
                            }
                          }}
                          style={{ cursor: isCodexCollapsed ? 'pointer' : 'default', border: '1px solid #ff3b3b', background: 'rgba(255, 59, 59, 0.05)' }}
                        >
                          <div className="mission-header" title={isCodexCollapsed ? '' : (missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label)}>
                            {missionWithChallenge.icon && (
                              <img src={`${EVOE_IMG_URL}${missionWithChallenge.icon}`} alt="" className="mission-icon" />
                            )}
                            {!isCodexCollapsed && <h3 title={missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label}>{missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label}</h3>}
                          </div>
                          {!isCodexCollapsed && (
                            <>
                              <p title={missionWithChallenge.evoeMission?.descriptionSF || missionWithChallenge.description || ""}>
                                {parseBold(missionWithChallenge.evoeMission?.descriptionSF || missionWithChallenge.description || "Mission secrète en attente de déchiffrage.")}
                              </p>
                              <button 
                                id="btn-impulser-mission"
                                className={`hack-btn ${missionWithChallenge.evoeMission?.isImpulsed ? 'impulsed-btn' : ''}`}
                                disabled={loadingMissionId === missionWithChallenge.id}
                                onClick={() => {
                                  if (missionWithChallenge.evoeMission?.isImpulsed) {
                                    setCancelMissionConfirm({
                                      actionDoneId: missionWithChallenge.evoeMission.actionDoneId,
                                      label: missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label
                                    });
                                  } else {
                                    handleImpulseMissionWithBirthday(missionWithChallenge.id);
                                  }
                                }}
                                style={missionWithChallenge.evoeMission?.isImpulsed ? {
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  borderColor: '#10b981',
                                  color: '#10b981'
                                } : (isBirthdayActive && birthdayBoostsRemaining > 0 ? {
                                  borderColor: '#ffd700',
                                  color: '#ffd700',
                                  boxShadow: '0 0 12px rgba(255, 215, 0, 0.35)'
                                } : {})}
                              >
                                {loadingMissionId === missionWithChallenge.id ? (
                                  <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                                ) : missionWithChallenge.evoeMission?.isImpulsed ? (
                                  "Déjà Impulsé"
                                ) : isBirthdayActive && birthdayBoostsRemaining > 0 ? (
                                  `Impulser (+${(missionWithChallenge.evoeMission?.amplitude || 10) * 2} IT 🎂 x2)`
                                ) : (
                                  `Impulser (+${missionWithChallenge.evoeMission?.amplitude || 10} IT)`
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {missionsByCategory && missionsByCategory[selectedSector] ? (
                    <div key={selectedSector} className="category-section">
                      <div className="category-title">{selectedSector}</div>
                    
                    {missionsByCategory[selectedSector].map((mission: any, idx: number) => (
                      <div 
                        key={mission.id} 
                        className="mission-card"
                        onClick={(e) => {
                          if (isCodexCollapsed) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopoverPos(rect.top + rect.height / 2);
                            setExpandedMission(mission);
                          }
                        }}
                        style={{ cursor: isCodexCollapsed ? 'pointer' : 'default' }}
                      >
                        <div className="mission-header" title={isCodexCollapsed ? '' : (mission.evoeMission?.titreSF || mission.label)}>
                          {mission.icon && (
                            <img src={`${EVOE_IMG_URL}${mission.icon}`} alt="" className="mission-icon" />
                          )}
                          {!isCodexCollapsed && <h3 title={mission.evoeMission?.titreSF || mission.label}>{mission.evoeMission?.titreSF || mission.label}</h3>}
                          {mission.isChallengeActif && !isCodexCollapsed && (
                            <span style={{
                              marginLeft: 'auto',
                              background: '#ff3b3b',
                              color: '#fff',
                              fontSize: '0.65rem',
                              padding: '3px 6px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap'
                            }}>⚔️ DÉFI EN COURS</span>
                          )}
                        </div>
                        {!isCodexCollapsed && (
                          <>
                            <p title={mission.evoeMission?.descriptionSF || mission.description || ""}>
                              {parseBold(mission.evoeMission?.descriptionSF || mission.description || "Mission secrète en attente de déchiffrage.")}
                            </p>
                            <button 
                              id={idx === 0 ? "btn-impulser-mission" : undefined}
                              className={`hack-btn ${mission.evoeMission?.isImpulsed ? 'impulsed-btn' : ''}`}
                              disabled={loadingMissionId === mission.id}
                              onClick={() => {
                                if (mission.evoeMission?.isImpulsed) {
                                  setCancelMissionConfirm({
                                    actionDoneId: mission.evoeMission.actionDoneId,
                                    label: mission.evoeMission?.titreSF || mission.label
                                  });
                                } else {
                                  handleImpulseMissionWithBirthday(mission.id);
                                }
                              }}
                              style={mission.evoeMission?.isImpulsed ? {
                                background: 'rgba(16, 185, 129, 0.15)',
                                borderColor: '#10b981',
                                color: '#10b981'
                              } : (isBirthdayActive && birthdayBoostsRemaining > 0 ? {
                                borderColor: '#ffd700',
                                color: '#ffd700',
                                boxShadow: '0 0 12px rgba(255, 215, 0, 0.35)'
                              } : {})}
                            >
                              {loadingMissionId === mission.id ? (
                                <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                              ) : mission.evoeMission?.isImpulsed ? (
                                "Déjà Impulsé"
                              ) : isBirthdayActive && birthdayBoostsRemaining > 0 ? (
                                `Impulser (+${(mission.evoeMission?.amplitude || 10) * 2} IT 🎂 x2)`
                              ) : (
                                `Impulser (+${mission.evoeMission?.amplitude || 10} IT)`
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{color: '#a0aec0', fontStyle: 'italic', padding: '10px', textAlign: 'center'}}>
                    Aucune mission détectée dans ce secteur.
                  </p>
                )}
                </>
              ) : (
                /* Contenu de l'onglet Défis */
                <div className="challenges-section" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {loadingChallenges && challenges.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>Mise à jour des défis...</p>
                  )}
                  {/* Section Défis Reçus */}
                  <div>
                    <h3 style={{ fontSize: '0.85rem', color: '#00ffcc', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid rgba(0,255,204,0.1)', paddingBottom: '4px' }}>
                      📥 Reçus
                    </h3>
                    {receivedChallenges.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>Aucun défi reçu.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {receivedChallenges.map((ch) => (
                          <div key={ch.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `3px solid ${ch.challengerTeamColor || '#fff'}`, borderRadius: '8px', padding: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aec0', marginBottom: '4px' }}>
                              <span>De : <strong style={{ color: ch.challengerTeamColor }}>{ch.challengerTeamName}</strong></span>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: ch.status === 'PENDING' ? '#ffd700' : ch.status === 'ACCEPTED' ? '#00b3ff' : ch.status === 'SUCCESS' ? '#10b981' : '#ff3b3b' }}>
                                {ch.status}
                                {ch.isRetroactive && <span title="Mission accomplie d'avance !" style={{marginLeft: '4px'}}>✨</span>}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#fff', margin: '4px 0', fontWeight: 'bold' }}>
                              Mission : {ch.actionLabel}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#ff9f43', margin: '4px 0', fontStyle: 'italic' }}>
                              Gage : {ch.pledge}
                            </p>
                            {ch.expiresAt && (ch.status === 'PENDING' || ch.status === 'ACCEPTED') && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#ffd700', marginTop: '2px' }}>
                                <span>⏳</span>
                                <span>Temps restant : <strong>{formatRemainingTime(ch.expiresAt)}</strong></span>
                              </div>
                            )}
                            {ch.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button 
                                  onClick={() => handleRespondChallenge(ch.id, true)} 
                                  style={{ flex: 1, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Accepter
                                </button>
                                <button 
                                  onClick={() => handleRespondChallenge(ch.id, false)} 
                                  style={{ flex: 1, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Décliner
                                </button>
                              </div>
                            )}
                            {ch.status === 'ACCEPTED' && (
                              <button 
                                onClick={() => handleImpulseMission(ch.localActionId)}
                                disabled={loadingMissionId === ch.localActionId}
                                style={{
                                  marginTop: '10px',
                                  width: '100%',
                                  background: 'rgba(0, 255, 204, 0.15)',
                                  border: '1px solid #00ffcc',
                                  color: '#00ffcc',
                                  padding: '6px',
                                  borderRadius: '6px',
                                  fontWeight: 'bold',
                                  cursor: loadingMissionId === ch.localActionId ? 'wait' : 'pointer',
                                  transition: 'all 0.2s',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {loadingMissionId === ch.localActionId ? 'IMPULSION EN COURS...' : '⚡ IMPULSER LA MISSION'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section Défis Envoyés */}
                  <div>
                    <h3 style={{ fontSize: '0.85rem', color: '#00ffcc', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid rgba(0,255,204,0.1)', paddingBottom: '4px' }}>
                      📤 Envoyés
                    </h3>
                    {sentChallenges.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>Aucun défi envoyé.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {sentChallenges.map((ch) => (
                          <div key={ch.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `3px solid ${ch.targetTeamColor || '#fff'}`, borderRadius: '8px', padding: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aec0', marginBottom: '4px' }}>
                              <span>Cible : <strong style={{ color: ch.targetTeamColor }}>{ch.targetTeamName}</strong></span>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: ch.status === 'PENDING' ? '#ffd700' : ch.status === 'ACCEPTED' ? '#00b3ff' : ch.status === 'SUCCESS' ? '#10b981' : '#ff3b3b' }}>
                                {ch.status}
                                {ch.isRetroactive && <span title="Mission accomplie d'avance !" style={{marginLeft: '4px'}}>✨</span>}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#fff', margin: '4px 0', fontWeight: 'bold' }}>
                              Mission : {ch.actionLabel}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#ff9f43', margin: '4px 0', fontStyle: 'italic' }}>
                              Gage : {ch.pledge}
                            </p>
                            {ch.expiresAt && (ch.status === 'PENDING' || ch.status === 'ACCEPTED') && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#ffd700', marginTop: '2px' }}>
                                <span>⏳</span>
                                <span>Temps restant : <strong>{formatRemainingTime(ch.expiresAt)}</strong></span>
                              </div>
                            )}
                            {ch.isRetroactive && ch.status === 'SUCCESS' && (
                              <p style={{color: '#10b981', fontSize: '0.75rem', marginTop: '8px', marginBottom: 0}}>
                                💡 <em>Mission déjà accomplie d'avance !</em>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bouton de création */}
                  {(() => {
                    const myTeamStability = dashboardStatus?.teams?.find((t: any) => t.id === myTeamId)?.crewBioStability ?? 100;
                    const isLocked = myTeamStability < 10;
                    return (
                      <div style={{ marginTop: '10px' }}>
                        <button 
                          onClick={() => {
                            if (childInfos && childInfos.isPeriodOpen === false) {
                              setShowNoPeriodModal(true);
                              return;
                            }
                            if (!isLocked) {
                              setShowChallengeModal(true);
                              setChallengeError(null);
                            }
                          }} 
                          disabled={isLocked}
                          style={{ 
                            width: '100%', 
                            background: isLocked ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #00ffcc, #00b3ff)', 
                            border: 'none', 
                            borderRadius: '6px', 
                            color: isLocked ? 'rgba(255,255,255,0.3)' : '#000', 
                            padding: '10px', 
                            fontSize: '0.85rem', 
                            fontWeight: 'bold', 
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            textTransform: 'uppercase',
                            boxShadow: isLocked ? 'none' : '0 0 10px rgba(0,255,204,0.3)'
                          }}
                        >
                          {isLocked ? "🔒 Stabilité trop basse (<10%)" : "+ Lancer un défi"}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* CONTENU 2070 : Double Tableau de Bord Flottant (Extrapolation & Course) */}
        <Dashboard2070Overlays
          era={era}
          extrapolation={extrapolation}
          showExtrapolation={showExtrapolation}
          setShowExtrapolation={setShowExtrapolation}
          showRadar={showRadar}
          setShowRadar={setShowRadar}
          eodN1Percent={eodN1Percent}
          eodNPercent={eodNPercent}
          currentYear={currentYear}
          handleResetPropulsion={handleResetPropulsion}
          isResettingPropulsion={isResettingPropulsion}
          dashboardStatus={dashboardStatus}
          selectedRadarTeamId={selectedRadarTeamId}
          setSelectedRadarTeamId={setSelectedRadarTeamId}
          isMobile={isMobile}
          selectedSector={selectedSector}
          chatOpen={chatOpen}
          selectedProfileId={selectedProfileId}
          evoeImgUrl={EVOE_IMG_URL}
        />

        {/* Pop-over Holographique pour le mode Collapsed */}
        <AnimatePresence>
          {isCodexCollapsed && expandedMission && (
            <motion.div
              className="mission-popover"
              initial={{ opacity: 0, x: -20, y: "-50%", scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: "-50%", scale: 1 }}
              exit={{ opacity: 0, x: -10, y: "-50%", scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ top: popoverPos }}
            >
              <div className="mission-header">
                {expandedMission.icon && (
                  <img src={`${EVOE_IMG_URL}${expandedMission.icon}`} alt="" className="mission-icon" />
                )}
                <h3>{expandedMission.evoeMission?.titreSF || expandedMission.label}</h3>
              </div>
              <p>{parseBold(expandedMission.evoeMission?.descriptionSF || expandedMission.description || "Mission secrète en attente de déchiffrage.")}</p>
              <button 
                className={`hack-btn ${expandedMission.evoeMission?.isImpulsed ? 'impulsed-btn' : ''}`}
                disabled={loadingMissionId === expandedMission.id}
                onClick={() => {
                  if (expandedMission.evoeMission?.isImpulsed) {
                    setCancelMissionConfirm({
                      actionDoneId: expandedMission.evoeMission.actionDoneId,
                      label: expandedMission.evoeMission?.titreSF || expandedMission.label
                    });
                  } else {
                    handleImpulseMissionWithBirthday(expandedMission.id);
                  }
                }}
                style={expandedMission.evoeMission?.isImpulsed ? {
                  background: 'rgba(16, 185, 129, 0.15)',
                  borderColor: '#10b981',
                  color: '#10b981'
                } : (isBirthdayActive && birthdayBoostsRemaining > 0 ? {
                  borderColor: '#ffd700',
                  color: '#ffd700',
                  boxShadow: '0 0 12px rgba(255, 215, 0, 0.35)'
                } : {})}
              >
                {loadingMissionId === expandedMission.id ? (
                  <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                ) : expandedMission.evoeMission?.isImpulsed ? (
                  "Déjà Impulsé"
                ) : isBirthdayActive && birthdayBoostsRemaining > 0 ? (
                  `Impulser (+${(expandedMission.evoeMission?.amplitude || 10) * 2} IT 🎂 x2)`
                ) : (
                  `Impulser (+${expandedMission.evoeMission?.amplitude || 10} IT)`
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mascotte Gribouille - Célébration Anniversaire & Clic Gâteau */}
      <GribouilleBirthdayBubble
        isOpen={!!gribouilleBirthdayPlayer}
        player={gribouilleBirthdayPlayer}
        isMe={
          !!gribouilleBirthdayPlayer &&
          (gribouilleBirthdayPlayer.id === childInfos?.id ||
            gribouilleBirthdayPlayer.childId === childInfos?.id ||
            gribouilleBirthdayPlayer.isCurrent)
        }
        boostsRemaining={birthdayBoostsRemaining}
        isCatchup={isBirthdayCatchup}
        isLate={isBirthdayLate}
        wishes={birthdayWishes}
        onClose={handleCloseGribouille}
        onShareWithTeam={handleShareBirthdayWithTeam}
        onWishTeammate={handleWishTeammateBirthday}
      />

      {/* Modal de Création de Défi PvP */}
      <Suspense fallback={null}>
        {showChallengeModal && (
          <ChallengeModal
            showChallengeModal={showChallengeModal}
            setShowChallengeModal={setShowChallengeModal}
            challengeTargetTeamId={challengeTargetTeamId}
            setChallengeTargetTeamId={setChallengeTargetTeamId}
            challengeLocalActionId={challengeLocalActionId}
            setChallengeLocalActionId={setChallengeLocalActionId}
            challengePledge={challengePledge}
            setChallengePledge={setChallengePledge}
            challengeDurationHours={challengeDurationHours}
            setChallengeDurationHours={setChallengeDurationHours}
            challengeError={challengeError}
            isSubmittingChallenge={isSubmittingChallenge}
            handleSendChallenge={handleSendChallenge}
            otherTeams={otherTeams}
            availableMissionsForChallenge={availableMissionsForChallenge}
          />
        )}
      </Suspense>

      {/* Modal de Confirmation d'Annulation de Mission */}
      <Suspense fallback={null}>
        <ConfirmCancelModal
          cancelMissionConfirm={cancelMissionConfirm}
          setCancelMissionConfirm={setCancelMissionConfirm}
          handleCancelMission={handleCancelMission}
        />
      </Suspense>

      {/* Modal Mes Missions de la Semaine */}
      <MissionsWeekModal
        isOpen={showMissionsWeekModal}
        onClose={() => setShowMissionsWeekModal(false)}
        missions={missions || []}
        childPseudo={childInfos?.pseudo}
        onCancelConfirm={(actionDoneId, label) => setCancelMissionConfirm({ actionDoneId, label })}
        onOpenVision2050={handleOpenVision2050}
        isVision2050Unlocked={!!activeEggData?.metaEnigma?.isMetaEnigmaUnlocked}
      />

      {/* Modal du Profil Agent */}
      <AnimatePresence>
        {selectedProfileId !== null && (
          <Suspense fallback={null}>
            <AgentProfileModal
              profileId={selectedProfileId}
              onClose={() => setSelectedProfileId(null)}
              isOwner={selectedProfileId === childInfos?.id}
              refreshData={fetchEvoeData}
              isStealthMode={isStealthMode}
              onToggleStealth={toggleStealthMode}
              onMetricClick={handleMetricClick}
              onOpenBriefing={() => {
                setSelectedProfileId(null);
                setShowBriefing(true);
              }}
              onReplayEasterEgg={(egg) => {
                setSelectedProfileId(null);
                setCelebrationEgg({
                  code: egg.code,
                  triggerType: egg.triggerType,
                  title: egg.title,
                  pointsIT: egg.pointsIT || 60,
                  isTeamRewarded: !!egg.isTeamRewarded,
                  remainingPlayers: egg.remainingPlayers ?? 0,
                });
                setShowEggCelebration(true);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* COUCHE MODALES EASTER EGGS & SALLE D'ARCADE */}
      <EasterEggModalsLayer
        konamiHUD={konamiHUD}
        onKonamiButtonPress={handleKonamiButtonPress}
        onCloseKonamiHUD={handleCloseKonamiHUD}
        activeEggData={activeEggData}
        showMascotBubble={showMascotBubble}
        setShowMascotBubble={setShowMascotBubble}
        exitReplayMode={exitReplayMode}
        verifyEasterEggAnswer={verifyEasterEggAnswer}
        onVerifyCommand={handleVerifyCommand}
        fetchActiveEgg={fetchActiveEgg}
        celebrationEgg={celebrationEgg}
        setCelebrationEgg={setCelebrationEgg}
        showEggCelebration={showEggCelebration}
        setShowEggCelebration={setShowEggCelebration}
        setChatActiveTab={setChatActiveTab}
        setChatOpen={setChatOpen}
        setPrefilledChatText={setPrefilledChatText}
        pseudo={pseudo}
        childInfos={childInfos}
        arcadeSelectedGameKey={arcadeSelectedGameKey}
        setArcadeSelectedGameKey={setArcadeSelectedGameKey}
        showArcadeCabinet={showArcadeCabinet}
        setShowArcadeCabinet={setShowArcadeCabinet}
        myTeamId={myTeamId}
        showChronoEggModal={showChronoEggModal}
        setShowChronoEggModal={setShowChronoEggModal}
        chronoPeriods={chronoPeriods}
        chronoLoading={chronoLoading}
        onReplayPeriod={handleReplayPeriod}
        showRosettaStoneModal={showRosettaStoneModal}
        setShowRosettaStoneModal={setShowRosettaStoneModal}
        showTerminalModal={showTerminalModal}
        setShowTerminalModal={setShowTerminalModal}
        submitMetaEnigmaCode={submitMetaEnigmaCode}
        selectedEchoTheme={selectedEchoTheme}
        setSelectedEchoTheme={setSelectedEchoTheme}
        showTemporalEchoModal={showTemporalEchoModal}
        setShowTemporalEchoModal={setShowTemporalEchoModal}
        showArcadeHub={showArcadeHub}
        setShowArcadeHub={setShowArcadeHub}
      />

      {/* Terminal de discussion instantanée (Chat) */}
      <ChatPanel 
        players={players} 
        teams={dashboardStatus?.teams || []} 
        onlineUsers={onlineUsers}
        onOnlineUsersChange={setOnlineUsers}
        onUnreadChange={setUnreadChat}
        isOpenProp={chatOpen}
        activeTabProp={chatActiveTab}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
        onTabChange={(tab) => setChatActiveTab(tab)}
        isStealthMode={isStealthMode}
        onEasterEggCommand={handleCommLinkCommand}
        prefilledText={prefilledChatText}
        onPrefilledTextConsumed={() => setPrefilledChatText(null)}
        scrollToUnreadTrigger={scrollToUnreadTrigger}
      />

      {/* Mobile Bottom Navbar (Axe 3) */}
      <MobileBottomNav
        era={era}
        selectedSector={selectedSector}
        codexTab={codexTab}
        selectedProfileId={selectedProfileId}
        setSelectedProfileId={setSelectedProfileId}
        setChatOpen={setChatOpen}
        chatOpen={chatOpen}
        unreadChat={unreadChat}
        setCodexTab={setCodexTab}
        setIsCodexCollapsed={setIsCodexCollapsed}
        handleSwitchEra={handleSwitchEra}
        isTransitioning={isTransitioning}
        currentYear={currentYear}
        missionsByCategory={missionsByCategory}
        setSelectedSector={setSelectedSector}
        view2026={view2026}
        setView2026={setView2026}
        setShowExtrapolation={setShowExtrapolation}
        setShowRadar={setShowRadar}
      />

      {/* Guide d'Onboarding / Visite Guidée Interactive */}
      <OnboardingGuide 
        isOpen={showOnboardingGuide}
        onClose={() => setShowOnboardingGuide(false)}
        onNavigateStep={handleNavigateGuideStep}
        teamName={childInfos?.group?.team?.name}
        userId={currentUserId}
      />

      {/* Modal Popup Alerte Période Fermée */}
      <ClosedPeriodAlertModal
        isOpen={showNoPeriodModal}
        onClose={() => setShowNoPeriodModal(false)}
      />

      {/* Badge Interactif de Version App en bas à gauche -> Ouvre le Journal de Bord / About */}
      <div 
        className="app-version-badge"
        onClick={() => setShowAboutModal(true)}
        title="Ouvrir le Journal de Bord & Cartographie des fonctionnalités"
        style={{
          position: 'fixed',
          bottom: '12px',
          left: '16px',
          height: '24px',
          boxSizing: 'border-box',
          zIndex: 100,
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.8px',
          color: era === '2026' ? '#00b3ff' : '#00ffcc',
          background: era === '2026' ? 'rgba(0, 179, 255, 0.12)' : 'rgba(0, 255, 204, 0.12)',
          border: era === '2026' ? '1px solid rgba(0, 179, 255, 0.35)' : '1px solid rgba(0, 255, 204, 0.35)',
          borderRadius: '8px',
          padding: '0 9px',
          backdropFilter: 'blur(8px)',
          fontFamily: 'monospace',
          pointerEvents: 'auto',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: era === '2026' ? '0 0 10px rgba(0, 179, 255, 0.25)' : '0 0 10px rgba(0, 255, 204, 0.25)',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px'
        }}
      >
        <span>v{pkg.version}</span>
      </div>

      {/* Modale À propos / Journal de Bord & Cartographie des Epics */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        version={pkg.version}
        alwaysShowRecent={true}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<MainApp />} />
    </Routes>
  );
}
