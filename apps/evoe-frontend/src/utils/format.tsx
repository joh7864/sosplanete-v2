import React from 'react';

/**
 * Parse les balises **texte** en gras dans une chaîne.
 */
export const parseBold = (text: string): React.ReactNode => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

/**
 * Formateur intelligent de masse : kg -> t -> kt.
 */
export const fmtMass = (kg: number): string => {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(2)} kt`;
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`;
  return `${kg.toFixed(1)} kg`;
};

/**
 * Formateur intelligent de volume : L -> m³ -> ML.
 */
export const fmtVolume = (litres: number): string => {
  if (litres >= 1_000_000) return `${(litres / 1_000_000).toFixed(1)} ML`;
  if (litres >= 1000) return `${(litres / 1000).toFixed(1)} m³`;
  return `${litres.toFixed(0)} L`;
};

/**
 * Harmonisation des couleurs d'équipe pour une lisibilité optimale sur fond sombre.
 */
export const getVibrantTeamColor = (colorStr: string | null | undefined): string => {
  if (!colorStr) return '#00ffcc';
  const c = colorStr.trim().toLowerCase();
  if (
    c.includes('40916c') ||
    c.includes('2d6a4f') ||
    c.includes('52b788') ||
    c.includes('74c69d') ||
    c.includes('green') ||
    c.includes('2e7d32') ||
    c.includes('388e3c')
  ) {
    return '#10b981';
  }
  return colorStr;
};
