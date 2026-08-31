import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown, Search, Shield, Check, Clock, Sparkles, Plus, Edit3, Save, X } from 'lucide-react';

interface ChallengeModalProps {
  showChallengeModal: boolean;
  setShowChallengeModal: (show: boolean) => void;
  challengeTargetTeamId: number | '';
  setChallengeTargetTeamId: (id: number | '') => void;
  challengeLocalActionId: number | '';
  setChallengeLocalActionId: (id: number | '') => void;
  challengePledge: string;
  setChallengePledge: (pledge: string) => void;
  challengeDurationHours: number | '';
  setChallengeDurationHours: (hours: number | '') => void;
  challengeError: string | null;
  isSubmittingChallenge: boolean;
  handleSendChallenge: (e: React.FormEvent) => void;
  otherTeams: any[];
  availableMissionsForChallenge: any[];
}

const DURATION_OPTIONS = [
  { value: 24, label: '24 heures (1 jour express)', emoji: '⚡' },
  { value: 48, label: '48 heures (2 jours standard)', emoji: '⏳' },
  { value: 72, label: '72 heures (3 jours étendu)', emoji: '📅' },
  { value: '', label: "Jusqu'à la fin de la période active", emoji: '⌛' },
];

const DEFAULT_SF_PLEDGES = [
  { id: 'croissants', text: "Payer les croissants temporels à l'équipage", emoji: '🥐' },
  { id: 'sf_song', text: "Chanter le refrain d'un générique SF", emoji: '🎤' },
  { id: 'robot_voice', text: "Parler avec une voix de robot IA pendant 15 min", emoji: '🤖' },
  { id: 'gravity_pushups', text: "Faire 10 pompes à gravité zéro en direct", emoji: '💪' },
  { id: 'space_coffee', text: "Servir le carburant galactique (café/thé)", emoji: '☕' },
  { id: 'alien_joke', text: "Raconter la pire blague d'extraterrestre", emoji: '🌌' },
  { id: 'vulcan_salute', text: "Saluer tout le monde avec le salut vulcain", emoji: '🖖' },
  { id: 'space_shout', text: "Faire le bruitage d'un décollage de fusée", emoji: '🚀' },
  { id: 'quantum_avatar', text: "Changer son avatar par un alien pendant 24h", emoji: '👽' },
  { id: 'nexus_oath', text: "Déclarer son allégeance au Nexus 2070", emoji: '📜' },
  { id: 'antimatter_cookies', text: "Apporter des cookies d'antimatière au débrief", emoji: '🍪' },
  { id: 'laser_duel', text: "Mimer un duel de sabre laser au ralenti", emoji: '⚔️' },
];

export function ChallengeModal({
  showChallengeModal,
  setShowChallengeModal,
  challengeTargetTeamId,
  setChallengeTargetTeamId,
  challengeLocalActionId,
  setChallengeLocalActionId,
  challengePledge,
  setChallengePledge,
  challengeDurationHours,
  setChallengeDurationHours,
  challengeError,
  isSubmittingChallenge,
  handleSendChallenge,
  otherTeams,
  availableMissionsForChallenge
}: ChallengeModalProps) {
  const [hoveredMissionId, setHoveredMissionId] = useState<number | null>(null);
  const [isMissionListOpen, setIsMissionListOpen] = useState(false);
  const [isTeamListOpen, setIsTeamListOpen] = useState(false);
  const [isDurationListOpen, setIsDurationListOpen] = useState(false);
  const [isPledgeListOpen, setIsPledgeListOpen] = useState(false);
  const [isCustomPledgeInput, setIsCustomPledgeInput] = useState(false);

  const [missionSearch, setMissionSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [pledgeSearch, setPledgeSearch] = useState('');

  const [customPledges, setCustomPledges] = useState<Array<{ id: string; text: string; emoji: string }>>([]);

  // Charger les gages personnalisés depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('evoe_custom_pledges');
      if (saved) {
        setCustomPledges(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const allPledges = [...customPledges, ...DEFAULT_SF_PLEDGES];

  const filteredMissions = availableMissionsForChallenge.filter((m: any) => {
    const text = (m.evoeMission?.titreSF || m.label || '') + ' ' + (m.evoeMission?.descriptionSF || m.description || '');
    return text.toLowerCase().includes(missionSearch.toLowerCase());
  });

  const filteredTeams = otherTeams.filter((t: any) => {
    return (t.name || '').toLowerCase().includes(teamSearch.toLowerCase());
  });

  const filteredPledges = allPledges.filter((p) => {
    return p.text.toLowerCase().includes(pledgeSearch.toLowerCase());
  });

  const selectedMission = availableMissionsForChallenge.find(
    (m: any) => m.id === Number(challengeLocalActionId)
  );
  const activePreviewMission = hoveredMissionId 
    ? availableMissionsForChallenge.find((m: any) => m.id === hoveredMissionId) 
    : selectedMission;

  const selectedTeam = otherTeams.find(
    (t: any) => t.id === Number(challengeTargetTeamId)
  );

  const selectedDurationOption = DURATION_OPTIONS.find(
    (opt) => opt.value === challengeDurationHours
  ) || DURATION_OPTIONS[1];

  const selectedPledgeObj = allPledges.find(p => p.text === challengePledge);

  const closeAllDropdowns = () => {
    setIsMissionListOpen(false);
    setIsTeamListOpen(false);
    setIsDurationListOpen(false);
    setIsPledgeListOpen(false);
  };

  const handleAddNewCustomPledge = (newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    const exists = allPledges.some(p => p.text.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const newPledge = {
        id: `custom_${Date.now()}`,
        text: trimmed,
        emoji: '✨'
      };
      const updated = [newPledge, ...customPledges];
      setCustomPledges(updated);
      try {
        localStorage.setItem('evoe_custom_pledges', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    setChallengePledge(trimmed);
    setPledgeSearch('');
    setIsPledgeListOpen(false);
    setIsCustomPledgeInput(false);
  };

  return (
    <AnimatePresence>
      {showChallengeModal && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            pointerEvents: 'auto'
          }}
          onClick={() => {
            closeAllDropdowns();
            setShowChallengeModal(false);
          }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 15 }}
            style={{
              background: 'linear-gradient(175deg, rgba(14, 20, 40, 0.96) 0%, rgba(8, 12, 26, 0.98) 100%)',
              border: '1px solid rgba(0, 255, 204, 0.45)',
              borderRadius: '20px',
              padding: '24px 26px',
              width: '490px',
              maxWidth: '92vw',
              maxHeight: '92vh',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              backdropFilter: 'blur(30px)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(0,255,204,0.18)',
              color: '#fff',
              pointerEvents: 'auto',
              position: 'relative'
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(0,255,204,0.2)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#00ffcc', textTransform: 'uppercase', margin: 0, fontWeight: 800, letterSpacing: '0.04em', textShadow: '0 0 12px rgba(0, 255, 204, 0.35)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🚀 Lancer un Défi Temporel
              </h2>
              <button 
                onClick={() => {
                  closeAllDropdowns();
                  setShowChallengeModal(false);
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#00ffcc',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,255,204,0.15)';
                  e.currentTarget.style.borderColor = '#00ffcc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSendChallenge} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 1. Choix de l'équipe cible (Custom Combobox Premium) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <label style={{ fontSize: '0.78rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Shield size={13} color="#00b3ff" /> Équipe Cible
                </label>
                
                <div
                  onClick={() => {
                    setIsTeamListOpen(!isTeamListOpen);
                    setIsMissionListOpen(false);
                    setIsDurationListOpen(false);
                    setIsPledgeListOpen(false);
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.65)',
                    border: isTeamListOpen ? '1px solid #00ffcc' : '1px solid rgba(0,255,204,0.3)',
                    borderRadius: '10px',
                    padding: '11px 14px',
                    color: selectedTeam ? '#fff' : '#94a3b8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: isTeamListOpen ? '0 0 14px rgba(0,255,204,0.25)' : 'none',
                    transition: 'all 0.2s',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedTeam ? (
                      <>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: selectedTeam.color || '#00ffcc',
                          boxShadow: `0 0 8px ${selectedTeam.color || '#00ffcc'}`,
                          display: 'inline-block',
                          flexShrink: 0
                        }} />
                        <span style={{ fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
                          {selectedTeam.name}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#64748b' }}>-- Sélectionner une équipe cible --</span>
                    )}
                  </span>
                  <ChevronDown 
                    size={16} 
                    color="#00ffcc" 
                    style={{ 
                      transform: isTeamListOpen ? 'rotate(180deg)' : 'none', 
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      flexShrink: 0
                    }} 
                  />
                </div>

                <AnimatePresence>
                  {isTeamListOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'rgba(10, 16, 32, 0.98)',
                        border: '1px solid rgba(0,255,204,0.45)',
                        borderRadius: '10px',
                        marginTop: '4px',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.9), 0 0 20px rgba(0,255,204,0.2)',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 50,
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      {otherTeams.length > 4 && (
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Search size={13} color="#00ffcc" />
                          <input
                            type="text"
                            placeholder="Filtrer une équipe..."
                            value={teamSearch}
                            onChange={(e) => setTeamSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              color: '#fff',
                              fontSize: '0.78rem',
                              width: '100%'
                            }}
                          />
                        </div>
                      )}

                      {filteredTeams.length === 0 ? (
                        <div style={{ padding: '14px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                          Aucune équipe trouvée
                        </div>
                      ) : (
                        filteredTeams.map((t: any) => {
                          const isSelected = t.id === Number(challengeTargetTeamId);
                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setChallengeTargetTeamId(t.id);
                                setIsTeamListOpen(false);
                              }}
                              style={{
                                padding: '10px 14px',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: isSelected ? 'rgba(0, 255, 204, 0.16)' : 'transparent',
                                color: isSelected ? '#00ffcc' : '#e2e8f0',
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'rgba(0, 255, 204, 0.08)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  width: '9px',
                                  height: '9px',
                                  borderRadius: '50%',
                                  background: t.color || '#00ffcc',
                                  boxShadow: `0 0 8px ${t.color || '#00ffcc'}`
                                }} />
                                <span style={{ fontWeight: isSelected ? 700 : 500 }}>{t.name}</span>
                              </div>
                              {isSelected && (
                                <span style={{ color: '#00ffcc', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Check size={13} /> Sélectionnée
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. Choix de l'éco-mission avec Custom Select et Preview Live */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <label style={{ fontSize: '0.78rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={13} color="#00b3ff" /> Éco-Mission Imposée
                </label>
                
                <div
                  onClick={() => {
                    setIsMissionListOpen(!isMissionListOpen);
                    setIsTeamListOpen(false);
                    setIsDurationListOpen(false);
                    setIsPledgeListOpen(false);
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.65)',
                    border: isMissionListOpen ? '1px solid #00ffcc' : '1px solid rgba(0,255,204,0.3)',
                    borderRadius: '10px',
                    padding: '11px 14px',
                    color: selectedMission ? '#fff' : '#94a3b8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: isMissionListOpen ? '0 0 14px rgba(0,255,204,0.25)' : 'none',
                    transition: 'all 0.2s',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedMission 
                      ? `${selectedMission.evoeMission?.titreSF || selectedMission.label} (+${selectedMission.evoeMission?.amplitude || 10} IT)`
                      : "-- Choisir une éco-mission --"
                    }
                  </span>
                  <ChevronDown 
                    size={16} 
                    color="#00ffcc" 
                    style={{ 
                      transform: isMissionListOpen ? 'rotate(180deg)' : 'none', 
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      flexShrink: 0
                    }} 
                  />
                </div>

                <AnimatePresence>
                  {isMissionListOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'rgba(10, 16, 32, 0.98)',
                        border: '1px solid rgba(0,255,204,0.45)',
                        borderRadius: '10px',
                        marginTop: '4px',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.9), 0 0 20px rgba(0,255,204,0.2)',
                        maxHeight: '160px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 50,
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      {availableMissionsForChallenge.length > 5 && (
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Search size={13} color="#00ffcc" />
                          <input
                            type="text"
                            placeholder="Rechercher une mission..."
                            value={missionSearch}
                            onChange={(e) => setMissionSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              color: '#fff',
                              fontSize: '0.78rem',
                              width: '100%'
                            }}
                          />
                        </div>
                      )}

                      {filteredMissions.length === 0 ? (
                        <div style={{ padding: '14px', fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                          Aucune mission trouvée
                        </div>
                      ) : (
                        filteredMissions.map((m: any) => {
                          const isSelected = m.id === Number(challengeLocalActionId);
                          const isHovered = m.id === hoveredMissionId;
                          return (
                            <div
                              key={m.id}
                              onMouseEnter={() => setHoveredMissionId(m.id)}
                              onClick={() => {
                                setChallengeLocalActionId(m.id);
                                setHoveredMissionId(m.id);
                                setIsMissionListOpen(false);
                              }}
                              style={{
                                padding: '9px 13px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: isHovered 
                                  ? 'rgba(0, 255, 204, 0.18)' 
                                  : isSelected 
                                  ? 'rgba(0, 255, 204, 0.08)' 
                                  : 'transparent',
                                color: isHovered || isSelected ? '#00ffcc' : '#e2e8f0',
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                transition: 'background 0.15s'
                              }}
                            >
                              <span>{m.evoeMission?.titreSF || m.label}</span>
                              <span style={{ fontSize: '0.7rem', color: '#ffd700', fontWeight: 'bold', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                                +{m.evoeMission?.amplitude || 10} IT
                              </span>
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Champ Description TOUJOURS VISIBLE au premier plan avec hauteur fixe 3 lignes */}
                <div style={{
                  background: activePreviewMission ? 'rgba(0, 255, 204, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: activePreviewMission ? '1px solid rgba(0, 255, 204, 0.35)' : '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '0.78rem',
                  color: '#e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minHeight: '82px',
                  height: '82px',
                  justifyContent: 'flex-start',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', color: activePreviewMission ? '#00ffcc' : '#a0aec0' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📋 {activePreviewMission ? (activePreviewMission.evoeMission?.titreSF || activePreviewMission.label) : "Description de la Mission"}
                    </span>
                    {activePreviewMission && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '6px', flexShrink: 0 }}>
                        <span 
                          title="Bonus Défi : Points IT multipliés par 2 !"
                          style={{
                            background: 'linear-gradient(135deg, #ff0055 0%, #ff6600 100%)',
                            color: '#ffffff',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontSize: '0.66rem',
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                            boxShadow: '0 0 8px rgba(255, 0, 85, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                          }}
                        >
                          ⚡ x2
                        </span>
                        <span style={{
                          background: 'rgba(0, 255, 204, 0.2)',
                          color: '#00ffcc',
                          border: '1px solid rgba(0, 255, 204, 0.35)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          +{activePreviewMission.evoeMission?.amplitude || 10} IT
                        </span>
                      </div>
                    )}
                  </div>
                  <p style={{
                    margin: 0,
                    color: activePreviewMission ? '#cbd5e1' : '#718096',
                    lineHeight: '1.35',
                    fontSize: '0.76rem',
                    fontStyle: activePreviewMission ? 'normal' : 'italic',
                    minHeight: '4.05em',
                    maxHeight: '4.05em',
                    overflowY: 'auto'
                  }}>
                    {activePreviewMission 
                      ? (activePreviewMission.evoeMission?.descriptionSF || activePreviewMission.description || "Mission d'éco-geste à accomplir pour valider le défi.")
                      : "Sélectionnez ou survolez une mission ci-dessus pour afficher son descriptif complet et ses objectifs."
                    }
                  </p>
                </div>
              </div>

              {/* 3. Choix de la durée du défi (Custom Combobox Premium) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <label style={{ fontSize: '0.78rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} color="#00b3ff" /> Chrono Temporel (Durée)
                </label>
                
                <div
                  onClick={() => {
                    setIsDurationListOpen(!isDurationListOpen);
                    setIsTeamListOpen(false);
                    setIsMissionListOpen(false);
                    setIsPledgeListOpen(false);
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: isDurationListOpen ? '1px solid #00ffcc' : '1px solid rgba(0,255,204,0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: isDurationListOpen ? '0 0 10px rgba(0,255,204,0.2)' : 'none',
                    transition: 'all 0.2s',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{selectedDurationOption.emoji}</span>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>{selectedDurationOption.label}</span>
                  </span>
                  <ChevronDown 
                    size={16} 
                    color="#00ffcc" 
                    style={{ 
                      transform: isDurationListOpen ? 'rotate(180deg)' : 'none', 
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      flexShrink: 0
                    }} 
                  />
                </div>

                {/* Menu déroulant custom intégré (Ouverture vers le haut - Dropup) */}
                <AnimatePresence>
                  {isDurationListOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        right: 0,
                        background: 'rgba(10, 15, 30, 0.98)',
                        border: '1px solid rgba(0,255,204,0.4)',
                        borderRadius: '8px',
                        marginBottom: '4px',
                        boxShadow: '0 -10px 25px rgba(0,0,0,0.85), 0 0 15px rgba(0,255,204,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 40,
                        backdropFilter: 'blur(20px)',
                        overflow: 'hidden'
                      }}
                    >
                      {DURATION_OPTIONS.map((opt) => {
                        const isSelected = opt.value === challengeDurationHours;
                        return (
                          <div
                            key={String(opt.value)}
                            onClick={() => {
                              setChallengeDurationHours(opt.value as any);
                              setIsDurationListOpen(false);
                            }}
                            style={{
                              padding: '9px 12px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: isSelected ? 'rgba(0, 255, 204, 0.16)' : 'transparent',
                              color: isSelected ? '#00ffcc' : '#e2e8f0',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'rgba(0, 255, 204, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1rem', lineHeight: 1 }}>{opt.emoji}</span>
                              <span style={{ fontWeight: isSelected ? 700 : 500 }}>{opt.label}</span>
                            </div>
                            {isSelected && (
                              <Check size={13} color="#00ffcc" />
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. Choix du Gage SF (Harmonisé avec Éco-Mission, avec suppression et sauvegarde de gage libre) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    📜 Gage Galactique <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'none', fontWeight: 'normal' }}>(Optionnel)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPledgeInput(!isCustomPledgeInput);
                      setIsPledgeListOpen(false);
                    }}
                    style={{
                      background: isCustomPledgeInput ? 'rgba(0,255,204,0.2)' : 'transparent',
                      border: '1px solid rgba(0,255,204,0.3)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      color: '#00ffcc',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    <Edit3 size={11} /> {isCustomPledgeInput ? 'Mode Sélection' : 'Saisie Libre'}
                  </button>
                </div>

                {isCustomPledgeInput ? (
                  /* Champ direct de saisie libre avec bouton de sauvegarde */
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={challengePledge}
                      onChange={(e) => setChallengePledge(e.target.value)}
                      placeholder="Tapez votre gage galactique personnalisé..."
                      autoFocus
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid #00ffcc',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxShadow: '0 0 10px rgba(0,255,204,0.2)'
                      }}
                    />
                    {challengePledge && (
                      <button
                        type="button"
                        onClick={() => setChallengePledge('')}
                        title="Vider le texte"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          padding: '10px',
                          color: '#a0aec0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                    {challengePledge.trim().length > 0 && !allPledges.some(p => p.text.toLowerCase() === challengePledge.trim().toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => handleAddNewCustomPledge(challengePledge)}
                        title="Sauvegarder ce gage dans la liste pour les prochains défis"
                        style={{
                          background: 'rgba(0,255,204,0.15)',
                          border: '1px solid #00ffcc',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: '#00ffcc',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #00ffcc, #00b3ff)';
                          e.currentTarget.style.color = '#000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0,255,204,0.15)';
                          e.currentTarget.style.color = '#00ffcc';
                        }}
                      >
                        <Save size={13} /> Sauvegarder
                      </button>
                    )}
                  </div>
                ) : (
                  /* Combobox de sélection de gages SF harmonisée */
                  <div
                    onClick={() => {
                      setIsPledgeListOpen(!isPledgeListOpen);
                      setIsTeamListOpen(false);
                      setIsMissionListOpen(false);
                      setIsDurationListOpen(false);
                    }}
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      border: isPledgeListOpen ? '1px solid #00ffcc' : '1px solid rgba(0,255,204,0.3)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: challengePledge ? '#fff' : '#a0aec0',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: isPledgeListOpen ? '0 0 10px rgba(0,255,204,0.2)' : 'none',
                      transition: 'all 0.2s',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                      {challengePledge ? (
                        <>
                          <span style={{ fontSize: '1.05rem', flexShrink: 0, lineHeight: 1 }}>
                            {selectedPledgeObj?.emoji || '📜'}
                          </span>
                          <span style={{ fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {challengePledge}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: '#64748b' }}>-- Choisir un gage temporel (optionnel) --</span>
                      )}
                    </span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                      {challengePledge && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setChallengePledge('');
                          }}
                          title="Retirer le gage"
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            color: '#a0aec0',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ff4d4d';
                            e.currentTarget.style.borderColor = '#ff4d4d';
                            e.currentTarget.style.background = 'rgba(255,59,59,0.18)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#a0aec0';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          }}
                        >
                          ×
                        </span>
                      )}
                      <ChevronDown 
                        size={16} 
                        color="#00ffcc" 
                        style={{ 
                          transform: isPledgeListOpen ? 'rotate(180deg)' : 'none', 
                          transition: 'transform 0.2s'
                        }} 
                      />
                    </div>
                  </div>
                )}

                {/* Menu déroulant custom des gages (Ouverture vers le haut - Dropup) */}
                <AnimatePresence>
                  {isPledgeListOpen && !isCustomPledgeInput && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        right: 0,
                        background: 'rgba(10, 15, 30, 0.98)',
                        border: '1px solid rgba(0,255,204,0.4)',
                        borderRadius: '8px',
                        marginBottom: '4px',
                        boxShadow: '0 -10px 25px rgba(0,0,0,0.85), 0 0 15px rgba(0,255,204,0.15)',
                        maxHeight: '190px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 45,
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      {/* Barre d'ajout / recherche rapide de gage */}
                      <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Search size={13} color="#00ffcc" />
                        <input
                          type="text"
                          placeholder="Rechercher ou inventer un nouveau gage..."
                          value={pledgeSearch}
                          onChange={(e) => setPledgeSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (pledgeSearch.trim()) {
                                handleAddNewCustomPledge(pledgeSearch);
                              }
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: '0.78rem',
                            width: '100%'
                          }}
                        />
                        {pledgeSearch.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddNewCustomPledge(pledgeSearch);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #00ffcc, #00b3ff)',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              color: '#000',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Plus size={11} /> Ajouter
                          </button>
                        )}
                      </div>

                      {/* Action rapide : proposer d'ajouter le texte tapé s'il n'existe pas */}
                      {pledgeSearch.trim().length > 2 && !allPledges.some(p => p.text.toLowerCase() === pledgeSearch.trim().toLowerCase()) && (
                        <div
                          onClick={() => handleAddNewCustomPledge(pledgeSearch)}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(0, 255, 204, 0.12)',
                            borderBottom: '1px solid rgba(0, 255, 204, 0.2)',
                            color: '#00ffcc',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 255, 204, 0.22)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 255, 204, 0.12)';
                          }}
                        >
                          <Plus size={13} />
                          <span>Créer le gage : « <strong>{pledgeSearch.trim()}</strong> »</span>
                        </div>
                      )}

                      {/* Option 1 : Aucun gage */}
                      <div
                        onClick={() => {
                          setChallengePledge('');
                          setIsPledgeListOpen(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: !challengePledge ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
                          color: !challengePledge ? '#00ffcc' : '#94a3b8',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          fontStyle: 'italic',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 255, 204, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = !challengePledge ? 'rgba(0, 255, 204, 0.1)' : 'transparent';
                        }}
                      >
                        <span>🚫</span>
                        <span>Aucun gage (Défi sans gage)</span>
                        {!challengePledge && <Check size={13} color="#00ffcc" style={{ marginLeft: 'auto' }} />}
                      </div>

                      {/* Liste filtrée des gages */}
                      {filteredPledges.length === 0 ? (
                        <div style={{ padding: '14px', fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                          Aucun gage trouvé. Appuyez sur Entrée pour l'enregistrer !
                        </div>
                      ) : (
                        filteredPledges.map((p) => {
                          const isSelected = challengePledge === p.text;
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setChallengePledge(p.text);
                                setIsPledgeListOpen(false);
                              }}
                              style={{
                                padding: '8px 12px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: isSelected ? 'rgba(0, 255, 204, 0.16)' : 'transparent',
                                color: isSelected ? '#00ffcc' : '#e2e8f0',
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                transition: 'all 0.15s',
                                gap: '8px',
                                minWidth: 0
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'rgba(0, 255, 204, 0.08)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1 }}>{p.emoji}</span>
                                <span style={{
                                  fontWeight: isSelected ? 700 : 500,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  lineHeight: '1.3'
                                }}>
                                  {p.text}
                                </span>
                              </div>
                              {isSelected && (
                                <Check size={13} color="#00ffcc" style={{ flexShrink: 0 }} />
                              )}
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {challengeError && (
                <div style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '4px', padding: '10px 12px', background: 'rgba(255,59,59,0.12)', border: '1px solid rgba(255,59,59,0.35)', borderRadius: '8px' }}>
                  ⚠️ {challengeError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmittingChallenge || !challengeTargetTeamId || !challengeLocalActionId}
                style={{
                  marginTop: '6px',
                  background: (isSubmittingChallenge || !challengeTargetTeamId || !challengeLocalActionId)
                    ? 'rgba(255,255,255,0.08)' 
                    : 'linear-gradient(135deg, #00ffcc 0%, #00b3ff 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: (isSubmittingChallenge || !challengeTargetTeamId || !challengeLocalActionId)
                    ? 'rgba(255,255,255,0.3)' 
                    : '#04101e',
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  cursor: (isSubmittingChallenge || !challengeTargetTeamId || !challengeLocalActionId) ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  boxShadow: (isSubmittingChallenge || !challengeTargetTeamId || !challengeLocalActionId) ? 'none' : '0 0 15px rgba(0,255,204,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {isSubmittingChallenge ? (
                  <RefreshCw className="icon-sm spin-loading" />
                ) : (
                  "Envoyer le défi"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
