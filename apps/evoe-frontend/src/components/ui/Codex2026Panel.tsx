import React from 'react';
import { X, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { parseBold } from '../../utils/format';
import { CodexModalOverlay } from './codex/CodexModalOverlay';
import { CodexDockedChallengesTab } from './codex/CodexDockedChallengesTab';
import { MissionHoloPopover } from './codex/MissionHoloPopover';

export interface Codex2026PanelProps {
  era: '2026' | '2070';
  selectedSector: string | null;
  setSelectedSector: (sector: string | null) => void;
  codexTab: 'missions' | 'challenges';
  setCodexTab: React.Dispatch<React.SetStateAction<'missions' | 'challenges'>> | ((tab: 'missions' | 'challenges') => void);
  isCodexCollapsed: boolean;
  setIsCodexCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  missionSearchQuery: string;
  setMissionSearchQuery: (q: string) => void;
  isMobileSearchOpen: boolean;
  setIsMobileSearchOpen: (open: boolean) => void;
  searchedMissions: any[];
  missionsByCategory: any;
  missions: any[];
  loadingMissionId: number | null;
  handleImpulseMission: (id: number) => Promise<any> | void;
  handleImpulseMissionWithBirthday: (id: number) => Promise<any> | void;
  setCancelMissionConfirm: (confirm: any) => void;
  setShowMissionsWeekModal: (show: boolean) => void;
  handleOpenVision2050: (themeId?: any) => void;
  activeEggData: any;
  receivedChallenges: any[];
  sentChallenges: any[];
  challenges: any[];
  availableMissionsForChallenge: any[];
  loadingChallenges: boolean;
  handleRespondChallenge: (id: number, accept: boolean) => Promise<any> | void;
  childInfos: any;
  setShowNoPeriodModal: (show: boolean) => void;
  setShowChallengeModal: (show: boolean) => void;
  setChallengeError: (err: any) => void;
  isBirthdayActive: boolean;
  birthdayBoostsRemaining: number;
  dashboardStatus: any;
  myTeamId: number | null;
  activeChallengeActionIds: number[];
  expandedMission: any;
  setExpandedMission: (m: any) => void;
  popoverPos: number;
  setPopoverPos: (pos: number) => void;
  handleCodexConsoleClick: () => void;
  evoeImgUrl: string;
}

export const Codex2026Panel: React.FC<Codex2026PanelProps> = ({
  era,
  selectedSector,
  setSelectedSector,
  codexTab,
  setCodexTab,
  isCodexCollapsed,
  setIsCodexCollapsed,
  isMobile,
  missionSearchQuery,
  setMissionSearchQuery,
  isMobileSearchOpen,
  setIsMobileSearchOpen,
  searchedMissions,
  missionsByCategory,
  missions,
  loadingMissionId,
  handleImpulseMission,
  handleImpulseMissionWithBirthday,
  setCancelMissionConfirm,
  setShowMissionsWeekModal,
  handleOpenVision2050,
  activeEggData,
  receivedChallenges,
  sentChallenges,
  challenges,
  availableMissionsForChallenge,
  loadingChallenges,
  handleRespondChallenge,
  childInfos,
  setShowNoPeriodModal,
  setShowChallengeModal,
  setChallengeError,
  isBirthdayActive,
  birthdayBoostsRemaining,
  dashboardStatus,
  myTeamId,
  activeChallengeActionIds,
  expandedMission,
  setExpandedMission,
  popoverPos,
  setPopoverPos,
  handleCodexConsoleClick,
  evoeImgUrl,
}) => {
  return (
    <>
      {/* CONTENU 2026 : Le Codex Temporel (Modal Plein Écran ou Panneau Coulissant) */}
      {era === '2026' && selectedSector && (codexTab === 'missions' || codexTab === 'challenges') && !isCodexCollapsed ? (
        <CodexModalOverlay
          isMobile={isMobile}
          missionSearchQuery={missionSearchQuery}
          setMissionSearchQuery={setMissionSearchQuery}
          codexTab={codexTab}
          setCodexTab={setCodexTab}
          isMobileSearchOpen={isMobileSearchOpen}
          setIsMobileSearchOpen={setIsMobileSearchOpen}
          searchedMissions={searchedMissions}
          setSelectedSector={setSelectedSector}
          missionsByCategory={missionsByCategory}
          selectedSector={selectedSector}
          loadingMissionId={loadingMissionId}
          handleImpulseMission={handleImpulseMission}
          setCancelMissionConfirm={setCancelMissionConfirm}
          setShowMissionsWeekModal={setShowMissionsWeekModal}
          handleOpenVision2050={handleOpenVision2050}
          activeEggData={activeEggData}
          receivedChallenges={receivedChallenges}
          sentChallenges={sentChallenges}
          availableMissionsForChallenge={availableMissionsForChallenge}
          handleRespondChallenge={handleRespondChallenge}
          childInfos={childInfos}
          setShowNoPeriodModal={setShowNoPeriodModal}
          setShowChallengeModal={setShowChallengeModal}
        />
      ) : era === '2026' && selectedSector && (
        <aside
          className={`codex-panel ${isCodexCollapsed ? 'collapsed' : ''}`}
          onScroll={() => setExpandedMission(null)}
        >
          <div
            className="codex-header"
            onClick={handleCodexConsoleClick}
            title="Console Centrale du Codex"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: isCodexCollapsed ? 'column' : 'row',
              gap: '8px',
              padding: '10px 15px',
              cursor: 'pointer',
            }}
          >
            {!isCodexCollapsed && (
              <h2 style={{ margin: 0 }}>
                Codex Temporel {childInfos?.pseudo ? `- ${childInfos.pseudo}` : ''}
              </h2>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: isCodexCollapsed ? 'column' : 'row',
                alignItems: 'center',
                gap: '8px',
                marginLeft: isCodexCollapsed ? 'auto' : '0',
                marginRight: isCodexCollapsed ? 'auto' : '0',
              }}
            >
              <button
                className="collapse-btn"
                onClick={() => {
                  setIsCodexCollapsed(!isCodexCollapsed);
                  setExpandedMission(null);
                }}
                title={isCodexCollapsed ? 'Agrandir le Codex' : 'Réduire le Codex'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#00ffcc',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isCodexCollapsed ? <ChevronRight /> : <ChevronLeft />}
              </button>
              <button
                className="collapse-btn"
                onClick={() => setSelectedSector(null)}
                title="Fermer le Codex"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ff3b3b',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Sélecteur d'Onglets */}
          {!isCodexCollapsed && (
            <div
              className="codex-tabs"
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '15px',
                borderBottom: '1px solid rgba(0, 255, 204, 0.15)',
                paddingBottom: '10px',
              }}
            >
              <button
                onClick={() => setCodexTab('missions')}
                style={{
                  flex: 1,
                  background: codexTab === 'missions' ? 'rgba(0, 255, 204, 0.15)' : 'transparent',
                  border: '1px solid rgba(0, 255, 204, 0.3)',
                  borderRadius: '6px',
                  color: '#00ffcc',
                  padding: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >
                Missions
              </button>
              <button
                onClick={() => setCodexTab('challenges')}
                style={{
                  flex: 1,
                  background: codexTab === 'challenges' ? 'rgba(0, 255, 204, 0.15)' : 'transparent',
                  border: '1px solid rgba(0, 255, 204, 0.3)',
                  borderRadius: '6px',
                  color: '#00ffcc',
                  padding: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >
                Défis ({challenges.length})
              </button>
            </div>
          )}

          <div className="mission-list">
            {isCodexCollapsed || codexTab === 'missions' ? (
              <>
                {activeChallengeActionIds.length > 0 && (
                  <div className="category-section" style={{ marginBottom: '20px' }}>
                    {!isCodexCollapsed && (
                      <div
                        className="category-title"
                        style={{
                          color: '#ff3b3b',
                          borderColor: '#ff3b3b',
                          textShadow: '0 0 10px rgba(255,59,59,0.3)',
                        }}
                      >
                        ⚔️ DÉFIS PRIORITAIRES
                      </div>
                    )}
                    {missions
                      ?.filter((m: any) => activeChallengeActionIds.includes(m.id))
                      .map((missionWithChallenge: any) => (
                        <div
                          key={`challenge-${missionWithChallenge.id}`}
                          className="mission-card"
                          onClick={(e) => {
                            if (isCodexCollapsed) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopoverPos(rect.top + rect.height / 2);
                              setExpandedMission(missionWithChallenge);
                            }
                          }}
                          style={{
                            cursor: isCodexCollapsed ? 'pointer' : 'default',
                            border: '1px solid #ff3b3b',
                            background: 'rgba(255, 59, 59, 0.05)',
                          }}
                        >
                          <div
                            className="mission-header"
                            title={
                              isCodexCollapsed
                                ? ''
                                : missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label
                            }
                          >
                            {missionWithChallenge.icon && (
                              <img
                                src={`${evoeImgUrl}${missionWithChallenge.icon}`}
                                alt=""
                                className="mission-icon"
                              />
                            )}
                            {!isCodexCollapsed && (
                              <h3
                                title={
                                  missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label
                                }
                              >
                                {missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label}
                              </h3>
                            )}
                          </div>
                          {!isCodexCollapsed && (
                            <>
                              <p
                                title={
                                  missionWithChallenge.evoeMission?.descriptionSF ||
                                  missionWithChallenge.description ||
                                  ''
                                }
                              >
                                {parseBold(
                                  missionWithChallenge.evoeMission?.descriptionSF ||
                                    missionWithChallenge.description ||
                                    'Mission secrète en attente de déchiffrage.'
                                )}
                              </p>
                              <button
                                id="btn-impulser-mission"
                                className={`hack-btn ${
                                  missionWithChallenge.evoeMission?.isImpulsed ? 'impulsed-btn' : ''
                                }`}
                                disabled={loadingMissionId === missionWithChallenge.id}
                                onClick={() => {
                                  if (missionWithChallenge.evoeMission?.isImpulsed) {
                                    setCancelMissionConfirm({
                                      actionDoneId: missionWithChallenge.evoeMission.actionDoneId,
                                      label:
                                        missionWithChallenge.evoeMission?.titreSF ||
                                        missionWithChallenge.label,
                                    });
                                  } else {
                                    handleImpulseMissionWithBirthday(missionWithChallenge.id);
                                  }
                                }}
                                style={
                                  missionWithChallenge.evoeMission?.isImpulsed
                                    ? {
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        borderColor: '#10b981',
                                        color: '#10b981',
                                      }
                                    : isBirthdayActive && birthdayBoostsRemaining > 0
                                    ? {
                                        borderColor: '#ffd700',
                                        color: '#ffd700',
                                        boxShadow: '0 0 12px rgba(255, 215, 0, 0.35)',
                                      }
                                    : {}
                                }
                              >
                                {loadingMissionId === missionWithChallenge.id ? (
                                  <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                                ) : missionWithChallenge.evoeMission?.isImpulsed ? (
                                  'Déjà Impulsé'
                                ) : isBirthdayActive && birthdayBoostsRemaining > 0 ? (
                                  `Impulser (+${(missionWithChallenge.evoeMission?.amplitude || 10) * 2} IT 🎂 x2)`
                                ) : (
                                  `Impulser (+${missionWithChallenge.evoeMission?.amplitude || 10} IT)`
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {missionsByCategory && missionsByCategory[selectedSector] ? (
                  <div key={selectedSector} className="category-section">
                    <div className="category-title">{selectedSector}</div>

                    {missionsByCategory[selectedSector].map((mission: any, idx: number) => (
                      <div
                        key={mission.id}
                        className="mission-card"
                        onClick={(e) => {
                          if (isCodexCollapsed) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopoverPos(rect.top + rect.height / 2);
                            setExpandedMission(mission);
                          }
                        }}
                        style={{ cursor: isCodexCollapsed ? 'pointer' : 'default' }}
                      >
                        <div
                          className="mission-header"
                          title={isCodexCollapsed ? '' : mission.evoeMission?.titreSF || mission.label}
                        >
                          {mission.icon && (
                            <img src={`${evoeImgUrl}${mission.icon}`} alt="" className="mission-icon" />
                          )}
                          {!isCodexCollapsed && (
                            <h3 title={mission.evoeMission?.titreSF || mission.label}>
                              {mission.evoeMission?.titreSF || mission.label}
                            </h3>
                          )}
                          {mission.isChallengeActif && !isCodexCollapsed && (
                            <span
                              style={{
                                marginLeft: 'auto',
                                background: '#ff3b3b',
                                color: '#fff',
                                fontSize: '0.65rem',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ⚔️ DÉFI EN COURS
                            </span>
                          )}
                        </div>
                        {!isCodexCollapsed && (
                          <>
                            <p
                              title={
                                mission.evoeMission?.descriptionSF || mission.description || ''
                              }
                            >
                              {parseBold(
                                mission.evoeMission?.descriptionSF ||
                                  mission.description ||
                                  'Mission secrète en attente de déchiffrage.'
                              )}
                            </p>
                            <button
                              id={idx === 0 ? 'btn-impulser-mission' : undefined}
                              className={`hack-btn ${mission.evoeMission?.isImpulsed ? 'impulsed-btn' : ''}`}
                              disabled={loadingMissionId === mission.id}
                              onClick={() => {
                                if (mission.evoeMission?.isImpulsed) {
                                  setCancelMissionConfirm({
                                    actionDoneId: mission.evoeMission.actionDoneId,
                                    label: mission.evoeMission?.titreSF || mission.label,
                                  });
                                } else {
                                  handleImpulseMissionWithBirthday(mission.id);
                                }
                              }}
                              style={
                                mission.evoeMission?.isImpulsed
                                  ? {
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      borderColor: '#10b981',
                                      color: '#10b981',
                                    }
                                  : isBirthdayActive && birthdayBoostsRemaining > 0
                                  ? {
                                      borderColor: '#ffd700',
                                      color: '#ffd700',
                                      boxShadow: '0 0 12px rgba(255, 215, 0, 0.35)',
                                    }
                                  : {}
                              }
                            >
                              {loadingMissionId === mission.id ? (
                                <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                              ) : mission.evoeMission?.isImpulsed ? (
                                'Déjà Impulsé'
                              ) : isBirthdayActive && birthdayBoostsRemaining > 0 ? (
                                `Impulser (+${(mission.evoeMission?.amplitude || 10) * 2} IT 🎂 x2)`
                              ) : (
                                `Impulser (+${mission.evoeMission?.amplitude || 10} IT)`
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      color: '#a0aec0',
                      fontStyle: 'italic',
                      padding: '10px',
                      textAlign: 'center',
                    }}
                  >
                    Aucune mission détectée dans ce secteur.
                  </p>
                )}
              </>
            ) : (
              /* Contenu de l'onglet Défis */
              <CodexDockedChallengesTab
                loadingChallenges={loadingChallenges}
                challenges={challenges}
                receivedChallenges={receivedChallenges}
                handleRespondChallenge={handleRespondChallenge}
                loadingMissionId={loadingMissionId}
                handleImpulseMission={handleImpulseMission}
                sentChallenges={sentChallenges}
                dashboardStatus={dashboardStatus}
                myTeamId={myTeamId}
                childInfos={childInfos}
                setShowNoPeriodModal={setShowNoPeriodModal}
                setShowChallengeModal={setShowChallengeModal}
                setChallengeError={setChallengeError}
              />
            )}
          </div>
        </aside>
      )}

      {/* Pop-over Holographique pour le mode Collapsed */}
      <MissionHoloPopover
        isCodexCollapsed={isCodexCollapsed}
        expandedMission={expandedMission}
        popoverPos={popoverPos}
        evoeImgUrl={evoeImgUrl}
        loadingMissionId={loadingMissionId}
        setCancelMissionConfirm={setCancelMissionConfirm}
        handleImpulseMissionWithBirthday={handleImpulseMissionWithBirthday}
        isBirthdayActive={isBirthdayActive}
        birthdayBoostsRemaining={birthdayBoostsRemaining}
      />
    </>
  );
};
