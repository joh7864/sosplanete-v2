'use client';

import { useState, useEffect } from 'react';
import { getAuthData } from '@/utils/storage';

/**
 * Hook qui résout l'`instanceYearId` depuis un couple `(instanceId, schoolYear)`.
 *
 * Usage :
 *   const { instanceYearId, loading } = useInstanceYear(instanceId, schoolYear);
 *
 * - Retourne `null` tant que la résolution est en cours ou si le couple est invalide.
 * - Met en cache le résultat en mémoire pour éviter les appels répétés.
 * - Se réinitialise automatiquement si `instanceId` ou `schoolYear` changent.
 */

const cache = new Map<string, number>();

export function useInstanceYear(
  instanceId: number | null | undefined,
  schoolYear: string | null | undefined,
) {
  const [instanceYearId, setInstanceYearId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instanceId || !schoolYear) {
      setInstanceYearId(null);
      return;
    }

    const key = `${instanceId}__${schoolYear}`;

    // Cache hit — pas de fetch
    if (cache.has(key)) {
      setInstanceYearId(cache.get(key)!);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/instances/${instanceId}/year?schoolYear=${encodeURIComponent(schoolYear)}`,
      { headers: { Authorization: `Bearer ${getAuthData('access_token')}` } },
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { id: number }) => {
        if (!cancelled) {
          cache.set(key, data.id);
          setInstanceYearId(data.id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[useInstanceYear] Résolution échouée:', err);
          setError(err.message);
          setInstanceYearId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [instanceId, schoolYear]);

  return { instanceYearId, loading, error };
}
