import React from 'react';
import { Canvas } from '@react-three/fiber';
import Portal2026 from '../Portal2026';
import Portal2070 from '../Portal2070';

export interface DashboardCanvasProps {
  era: '2026' | '2070';
  dpr: number | [number, number];
  isHeavyModalOpen: boolean;
  searchedPlayerId: string | number | null;
  missionsByCategory: any;
  handleSelectSector: (sector: string) => void;
  handleSelectPlayer: (id: number) => void;
  handleGlobeClick: () => void;
  handleCodexConsoleClick: () => void;
  handleStarClick: (starId: number) => void;
  childInfos: any;
  setShowNoPeriodModal: (show: boolean) => void;
  setSelectedProfileId: (id: number | null) => void;
  setChatOpen: (open: boolean) => void;
  setCodexTab: React.Dispatch<React.SetStateAction<'missions' | 'challenges'>> | ((tab: 'missions' | 'challenges') => void);
  setIsCodexCollapsed: (collapsed: boolean) => void;
  handleSwitchEra: () => void;
  selectedSector: string | null;
  setSelectedSector: (sector: string) => void;
  onlineUsers: any;
  unreadChat: any;
  handleSelectEnvelope: () => void;
  isMobile: boolean;
  view2026: 'codex' | 'leaderboard';
  leaderboardTimeframe: any;
  dashboardStatus: any;
  challenges: any[];
  impulsedMissionsCount: number;
  isStealthMode: boolean;
  toggleStealthMode: () => void;
  enrichedPlayers: any[];
  handleSelectBirthdayCake: (player: any) => void;
  setShowMissionsWeekModal: (show: boolean) => void;
  setView2026: (v: 'codex' | 'leaderboard') => void;
  selectedRadarTeamId: string | number | null;
  handleEarthClick: (level: number) => void;
  handleVesselClick: (teamId: string | number) => void;
  earthOracleLevel: any;
  setEarthOracleLevel: (level: any) => void;
  earthOracleText: string;
  earthOracleTyping: boolean;
}

export const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  era,
  dpr,
  isHeavyModalOpen,
  searchedPlayerId,
  missionsByCategory,
  handleSelectSector,
  handleSelectPlayer,
  handleGlobeClick,
  handleCodexConsoleClick,
  handleStarClick,
  childInfos,
  setShowNoPeriodModal,
  setSelectedProfileId,
  setChatOpen,
  setCodexTab,
  setIsCodexCollapsed,
  handleSwitchEra,
  selectedSector,
  setSelectedSector,
  onlineUsers,
  unreadChat,
  handleSelectEnvelope,
  isMobile,
  view2026,
  leaderboardTimeframe,
  dashboardStatus,
  challenges,
  impulsedMissionsCount,
  isStealthMode,
  toggleStealthMode,
  enrichedPlayers,
  handleSelectBirthdayCake,
  setShowMissionsWeekModal,
  setView2026,
  selectedRadarTeamId,
  handleEarthClick,
  handleVesselClick,
  earthOracleLevel,
  setEarthOracleLevel,
  earthOracleText,
  earthOracleTyping,
}) => {
  return (
    <>
      {/* Three.js Canvas Container */}
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 2.4, 10.9], fov: 60 }}
          dpr={dpr}
          frameloop={isHeavyModalOpen ? 'demand' : 'always'}
          gl={{
            powerPreference: 'high-performance',
            antialias: true,
            alpha: true,
            stencil: false,
            depth: true,
            precision: 'highp',
          }}
        >
          {era === '2026' && (
            <Portal2026
              isActive={true}
              focusedPlayerId={searchedPlayerId}
              categories={missionsByCategory ? Object.keys(missionsByCategory) : []}
              onSelectSector={handleSelectSector}
              onSelectPlayer={handleSelectPlayer}
              onGlobeClick={handleGlobeClick}
              onCodexConsoleClick={handleCodexConsoleClick}
              onStarClick={handleStarClick}
              onSelectChallenges={() => {
                if (childInfos && childInfos.isPeriodOpen === false) {
                  setShowNoPeriodModal(true);
                  return;
                }
                setSelectedProfileId(null);
                setChatOpen(false);
                setCodexTab('challenges');
                setIsCodexCollapsed(false);
                if (era !== '2026') handleSwitchEra();
                if (!selectedSector) {
                  const cats = missionsByCategory ? Object.keys(missionsByCategory) : [];
                  if (cats.length > 0) setSelectedSector(cats[0]);
                }
              }}
              onSelectChallengeBadge={() => {
                if (childInfos && childInfos.isPeriodOpen === false) {
                  setShowNoPeriodModal(true);
                  return;
                }
                setSelectedProfileId(null);
                setChatOpen(false);
                setCodexTab('challenges');
                setIsCodexCollapsed(false);
                if (era !== '2026') handleSwitchEra();
                if (!selectedSector) {
                  const cats = missionsByCategory ? Object.keys(missionsByCategory) : [];
                  if (cats.length > 0) setSelectedSector(cats[0]);
                }
              }}
              onlineUsers={onlineUsers}
              unreadTeam={unreadChat.team}
              unreadGlobal={unreadChat.global}
              unreadSystem={unreadChat.system}
              unreadMps={unreadChat.unreadMps}
              onSelectEnvelope={handleSelectEnvelope}
              isMobile={isMobile}
              view={view2026}
              leaderboardTimeframe={leaderboardTimeframe}
              dashboardStatus={dashboardStatus}
              challenges={challenges}
              missionsWeekCount={impulsedMissionsCount}
              isStealthMode={isStealthMode}
              onToggleStealth={toggleStealthMode}
              customPlayersList={enrichedPlayers}
              onSelectBirthdayCake={handleSelectBirthdayCake}
              onSelectMissionsWeek={() => {
                setSelectedProfileId(null);
                setChatOpen(false);
                setShowMissionsWeekModal(true);
              }}
              onCloseLeaderboard={() => setView2026('codex')}
            />
          )}
          {era === '2070' && (
            <Portal2070
              isActive={true}
              dashboardStatus={dashboardStatus}
              selectedTeamId={selectedRadarTeamId}
              onEarthClick={handleEarthClick}
              onVesselClick={handleVesselClick}
              isMobile={isMobile}
            />
          )}
        </Canvas>
      </div>

      {/* Oracle Terrestre — Overlay machine à écrire au clic sur la Terre */}
      {era === '2070' && earthOracleLevel !== null && (
        <div
          onClick={() => setEarthOracleLevel(null)}
          style={{
            position: 'fixed',
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            maxWidth: '560px',
            width: '90vw',
            background: 'rgba(5, 10, 22, 0.88)',
            border: '1px solid rgba(0, 255, 204, 0.4)',
            borderRadius: '16px',
            padding: '20px 24px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(0, 255, 204, 0.12), 0 20px 50px rgba(0,0,0,0.7)',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: '900',
                letterSpacing: '0.18em',
                color: '#00ffcc',
                textTransform: 'uppercase',
                textShadow: '0 0 8px rgba(0,255,204,0.5)',
              }}
            >
              🌍 Oracle Terrestre — 2070
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(160,174,192,0.6)', fontStyle: 'italic' }}>
              Cliquer pour fermer
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              lineHeight: '1.7',
              color: '#e2e8f0',
              fontFamily: '"Courier New", Courier, monospace',
              minHeight: '60px',
            }}
          >
            {earthOracleText}
            {earthOracleTyping && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  background: '#00ffcc',
                  marginLeft: '2px',
                  animation: 'blink 0.7s step-end infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            )}
          </p>
        </div>
      )}
    </>
  );
};
