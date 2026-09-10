import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

export interface PlayerSearchHUDProps {
  players: any[];
  onSelectPlayer: (player: any) => void;
  isMobile?: boolean;
}

export const PlayerSearchHUD: React.FC<PlayerSearchHUDProps> = ({
  players = [],
  onSelectPlayer,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      }, 50);
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
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
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
      const exactMatch = players.find(p => (p.pseudo || '').toLowerCase() === trimmed);
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

  const expandedWidth = isMobile ? '200px' : '250px';

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center',
        zIndex: isOpen ? 60 : 15 
      }}
    >
      <motion.div
        layout
        initial={false}
        animate={{
          width: isOpen ? expandedWidth : '40px',
          borderRadius: isOpen ? '22px' : '50%',
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
        style={{
          height: '40px',
          background: isOpen 
            ? 'rgba(5, 15, 30, 0.94)' 
            : 'rgba(0, 255, 204, 0.18)',
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
            width: '40px',
            height: '40px',
            minWidth: '40px',
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

      {/* Menu déroulant holographique d'autocomplétion */}
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
              width: isMobile ? '230px' : '270px',
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
