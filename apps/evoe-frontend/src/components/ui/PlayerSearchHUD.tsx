import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, User, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

export interface PlayerSearchHUDProps {
  players: any[];
  onSelectPlayer: (player: any) => void;
  onSearchMatchChange?: (player: any | null) => void;
  isMobile?: boolean;
}

export const PlayerSearchHUD: React.FC<PlayerSearchHUDProps> = ({
  players = [],
  onSelectPlayer,
  onSearchMatchChange,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Premier joueur correspondant à la saisie (priorise startsWith puis includes)
  const firstMatch = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return null;
    const startsWith = players.find((p: any) => (p.pseudo || '').toLowerCase().startsWith(trimmed));
    if (startsWith) return startsWith;
    return players.find((p: any) => (p.pseudo || '').toLowerCase().includes(trimmed)) || null;
  }, [players, query]);

  // Notification temps réel du joueur correspondant pour synchroniser la vue 3D
  useEffect(() => {
    onSearchMatchChange?.(isOpen ? firstMatch : null);
  }, [firstMatch, isOpen, onSearchMatchChange]);

  useEffect(() => {
    return () => {
      onSearchMatchChange?.(null);
    };
  }, [onSearchMatchChange]);

  // Suggestions filtrées en temps réel selon le pseudo
  const suggestions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return players
      .filter((p: any) => (p.pseudo || '').toLowerCase().includes(trimmed))
      .slice(0, 7);
  }, [players, query]);

  // Réinitialise la sélection clavier quand la liste de suggestions change
  useEffect(() => {
    setSelectedIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  // Fermeture automatique au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus automatique du champ dès l'ouverture
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = (player: any) => {
    onSelectPlayer(player);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = query.trim().toLowerCase();
      if (!trimmed && suggestions.length === 0) return;

      // 1. Joueur sélectionné au clavier
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
        return;
      }

      // 2. Correspondance exacte par pseudo
      const exactMatch = players.find((p) => (p.pseudo || '').toLowerCase() === trimmed);
      if (exactMatch) {
        handleSelect(exactMatch);
        return;
      }

      // 3. Première suggestion disponible
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setQuery('');
    }
  };

  const getAvatarSrc = (player: any) => {
    if (!player?.avatar || player.avatar === 'avatars/default.png') return null;
    if (player.avatar.startsWith('http') || player.avatar.startsWith('blob:') || player.avatar.startsWith('data:')) {
      return player.avatar;
    }
    return `${EVOE_IMG_URL}${player.avatar}`;
  };

  const buttonSize = isMobile ? 36 : 40;
  const expandedWidth = isMobile ? '200px' : '250px';

  // -------------------------------------------------------------
  // MODE 1 : VERSION MOBILE (Option 2 : Bandeau Dédié Pleine Largeur)
  // -------------------------------------------------------------
  if (isMobile) {
    return (
      <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Bouton rond déclencheur permanent dans le header */}
        <button
          id="hud-btn-player-search-mobile"
          type="button"
          onClick={() => setIsOpen(true)}
          title="Rechercher un joueur (Agent)"
          style={{
            width: `${buttonSize}px`,
            height: `${buttonSize}px`,
            minWidth: `${buttonSize}px`,
            minHeight: `${buttonSize}px`,
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 255, 204, 0.18)',
            border: '1.5px solid #00ffcc',
            color: '#00ffcc',
            boxShadow: '0 0 10px rgba(0, 255, 204, 0.3)',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
          }}
        >
          <Search size={16} />
        </button>

        {/* Bandeau de recherche immersif plein écran (Spotlight mobile) */}
        <AnimatePresence>
          {isOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10020,
                pointerEvents: 'auto',
              }}
            >
              {/* Backdrop sombre semi-transparent */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(4, 8, 20, 0.72)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}
                onClick={() => {
                  setIsOpen(false);
                  setQuery('');
                }}
              />

              {/* Bandeau supérieur de recherche pleine largeur */}
              <motion.div
                initial={{ opacity: 0, y: -25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '62px',
                  background: 'linear-gradient(180deg, rgba(8, 16, 32, 0.98) 0%, rgba(5, 12, 26, 0.99) 100%)',
                  borderBottom: '1.5px solid rgba(0, 255, 204, 0.45)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.85), 0 0 20px rgba(0, 255, 204, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '0 14px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Bouton retour ← */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                  }}
                  title="Fermer la recherche"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(0, 255, 204, 0.12)',
                    border: '1px solid rgba(0, 255, 204, 0.35)',
                    color: '#00ffcc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ArrowLeft size={18} />
                </button>

                {/* Champ de saisie central stylé cyberpunk */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(0, 255, 204, 0.08)',
                    border: '1.2px solid rgba(0, 255, 204, 0.3)',
                    borderRadius: '20px',
                    padding: '0 12px',
                    height: '38px',
                    boxSizing: 'border-box',
                  }}
                >
                  <Search size={15} color="#00ffcc" style={{ flexShrink: 0 }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Rechercher un Agent temporel..."
                    autoComplete="off"
                    spellCheck={false}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: '600',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        inputRef.current?.focus();
                      }}
                      title="Effacer"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.65)',
                        cursor: 'pointer',
                        padding: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Liste déroulante des résultats d'autocomplétion pleine largeur */}
              {query.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '62px',
                    left: 0,
                    right: 0,
                    background: 'rgba(5, 12, 28, 0.98)',
                    borderBottom: '1.5px solid rgba(0, 255, 204, 0.35)',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    maxHeight: 'calc(100dvh - 80px)',
                    overflowY: 'auto',
                    padding: '6px 12px',
                    boxSizing: 'border-box',
                  }}
                >
                  {suggestions.length > 0 ? (
                    suggestions.map((player: any, idx: number) => {
                      const isHighlighted = idx === selectedIndex;
                      const avatarSrc = getAvatarSrc(player);
                      const playerColor = player.color || player.teamColor || '#00ffcc';

                      return (
                        <div
                          key={player.id || player.childId || idx}
                          onClick={() => handleSelect(player)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            background: isHighlighted ? 'rgba(0, 255, 204, 0.16)' : 'transparent',
                            borderLeft: isHighlighted ? '3px solid #00ffcc' : '3px solid transparent',
                            transition: 'background 0.12s ease',
                          }}
                        >
                          {/* Avatar */}
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: `1.5px solid ${playerColor}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              background: 'rgba(0, 0, 0, 0.4)',
                              flexShrink: 0,
                            }}
                          >
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <User size={16} color={playerColor} />
                            )}
                          </div>

                          {/* Pseudo & Infos Équipe */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '0.88rem',
                                fontWeight: '700',
                                color: isHighlighted ? '#00ffcc' : '#ffffff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {player.pseudo || 'Agent Sans Nom'}
                            </div>
                            {player.teamName && (
                              <div
                                style={{
                                  fontSize: '0.7rem',
                                  color: playerColor,
                                  fontWeight: '600',
                                  opacity: 0.85,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {player.teamName}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        padding: '16px 14px',
                        fontSize: '0.82rem',
                        color: 'rgba(255, 255, 255, 0.55)',
                        fontStyle: 'italic',
                        textAlign: 'center',
                      }}
                    >
                      Aucun joueur trouvé pour « <strong>{query}</strong> »
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODE 2 : VERSION DESKTOP (Pill extensible dans le header)
  // -------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        zIndex: isOpen ? 60 : 15,
      }}
    >
      <motion.div
        layout
        initial={false}
        animate={{
          width: isOpen ? expandedWidth : `${buttonSize}px`,
          borderRadius: isOpen ? '22px' : '50%',
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
        style={{
          height: `${buttonSize}px`,
          background: isOpen ? 'rgba(5, 15, 30, 0.94)' : 'rgba(0, 255, 204, 0.18)',
          border: '1.5px solid #00ffcc',
          boxShadow: isOpen
            ? '0 0 16px rgba(0, 255, 204, 0.45), 0 4px 20px rgba(0, 0, 0, 0.6)'
            : '0 0 10px rgba(0, 255, 204, 0.3)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          cursor: isOpen ? 'default' : 'pointer',
        }}
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
          }
        }}
        title={!isOpen ? "Rechercher un joueur (Agent)" : undefined}
      >
        {/* Bouton Loupe / Icône permanente */}
        <div
          style={{
            width: `${buttonSize}px`,
            height: `${buttonSize}px`,
            minWidth: `${buttonSize}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00ffcc',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            if (!isOpen) {
              setIsOpen(true);
            } else if (!query) {
              setIsOpen(false);
            }
            e.stopPropagation();
          }}
        >
          <Search size={18} />
        </div>

        {/* Input extensible */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                paddingRight: '6px',
                height: '100%',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pseudo de l'Agent..."
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: '600',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  padding: '0 4px',
                }}
              />

              {/* Bouton Effacer / Fermer */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (query) {
                    setQuery('');
                    inputRef.current?.focus();
                  } else {
                    setIsOpen(false);
                  }
                }}
                title={query ? "Effacer la recherche" : "Refermer la recherche"}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.65)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'color 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ff3b3b';
                  e.currentTarget.style.transform = 'scale(1.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Menu déroulant holographique d'autocomplétion (Desktop) */}
      <AnimatePresence>
        {isOpen && query.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '48px',
              left: 0,
              width: '270px',
              background: 'rgba(5, 12, 28, 0.97)',
              border: '1.2px solid rgba(0, 255, 204, 0.45)',
              borderRadius: '14px',
              boxShadow: '0 14px 35px rgba(0, 0, 0, 0.85), 0 0 16px rgba(0, 255, 204, 0.25)',
              backdropFilter: 'blur(14px)',
              overflow: 'hidden',
              zIndex: 1000,
            }}
          >
            {suggestions.length > 0 ? (
              <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '5px' }}>
                {suggestions.map((player: any, idx: number) => {
                  const isHighlighted = idx === selectedIndex;
                  const avatarSrc = getAvatarSrc(player);
                  const playerColor = player.color || player.teamColor || '#00ffcc';

                  return (
                    <div
                      key={player.id || player.childId || idx}
                      onClick={() => handleSelect(player)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '7px 10px',
                        borderRadius: '9px',
                        cursor: 'pointer',
                        background: isHighlighted ? 'rgba(0, 255, 204, 0.16)' : 'transparent',
                        borderLeft: isHighlighted ? '2.5px solid #00ffcc' : '2.5px solid transparent',
                        transition: 'background 0.12s ease',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          border: `1.5px solid ${playerColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          background: 'rgba(0, 0, 0, 0.4)',
                          flexShrink: 0,
                        }}
                      >
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <User size={14} color={playerColor} />
                        )}
                      </div>

                      {/* Pseudo & Infos Équipe */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            color: isHighlighted ? '#00ffcc' : '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {player.pseudo || 'Agent Sans Nom'}
                        </div>
                        {player.teamName && (
                          <div
                            style={{
                              fontSize: '0.66rem',
                              color: playerColor,
                              fontWeight: '600',
                              opacity: 0.85,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {player.teamName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: '12px 14px',
                  fontSize: '0.78rem',
                  color: 'rgba(255, 255, 255, 0.55)',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                Aucun joueur trouvé pour « <strong>{query}</strong> »
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
