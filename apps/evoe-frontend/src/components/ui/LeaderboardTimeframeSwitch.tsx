import React from 'react';
import { Globe, Zap } from 'lucide-react';

export interface LeaderboardTimeframeSwitchProps {
  timeframe: 'all' | 'period';
  onChange: (timeframe: 'all' | 'period') => void;
  isMobile?: boolean;
}

export const LeaderboardTimeframeSwitch: React.FC<LeaderboardTimeframeSwitchProps> = ({
  timeframe,
  onChange,
  isMobile = false,
}) => {
  const isAll = timeframe === 'all';

  return (
    <div
      role="group"
      aria-label="Sélection de la vue du classement : Tout ou Période"
      title={
        isAll
          ? 'Classement cumulé depuis la rentrée (cliquez pour basculer sur la Période)'
          : 'Classement de la période active (cliquez pour basculer sur le cumul global)'
      }
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(5, 12, 24, 0.92)',
        border: isAll
          ? '1.2px solid rgba(16, 185, 129, 0.45)'
          : '1.2px solid rgba(6, 182, 212, 0.55)',
        borderRadius: '30px',
        padding: isMobile ? '2.5px 3px' : '3.5px 4px',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: isAll
          ? '0 4px 20px rgba(0, 0, 0, 0.65), 0 0 14px rgba(16, 185, 129, 0.22)'
          : '0 4px 20px rgba(0, 0, 0, 0.65), 0 0 14px rgba(6, 182, 212, 0.28)',
        userSelect: 'none',
        cursor: 'pointer',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        minWidth: isMobile ? '146px' : '196px',
        height: isMobile ? '30px' : '38px',
        boxSizing: 'border-box',
      }}
    >
      {/* Curseur glissant lumineux (Pilule active) */}
      <div
        style={{
          position: 'absolute',
          top: isMobile ? '2px' : '3px',
          bottom: isMobile ? '2px' : '3px',
          left: isAll ? (isMobile ? '2px' : '3px') : '50%',
          width: isMobile ? 'calc(50% - 2px)' : 'calc(50% - 3px)',
          borderRadius: '26px',
          background: isAll
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.98) 100%)'
            : 'linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(2, 132, 199, 0.98) 100%)',
          border: isAll
            ? '1px solid rgba(167, 243, 208, 0.8)'
            : '1px solid rgba(165, 243, 252, 0.8)',
          boxShadow: isAll
            ? '0 0 14px rgba(16, 185, 129, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.55)'
            : '0 0 14px rgba(6, 182, 212, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.55)',
          transition: 'all 0.28s cubic-bezier(0.34, 1.4, 0.64, 1)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Bouton Option 1 : "Tout" */}
      <button
        type="button"
        onClick={() => onChange('all')}
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '4px' : '6px',
          border: 'none',
          background: 'transparent',
          color: isAll ? '#ffffff' : '#94a3b8',
          fontSize: isMobile ? '0.70rem' : '0.80rem',
          fontWeight: isAll ? 800 : 600,
          fontFamily: '"Roboto", "Segoe UI", sans-serif',
          letterSpacing: '0.4px',
          padding: '0 8px',
          height: '100%',
          cursor: 'pointer',
          outline: 'none',
          textShadow: isAll
            ? '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(16, 185, 129, 0.6)'
            : 'none',
          transition: 'color 0.2s ease, text-shadow 0.2s ease',
        }}
      >
        <Globe
          size={isMobile ? 12 : 14}
          style={{
            filter: isAll ? 'drop-shadow(0 0 4px #ffffff)' : 'none',
            transition: 'filter 0.2s ease',
          }}
        />
        <span>Tout</span>
      </button>

      {/* Bouton Option 2 : "Période" */}
      <button
        type="button"
        onClick={() => onChange('period')}
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '4px' : '6px',
          border: 'none',
          background: 'transparent',
          color: !isAll ? '#ffffff' : '#94a3b8',
          fontSize: isMobile ? '0.70rem' : '0.80rem',
          fontWeight: !isAll ? 800 : 600,
          fontFamily: '"Roboto", "Segoe UI", sans-serif',
          letterSpacing: '0.4px',
          padding: '0 8px',
          height: '100%',
          cursor: 'pointer',
          outline: 'none',
          textShadow: !isAll
            ? '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(6, 182, 212, 0.6)'
            : 'none',
          transition: 'color 0.2s ease, text-shadow 0.2s ease',
        }}
      >
        <Zap
          size={isMobile ? 12 : 14}
          style={{
            filter: !isAll ? 'drop-shadow(0 0 4px #ffffff)' : 'none',
            transition: 'filter 0.2s ease',
          }}
        />
        <span>Période</span>
      </button>
    </div>
  );
};

export default LeaderboardTimeframeSwitch;
