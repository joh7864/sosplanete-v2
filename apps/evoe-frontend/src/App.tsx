import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Radio, Scan, LogOut, ChevronRight, ChevronLeft, Shield, Trash2, Droplet, Zap, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import axios from 'axios';
import Portal2026 from './components/Portal2026';
import Portal2070 from './components/Portal2070';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
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
  const [era, setEra] = useState<'2026' | '2070'>('2026');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [isCodexCollapsed, setIsCodexCollapsed] = useState(false);
  const [expandedMission, setExpandedMission] = useState<any | null>(null);
  const [popoverPos, setPopoverPos] = useState(0);

  // States pour les métriques de Sprint 2
  const [extrapolation, setExtrapolation] = useState<any>(null);
  const [dashboardStatus, setDashboardStatus] = useState<any>(null);
  const [activeMobilePanel, setActiveMobilePanel] = useState<'extrapolation' | 'radar' | null>(null);
  const [isResettingPropulsion, setIsResettingPropulsion] = useState(false);

  const [allowPortrait, setAllowPortrait] = useState<boolean>(() => {
    return localStorage.getItem('evoe_allow_portrait') === 'true';
  });

  const handleBypassOrientation = () => {
    setAllowPortrait(true);
    localStorage.setItem('evoe_allow_portrait', 'true');
  };

  const { user, childInfos, missions, logoutUser, instanceChoices, players, instanceId } = useAuth();

  const fetchEvoeData = () => {
    if (!instanceId) return;
    axios.get(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/extrapolation/metrics`)
      .then(res => setExtrapolation(res.data))
      .catch(err => console.error("Erreur extrapolation:", err));

    axios.get(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/dashboard/status/${instanceId}`)
      .then(res => setDashboardStatus(res.data))
      .catch(err => console.error("Erreur dashboard status:", err));
  };

  const handleResetPropulsion = async () => {
    if (!instanceId || isResettingPropulsion) return;
    setIsResettingPropulsion(true);
    try {
      await axios.post(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/propulsion/reset/${instanceId}`);
      fetchEvoeData();
    } catch (err) {
      console.error("Erreur réinitialisation propulsion:", err);
    } finally {
      setIsResettingPropulsion(false);
    }
  };

  // Redirection si non connecté
  if (!user || instanceChoices) {
    return <Navigate to="/login" replace />;
  }

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

  // Récupérer les données de projection / course quand on est en 2070
  useEffect(() => {
    let interval: any = null;

    if (era === '2070') {
      fetchEvoeData();
      // Poll toutes les 10 secondes pour avoir la course en temps réel
      interval = setInterval(fetchEvoeData, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [era, instanceId]);

  const handleSwitchEra = () => {
    setIsTransitioning(true);
    setActiveMobilePanel(null);
    setTimeout(() => {
      setEra(prev => prev === '2026' ? '2070' : '2026');
      setIsTransitioning(false);
    }, 1000); // 1s de transition "zoom visière"
  };

  // Grouper les missions par categorySF
  const missionsByCategory = missions?.reduce((acc: Record<string, any[]>, mission: any) => {
    const cat = mission.categorySF || 'Secteur Inconnu';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mission);
    return acc;
  }, {});

  // Trouver les informations de profil du Gardien connecté
  const currentPlayer = players?.find(p => p.id === childInfos?.id);
  const getAvatarUrl = () => {
    if (currentPlayer?.avatar && currentPlayer.avatar !== 'avatars/default.png') {
      return `${EVOE_IMG_URL}${currentPlayer.avatar}`;
    }
    let hash = 0;
    const name = childInfos?.pseudo || '';
    for (let i = 0; i < name.length; i++) {
      hash += name.charCodeAt(i);
    }
    let avatarIndex = 1;
    // Approximation de l'âge à partir de birthDate si disponible
    let age = 18;
    if (currentPlayer?.birthDate) {
      age = new Date().getFullYear() - new Date(currentPlayer.birthDate).getFullYear();
    }
    if (currentPlayer?.gender === 'E' || age < 15) {
      avatarIndex = 34 + (hash % 6);
    } else if (currentPlayer?.gender === 'F') {
      avatarIndex = 22 + (hash % 12);
    } else if (currentPlayer?.gender === 'M') {
      avatarIndex = 1 + (hash % 21);
    } else {
      avatarIndex = (hash % 39) + 1;
    }
    const formattedIndex = avatarIndex.toString().padStart(2, '0');
    return `${EVOE_IMG_URL}avatars_3D/avatar_${formattedIndex}.png`;
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

  return (
    <div className="app-container">
      {/* Overlay Mode Portrait (Paysage Requis) */}
      {!allowPortrait && (
        <div className="orientation-warning">
          <div className="orientation-warning-content">
            <div className="phone-rotate-icon">🔄</div>
            <h2>ALERTE MATRICE NEXUS</h2>
            <p>
              Veuillez tourner votre appareil en <strong>mode paysage</strong> (horizontal) pour synchroniser le Codex Temporel.
            </p>
            <button 
              className="switch-btn" 
              style={{ marginTop: '15px', padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={handleBypassOrientation}
            >
              Continuer en Portrait
            </button>
          </div>
        </div>
      )}

      {/* Three.js Canvas Container */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }} dpr={[1, 2]}>
          {era === '2026' ? (
            <Portal2026 
              categories={missionsByCategory ? Object.keys(missionsByCategory) : []} 
              onSelectSector={setSelectedSector} 
            />
          ) : (
            <Portal2070 dashboardStatus={dashboardStatus} />
          )}
        </Canvas>
      </div>

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#00ffcc', fontWeight: 'bold', textShadow: '0 0 5px rgba(0,255,204,0.3)', pointerEvents: 'auto' }}>
                  <img 
                    src={getAvatarUrl()} 
                    alt="" 
                    className="avatar-pulse-ring"
                    style={{ width: '24px', height: '24px', borderRadius: '50%', border: `1.5px solid ${currentPlayer?.color || '#00ffcc'}`, objectFit: 'cover' }} 
                  />
                  <span>Agent Temporel {childInfos.pseudo}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {era === '2026' && selectedSector && (
              <button className="switch-btn" onClick={() => setSelectedSector(null)}>
                Fermer le Codex
              </button>
            )}
            <button 
              className="switch-btn" 
              onClick={() => {
                const newVal = !allowPortrait;
                setAllowPortrait(newVal);
                localStorage.setItem('evoe_allow_portrait', String(newVal));
              }}
              title={allowPortrait ? "Forcer le mode Paysage (Activer l'alerte)" : "Autoriser le mode Portrait (Désactiver l'alerte)"}
            >
              {allowPortrait ? <Smartphone className="icon-sm" /> : <Monitor className="icon-sm" />}
              {allowPortrait ? 'Portrait Autorisé' : 'Paysage Requis'}
            </button>
            <button className="switch-btn" onClick={handleSwitchEra} disabled={isTransitioning}>
              {era === '2026' ? <Scan className="icon-sm" /> : <Radio className="icon-sm" />}
              {era === '2026' ? 'Ouvrir le Radar 2070' : 'Retour au QG 2026'}
            </button>
            <button className="switch-btn" onClick={logoutUser} style={{ background: '#ff3b3b', color: '#fff' }}>
              <LogOut className="icon-sm" /> Quitter
            </button>
          </div>
        </header>

        {/* CONTENU 2026 : Le Codex Temporel (Panel UI) */}
        {era === '2026' && selectedSector && (
          <aside 
            className={`codex-panel ${isCodexCollapsed ? 'collapsed' : ''}`}
            onScroll={() => setExpandedMission(null)} // Ferme le pop-over au scroll
          >
            <div className="codex-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {!isCodexCollapsed && <h2>Codex Temporel {childInfos?.pseudo ? `- ${childInfos.pseudo}` : ''}</h2>}
              <button 
                className="collapse-btn" 
                onClick={() => {
                  setIsCodexCollapsed(!isCodexCollapsed);
                  setExpandedMission(null);
                }}
                style={{ background: 'transparent', border: 'none', color: '#00ffcc', cursor: 'pointer', margin: isCodexCollapsed ? '0 auto' : '0 0 0 auto', padding: '5px' }}
              >
                {isCodexCollapsed ? <ChevronRight /> : <ChevronLeft />}
              </button>
            </div>
            
            <div className="mission-list">
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
                      </div>
                      {!isCodexCollapsed && (
                        <>
                          <p>{parseBold(mission.evoeMission?.descriptionSF || mission.description || "Mission secrète en attente de déchiffrage.")}</p>
                          <button className="hack-btn" disabled={mission.evoeMission?.isHacked}>
                            {mission.evoeMission?.isHacked 
                              ? "Déjà Hacké" 
                              : `Hacker (+${mission.evoeMission?.pointsGagnes || mission.co2Year || 10} pts)`}
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
            </div>
          </aside>
        )}

        {/* CONTENU 2070 : Double Tableau de Bord Flottant (Extrapolation & Course) */}
        {era === '2070' && (
          <>
            <div className="evoe-dashboards-container">
              {/* Panel de Gauche : Extrapolation Temporelle */}
              <aside className={`evoe-glass-panel panel-left ${activeMobilePanel === 'extrapolation' ? 'mobile-active' : ''}`}>
                <div className="evoe-panel-title-row">
                  <h2>Extrapolation 2070</h2>
                  <button className="panel-close-btn" onClick={() => setActiveMobilePanel(null)}>×</button>
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
              <aside className={`evoe-glass-panel panel-right ${activeMobilePanel === 'radar' ? 'mobile-active' : ''}`}>
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
                  <button className="panel-close-btn" onClick={() => setActiveMobilePanel(null)}>×</button>
                </div>
                {dashboardStatus ? (
                  <div className="vessels-list">
                    {dashboardStatus.teams.map((t: any) => (
                      <div key={t.id} className="vessel-row" style={{ borderLeftColor: t.color || '#00ffcc' }}>
                        <div className="vessel-row-header">
                          <span className="vessel-team-name" style={{ color: t.color || '#fff' }}>
                            🛸 {t.name}
                          </span>
                          <span className="vessel-tech" title={t.propulsionDesc}>
                            {t.propulsionType}
                          </span>
                        </div>
                        
                        <div className="vessel-stats-grid">
                          <span>Vitesse : <strong>{t.speed} nd/s</strong></span>
                          <span>Timeline : <strong>{t.position}%</strong></span>
                        </div>

                        {/* Barre de stase / santé de l'équipage */}
                        <div className="vessel-health-container">
                          <div className="vessel-health-label">
                            <span>Stabilité Équipage (Agents Temporels)</span>
                            <span style={{ fontWeight: 'bold', color: t.crewBioStability < 50 ? '#ff3b3b' : (t.crewBioStability < 100 ? '#ff9f43' : '#10b981') }}>
                              {t.crewBioStability}%
                            </span>
                          </div>
                          <div className="vessel-health-track">
                            <div 
                              className="vessel-health-bar" 
                              style={{ 
                                width: `${t.crewBioStability}%`,
                                background: t.crewBioStability < 50 ? '#ff3b3b' : (t.crewBioStability < 100 ? '#ff9f43' : '#10b981')
                              }}
                            />
                          </div>
                          {t.crewBioStability < 100 && (
                            <div className="vessel-paradox-warning">
                              ⚠️ Paradoxe Ancestral : Agents Temporels en stase !
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '0.85rem' }}>Verrouillage des signatures thermiques des vaisseaux...</p>
                )}
              </aside>
            </div>

            {/* Dock de contrôle mobile au bas de l'écran */}
            <div className="evoe-mobile-dock">
              <button 
                className={`dock-btn ${activeMobilePanel === 'extrapolation' ? 'active' : ''}`}
                onClick={() => setActiveMobilePanel(activeMobilePanel === 'extrapolation' ? null : 'extrapolation')}
              >
                📊 Extrapolation 2070
              </button>
              <button 
                className={`dock-btn ${activeMobilePanel === 'radar' ? 'active' : ''}`}
                onClick={() => setActiveMobilePanel(activeMobilePanel === 'radar' ? null : 'radar')}
              >
                📡 Radar Temporel
              </button>
            </div>

            {/* Overlay d'arrière-plan pour fermer au clic en dehors */}
            {activeMobilePanel && (
              <div className="evoe-mobile-overlay" onClick={() => setActiveMobilePanel(null)} />
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
              <button className="hack-btn" disabled={expandedMission.evoeMission?.isHacked}>
                {expandedMission.evoeMission?.isHacked 
                  ? "Déjà Hacké" 
                  : `Hacker (+${expandedMission.evoeMission?.pointsGagnes || expandedMission.co2Year || 10} pts)`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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
