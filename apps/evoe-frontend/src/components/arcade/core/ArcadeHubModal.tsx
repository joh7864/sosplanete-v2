import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Play, Sparkles } from 'lucide-react';
import { ARCADE_GAMES_REGISTRY } from './arcadeRegistry';
import type { ArcadeGameDefinition } from './types';
import { ArcadeCabinetModal } from './ArcadeCabinetModal';
import { evoeClient } from '../../../lib/api';

interface ArcadeHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGameKey?: string;
}

export const ArcadeHubModal: React.FC<ArcadeHubModalProps> = ({
  isOpen,
  onClose,
  initialGameKey,
}) => {
  const [unlockedKeys, setUnlockedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<ArcadeGameDefinition | null>(
    null,
  );

  // Charger la liste des jeux débloqués par l'équipe
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchUnlocked = async () => {
      try {
        setLoading(true);
        const BASE_API_URL = (
          import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy'
        ).replace('/legacy', '');
        const res = await evoeClient.get<{ unlockedGames: string[] }>(
          `${BASE_API_URL}/arcade/unlocked`,
        );

        if (isMounted) {
          const keys = res.data?.unlockedGames || [];
          setUnlockedKeys(keys);

          // Si un jeu initial est demandé et fait partie des débloqués, l'ouvrir directement
          if (initialGameKey && keys.includes(initialGameKey)) {
            setSelectedGame(ARCADE_GAMES_REGISTRY[initialGameKey] || null);
          }
        }
      } catch (err) {
        console.error('Erreur chargement jeux arcade débloqués:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUnlocked();
    return () => {
      isMounted = false;
    };
  }, [isOpen, initialGameKey]);

  if (!isOpen) return null;

  // Filtrer STRICTEMENT les jeux débloqués (ZÉRO spoil, aucun nom futur)
  const availableGames: ArcadeGameDefinition[] = unlockedKeys
    .map((k) => ARCADE_GAMES_REGISTRY[k])
    .filter((g): g is ArcadeGameDefinition => !!g);

  return (
    <>
      <AnimatePresence>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '620px',
              background: 'linear-gradient(155deg, #0d121f 0%, #060911 100%)',
              border: '2px solid rgba(0, 255, 102, 0.4)',
              borderRadius: '24px',
              boxShadow:
                '0 25px 50px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 255, 102, 0.2)',
              padding: '24px',
              color: '#ffffff',
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            {/* En-tête de la Salle d'Arcade */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  background: 'rgba(0, 255, 102, 0.12)',
                  border: '1px solid rgba(0, 255, 102, 0.3)',
                  color: '#00ff66',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                  marginBottom: '10px',
                }}
              >
                <Sparkles size={14} /> SALLE D'ARCADE DE L'ARCHE
              </div>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '0.5px',
                  background: 'linear-gradient(90deg, #ffffff, #00ff66)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Mini-Jeux & Bornes Rétro
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#94a3b8',
                  marginTop: '6px',
                  marginBottom: 0,
                }}
              >
                Débloqués grâce aux découvertes et énigmes de votre équipe.
              </p>
            </div>

            {/* Liste des Jeux Débloqués */}
            {loading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#00f0ff',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                }}
              >
                CONNEXION À LA SALLE D'ARCADE...
              </div>
            ) : availableGames.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#94a3b8',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '16px',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                }}
              >
                <Gamepad2 size={36} style={{ color: '#475569', marginBottom: '10px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Aucune borne d'arcade n'a encore été débloquée par votre équipage.
                </p>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Explorez l'Arche et résolvez les énigmes pour en révéler l'accès !
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {availableGames.map((game) => (
                  <div
                    key={game.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '18px',
                      borderRadius: '16px',
                      background:
                        'linear-gradient(135deg, rgba(16, 24, 40, 0.9) 0%, rgba(8, 12, 22, 0.95) 100%)',
                      border: '1.5px solid rgba(0, 255, 102, 0.35)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '30px' }}>👾</span>
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <h3
                              style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 800,
                                color: '#ffffff',
                                letterSpacing: '1px',
                                fontFamily: '"Courier New", monospace',
                              }}
                            >
                              {game.title}
                            </h3>
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(0, 255, 102, 0.15)',
                                color: '#00ff66',
                                fontWeight: 'bold',
                                fontFamily: 'monospace',
                              }}
                            >
                              {game.year}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#94a3b8',
                              fontFamily: 'monospace',
                            }}
                          >
                            {game.subtitle}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions de la Borne */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedGame(game)}
                        style={{
                          flex: 1,
                          height: '44px',
                          borderRadius: '10px',
                          background:
                            'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: '1.5px solid #34d399',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          letterSpacing: '1px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 0 16px rgba(16, 185, 129, 0.45)',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = 'scale(1.02)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = 'scale(1)')
                        }
                      >
                        <Play size={16} /> JOUER À LA BORNE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Modale de la Borne d'Arcade lorsqu'un jeu est sélectionné */}
      {selectedGame && (
        <ArcadeCabinetModal
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          game={selectedGame}
        />
      )}
    </>
  );
};
