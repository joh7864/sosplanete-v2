import React from 'react';
import { Compass, Radio, Globe, Trophy, MessageSquare } from 'lucide-react';

export interface MobileBottomNavProps {
  era: '2026' | '2070';
  selectedSector: string | null;
  codexTab: 'missions' | 'challenges';
  selectedProfileId: number | null;
  setSelectedProfileId: (id: number | null) => void;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatOpen: boolean;
  unreadChat: { total: number };
  setCodexTab: (tab: 'missions' | 'challenges') => void;
  setIsCodexCollapsed: (collapsed: boolean) => void;
  handleSwitchEra: () => void;
  isTransitioning: boolean;
  currentYear: number | string;
  missionsByCategory?: Record<string, any>;
  setSelectedSector: (sector: string) => void;
  view2026: 'codex' | 'leaderboard';
  setView2026: React.Dispatch<React.SetStateAction<'codex' | 'leaderboard'>>;
  setShowExtrapolation: (show: boolean) => void;
  setShowRadar: (show: boolean) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  era,
  selectedSector,
  codexTab,
  selectedProfileId,
  setSelectedProfileId,
  setChatOpen,
  chatOpen,
  unreadChat,
  setCodexTab,
  setIsCodexCollapsed,
  handleSwitchEra,
  isTransitioning,
  currentYear,
  missionsByCategory,
  setSelectedSector,
  view2026,
  setView2026,
  setShowExtrapolation,
  setShowRadar,
}) => {
  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`nav-item ${era === '2026' && selectedSector && codexTab === 'missions' && !selectedProfileId ? 'active' : ''}`}
        onClick={() => {
          setSelectedProfileId(null);
          setChatOpen(false);
          setCodexTab('missions');
          setIsCodexCollapsed(false);
          if (era !== '2026') {
            handleSwitchEra();
          }
          const cats = missionsByCategory ? Object.keys(missionsByCategory) : [];
          if (cats.length > 0) {
            setSelectedSector(cats[0]);
          } else {
            setSelectedSector('Energie');
          }
        }}
      >
        <Compass size={20} />
        <span>Missions</span>
      </button>

      <button
        className={`nav-item ${era === '2026' && selectedSector && codexTab === 'challenges' && !selectedProfileId ? 'active' : ''}`}
        onClick={() => {
          setSelectedProfileId(null);
          setChatOpen(false);
          setCodexTab('challenges');
          setIsCodexCollapsed(false);
          if (era !== '2026') {
            handleSwitchEra();
          }
          if (!selectedSector) {
            const cats = missionsByCategory ? Object.keys(missionsByCategory) : [];
            if (cats.length > 0) {
              setSelectedSector(cats[0]);
            } else {
              setSelectedSector('Energie');
            }
          }
        }}
      >
        <Radio size={20} />
        <span>Défis</span>
      </button>

      {/* Central Floating Action Button (FAB) for Era Switch */}
      <div id="hud-btn-epoch-fab" className="fab-container">
        <button
          className="fab-button"
          onClick={handleSwitchEra}
          disabled={isTransitioning}
          title={era === '2026' ? 'Voyager vers 2070' : `Retourner en ${currentYear}`}
          style={{
            background:
              era === '2026'
                ? 'linear-gradient(135deg, #00b3ff, #0055ff)'
                : 'linear-gradient(135deg, #00ffcc, #00aa66)',
            boxShadow:
              era === '2026'
                ? '0 4px 15px rgba(0, 179, 255, 0.4), 0 0 0 4px rgba(0, 179, 255, 0.05)'
                : '0 4px 15px rgba(0, 255, 204, 0.4), 0 0 0 4px rgba(0, 255, 204, 0.05)',
          }}
        >
          {era === '2026' ? (
            <Radio size={24} className="fab-pulse-icon" style={{ color: '#050a16' }} />
          ) : (
            <Globe size={24} className="fab-pulse-icon" style={{ color: '#050a16' }} />
          )}
        </button>
      </div>

      <button
        className={`nav-item ${era === '2026' && view2026 === 'leaderboard' ? 'active' : ''}`}
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
        style={
          era === '2026' && view2026 === 'leaderboard'
            ? {
                color: '#ffd700',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.6)',
              }
            : {}
        }
      >
        <Trophy
          size={20}
          style={{
            strokeWidth: era === '2026' && view2026 === 'leaderboard' ? 2.8 : 1.8,
            fill: era === '2026' && view2026 === 'leaderboard' ? '#ffd700' : 'transparent',
            filter: era === '2026' && view2026 === 'leaderboard' ? 'drop-shadow(0 0 8px #ffd700)' : 'none',
            transform: era === '2026' && view2026 === 'leaderboard' ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 0.2s ease',
          }}
        />
        <span style={{ fontWeight: era === '2026' && view2026 === 'leaderboard' ? 800 : 500 }}>Scores</span>
      </button>

      <button
        id="hud-btn-chat"
        className={`nav-item ${chatOpen ? 'active' : ''}`}
        onClick={() => {
          setSelectedProfileId(null);
          setChatOpen((prev) => !prev);
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={20} />
          {unreadChat.total > 0 && <span className="nav-badge">{unreadChat.total}</span>}
        </div>
        <span>Chat</span>
      </button>
    </nav>
  );
};
