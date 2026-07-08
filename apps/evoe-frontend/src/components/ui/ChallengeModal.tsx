import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface ChallengeModalProps {
  showChallengeModal: boolean;
  setShowChallengeModal: (show: boolean) => void;
  challengeTargetTeamId: number | '';
  setChallengeTargetTeamId: (id: number | '') => void;
  challengeLocalActionId: number | '';
  setChallengeLocalActionId: (id: number | '') => void;
  challengePledge: string;
  setChallengePledge: (pledge: string) => void;
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
  challengeError,
  isSubmittingChallenge,
  handleSendChallenge,
  otherTeams,
  availableMissionsForChallenge
}: ChallengeModalProps) {
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

              {/* Choix de l'éco-mission */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Éco-Mission Imposée
                </label>
                <select 
                  value={challengeLocalActionId} 
                  onChange={(e) => setChallengeLocalActionId(e.target.value === '' ? '' : Number(e.target.value))}
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
                  <option value="">-- Sélectionner une mission --</option>
                  {availableMissionsForChallenge.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.evoeMission?.titreSF || m.label} (+{m.evoeMission?.amplitude || 10} AT)
                    </option>
                  ))}
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
