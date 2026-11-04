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

/**
 * Formate le temps restant avant expiration d'un défi (ex: '2j 4h', '3h 12m', '45m', 'Expiré').
 */
export const formatRemainingTime = (expiresAtStr?: string | null): string | null => {
  if (!expiresAtStr) return null;
  const diffMs = new Date(expiresAtStr).getTime() - Date.now();
  if (diffMs <= 0) return 'Expiré';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}j ${remHours}h`;
  }
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

