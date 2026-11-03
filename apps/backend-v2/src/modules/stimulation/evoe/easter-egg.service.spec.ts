import { EasterEggDifficulty } from '@prisma/client';
import { EasterEggService } from './easter-egg.service';

describe('EasterEggService - Unit Tests', () => {
  let service: EasterEggService;

  beforeEach(() => {
    // Service instancié avec mocks pour les dépendances
    service = new EasterEggService({} as any, {} as any);
  });

  describe('normalizeAnswer', () => {
    it('devrait supprimer les accents (NFD)', () => {
      expect(service.normalizeAnswer('Élégant')).toBe('elegant');
      expect(service.normalizeAnswer('Forêt tropicale')).toBe('foret tropicale');
    });

    it('devrait passer en minuscules et supprimer les espaces multiples', () => {
      expect(service.normalizeAnswer('   SOLAR   SYSTEM  ')).toBe('solar system');
      expect(service.normalizeAnswer('CHRONOS-2070')).toBe('chronos 2070');
      expect(service.normalizeAnswer('PAPILLON_BLEU')).toBe('papillon bleu');
    });
  });

  describe('getRequiredPlayersForEgg', () => {
    it('devrait appliquer le barème par difficulté intrinsèque', () => {
      expect(service.getRequiredPlayersForEgg({ complexity: EasterEggDifficulty.EASY })).toBe(5);
      expect(service.getRequiredPlayersForEgg({ complexity: EasterEggDifficulty.MEDIUM })).toBe(3);
      expect(service.getRequiredPlayersForEgg({ complexity: EasterEggDifficulty.HARD })).toBe(2);
      expect(service.getRequiredPlayersForEgg({ complexity: EasterEggDifficulty.LEGENDARY })).toBe(1);
    });

    it('devrait plafonner le quota à l effectif réel de l équipe', () => {
      // Équipe de 2 joueurs sur un œuf EASY (nominal 5) => plafonné à 2
      expect(service.getRequiredPlayersForEgg({ complexity: EasterEggDifficulty.EASY }, 2)).toBe(2);
      // Équipe de 1 joueur sur un œuf MEDIUM (nominal 3) => plafonné à 1
      expect(service.getRequiredPlayersForEgg({ complexity: EasterEggDifficulty.MEDIUM }, 1)).toBe(1);
      // Équipe de 10 joueurs sur un œuf HARD (nominal 2) => reste à 2
      expect(service.getRequiredPlayersForEgg({ complexity: EasterEggDifficulty.HARD }, 10)).toBe(2);
    });
  });

  describe('computeDefaultPauseCycles & getEffectivePauseCycles', () => {
    it('devrait retourner un tableau vide si totalCycles < 5', () => {
      expect(service.computeDefaultPauseCycles(3)).toEqual([]);
    });

    it('devrait distribuer harmonieusement les pauses pour une saison complète (ex: 23 cycles)', () => {
      const pauses = service.computeDefaultPauseCycles(23);
      expect(pauses.length).toBeGreaterThan(0);
      expect(pauses.every((p) => p >= 1 && p <= 23)).toBe(true);
    });

    it('devrait respecter la configuration admin si définie', () => {
      const custom = service.getEffectivePauseCycles({ easterEggPauseCycles: [3, 7, 12] }, 23);
      expect(custom).toEqual([3, 7, 12]);
    });

    it('devrait utiliser la proposition dynamique si easterEggPauseCycles est vide', () => {
      const defaultPauses = service.getEffectivePauseCycles({ easterEggPauseCycles: [] }, 23);
      expect(defaultPauses).toEqual(service.computeDefaultPauseCycles(23));
    });
  });
});
