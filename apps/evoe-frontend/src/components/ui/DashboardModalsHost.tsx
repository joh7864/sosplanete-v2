import React, { lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { GribouilleBirthdayBubble } from '../birthday/GribouilleBirthdayBubble';
import { MissionsWeekModal } from './MissionsWeekModal';
import { EasterEggModalsLayer } from './EasterEggModalsLayer';
import ChatPanel from '../ChatPanel';
import { MobileBottomNav } from './MobileBottomNav';
import { OnboardingGuide } from './OnboardingGuide';
import { ClosedPeriodAlertModal } from './ClosedPeriodAlertModal';
import { AboutModal } from './AboutModal';
import pkg from '../../../package.json';

const AgentProfileModal = lazy(() => import('./AgentProfileModal').then(m => ({ default: m.AgentProfileModal })));
const ChallengeModal = lazy(() => import('./ChallengeModal').then(m => ({ default: m.ChallengeModal })));
const ConfirmCancelModal = lazy(() => import('./ConfirmCancelModal').then(m => ({ default: m.ConfirmCancelModal })));

interface DashboardModalsHostProps {
  // Birthday
  gribouilleBirthdayPlayer: any | null;
  childInfos?: any;
  birthdayBoostsRemaining: number;
  isBirthdayCatchup: boolean;
  isBirthdayLate: boolean;
  birthdayWishes: any[];
  onCloseGribouille: () => void;
  onShareBirthdayWithTeam: () => void;
  onWishTeammateBirthday: (pseudo: string) => void;

  // Challenges
  showChallengeModal: boolean;
  setShowChallengeModal: (show: boolean) => void;
  challengeTargetTeamId: number | '';
  setChallengeTargetTeamId: (id: number | '') => void;
  challengeLocalActionId: number | '';
  setChallengeLocalActionId: (id: number | '') => void;
  challengePledge: string;
  setChallengePledge: (pledge: string) => void;
  challengeDurationHours: number | '';
  setChallengeDurationHours: (hours: number | '') => void;
  challengeError: string | null;
  isSubmittingChallenge: boolean;
  handleSendChallenge: (e: React.FormEvent) => void;
  otherTeams: any[];
  availableMissionsForChallenge: any[];

  // Confirm cancel
  cancelMissionConfirm: { actionDoneId: number; label: string } | null;
  setCancelMissionConfirm: (v: { actionDoneId: number; label: string } | null) => void;
  handleCancelMission: (actionDoneId: number) => void;

  // Missions week
  showMissionsWeekModal: boolean;
  setShowMissionsWeekModal: (show: boolean) => void;
  missions: any[];
  onOpenVision2050: (theme?: any) => void;
  isVision2050Unlocked: boolean;

  // Agent profile
  selectedProfileId: number | null;
  setSelectedProfileId: (id: number | null) => void;
  fetchEvoeData: () => void;
  isStealthMode: boolean;
  toggleStealthMode: () => void;
  handleMetricClick: (metric: 'carbon' | 'water' | 'waste') => void;
  setShowBriefing: (show: boolean) => void;
  setCelebrationEgg: React.Dispatch<React.SetStateAction<any>>;
  setShowEggCelebration: React.Dispatch<React.SetStateAction<boolean>>;

  // Easter Egg Modals Layer
  easterEggFlow: any;
  pseudo?: string | null;
  myTeamId?: number;

  // Chat Panel
  players?: any[];
  teams: any[];
  onlineUsers: Set<string>;
  setOnlineUsers: (users: Set<string>) => void;
  setUnreadChat: (unread: any) => void;
  chatOpen: boolean;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatActiveTab?: string;
  setChatActiveTab: (tab: any) => void;
  prefilledChatText: string | null;
  setPrefilledChatText: (text: string | null) => void;
  scrollToUnreadTrigger: number | null;

  // Mobile Bottom Nav
  era: '2026' | '2070';
  selectedSector: string | null;
  codexTab: 'missions' | 'challenges';
  unreadChat: any;
  setCodexTab: (tab: 'missions' | 'challenges') => void;
  setIsCodexCollapsed: (c: boolean) => void;
  handleSwitchEra: () => void;
  isTransitioning: boolean;
  currentYear: number;
  missionsByCategory?: Record<string, any[]>;
  setSelectedSector: (sector: any) => void;
  view2026: 'codex' | 'leaderboard';
  setView2026: React.Dispatch<React.SetStateAction<'codex' | 'leaderboard'>>;
  setShowExtrapolation: (show: boolean) => void;
  setShowRadar: (show: boolean) => void;

  // Onboarding Guide
  showOnboardingGuide: boolean;
  setShowOnboardingGuide: (show: boolean) => void;
  handleNavigateGuideStep: (step: number) => void;
  currentUserId?: string;

  // Closed period alert
  showNoPeriodModal: boolean;
  setShowNoPeriodModal: (show: boolean) => void;

  // About modal
  showAboutModal: boolean;
  setShowAboutModal: (show: boolean) => void;
}

export const DashboardModalsHost: React.FC<DashboardModalsHostProps> = ({
  gribouilleBirthdayPlayer,
  childInfos,
  birthdayBoostsRemaining,
  isBirthdayCatchup,
  isBirthdayLate,
  birthdayWishes,
  onCloseGribouille,
  onShareBirthdayWithTeam,
  onWishTeammateBirthday,

  showChallengeModal,
  setShowChallengeModal,
  challengeTargetTeamId,
  setChallengeTargetTeamId,
  challengeLocalActionId,
  setChallengeLocalActionId,
  challengePledge,
  setChallengePledge,
  challengeDurationHours,
  setChallengeDurationHours,
  challengeError,
  isSubmittingChallenge,
  handleSendChallenge,
  otherTeams,
  availableMissionsForChallenge,

  cancelMissionConfirm,
  setCancelMissionConfirm,
  handleCancelMission,

  showMissionsWeekModal,
  setShowMissionsWeekModal,
  missions,
  onOpenVision2050,
  isVision2050Unlocked,

  selectedProfileId,
  setSelectedProfileId,
  fetchEvoeData,
  isStealthMode,
  toggleStealthMode,
  handleMetricClick,
  setShowBriefing,
  setCelebrationEgg,
  setShowEggCelebration,

  easterEggFlow,
  pseudo,
  myTeamId,

  players,
  teams,
  onlineUsers,
  setOnlineUsers,
  setUnreadChat,
  chatOpen,
  setChatOpen,
  chatActiveTab,
  setChatActiveTab,
  prefilledChatText,
  setPrefilledChatText,
  scrollToUnreadTrigger,

  era,
  selectedSector,
  codexTab,
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

  showOnboardingGuide,
  setShowOnboardingGuide,
  handleNavigateGuideStep,
  currentUserId,

  showNoPeriodModal,
  setShowNoPeriodModal,

  showAboutModal,
  setShowAboutModal,
}) => {
  return (
    <>
      {/* Mascotte Gribouille - Célébration Anniversaire & Clic Gâteau */}
      <GribouilleBirthdayBubble
        isOpen={!!gribouilleBirthdayPlayer}
        player={gribouilleBirthdayPlayer}
        isMe={
          !!gribouilleBirthdayPlayer &&
          (gribouilleBirthdayPlayer.id === childInfos?.id ||
            gribouilleBirthdayPlayer.childId === childInfos?.id ||
            gribouilleBirthdayPlayer.isCurrent)
        }
        boostsRemaining={birthdayBoostsRemaining}
        isCatchup={isBirthdayCatchup}
        isLate={isBirthdayLate}
        wishes={birthdayWishes}
        onClose={onCloseGribouille}
        onShareWithTeam={onShareBirthdayWithTeam}
        onWishTeammate={onWishTeammateBirthday}
      />

      {/* Modal de Création de Défi PvP */}
      <Suspense fallback={null}>
        {showChallengeModal && (
          <ChallengeModal
            showChallengeModal={showChallengeModal}
            setShowChallengeModal={setShowChallengeModal}
            challengeTargetTeamId={challengeTargetTeamId}
            setChallengeTargetTeamId={setChallengeTargetTeamId}
            challengeLocalActionId={challengeLocalActionId}
            setChallengeLocalActionId={setChallengeLocalActionId}
            challengePledge={challengePledge}
            setChallengePledge={setChallengePledge}
            challengeDurationHours={challengeDurationHours}
            setChallengeDurationHours={setChallengeDurationHours}
            challengeError={challengeError}
            isSubmittingChallenge={isSubmittingChallenge}
            handleSendChallenge={handleSendChallenge}
            otherTeams={otherTeams}
            availableMissionsForChallenge={availableMissionsForChallenge}
          />
        )}
      </Suspense>

      {/* Modal de Confirmation d'Annulation de Mission */}
      <Suspense fallback={null}>
        <ConfirmCancelModal
          cancelMissionConfirm={cancelMissionConfirm}
          setCancelMissionConfirm={setCancelMissionConfirm}
          handleCancelMission={handleCancelMission}
        />
      </Suspense>

      {/* Modal Mes Missions de la Semaine */}
      <MissionsWeekModal
        isOpen={showMissionsWeekModal}
        onClose={() => setShowMissionsWeekModal(false)}
        missions={missions || []}
        childPseudo={childInfos?.pseudo}
        onCancelConfirm={(actionDoneId, label) => setCancelMissionConfirm({ actionDoneId, label })}
        onOpenVision2050={onOpenVision2050}
        isVision2050Unlocked={isVision2050Unlocked}
      />

      {/* Modal du Profil Agent */}
      <AnimatePresence>
        {selectedProfileId !== null && (
          <Suspense fallback={null}>
            <AgentProfileModal
              profileId={selectedProfileId}
              onClose={() => setSelectedProfileId(null)}
              isOwner={selectedProfileId === childInfos?.id}
              refreshData={fetchEvoeData}
              isStealthMode={isStealthMode}
              onToggleStealth={toggleStealthMode}
              onMetricClick={handleMetricClick}
              onOpenBriefing={() => {
                setSelectedProfileId(null);
                setShowBriefing(true);
              }}
              onReplayEasterEgg={(egg) => {
                setSelectedProfileId(null);
                setCelebrationEgg({
                  code: egg.code,
                  triggerType: egg.triggerType,
                  title: egg.title,
                  pointsIT: egg.pointsIT || 60,
                  isTeamRewarded: !!egg.isTeamRewarded,
                  remainingPlayers: egg.remainingPlayers ?? 0,
                });
                setShowEggCelebration(true);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* COUCHE MODALES EASTER EGGS & SALLE D'ARCADE */}
      <EasterEggModalsLayer
        konamiHUD={easterEggFlow.konamiHUD}
        onKonamiButtonPress={easterEggFlow.handleKonamiButtonPress}
        onCloseKonamiHUD={easterEggFlow.handleCloseKonamiHUD}
        activeEggData={easterEggFlow.activeEggData}
        showMascotBubble={easterEggFlow.showMascotBubble}
        setShowMascotBubble={easterEggFlow.setShowMascotBubble}
        exitReplayMode={easterEggFlow.exitReplayMode}
        verifyEasterEggAnswer={easterEggFlow.verifyEasterEggAnswer}
        onVerifyCommand={easterEggFlow.handleVerifyCommand}
        fetchActiveEgg={easterEggFlow.fetchActiveEgg}
        celebrationEgg={easterEggFlow.celebrationEgg}
        setCelebrationEgg={easterEggFlow.setCelebrationEgg}
        showEggCelebration={easterEggFlow.showEggCelebration}
        setShowEggCelebration={easterEggFlow.setShowEggCelebration}
        setChatActiveTab={setChatActiveTab}
        setChatOpen={setChatOpen}
        setPrefilledChatText={setPrefilledChatText}
        pseudo={pseudo}
        childInfos={childInfos}
        arcadeSelectedGameKey={easterEggFlow.arcadeSelectedGameKey}
        setArcadeSelectedGameKey={easterEggFlow.setArcadeSelectedGameKey}
        showArcadeCabinet={easterEggFlow.showArcadeCabinet}
        setShowArcadeCabinet={easterEggFlow.setShowArcadeCabinet}
        myTeamId={myTeamId}
        showChronoEggModal={easterEggFlow.showChronoEggModal}
        setShowChronoEggModal={easterEggFlow.setShowChronoEggModal}
        chronoPeriods={easterEggFlow.chronoPeriods}
        chronoLoading={easterEggFlow.chronoLoading}
        onReplayPeriod={easterEggFlow.handleReplayPeriod}
        showRosettaStoneModal={easterEggFlow.showRosettaStoneModal}
        setShowRosettaStoneModal={easterEggFlow.setShowRosettaStoneModal}
        showTerminalModal={easterEggFlow.showTerminalModal}
        setShowTerminalModal={easterEggFlow.setShowTerminalModal}
        submitMetaEnigmaCode={easterEggFlow.submitMetaEnigmaCode}
        selectedEchoTheme={easterEggFlow.selectedEchoTheme}
        setSelectedEchoTheme={easterEggFlow.setSelectedEchoTheme}
        showTemporalEchoModal={easterEggFlow.showTemporalEchoModal}
        setShowTemporalEchoModal={easterEggFlow.setShowTemporalEchoModal}
        showArcadeHub={easterEggFlow.showArcadeHub}
        setShowArcadeHub={easterEggFlow.setShowArcadeHub}
      />

      {/* Terminal de discussion instantanée (Chat) */}
      <ChatPanel
        players={players}
        teams={teams}
        onlineUsers={onlineUsers}
        onOnlineUsersChange={setOnlineUsers}
        onUnreadChange={setUnreadChat}
        isOpenProp={chatOpen}
        activeTabProp={chatActiveTab}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
        onTabChange={(tab) => setChatActiveTab(tab)}
        isStealthMode={isStealthMode}
        onEasterEggCommand={easterEggFlow.handleCommLinkCommand}
        prefilledText={prefilledChatText}
        onPrefilledTextConsumed={() => setPrefilledChatText(null)}
        scrollToUnreadTrigger={scrollToUnreadTrigger}
      />

      {/* Mobile Bottom Navbar */}
      <MobileBottomNav
        era={era}
        selectedSector={selectedSector}
        codexTab={codexTab}
        selectedProfileId={selectedProfileId}
        setSelectedProfileId={setSelectedProfileId}
        setChatOpen={setChatOpen}
        chatOpen={chatOpen}
        unreadChat={unreadChat}
        setCodexTab={setCodexTab}
        setIsCodexCollapsed={setIsCodexCollapsed}
        handleSwitchEra={handleSwitchEra}
        isTransitioning={isTransitioning}
        currentYear={currentYear}
        missionsByCategory={missionsByCategory}
        setSelectedSector={setSelectedSector}
        view2026={view2026}
        setView2026={setView2026}
        setShowExtrapolation={setShowExtrapolation}
        setShowRadar={setShowRadar}
      />

      {/* Guide d'Onboarding / Visite Guidée Interactive */}
      <OnboardingGuide
        isOpen={showOnboardingGuide}
        onClose={() => setShowOnboardingGuide(false)}
        onNavigateStep={handleNavigateGuideStep}
        teamName={childInfos?.group?.team?.name}
        userId={currentUserId}
      />

      {/* Modal Popup Alerte Période Fermée */}
      <ClosedPeriodAlertModal
        isOpen={showNoPeriodModal}
        onClose={() => setShowNoPeriodModal(false)}
      />

      {/* Badge Interactif de Version App en bas à gauche */}
      <div
        className="app-version-badge"
        onClick={() => setShowAboutModal(true)}
        title="Ouvrir le Journal de Bord & Cartographie des fonctionnalités"
        style={{
          position: 'fixed',
          bottom: '12px',
          left: '16px',
          height: '24px',
          boxSizing: 'border-box',
          zIndex: 100,
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.8px',
          color: era === '2026' ? '#00b3ff' : '#00ffcc',
          background: era === '2026' ? 'rgba(0, 179, 255, 0.12)' : 'rgba(0, 255, 204, 0.12)',
          border: era === '2026' ? '1px solid rgba(0, 179, 255, 0.35)' : '1px solid rgba(0, 255, 204, 0.35)',
          borderRadius: '8px',
          padding: '0 9px',
          backdropFilter: 'blur(8px)',
          fontFamily: 'monospace',
          pointerEvents: 'auto',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: era === '2026' ? '0 0 10px rgba(0, 179, 255, 0.25)' : '0 0 10px rgba(0, 255, 204, 0.25)',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
        }}
      >
        <span>v{pkg.version}</span>
      </div>

      {/* Modale À propos / Journal de Bord */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        version={pkg.version}
        alwaysShowRecent={true}
      />
    </>
  );
};
