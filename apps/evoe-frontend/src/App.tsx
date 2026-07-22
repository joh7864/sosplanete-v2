import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Radio, Scan, LogOut, ChevronRight, ChevronLeft, Shield, Trash2, Droplet, Zap, RefreshCw, Smartphone, AlertTriangle, AlertOctagon, CheckCircle2, X, Trophy, Mail, RotateCcw, Compass, MessageSquare, Globe } from 'lucide-react';
import Portal2026 from './components/Portal2026';
import Portal2070 from './components/Portal2070';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import TemporalBriefing from './components/TemporalBriefing';
import ChatPanel from './components/ChatPanel';

// Hooks & UI Components
import { useEvoeData } from './hooks/useEvoeData';
import { EvoeRadarMeter } from './components/ui/EvoeRadarMeter';
import { AgentProfileModal } from './components/ui/AgentProfileModal';

import { ChallengeModal } from './components/ui/ChallengeModal';
import { ConfirmCancelModal } from './components/ui/ConfirmCancelModal';
import MobileContextCarousel from './components/ui/MobileContextCarousel';

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
    challengeError, setChallengeError,
    isSubmittingChallenge,
    cancelMissionConfirm, setCancelMissionConfirm,
    showLeaderboardModal, setShowLeaderboardModal,
    selectedProfileId, setSelectedProfileId,
    allowPortrait, setAllowPortrait,
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


  // Swipe gesture detection to toggle Era (2026 <-> 2070)
  const swipeStartX = useRef(0);
  const swipeEndX = useRef(0);

  const handleTouchStartApp = (e: React.TouchEvent) => {
    if (era === '2070') return; // Geste désactivé en 2070 pour éviter de retourner accidentellement en 2026
    // Avoid triggering if touch is on active input, button or interactive panels
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select') || 
      target.closest('.codex-panel') || 
      target.closest('.chat-sidebar-container') || 
      target.closest('.agent-profile-modal') || 
      target.closest('.mobile-bottom-nav') ||
      target.closest('canvas')
    ) {
      return;
    }

    const startX = e.touches[0].clientX;
    const width = window.innerWidth;
    
    // Ignore edge swipes (outer 10% on left and right) to avoid conflicting with system Back gestures
    if (startX < width * 0.1 || startX > width * 0.9) {
      return;
    }
    
    swipeStartX.current = startX;
    swipeEndX.current = startX;
  };

  const handleTouchMoveApp = (e: React.TouchEvent) => {
    swipeEndX.current = e.touches[0].clientX;
  };

  const handleTouchEndApp = () => {
    if (!swipeStartX.current) return;
    
    const diffX = swipeEndX.current - swipeStartX.current;
    
    // Swipe left (diffX < -100px) or right (diffX > 100px) to switch Era
    if (Math.abs(diffX) > 100) {
      handleSwitchEra();
    }
    
    swipeStartX.current = 0;
    swipeEndX.current = 0;
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


  const { user, childInfos, missions, logoutUser, instanceChoices, players, instanceId } = useAuth();


  // L'early return doit être après tous les hooks
  const shouldRedirect = !user || instanceChoices;

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
    
    const cat = mission.categorySF || 'Secteur Inconnu';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mission);
    return acc;
  }, {});

  const receivedChallenges = challenges.filter(c => c.targetTeamId === myTeamId);
  const sentChallenges = challenges.filter(c => c.challengerTeamId === myTeamId);
  const otherTeams = dashboardStatus?.teams?.filter((t: any) => t.id !== myTeamId) || [];
  const availableMissionsForChallenge = missions || [];

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
    <div 
      className="app-container"
      onTouchStart={handleTouchStartApp}
      onTouchMove={handleTouchMoveApp}
      onTouchEnd={handleTouchEndApp}
    >

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
              onSelectSector={setSelectedSector} 
              onSelectPlayer={handleSelectPlayer}
              onlineUsers={onlineUsers}
              unreadTeam={unreadChat.team}
              unreadMps={unreadChat.unreadMps}
              isMobile={isMobile}
              view={view2026}
              dashboardStatus={dashboardStatus}
              onCloseLeaderboard={() => setView2026('codex')}
            />
          ) : (
            <Portal2070 
              dashboardStatus={dashboardStatus} 
              onEarthClick={handleEarthClick} 
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
          <div className="logo">
            <Hexagon className="icon" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h1>EVOE {era}</h1>
              {childInfos && (
                <div 
                  onClick={() => setSelectedProfileId(childInfos.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#00ffcc', fontWeight: 'bold', textShadow: '0 0 5px rgba(0,255,204,0.3)', pointerEvents: 'auto', cursor: 'pointer', position: 'relative' }}
                >
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={getAvatarUrl()} 
                      alt="" 
                      className="avatar-pulse-ring"
                      style={{ width: '24px', height: '24px', borderRadius: '50%', border: `1.5px solid ${currentPlayer?.color || '#00ffcc'}`, objectFit: 'cover' }} 
                    />
                    {unreadChat.total > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
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
                  <span>Agent Temporel {childInfos.pseudo}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>

            {/* Toggle Portrait / Paysage */}
            <button
              className="switch-btn desktop-only"
              onClick={() => {
                const next = !allowPortrait;
                setAllowPortrait(next);
                localStorage.setItem('evoe_allow_portrait', String(next));
              }}
              title={allowPortrait ? 'Mode Portrait autorisé — cliquer pour forcer le paysage' : 'Paysage forcé — cliquer pour autoriser le portrait'}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', padding: '0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: allowPortrait ? 'rgba(0,255,204,0.15)' : 'rgba(0,179,255,0.15)',
                border: allowPortrait ? '1.5px solid #00ffcc' : '1.5px solid #00b3ff',
                color: allowPortrait ? '#00ffcc' : '#00b3ff',
                boxShadow: allowPortrait ? '0 0 10px rgba(0,255,204,0.2)' : '0 0 10px rgba(0,179,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Smartphone 
                size={18} 
                style={{ 
                  transform: allowPortrait ? 'rotate(0deg)' : 'rotate(90deg)', 
                  transition: 'transform 0.3s ease' 
                }} 
              />
            </button>

            <button
              className="switch-btn desktop-only" 
              onClick={handleSwitchEra} 
              disabled={isTransitioning}
              title={era === '2026' ? 'Ouvrir le Radar 2070' : 'Retour au QG 2026'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 179, 255, 0.15)',
                border: '1.5px solid #00b3ff',
                color: '#00b3ff',
                boxShadow: '0 0 10px rgba(0, 179, 255, 0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              {era === '2026' ? <Scan size={18} /> : <Radio size={18} />}
            </button>
            <button 
              className={`switch-btn desktop-only ${view2026 === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setView2026(v => v === 'leaderboard' ? 'codex' : 'leaderboard')}
              title={view2026 === 'leaderboard' ? "Retour au QG Codex" : "Afficher le Classement"}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 215, 0, 0.15)',
                border: '1.5px solid #ffd700',
                color: '#ffd700',
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <Trophy size={18} />
            </button>
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
        {era === '2026' && selectedSector && (
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
                            {!isCodexCollapsed && <h3>{missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label}</h3>}
                          </div>
                          {!isCodexCollapsed && (
                            <>
                              <p>{parseBold(missionWithChallenge.evoeMission?.descriptionSF || missionWithChallenge.description || "Mission secrète en attente de déchiffrage.")}</p>
                              <button 
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
                                  `Impulser (+${missionWithChallenge.evoeMission?.amplitude || 10} AT)`
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
                    
                    {missionsByCategory[selectedSector].map((mission: any) => (
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
                          {!isCodexCollapsed && <h3>{mission.evoeMission?.titreSF || mission.label}</h3>}
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
                            <p>{parseBold(mission.evoeMission?.descriptionSF || mission.description || "Mission secrète en attente de déchiffrage.")}</p>
                            <button 
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
                                `Impulser (+${mission.evoeMission?.amplitude || 10} AT)`
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
              <aside className={`evoe-glass-panel panel-left ${showExtrapolation ? 'mobile-active' : ''}`}>
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
              <aside className={`evoe-glass-panel panel-right ${showRadar ? 'mobile-active' : ''}`}>
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
                      <div key={t.id} className="vessel-row" style={{ borderLeftColor: t.color || '#00ffcc' }}>
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

                        {/* Deux mini-compteurs circulaires de contrôle (Timeline & Stase) */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 20px', marginTop: '0px', marginBottom: '0px' }}>
                          {(() => {
                            const startYearMatch = dashboardStatus?.schoolYear?.match(/^(\d{4})-\d{4}$/);
                            const startYear = startYearMatch ? parseInt(startYearMatch[1], 10) : 2026;
                            const calculatedYear = Math.min(startYear + 44, startYear + Math.round(((t.position || 0) * 44) / 100 / 5) * 5);
                            return (
                              <EvoeRadarMeter 
                                value={t.position} 
                                label="TIMELINE" 
                                color="#ffd700" 
                                id={`timeline-${t.id}`} 
                                displayValue={String(calculatedYear)}
                                tooltip="État de la Terre et progression de la ligne temporelle vers 2070. Les défis et missions réussis permettent de stabiliser le futur et de repousser la dystopie."
                              />
                            );
                          })()}
                          <EvoeRadarMeter 
                            value={t.crewBioStability} 
                            label="STABILITÉ" 
                            color={t.crewBioStability < 40 ? '#ff3b3b' : (t.crewBioStability < 80 ? '#ff9f43' : '#10b981')} 
                            id={`stability-${t.id}`} 
                            tooltip="Score de santé de l'équipage. S'il est trop bas, la stase se fige et vous ne pouvez plus modifier la dystopie future (seuil minimal d'action : 10%)."
                          />
                        </div>

                        {/* Alerte Paradoxe Temporel graduée */}
                        {(() => {
                          const stability = t.crewBioStability;
                          if (stability === 100) {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#10b981', animation: 'none', opacity: 0.85, marginTop: '2px' }}>
                                <CheckCircle2 size={13} style={{ filter: 'drop-shadow(0 0 2px rgba(16,185,129,0.4))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Ligne temporelle stable et entièrement synchronisée.</span>
                              </div>
                            );
                          } else if (stability >= 80) {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#ffd700', animation: 'none', marginTop: '2px' }}>
                                <AlertTriangle size={13} style={{ filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.4))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Légère désynchronisation temporelle détectée.</span>
                              </div>
                            );
                          } else if (stability >= 40) {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#ff9f43', marginTop: '2px' }}>
                                <AlertTriangle size={13} style={{ filter: 'drop-shadow(0 0 2px rgba(255,159,67,0.4))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Instabilité de la stase. Impulsions de missions requises !</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#ff3b3b', marginTop: '2px' }}>
                                <AlertOctagon size={13} style={{ filter: 'drop-shadow(0 0 3px rgba(255,59,59,0.5))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Paradoxe temporel imminent ! Agents en stase prolongée.</span>
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
                  `Impulser (+${expandedMission.evoeMission?.amplitude || 10} AT)`
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Création de Défi PvP */}
      <ChallengeModal
        showChallengeModal={showChallengeModal}
        setShowChallengeModal={setShowChallengeModal}
        challengeTargetTeamId={challengeTargetTeamId}
        setChallengeTargetTeamId={setChallengeTargetTeamId}
        challengeLocalActionId={challengeLocalActionId}
        setChallengeLocalActionId={setChallengeLocalActionId}
        challengePledge={challengePledge}
        setChallengePledge={setChallengePledge}
        challengeError={challengeError}
        isSubmittingChallenge={isSubmittingChallenge}
        handleSendChallenge={handleSendChallenge}
        otherTeams={otherTeams}
        availableMissionsForChallenge={availableMissionsForChallenge}
      />

      {/* Modal de Confirmation d'Annulation de Mission */}
      <ConfirmCancelModal
        cancelMissionConfirm={cancelMissionConfirm}
        setCancelMissionConfirm={setCancelMissionConfirm}
        handleCancelMission={handleCancelMission}
      />

      {/* Modal du Profil Agent */}
      <AnimatePresence>
        {selectedProfileId !== null && (
          <AgentProfileModal
            profileId={selectedProfileId}
            onClose={() => setSelectedProfileId(null)}
            isOwner={selectedProfileId === childInfos?.id}
            refreshData={fetchEvoeData}
          />
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
              setSelectedSector('Secteur Énergétique & Plasma');
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
                setSelectedSector('Secteur Énergétique & Plasma');
              }
            }
          }}
        >
          <Radio size={20} />
          <span>Défis</span>
        </button>


        {/* Central Floating Action Button (FAB) for Era Switch */}
        <div className="fab-container">
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
            setView2026(v => v === 'leaderboard' ? 'codex' : 'leaderboard');
          }}
        >
          <Trophy size={20} />
          <span>Scores</span>
        </button>

        <button 
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
