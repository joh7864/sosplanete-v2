import React from 'react';
import { Mail, Sparkles, Zap, Radio, Globe, Trophy } from 'lucide-react';
import { SciFiEggBadge } from './SciFiEggBadge';
import { LeaderboardTimeframeSwitch } from './LeaderboardTimeframeSwitch';
import { PlayerSearchHUD } from './PlayerSearchHUD';
import { SystemMenuHUD } from './SystemMenuHUD';

export interface TopHudProps {
  childInfos: any;
  setSelectedProfileId: (id: number | null) => void;
  getAvatarUrl: () => string;
  currentPlayer: any;
  unreadChat: { total: number };
  handleLogoMouseDown: () => void;
  handleLogoMouseUpOrLeave: () => void;
  era: '2026' | '2070';
  activeEggData: any;
  hasUnreadEasterEgg?: boolean;
  hasSeenEnigma: boolean;
  markEnigmaAsSeen: () => void;
  setShowMascotBubble: (show: boolean) => void;
  interactWithEgg: () => Promise<any>;
  fetchActiveEgg: () => Promise<any>;
  handleOpenChronoEgg: () => void;
  isBirthdayActive: boolean;
  view2026: 'codex' | 'leaderboard';
  isPhysicalPortrait: boolean;
  leaderboardTimeframe: any;
  setLeaderboardTimeframe: (tf: any) => void;
  dashboardStatus: any;
  players: any[];
  setSearchedPlayerId: (id: number) => void;
  handleSearchMatchChange: (matches: any[]) => void;
  searchCloseTrigger?: number | null;
  isMobile: boolean;
  handleSwitchEra: () => void;
  isTransitioning: boolean;
  currentYear: number | string;
  setChatOpen: (open: boolean) => void;
  setShowExtrapolation: (show: boolean) => void;
  setShowRadar: (show: boolean) => void;
  setView2026: React.Dispatch<React.SetStateAction<'codex' | 'leaderboard'>>;
  whatsappInviteUrl: string;
  setShowOnboardingGuide: (show: boolean) => void;
  setShowAboutModal: (show: boolean) => void;
  logoutUser: () => void;
  pkgVersion: string;
  isUnbridledDpr: boolean;
  toggleUnbridledDpr: () => void;
  unlockedArcadeGames: any[];
  setShowArcadeHub: (show: boolean) => void;
}

export const TopHud: React.FC<TopHudProps> = ({
  childInfos,
  setSelectedProfileId,
  getAvatarUrl,
  currentPlayer,
  unreadChat,
  handleLogoMouseDown,
  handleLogoMouseUpOrLeave,
  era,
  activeEggData,
  hasUnreadEasterEgg,
  hasSeenEnigma,
  markEnigmaAsSeen,
  setShowMascotBubble,
  interactWithEgg,
  fetchActiveEgg,
  handleOpenChronoEgg,
  isBirthdayActive,
  view2026,
  isPhysicalPortrait,
  leaderboardTimeframe,
  setLeaderboardTimeframe,
  dashboardStatus,
  players,
  setSearchedPlayerId,
  handleSearchMatchChange,
  searchCloseTrigger,
  isMobile,
  handleSwitchEra,
  isTransitioning,
  currentYear,
  setChatOpen,
  setShowExtrapolation,
  setShowRadar,
  setView2026,
  whatsappInviteUrl,
  setShowOnboardingGuide,
  setShowAboutModal,
  logoutUser,
  pkgVersion,
  isUnbridledDpr,
  toggleUnbridledDpr,
  unlockedArcadeGames,
  setShowArcadeHub,
}) => {
  return (
    <header className="header">
      <div
        id="hud-agent-profile"
        className="logo"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          pointerEvents: 'auto',
        }}
      >
        {childInfos && (
          <div
            style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setSelectedProfileId(childInfos.id)}
            title="Ouvrir la fiche profil de l'Agent"
          >
            <img
              src={getAvatarUrl()}
              alt=""
              className="avatar-pulse-ring"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: `1.8px solid ${currentPlayer?.color || '#00ffcc'}`,
                objectFit: 'cover',
                boxShadow: `0 0 10px ${currentPlayer?.color || '#00ffcc'}44`,
              }}
            />
            {unreadChat.total > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: '#ff3b3b',
                  borderRadius: '50%',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(5, 8, 16, 0.94)',
                  boxShadow: '0 0 6px #ff3b3b',
                  zIndex: 10,
                }}
              >
                <Mail size={8} color="#fff" />
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.25rem',
                lineHeight: '1.1',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onMouseDown={handleLogoMouseDown}
              onMouseUp={handleLogoMouseUpOrLeave}
              onMouseLeave={handleLogoMouseUpOrLeave}
              onTouchStart={handleLogoMouseDown}
              onTouchEnd={handleLogoMouseUpOrLeave}
            >
              EVOE {era}
            </h1>
            {/* Badge Œuf de Pâques SF 2070 */}
            {childInfos && (
              <SciFiEggBadge
                eggData={activeEggData}
                hasUnread={hasUnreadEasterEgg}
                hasSeenEnigma={hasSeenEnigma}
                onClick={async () => {
                  if (!activeEggData?.hasActiveEgg || !activeEggData?.easterEgg?.isInteractable) return;
                  markEnigmaAsSeen();
                  setShowMascotBubble(true);
                  if (!activeEggData?.isReplayMode) {
                    if (!activeEggData?.playerProgress?.firstInteractionAt) {
                      await interactWithEgg();
                      await fetchActiveEgg();
                    } else {
                      await fetchActiveEgg();
                    }
                  }
                }}
              />
            )}

            {/* Bouton Accès Chrono-Egg si débloqué (Bouton Icône avec Tooltip) */}
            {childInfos && (activeEggData?.metaEnigma?.hasChronoEgg || activeEggData?.teamProgress?.hasChronoEgg) && (
              <button
                type="button"
                onClick={handleOpenChronoEgg}
                title="Chrono-Egg : Archives Temporelles 2070 (Méta-Énigme)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.35))',
                  border: '1.5px solid rgba(168, 85, 247, 0.65)',
                  borderRadius: '50%',
                  color: '#e9d5ff',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(168, 85, 247, 0.45)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.12)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.85)';
                  e.currentTarget.style.borderColor = '#c084fc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.45)';
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.65)';
                }}
              >
                <Sparkles size={16} />
              </button>
            )}
          </div>
          {childInfos && (
            <span
              onClick={() => setSelectedProfileId(childInfos.id)}
              title="Ouvrir la fiche profil de l'Agent"
              style={{
                fontSize: '0.75rem',
                color: '#00ffcc',
                fontWeight: 'bold',
                textShadow: '0 0 5px rgba(0,255,204,0.3)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              Agent Temporel {childInfos.pseudo} {isBirthdayActive && '🎂'}
            </span>
          )}
        </div>
      </div>

      {/* 1. Mode Codex : Progression Terre 2070 / Mode Leaderboard : Capsule Switch Tout / Période */}
      {(() => {
        if (era === '2026' && view2026 === 'leaderboard') {
          const isPortrait = isPhysicalPortrait;
          return (
            <div
              id="leaderboard-timeframe-switch-container"
              className="leaderboard-timeframe-container"
              style={{
                position: 'absolute',
                left: '50%',
                top: isPortrait ? 'calc(100% + 6px)' : '50%',
                transform: isPortrait ? 'translateX(-50%)' : 'translate(-50%, -50%)',
                zIndex: 9998,
                pointerEvents: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <LeaderboardTimeframeSwitch
                timeframe={leaderboardTimeframe}
                onChange={setLeaderboardTimeframe}
                isMobile={isPortrait}
              />
            </div>
          );
        }

        const pct = (() => {
          if (
            dashboardStatus?.globalProgression !== undefined &&
            dashboardStatus.globalProgression !== null
          ) {
            return Math.min(100, Math.round(dashboardStatus.globalProgression));
          }
          const myTeam = dashboardStatus?.teams?.find((t: any) => t.id === childInfos?.group?.teamId);
          if (myTeam?.position !== undefined && myTeam.position !== null) {
            return Math.min(100, Math.round(myTeam.position));
          }
          return 0;
        })();

        return (
          <>
            <div
              id="hud-completion-bar"
              className="desktop-only"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(5, 15, 25, 0.75)',
                border: '1.5px solid rgba(0, 255, 204, 0.5)',
                borderRadius: '24px',
                padding: '7px 20px',
                boxShadow: '0 0 16px rgba(0, 255, 204, 0.22)',
                pointerEvents: 'auto',
                zIndex: 10,
                overflow: 'hidden',
                minWidth: '240px',
                justifyContent: 'center',
              }}
              title="Progression globale de l'équipage sur la période active (pondération : 60% CO2, 20% Eau, 20% Déchets)"
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background:
                    'linear-gradient(90deg, rgba(16, 185, 129, 0.5) 0%, rgba(0, 255, 204, 0.7) 100%)',
                  boxShadow: '0 0 12px rgba(0, 255, 204, 0.6)',
                  borderRadius: '24px',
                  transition: 'width 0.8s ease-in-out',
                  zIndex: 1,
                }}
              />
              <Zap
                size={15}
                color="#ffffff"
                style={{ filter: 'drop-shadow(0 0 5px #00ffcc)', zIndex: 2, position: 'relative' }}
              />
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  color: '#ffffff',
                  letterSpacing: '0.6px',
                  whiteSpace: 'nowrap',
                  zIndex: 2,
                  position: 'relative',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 255, 204, 0.5)',
                }}
              >
                TERRE 2070 : {pct}% RÉGÉNÉRÉE
              </span>
            </div>

            {/* 2. Mode Mobile Portrait (Option 2) : Ligne Laser d'Énergie au bas du Header */}
            <div
              id="hud-laser-regen-bar"
              className="mobile-portrait-only"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '3px',
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'visible',
                zIndex: 15,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981 0%, #00ffcc 100%)',
                  boxShadow: '0 0 8px #00ffcc, 0 0 4px #10b981',
                  position: 'relative',
                  transition: 'width 0.8s ease-in-out',
                }}
              >
                {/* Point lumineux d'impact laser */}
                <div
                  style={{
                    position: 'absolute',
                    right: '-3px',
                    top: '-2px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 0 8px #00ffcc, 0 0 12px #ffffff',
                  }}
                />
              </div>

              {/* Badge centré directement sur la ligne laser */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(5, 12, 28, 0.94)',
                  border: '1.2px solid rgba(0, 255, 204, 0.65)',
                  borderRadius: '12px',
                  padding: '2px 10px',
                  fontSize: '0.66rem',
                  fontWeight: '800',
                  color: '#00ffcc',
                  boxShadow: '0 0 10px rgba(0, 255, 204, 0.4), 0 2px 8px rgba(0, 0, 0, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  pointerEvents: 'none',
                  letterSpacing: '0.4px',
                  whiteSpace: 'nowrap',
                  zIndex: 20,
                }}
              >
                <Zap size={11} color="#00ffcc" style={{ filter: 'drop-shadow(0 0 4px #00ffcc)' }} />
                <span>TERRE 2070 : {pct}%</span>
              </div>
            </div>
          </>
        );
      })()}

      <div
        className="header-actions"
        style={{ display: 'flex', gap: '10px', alignItems: 'center', pointerEvents: 'auto' }}
      >
        {/* BARRE DE GAUCHE : BOUTONS FONCTIONNELS DE JEU */}

        {/* Recherche de Joueur (Bouton-icône extensible avec autocomplétion) */}
        <PlayerSearchHUD
          players={players || []}
          onSelectPlayer={(player) => {
            if (view2026 === 'leaderboard') {
              setSearchedPlayerId(player.childId || player.id);
            } else {
              setSelectedProfileId(player.childId || player.id);
            }
          }}
          onSearchMatchChange={handleSearchMatchChange}
          forceCloseTrigger={searchCloseTrigger}
          isMobile={isMobile}
        />

        {/* Switch Ère (Icônes identiques au mobile) */}
        <button
          id="hud-epoch-switch"
          className="switch-btn desktop-only"
          onClick={handleSwitchEra}
          disabled={isTransitioning}
          title={era === '2026' ? 'Voyager vers le Radar 2070' : `Retourner au QG ${currentYear}`}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: era === '2026' ? 'rgba(0, 179, 255, 0.18)' : 'rgba(0, 255, 204, 0.18)',
            border: era === '2026' ? '1.5px solid #00b3ff' : '1.5px solid #00ffcc',
            color: era === '2026' ? '#00b3ff' : '#00ffcc',
            boxShadow: era === '2026' ? '0 0 10px rgba(0, 179, 255, 0.3)' : '0 0 10px rgba(0, 255, 204, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          {era === '2026' ? <Radio size={18} /> : <Globe size={18} />}
        </button>

        {/* Podium / Leaderboard */}
        <button
          id="btn-podium-leaderboard"
          className={`switch-btn desktop-only ${era === '2026' && view2026 === 'leaderboard' ? 'active' : ''}`}
          onClick={() => {
            setSelectedProfileId(null);
            setChatOpen(false);
            setShowExtrapolation(false);
            setShowRadar(false);
            if (era === '2070') {
              handleSwitchEra();
            }
            setView2026((v) => (v === 'leaderboard' ? 'codex' : 'leaderboard'));
          }}
          title={view2026 === 'leaderboard' ? 'Retour au QG Codex' : 'Afficher le Classement 3D'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: era === '2026' && view2026 === 'leaderboard' ? '#ffd700' : 'rgba(255, 215, 0, 0.15)',
            border: '1.5px solid #ffd700',
            color: era === '2026' && view2026 === 'leaderboard' ? '#050a16' : '#ffd700',
            boxShadow:
              era === '2026' && view2026 === 'leaderboard'
                ? '0 0 20px #ffd700, 0 0 35px rgba(255, 215, 0, 0.8)'
                : '0 0 10px rgba(255, 215, 0, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          <Trophy
            size={20}
            style={{
              strokeWidth: era === '2026' && view2026 === 'leaderboard' ? 2.8 : 1.8,
              fill: era === '2026' && view2026 === 'leaderboard' ? '#050a16' : 'transparent',
              transform: era === '2026' && view2026 === 'leaderboard' ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          />
        </button>

        {/* SÉPARATEUR VISUEL NET (DESKTOP & PAYSAGE) */}
        <div
          className="desktop-only"
          style={{
            width: '1.5px',
            height: '24px',
            background: 'rgba(0, 255, 204, 0.35)',
            boxShadow: '0 0 8px rgba(0, 255, 204, 0.4)',
            margin: '0 3px',
          }}
        />

        {/* Menu Système Holographique Universel */}
        <SystemMenuHUD
          whatsappInviteUrl={whatsappInviteUrl}
          onOpenHelp={() => setShowOnboardingGuide(true)}
          onOpenAbout={() => setShowAboutModal(true)}
          onLogout={logoutUser}
          version={pkgVersion}
          isMobile={isMobile}
          isUnbridledDpr={isUnbridledDpr}
          onToggleUnbridledDpr={toggleUnbridledDpr}
          hasUnlockedArcade={unlockedArcadeGames.length > 0}
          onOpenArcade={() => setShowArcadeHub(true)}
        />
      </div>
    </header>
  );
};
