import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Users, ChevronDown, ChevronRight, Check } from 'lucide-react';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

export interface TeamItem {
  id: number | string;
  name: string;
  color?: string;
  icon?: string;
}

export interface PlayerFilterBar2026Props {
  teams: TeamItem[];
  allPlayers: any[];
  selectedTeamId: number | string | null;
  onSelectTeam: (teamId: number | string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectPlayer: (player: any) => void;
  view?: 'codex' | 'leaderboard';
  isMobile?: boolean;
}

export const PlayerFilterBar2026: React.FC<PlayerFilterBar2026Props> = ({
  teams = [],
  allPlayers = [],
  selectedTeamId,
  onSelectTeam,
  searchQuery,
  onSearchChange,
  onSelectPlayer,
  view = 'codex',
  isMobile = false,
}) => {
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [unknownWarning, setUnknownWarning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Thème selon la vue : Or pour Leaderboard, Cyan pour Codex
  const isLb = view === 'leaderboard';
  const themeColor = isLb ? '#ffd700' : '#00ffcc';
  const themeGlow = isLb ? 'rgba(255, 215, 0, 0.25)' : 'rgba(0, 255, 204, 0.25)';

  // Fermeture des menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsTeamOpen(false);
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Équipe actuellement sélectionnée
  const activeTeam = useMemo(() => {
    if (!selectedTeamId || selectedTeamId === 'all') return null;
    return teams.find(t => String(t.id) === String(selectedTeamId)) || null;
  }, [teams, selectedTeamId]);

  // Joueurs filtrés selon l'équipe sélectionnée
  const teamFilteredPlayers = useMemo(() => {
    if (!selectedTeamId || selectedTeamId === 'all') return allPlayers;
    return allPlayers.filter(p => String(p.teamId) === String(selectedTeamId));
  }, [allPlayers, selectedTeamId]);

  // Suggestions d'autocomplétion basées sur la recherche
  const suggestions = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return [];
    return teamFilteredPlayers
      .filter(p => (p.pseudo || '').toLowerCase().includes(trimmed))
      .slice(0, 8);
  }, [teamFilteredPlayers, searchQuery]);

  // Nombre de membres par équipe
  const teamMemberCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allPlayers.forEach(p => {
      if (p.teamId) {
        counts[String(p.teamId)] = (counts[String(p.teamId)] || 0) + 1;
      }
    });
    return counts;
  }, [allPlayers]);

  const handlePlayerClick = (player: any) => {
    setIsSearchFocused(false);
    onSelectPlayer(player);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return;

    // Correspondance exacte d'abord, sinon première suggestion
    const match =
      teamFilteredPlayers.find(p => (p.pseudo || '').toLowerCase() === trimmed) ||
      suggestions[0];

    if (match) {
      handlePlayerClick(match);
      setUnknownWarning(false);
    } else {
      setUnknownWarning(true);
      setTimeout(() => setUnknownWarning(false), 3000);
    }
  };

  const getAvatarSrc = (player: any) => {
    if (!player.avatar) return null;
    if (player.avatar.startsWith('http') || player.avatar.startsWith('blob:') || player.avatar.startsWith('data:')) {
      return player.avatar;
    }
    return `${EVOE_IMG_URL}avatars_3D/${player.avatar.split('/').pop()}`;
  };

  return (
    <div
      ref={containerRef}
      id="hud-player-filter-bar"
      style={{
        position: 'relative',
        zIndex: 50,
        width: isMobile ? 'calc(100% - 24px)' : 'min(760px, 92vw)',
        margin: '6px auto 0 auto',
        padding: isMobile ? '5px 8px' : '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '6px' : '10px',
        background: 'linear-gradient(135deg, rgba(8, 16, 32, 0.88), rgba(4, 9, 20, 0.94))',
        border: `1.5px solid ${themeColor}55`,
        borderRadius: '16px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: `0 8px 30px rgba(0, 0, 0, 0.6), 0 0 16px ${themeGlow}`,
        pointerEvents: 'auto',
        transition: 'all 0.3s ease',
      }}
    >
      {/* ── 1. BOUTON / MENU DÉROULANT DU FILTRE PAR ÉQUIPE ── */}
      <div style={{ position: 'relative' }} ref={teamDropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsTeamOpen(v => !v);
            setIsSearchFocused(false);
          }}
          title={activeTeam ? `Équipe filtrée : ${activeTeam.name}` : 'Filtrer par équipe'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '6px 9px' : '6px 12px',
            background: activeTeam
              ? `${activeTeam.color || themeColor}22`
              : 'rgba(255, 255, 255, 0.05)',
            border: activeTeam
              ? `1.5px solid ${activeTeam.color || themeColor}`
              : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '11px',
            color: activeTeam ? (activeTeam.color || themeColor) : '#e2e8f0',
            fontSize: isMobile ? '0.74rem' : '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            boxShadow: activeTeam ? `0 0 10px ${activeTeam.color || themeColor}44` : 'none',
          }}
        >
          {activeTeam ? (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activeTeam.color || themeColor,
                boxShadow: `0 0 6px ${activeTeam.color || themeColor}`,
                flexShrink: 0,
              }}
            />
          ) : (
            <Users size={14} style={{ color: themeColor, flexShrink: 0 }} />
          )}

          <span style={{ maxWidth: isMobile ? '90px' : '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeTeam ? activeTeam.name : (isMobile ? 'Équipes' : 'Toutes les équipes')}
          </span>

          <ChevronDown
            size={13}
            style={{
              transform: isTeamOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              opacity: 0.7,
              flexShrink: 0,
            }}
          />
        </button>

        {/* Menu déroulant des Équipes */}
        {isTeamOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: isMobile ? '230px' : '260px',
              background: 'rgba(6, 12, 24, 0.97)',
              border: `1.5px solid ${themeColor}66`,
              borderRadius: '14px',
              padding: '6px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              animation: 'fade-in-up 0.2s ease-out',
            }}
          >
            <div
              style={{
                padding: '4px 8px 6px',
                fontSize: '0.66rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'rgba(160, 174, 192, 0.8)',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Filtrer l'orbite 3D</span>
              <span>{allPlayers.length} agents</span>
            </div>

            {/* Option "Toutes les équipes" */}
            <button
              type="button"
              onClick={() => {
                onSelectTeam(null);
                setIsTeamOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: '8px',
                border: 'none',
                background: !activeTeam ? 'rgba(0, 255, 204, 0.12)' : 'transparent',
                color: !activeTeam ? themeColor : '#cbd5e1',
                fontSize: '0.78rem',
                fontWeight: !activeTeam ? 800 : 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = !activeTeam
                  ? 'rgba(0, 255, 204, 0.12)'
                  : 'transparent')
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={14} style={{ color: themeColor }} />
                <span>Toutes les équipes</span>
              </div>
              {!activeTeam && <Check size={14} style={{ color: themeColor }} />}
            </button>

            {/* Liste des équipes */}
            {teams.map(t => {
              const isSelected = String(t.id) === String(selectedTeamId);
              const count = teamMemberCounts[String(t.id)] || 0;
              const teamCol = t.color || '#00ffcc';

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectTeam(t.id);
                    setIsTeamOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? `${teamCol}22` : 'transparent',
                    color: isSelected ? teamCol : '#e2e8f0',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isSelected ? `${teamCol}22` : 'transparent')
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: teamCol,
                        boxShadow: `0 0 6px ${teamCol}`,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#94a3b8',
                      }}
                    >
                      {count}
                    </span>
                    {isSelected && <Check size={14} style={{ color: teamCol }} />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. SÉPARATEUR VISUEL ── */}
      <div
        style={{
          width: '1px',
          height: '20px',
          background: 'rgba(255, 255, 255, 0.12)',
          flexShrink: 0,
        }}
      />

      {/* ── 3. CHAMP DE RECHERCHE DE JOUEUR DYNAMIQUE ── */}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '10px',
              color: searchQuery.trim() ? themeColor : 'rgba(255, 255, 255, 0.4)',
              pointerEvents: 'none',
              transition: 'color 0.2s ease',
            }}
          />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsSearchFocused(true);
              setUnknownWarning(false);
            }}
            onFocus={() => {
              setIsSearchFocused(true);
              setIsTeamOpen(false);
            }}
            placeholder={isMobile ? "Chercher pseudo..." : "Rechercher un joueur (pseudo)..."}
            style={{
              width: '100%',
              padding: isMobile ? '6px 28px 6px 30px' : '6px 32px 6px 34px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '11px',
              color: '#ffffff',
              fontSize: isMobile ? '0.74rem' : '0.82rem',
              fontWeight: 600,
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = themeColor;
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.boxShadow = `0 0 10px ${themeGlow}`;
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />

          {/* Bouton Effacer la recherche */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                setIsSearchFocused(false);
                inputRef.current?.focus();
              }}
              title="Effacer la recherche"
              style={{
                position: 'absolute',
                right: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: 0,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 59, 59, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
            >
              <X size={11} />
            </button>
          )}
        </form>

        {/* ── 4. POPOVER D'AUTOCOMPLÉTION & RÉSULTATS (façon Administration) ── */}
        {isSearchFocused && searchQuery.trim().length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'rgba(6, 12, 24, 0.97)',
              border: `1.5px solid ${themeColor}66`,
              borderRadius: '14px',
              padding: '6px',
              boxShadow: '0 16px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 110,
              maxHeight: '320px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div
              style={{
                padding: '4px 8px 6px',
                fontSize: '0.66rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'rgba(160, 174, 192, 0.8)',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Correspondances 3D ({suggestions.length})</span>
              <span>Cliquer pour ouvrir le profil</span>
            </div>

            {suggestions.length > 0 ? (
              suggestions.map((p) => {
                const avatarUrl = getAvatarSrc(p);
                const playerTeam = teams.find(t => String(t.id) === String(p.teamId));
                const teamColor = p.color || playerTeam?.color || themeColor;
                const teamName = p.teamName || playerTeam?.name || `Équipe ${p.teamId || '?'}`;

                return (
                  <button
                    key={p.id || p.childId || p.pseudo}
                    type="button"
                    onClick={() => handlePlayerClick(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid transparent',
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      gap: '10px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = `${themeColor}44`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: `1.5px solid ${teamColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: `0 0 6px ${teamColor}33`,
                        }}
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: teamColor }}>
                            {(p.pseudo || '?')[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Infos Joueur */}
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.pseudo}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#94a3b8' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: teamColor,
                                flexShrink: 0,
                              }}
                            />
                            <strong style={{ color: teamColor }}>{teamName}</strong>
                          </span>
                          <span>•</span>
                          <span>{p.score ?? p.actionsCount ?? 0} IT</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: themeColor,
                          fontWeight: 700,
                          display: isMobile ? 'none' : 'inline',
                        }}
                      >
                        Voir profil
                      </span>
                      <ChevronRight size={14} style={{ color: themeColor }} />
                    </div>
                  </button>
                );
              })
            ) : (
              <div
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  fontStyle: 'italic',
                }}
              >
                Aucun joueur correspondant à « <strong>{searchQuery}</strong> »
                {activeTeam && <span> dans l'équipe {activeTeam.name}</span>}.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 5. BADGE COMPTEUR / RÉINITIALISATION GLOBALE ── */}
      {(activeTeam || searchQuery.trim()) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => {
              onSelectTeam(null);
              onSearchChange('');
              setIsSearchFocused(false);
            }}
            title="Réinitialiser tous les filtres"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '9px',
              background: 'rgba(255, 59, 59, 0.15)',
              border: '1px solid rgba(255, 59, 59, 0.4)',
              color: '#ff6b6b',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 59, 59, 0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 59, 59, 0.15)')}
          >
            <X size={12} />
            <span style={{ display: isMobile ? 'none' : 'inline' }}>Reset</span>
          </button>
        </div>
      )}

      {/* Toast d'avertissement Joueur Inconnu si Entrée sans match */}
      {unknownWarning && (
        <div
          style={{
            position: 'absolute',
            bottom: '-34px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(220, 38, 38, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            padding: '3px 12px',
            borderRadius: '12px',
            fontSize: '0.72rem',
            fontWeight: 800,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
            whiteSpace: 'nowrap',
            zIndex: 120,
            animation: 'fade-in-up 0.2s ease-out',
          }}
        >
          Joueur inconnu : aucun profil correspondant
        </div>
      )}
    </div>
  );
};
