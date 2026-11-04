import React from 'react';
import { MascotBubble3D } from './MascotBubble3D';
import { EasterEggVictoryDispatcher } from './EasterEggVictoryDispatcher';
import { TeamVictoryCelebrationModal } from './TeamVictoryCelebrationModal';
import { ChronoEggModal } from './ChronoEggModal';
import { RosettaStoneModal } from './RosettaStoneModal';
import { TemporalTerminalModal } from './TemporalTerminalModal';
import { TemporalEchoModal, type EcoThemeId } from './TemporalEchoModal';
import { ArcadeHubModal, ArcadeCabinetModal, getArcadeGame, parseArcadeReward } from '../arcade';
import { KonamiArcadeHUD } from './KonamiArcadeHUD';

export interface EasterEggModalsLayerProps {
  konamiHUD: {
    isVisible: boolean;
    stepIndex: number;
    isError: boolean;
    hudLevel: 0 | 1 | 2 | undefined;
    showMobileButtons: boolean;
  };
  onKonamiButtonPress: (btn: 'b' | 'a') => void;
  onCloseKonamiHUD: () => void;
  activeEggData: any;
  showMascotBubble: boolean;
  setShowMascotBubble: React.Dispatch<React.SetStateAction<boolean>>;
  exitReplayMode: () => void;
  verifyEasterEggAnswer: (answer: string, resolutionTimeSeconds?: number, targetEggId?: number) => Promise<any>;
  onVerifyCommand: (command: string, targetEggId?: number) => Promise<{ success: boolean; message?: string }>;
  fetchActiveEgg: (forceRefresh?: boolean) => Promise<any>;
  celebrationEgg: any;
  setCelebrationEgg: React.Dispatch<React.SetStateAction<any>>;
  showEggCelebration: boolean;
  setShowEggCelebration: React.Dispatch<React.SetStateAction<boolean>>;
  setChatActiveTab: (tab: 'team' | 'global') => void;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPrefilledChatText: (text: string | null) => void;
  pseudo?: string | null;
  childInfos?: any;
  arcadeSelectedGameKey: any;
  setArcadeSelectedGameKey: (key: any) => void;
  showArcadeCabinet: boolean;
  setShowArcadeCabinet: (show: boolean) => void;
  myTeamId?: number;
  showChronoEggModal: boolean;
  setShowChronoEggModal: (show: boolean) => void;
  chronoPeriods: any[];
  chronoLoading: boolean;
  onReplayPeriod: (periodId: number) => void;
  showRosettaStoneModal: boolean;
  setShowRosettaStoneModal: (show: boolean) => void;
  showTerminalModal: boolean;
  setShowTerminalModal: (show: boolean) => void;
  submitMetaEnigmaCode: (code: string) => Promise<any>;
  selectedEchoTheme: EcoThemeId;
  setSelectedEchoTheme: (theme: EcoThemeId) => void;
  showTemporalEchoModal: boolean;
  setShowTemporalEchoModal: (show: boolean) => void;
  showArcadeHub: boolean;
  setShowArcadeHub: (show: boolean) => void;
}

export const EasterEggModalsLayer: React.FC<EasterEggModalsLayerProps> = ({
  konamiHUD,
  onKonamiButtonPress,
  onCloseKonamiHUD,
  activeEggData,
  showMascotBubble,
  setShowMascotBubble,
  exitReplayMode,
  verifyEasterEggAnswer,
  onVerifyCommand,
  fetchActiveEgg,
  celebrationEgg,
  setCelebrationEgg,
  showEggCelebration,
  setShowEggCelebration,
  setChatActiveTab,
  setChatOpen,
  setPrefilledChatText,
  pseudo,
  childInfos,
  arcadeSelectedGameKey,
  setArcadeSelectedGameKey,
  showArcadeCabinet,
  setShowArcadeCabinet,
  myTeamId,
  showChronoEggModal,
  setShowChronoEggModal,
  chronoPeriods,
  chronoLoading,
  onReplayPeriod,
  showRosettaStoneModal,
  setShowRosettaStoneModal,
  showTerminalModal,
  setShowTerminalModal,
  submitMetaEnigmaCode,
  selectedEchoTheme,
  setSelectedEchoTheme,
  showTemporalEchoModal,
  setShowTemporalEchoModal,
  showArcadeHub,
  setShowArcadeHub,
}) => {
  return (
    <>
      {/* HUD RÉTRO ARCADE KONAMI */}
      <KonamiArcadeHUD
        isVisible={konamiHUD.isVisible}
        stepIndex={konamiHUD.stepIndex}
        isError={konamiHUD.isError}
        hudLevel={konamiHUD.hudLevel}
        showMobileButtons={konamiHUD.showMobileButtons}
        onMobileButtonPress={onKonamiButtonPress}
        onClose={onCloseKonamiHUD}
      />

      {/* MASCOTTE 3D (EASTER EGG) */}
      {activeEggData?.easterEgg && activeEggData.hasActiveEgg !== false && (
        <MascotBubble3D
          isOpen={showMascotBubble}
          onClose={() => setShowMascotBubble(false)}
          cycleEggs={activeEggData.cycleEggs}
          unsolvedRolloverCount={activeEggData.unsolvedRolloverCount}
          showRolloverWarning={activeEggData.showRolloverWarning}
          title={activeEggData.easterEgg.title}
          crypticMessage={activeEggData.easterEgg.crypticMessage || ''}
          explicitHint={activeEggData.easterEgg.explicitHint}
          showExplicitHint={!!activeEggData.easterEgg.isExplicitHintVisible}
          imageUrl={activeEggData.easterEgg.imageUrl}
          triggerType={activeEggData.easterEgg.triggerType}
          isDiscovered={!!activeEggData.playerProgress?.isDiscovered}
          rewardPointsIT={activeEggData.easterEgg.rewardPointsIT}
          mascotDurationSeconds={activeEggData.easterEgg.mascotDurationSeconds || 45}
          multiEggProgress={activeEggData.multiEggProgress}
          isReplayMode={!!activeEggData.isReplayMode}
          replayedCycleIndex={activeEggData.period?.cycleIndex}
          onExitReplay={exitReplayMode}
          onVerifyAnswer={(answer, targetEggId) => verifyEasterEggAnswer(answer, undefined, targetEggId)}
          onVerifyCommand={(command, targetEggId) => onVerifyCommand(command, targetEggId)}
          onReplayVictoryAnimation={(targetEggId) => {
            const egg =
              (targetEggId ? activeEggData.cycleEggs?.find((e: any) => e.id === targetEggId) : undefined) ||
              activeEggData.easterEgg;
            if (egg) {
              setCelebrationEgg({
                code: egg.code,
                triggerType: egg.triggerType,
                title: egg.title,
                pointsIT: egg.rewardPointsIT || 60,
                isTeamRewarded: !!activeEggData.teamProgress?.isTeamRewarded,
                remainingPlayers: activeEggData?.teamProgress
                  ? Math.max(
                      0,
                      (activeEggData.teamProgress.requiredPlayers || 2) -
                        (activeEggData.teamProgress.discoveredCount || 0),
                    )
                  : undefined,
              });
            }
            setShowEggCelebration(true);
          }}
          onSuccess={async (targetEggId) => {
            const triggeredEgg =
              (targetEggId ? activeEggData.cycleEggs?.find((e: any) => e.id === targetEggId) : undefined) ||
              activeEggData?.easterEgg;
            const freshEgg = await fetchActiveEgg(true);
            const remaining = freshEgg?.teamProgress
              ? Math.max(
                  0,
                  (freshEgg.teamProgress.requiredPlayers || 2) - (freshEgg.teamProgress.discoveredCount || 0),
                )
              : undefined;

            if (triggeredEgg) {
              setCelebrationEgg({
                code: triggeredEgg.code,
                triggerType: triggeredEgg.triggerType,
                title: triggeredEgg.title,
                pointsIT: triggeredEgg.rewardPointsIT || 60,
                isTeamRewarded: !!freshEgg?.teamProgress?.isTeamRewarded,
                remainingPlayers: remaining,
              });
            }
            setShowEggCelebration(true);
            setChatActiveTab('team');
            const title = triggeredEgg?.title || activeEggData?.easterEgg?.title || 'Easter Egg 2070';
            if (freshEgg && freshEgg.teamProgress?.isTeamRewarded) {
              setPrefilledChatText(`Victoire ! Notre équipe a validé l'Easter Egg "${title}" et remporté les points IT ! 🎉`);
            } else if (remaining && remaining > 0) {
              setPrefilledChatText(
                `J'ai trouvé la solution de l'Easter Egg "${title}" ! Venez vite valider, il manque encore ${remaining} joueur${remaining > 1 ? 's' : ''} pour remporter les points IT ! 🚀`,
              );
            } else {
              setPrefilledChatText(
                `J'ai trouvé la solution de l'Easter Egg "${title}" ! Venez vite valider pour débloquer les points IT de l'équipe ! 🚀`,
              );
            }
          }}
          onOpenCommLink={() => {
            setChatActiveTab('team');
            setChatOpen(true);
          }}
        />
      )}

      {/* CÉLÉBRATION FINALE EASTER EGG */}
      <EasterEggVictoryDispatcher
        isOpen={showEggCelebration}
        onClose={() => {
          setShowEggCelebration(false);
          setCelebrationEgg(null);
        }}
        eggCode={celebrationEgg?.code || activeEggData?.easterEgg?.code}
        triggerType={celebrationEgg?.triggerType || activeEggData?.easterEgg?.triggerType}
        eggTitle={celebrationEgg?.title || activeEggData?.easterEgg?.title || 'Easter Egg Découvert'}
        pointsIT={celebrationEgg?.pointsIT || activeEggData?.easterEgg?.rewardPointsIT || 60}
        isTeamRewarded={celebrationEgg?.isTeamRewarded ?? !!activeEggData?.teamProgress?.isTeamRewarded}
        remainingPlayers={
          celebrationEgg?.remainingPlayers ??
          (activeEggData?.teamProgress
            ? Math.max(
                0,
                (activeEggData.teamProgress.requiredPlayers || 2) -
                  (activeEggData.teamProgress.discoveredCount || 0),
              )
            : undefined)
        }
        arcadeGameKey={(() => {
          const code = celebrationEgg?.code || activeEggData?.easterEgg?.code;
          const egg =
            activeEggData?.cycleEggs?.find((e: any) => e.code === code) ?? activeEggData?.easterEgg;
          return parseArcadeReward(egg?.code === code ? egg?.specialReward : undefined);
        })()}
        playerPseudo={pseudo || childInfos?.pseudo}
        teamName={childInfos?.group?.team?.name}
        onPlayArcadeGame={(gameKey) => {
          setArcadeSelectedGameKey(gameKey);
          setShowArcadeCabinet(true);
        }}
        onOpenCommLink={() => {
          setShowEggCelebration(false);
          setCelebrationEgg(null);
          setShowMascotBubble(false);
          setChatActiveTab('team');
          setChatOpen(true);
        }}
      />

      {/* CÉLÉBRATION COLLECTIVE VICTOIRE D'ÉQUIPE */}
      <TeamVictoryCelebrationModal
        myTeamId={myTeamId}
        onOpenCommLink={() => {
          setChatActiveTab('team');
          setChatOpen(true);
        }}
      />

      {/* MODALE CHRONO-EGG */}
      <ChronoEggModal
        isOpen={showChronoEggModal}
        onClose={() => setShowChronoEggModal(false)}
        hasRosettaStone={
          !!(activeEggData?.metaEnigma?.hasRosettaStone || activeEggData?.teamProgress?.hasRosettaStone)
        }
        isMetaEnigmaUnlocked={!!activeEggData?.metaEnigma?.isMetaEnigmaUnlocked}
        periods={chronoPeriods}
        loading={chronoLoading}
        onReplayPeriod={onReplayPeriod}
        onOpenRosetta={() => setShowRosettaStoneModal(true)}
        onOpenTerminal={() => setShowTerminalModal(true)}
      />

      {/* MODALE PIERRE DE ROSETTE 2070 */}
      <RosettaStoneModal
        isOpen={showRosettaStoneModal}
        onClose={() => setShowRosettaStoneModal(false)}
        periods={chronoPeriods}
        onResolvePeriod={onReplayPeriod}
        onOpenTerminal={() => {
          setShowRosettaStoneModal(false);
          setShowTerminalModal(true);
        }}
      />

      {/* MODALE TERMINAL TEMPOREL */}
      <TemporalTerminalModal
        isOpen={showTerminalModal}
        onClose={() => setShowTerminalModal(false)}
        isUnlocked={!!activeEggData?.metaEnigma?.isMetaEnigmaUnlocked}
        onSubmitCode={submitMetaEnigmaCode}
        onSuccessUnlock={() => {
          fetchActiveEgg();
          setShowTerminalModal(false);
          setSelectedEchoTheme('ENERGY');
          setShowTemporalEchoModal(true);
        }}
      />

      {/* MODALE VISION 2050 */}
      <TemporalEchoModal
        isOpen={showTemporalEchoModal}
        onClose={() => setShowTemporalEchoModal(false)}
        initialTheme={selectedEchoTheme}
      />

      {/* SALLE D'ARCADE HUB */}
      <ArcadeHubModal
        isOpen={showArcadeHub}
        onClose={() => setShowArcadeHub(false)}
      />

      {/* BORNE D'ARCADE DIRECTE */}
      {showArcadeCabinet && getArcadeGame(arcadeSelectedGameKey) && (
        <ArcadeCabinetModal
          isOpen={showArcadeCabinet}
          onClose={() => setShowArcadeCabinet(false)}
          game={getArcadeGame(arcadeSelectedGameKey)!}
        />
      )}
    </>
  );
};
