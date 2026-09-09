import { useState, useEffect, useCallback } from 'react';
import { evoeClient } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type {
  ActiveEasterEggResponse,
  EasterEggTriggerType,
} from '../types/easterEgg';

const EVOE_API_URL =
  import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe';

export function useEasterEgg() {
  const { childInfos, instanceId } = useAuth();

  const [activeEggData, setActiveEggData] =
    useState<ActiveEasterEggResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSeenEnigma, setHasSeenEnigma] = useState<boolean>(false);

  const getHeaders = useCallback(() => {
    const savedToken =
      localStorage.getItem('evoe_token') ||
      sessionStorage.getItem('evoe_token');
    const savedAuth =
      localStorage.getItem('evoe_auth') || sessionStorage.getItem('evoe_auth');
    const savedInstanceId =
      instanceId ||
      localStorage.getItem('instanceId') ||
      sessionStorage.getItem('instanceId');

    const authHeader = savedToken
      ? `Bearer ${savedToken}`
      : `Basic ${savedAuth}`;
    return {
      'content-type': 'application/json',
      Authorization: authHeader,
      'x-instance-id': savedInstanceId || '',
    };
  }, [instanceId]);

  const fetchActiveEgg = useCallback(async (): Promise<ActiveEasterEggResponse | undefined> => {
    if (!childInfos) return undefined;
    try {
      setLoading(true);
      setError(null);
      const res = await evoeClient.get<ActiveEasterEggResponse>(
        `${EVOE_API_URL}/easter-eggs/active`,
        { headers: getHeaders() },
      );
      setActiveEggData(res.data);

      if (res.data?.easterEgg) {
        const seenKey = `evoe_seen_egg_${childInfos.id}_${res.data.easterEgg.id}`;
        setHasSeenEnigma(localStorage.getItem(seenKey) === 'true');
      }
      return res.data;
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [childInfos, getHeaders]);

  const markEnigmaAsSeen = useCallback(() => {
    if (childInfos && activeEggData?.easterEgg) {
      const seenKey = `evoe_seen_egg_${childInfos.id}_${activeEggData.easterEgg.id}`;
      localStorage.setItem(seenKey, 'true');
      setHasSeenEnigma(true);
    }
  }, [childInfos, activeEggData]);

  const interactWithEgg = useCallback(async () => {
    if (!activeEggData?.easterEgg) return;
    try {
      await evoeClient.post(
        `${EVOE_API_URL}/easter-eggs/interact`,
        { easterEggId: activeEggData.easterEgg.id },
        { headers: getHeaders() }
      );
    } catch (e) {
      console.error('Failed to record interaction', e);
    }
  }, [activeEggData, getHeaders]);

  const verifyAnswer = useCallback(
    async (answer: string, resolutionTimeSeconds?: number) => {
      if (!activeEggData?.easterEgg) return { success: false };
      try {
        const res = await evoeClient.post(
          `${EVOE_API_URL}/easter-eggs/verify-answer`,
          {
            easterEggId: activeEggData.easterEgg.id,
            periodId: activeEggData.period?.id,
            answer,
            resolutionTimeSeconds,
          },
          { headers: getHeaders() },
        );
        if (res.data?.success) {
          setActiveEggData((prev) =>
            prev
              ? {
                  ...prev,
                  playerProgress: {
                    ...prev.playerProgress,
                    isDiscovered: true,
                    discoveredAt: new Date().toISOString(),
                  },
                }
              : prev,
          );
          if (!activeEggData.isReplayMode) {
            await fetchActiveEgg();
          }
        }
        return res.data;
      } catch (err: any) {
        return {
          success: false,
          message: err?.response?.data?.message || 'Erreur lors de la vérification',
        };
      }
    },
    [activeEggData, getHeaders, fetchActiveEgg],
  );

  const validateTrigger = useCallback(
    async (
      triggerType: EasterEggTriggerType,
      metadata?: any,
      resolutionTimeSeconds?: number,
    ) => {
      if (!activeEggData?.easterEgg) return { success: false };
      try {
        const res = await evoeClient.post(
          `${EVOE_API_URL}/easter-eggs/validate-trigger`,
          {
            easterEggId: activeEggData.easterEgg.id,
            periodId: activeEggData.period?.id,
            triggerType,
            metadata,
            resolutionTimeSeconds,
          },
          { headers: getHeaders() },
        );
        if (res.data?.success) {
          setActiveEggData((prev) =>
            prev
              ? {
                  ...prev,
                  playerProgress: {
                    ...prev.playerProgress,
                    isDiscovered: true,
                    discoveredAt: new Date().toISOString(),
                  },
                }
              : prev,
          );
          if (!activeEggData.isReplayMode) {
            await fetchActiveEgg();
          }
        }
        return res.data;
      } catch (err: any) {
        return {
          success: false,
          message: err?.response?.data?.message || 'Erreur de validation',
        };
      }
    },
    [activeEggData, getHeaders, fetchActiveEgg],
  );

  const shareInCommLink = useCallback(
    async (
      targetType: 'TEAM' | 'PLAYER' | 'ALL',
      shareType: 'CLUE' | 'SOLUTION',
      customText?: string,
      targetPlayerId?: number,
    ) => {
      if (!activeEggData?.easterEgg) return { success: false };
      try {
        const res = await evoeClient.post(
          `${EVOE_API_URL}/easter-eggs/share`,
          {
            easterEggId: activeEggData.easterEgg.id,
            targetType,
            shareType,
            customText,
            targetPlayerId,
          },
          { headers: getHeaders() },
        );
        return res.data;
      } catch (err: any) {
        return {
          success: false,
          message: err?.response?.data?.message || 'Erreur de partage',
        };
      }
    },
    [activeEggData, getHeaders],
  );

  const fetchChronoEggArchive = useCallback(async () => {
    try {
      const res = await evoeClient.get(`${EVOE_API_URL}/easter-eggs/chrono-egg/archive`, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (err: any) {
      console.error('Erreur récupération archive Chrono-Egg:', err);
      return null;
    }
  }, [getHeaders]);

  const reopenPeriodEgg = useCallback(
    async (periodId: number) => {
      try {
        const res = await evoeClient.post(
          `${EVOE_API_URL}/easter-eggs/chrono-egg/reopen-period`,
          { periodId },
          { headers: getHeaders() },
        );
        if (res.data?.success && res.data?.activeEggData) {
          setActiveEggData(res.data.activeEggData);
          if (childInfos && res.data.activeEggData.easterEgg) {
            const seenKey = `evoe_seen_egg_${childInfos.id}_${res.data.activeEggData.easterEgg.id}`;
            localStorage.setItem(seenKey, 'true');
            setHasSeenEnigma(true);
          }
        }
        return res.data;
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || 'Erreur réouverture énigme');
      }
    },
    [childInfos, getHeaders],
  );

  const submitMetaEnigmaCode = useCallback(
    async (code: string) => {
      try {
        const res = await evoeClient.post(
          `${EVOE_API_URL}/easter-eggs/meta-enigma/submit-code`,
          { code },
          { headers: getHeaders() },
        );
        await fetchActiveEgg();
        return res.data;
      } catch (err: any) {
        return {
          success: false,
          message: err?.response?.data?.message || 'Code temporel invalide',
        };
      }
    },
    [getHeaders, fetchActiveEgg],
  );

  useEffect(() => {
    fetchActiveEgg();
  }, [fetchActiveEgg]);

  const hasUnread =
    activeEggData?.hasActiveEgg &&
    !activeEggData.playerProgress?.isDiscovered &&
    !hasSeenEnigma;

  return {
    activeEggData,
    loading,
    error,
    hasUnread,
    hasSeenEnigma,
    markEnigmaAsSeen,
    interactWithEgg,
    fetchActiveEgg,
    verifyAnswer,
    validateTrigger,
    shareInCommLink,
    fetchChronoEggArchive,
    reopenPeriodEgg,
    submitMetaEnigmaCode,
  };
}
