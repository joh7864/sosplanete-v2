import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, MessageSquare, X } from 'lucide-react';
import { playUnlockCadenasSound, playConstellationChimeSound } from '../../utils/easterEggAudio';

interface VictoryData {
  teamId: number;
  teamName: string;
  teamColor?: string | null;
  teamIcon?: string | null;
  easterEggTitle: string;
  pointsIT: number;
  rank?: number;
  childPseudo: string;
}

interface TeamVictoryCelebrationModalProps {
  onOpenCommLink?: () => void;
  myTeamId?: number;
}

export const TeamVictoryCelebrationModal: React.FC<TeamVictoryCelebrationModalProps> = ({
  onOpenCommLink,
  myTeamId,
}) => {
  const [victoryData, setVictoryData] = useState<VictoryData | null>(null);

  useEffect(() => {
    const handleVictoryEvent = (event: Event) => {
      const customEvent = event as CustomEvent<VictoryData>;
      const detail = customEvent.detail;
      if (!detail) return;

      // Si myTeamId est fourni et qu'il correspond, ou si l'alerte s'adresse à toute l'équipe
      if (!myTeamId || myTeamId === detail.teamId) {
        setVictoryData(detail);

        // Son de triomphe
        try {
          playUnlockCadenasSound();
          setTimeout(() => playConstellationChimeSound(), 400);
        } catch {
          // ignore audio error
        }
      }
    };

    window.addEventListener('easter_egg_team_victory', handleVictoryEvent);
    return () => {
      window.removeEventListener('easter_egg_team_victory', handleVictoryEvent);
    };
  }, [myTeamId]);

  // Fermeture automatique après 8 secondes
  useEffect(() => {
    if (!victoryData) return;
    const timer = setTimeout(() => {
      setVictoryData(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [victoryData]);

  if (!victoryData) return null;

  const teamColor = victoryData.teamColor || '#10b981';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          background: 'rgba(5, 8, 22, 0.82)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        onClick={() => setVictoryData(null)}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '560px',
            maxWidth: '95vw',
            background: 'linear-gradient(170deg, rgba(20, 25, 45, 0.98) 0%, rgba(10, 14, 28, 0.99) 100%)',
            border: `2px solid ${teamColor}`,
            borderRadius: '28px',
            boxShadow: `0 0 60px ${teamColor}33, 0 30px 80px rgba(0,0,0,0.9)`,
            padding: '32px 28px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Lueur d'ambiance d'équipe */}
          <div
            style={{
              position: 'absolute',
              top: '-120px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${teamColor}40 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Bouton fermeture */}
          <button
            onClick={() => setVictoryData(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)',
              borderRadius: '10px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>

          {/* Icône Trophée animée */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: [0, 1.2, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 16px',
              borderRadius: '24px',
              background: `linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4), 0 0 40px rgba(255, 215, 0, 0.3)',
              color: '#1e1b4b',
            }}
          >
            <Trophy size={42} strokeWidth={2.4} />
          </motion.div>

          <span
            style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#ffd700',
              background: 'rgba(255, 215, 0, 0.12)',
              padding: '4px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              marginBottom: '10px',
            }}
          >
            Victoire Collective Temporelle
          </span>

          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#ffffff',
              margin: '0 0 8px',
              letterSpacing: '0.5px',
            }}
          >
            +{victoryData.pointsIT} IT Remportés !
          </h2>

          <p
            style={{
              fontSize: '0.92rem',
              color: 'rgba(255, 255, 255, 0.85)',
              margin: '0 0 16px',
              lineHeight: 1.5,
            }}
          >
            L'équipe <strong style={{ color: teamColor }}>{victoryData.teamName}</strong> a validé le quota de détection sur{' '}
            <strong style={{ color: '#fff' }}>"{victoryData.easterEggTitle}"</strong> !
          </p>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '24px',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <Sparkles size={16} className="text-amber-400" />
            <span>
              Dernier déclenchement par <strong style={{ color: '#ffd700' }}>@{victoryData.childPseudo}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {onOpenCommLink && (
              <button
                onClick={() => {
                  setVictoryData(null);
                  onOpenCommLink();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: `linear-gradient(135deg, ${teamColor} 0%, #059669 100%)`,
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '14px',
                  padding: '12px 22px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 8px 20px ${teamColor}40`,
                  transition: 'all 0.2s',
                }}
              >
                <MessageSquare size={16} /> Célébrer sur le Comm-Link
              </button>
            )}

            <button
              onClick={() => setVictoryData(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '14px',
                padding: '12px 20px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
