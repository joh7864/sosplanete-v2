import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Trophy } from 'lucide-react';
import type { ArcadeGameDefinition } from './types';
import { ArcadeHighScoresView } from './ArcadeHighScoresView';
import { evoeClient } from '../../../lib/api';

interface ArcadeCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: ArcadeGameDefinition;
}

export const ArcadeCabinetModal: React.FC<ArcadeCabinetModalProps> = ({
  isOpen,
  onClose,
  game,
}) => {
  const [activeTab, setActiveTab] = useState<'game' | 'scores'>('game');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScore, setLastScore] = useState<number | undefined>(undefined);
  const [lastRank, setLastRank] = useState<number | undefined>(undefined);
  const [savedScoreId, setSavedScoreId] = useState<number | undefined>(undefined);
  const [gameSessionKey, setGameSessionKey] = useState(1);
  // Verrou anti-doublon : un seul envoi de score par partie
  const scoreSubmittedRef = useRef(false);

  // Réarmement du verrou à chaque nouvelle partie affichée (ouverture, onglet JOUER, Rejouer)
  useEffect(() => {
    if (isOpen && activeTab === 'game') {
      scoreSubmittedRef.current = false;
    }
  }, [isOpen, activeTab, gameSessionKey]);

  if (!isOpen) return null;

  const handleGameOver = async (result: {
    score: number;
    waveReached: number;
    durationSeconds: number;
  }) => {
    if (scoreSubmittedRef.current) return;
    scoreSubmittedRef.current = true;

    setLastScore(result.score);

    // Envoi du score à l'API backend
    try {
      const BASE_API_URL = (
        import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy'
      ).replace('/legacy', '');
      const res = await evoeClient.post<{
        savedScore: any;
        rank: number;
        total: number;
      }>(`${BASE_API_URL}/arcade/scores/${game.id}`, {
        score: result.score,
        waveReached: result.waveReached,
      });

      if (res.data) {
        setLastRank(res.data.rank);
        setSavedScoreId(res.data.savedScore?.id);
      }
    } catch (err) {
      console.error('Erreur enregistrement score arcade:', err);
    }

    // Basculer sur l'écran des High Scores après 1.4s d'effet game over
    setTimeout(() => {
      setActiveTab('scores');
    }, 1400);
  };

  const handleReplay = () => {
    setGameSessionKey((prev) => prev + 1);
    setActiveTab('game');
  };

  const GameComponent = game.component;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(12px)',
          padding: '16px',
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '680px',
            background: 'linear-gradient(175deg, #12141c 0%, #080a10 100%)',
            border: '3px solid #1e293b',
            borderRadius: '24px',
            boxShadow:
              '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 45px rgba(0, 255, 102, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Fronton de la Borne d'Arcade (Marquee lumineux) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              background: 'linear-gradient(90deg, #090e18 0%, #151d30 50%, #090e18 100%)',
              borderBottom: '2px solid rgba(0, 255, 102, 0.35)',
            }}
          >
            {/* Titre & Année */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>👾</span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '17px',
                    fontWeight: 900,
                    color: '#00ff66',
                    letterSpacing: '1.5px',
                    fontFamily: '"Courier New", monospace',
                    textShadow: '0 0 10px rgba(0, 255, 102, 0.6)',
                  }}
                >
                  {game.title}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                  }}
                >
                  {game.subtitle}
                </span>
              </div>
            </div>

            {/* Boutons d'Action Haut : Son, Onglets, Quitter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Accès au classement (visible uniquement en jeu ; sur le classement, INSERT COIN / REJOUER sert à rejouer) */}
              {activeTab === 'game' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('scores')}
                  title="Voir le classement"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                    color: '#cbd5e1',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trophy size={14} /> CLASSEMENT
                </button>
              )}

              {/* Bouton Muet Audio */}
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                title={soundEnabled ? 'Couper le son' : 'Activer le son'}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  color: soundEnabled ? '#00ff66' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Bouton Fermer */}
              <button
                type="button"
                onClick={onClose}
                title="Quitter la borne d'arcade"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1.5px solid rgba(239, 68, 68, 0.45)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Corps de la Borne : Jeu Canvas ou High Scores */}
          <div style={{ padding: '16px', position: 'relative' }}>
            {activeTab === 'game' ? (
              <GameComponent
                key={gameSessionKey}
                onGameOver={handleGameOver}
                onQuit={onClose}
                soundEnabled={soundEnabled}
                initialLives={3}
              />
            ) : (
              <ArcadeHighScoresView
                gameKey={game.id}
                gameTitle={game.title}
                highlightScoreId={savedScoreId}
                lastScore={lastScore}
                lastRank={lastRank}
                onReplay={handleReplay}
                onClose={onClose}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
