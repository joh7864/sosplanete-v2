/**
 * Catalogue centralisé des mini-jeux d'arcade (source de vérité unique).
 * Utilisé par l'admin (sélecteur d'artefact), le backend (validation / messages)
 * et le front EVOE (titres, sous-titres, couleurs). Le front ne garde que
 * l'association clé -> composant React.
 */
export interface ArcadeGameCatalogEntry {
  key: string;
  title: string;
  subtitle: string;
  year: number;
  color: string;
}

export const ARCADE_GAMES_CATALOG: ArcadeGameCatalogEntry[] = [
  {
    key: 'space-invaders',
    title: 'SPACE INVADERS',
    subtitle: 'Protocole des Anciens (Taito 1978)',
    year: 1978,
    color: '#00ff66',
  },
];

/** Préfixe stocké dans EvoeEasterEgg.specialReward pour un mini-jeu offert. */
export const ARCADE_REWARD_PREFIX = 'ARCADE_GAME:';

export function getArcadeGameEntry(key: string): ArcadeGameCatalogEntry | undefined {
  return ARCADE_GAMES_CATALOG.find((g) => g.key === key);
}

/** Extrait la clé du mini-jeu depuis une valeur specialReward, ou null. */
export function parseArcadeReward(specialReward?: string | null): string | null {
  if (!specialReward || !specialReward.startsWith(ARCADE_REWARD_PREFIX)) return null;
  const key = specialReward.slice(ARCADE_REWARD_PREFIX.length);
  return key || null;
}

/** Valide une valeur specialReward (NONE, artefacts temporels, ou mini-jeu connu). */
export function isValidSpecialReward(value?: string | null): boolean {
  if (!value || value === 'NONE' || value === 'CHRONO_EGG' || value === 'ROSETTA_STONE') return true;
  const key = parseArcadeReward(value);
  return !!key && !!getArcadeGameEntry(key);
}
