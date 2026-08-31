import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, LogOut, ChevronRight, ChevronLeft, Shield, Trash2, Droplet, Zap, RefreshCw, AlertTriangle, AlertOctagon, CheckCircle2, X, Trophy, Mail, RotateCcw, Compass, MessageSquare, Globe } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import Portal2026 from './components/Portal2026';
import Portal2070 from './components/Portal2070';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import TemporalBriefing from './components/TemporalBriefing';
import ChatPanel from './components/ChatPanel';
import { OnboardingGuide } from './components/ui/OnboardingGuide';
import { MissionsCarousel3D } from './components/ui/MissionsCarousel3D';
import { ChallengesCarousel3D } from './components/ui/ChallengesCarousel3D';
import { OrbitalSectorRibbon } from './components/ui/OrbitalSectorRibbon';
import { MissionSearchBar } from './components/ui/MissionSearchBar';

import { preloadEvoeAssets } from './utils/preloadAssets';
import pkg from '../package.json';

// Hooks & UI Components
import { useEvoeData } from './hooks/useEvoeData';
import { EvoeRadarMeter } from './components/ui/EvoeRadarMeter';

import { MissionsWeekModal } from './components/ui/MissionsWeekModal';
import { lazy, Suspense } from 'react';
const AgentProfileModal = lazy(() => import('./components/ui/AgentProfileModal').then(m => ({ default: m.AgentProfileModal })));
const ChallengeModal = lazy(() => import('./components/ui/ChallengeModal').then(m => ({ default: m.ChallengeModal })));
const ConfirmCancelModal = lazy(() => import('./components/ui/ConfirmCancelModal').then(m => ({ default: m.ConfirmCancelModal })));
const MobileContextCarousel = lazy(() => import('./components/ui/MobileContextCarousel'));

import './App.css';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

// Helper pour parser les **bold** en HTML
const parseBold = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

// Formateur d'unité intelligent : kg/t, L/m³
const fmtMass = (kg: number): string => {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(2)} kt`;
  if (kg >= 1000)      return `${(kg / 1000).toFixed(2)} t`;
  return `${kg.toFixed(1)} kg`;
};
const fmtVolume = (litres: number): string => {
  if (litres >= 1_000_000) return `${(litres / 1_000_000).toFixed(1)} ML`;
  if (litres >= 1000)      return `${(litres / 1000).toFixed(1)} m³`;
  return `${litres.toFixed(0)} L`;
};

function MainApp() {
  const {
    era, handleSwitchEra,
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
    showLeaderboardModal, setShowLeaderboardModal,
    selectedProfileId, setSelectedProfileId,
    allowPortrait, setAllowPortrait,
    isStealthMode, toggleStealthMode,
    onlineUsers, setOnlineUsers,
    unreadChat, setUnreadChat,
    chatOpen, setChatOpen,
    chatActiveTab, setChatActiveTab,
    fetchEvoeData, fetchChallenges,
    handleImpulseMission, handleCancelMission,
    handleSendChallenge, handleRespondChallenge,
    handleResetPropulsion
  } = useEvoeData();

  const [view2026, setView2026] = useState<'codex' | 'leaderboard'>('codex');
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
  const [showMissionsWeekModal, setShowMissionsWeekModal] = useState(false);
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [selectedRadarTeamId, setSelectedRadarTeamId] = useState<number | string | null>(null);

  const handleVesselClick = (teamId: number | string) => {
    setShowRadar(true);
    setSelectedRadarTeamId(teamId);
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
    setSelectedSector(sector);
    setMissionSearchQuery('');
    setIsMobileSearchOpen(false);
    setCodexTab('missions');
    setIsCodexCollapsed(false);
    setView2026('codex');
    setChatOpen(false);
    setSelectedProfileId(null);
    setShowLeaderboardModal(false);
  };


  // Callback pour basculer automatiquement les onglets pendant la visite guidée (11 étapes)
  const handleNavigateGuideStep = (stepIndex: number) => {
    setSelectedProfileId(null);
    setShowLeaderboardModal(false);

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

  const impulsedMissionsCount = useMemo(() => {
    return missions?.filter((m: any) => m.evoeMission?.isImpulsed)?.length || 0;
  }, [missions]);

  // L'early return doit être après tous les hooks
  const shouldRedirect = !user || instanceChoices;

  // Lancement automatique du guide d'onboarding spécifique à l'utilisateur connecté
  useEffect(() => {
    if (!currentUserId || shouldRedirect) return;
    const userKey = `evoe_has_seen_onboarding_v2_${currentUserId}`;
    const hasSeen = localStorage.getItem(userKey);
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowOnboardingGuide(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentUserId, shouldRedirect]);

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

  // Récupérer les données de projection / course / défis
  useEffect(() => {
    fetchEvoeData();
    let interval: any = null;

    if (era === '2070') {
      interval = setInterval(fetchEvoeData, 10000);
    } else if (era === '2026') {
      fetchChallenges();
      interval = setInterval(() => {
        fetchEvoeData();
        fetchChallenges();
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [era, instanceId]);



  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  // ---- Messages Oracle Terrestre ----
  const EARTH_ORACLE_MESSAGES: Record<number, string> = {
    1: "La Terre de 2070 est silencieuse... Les archives des Agents Temporels ont été retrouvées dans les ruines. Leur courage a laissé une trace. Mais le temps manque encore. Revenez à 2026 — chaque action compte.",
    2: "Les premiers signes de vie réapparaissent sur la Terre de 2070. Des forêts timides, de l’eau plus pure. La mission avance. Mais les Agents ont encore le pouvoir d’écrire la suite. Chaque geste en 2026 résonne ici.",
    3: "La Terre de 2070 reprend son souffle. Les rivières coulent à nouveau, les villes verdissent. Les Agents de 2026 ont changé le cours du temps. Continuez — le futur vous entend.",
    4: "En 2070, la Terre respire. Vos actions à 2026 ont réécrit notre avenir. Les écosystèmes se reconstituent, la biodiversité revient. Vous avez accompli ce que beaucoup croyaient impossible.",
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
  const currentPlayer = players?.find(p => p.id === childInfos?.id);
  const myTeamId = currentPlayer?.teamId;

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

  // Calcul du pourcentage de l'année pour la jauge EOD
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
      return Math.min(100, Math.max(0, (dayOfYear / 365) * 100));
    }
    return 50;
  };

  const eodN1Percent = extrapolation ? getEodPercent(extrapolation.dateDepassementSans) : 58.6;
  const eodNPercent = extrapolation ? getEodPercent(extrapolation.dateDepassement) : 70.7;

  const handleSelectPlayer = (player: any) => {
    const isMe = player.childId === childInfos?.id || player.id === childInfos?.id || player.isCurrent;
    
    if (isMe) {
      // Priorité 1 : message d'équipe (inter-équipes ou interne)
      const unreadTeamNames = Object.keys(unreadChat.unreadTeams || {}).filter(k => (unreadChat.unreadTeams?.[k] || 0) > 0);
      if (unreadChat.team > 0 || unreadTeamNames.length > 0) {
        setChatActiveTab(unreadTeamNames.length > 0 ? `team:${unreadTeamNames[0]}` : 'team');
        setChatOpen(true);
        return;
      }
      
      // Priorité 2 : message privé (le premier trouvé dans les MP)
      const unreadMpUsers = Object.keys(unreadChat.unreadMps || {}).filter(k => (unreadChat.unreadMps?.[k] || 0) > 0);
      if (unreadMpUsers.length > 0) {
        setChatActiveTab(`mp:${unreadMpUsers[0]}`);
        setChatOpen(true);
        return;
      }
      
      // Priorité 3 : message global
      if (unreadChat.global > 0) {
        setChatActiveTab('global');
        setChatOpen(true);
        return;
      }
    } else {
      // Si on clique sur un autre joueur
      const pseudo = player.pseudo.toLowerCase();
      // S'il a envoyé un message non lu, on ouvre directement son salon de chat
      if ((unreadChat.unreadMps?.[pseudo] || 0) > 0) {
        setChatActiveTab(`mp:${pseudo}`);
        setChatOpen(true);
        return;
      }
    }
    
    // Comportement par défaut si pas de message : ouvrir la fiche profil
    setSelectedProfileId(player.childId || player.id);
  };

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
          onComplete={() => setShowBriefing(false)} 
          youtubeUrl={childInfos.youtubeBriefingUrl} 
          childId={childInfos.id}
        />
      )}

      {/* Glitch Écran Temporel */}
      {isGlitching && <div className="screen-glitch" />}

      {/* Three.js Canvas Container */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }} dpr={[1, 2]}>
          {era === '2026' ? (
            <Portal2026 
              categories={missionsByCategory ? Object.keys(missionsByCategory) : []} 
              onSelectSector={handleSelectSector} 
              onSelectPlayer={handleSelectPlayer}
              onSelectChallenges={() => {
                setSelectedProfileId(null);
                setShowLeaderboardModal(false);
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
                setSelectedProfileId(null);
                setShowLeaderboardModal(false);
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
              unreadMps={unreadChat.unreadMps}
              isMobile={isMobile}
              view={view2026}
              dashboardStatus={dashboardStatus}
              challenges={challenges}
              missionsWeekCount={impulsedMissionsCount}
              isStealthMode={isStealthMode}
              onToggleStealth={toggleStealthMode}
              onSelectMissionsWeek={() => {
                setSelectedProfileId(null);
                setShowLeaderboardModal(false);
                setChatOpen(false);
                setShowMissionsWeekModal(true);
              }}
              onCloseLeaderboard={() => setView2026('codex')}
            />
          ) : (
            <Portal2070 
              dashboardStatus={dashboardStatus} 
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

      {/* Transition Effect (Zoom Visière) */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="transition-overlay"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 50, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* UI Overlay HTML */}
      <div className="ui-overlay">
        <header className="header">
          <div 
            id="hud-agent-profile"
            className="logo"
            onClick={() => childInfos && setSelectedProfileId(childInfos.id)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer', 
              pointerEvents: 'auto' 
            }}
            title="Ouvrir la fiche profil de l'Agent"
          >
            {childInfos && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <img 
                  src={getAvatarUrl()} 
                  alt="" 
                  className="avatar-pulse-ring"
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    border: `1.8px solid ${currentPlayer?.color || '#00ffcc'}`, 
                    objectFit: 'cover',
                    boxShadow: `0 0 10px ${currentPlayer?.color || '#00ffcc'}44`
                  }} 
                />
                {unreadChat.total > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: '#ff3b3b',
                    borderRadius: '50%',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid rgba(5, 8, 16, 0.94)',
                    boxShadow: '0 0 6px #ff3b3b',
                    zIndex: 10
                  }}>
                    <Mail size={8} color="#fff" />
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', lineHeight: '1.1', whiteSpace: 'nowrap' }}>EVOE {era}</h1>
              {childInfos && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#00ffcc', 
                  fontWeight: 'bold', 
                  textShadow: '0 0 5px rgba(0,255,204,0.3)', 
                  whiteSpace: 'nowrap' 
                }}>
                  Agent Temporel {childInfos.pseudo}
                </span>
              )}
            </div>
          </div>

          {/* 1. Mode Desktop / Paysage : Capsule Cybernétique vivante au centre du Header */}
          {(() => {
            const pct = (() => {
              if (dashboardStatus?.globalProgression !== undefined && dashboardStatus.globalProgression !== null) {
                return Math.min(100, Math.round(dashboardStatus.globalProgression));
              }
              const myTeam = dashboardStatus?.teams?.find((t: any) => t.id === childInfos?.group?.teamId);
              if (myTeam?.position !== undefined && myTeam.position !== null) {
                return Math.min(100, Math.round(myTeam.position));
              }
              return 0;
            })();

            return (
              <>
                <div 
                  id="hud-completion-bar"
                  className="desktop-only"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(5, 15, 25, 0.75)',
                    border: '1.5px solid rgba(0, 255, 204, 0.5)',
                    borderRadius: '24px',
                    padding: '7px 20px',
                    boxShadow: '0 0 16px rgba(0, 255, 204, 0.22)',
                    pointerEvents: 'auto',
                    zIndex: 10,
                    overflow: 'hidden',
                    minWidth: '240px',
                    justifyContent: 'center'
                  }}
                  title="Progression globale de l'équipage sur la période active (pondération : 60% CO2, 20% Eau, 20% Déchets)"
                >
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.5) 0%, rgba(0, 255, 204, 0.7) 100%)',
                      boxShadow: '0 0 12px rgba(0, 255, 204, 0.6)',
                      borderRadius: '24px',
                      transition: 'width 0.8s ease-in-out',
                      zIndex: 1
                    }}
                  />
                  <Zap size={15} color="#ffffff" style={{ filter: 'drop-shadow(0 0 5px #00ffcc)', zIndex: 2, position: 'relative' }} />
                  <span style={{ 
                    fontSize: '0.78rem', 
                    fontWeight: '800', 
                    color: '#ffffff', 
                    letterSpacing: '0.6px', 
                    whiteSpace: 'nowrap',
                    zIndex: 2,
                    position: 'relative',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 255, 204, 0.5)'
                  }}>
                    TERRE 2070 : {pct}% RÉGÉNÉRÉE
                  </span>
                </div>

                {/* 2. Mode Mobile Portrait (Option 2) : Ligne Laser d'Énergie au bas du Header */}
                <div 
                  id="hud-laser-regen-bar" 
                  className="mobile-portrait-only"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '3px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'visible',
                    zIndex: 15,
                    pointerEvents: 'none'
                  }}
                >
                  <div 
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #00ffcc 100%)',
                      boxShadow: '0 0 8px #00ffcc, 0 0 4px #10b981',
                      position: 'relative',
                      transition: 'width 0.8s ease-in-out'
                    }}
                  >
                    {/* Point lumineux d'impact laser */}
                    <div 
                      style={{
                        position: 'absolute',
                        right: '-3px',
                        top: '-2px',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 0 8px #00ffcc, 0 0 12px #ffffff'
                      }} 
                    />
                  </div>

                  {/* Badge centré directement sur la ligne laser */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(5, 12, 28, 0.94)',
                      border: '1.2px solid rgba(0, 255, 204, 0.65)',
                      borderRadius: '12px',
                      padding: '2px 10px',
                      fontSize: '0.66rem',
                      fontWeight: '800',
                      color: '#00ffcc',
                      boxShadow: '0 0 10px rgba(0, 255, 204, 0.4), 0 2px 8px rgba(0, 0, 0, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      pointerEvents: 'none',
                      letterSpacing: '0.4px',
                      whiteSpace: 'nowrap',
                      zIndex: 20
                    }}
                  >
                    <Zap size={11} color="#00ffcc" style={{ filter: 'drop-shadow(0 0 4px #00ffcc)' }} />
                    <span>TERRE 2070 : {pct}%</span>
                  </div>
                </div>
              </>
            );
          })()}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', pointerEvents: 'auto' }}>

            {/* BARRE DE GAUCHE : BOUTONS FONCTIONNELS DE JEU */}

            {/* Switch Ère 2026/2070 (Icônes identiques au mobile) */}
            <button
              id="hud-epoch-switch"
              className="switch-btn desktop-only" 
              onClick={handleSwitchEra} 
              disabled={isTransitioning}
              title={era === '2026' ? 'Voyager vers le Radar 2070' : 'Retourner au QG 2026'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: era === '2026' ? 'rgba(0, 179, 255, 0.18)' : 'rgba(0, 255, 204, 0.18)',
                border: era === '2026' ? '1.5px solid #00b3ff' : '1.5px solid #00ffcc',
                color: era === '2026' ? '#00b3ff' : '#00ffcc',
                boxShadow: era === '2026' ? '0 0 10px rgba(0, 179, 255, 0.3)' : '0 0 10px rgba(0, 255, 204, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              {era === '2026' ? <Radio size={18} /> : <Globe size={18} />}
            </button>

            {/* Podium / Leaderboard */}
            <button 
              id="btn-podium-leaderboard"
              className={`switch-btn desktop-only ${view2026 === 'leaderboard' ? 'active' : ''}`}
              onClick={() => {
                setSelectedProfileId(null);
                setChatOpen(false);
                setShowExtrapolation(false);
                setShowRadar(false);
                if (era === '2070') {
                  handleSwitchEra();
                }
                setView2026(v => v === 'leaderboard' ? 'codex' : 'leaderboard');
              }}
              title={view2026 === 'leaderboard' ? "Retour au QG Codex" : "Afficher le Classement 3D"}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: view2026 === 'leaderboard' ? '#ffd700' : 'rgba(255, 215, 0, 0.15)',
                border: '1.5px solid #ffd700',
                color: view2026 === 'leaderboard' ? '#050a16' : '#ffd700',
                boxShadow: view2026 === 'leaderboard'
                  ? '0 0 20px #ffd700, 0 0 35px rgba(255, 215, 0, 0.8)'
                  : '0 0 10px rgba(255, 215, 0, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              <Trophy 
                size={20} 
                style={{ 
                  strokeWidth: view2026 === 'leaderboard' ? 2.8 : 1.8,
                  fill: view2026 === 'leaderboard' ? '#050a16' : 'transparent',
                  transform: view2026 === 'leaderboard' ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }} 
              />
            </button>

            {/* SÉPARATEUR VISUEL NET */}
            <div 
              style={{
                width: '1.5px',
                height: '24px',
                background: 'rgba(0, 255, 204, 0.35)',
                boxShadow: '0 0 8px rgba(0, 255, 204, 0.4)',
                margin: '0 3px'
              }}
            />



            {/* BARRE DE DROITE : WHATSAPP, AIDE (VIOLET/MAGENTA) & QUITTER */}

            {/* WhatsApp Équipe */}
            {whatsappInviteUrl && (
              <a
                id="hud-btn-whatsapp"
                href={whatsappInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Rejoindre le WhatsApp de mon Équipe"
                className="switch-btn"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(37, 211, 102, 0.2)',
                  border: '1.5px solid #25D366',
                  color: '#25D366',
                  boxShadow: '0 0 10px rgba(37, 211, 102, 0.3)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  pointerEvents: 'auto',
                  zIndex: 20
                }}
              >
                  <FaWhatsapp size={20} />
              </a>
            )}

            {/* Bouton d'Aide ? (Cercle Homogène & Typographie Premium) */}
            <button 
              id="hud-btn-help"
              className="switch-btn" 
              onClick={() => setShowOnboardingGuide(true)} 
              title="Relancer le guide interactif (Aide)"
              style={{ 
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(254, 243, 199, 0.15)',
                border: '1.5px solid #fef3c7',
                color: '#fef3c7',
                fontSize: '1.35rem',
                fontWeight: '800',
                fontFamily: 'Inter, system-ui, sans-serif',
                boxShadow: '0 0 10px rgba(254, 243, 199, 0.25)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              ?
            </button>

            {/* Quitter */}
            <button 
              className="switch-btn" 
              onClick={logoutUser} 
              title="Quitter la simulation"
              style={{ 
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 59, 59, 0.15)',
                border: '1.5px solid #ff3b3b',
                color: '#ff3b3b',
                boxShadow: '0 0 10px rgba(255, 59, 59, 0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

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
                  />
                ) : codexTab === 'missions' ? (
                  <MissionsCarousel3D
                    missions={missionsByCategory?.[selectedSector] || []}
                    loadingMissionId={loadingMissionId}
                    selectedSector={selectedSector}
                    onImpulse={(id) => handleImpulseMission(id)}
                    onCancelConfirm={(actionDoneId, label) => setCancelMissionConfirm({actionDoneId, label})}
                    onOpenMissionsWeek={() => setShowMissionsWeekModal(true)}
                  />
                ) : (
                  <ChallengesCarousel3D
                    receivedChallenges={receivedChallenges}
                    sentChallenges={sentChallenges}
                    missions={availableMissionsForChallenge}
                    loadingMissionId={loadingMissionId}
                    onRespond={handleRespondChallenge}
                    onImpulse={(id) => handleImpulseMission(id)}
                    onSendChallenge={() => setShowChallengeModal(true)}
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
            <div className="codex-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isCodexCollapsed ? 'column' : 'row', gap: '8px', padding: '10px 15px' }}>
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
                                    handleImpulseMission(missionWithChallenge.id);
                                  }
                                }}
                                style={missionWithChallenge.evoeMission?.isImpulsed ? {
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  borderColor: '#10b981',
                                  color: '#10b981'
                                } : {}}
                              >
                                {loadingMissionId === missionWithChallenge.id ? (
                                  <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                                ) : missionWithChallenge.evoeMission?.isImpulsed ? (
                                  "Déjà Impulsé"
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
                                  handleImpulseMission(mission.id);
                                }
                              }}
                              style={mission.evoeMission?.isImpulsed ? {
                                background: 'rgba(16, 185, 129, 0.15)',
                                borderColor: '#10b981',
                                color: '#10b981'
                              } : {}}
                            >
                              {loadingMissionId === mission.id ? (
                                <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                              ) : mission.evoeMission?.isImpulsed ? (
                                "Déjà Impulsé"
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
        {era === '2070' && (
          <>
            <div className="evoe-dashboards-container">
              {/* Panel de Gauche : Extrapolation Temporelle */}
              <aside id="panel-extrapolation-2070" className={`evoe-glass-panel panel-left ${showExtrapolation ? 'mobile-active' : ''}`}>
                <div className="evoe-panel-title-row">
                  <h2>Extrapolation 2070</h2>
                  <button className="panel-close-btn" onClick={() => setShowExtrapolation(false)}>×</button>
                </div>
                {extrapolation ? (
                  <>
                    {/* Jauge EOD N-1 vs N */}
                    <div className="jauge-eod-container">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <h3>Jour de Dépassement Mondial</h3>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          <span style={{ color: '#ef4444' }}>{extrapolation.dateDepassementSans?.slice(0,5)}</span>
                          <span style={{ color: '#a0aec0' }}>➔</span>
                          <span style={{ color: '#00ffcc', textShadow: '0 0 5px rgba(0,255,204,0.4)' }}>{extrapolation.dateDepassement?.slice(0,5)}</span>
                        </div>
                      </div>
                      <div className="jauge-eod-track">
                        {/* Zone de gain écologique */}
                        <div 
                          className="jauge-eod-gain" 
                          style={{ 
                            left: `${eodN1Percent}%`, 
                            width: `${Math.max(2, eodNPercent - eodN1Percent)}%` 
                          }}
                        />
                        {/* Marqueur EOD N-1 */}
                        <div 
                          className="jauge-eod-marker n1" 
                          style={{ left: `${eodN1Percent}%` }}
                          title={`Précédent : ${extrapolation.dateDepassementSans}`}
                        />
                        {/* Marqueur EOD N */}
                        <div 
                          className="jauge-eod-marker n" 
                          style={{ left: `${eodNPercent}%` }}
                          title={`Actuel : ${extrapolation.dateDepassement}`}
                        />
                      </div>
                      <div className="jauge-eod-labels">
                        <span>1er Janvier</span>
                        <span style={{ color: '#00ffcc', fontWeight: 'bold', textShadow: '0 0 5px rgba(0,255,204,0.2)' }}>Timeline Reculée !</span>
                        <span>31 Décembre</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,255,204,0.1)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#a0aec0', textTransform: 'uppercase' }}>Terres Nécessaires</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#00ffcc' }}>{extrapolation.nbPlanetes} 🌍</div>
                    </div>

                    {/* Grille d'impacts avec équivalences */}
                    <div className="metric-grid">
                      <div className="metric-card">
                        <div className="metric-icon-wrapper"><Shield size={18} /></div>
                        <div className="metric-info">
                          <span className="metric-label">Bouclier Cryo-Arctique</span>
                          <span className="metric-value">{fmtMass(extrapolation.iceSavedKg || 0)} ❄️</span>
                          <span className="metric-sub" style={{ color: '#10b981' }}>({fmtMass((extrapolation.co2RealTonnes || 0) * 1000)} de CO₂ évités en 2026)</span>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon-wrapper"><Zap size={18} /></div>
                        <div className="metric-info">
                          <span className="metric-label">Biomasse Génétique</span>
                          {(extrapolation.forestFootballFields || 0) >= 1 ? (
                            <>
                              <span className="metric-value">{(extrapolation.forestFootballFields || 0).toFixed(1)} zones 🍀</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(soit {(extrapolation.forestFootballFields || 0).toFixed(1)} terrains de foot préservés en 2026)</span>
                            </>
                          ) : (
                            <>
                              <span className="metric-value">{fmtMass((extrapolation.co2RealTonnes || 0) * 1000)} CO₂</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(absorbés par la biomasse végétale en 2026)</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon-wrapper"><Droplet size={18} /></div>
                        <div className="metric-info">
                          <span className="metric-label">Réserves Hydriques</span>
                          {(extrapolation.waterOlympicPools || 0) >= 1 ? (
                            <>
                              <span className="metric-value">{(extrapolation.waterOlympicPools || 0).toFixed(1)} cuves 🧪</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(soit {(extrapolation.waterOlympicPools || 0).toFixed(1)} piscines olympiques préservées en 2026)</span>
                            </>
                          ) : (
                            <>
                              <span className="metric-value">{fmtVolume(extrapolation.waterRealLitres || 0)}</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(d'eau potable épargnée en 2026)</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon-wrapper"><Trash2 size={18} /></div>
                        <div className="metric-info">
                          <span className="metric-label">Déchets Moléculaires</span>
                          {(extrapolation.wasteGarbageTrucks || 0) >= 1 ? (
                            <>
                              <span className="metric-value">{(extrapolation.wasteGarbageTrucks || 0).toFixed(1)} conteneurs 🔋</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(soit {(extrapolation.wasteGarbageTrucks || 0).toFixed(1)} camions-poubelles évités en 2026)</span>
                            </>
                          ) : (
                            <>
                              <span className="metric-value">{fmtMass(extrapolation.wasteRealKg || 0)}</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(de résidus non produits en 2026)</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '0.85rem' }}>Calcul de la projection temporelle...</p>
                )}
              </aside>

              {/* Panel de Droite : Course des Vaisseaux & Stase */}
              <aside id="panel-radar-2070" className={`evoe-glass-panel panel-right ${showRadar ? 'mobile-active' : ''}`}>
                <div className="evoe-panel-title-row">
                  <h2>Radar Temporel</h2>
                  <button 
                    className="evoe-reset-btn" 
                    onClick={handleResetPropulsion} 
                    disabled={isResettingPropulsion}
                    title="Recalculer les niveaux technologiques"
                  >
                    <RefreshCw className={`icon-sm ${isResettingPropulsion ? 'spin-loading' : ''}`} />
                  </button>
                  <button className="panel-close-btn" onClick={() => setShowRadar(false)}>×</button>
                </div>
                {dashboardStatus ? (
                  <div className="vessels-list">
                    {[...dashboardStatus.teams].sort((a, b) => b.position - a.position).map((t: any) => (
                      <div 
                        key={t.id} 
                        id={`radar-team-${t.id}`}
                        className={`vessel-row ${selectedRadarTeamId === t.id ? 'highlighted-vessel' : ''}`} 
                        style={{ 
                          borderLeftColor: t.color || '#00ffcc',
                          ...(selectedRadarTeamId === t.id ? {
                            background: 'rgba(0, 255, 204, 0.1)',
                            boxShadow: '0 0 15px rgba(0, 255, 204, 0.2)',
                            transform: 'scale(1.02)',
                            transition: 'all 0.3s ease'
                          } : {
                            transition: 'all 0.3s ease'
                          })
                        }}
                      >
                        <div className="vessel-row-header">
                          <span className="vessel-team-name" style={{ color: t.color || '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {t.icon ? (
                              <img 
                                src={`${EVOE_IMG_URL}teams/${t.icon.split('/').pop()}`} 
                                alt="" 
                                style={{ width: '24px', height: '24px', objectFit: 'contain', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', padding: '2px' }} 
                              />
                            ) : (
                              <span style={{ fontSize: '1.2rem', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🛸</span>
                            )}
                            {t.name}
                          </span>
                          <span className="vessel-tech" title={t.propulsionDesc}>
                            {t.propulsionType}
                          </span>
                        </div>
                        
                        <div className="vessel-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#a0aec0' }} title="CO₂ évité (kg/semaine)">
                            <Shield size={14} style={{ color: '#00ffcc' }} />
                            <strong style={{ color: '#fff' }}>{fmtMass(t.co2 || 0)}</strong>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#a0aec0' }} title="Eau épargnée (L)">
                            <Droplet size={14} style={{ color: '#00b3ff' }} />
                            <strong style={{ color: '#fff' }}>{fmtVolume(t.water || 0)}</strong>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#a0aec0' }} title="Déchets évités (kg)">
                            <Trash2 size={14} style={{ color: '#ff9f43' }} />
                            <strong style={{ color: '#fff' }}>{fmtMass(t.waste || 0)}</strong>
                          </span>
                        </div>

                        {/* Deux mini-compteurs circulaires de contrôle (Régénération & Stabilité) */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 20px', marginTop: '0px', marginBottom: '0px' }}>
                          <EvoeRadarMeter 
                            value={t.position || 0} 
                            label="REGEN." 
                            color="#00ffcc" 
                            id={`timeline-${t.id}`} 
                            displayValue={`${Math.round(t.position || 0)}%`}
                            tooltip="Taux de régénération planétaire apporté par ce vaisseau (60% CO₂, 20% Eau, 20% Déchets)."
                          />
                          <EvoeRadarMeter 
                            value={t.crewBioStability || 0} 
                            label="STABILITÉ" 
                            color={t.crewBioStability < 40 ? '#ff3b3b' : (t.crewBioStability < 80 ? '#ff9f43' : '#10b981')} 
                            id={`stability-${t.id}`} 
                            tooltip="Score de bio-stabilité de l'équipage. Mesure la synchronisation et la santé temporelle des agents du vaisseau."
                          />
                        </div>

                        {/* Alerte Paradoxe Temporel graduée et cohérente */}
                        {(() => {
                          const regen = t.position || 0;
                          const stability = t.crewBioStability || 0;
                          const points = t.points || 0;

                          if (points === 0 || regen === 0) {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#a0aec0', animation: 'none', opacity: 0.85, marginTop: '2px' }}>
                                <AlertTriangle size={13} style={{ filter: 'drop-shadow(0 0 2px rgba(160,174,192,0.4))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>En attente des premières impulsions du Codex.</span>
                              </div>
                            );
                          } else if (regen >= 75 && stability >= 70) {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#10b981', animation: 'none', opacity: 0.95, marginTop: '2px' }}>
                                <CheckCircle2 size={13} style={{ filter: 'drop-shadow(0 0 2px rgba(16,185,129,0.5))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Ligne temporelle optimale et flux hautement régénéré.</span>
                              </div>
                            );
                          } else if (regen >= 40 || stability >= 50) {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#ffd700', animation: 'none', marginTop: '2px' }}>
                                <CheckCircle2 size={13} style={{ filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.4))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Progression stable — Bon rythme d'impulsions.</span>
                              </div>
                            );
                          } else if (regen >= 15 || stability >= 25) {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#ff9f43', marginTop: '2px' }}>
                                <AlertTriangle size={13} style={{ filter: 'drop-shadow(0 0 2px rgba(255,159,67,0.4))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Légère désynchronisation temporelle détectée.</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#ff3b3b', marginTop: '2px' }}>
                                <AlertOctagon size={13} style={{ filter: 'drop-shadow(0 0 3px rgba(255,59,59,0.5))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Instabilité de la stase — Impulsions urgentes requises.</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '0.85rem' }}>Verrouillage des signatures thermiques des vaisseaux...</p>
                )}
              </aside>
            </div>

            {/* Carrousel de contrôle mobile en 2070 */}
            {isMobile && !selectedSector && !chatOpen && !selectedProfileId && !showLeaderboardModal && !showExtrapolation && !showRadar && (
              <MobileContextCarousel
                extrapolation={extrapolation}
                dashboardStatus={dashboardStatus}
                setShowExtrapolation={setShowExtrapolation}
                setShowRadar={setShowRadar}
              />
            )}

            {/* Dock de contrôle mobile au bas de l'écran (affiché uniquement sur desktop/tablette paysage) */}
            {!isMobile && (
              <div className="evoe-mobile-dock">
                <button 
                  className={`dock-btn ${showExtrapolation ? 'active' : ''}`}
                  onClick={() => setShowExtrapolation(v => !v)}
                >
                  📊 Extrapolation 2070
                </button>
                <button 
                  className={`dock-btn ${showRadar ? 'active' : ''}`}
                  onClick={() => setShowRadar(v => !v)}
                >
                  📡 Radar Temporel
                </button>
              </div>
            )}

            {/* Overlay d'arrière-plan pour fermer au clic en dehors */}
            {(showExtrapolation || showRadar) && (
              <div className="evoe-mobile-overlay" onClick={() => { setShowExtrapolation(false); setShowRadar(false); }} />
            )}
          </>
        )}

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
                    handleImpulseMission(expandedMission.id);
                  }
                }}
                style={expandedMission.evoeMission?.isImpulsed ? {
                  background: 'rgba(16, 185, 129, 0.15)',
                  borderColor: '#10b981',
                  color: '#10b981'
                } : {}}
              >
                {loadingMissionId === expandedMission.id ? (
                  <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                ) : expandedMission.evoeMission?.isImpulsed ? (
                  "Déjà Impulsé"
                ) : (
                  `Impulser (+${expandedMission.evoeMission?.amplitude || 10} IT)`
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
            />
          </Suspense>
        )}
      </AnimatePresence>



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
      />

      {/* Mobile Bottom Navbar (Axe 3) */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`nav-item ${era === '2026' && selectedSector && codexTab === 'missions' && !selectedProfileId && !showLeaderboardModal ? 'active' : ''}`}
          onClick={() => {
            setSelectedProfileId(null);
            setShowLeaderboardModal(false);
            setChatOpen(false);
            setCodexTab('missions');
            setIsCodexCollapsed(false); // Force expand the Codex panel
            if (era !== '2026') {
              handleSwitchEra();
            }
            // Dynamically select the first available category in database
            const cats = missionsByCategory ? Object.keys(missionsByCategory) : [];
            if (cats.length > 0) {
              setSelectedSector(cats[0]);
            } else {
              setSelectedSector('Energie');
            }
          }}
        >
          <Compass size={20} />
          <span>Missions</span>
        </button>

        <button 
          className={`nav-item ${era === '2026' && selectedSector && codexTab === 'challenges' && !selectedProfileId && !showLeaderboardModal ? 'active' : ''}`}
          onClick={() => {
            setSelectedProfileId(null);
            setShowLeaderboardModal(false);
            setChatOpen(false);
            setCodexTab('challenges');
            setIsCodexCollapsed(false); // Force expand the Codex panel
            if (era !== '2026') {
              handleSwitchEra();
            }
            if (!selectedSector) {
              const cats = missionsByCategory ? Object.keys(missionsByCategory) : [];
              if (cats.length > 0) {
                setSelectedSector(cats[0]);
              } else {
                setSelectedSector('Energie');
              }
            }
          }}
        >
          <Radio size={20} />
          <span>Défis</span>
        </button>


        {/* Central Floating Action Button (FAB) for Era Switch */}
        <div id="hud-btn-epoch-fab" className="fab-container">
          <button 
            className="fab-button"
            onClick={handleSwitchEra}
            disabled={isTransitioning}
            title={era === '2026' ? 'Voyager vers 2070' : 'Retourner en 2026'}
            style={{
              background: era === '2026' 
                ? 'linear-gradient(135deg, #00b3ff, #0055ff)' 
                : 'linear-gradient(135deg, #00ffcc, #00aa66)',
              boxShadow: era === '2026'
                ? '0 4px 15px rgba(0, 179, 255, 0.4), 0 0 0 4px rgba(0, 179, 255, 0.05)'
                : '0 4px 15px rgba(0, 255, 204, 0.4), 0 0 0 4px rgba(0, 255, 204, 0.05)'
            }}
          >
            {era === '2026' ? (
              <Radio size={24} className="fab-pulse-icon" style={{ color: '#050a16' }} />
            ) : (
              <Globe size={24} className="fab-pulse-icon" style={{ color: '#050a16' }} />
            )}
          </button>
        </div>

        <button 
          className={`nav-item ${view2026 === 'leaderboard' ? 'active' : ''}`}
          onClick={() => {
            setSelectedProfileId(null);
            setChatOpen(false);
            setShowExtrapolation(false);
            setShowRadar(false);
            if (era === '2070') {
              handleSwitchEra();
            }
            setView2026(v => v === 'leaderboard' ? 'codex' : 'leaderboard');
          }}
          style={
            view2026 === 'leaderboard' ? {
              color: '#ffd700',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.6)'
            } : {}
          }
        >
          <Trophy 
            size={20} 
            style={{
              strokeWidth: view2026 === 'leaderboard' ? 2.8 : 1.8,
              fill: view2026 === 'leaderboard' ? '#ffd700' : 'transparent',
              filter: view2026 === 'leaderboard' ? 'drop-shadow(0 0 8px #ffd700)' : 'none',
              transform: view2026 === 'leaderboard' ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.2s ease'
            }}
          />
          <span style={{ fontWeight: view2026 === 'leaderboard' ? 800 : 500 }}>Scores</span>
        </button>

        <button 
          id="hud-btn-chat"
          className={`nav-item ${chatOpen ? 'active' : ''}`}
          onClick={() => {
            setSelectedProfileId(null);
            setShowLeaderboardModal(false);
            setChatOpen(!chatOpen);
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={20} />
            {unreadChat.total > 0 && (
              <span className="nav-badge">{unreadChat.total}</span>
            )}
          </div>
          <span>Chat</span>
        </button>
      </nav>

      {/* Guide d'Onboarding / Visite Guidée Interactive */}
      <OnboardingGuide 
        isOpen={showOnboardingGuide}
        onClose={() => setShowOnboardingGuide(false)}
        onNavigateStep={handleNavigateGuideStep}
        teamName={childInfos?.group?.team?.name}
        userId={currentUserId}
      />

      {/* Badge Discret de Version App en bas à gauche */}
      <div 
        className="app-version-badge"
        style={{
          position: 'fixed',
          bottom: '12px',
          left: '16px',
          zIndex: 100,
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.8px',
          color: era === '2026' ? 'rgba(0, 179, 255, 0.5)' : 'rgba(0, 255, 204, 0.5)',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          userSelect: 'none',
          textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)'
        }}
      >
        v{pkg.version}
      </div>
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
