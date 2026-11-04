import { EasterEggDifficulty } from '@prisma/client';
import { isValidSpecialReward } from '../../../arcade/arcade-games.catalog';
import { BadRequestException } from '@nestjs/common';

/**
 * Normalise une chaîne de réponse pour comparaison insensible :
 * - Suppression des accents (décomposition NFD)
 * - Conversion en minuscules
 * - Remplacement des séparateurs multiples (tirets, underscores, espaces répétés) par un simple espace
 * - Suppression des espaces en début et fin de chaîne
 */
export function normalizeAnswer(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s\-_]+/g, ' ')
    .trim();
}

/**
 * Calcule dynamiquement la répartition par défaut des cycles de pause
 * en fonction du nombre total de cycles T de la saison (~17% de pauses harmonieusement réparties).
 */
export function computeDefaultPauseCycles(totalCycles: number): number[] {
  if (totalCycles < 5) return [];
  const pauseCount = Math.max(1, Math.round(totalCycles * 0.17));
  const interval = totalCycles / (pauseCount + 1);
  return Array.from({ length: pauseCount }, (_, i) => Math.round(interval * (i + 1)));
}

/**
 * Récupère la liste effective des cycles de pause (1-indexed) :
 * - Utilise la configuration de l'instance si définie
 * - Sinon applique le calcul dynamique selon le nombre total de cycles
 */
export function getEffectivePauseCycles(
  instanceYear: { easterEggPauseCycles?: number[] | null },
  totalCycles: number,
): number[] {
  if (instanceYear?.easterEggPauseCycles && instanceYear.easterEggPauseCycles.length > 0) {
    return instanceYear.easterEggPauseCycles;
  }
  return computeDefaultPauseCycles(totalCycles);
}

export function getRequiredPlayersForEgg(
  egg?: { complexity?: EasterEggDifficulty | null } | null,
  teamTotalPlayers?: number,
  defaultFallback = 2,
): number {
  const difficultyQuotaMap: Record<EasterEggDifficulty, number> = {
    [EasterEggDifficulty.EASY]: 5,
    [EasterEggDifficulty.MEDIUM]: 3,
    [EasterEggDifficulty.HARD]: 2,
    [EasterEggDifficulty.LEGENDARY]: 1,
  };
  const nominal = (egg?.complexity && difficultyQuotaMap[egg.complexity]) || defaultFallback;
  if (teamTotalPlayers && teamTotalPlayers > 0) {
    return Math.max(1, Math.min(nominal, teamTotalPlayers));
  }
  return Math.max(1, nominal);
}

export function assertValidSpecialReward(value?: string | null) {
  if (!isValidSpecialReward(value)) {
    throw new BadRequestException(`Artefact offert invalide : ${value}`);
  }
}
