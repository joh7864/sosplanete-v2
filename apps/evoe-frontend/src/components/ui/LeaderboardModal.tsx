import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Target } from 'lucide-react';
import LeaderboardScene3D from '../3d/LeaderboardScene3D';

interface LeaderboardModalProps {
  showLeaderboardModal: boolean;
  setShowLeaderboardModal: (v: boolean) => void;
  dashboardStatus: any;
  childInfos: any;
  setSelectedProfileId: (id: number | null) => void;
}

export function LeaderboardModal({
  showLeaderboardModal,
  setShowLeaderboardModal,
  dashboardStatus,
  childInfos,
  setSelectedProfileId,
}: LeaderboardModalProps) {
  const [focusedPlayerId, setFocusedPlayerId] = useState<number | null>(null);

  const topPlayers = useMemo(() => dashboardStatus?.topPlayers || [], [dashboardStatus]);

  // "Me trouver" : visible seulement si l'utilisateur est classé au-delà du Top 3
  const myRankIndex = useMemo(
    () => topPlayers.findIndex((p: any) => p.childId === childInfos?.id),
    [topPlayers, childInfos]
  );
  const showFindMe = myRankIndex >= 3;

  const handleFindMe = () => {
    if (!childInfos?.id) return;
    setFocusedPlayerId(childInfos.id);
  };

  if (!showLeaderboardModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="lb-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px',
        }}
        onClick={() => setShowLeaderboardModal(false)}
      >
        <motion.div
          key="lb-modal"
          initial={{ scale: 0.94, opacity: 0, y: 18 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 18 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '900px',
            maxWidth: '96vw',
            height: '82vh',
            maxHeight: '820px',
            background: 'linear-gradient(160deg, rgba(8,15,30,0.97) 0%, rgba(4,8,20,0.99) 100%)',
            border: '1.5px solid rgba(255,215,0,0.3)',
            borderRadius: '20px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 40px rgba(255,215,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* ── En-tête ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px 12px',
            borderBottom: '1px solid rgba(255,215,0,0.15)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.25rem' }}>🏆</span>
              <div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#ffd700',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  textShadow: '0 0 12px rgba(255,215,0,0.4)'
                }}>
                  Live Global Leaderboard
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '1px', letterSpacing: '1px' }}>
                  CYBER CIRCUIT — TOUS LES AGENTS
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLeaderboardModal(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* ── Scène 3D Unifiée Remplissant tout l'Écran ── */}
          <div style={{ flex: 1, position: 'relative', background: 'radial-gradient(ellipse at 50% 80%, rgba(0,80,160,0.08) 0%, transparent 70%)' }}>
            {topPlayers.length > 0 ? (
              <Canvas
                shadows
                camera={{ position: [0, 2.3, 5.8], fov: 44 }}
                style={{ width: '100%', height: '100%' }}
              >
                <LeaderboardScene3D
                  topPlayers={topPlayers}
                  childInfos={childInfos}
                  setSelectedProfileId={setSelectedProfileId}
                  setShowLeaderboardModal={setShowLeaderboardModal}
                  focusedPlayerId={focusedPlayerId}
                  onFocusedPlayerReset={() => setFocusedPlayerId(null)}
                />
              </Canvas>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                Aucune signature d'agent détectée…
              </div>
            )}
          </div>

          {/* ── Pied de modal ── */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 22px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0,
          }}>
            {showFindMe && (
              <button
                onClick={handleFindMe}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: 'rgba(0,232,255,0.1)',
                  border: '1.5px solid #00e8ff',
                  color: '#00e8ff',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textShadow: '0 0 6px rgba(0,232,255,0.4)',
                  boxShadow: '0 0 14px rgba(0,232,255,0.1)',
                  transition: 'all 0.2s',
                }}
              >
                <Target size={14} /> Me trouver
              </button>
            )}
            <button
              onClick={() => setShowLeaderboardModal(false)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.13)',
                color: 'rgba(255,255,255,0.65)',
                borderRadius: '10px',
                padding: '8px 20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
