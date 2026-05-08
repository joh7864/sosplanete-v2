'use client';

import { useState, useEffect } from 'react';
import { getAuthData, setAuthData } from '@/utils/storage';

/**
 * Hook partagé pour la gestion de l'année scolaire active.
 *
 * Remplace le pattern manuel :
 *   const [schoolYear, setSchoolYear] = useState(() => getAuthData('active_school_year') || '2024-2025');
 *   window.addEventListener('storage', () => setSchoolYear(...));
 *   window.dispatchEvent(new Event('storage'));
 *
 * Usage :
 *   const { schoolYear, setSchoolYear } = useSchoolYear();
 *
 * La propagation de la valeur entre composants est gérée de façon fiable
 * par un event custom 'schoolYearChange' (compatible même-onglet).
 */

const SCHOOL_YEAR_KEY = 'active_school_year';
const DEFAULT_SCHOOL_YEAR = '2024-2025';
const SCHOOL_YEAR_EVENT = 'schoolYearChange';

export function useSchoolYear() {
  const [schoolYear, setSchoolYearState] = useState<string>(() => {
    return getAuthData(SCHOOL_YEAR_KEY) || DEFAULT_SCHOOL_YEAR;
  });

  useEffect(() => {
    const handleSchoolYearChange = (e: CustomEvent<string>) => {
      setSchoolYearState(e.detail);
    };

    window.addEventListener(SCHOOL_YEAR_EVENT, handleSchoolYearChange as EventListener);
    return () => window.removeEventListener(SCHOOL_YEAR_EVENT, handleSchoolYearChange as EventListener);
  }, []);

  const setSchoolYear = (year: string) => {
    setAuthData(SCHOOL_YEAR_KEY, year);
    setSchoolYearState(year);
    // Émettre un event custom fiable (fonctionne dans le même onglet contrairement à 'storage')
    window.dispatchEvent(new CustomEvent<string>(SCHOOL_YEAR_EVENT, { detail: year }));
  };

  return { schoolYear, setSchoolYear };
}
