import { useState, useEffect } from 'react';
import { evoeClient } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { telemetry } from '../services/telemetryService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy';
const EVOE_API_URL = import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe';

export function useEvoeData() {
  const { childInfos, instanceId, refreshContext, missions } = useAuth();

  const [era, setEra] = useState<'2026' | '2070'>('2026');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [isCodexCollapsed, setIsCodexCollapsed] = useState(false);
  const [expandedMission, setExpandedMission] = useState<any | null>(null);
  const [popoverPos, setPopoverPos] = useState(0);

  // States pour les métriques
  const [extrapolation, setExtrapolation] = useState<any>(null);
  const [dashboardStatus, setDashboardStatus] = useState<any>(null);
  const [showExtrapolation, setShowExtrapolation] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [isResettingPropulsion, setIsResettingPropulsion] = useState(false);

  // State Oracle Terrestre
  const [earthOracleLevel, setEarthOracleLevel] = useState<number | null>(null);
  const [earthOracleText, setEarthOracleText] = useState('');
  const [earthOracleTyping, setEarthOracleTyping] = useState(false);

  // States pour les défis et l'impulsion
  const [codexTab, setCodexTab] = useState<'missions' | 'challenges'>('missions');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [loadingMissionId, setLoadingMissionId] = useState<number | null>(null);

  // States pour le modal de création de défi
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTargetTeamId, setChallengeTargetTeamId] = useState<number | ''>('');
  const [challengeLocalActionId, setChallengeLocalActionId] = useState<number | ''>('');
  const [challengePledge, setChallengePledge] = useState('');
  const [challengeDurationHours, setChallengeDurationHours] = useState<number | ''>(48);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);
  const [showNoPeriodModal, setShowNoPeriodModal] = useState<boolean>(false);

  // States pour le modal de confirmation d'annulation
  const [cancelMissionConfirm, setCancelMissionConfirm] = useState<{ actionDoneId: number; label: string } | null>(null);

  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  // Toggle paysages
  const [allowPortrait, setAllowPortrait] = useState<boolean>(() =>
    localStorage.getItem('evoe_allow_portrait') === 'true'
  );

  // Mode Furtif (Invisible)
  const [isStealthMode, setIsStealthMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('evoe_stealth_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleStealthMode = (customValue?: boolean) => {
    setIsStealthMode(prev => {
      const next = typeof customValue === 'boolean' ? customValue : !prev;
      try {
        localStorage.setItem('evoe_stealth_mode', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Réglage Graphique : Débridage du ratio de pixels (DPR 3D)
  // Par défaut : bridé à 1.25 pour garantir 60 FPS sur GPU intégré (Core i5 / 6 Go RAM)
  const [isUnbridledDpr, setIsUnbridledDpr] = useState<boolean>(() => {
    try {
      return localStorage.getItem('evoe_unbridle_dpr') === 'true';
    } catch {
      return false;
    }
  });

  const toggleUnbridledDpr = (customValue?: boolean) => {
    setIsUnbridledDpr(prev => {
      const next = typeof customValue === 'boolean' ? customValue : !prev;
      try {
        localStorage.setItem('evoe_unbridle_dpr', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Synchronisation avec la configuration globale admin si pas d'override local
  useEffect(() => {
    const fetchPublicConfig = async () => {
      try {
        const res = await evoeClient.get(`${API_URL}/public_config`);
        if (res.data && typeof res.data.unbridleDpr === 'boolean') {
          const localSaved = localStorage.getItem('evoe_unbridle_dpr');
          if (localSaved === null) {
            setIsUnbridledDpr(res.data.unbridleDpr);
          }
        }
      } catch {
        // ignore non-critical
      }
    };
    fetchPublicConfig();
  }, []);

  // States de chat et statut de connexion
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadChat, setUnreadChat] = useState<{
    global: number;
    team: number;
    system: number;
    unreadMps: Record<string, number>;
    unreadTeams: Record<string, number>;
    total: number;
  }>({
    global: 0,
    team: 0,
    system: 0,
    unreadMps: {},
    unreadTeams: {},
    total: 0
  });

  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatActiveTab, setChatActiveTab] = useState<string | undefined>(undefined);

  const hasSeenBriefing: boolean = (childInfos as any)?.hasSeenBriefing === true;

  const [showBriefing, setShowBriefing] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && childInfos?.id) {
      const skipped = localStorage.getItem(`evoe_skip_briefing_${childInfos.id}`) === 'true';
      return !hasSeenBriefing && !skipped;
    }
    return false;
  });

  useEffect(() => {
    if (childInfos?.id) {
      const skipped = localStorage.getItem(`evoe_skip_briefing_${childInfos.id}`) === 'true';
      const shouldShow = !hasSeenBriefing && !skipped;
      setShowBriefing(prev => (prev !== shouldShow ? shouldShow : prev));
    }
  }, [childInfos?.id, hasSeenBriefing]);

  const handleCompleteBriefing = async (skipNextTime: boolean) => {
    setShowBriefing(false);
    if (childInfos?.id && skipNextTime) {
      try {
        localStorage.setItem(`evoe_skip_briefing_${childInfos.id}`, 'true');
        await evoeClient.post(`${EVOE_API_URL}/briefing/seen`);
      } catch (err) {
        console.error("Erreur enregistrement briefing vu:", err);
      }
    }
  };

  const [isEvoeDataLoading, setIsEvoeDataLoading] = useState(true);

  const fetchEvoeData = async () => {
    if (!instanceId) return;
    refreshContext();

    try {
      setIsEvoeDataLoading(true);
      const [metricsRes, dashboardRes] = await Promise.allSettled([
        evoeClient.get(`${EVOE_API_URL}/extrapolation/metrics`),
        evoeClient.get(`${EVOE_API_URL}/dashboard/status/${instanceId}`),
      ]);
      if (metricsRes.status === 'fulfilled') {
        setExtrapolation(metricsRes.value.data);
      }
      if (dashboardRes.status === 'fulfilled') {
        setDashboardStatus(dashboardRes.value.data);
      }
    } catch (err) {
      console.error("Erreur récupération données Evoe:", err);
    } finally {
      setIsEvoeDataLoading(false);
    }
  };

  const fetchChallenges = async () => {
    if (!instanceId) return;
    try {
      setLoadingChallenges(true);
      const res = await evoeClient.get(`${EVOE_API_URL}/challenges`);
      setChallenges(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur chargement défis:", err);
      setChallenges([]);
    } finally {
      setLoadingChallenges(false);
    }
  };

  // Chargement automatique au montage dès que l'instanceId est disponible
  useEffect(() => {
    if (instanceId) {
      fetchEvoeData();
      fetchChallenges();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  const handleImpulseMission = async (missionId: number) => {
    if (!childInfos?.id) return;
    if (childInfos?.isPeriodOpen === false) {
      setShowNoPeriodModal(true);
      return;
    }
    try {
      setLoadingMissionId(missionId);
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 800);

      await evoeClient.post(`${API_URL}/actiondone/${childInfos.id}`, { id: missionId });
      const mission = missions.find((m: any) => m.id === missionId);
      telemetry.logEvent(
        'MISSION_DONE',
        `MISSION_${missionId}`,
        mission?.titreSF || mission?.label || 'Mission validée',
        {
          missionId,
          pointsIT: mission?.pointsGagnes,
          actionRefId: mission?.actionRefId,
          missionTitle: mission?.titreSF || mission?.label,
        }
      );
      await refreshContext();
      fetchEvoeData();
    } catch (err: any) {
      console.error("Erreur d'impulsion de la mission:", err);
      const msg = err.response?.data?.message || err.message || '';
      if (typeof msg === 'string' && msg.toLowerCase().includes('période')) {
        setShowNoPeriodModal(true);
      }
    } finally {
      setLoadingMissionId(null);
    }
  };

  const handleCancelMission = async (actionDoneId: number) => {
    if (!actionDoneId) return;
    try {
      setLoadingMissionId(actionDoneId);
      await evoeClient.delete(`${API_URL}/actiondone/${actionDoneId}`);
      telemetry.logEvent(
        'MISSION_CANCELLED',
        `ACTION_DONE_${actionDoneId}`,
        'Mission annulée',
        { actionDoneId }
      );
      await refreshContext();
      fetchEvoeData();
    } catch (err) {
      console.error("Erreur d'annulation de la mission:", err);
    } finally {
      setLoadingMissionId(null);
    }
  };

  const handleSendChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (childInfos?.isPeriodOpen === false) {
      setShowChallengeModal(false);
      setShowNoPeriodModal(true);
      return;
    }
    if (!challengeTargetTeamId || !challengeLocalActionId || !challengePledge.trim()) {
      setChallengeError("Veuillez remplir tous les champs.");
      return;
    }
    setIsSubmittingChallenge(true);
    setChallengeError(null);
    try {
      await evoeClient.post(`${EVOE_API_URL}/challenges`, {
        targetTeamId: Number(challengeTargetTeamId),
        localActionId: Number(challengeLocalActionId),
        pledge: challengePledge,
        durationHours: challengeDurationHours !== '' ? Number(challengeDurationHours) : undefined
      });
      setShowChallengeModal(false);
      setChallengeTargetTeamId('');
      setChallengeLocalActionId('');
      setChallengePledge('');
      setChallengeDurationHours(48);
      fetchChallenges();
    } catch (err: any) {
      console.error("Erreur création défi:", err);
      const errMsg = err.response?.data?.message || "Erreur lors de la création du défi.";
      if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('période')) {
        setShowChallengeModal(false);
        setShowNoPeriodModal(true);
      } else {
        setChallengeError(errMsg);
      }
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  const handleRespondChallenge = async (challengeId: number, accept: boolean) => {
    try {
      await evoeClient.post(`${EVOE_API_URL}/challenges/${challengeId}/respond`, {
        accept
      });
      fetchChallenges();
    } catch (err) {
      console.error("Erreur réponse défi:", err);
    }
  };

  const handleResetPropulsion = async () => {
    if (!instanceId || isResettingPropulsion) return;
    setIsResettingPropulsion(true);
    try {
      await evoeClient.post(`${EVOE_API_URL}/propulsion/reset/${instanceId}`);
      fetchEvoeData();
    } catch (err) {
      console.error("Erreur réinitialisation propulsion:", err);
    } finally {
      setIsResettingPropulsion(false);
    }
  };

  const handleSwitchEra = () => {
    setIsTransitioning(true);
    setShowExtrapolation(false);
    setShowRadar(false);
    const nextEra = era === '2026' ? '2070' : '2026';
    telemetry.trackView(nextEra === '2026' ? 'QG_2026' : 'WORLD_2070');
    // Basculement immédiat de l'ère (0ms) pour réactivité instantanée
    setEra(prev => (prev === '2026' ? '2070' : '2026'));
    // Extinction rapide de l'effet visuel de transition
    setTimeout(() => {
      setIsTransitioning(false);
    }, 250);
  };

  return {
    era, setEra, handleSwitchEra,
    isTransitioning, setIsTransitioning,
    selectedSector, setSelectedSector,
    isCodexCollapsed, setIsCodexCollapsed,
    expandedMission, setExpandedMission,
    popoverPos, setPopoverPos,
    showBriefing, setShowBriefing,
    extrapolation, setExtrapolation,
    dashboardStatus, setDashboardStatus,
    showExtrapolation, setShowExtrapolation,
    showRadar, setShowRadar,
    isResettingPropulsion,
    earthOracleLevel, setEarthOracleLevel,
    earthOracleText, setEarthOracleText,
    earthOracleTyping, setEarthOracleTyping,
    codexTab, setCodexTab,
    challenges, setChallenges,
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
    isStealthMode, setIsStealthMode, toggleStealthMode,
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
  };
}
