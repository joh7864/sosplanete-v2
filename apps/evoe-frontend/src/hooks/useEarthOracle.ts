import { useCallback } from 'react';

interface UseEarthOracleProps {
  currentYear: number;
  setEarthOracleLevel: (level: number) => void;
  setEarthOracleText: (text: string) => void;
  setEarthOracleTyping: (typing: boolean) => void;
}

export function useEarthOracle({
  currentYear,
  setEarthOracleLevel,
  setEarthOracleText,
  setEarthOracleTyping,
}: UseEarthOracleProps) {
  const getEarthOracleMessages = useCallback(
    (year: number): Record<number, string> => ({
      1: `La Terre de 2070 est silencieuse... Les archives des Agents Temporels ont été retrouvées dans les ruines. Leur courage a laissé une trace. Mais le temps manque encore. Revenez à ${year} — chaque action compte.`,
      2: `Les premiers signes de vie réapparaissent sur la Terre de 2070. Des forêts timides, de l’eau plus pure. La mission avance. Mais les Agents ont encore le pouvoir d’écrire la suite. Chaque geste en ${year} résonne ici.`,
      3: `La Terre de 2070 reprend son souffle. Les rivières coulent à nouveau, les villes verdissent. Les Agents de ${year} ont changé le cours du temps. Continuez — le futur vous entend.`,
      4: `En 2070, la Terre respire. Vos actions à ${year} ont réécrit notre avenir. Les écosystèmes se reconstituent, la biodiversité revient. Vous avez accompli ce que beaucoup croyaient impossible.`,
      5: "La vie a triomphé sur la Terre de 2070. Les Archives des Agents Temporels sont gravées dans l’histoire de l’humanité. Vous avez sauvé notre futur. Le voyage se termine ici — en victoire.",
    }),
    [],
  );

  const handleEarthClick = useCallback(
    (level: number) => {
      setEarthOracleLevel(level);
      setEarthOracleText('');
      setEarthOracleTyping(true);
      const fullText = getEarthOracleMessages(currentYear)[level] || '';
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setEarthOracleText(fullText.slice(0, i));
        if (i >= fullText.length) {
          clearInterval(interval);
          setEarthOracleTyping(false);
        }
      }, 28);
    },
    [currentYear, getEarthOracleMessages, setEarthOracleLevel, setEarthOracleText, setEarthOracleTyping],
  );

  return { handleEarthClick };
}
