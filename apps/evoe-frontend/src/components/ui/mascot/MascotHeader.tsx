import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export interface MascotHeaderProps {
  currentTitle: string;
  isLandscapeMobile: boolean;
  isReplayMode: boolean;
  replayedCycleIndex?: number;
  onExitReplay?: () => void;
  onClose: () => void;
  timeLeft: number;
  effectiveRewardPointsIT: number;
  showRolloverWarning?: boolean;
  unsolvedRolloverCount?: number;
}

export const MascotHeader: React.FC<MascotHeaderProps> = ({
  currentTitle,
  isLandscapeMobile,
  isReplayMode,
  replayedCycleIndex,
  onExitReplay,
  onClose,
  timeLeft,
  effectiveRewardPointsIT,
  showRolloverWarning,
  unsolvedRolloverCount,
}) => {
  return (
    <>
      {/* En-tête de la bulle : Titre aligné à gauche et points IT alignés à droite */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: isLandscapeMobile ? '8px' : '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          <h4
            style={{
              margin: 0,
              fontSize: isLandscapeMobile ? '0.95rem' : '1.05rem',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.2px',
            }}
          >
            {currentTitle}
          </h4>
          {isReplayMode && (
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#b45309',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ⏳ Rattrapage Cycle {replayedCycleIndex}
            </span>
          )}
          {isReplayMode && onExitReplay && (
            <button
              type="button"
              onClick={() => {
                onExitReplay();
                onClose();
              }}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                backgroundColor: 'rgba(241, 245, 249, 0.9)',
                color: '#475569',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Quitter le rattrapage et revenir au cycle en cours"
            >
              Retour cycle actif
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.74rem',
              fontWeight: 800,
              color: timeLeft <= 15 ? '#ef4444' : '#64748b',
              background: timeLeft <= 15 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(100, 116, 139, 0.12)',
              padding: '3px 8px',
              borderRadius: '8px',
              border: `1px solid ${timeLeft <= 15 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(100, 116, 139, 0.25)'}`,
              whiteSpace: 'nowrap',
            }}
            title="Temps restant avant fermeture automatique (se réinitialise à 60s à chaque frappe)"
          >
            ⏱️ {timeLeft}s
          </span>
          <span
            style={{
              background: '#fef3c7',
              color: '#b45309',
              fontSize: '0.78rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '12px',
              border: '1.5px solid #fde68a',
              whiteSpace: 'nowrap',
            }}
          >
            +{effectiveRewardPointsIT} IT
          </span>
          <button
            type="button"
            onClick={onClose}
            title="Fermer la bulle"
            style={{
              background: 'rgba(241, 245, 249, 0.95)',
              border: '1.5px solid #cbd5e1',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              padding: 0,
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = '#fca5a5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(241, 245, 249, 0.95)';
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Alerte Retard Accumulation (conditionnée : retard > 4 uniquement) */}
      {showRolloverWarning && unsolvedRolloverCount && unsolvedRolloverCount > 4 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1.5px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '8px 12px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#b91c1c',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          <AlertTriangle size={15} color="#dc2626" />
          <span>
            Anomalies accumulées : <strong>{unsolvedRolloverCount} œufs non résolus</strong> en attente de déchiffrage !
          </span>
        </div>
      )}
    </>
  );
};
