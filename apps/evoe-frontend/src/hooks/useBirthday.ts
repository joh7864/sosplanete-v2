import { useState, useEffect, useMemo, useCallback } from 'react';
import { evoeClient } from '../lib/api';

export interface UseBirthdayResult {
  isBirthdayActive: boolean;
  isBirthdayToday: boolean;
  isCatchup: boolean;
  isLate: boolean;
  boostsRemaining: number;
  hasCelebrationPending: boolean;
  hasLateModalPending: boolean;
  hasBirthdayBadge: boolean;
  wishes: any[];
  acknowledgeCelebration: (isLate?: boolean) => Promise<void>;
  consumeBoost: () => void;
  refreshWishes: () => Promise<void>;
}

/**
 * Détermine si une date de naissance correspond au jour J (même jour et mois en UTC)
 */
export function isBirthdayDate(birthDateStr?: string | null, targetDate: Date = new Date()): boolean {
  if (!birthDateStr) return false;
  try {
    const bDate = new Date(birthDateStr);
    if (isNaN(bDate.getTime())) return false;
    return (
      bDate.getUTCDate() === targetDate.getDate() &&
      bDate.getUTCMonth() === targetDate.getMonth()
    );
  } catch {
    return false;
  }
}

/**
 * Hook gérant la détection d'anniversaire selon l'Option D :
 * - Jour J exact : gâteau visible par tous, bonus x2 actifs.
 * - J+1 à J+7 (rattrapage) : gâteau visible UNIQUEMENT par le joueur le jour où il se connecte, bonus x2 actifs pour la journée.
 * - > J+7 et DANS le mois d'anniversaire (retard) : modale d'information sans bonus avec affichage des messages reçus pendant 3 périodes.
 * - Au-delà du mois d'anniversaire : aucun message de Gribouille ne s'affiche.
 * - Persistance en base de données et dans le localStorage.
 */
export function useBirthday(
  childId?: number | string | null,
  birthDate?: string | null,
  dbCelebratedYear?: number | null,
  dbCelebratedDate?: string | Date | null,
): UseBirthdayResult {
  const currentYear = new Date().getFullYear();
  const EVOE_API_URL = import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe';

  // Clés de stockage local par joueur et par année
  const storageCelebratedKey = childId ? `evoe_birthday_celebrated_${childId}_${currentYear}` : null;
  const storageBoostsKey = childId ? `evoe_birthday_boosts_used_${childId}_${currentYear}` : null;
  const storageBadgeKey = childId ? `evoe_birthday_badge_unlocked_${childId}` : null;

  const [hasCelebrationPending, setHasCelebrationPending] = useState(false);
  const [hasLateModalPending, setHasLateModalPending] = useState(false);
  const [boostsUsed, setBoostsUsed] = useState<number>(0);
  const [wishes, setWishes] = useState<any[]>([]);

  // Analyse du calendrier d'anniversaire
  const calendarAnalysis = useMemo(() => {
    if (!birthDate) {
      return { isBirthdayToday: false, isCatchup: false, isLate: false, diffDays: null };
    }

    try {
      const bDate = new Date(birthDate);
      if (isNaN(bDate.getTime())) {
        return { isBirthdayToday: false, isCatchup: false, isLate: false, diffDays: null };
      }

      const now = new Date();
      const bDay = bDate.getUTCDate();
      const bMonth = bDate.getUTCMonth();

      // Anniversaire de cette année
      let bDateThisYear = new Date(currentYear, bMonth, bDay, 0, 0, 0, 0);
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      let diffDays = Math.round((todayMidnight.getTime() - bDateThisYear.getTime()) / (1000 * 60 * 60 * 24));

      // Gestion du cas frontière fin décembre -> début janvier (si l'anniversaire était il y a moins de 8 jours fin décembre)
      if (diffDays < 0 && bMonth === 11 && now.getMonth() === 0) {
        const bLastYear = new Date(currentYear - 1, bMonth, bDay, 0, 0, 0, 0);
        const diffLastYear = Math.round((todayMidnight.getTime() - bLastYear.getTime()) / (1000 * 60 * 60 * 24));
        if (diffLastYear >= 0 && diffLastYear <= 7) {
          diffDays = diffLastYear;
          bDateThisYear = bLastYear;
        }
      }

      // Règle : Au-delà du mois d'anniversaire, aucun message de Gribouille ne doit être affiché
      const isSameMonthAsBirthday = now.getMonth() === bMonth && now.getFullYear() === bDateThisYear.getFullYear();

      return {
        isBirthdayToday: diffDays === 0,
        isCatchup: diffDays > 0 && diffDays <= 7,
        isLate: diffDays > 7 && isSameMonthAsBirthday,
        diffDays,
      };
    } catch {
      return { isBirthdayToday: false, isCatchup: false, isLate: false, diffDays: null };
    }
  }, [birthDate, currentYear]);

  const { isBirthdayToday, isCatchup, isLate, diffDays } = calendarAnalysis;

  // Déterminer si l'anniversaire a déjà été fêté ou notifié cette année (DB ou localStorage)
  const isAlreadyProcessedThisYear = useMemo(() => {
    if (dbCelebratedYear === currentYear) return true;
    if (storageCelebratedKey && localStorage.getItem(storageCelebratedKey)) return true;
    return false;
  }, [dbCelebratedYear, currentYear, storageCelebratedKey]);

  // Déterminer si la fête a été activée AUJOURD'HUI
  const isCelebratedToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    if (dbCelebratedDate) {
      try {
        if (new Date(dbCelebratedDate).toDateString() === todayStr) return true;
      } catch {}
    }
    if (storageCelebratedKey) {
      const localVal = localStorage.getItem(storageCelebratedKey);
      if (localVal) {
        try {
          if (new Date(localVal).toDateString() === todayStr) return true;
        } catch {}
      }
    }
    return false;
  }, [dbCelebratedDate, storageCelebratedKey]);

  // Détermination de l'état actif (Gâteau & Boosts)
  const isBirthdayActive = useMemo(() => {
    if (isAlreadyProcessedThisYear) {
      // Actif uniquement si la fête a été déclenchée aujourd'hui
      return isCelebratedToday;
    }
    // Pas encore fêté : actif si on est le jour J ou dans la fenêtre de rattrapage (7 jours)
    return isBirthdayToday || isCatchup;
  }, [isAlreadyProcessedThisYear, isCelebratedToday, isBirthdayToday, isCatchup]);

  // Initialisation des modales en attente
  useEffect(() => {
    if (diffDays === null || diffDays < 0) {
      setHasCelebrationPending(false);
      setHasLateModalPending(false);
      return;
    }

    if (storageBoostsKey) {
      const usedCount = parseInt(localStorage.getItem(storageBoostsKey) || '0', 10);
      setBoostsUsed(isNaN(usedCount) ? 0 : usedCount);
    }

    if (isAlreadyProcessedThisYear) {
      setHasCelebrationPending(false);
      setHasLateModalPending(false);
      return;
    }

    // Si pas encore fêté / notifié cette année :
    if (isBirthdayToday || isCatchup) {
      setHasCelebrationPending(true);
      setHasLateModalPending(false);
    } else if (isLate) {
      setHasCelebrationPending(false);
      setHasLateModalPending(true);
    }
  }, [diffDays, isAlreadyProcessedThisYear, isBirthdayToday, isCatchup, isLate, storageBoostsKey]);

  // Chargement des vœux reçus
  const refreshWishes = useCallback(async () => {
    if (!childId) return;
    try {
      const res = await evoeClient.get(`${EVOE_API_URL}/birthday/wishes/${childId}`);
      if (Array.isArray(res.data)) {
        setWishes(res.data);
      }
    } catch (err) {
      console.warn('[useBirthday] Impossible de récupérer les vœux :', err);
    }
  }, [childId, EVOE_API_URL]);

  useEffect(() => {
    refreshWishes();
  }, [refreshWishes]);

  // Consommer un boost x2 (limité aux 3 premières missions de la journée)
  const consumeBoost = useCallback(() => {
    if (!storageBoostsKey || !isBirthdayActive) return;
    setBoostsUsed((prev) => {
      if (prev >= 3) return prev;
      const next = prev + 1;
      localStorage.setItem(storageBoostsKey, String(next));
      return next;
    });
  }, [storageBoostsKey, isBirthdayActive]);

  // Valider la célébration ou le message de retard
  const acknowledgeCelebration = useCallback(
    async (isLateParam = false) => {
      const nowIso = new Date().toISOString();
      if (storageCelebratedKey) {
        localStorage.setItem(storageCelebratedKey, nowIso);
      }
      if (storageBadgeKey && !isLateParam) {
        localStorage.setItem(storageBadgeKey, 'true');
      }

      setHasCelebrationPending(false);
      setHasLateModalPending(false);

      try {
        await evoeClient.post(`${EVOE_API_URL}/birthday/acknowledge`, {
          year: currentYear,
          isLate: isLateParam,
        });
      } catch (err) {
        console.warn('[useBirthday] Erreur synchronisation acknowledge backend :', err);
      }
    },
    [storageCelebratedKey, storageBadgeKey, EVOE_API_URL, currentYear],
  );

  // Badge Voyageur Solaire débloqué
  const hasBirthdayBadge = useMemo(() => {
    if (!storageBadgeKey && !storageCelebratedKey) return false;
    if (storageBadgeKey && localStorage.getItem(storageBadgeKey) === 'true') return true;
    return isBirthdayActive;
  }, [storageBadgeKey, storageCelebratedKey, isBirthdayActive]);

  const boostsRemaining = isBirthdayActive ? Math.max(0, 3 - boostsUsed) : 0;

  return {
    isBirthdayActive,
    isBirthdayToday,
    isCatchup,
    isLate,
    boostsRemaining,
    hasCelebrationPending,
    hasLateModalPending,
    hasBirthdayBadge,
    wishes,
    acknowledgeCelebration,
    consumeBoost,
    refreshWishes,
  };
}
