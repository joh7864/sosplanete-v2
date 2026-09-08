export interface GlyphSegment {
  d: string;
  points?: { cx: number; cy: number }[];
}

export interface PeriodGlyphDefinition {
  id: number;
  name: string;
  letter: string;
  segments: GlyphSegment[];
}

/**
 * 12 Glyphes de la langue des humains de 2070 (Alphabet runique cybernétique de l'Arche)
 * Chaque glyphe est étagé de bas en haut pour un allumage progressif au fur et à mesure des Easter Eggs résolus.
 */
export const PERIOD_GLYPHS_2070: Record<number, PeriodGlyphDefinition> = {
  1: {
    id: 1,
    name: 'Le Sablier Quantique',
    letter: 'C',
    segments: [
      { d: 'M10 29 L22 29 L16 23 Z', points: [{ cx: 16, cy: 23 }] },
      { d: 'M14 23 L18 23 M16 23 L16 17', points: [{ cx: 16, cy: 17 }] },
      { d: 'M16 17 L10 11 L22 11 Z', points: [{ cx: 12, cy: 11 }, { cx: 20, cy: 11 }] },
    ],
  },
  2: {
    id: 2,
    name: "Le Triskel d'Éther",
    letter: 'H',
    segments: [
      { d: 'M16 30 L11 25 L16 21', points: [{ cx: 11, cy: 25 }] },
      { d: 'M16 30 L21 25 L16 21', points: [{ cx: 21, cy: 25 }] },
      { d: 'M16 21 L16 10 L22 14', points: [{ cx: 16, cy: 10 }, { cx: 22, cy: 14 }] },
    ],
  },
  3: {
    id: 3,
    name: 'Le Prisme Stellaire',
    letter: 'R',
    segments: [
      { d: 'M11 28 L21 28 L16 22', points: [{ cx: 11, cy: 28 }, { cx: 21, cy: 28 }] },
      { d: 'M16 22 L11 17 L21 17', points: [{ cx: 16, cy: 22 }] },
      { d: 'M16 17 L16 9 L12 13', points: [{ cx: 16, cy: 9 }] },
    ],
  },
  4: {
    id: 4,
    name: 'Le Vaisseau Solaire',
    letter: 'O',
    segments: [
      { d: 'M10 28 L16 25 L22 28', points: [{ cx: 16, cy: 25 }] },
      { d: 'M16 25 L10 18 L22 18', points: [{ cx: 10, cy: 18 }, { cx: 22, cy: 18 }] },
      { d: 'M16 18 L16 10 L19 13', points: [{ cx: 16, cy: 10 }] },
    ],
  },
  5: {
    id: 5,
    name: 'Le Nœud Temporel',
    letter: 'N',
    segments: [
      { d: 'M12 29 L20 29 L16 24', points: [{ cx: 16, cy: 24 }] },
      { d: 'M16 24 L10 17 L16 17', points: [{ cx: 10, cy: 17 }] },
      { d: 'M16 17 L22 17 L16 10', points: [{ cx: 22, cy: 17 }, { cx: 16, cy: 10 }] },
    ],
  },
  6: {
    id: 6,
    name: 'L’Arbre Binaire',
    letter: 'O',
    segments: [
      { d: 'M16 30 L16 23 L11 25', points: [{ cx: 11, cy: 25 }] },
      { d: 'M16 23 L21 25 L16 16', points: [{ cx: 21, cy: 25 }, { cx: 16, cy: 16 }] },
      { d: 'M16 16 L12 11 L16 9 L20 11', points: [{ cx: 16, cy: 9 }] },
    ],
  },
  7: {
    id: 7,
    name: 'La Spirale Quantique',
    letter: 'S',
    segments: [
      { d: 'M16 29 L10 24 L16 20', points: [{ cx: 10, cy: 24 }] },
      { d: 'M16 20 L22 16 L16 13', points: [{ cx: 22, cy: 16 }] },
      { d: 'M16 13 L12 9 L16 9', points: [{ cx: 16, cy: 9 }] },
    ],
  },
  8: {
    id: 8,
    name: 'L’Onde Céleste',
    letter: 'T',
    segments: [
      { d: 'M10 27 Q16 31 22 27', points: [{ cx: 16, cy: 29 }] },
      { d: 'M10 20 Q16 24 22 20', points: [{ cx: 16, cy: 22 }] },
      { d: 'M10 13 Q16 17 22 13 L16 9', points: [{ cx: 16, cy: 9 }] },
    ],
  },
  9: {
    id: 9,
    name: 'L’Hexa-Matrice',
    letter: 'E',
    segments: [
      { d: 'M11 27 L16 30 L21 27', points: [{ cx: 16, cy: 30 }] },
      { d: 'M11 27 L11 18 L16 21 L21 18 L21 27', points: [{ cx: 16, cy: 21 }] },
      { d: 'M11 18 L16 12 L21 18', points: [{ cx: 16, cy: 12 }] },
    ],
  },
  10: {
    id: 10,
    name: 'L’Ancre des Âges',
    letter: 'R',
    segments: [
      { d: 'M11 26 Q16 31 21 26', points: [{ cx: 16, cy: 28 }] },
      { d: 'M16 28 L16 15 M11 18 L21 18', points: [{ cx: 16, cy: 18 }] },
      { d: 'M16 15 L13 11 L16 9 L19 11', points: [{ cx: 16, cy: 9 }] },
    ],
  },
  11: {
    id: 11,
    name: 'L’Aura Solaire',
    letter: 'R',
    segments: [
      { d: 'M10 28 L16 24 L22 28', points: [{ cx: 16, cy: 24 }] },
      { d: 'M16 24 L16 16 M11 17 L21 17', points: [{ cx: 16, cy: 16 }] },
      { d: 'M16 16 L16 9 M13 11 L19 11', points: [{ cx: 16, cy: 9 }] },
    ],
  },
  12: {
    id: 12,
    name: 'L’Ouroboros 2070',
    letter: 'A',
    segments: [
      { d: 'M12 28 L16 30 L20 28', points: [{ cx: 16, cy: 30 }] },
      { d: 'M10 22 L14 18 L18 18 L22 22', points: [{ cx: 16, cy: 18 }] },
      { d: 'M14 14 L16 10 L18 14', points: [{ cx: 16, cy: 10 }] },
    ],
  },
};

/**
 * Récupère la définition du glyphe pour un index de période donné
 */
export function getPeriodGlyph(periodIndex: number): PeriodGlyphDefinition {
  const normIdx = ((Math.max(1, periodIndex) - 1) % 12) + 1;
  return PERIOD_GLYPHS_2070[normIdx] || PERIOD_GLYPHS_2070[1];
}
