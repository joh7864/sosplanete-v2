import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { MissionsCarousel3D } from './MissionsCarousel3D';
import { ChallengesCarousel3D } from './ChallengesCarousel3D';
import { OrbitalSectorRibbon } from './OrbitalSectorRibbon';
import { MissionSearchBar } from './MissionSearchBar';
import { parseBold, formatRemainingTime } from '../../utils/format';

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
              <div
                className="challenges-section"
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
              >
                {loadingChallenges && challenges.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>
                    Mise à jour des défis...
                  </p>
                )}
                {/* Section Défis Reçus */}
                <div>
                  <h3
                    style={{
                      fontSize: '0.85rem',
                      color: '#00ffcc',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      borderBottom: '1px solid rgba(0,255,204,0.1)',
                      paddingBottom: '4px',
                    }}
                  >
                    📥 Reçus
                  </h3>
                  {receivedChallenges.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>
                      Aucun défi reçu.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {receivedChallenges.map((ch) => (
                        <div
                          key={ch.id}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderLeft: `3px solid ${ch.challengerTeamColor || '#fff'}`,
                            borderRadius: '8px',
                            padding: '10px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              color: '#a0aec0',
                              marginBottom: '4px',
                            }}
                          >
                            <span>
                              De : <strong style={{ color: ch.challengerTeamColor }}>{ch.challengerTeamName}</strong>
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                color:
                                  ch.status === 'PENDING'
                                    ? '#ffd700'
                                    : ch.status === 'ACCEPTED'
                                    ? '#00b3ff'
                                    : ch.status === 'SUCCESS'
                                    ? '#10b981'
                                    : '#ff3b3b',
                              }}
                            >
                              {ch.status}
                              {ch.isRetroactive && (
                                <span title="Mission accomplie d'avance !" style={{ marginLeft: '4px' }}>
                                  ✨
                                </span>
                              )}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#fff', margin: '4px 0', fontWeight: 'bold' }}>
                            Mission : {ch.actionLabel}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#ff9f43', margin: '4px 0', fontStyle: 'italic' }}>
                            Gage : {ch.pledge}
                          </p>
                          {ch.expiresAt && (ch.status === 'PENDING' || ch.status === 'ACCEPTED') && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.7rem',
                                color: '#ffd700',
                                marginTop: '2px',
                              }}
                            >
                              <span>⏳</span>
                              <span>
                                Temps restant : <strong>{formatRemainingTime(ch.expiresAt)}</strong>
                              </span>
                            </div>
                          )}
                          {ch.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <button
                                onClick={() => handleRespondChallenge(ch.id, true)}
                                style={{
                                  flex: 1,
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid #10b981',
                                  color: '#10b981',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                }}
                              >
                                Accepter
                              </button>
                              <button
                                onClick={() => handleRespondChallenge(ch.id, false)}
                                style={{
                                  flex: 1,
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid #ef4444',
                                  color: '#ef4444',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                }}
                              >
                                Décliner
                              </button>
                            </div>
                          )}
                          {ch.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleImpulseMission(ch.localActionId)}
                              disabled={loadingMissionId === ch.localActionId}
                              style={{
                                marginTop: '10px',
                                width: '100%',
                                background: 'rgba(0, 255, 204, 0.15)',
                                border: '1px solid #00ffcc',
                                color: '#00ffcc',
                                padding: '6px',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: loadingMissionId === ch.localActionId ? 'wait' : 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.75rem',
                              }}
                            >
                              {loadingMissionId === ch.localActionId ? 'IMPULSION EN COURS...' : '⚡ IMPULSER LA MISSION'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section Défis Envoyés */}
                <div>
                  <h3
                    style={{
                      fontSize: '0.85rem',
                      color: '#00ffcc',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      borderBottom: '1px solid rgba(0,255,204,0.1)',
                      paddingBottom: '4px',
                    }}
                  >
                    📤 Envoyés
                  </h3>
                  {sentChallenges.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>
                      Aucun défi envoyé.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {sentChallenges.map((ch) => (
                        <div
                          key={ch.id}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderLeft: `3px solid ${ch.targetTeamColor || '#fff'}`,
                            borderRadius: '8px',
                            padding: '10px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              color: '#a0aec0',
                              marginBottom: '4px',
                            }}
                          >
                            <span>
                              Cible : <strong style={{ color: ch.targetTeamColor }}>{ch.targetTeamName}</strong>
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                color:
                                  ch.status === 'PENDING'
                                    ? '#ffd700'
                                    : ch.status === 'ACCEPTED'
                                    ? '#00b3ff'
                                    : ch.status === 'SUCCESS'
                                    ? '#10b981'
                                    : '#ff3b3b',
                              }}
                            >
                              {ch.status}
                              {ch.isRetroactive && (
                                <span title="Mission accomplie d'avance !" style={{ marginLeft: '4px' }}>
                                  ✨
                                </span>
                              )}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#fff', margin: '4px 0', fontWeight: 'bold' }}>
                            Mission : {ch.actionLabel}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#ff9f43', margin: '4px 0', fontStyle: 'italic' }}>
                            Gage : {ch.pledge}
                          </p>
                          {ch.expiresAt && (ch.status === 'PENDING' || ch.status === 'ACCEPTED') && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.7rem',
                                color: '#ffd700',
                                marginTop: '2px',
                              }}
                            >
                              <span>⏳</span>
                              <span>
                                Temps restant : <strong>{formatRemainingTime(ch.expiresAt)}</strong>
                              </span>
                            </div>
                          )}
                          {ch.isRetroactive && ch.status === 'SUCCESS' && (
                            <p style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '8px', marginBottom: 0 }}>
                              💡 <em>Mission déjà accomplie d'avance !</em>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bouton de création */}
                {(() => {
                  const myTeamStability =
                    dashboardStatus?.teams?.find((t: any) => t.id === myTeamId)?.crewBioStability ?? 100;
                  const isLocked = myTeamStability < 10;
                  return (
                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={() => {
                          if (childInfos && childInfos.isPeriodOpen === false) {
                            setShowNoPeriodModal(true);
                            return;
                          }
                          if (!isLocked) {
                            setShowChallengeModal(true);
                            setChallengeError(null);
                          }
                        }}
                        disabled={isLocked}
                        style={{
                          width: '100%',
                          background: isLocked
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'linear-gradient(135deg, #00ffcc, #00b3ff)',
                          border: 'none',
                          borderRadius: '6px',
                          color: isLocked ? 'rgba(255,255,255,0.3)' : '#000',
                          padding: '10px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          textTransform: 'uppercase',
                          boxShadow: isLocked ? 'none' : '0 0 10px rgba(0,255,204,0.3)',
                        }}
                      >
                        {isLocked ? '🔒 Stabilité trop basse (<10%)' : '+ Lancer un défi'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Pop-over Holographique pour le mode Collapsed */}
      <AnimatePresence>
        {isCodexCollapsed && expandedMission && (
          <motion.div
            className="mission-popover"
            initial={{ opacity: 0, x: -20, y: '-50%', scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: '-50%', scale: 1 }}
            exit={{ opacity: 0, x: -10, y: '-50%', scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ top: popoverPos }}
          >
            <div className="mission-header">
              {expandedMission.icon && (
                <img src={`${evoeImgUrl}${expandedMission.icon}`} alt="" className="mission-icon" />
              )}
              <h3>{expandedMission.evoeMission?.titreSF || expandedMission.label}</h3>
            </div>
            <p>
              {parseBold(
                expandedMission.evoeMission?.descriptionSF ||
                  expandedMission.description ||
                  'Mission secrète en attente de déchiffrage.'
              )}
            </p>
            <button
              className={`hack-btn ${expandedMission.evoeMission?.isImpulsed ? 'impulsed-btn' : ''}`}
              disabled={loadingMissionId === expandedMission.id}
              onClick={() => {
                if (expandedMission.evoeMission?.isImpulsed) {
                  setCancelMissionConfirm({
                    actionDoneId: expandedMission.evoeMission.actionDoneId,
                    label: expandedMission.evoeMission?.titreSF || expandedMission.label,
                  });
                } else {
                  handleImpulseMissionWithBirthday(expandedMission.id);
                }
              }}
              style={
                expandedMission.evoeMission?.isImpulsed
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
              {loadingMissionId === expandedMission.id ? (
                <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
              ) : expandedMission.evoeMission?.isImpulsed ? (
                'Déjà Impulsé'
              ) : isBirthdayActive && birthdayBoostsRemaining > 0 ? (
                `Impulser (+${(expandedMission.evoeMission?.amplitude || 10) * 2} IT 🎂 x2)`
              ) : (
                `Impulser (+${expandedMission.evoeMission?.amplitude || 10} IT)`
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
