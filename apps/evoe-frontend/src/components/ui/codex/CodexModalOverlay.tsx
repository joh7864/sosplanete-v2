import React from 'react';
import { X } from 'lucide-react';
import { MissionsCarousel3D } from '../MissionsCarousel3D';
import { ChallengesCarousel3D } from '../ChallengesCarousel3D';
import { OrbitalSectorRibbon } from '../OrbitalSectorRibbon';
import { MissionSearchBar } from '../MissionSearchBar';

export interface CodexModalOverlayProps {
  isMobile: boolean;
  missionSearchQuery: string;
  setMissionSearchQuery: (q: string) => void;
  codexTab: 'missions' | 'challenges';
  setCodexTab: (tab: 'missions' | 'challenges') => void;
  isMobileSearchOpen: boolean;
  setIsMobileSearchOpen: (open: boolean) => void;
  searchedMissions: any[];
  setSelectedSector: (sector: string | null) => void;
  missionsByCategory: any;
  selectedSector: string;
  loadingMissionId: number | null;
  handleImpulseMission: (id: number) => Promise<any> | void;
  setCancelMissionConfirm: (confirm: any) => void;
  setShowMissionsWeekModal: (show: boolean) => void;
  handleOpenVision2050: (themeId?: any) => void;
  activeEggData: any;
  receivedChallenges: any[];
  sentChallenges: any[];
  availableMissionsForChallenge: any[];
  handleRespondChallenge: (id: number, accept: boolean) => Promise<any> | void;
  childInfos: any;
  setShowNoPeriodModal: (show: boolean) => void;
  setShowChallengeModal: (show: boolean) => void;
}

export const CodexModalOverlay: React.FC<CodexModalOverlayProps> = ({
  isMobile,
  missionSearchQuery,
  setMissionSearchQuery,
  codexTab,
  setCodexTab,
  isMobileSearchOpen,
  setIsMobileSearchOpen,
  searchedMissions,
  setSelectedSector,
  missionsByCategory,
  selectedSector,
  loadingMissionId,
  handleImpulseMission,
  setCancelMissionConfirm,
  setShowMissionsWeekModal,
  handleOpenVision2050,
  activeEggData,
  receivedChallenges,
  sentChallenges,
  availableMissionsForChallenge,
  handleRespondChallenge,
  childInfos,
  setShowNoPeriodModal,
  setShowChallengeModal,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        padding: isMobile ? 0 : '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: isMobile ? '100vw' : 'min(1040px, 94vw)',
          height: isMobile ? '100dvh' : 'min(700px, calc(100dvh - 40px))',
          background: 'rgba(10, 15, 30, 0.94)',
          border: isMobile ? 'none' : '1px solid rgba(0, 255, 204, 0.2)',
          borderRadius: isMobile ? 0 : '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)',
          animation: 'popup-scale 0.3s ease-out forwards',
        }}
      >
        {/* En-tête HUD responsive — flexShrink:0 garantit qu'il ne se réduit pas */}
        <div
          style={{
            display: 'flex',
            position: 'relative',
            zIndex: 20,
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            padding: isMobile ? '8px 12px 6px' : '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            gap: isMobile ? '6px' : '12px',
            background: 'rgba(0, 255, 204, 0.02)',
            flexShrink: 0,
          }}
        >
          {/* Ligne 1 sur Mobile: Titre + Contrôles (Loupe + Fermer) / Gauche sur Desktop */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <h2
              style={{
                margin: 0,
                color: '#fff',
                fontSize: isMobile ? '1.05rem' : '1.25rem',
                fontWeight: 800,
                letterSpacing: '0.8px',
                whiteSpace: 'nowrap',
              }}
            >
              Missions & Défis
            </h2>

            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MissionSearchBar
                  value={missionSearchQuery}
                  onChange={(val) => {
                    setMissionSearchQuery(val);
                    if (val && codexTab !== 'missions') {
                      setCodexTab('missions');
                    }
                  }}
                  isMobile={true}
                  isOpenMobile={isMobileSearchOpen}
                  onToggleMobile={(open) => {
                    setIsMobileSearchOpen(open);
                  }}
                  resultsCount={searchedMissions.length}
                />

                <button
                  onClick={() => {
                    setSelectedSector(null);
                    setMissionSearchQuery('');
                    setIsMobileSearchOpen(false);
                  }}
                  style={{
                    background: 'rgba(255, 100, 100, 0.1)',
                    border: '1px solid rgba(255,100,100,0.4)',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    color: '#ff6666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                  }}
                  title="Fermer"
                >
                  <X size={17} />
                </button>
              </div>
            )}
          </div>

          {/* Ruban des secteurs — Ligne 2 mobile, inline desktop */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              justifyContent: isMobile ? 'flex-start' : 'center',
              overflowX: 'auto',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              flex: isMobile ? 'none' : '1 1 auto',
              minWidth: 0,
            }}
          >
            <OrbitalSectorRibbon
              categories={[...(missionsByCategory ? Object.keys(missionsByCategory) : []), 'Défis']}
              selectedSector={
                missionSearchQuery.trim() ? null : codexTab === 'challenges' ? 'Défis' : selectedSector
              }
              onSelect={(sector) => {
                setMissionSearchQuery('');
                setIsMobileSearchOpen(false);
                if (sector === 'Défis') {
                  setCodexTab('challenges');
                } else {
                  setCodexTab('missions');
                  setSelectedSector(sector);
                }
              }}
            />

            {!isMobile && (
              <>
                <MissionSearchBar
                  value={missionSearchQuery}
                  onChange={(val) => {
                    setMissionSearchQuery(val);
                    if (val && codexTab !== 'missions') {
                      setCodexTab('missions');
                    }
                  }}
                  isMobile={false}
                  resultsCount={searchedMissions.length}
                />

                <button
                  onClick={() => {
                    setSelectedSector(null);
                    setMissionSearchQuery('');
                    setIsMobileSearchOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,100,100,0.5)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    color: '#ff6666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                    flexShrink: 0,
                  }}
                  title="Fermer"
                >
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Corps du popup — height:100% transmet la hauteur au carousel enfant */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            height: '100%',
          }}
        >
          {missionSearchQuery.trim().length > 0 ? (
            <MissionsCarousel3D
              missions={searchedMissions}
              loadingMissionId={loadingMissionId}
              selectedSector={`search_${missionSearchQuery}`}
              isSearchMode={true}
              onClearSearch={() => {
                setMissionSearchQuery('');
                setIsMobileSearchOpen(false);
              }}
              onImpulse={(id) => handleImpulseMission(id)}
              onCancelConfirm={(actionDoneId, label) => setCancelMissionConfirm({ actionDoneId, label })}
              onOpenMissionsWeek={() => setShowMissionsWeekModal(true)}
              onOpenVision2050={handleOpenVision2050}
              isVision2050Unlocked={!!activeEggData?.metaEnigma?.isMetaEnigmaUnlocked}
            />
          ) : codexTab === 'missions' ? (
            <MissionsCarousel3D
              missions={missionsByCategory?.[selectedSector] || []}
              loadingMissionId={loadingMissionId}
              selectedSector={selectedSector}
              onImpulse={(id) => handleImpulseMission(id)}
              onCancelConfirm={(actionDoneId, label) => setCancelMissionConfirm({ actionDoneId, label })}
              onOpenMissionsWeek={() => setShowMissionsWeekModal(true)}
              onOpenVision2050={handleOpenVision2050}
              isVision2050Unlocked={!!activeEggData?.metaEnigma?.isMetaEnigmaUnlocked}
            />
          ) : (
            <ChallengesCarousel3D
              receivedChallenges={receivedChallenges}
              sentChallenges={sentChallenges}
              missions={availableMissionsForChallenge}
              loadingMissionId={loadingMissionId}
              onRespond={handleRespondChallenge}
              onImpulse={(id) => handleImpulseMission(id)}
              onSendChallenge={() => {
                if (childInfos && childInfos.isPeriodOpen === false) {
                  setShowNoPeriodModal(true);
                } else {
                  setShowChallengeModal(true);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
