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

  const fetchActiveEgg = useCallback(async () => {
    if (!childInfos) return;
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
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message);
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
      // Optional: re-fetch to get the updated timestamp immediately
      // await fetchActiveEgg();
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
            answer,
            resolutionTimeSeconds,
          },
          { headers: getHeaders() },
        );
        await fetchActiveEgg();
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
            triggerType,
            metadata,
            resolutionTimeSeconds,
          },
          { headers: getHeaders() },
        );
        await fetchActiveEgg();
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
  };
}
