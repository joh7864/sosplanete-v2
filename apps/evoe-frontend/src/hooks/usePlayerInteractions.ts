import { useMemo, useCallback } from 'react';

interface UsePlayerInteractionsProps {
  currentPlayer?: any;
  childInfos?: any;
  evoeImgUrl: string;
  extrapolation?: any;
  unreadChat: any;
  setChatActiveTab: (tab: string) => void;
  setChatOpen: (open: boolean) => void;
  setScrollToUnreadTrigger: (t: number) => void;
  setSelectedProfileId: (id: number | null) => void;
  searchedPlayerId: number | string | null;
  setSearchedPlayerId: (id: number | string | null | ((prev: any) => any)) => void;
  setSearchCloseTrigger: (t: number) => void;
  missions?: any[];
  missionSearchQuery: string;
}

export function usePlayerInteractions({
  currentPlayer,
  childInfos,
  evoeImgUrl,
  extrapolation,
  unreadChat,
  setChatActiveTab,
  setChatOpen,
  setScrollToUnreadTrigger,
  setSelectedProfileId,
  searchedPlayerId,
  setSearchedPlayerId,
  setSearchCloseTrigger,
  missions,
  missionSearchQuery,
}: UsePlayerInteractionsProps) {
  const getAvatarUrl = useCallback(() => {
    if (currentPlayer?.avatar && currentPlayer.avatar !== 'avatars/default.png') {
      return `${evoeImgUrl}${currentPlayer.avatar}`;
    }
    let hash = 0;
    const name = childInfos?.pseudo || '';
    for (let i = 0; i < name.length; i++) {
      hash += name.charCodeAt(i);
    }

    let age = 18;
    if (currentPlayer?.birthDate) {
      age = new Date().getFullYear() - new Date(currentPlayer.birthDate).getFullYear();
    }

    let genre = '';
    if (currentPlayer?.gender === 'EF') {
      genre = 'EF';
    } else if (currentPlayer?.gender === 'EH') {
      genre = 'EH';
    } else if (currentPlayer?.gender === 'E' || age < 15) {
      genre = hash % 2 === 0 ? 'EF' : 'EH';
    } else if (currentPlayer?.gender === 'F') {
      genre = 'F';
    } else if (currentPlayer?.gender === 'M') {
      genre = 'H';
    } else {
      const genres = ['EF', 'EH', 'F', 'H'];
      genre = genres[hash % 4];
    }

    let file = '';
    if (genre === 'EF') {
      const idx = (hash % 3) + 1;
      file = `EF_avatar_0${idx}.png`;
    } else if (genre === 'EH') {
      const idx = (hash % 3) + 1;
      file = `EH_avatar_0${idx}.png`;
    } else if (genre === 'F') {
      const idx = (hash % 12) + 1;
      file = `F_avatar_${idx.toString().padStart(2, '0')}.png`;
    } else {
      const idx = (hash % 21) + 1;
      file = `H_avatar_0${idx}.png`;
    }

    return `${evoeImgUrl}avatars_3D/${file}`;
  }, [currentPlayer, childInfos?.pseudo, evoeImgUrl]);

  const getEodPercent = useCallback((dateStr: string) => {
    if (!dateStr) return 50;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const date = new Date(Date.UTC(year, month, day));
      const start = new Date(Date.UTC(year, 0, 1));
      const diff = date.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      const winStart = 182;
      const winSpan = 91;
      const percent = ((dayOfYear - winStart) / winSpan) * 100;
      return Math.min(96, Math.max(4, percent));
    }
    return 50;
  }, []);

  const eodN1Percent = useMemo(
    () => (extrapolation ? getEodPercent(extrapolation.dateDepassementSans) : 35.2),
    [extrapolation, getEodPercent],
  );

  const eodNPercent = useMemo(
    () => (extrapolation ? getEodPercent(extrapolation.dateDepassement) : 48.4),
    [extrapolation, getEodPercent],
  );

  const handleSelectPlayer = useCallback(
    (player: any) => {
      if (searchedPlayerId !== null) {
        setSearchedPlayerId(null);
        setSearchCloseTrigger(Date.now());
        setSelectedProfileId(player.childId || player.id);
        return;
      }

      const isMe = player.childId === childInfos?.id || player.id === childInfos?.id || player.isCurrent;

      if (isMe) {
        const unreadMpUsers = Object.keys(unreadChat.unreadMps || {}).filter(
          (k) => (unreadChat.unreadMps?.[k] || 0) > 0,
        );
        if (unreadMpUsers.length > 0) {
          setChatActiveTab(`mp:${unreadMpUsers[0]}`);
          setChatOpen(true);
          setScrollToUnreadTrigger(Date.now());
          return;
        }

        const unreadTeamNames = Object.keys(unreadChat.unreadTeams || {}).filter(
          (k) => (unreadChat.unreadTeams?.[k] || 0) > 0,
        );
        if (unreadChat.team > 0 || unreadTeamNames.length > 0) {
          setChatActiveTab(unreadTeamNames.length > 0 ? `team:${unreadTeamNames[0]}` : 'team');
          setChatOpen(true);
          setScrollToUnreadTrigger(Date.now());
          return;
        }

        if (unreadChat.system > 0) {
          setChatActiveTab('system');
          setChatOpen(true);
          setScrollToUnreadTrigger(Date.now());
          return;
        }

        if (unreadChat.global > 0) {
          setChatActiveTab('global');
          setChatOpen(true);
          setScrollToUnreadTrigger(Date.now());
          return;
        }
      } else {
        const pseudo = player.pseudo.toLowerCase();
        if ((unreadChat.unreadMps?.[pseudo] || 0) > 0) {
          setChatActiveTab(`mp:${pseudo}`);
          setChatOpen(true);
          setScrollToUnreadTrigger(Date.now());
          return;
        }
      }

      setSelectedProfileId(player.childId || player.id);
    },
    [searchedPlayerId, setSearchedPlayerId, setSearchCloseTrigger, setSelectedProfileId, childInfos?.id, unreadChat, setChatActiveTab, setChatOpen, setScrollToUnreadTrigger],
  );

  const handleSelectEnvelope = useCallback(
    (player?: any) => {
      const unreadMpUsers = Object.keys(unreadChat.unreadMps || {}).filter(
        (k) => (unreadChat.unreadMps?.[k] || 0) > 0,
      );
      const clickedPseudo = player?.pseudo?.toLowerCase();
      const targetMp =
        clickedPseudo && (unreadChat.unreadMps?.[clickedPseudo] || 0) > 0
          ? clickedPseudo
          : unreadMpUsers[0];

      if (targetMp) {
        setChatActiveTab(`mp:${targetMp}`);
        setChatOpen(true);
        setScrollToUnreadTrigger(Date.now());
        return;
      }

      const unreadTeamNames = Object.keys(unreadChat.unreadTeams || {}).filter(
        (k) => (unreadChat.unreadTeams?.[k] || 0) > 0,
      );
      if (unreadChat.team > 0 || unreadTeamNames.length > 0) {
        setChatActiveTab(unreadTeamNames.length > 0 ? `team:${unreadTeamNames[0]}` : 'team');
        setChatOpen(true);
        setScrollToUnreadTrigger(Date.now());
        return;
      }

      if (unreadChat.system > 0) {
        setChatActiveTab('system');
        setChatOpen(true);
        setScrollToUnreadTrigger(Date.now());
        return;
      }

      if (unreadChat.global > 0) {
        setChatActiveTab('global');
        setChatOpen(true);
        setScrollToUnreadTrigger(Date.now());
        return;
      }

      setChatActiveTab('team');
      setChatOpen(true);
      setScrollToUnreadTrigger(Date.now());
    },
    [unreadChat, setChatActiveTab, setChatOpen, setScrollToUnreadTrigger],
  );

  const handleSearchMatchChange = useCallback(
    (player: any | null) => {
      const targetId = player ? player.childId || player.id : null;
      setSearchedPlayerId((prev) => (prev === targetId ? prev : targetId));
    },
    [setSearchedPlayerId],
  );

  const searchedMissions = useMemo(() => {
    const rawQ = missionSearchQuery.trim();
    if (!rawQ || !missions) return [];

    const normalize = (str?: string | null) =>
      (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const q = normalize(rawQ);

    return missions.filter((m: any) => {
      const titreSF = normalize(m.evoeMission?.titreSF);
      const label = normalize(m.label);
      const descSF = normalize(m.evoeMission?.descriptionSF);
      const desc = normalize(m.description);
      const catSF = normalize(m.categorySF);
      const cat = normalize(m.category);

      return (
        titreSF.includes(q) ||
        label.includes(q) ||
        descSF.includes(q) ||
        desc.includes(q) ||
        catSF.includes(q) ||
        cat.includes(q)
      );
    });
  }, [missions, missionSearchQuery]);

  return {
    getAvatarUrl,
    getEodPercent,
    eodN1Percent,
    eodNPercent,
    handleSelectPlayer,
    handleSelectEnvelope,
    handleSearchMatchChange,
    searchedMissions,
  };
}
