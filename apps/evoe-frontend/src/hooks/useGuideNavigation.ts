import { useCallback } from 'react';

interface UseGuideNavigationProps {
  era: '2026' | '2070';
  handleSwitchEra: () => void;
  setView2026: (v: 'codex' | 'leaderboard') => void;
  setSelectedSector: (sector: string | null) => void;
  setIsCodexCollapsed: (c: boolean) => void;
  setShowExtrapolation: (s: boolean) => void;
  setShowRadar: (s: boolean) => void;
  setChatOpen: (o: boolean) => void;
  setCodexTab: (t: 'missions' | 'challenges') => void;
  setSelectedProfileId: (id: number | null) => void;
  missionsByCategory?: Record<string, any[]>;
  childInfos?: any;
  setShowNoPeriodModal: (s: boolean) => void;
  setMissionSearchQuery: (q: string) => void;
  setIsMobileSearchOpen: (o: boolean) => void;
}

export function useGuideNavigation({
  era,
  handleSwitchEra,
  setView2026,
  setSelectedSector,
  setIsCodexCollapsed,
  setShowExtrapolation,
  setShowRadar,
  setChatOpen,
  setCodexTab,
  setSelectedProfileId,
  missionsByCategory,
  childInfos,
  setShowNoPeriodModal,
  setMissionSearchQuery,
  setIsMobileSearchOpen,
}: UseGuideNavigationProps) {
  const handleSelectSector = useCallback(
    (sector: string) => {
      if (childInfos && childInfos.isPeriodOpen === false) {
        setShowNoPeriodModal(true);
        return;
      }
      setSelectedSector(sector);
      setMissionSearchQuery('');
      setIsMobileSearchOpen(false);
      setCodexTab('missions');
      setIsCodexCollapsed(false);
      setView2026('codex');
      setChatOpen(false);
      setSelectedProfileId(null);
    },
    [
      childInfos,
      setShowNoPeriodModal,
      setSelectedSector,
      setMissionSearchQuery,
      setIsMobileSearchOpen,
      setCodexTab,
      setIsCodexCollapsed,
      setView2026,
      setChatOpen,
      setSelectedProfileId,
    ],
  );

  const handleNavigateGuideStep = useCallback(
    (stepIndex: number) => {
      setSelectedProfileId(null);

      if (stepIndex === 0 || stepIndex === 1) {
        if (era !== '2026') handleSwitchEra();
        setView2026('codex');
        setSelectedSector(null);
        setIsCodexCollapsed(true);
        setShowExtrapolation(false);
        setShowRadar(false);
        setChatOpen(false);
      } else if (stepIndex === 2 || stepIndex === 3) {
        if (era !== '2026') handleSwitchEra();
        setView2026('codex');
        setCodexTab('missions');
        setIsCodexCollapsed(false);
        setShowExtrapolation(false);
        setShowRadar(false);
        setChatOpen(false);
        const cats = missionsByCategory ? Object.keys(missionsByCategory) : [];
        if (cats.length > 0) setSelectedSector(cats[0]);
      } else if (stepIndex === 4 || stepIndex === 5) {
        if (era !== '2026') handleSwitchEra();
        setView2026('codex');
        setSelectedSector(null);
        setIsCodexCollapsed(true);
        setShowExtrapolation(false);
        setShowRadar(false);
        setChatOpen(false);
      } else if (stepIndex === 6) {
        if (era !== '2070') handleSwitchEra();
        setSelectedSector(null);
        setIsCodexCollapsed(true);
        setShowExtrapolation(false);
        setShowRadar(false);
        setChatOpen(false);
      } else if (stepIndex === 7) {
        if (era !== '2070') handleSwitchEra();
        setSelectedSector(null);
        setIsCodexCollapsed(true);
        setShowExtrapolation(true);
        setShowRadar(false);
        setChatOpen(false);
      } else if (stepIndex === 8) {
        if (era !== '2070') handleSwitchEra();
        setSelectedSector(null);
        setIsCodexCollapsed(true);
        setShowExtrapolation(false);
        setShowRadar(true);
        setChatOpen(false);
      } else if (stepIndex === 9) {
        if (era !== '2026') handleSwitchEra();
        setView2026('leaderboard');
        setSelectedSector(null);
        setIsCodexCollapsed(true);
        setShowExtrapolation(false);
        setShowRadar(false);
        setChatOpen(false);
      } else if (stepIndex === 10) {
        if (era !== '2026') handleSwitchEra();
        setView2026('codex');
        setSelectedSector(null);
        setIsCodexCollapsed(true);
        setShowExtrapolation(false);
        setShowRadar(false);
        setChatOpen(true);
      } else if (stepIndex === 11) {
        if (era !== '2026') handleSwitchEra();
        setView2026('codex');
        setSelectedSector(null);
        setIsCodexCollapsed(true);
        setShowExtrapolation(false);
        setShowRadar(false);
        setChatOpen(false);
      }
    },
    [
      era,
      handleSwitchEra,
      setView2026,
      setSelectedSector,
      setIsCodexCollapsed,
      setShowExtrapolation,
      setShowRadar,
      setChatOpen,
      setCodexTab,
      setSelectedProfileId,
      missionsByCategory,
    ],
  );

  return {
    handleSelectSector,
    handleNavigateGuideStep,
  };
}
