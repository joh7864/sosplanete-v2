import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown, Search } from 'lucide-react';

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
  const [missionSearch, setMissionSearch] = useState('');

  const filteredMissions = availableMissionsForChallenge.filter((m: any) => {
    const text = (m.evoeMission?.titreSF || m.label || '') + ' ' + (m.evoeMission?.descriptionSF || m.description || '');
    return text.toLowerCase().includes(missionSearch.toLowerCase());
  });

  const selectedMission = availableMissionsForChallenge.find(
    (m: any) => m.id === Number(challengeLocalActionId)
  );
  const activePreviewMission = hoveredMissionId 
    ? availableMissionsForChallenge.find((m: any) => m.id === hoveredMissionId) 
    : selectedMission;

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
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            pointerEvents: 'auto'
          }}
          onClick={() => setShowChallengeModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{
              background: 'rgba(10, 15, 30, 0.9)',
              border: '1px solid rgba(0, 255, 204, 0.4)',
              borderRadius: '16px',
              padding: '25px',
              width: '450px',
              maxWidth: '90vw',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0,255,204,0.1)',
              color: '#fff',
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0,255,204,0.2)', paddingBottom: '10px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#00ffcc', textTransform: 'uppercase', margin: 0, textShadow: '0 0 10px rgba(0, 255, 204, 0.3)' }}>
                🚀 Lancer un Défi Temporel
              </h2>
              <button 
                onClick={() => setShowChallengeModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#00ffcc', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSendChallenge} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Choix de l'équipe cible */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Équipe Cible
                </label>
                <select 
                  value={challengeTargetTeamId} 
                  onChange={(e) => setChallengeTargetTeamId(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(0,255,204,0.3)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="">-- Sélectionner une équipe --</option>
                  {otherTeams.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Choix de l'éco-mission avec Custom Select et Preview Live */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                <label style={{ fontSize: '0.8rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Éco-Mission Imposée
                </label>
                
                {/* Bouton sélecteur personnalisé */}
                <div
                  onClick={() => setIsMissionListOpen(!isMissionListOpen)}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: isMissionListOpen ? '1px solid #00ffcc' : '1px solid rgba(0,255,204,0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: selectedMission ? '#fff' : '#a0aec0',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: isMissionListOpen ? '0 0 10px rgba(0,255,204,0.2)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedMission 
                      ? `${selectedMission.evoeMission?.titreSF || selectedMission.label} (+${selectedMission.evoeMission?.amplitude || 10} IT)`
                      : "-- Choisir une éco-mission --"
                    }
                  </span>
                  <ChevronDown size={16} color="#00ffcc" style={{ transform: isMissionListOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {/* Menu déroulant custom intégré */}
                {isMissionListOpen && (
                  <div style={{
                    background: 'rgba(10, 15, 30, 0.98)',
                    border: '1px solid rgba(0,255,204,0.4)',
                    borderRadius: '8px',
                    marginTop: '2px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.8), 0 0 15px rgba(0,255,204,0.15)',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 20
                  }}>
                    {/* Recherche rapide */}
                    {availableMissionsForChallenge.length > 5 && (
                      <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Search size={14} color="#00ffcc" />
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
                      <div style={{ padding: '12px', fontSize: '0.78rem', color: '#a0aec0', textAlign: 'center' }}>
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
                              padding: '8px 12px',
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
                  </div>
                )}

                {/* Champ Description TOUJOURS VISIBLE au premier plan avec hauteur fixe 3 lignes */}
                <div style={{
                  background: activePreviewMission ? 'rgba(0, 255, 204, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: activePreviewMission ? '1px solid rgba(0, 255, 204, 0.35)' : '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
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
                      <span style={{ background: 'rgba(0, 255, 204, 0.2)', color: '#00ffcc', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', whiteSpace: 'nowrap', marginLeft: '6px' }}>
                        +{activePreviewMission.evoeMission?.amplitude || 10} IT
                      </span>
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

              {/* Choix de la durée du défi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  ⏳ Chrono Temporel (Durée)
                </label>
                <select 
                  value={challengeDurationHours} 
                  onChange={(e) => setChallengeDurationHours(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(0,255,204,0.3)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value={24}>⚡ 24 heures (1 jour express)</option>
                  <option value={48}>⏳ 48 heures (2 jours standard)</option>
                  <option value={72}>📅 72 heures (3 jours)</option>
                  <option value="">⌛ Jusqu'à la fin de la période active</option>
                </select>
              </div>

              {/* Saisie libre du gage */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Le Gage (Pledge)
                </label>
                <input 
                  type="text" 
                  value={challengePledge}
                  onChange={(e) => setChallengePledge(e.target.value)}
                  placeholder="Saisissez un gage ou choisissez ci-dessous..."
                  required
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(0,255,204,0.3)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
                
                {/* Suggestions de gages */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {[
                    "Payer les croissants 🥐",
                    "Faire 10 pompes 💪",
                    "Chanter le refrain d'une chanson SF 🎤",
                    "Faire le café pour toute l'équipe ☕",
                    "Raconter une blague spatiale 🌌"
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setChallengePledge(sug)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '15px',
                        padding: '4px 10px',
                        color: '#a0aec0',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0,255,204,0.4)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = '#a0aec0';
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {challengeError && (
                <div style={{ color: '#ff3b3b', fontSize: '0.8rem', marginTop: '5px', padding: '8px', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)', borderRadius: '6px' }}>
                  ⚠️ {challengeError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmittingChallenge}
                style={{
                  marginTop: '10px',
                  background: isSubmittingChallenge ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00ffcc, #00b3ff)',
                  border: 'none',
                  borderRadius: '8px',
                  color: isSubmittingChallenge ? 'rgba(255,255,255,0.3)' : '#000',
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  cursor: isSubmittingChallenge ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  boxShadow: isSubmittingChallenge ? 'none' : '0 0 15px rgba(0,255,204,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isSubmittingChallenge ? (
                  <RefreshCw className="icon-sm spin-loading" />
                ) : "Envoyer le défi"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
