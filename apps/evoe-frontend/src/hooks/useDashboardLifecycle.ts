import { useEffect } from 'react';
import { evoeClient } from '../lib/api';
import { applyArcadeCatalog } from '../components/arcade';
import { preloadEvoeAssets } from '../utils/preloadAssets';

interface UseDashboardLifecycleProps {
  era: '2026' | '2070';
  instanceId?: any;
  user?: any;
  isArcadeOpen: boolean;
  fetchEvoeData: (silent?: boolean) => void;
  fetchChallenges: (silent?: boolean) => void;
  setUnlockedArcadeGames: (games: string[]) => void;
  selectedRadarTeamId: number | string | null;
  showRadar: boolean;
  expandedMission: any;
  setExpandedMission: (m: any) => void;
}

export function useDashboardLifecycle({
  era,
  instanceId,
  user,
  isArcadeOpen,
  fetchEvoeData,
  fetchChallenges,
  setUnlockedArcadeGames,
  selectedRadarTeamId,
  showRadar,
  expandedMission,
  setExpandedMission,
}: UseDashboardLifecycleProps) {
  // Préchargement des assets critiques 3D/audio
  useEffect(() => {
    preloadEvoeAssets();
  }, []);

  // Récupération des jeux d'arcade débloqués par l'équipe
  useEffect(() => {
    let isMounted = true;
    const fetchUnlockedArcade = async () => {
      try {
        const BASE_API_URL = (
          import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy'
        ).replace('/legacy', '');
        const res = await evoeClient.get<{ unlockedGames: string[] }>(
          `${BASE_API_URL}/arcade/unlocked`,
        );
        if (isMounted && res.data?.unlockedGames) {
          setUnlockedArcadeGames(res.data.unlockedGames);
        }
        const catalog = await evoeClient.get<{ games: Parameters<typeof applyArcadeCatalog>[0] }>(
          `${BASE_API_URL}/arcade/games`,
        );
        if (isMounted && catalog.data?.games) {
          applyArcadeCatalog(catalog.data.games);
        }
      } catch {
        // Silencieux si non connecté ou hors ligne
      }
    };

    if (user) fetchUnlockedArcade();
    return () => {
      isMounted = false;
    };
  }, [user, setUnlockedArcadeGames]);

  // Fermer le popover holographique si clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mission-popover') && !target.closest('.mission-card')) {
        setExpandedMission(null);
      }
    };
    if (expandedMission) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedMission, setExpandedMission]);

  // Polling suspendu quand l'onglet ou la salle d'arcade est masqué/ouvert
  useEffect(() => {
    fetchEvoeData();
    if (era === '2026') fetchChallenges();

    const poll = () => {
      if (document.hidden || isArcadeOpen) return;
      if (era === '2070') fetchEvoeData(true);
      else if (era === '2026') {
        fetchEvoeData(true);
        fetchChallenges(true);
      }
    };

    const interval = setInterval(poll, 10000);
    const handleVisibilityChange = () => {
      if (!document.hidden && !isArcadeOpen) {
        if (era === '2070') fetchEvoeData(true);
        else if (era === '2026') {
          fetchEvoeData(true);
          fetchChallenges(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [era, instanceId, isArcadeOpen, fetchEvoeData, fetchChallenges]);

  // Auto-scroll vers le vaisseau ciblé sur le radar
  useEffect(() => {
    if (selectedRadarTeamId !== null && showRadar) {
      setTimeout(() => {
        const el = document.getElementById(`radar-team-${selectedRadarTeamId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [selectedRadarTeamId, showRadar]);
}
