/**
 * Formate les impacts écologiques selon les règles du métier :
 * - Pas de chiffre après la virgule (arrondi à l'unité)
 * - CO2 : si > 1000kg, passage en tCO2e
 * - Déchets : si > 1000kg, passage en tonnes (t)
 * - Eau : si > 1000L, passage en m3
 */
export const formatEcoImpact = (value: number, type: 'co2' | 'water' | 'waste', decimals: number = 0, forceHighUnit: boolean = false): string => {
  if (type === 'co2') {
    if (forceHighUnit || value >= 1000) {
      return `${(value / 1000).toFixed(decimals)} tCO2e`;
    }
    return `${value.toFixed(decimals)} kgCo2e`;
  }
  
  if (type === 'waste') {
    if (forceHighUnit || value >= 1000) {
      return `${(value / 1000).toFixed(decimals)} t`;
    }
    return `${value.toFixed(decimals)} kg`;
  }
  
  if (type === 'water') {
    if (forceHighUnit || value >= 1000) {
      return `${(value / 1000).toFixed(decimals)} m³`;
    }
    return `${value.toFixed(decimals)} L`;
  }
  
  return value.toFixed(decimals);
};
