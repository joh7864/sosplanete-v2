import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBirthday } from './useBirthday';

interface UseBirthdayCelebrationProps {
  childInfos?: any;
  currentPlayer?: any;
  players?: any[];
  loader2026Dismissed: boolean;
  setPrefilledChatText: (text: string | null) => void;
  setChatActiveTab: (tab: string) => void;
  setChatOpen: (open: boolean) => void;
  handleImpulseMission: (missionId: number) => Promise<any>;
}

export function useBirthdayCelebration({
  childInfos,
  currentPlayer,
  players,
  loader2026Dismissed,
  setPrefilledChatText,
  setChatActiveTab,
  setChatOpen,
  handleImpulseMission,
}: UseBirthdayCelebrationProps) {
  const {
    isBirthdayActive,
    isCatchup: isBirthdayCatchup,
    isLate: isBirthdayLate,
    boostsRemaining: birthdayBoostsRemaining,
    hasCelebrationPending: hasBirthdayCelebrationPending,
    hasLateModalPending: hasBirthdayLateModalPending,
    wishes: birthdayWishes,
    acknowledgeCelebration: acknowledgeBirthdayCelebration,
    consumeBoost: consumeBirthdayBoost,
  } = useBirthday(
    childInfos?.id,
    childInfos?.birthDate || currentPlayer?.birthDate,
    currentPlayer?.birthdayCelebratedYear ?? (childInfos as any)?.birthdayCelebratedYear,
    currentPlayer?.birthdayCelebratedDate ?? (childInfos as any)?.birthdayCelebratedDate,
  );

  const [gribouilleBirthdayPlayer, setGribouilleBirthdayPlayer] = useState<any | null>(null);

  useEffect(() => {
    if ((hasBirthdayCelebrationPending || hasBirthdayLateModalPending) && loader2026Dismissed && currentPlayer) {
      const timer = setTimeout(() => setGribouilleBirthdayPlayer(currentPlayer), 1200);
      return () => clearTimeout(timer);
    }
  }, [hasBirthdayCelebrationPending, hasBirthdayLateModalPending, loader2026Dismissed, currentPlayer]);

  const handleCloseGribouille = useCallback(() => {
    if (
      gribouilleBirthdayPlayer &&
      (gribouilleBirthdayPlayer.id === childInfos?.id ||
        gribouilleBirthdayPlayer.childId === childInfos?.id ||
        gribouilleBirthdayPlayer.isCurrent)
    ) {
      if (hasBirthdayCelebrationPending) acknowledgeBirthdayCelebration(false);
      else if (hasBirthdayLateModalPending) acknowledgeBirthdayCelebration(true);
    }
    setGribouilleBirthdayPlayer(null);
  }, [gribouilleBirthdayPlayer, childInfos?.id, hasBirthdayCelebrationPending, hasBirthdayLateModalPending, acknowledgeBirthdayCelebration]);

  const handleShareBirthdayWithTeam = useCallback(() => {
    handleCloseGribouille();
    setPrefilledChatText(
      `🎂 C'est mon anniversaire aujourd'hui ! Le Commandement m'a activé un boost x2 sur mes 3 prochaines missions pour faire grimper notre vaisseau ! 🚀🎉`,
    );
    setChatActiveTab('team');
    setChatOpen(true);
  }, [handleCloseGribouille, setPrefilledChatText, setChatActiveTab, setChatOpen]);

  const handleWishTeammateBirthday = useCallback(
    async (targetPseudo: string) => {
      const targetPlayer = gribouilleBirthdayPlayer;
      handleCloseGribouille();
      setPrefilledChatText(
        `🎂 Joyeux anniversaire ${targetPseudo} ! Que la force cosmique soit avec toi aujourd'hui ! 🎉🚀`,
      );
      setChatActiveTab('team');
      setChatOpen(true);

      if (targetPlayer?.id) {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/birthday/wish`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              recipientId: Number(targetPlayer.id),
              message: `Joyeux anniversaire ${targetPseudo} ! 🎉 Que la force cosmique soit avec toi !`,
              senderAvatar: currentPlayer?.avatar,
              senderTeamColor: currentPlayer?.color || '#3b82f6',
            }),
          });
        } catch (err) {
          console.warn('[BirthdayWish] Erreur envoi souhait en base:', err);
        }
      }
    },
    [gribouilleBirthdayPlayer, handleCloseGribouille, setPrefilledChatText, setChatActiveTab, setChatOpen, currentPlayer],
  );

  const handleImpulseMissionWithBirthday = useCallback(
    async (missionId: number) => {
      if (isBirthdayActive && birthdayBoostsRemaining > 0) {
        consumeBirthdayBoost();
      }
      await handleImpulseMission(missionId);
    },
    [isBirthdayActive, birthdayBoostsRemaining, consumeBirthdayBoost, handleImpulseMission],
  );

  const enrichedPlayers = useMemo(() => {
    if (!players) return [];
    return players.map((p: any) => {
      if (p.id === childInfos?.id || p.childId === childInfos?.id) {
        return { ...p, isBirthdayActive };
      }
      return p;
    });
  }, [players, childInfos?.id, isBirthdayActive]);

  return {
    isBirthdayActive,
    isBirthdayCatchup,
    isBirthdayLate,
    birthdayBoostsRemaining,
    birthdayWishes,
    gribouilleBirthdayPlayer,
    setGribouilleBirthdayPlayer,
    handleCloseGribouille,
    handleShareBirthdayWithTeam,
    handleWishTeammateBirthday,
    handleImpulseMissionWithBirthday,
    enrichedPlayers,
  };
}
