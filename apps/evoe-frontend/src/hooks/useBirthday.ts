import { useState, useEffect, useMemo, useCallback } from 'react';

export interface UseBirthdayResult {
  isBirthdayActive: boolean;
  isBirthdayToday: boolean;
  isCatchup: boolean;
  boostsRemaining: number;
  hasCelebrationPending: boolean;
  hasBirthdayBadge: boolean;
  acknowledgeCelebration: () => void;
  consumeBoost: () => void;
}

/**
 * Détermine si une date de naissance correspond au jour J (même jour et mois)
 */
export function isBirthdayDate(birthDateStr?: string | null, targetDate: Date = new Date()): boolean {
  if (!birthDateStr) return false;
  try {
    const bDate = new Date(birthDateStr);
    if (isNaN(bDate.getTime())) return false;
    return (
      bDate.getDate() === targetDate.getDate() &&
      bDate.getMonth() === targetDate.getMonth()
    );
  } catch {
    return false;
  }
}

/**
 * Hook gérant la détection d'anniversaire, le rattrapage (7 jours),
 * la célébration et le suivi des 3 impulsions doublées (x2).
 */
export function useBirthday(
  childId?: number | string | null,
  birthDate?: string | null
): UseBirthdayResult {
  const currentYear = new Date().getFullYear();

  // Clés de stockage local par joueur et par année
  const storageCelebratedKey = childId ? `evoe_birthday_celebrated_${childId}_${currentYear}` : null;
  const storageBoostsKey = childId ? `evoe_birthday_boosts_used_${childId}_${currentYear}` : null;
  const storageBadgeKey = childId ? `evoe_birthday_badge_unlocked_${childId}` : null;

  const [hasCelebrationPending, setHasCelebrationPending] = useState(false);
  const [boostsUsed, setBoostsUsed] = useState<number>(0);

  // Analyse de la date de naissance
  const { isBirthdayToday, isCatchup, isEligibleThisYear } = useMemo(() => {
    if (!birthDate) {
      return { isBirthdayToday: false, isCatchup: false, isEligibleThisYear: false };
    }

    try {
      const bDate = new Date(birthDate);
      if (isNaN(bDate.getTime())) {
        return { isBirthdayToday: false, isCatchup: false, isEligibleThisYear: false };
      }

      const now = new Date();
      const todayDay = now.getDate();
      const todayMonth = now.getMonth();

      const bDay = bDate.getDate();
      const bMonth = bDate.getMonth();

      // 1. Jour J exact
      if (bDay === todayDay && bMonth === todayMonth) {
        return { isBirthdayToday: true, isCatchup: false, isEligibleThisYear: true };
      }

      // 2. Fenêtre de rattrapage (7 jours passés)
      // Anniversaire de cette année
      const bThisYear = new Date(currentYear, bMonth, bDay, 0, 0, 0, 0);
      const diffMs = now.getTime() - bThisYear.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // Si l'anniversaire est passé depuis 0 à 7 jours révolus
      if (diffDays >= 0 && diffDays <= 7) {
        return { isBirthdayToday: false, isCatchup: true, isEligibleThisYear: true };
      }

      return { isBirthdayToday: false, isCatchup: false, isEligibleThisYear: false };
    } catch {
      return { isBirthdayToday: false, isCatchup: false, isEligibleThisYear: false };
    }
  }, [birthDate, currentYear]);

  // Initialisation et vérification de célébration
  useEffect(() => {
    if (!storageCelebratedKey || !storageBoostsKey) return;

    const celebratedDate = localStorage.getItem(storageCelebratedKey);
    const usedCount = parseInt(localStorage.getItem(storageBoostsKey) || '0', 10);
    setBoostsUsed(isNaN(usedCount) ? 0 : usedCount);

    if (isEligibleThisYear) {
      if (!celebratedDate) {
        // Jamais fêté cette année -> déclenche la modale
        setHasCelebrationPending(true);
      } else {
        // Vérifier si la fête a été déclenchée AUJOURD'HUI (même date locale)
        const celebratedDay = new Date(celebratedDate).toDateString();
        const todayStr = new Date().toDateString();
        if (celebratedDay === todayStr) {
          // Encore actif aujourd'hui mais modale déjà vue
          setHasCelebrationPending(false);
        } else {
          setHasCelebrationPending(false);
        }
      }
    } else {
      setHasCelebrationPending(false);
    }
  }, [storageCelebratedKey, storageBoostsKey, isEligibleThisYear]);

  // La journée d'anniversaire est active si :
  // - L'utilisateur a fêté aujourd'hui OU s'il a une célébration en attente aujourd'hui
  const isBirthdayActive = useMemo(() => {
    if (!storageCelebratedKey) return false;
    const celebratedDate = localStorage.getItem(storageCelebratedKey);
    if (celebratedDate) {
      const celebratedDay = new Date(celebratedDate).toDateString();
      const todayStr = new Date().toDateString();
      return celebratedDay === todayStr;
    }
    return hasCelebrationPending;
  }, [storageCelebratedKey, hasCelebrationPending]);

  // Consommer un boost x2 (limité aux 3 premières missions)
  const consumeBoost = useCallback(() => {
    if (!storageBoostsKey || !isBirthdayActive) return;
    setBoostsUsed(prev => {
      if (prev >= 3) return prev;
      const next = prev + 1;
      localStorage.setItem(storageBoostsKey, String(next));
      return next;
    });
  }, [storageBoostsKey, isBirthdayActive]);

  // Valider la célébration (fermeture de la modale d'accueil)
  const acknowledgeCelebration = useCallback(() => {
    if (!storageCelebratedKey) return;
    localStorage.setItem(storageCelebratedKey, new Date().toISOString());
    if (storageBadgeKey) {
      localStorage.setItem(storageBadgeKey, 'true');
    }
    setHasCelebrationPending(false);
  }, [storageCelebratedKey, storageBadgeKey]);

  // Badge Voyageur Solaire débloqué
  const hasBirthdayBadge = useMemo(() => {
    if (!storageBadgeKey && !storageCelebratedKey) return false;
    if (storageBadgeKey && localStorage.getItem(storageBadgeKey) === 'true') return true;
    if (storageCelebratedKey && !!localStorage.getItem(storageCelebratedKey)) return true;
    return isBirthdayActive;
  }, [storageBadgeKey, storageCelebratedKey, isBirthdayActive]);

  const boostsRemaining = isBirthdayActive ? Math.max(0, 3 - boostsUsed) : 0;

  return {
    isBirthdayActive,
    isBirthdayToday,
    isCatchup,
    boostsRemaining,
    hasCelebrationPending,
    hasBirthdayBadge,
    acknowledgeCelebration,
    consumeBoost,
  };
}
