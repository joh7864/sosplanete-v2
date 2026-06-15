import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Radio, Scan, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';
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

function MainApp() {
  const [era, setEra] = useState<'2026' | '2070'>('2026');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [isCodexCollapsed, setIsCodexCollapsed] = useState(false);
  const [expandedMission, setExpandedMission] = useState<any | null>(null);
  const [popoverPos, setPopoverPos] = useState(0);

  const { user, childInfos, missions, logoutUser, instanceChoices } = useAuth();

  // Redirection si non connecté
  if (!user || instanceChoices) {
    return <Navigate to="/login" replace />;
  }

  // Fermer le pop-over holographique si on clique n'importe où en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // On ferme seulement si le clic n'est ni sur le popover, ni sur une icône du dock
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

  const handleSwitchEra = () => {
    setIsTransitioning(true);
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

  return (
    <div className="app-container">
      {/* Three.js Canvas Container */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
          {era === '2026' ? (
            <Portal2026 
              categories={missionsByCategory ? Object.keys(missionsByCategory) : []} 
              onSelectSector={setSelectedSector} 
            />
          ) : (
            <Portal2070 />
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
            <h1>EVOE {era}</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {era === '2026' && selectedSector && (
              <button className="switch-btn" onClick={() => setSelectedSector(null)}>
                Fermer le Codex
              </button>
            )}
            <button className="switch-btn" onClick={handleSwitchEra} disabled={isTransitioning}>
              {era === '2026' ? <Scan className="icon-sm" /> : <Radio className="icon-sm" />}
              {era === '2026' ? 'Ouvrir le Radar 2070' : 'Retour au QG 2026'}
            </button>
            <button className="switch-btn" onClick={logoutUser} style={{ background: '#ff3b3b', color: '#fff' }}>
              <LogOut className="icon-sm" /> Quitter
            </button>
          </div>
        </header>

        {/* Le Codex Temporel (Panel UI) */}
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
