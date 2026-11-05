import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardCanvas } from './components/ui/DashboardCanvas';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import TemporalBriefing from './components/TemporalBriefing';
import { Codex2026Panel } from './components/ui/Codex2026Panel';
import { TopHud } from './components/ui/TopHud';
import { Dashboard2070Overlays } from './components/ui/Dashboard2070Overlays';
import { DashboardModalsHost } from './components/ui/DashboardModalsHost';
import { PortraitOrientationOverlay } from './components/ui/PortraitOrientationOverlay';
import { Dashboard2026Loader } from './components/ui/Dashboard2026Loader';
import pkg from '../package.json';

// Hooks & UI Components
import { useEvoeData } from './hooks/useEvoeData';
import { useEasterEggFlow } from './hooks/useEasterEggFlow';
import { useGuideNavigation } from './hooks/useGuideNavigation';
import { usePlayerInteractions } from './hooks/usePlayerInteractions';
import { useBirthdayCelebration } from './hooks/useBirthdayCelebration';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { useEarthOracle } from './hooks/useEarthOracle';
import { useDashboardLifecycle } from './hooks/useDashboardLifecycle';

import './App.css';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

function MainApp() {
  const {
    era, handleSwitchEra: baseHandleSwitchEra, isTransitioning,
    selectedSector, setSelectedSector, isCodexCollapsed, setIsCodexCollapsed,
    expandedMission, setExpandedMission, popoverPos, setPopoverPos,
    showBriefing, setShowBriefing, extrapolation, dashboardStatus,
    showExtrapolation, setShowExtrapolation, showRadar, setShowRadar, isResettingPropulsion,
    earthOracleLevel, setEarthOracleLevel, earthOracleText, setEarthOracleText, earthOracleTyping, setEarthOracleTyping,
    codexTab, setCodexTab, challenges, loadingChallenges, isGlitching, loadingMissionId,
    showChallengeModal, setShowChallengeModal,
    challengeTargetTeamId, setChallengeTargetTeamId,
    challengeLocalActionId, setChallengeLocalActionId,
    challengePledge, setChallengePledge,
    challengeDurationHours, setChallengeDurationHours,
    challengeError, setChallengeError, isSubmittingChallenge,
    cancelMissionConfirm, setCancelMissionConfirm, showNoPeriodModal, setShowNoPeriodModal,
    selectedProfileId, setSelectedProfileId, allowPortrait, setAllowPortrait,
    isStealthMode, toggleStealthMode, isUnbridledDpr, toggleUnbridledDpr,
    onlineUsers, setOnlineUsers, unreadChat, setUnreadChat,
    chatOpen, setChatOpen, chatActiveTab, setChatActiveTab,
    isEvoeDataLoading, fetchEvoeData, fetchChallenges,
    handleImpulseMission, handleCancelMission,
    handleSendChallenge, handleRespondChallenge,
    handleResetPropulsion, handleCompleteBriefing,
  } = useEvoeData();

  const [scrollToUnreadTrigger, setScrollToUnreadTrigger] = useState<number | null>(null);
  const [searchCloseTrigger, setSearchCloseTrigger] = useState<number | null>(null);

  const [loader2026Dismissed, setLoader2026Dismissed] = useState(
    () => sessionStorage.getItem('evoe_loader2026_dismissed') === 'true',
  );

  const dismissLoader = () => {
    sessionStorage.setItem('evoe_loader2026_dismissed', 'true');
    setLoader2026Dismissed(true);
  };

  const [view2026, setView2026] = useState<'codex' | 'leaderboard'>('codex');
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'all' | 'period'>('all');
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showMissionsWeekModal, setShowMissionsWeekModal] = useState(false);
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [selectedRadarTeamId, setSelectedRadarTeamId] = useState<number | string | null>(null);
  const [searchedPlayerId, setSearchedPlayerId] = useState<number | string | null>(null);

  // Orientation & Mobile
  const { isPhysicalPortrait, isMobile } = useDeviceOrientation();

  // Flux Easter Egg & Salle d'arcade
  const easterEggFlow = useEasterEggFlow({ setChatActiveTab, setChatOpen });

  const handleSwitchEra = () => {
    easterEggFlow.handleEraSwitch();
    baseHandleSwitchEra();
  };

  const handleVesselClick = (teamId: number | string) => {
    if (teamId === null || teamId === undefined) return;
    setShowRadar(true);
    setSelectedRadarTeamId((prev) => (prev !== null && prev !== undefined && String(prev) === String(teamId) ? null : teamId));
  };

  const { user, childInfos, pseudo, missions, logoutUser, instanceChoices, players, instanceId } = useAuth();
  const currentUserId = String(childInfos?.id || childInfos?.childId || pseudo || user || 'default_agent');
  const currentPlayer = players?.find((p) => p.id === childInfos?.id || p.childId === childInfos?.id);
  const myTeamId = currentPlayer?.teamId || childInfos?.group?.teamId;

  const currentYear = useMemo(() => {
    const sy = childInfos?.schoolYear || childInfos?.group?.team?.instanceYear?.schoolYear || dashboardStatus?.schoolYear;
    if (sy && typeof sy === 'string') {
      const parts = sy.split('-');
      if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        return Number(parts[1]);
      }
    }
    return new Date().getFullYear();
  }, [childInfos, dashboardStatus]);

  const isDashboard2026Ready = Boolean(
    !isEvoeDataLoading && dashboardStatus && childInfos && missions && missions.length > 0,
  );

  const impulsedMissionsCount = useMemo(() => {
    return missions?.filter((m: any) => m.evoeMission?.isImpulsed)?.length || 0;
  }, [missions]);

  const shouldRedirect = !user || instanceChoices;
  const hasSeenOnboarding: boolean = (childInfos as any)?.hasSeenOnboarding === true;

  // Lancement automatique du guide d'onboarding
  useEffect(() => {
    if (!currentUserId || shouldRedirect || hasSeenOnboarding) return;
    const userKey = `evoe_has_seen_onboarding_v2_${currentUserId}`;
    const hasSeen = localStorage.getItem(userKey);
    if (!hasSeen) {
      const timer = setTimeout(() => setShowOnboardingGuide(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [currentUserId, shouldRedirect, hasSeenOnboarding]);

  // Hook Cycle de vie (Polling, Sync Arcade, Clic extérieur, Radar Scroll)
  useDashboardLifecycle({
    era, instanceId, user,
    isArcadeOpen: Boolean(easterEggFlow.showArcadeCabinet || easterEggFlow.showArcadeHub),
    fetchEvoeData, fetchChallenges, setUnlockedArcadeGames: easterEggFlow.setUnlockedArcadeGames,
    selectedRadarTeamId, showRadar, expandedMission, setExpandedMission,
  });

  // Hook Oracle Terrestre
  const { handleEarthClick } = useEarthOracle({
    currentYear, setEarthOracleLevel, setEarthOracleText, setEarthOracleTyping,
  });

  // Système d'anniversaire
  const {
    isBirthdayActive, isBirthdayCatchup, isBirthdayLate, birthdayBoostsRemaining,
    birthdayWishes, gribouilleBirthdayPlayer, setGribouilleBirthdayPlayer,
    handleCloseGribouille, handleShareBirthdayWithTeam, handleWishTeammateBirthday,
    handleImpulseMissionWithBirthday, enrichedPlayers,
  } = useBirthdayCelebration({
    childInfos, currentPlayer, players, loader2026Dismissed,
    setPrefilledChatText: easterEggFlow.setPrefilledChatText,
    setChatActiveTab, setChatOpen, handleImpulseMission,
  });

  const activeChallengeActionIds = challenges
    .filter((c) => c.status === 'ACCEPTED' && c.targetTeamId === myTeamId)
    .map((c) => c.localActionId);

  const missionsByCategory = missions?.reduce((acc: Record<string, any[]>, mission: any) => {
    if (activeChallengeActionIds.includes(mission.id)) return acc;
    const cat = mission.categorySF || 'Inconnu';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mission);
    return acc;
  }, {});

  const {
    getAvatarUrl, eodN1Percent, eodNPercent, handleSelectPlayer, handleSelectEnvelope,
    handleSearchMatchChange, searchedMissions,
  } = usePlayerInteractions({
    currentPlayer, childInfos, evoeImgUrl: EVOE_IMG_URL, extrapolation, unreadChat,
    setChatActiveTab, setChatOpen, setScrollToUnreadTrigger, setSelectedProfileId,
    searchedPlayerId, setSearchedPlayerId, setSearchCloseTrigger, missions, missionSearchQuery,
  });

  const { handleSelectSector, handleNavigateGuideStep } = useGuideNavigation({
    era, handleSwitchEra, setView2026, setSelectedSector, setIsCodexCollapsed,
    setShowExtrapolation, setShowRadar, setChatOpen, setCodexTab, setSelectedProfileId,
    missionsByCategory, childInfos, setShowNoPeriodModal, setMissionSearchQuery, setIsMobileSearchOpen,
  });

  const receivedChallenges = challenges.filter((c) => c.targetTeamId === myTeamId);
  const sentChallenges = challenges.filter((c) => c.challengerTeamId === myTeamId);
  const otherTeams = dashboardStatus?.teams?.filter((t: any) => t.id !== myTeamId) || [];
  const myTeam = dashboardStatus?.teams?.find((t: any) => t.id === myTeamId) || childInfos?.group?.team;
  const whatsappInviteUrl =
    childInfos?.group?.team?.whatsappInviteUrl ||
    myTeam?.whatsappInviteUrl ||
    childInfos?.whatsappInviteUrl ||
    childInfos?.whatsappCommunityUrl ||
    dashboardStatus?.whatsappCommunityUrl;

  const dpr = useMemo<[number, number]>(() => {
    const maxDpr = isUnbridledDpr ? 2 : 1.25;
    const winDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    return [1, Math.min(winDpr, maxDpr)];
  }, [isUnbridledDpr]);

  const isHeavyModalOpen = Boolean(
    selectedProfileId || showOnboardingGuide || showAboutModal || showMissionsWeekModal ||
    showChallengeModal || easterEggFlow.showChronoEggModal || easterEggFlow.showRosettaStoneModal ||
    easterEggFlow.showTerminalModal || easterEggFlow.showTemporalEchoModal ||
    easterEggFlow.showArcadeHub || easterEggFlow.showArcadeCabinet || showNoPeriodModal ||
    cancelMissionConfirm || easterEggFlow.showEggCelebration ||
    (selectedSector && (codexTab === 'missions' || codexTab === 'challenges') && !isCodexCollapsed),
  );

  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      {/* Overlay Portrait */}
      <PortraitOrientationOverlay
        show={!allowPortrait && isPhysicalPortrait}
        onAllowPortrait={() => {
          setAllowPortrait(true);
          localStorage.setItem('evoe_allow_portrait', 'true');
        }}
      />

      {showBriefing && childInfos?.youtubeBriefingUrl && (
        <TemporalBriefing
          onComplete={(skipNextTime) => handleCompleteBriefing(!!skipNextTime)}
          youtubeUrl={childInfos.youtubeBriefingUrl}
          childId={childInfos.id}
        />
      )}

      {isGlitching && <div className="screen-glitch" />}

      {/* Écran de Chargement 2026 */}
      <AnimatePresence>
        {era === '2026' && !loader2026Dismissed && (
          <Dashboard2026Loader
            isReady={isDashboard2026Ready}
            currentYear={currentYear}
            maxDurationMs={4000}
            onComplete={dismissLoader}
          />
        )}
      </AnimatePresence>

      {/* Three.js Canvas Container & Portails Temporels 2026/2070 */}
      <DashboardCanvas
        era={era}
        dpr={dpr}
        isHeavyModalOpen={isHeavyModalOpen}
        searchedPlayerId={searchedPlayerId}
        missionsByCategory={missionsByCategory}
        handleSelectSector={handleSelectSector}
        handleSelectPlayer={handleSelectPlayer}
        handleGlobeClick={easterEggFlow.handleGlobeClick}
        handleCodexConsoleClick={easterEggFlow.handleCodexConsoleClick}
        handleStarClick={easterEggFlow.handleStarClick}
        childInfos={childInfos}
        setShowNoPeriodModal={setShowNoPeriodModal}
        setSelectedProfileId={setSelectedProfileId}
        setChatOpen={setChatOpen}
        setCodexTab={setCodexTab}
        setIsCodexCollapsed={setIsCodexCollapsed}
        handleSwitchEra={handleSwitchEra}
        selectedSector={selectedSector}
        setSelectedSector={setSelectedSector}
        onlineUsers={onlineUsers}
        unreadChat={unreadChat}
        handleSelectEnvelope={handleSelectEnvelope}
        isMobile={isMobile}
        view2026={view2026}
        leaderboardTimeframe={leaderboardTimeframe}
        dashboardStatus={dashboardStatus}
        challenges={challenges}
        impulsedMissionsCount={impulsedMissionsCount}
        isStealthMode={isStealthMode}
        toggleStealthMode={toggleStealthMode}
        enrichedPlayers={enrichedPlayers}
        handleSelectBirthdayCake={(p) => setGribouilleBirthdayPlayer(p)}
        setShowMissionsWeekModal={setShowMissionsWeekModal}
        setView2026={setView2026}
        selectedRadarTeamId={selectedRadarTeamId}
        handleEarthClick={handleEarthClick}
        handleVesselClick={handleVesselClick}
        earthOracleLevel={earthOracleLevel}
        setEarthOracleLevel={setEarthOracleLevel}
        earthOracleText={earthOracleText}
        earthOracleTyping={earthOracleTyping}
      />

      {/* Transition Effect */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="transition-overlay"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 35, opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* UI Overlay HTML */}
      <div className="ui-overlay">
        <TopHud
          childInfos={childInfos}
          setSelectedProfileId={setSelectedProfileId}
          getAvatarUrl={getAvatarUrl}
          currentPlayer={currentPlayer}
          unreadChat={unreadChat}
          handleLogoMouseDown={easterEggFlow.handleLogoMouseDown}
          handleLogoMouseUpOrLeave={easterEggFlow.handleLogoMouseUpOrLeave}
          era={era}
          activeEggData={easterEggFlow.activeEggData}
          hasUnreadEasterEgg={easterEggFlow.hasUnreadEasterEgg}
          hasSeenEnigma={easterEggFlow.hasSeenEnigma}
          markEnigmaAsSeen={easterEggFlow.markEnigmaAsSeen}
          setShowMascotBubble={easterEggFlow.setShowMascotBubble}
          interactWithEgg={easterEggFlow.interactWithEgg}
          fetchActiveEgg={easterEggFlow.fetchActiveEgg}
          handleOpenChronoEgg={easterEggFlow.handleOpenChronoEgg}
          isBirthdayActive={isBirthdayActive}
          view2026={view2026}
          isPhysicalPortrait={isPhysicalPortrait}
          leaderboardTimeframe={leaderboardTimeframe}
          setLeaderboardTimeframe={setLeaderboardTimeframe}
          dashboardStatus={dashboardStatus}
          players={players}
          setSearchedPlayerId={setSearchedPlayerId}
          handleSearchMatchChange={handleSearchMatchChange}
          searchCloseTrigger={searchCloseTrigger}
          isMobile={isMobile}
          handleSwitchEra={handleSwitchEra}
          isTransitioning={isTransitioning}
          currentYear={currentYear}
          setChatOpen={setChatOpen}
          setShowExtrapolation={setShowExtrapolation}
          setShowRadar={setShowRadar}
          setView2026={setView2026}
          whatsappInviteUrl={whatsappInviteUrl}
          setShowOnboardingGuide={setShowOnboardingGuide}
          setShowAboutModal={setShowAboutModal}
          logoutUser={logoutUser}
          pkgVersion={pkg.version}
          isUnbridledDpr={isUnbridledDpr}
          toggleUnbridledDpr={toggleUnbridledDpr}
          unlockedArcadeGames={easterEggFlow.unlockedArcadeGames}
          setShowArcadeHub={easterEggFlow.setShowArcadeHub}
        />

        {/* CONTENU 2026 : Le Codex Temporel */}
        <Codex2026Panel
          era={era}
          selectedSector={selectedSector}
          setSelectedSector={setSelectedSector}
          codexTab={codexTab}
          setCodexTab={setCodexTab}
          isCodexCollapsed={isCodexCollapsed}
          setIsCodexCollapsed={setIsCodexCollapsed}
          isMobile={isMobile}
          missionSearchQuery={missionSearchQuery}
          setMissionSearchQuery={setMissionSearchQuery}
          isMobileSearchOpen={isMobileSearchOpen}
          setIsMobileSearchOpen={setIsMobileSearchOpen}
          searchedMissions={searchedMissions}
          missionsByCategory={missionsByCategory}
          missions={missions}
          loadingMissionId={loadingMissionId}
          handleImpulseMission={handleImpulseMission}
          handleImpulseMissionWithBirthday={handleImpulseMissionWithBirthday}
          setCancelMissionConfirm={setCancelMissionConfirm}
          setShowMissionsWeekModal={setShowMissionsWeekModal}
          handleOpenVision2050={easterEggFlow.handleOpenVision2050}
          activeEggData={easterEggFlow.activeEggData}
          receivedChallenges={receivedChallenges}
          sentChallenges={sentChallenges}
          challenges={challenges}
          availableMissionsForChallenge={missions || []}
          loadingChallenges={loadingChallenges}
          handleRespondChallenge={handleRespondChallenge}
          childInfos={childInfos}
          setShowNoPeriodModal={setShowNoPeriodModal}
          setShowChallengeModal={setShowChallengeModal}
          setChallengeError={setChallengeError}
          isBirthdayActive={isBirthdayActive}
          birthdayBoostsRemaining={birthdayBoostsRemaining}
          dashboardStatus={dashboardStatus}
          myTeamId={myTeamId}
          activeChallengeActionIds={activeChallengeActionIds}
          expandedMission={expandedMission}
          setExpandedMission={setExpandedMission}
          popoverPos={popoverPos}
          setPopoverPos={setPopoverPos}
          handleCodexConsoleClick={easterEggFlow.handleCodexConsoleClick}
          evoeImgUrl={EVOE_IMG_URL}
        />

        {/* CONTENU 2070 : Double Tableau de Bord Flottant */}
        <Dashboard2070Overlays
          era={era}
          extrapolation={extrapolation}
          showExtrapolation={showExtrapolation}
          setShowExtrapolation={setShowExtrapolation}
          showRadar={showRadar}
          setShowRadar={setShowRadar}
          eodN1Percent={eodN1Percent}
          eodNPercent={eodNPercent}
          currentYear={currentYear}
          handleResetPropulsion={handleResetPropulsion}
          isResettingPropulsion={isResettingPropulsion}
          dashboardStatus={dashboardStatus}
          selectedRadarTeamId={selectedRadarTeamId}
          setSelectedRadarTeamId={setSelectedRadarTeamId}
          isMobile={isMobile}
          selectedSector={selectedSector}
          chatOpen={chatOpen}
          selectedProfileId={selectedProfileId}
          evoeImgUrl={EVOE_IMG_URL}
        />
      </div>

      {/* Hôte regroupant toutes les Modales & Overlays secondaires */}
      <DashboardModalsHost
        gribouilleBirthdayPlayer={gribouilleBirthdayPlayer}
        childInfos={childInfos}
        birthdayBoostsRemaining={birthdayBoostsRemaining}
        isBirthdayCatchup={isBirthdayCatchup}
        isBirthdayLate={isBirthdayLate}
        birthdayWishes={birthdayWishes}
        onCloseGribouille={handleCloseGribouille}
        onShareBirthdayWithTeam={handleShareBirthdayWithTeam}
        onWishTeammateBirthday={handleWishTeammateBirthday}
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
        availableMissionsForChallenge={missions || []}
        cancelMissionConfirm={cancelMissionConfirm}
        setCancelMissionConfirm={setCancelMissionConfirm}
        handleCancelMission={handleCancelMission}
        showMissionsWeekModal={showMissionsWeekModal}
        setShowMissionsWeekModal={setShowMissionsWeekModal}
        missions={missions || []}
        onOpenVision2050={easterEggFlow.handleOpenVision2050}
        isVision2050Unlocked={!!easterEggFlow.activeEggData?.metaEnigma?.isMetaEnigmaUnlocked}
        selectedProfileId={selectedProfileId}
        setSelectedProfileId={setSelectedProfileId}
        fetchEvoeData={fetchEvoeData}
        isStealthMode={isStealthMode}
        toggleStealthMode={toggleStealthMode}
        handleMetricClick={easterEggFlow.handleMetricClick}
        setShowBriefing={setShowBriefing}
        setCelebrationEgg={easterEggFlow.setCelebrationEgg}
        setShowEggCelebration={easterEggFlow.setShowEggCelebration}
        easterEggFlow={easterEggFlow}
        pseudo={pseudo}
        myTeamId={myTeamId}
        players={players}
        teams={dashboardStatus?.teams || []}
        onlineUsers={onlineUsers}
        setOnlineUsers={setOnlineUsers}
        setUnreadChat={setUnreadChat}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        chatActiveTab={chatActiveTab}
        setChatActiveTab={setChatActiveTab}
        prefilledChatText={easterEggFlow.prefilledChatText}
        setPrefilledChatText={easterEggFlow.setPrefilledChatText}
        scrollToUnreadTrigger={scrollToUnreadTrigger}
        era={era}
        selectedSector={selectedSector}
        codexTab={codexTab}
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
        showOnboardingGuide={showOnboardingGuide}
        setShowOnboardingGuide={setShowOnboardingGuide}
        handleNavigateGuideStep={handleNavigateGuideStep}
        currentUserId={currentUserId}
        showNoPeriodModal={showNoPeriodModal}
        setShowNoPeriodModal={setShowNoPeriodModal}
        showAboutModal={showAboutModal}
        setShowAboutModal={setShowAboutModal}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<MainApp />} />
    </Routes>
  );
}
