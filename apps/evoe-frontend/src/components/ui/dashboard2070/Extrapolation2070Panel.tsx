import React from 'react';
import { Shield, Zap, Droplet, Trash2 } from 'lucide-react';
import { fmtMass, fmtVolume } from '../../../utils/format';

export interface Extrapolation2070PanelProps {
  showExtrapolation: boolean;
  setShowExtrapolation: (show: boolean) => void;
  extrapolation: any;
  eodN1Percent: number;
  eodNPercent: number;
  currentYear: number | string;
}

export const Extrapolation2070Panel: React.FC<Extrapolation2070PanelProps> = ({
  showExtrapolation,
  setShowExtrapolation,
  extrapolation,
  eodN1Percent,
  eodNPercent,
  currentYear,
}) => {
  return (
    <aside
      id="panel-extrapolation-2070"
      className={`evoe-glass-panel panel-left ${showExtrapolation ? 'mobile-active' : ''}`}
    >
      <div className="evoe-panel-title-row">
        <h2>Extrapolation 2070</h2>
        <button className="panel-close-btn" onClick={() => setShowExtrapolation(false)}>
          ×
        </button>
      </div>
      {extrapolation ? (
        <>
          {/* Jauge EOD N-1 vs N */}
          <div className="jauge-eod-container">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2px',
              }}
            >
              <h3>Jour de Dépassement Mondial</h3>
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                <span style={{ color: '#ef4444' }}>{extrapolation.dateDepassementSans?.slice(0, 5)}</span>
                <span style={{ color: '#a0aec0' }}>➔</span>
                <span style={{ color: '#00ffcc', textShadow: '0 0 5px rgba(0,255,204,0.4)' }}>
                  {extrapolation.dateDepassement?.slice(0, 5)}
                </span>
              </div>
            </div>
            <div className="jauge-eod-track">
              {/* Zone de gain écologique */}
              <div
                className="jauge-eod-gain"
                style={{
                  left: `${eodN1Percent}%`,
                  width: `${Math.max(2, eodNPercent - eodN1Percent)}%`,
                }}
              />
              {/* Marqueur EOD N-1 */}
              <div
                className="jauge-eod-marker n1"
                style={{ left: `${eodN1Percent}%` }}
                title={`Précédent : ${extrapolation.dateDepassementSans}`}
              />
              {/* Marqueur EOD N */}
              <div
                className="jauge-eod-marker n"
                style={{ left: `${eodNPercent}%` }}
                title={`Actuel : ${extrapolation.dateDepassement}`}
              />
            </div>
            <div className="jauge-eod-labels">
              <span>1er Juillet</span>
              <span
                style={{
                  color: '#00ffcc',
                  fontWeight: 'bold',
                  textShadow: '0 0 5px rgba(0,255,204,0.2)',
                }}
              >
                Timeline Reculée !
              </span>
              <span>30 Septembre</span>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(0,255,204,0.1)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#a0aec0', textTransform: 'uppercase' }}>
              Terres Nécessaires
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#00ffcc' }}>
              {extrapolation.nbPlanetes} 🌍
            </div>
          </div>

          {/* Grille d'impacts avec équivalences */}
          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-icon-wrapper">
                <Shield size={18} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Bouclier Cryo-Arctique</span>
                <span className="metric-value">{fmtMass(extrapolation.iceSavedKg || 0)} ❄️</span>
                <span className="metric-sub" style={{ color: '#10b981' }}>
                  ({fmtMass((extrapolation.co2RealTonnes || 0) * 1000)} de CO₂ évités en {currentYear})
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper">
                <Zap size={18} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Biomasse Génétique</span>
                {(extrapolation.forestFootballFields || 0) >= 1 ? (
                  <>
                    <span className="metric-value">
                      {(extrapolation.forestFootballFields || 0).toFixed(1)} zones 🍀
                    </span>
                    <span className="metric-sub" style={{ color: '#10b981' }}>
                      (soit {(extrapolation.forestFootballFields || 0).toFixed(1)} terrains de foot
                      préservés en {currentYear})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="metric-value">
                      {fmtMass((extrapolation.co2RealTonnes || 0) * 1000)} CO₂
                    </span>
                    <span className="metric-sub" style={{ color: '#10b981' }}>
                      (absorbés par la biomasse végétale en {currentYear})
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper">
                <Droplet size={18} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Réserves Hydriques</span>
                {(extrapolation.waterOlympicPools || 0) >= 1 ? (
                  <>
                    <span className="metric-value">
                      {(extrapolation.waterOlympicPools || 0).toFixed(1)} cuves 🧪
                    </span>
                    <span className="metric-sub" style={{ color: '#10b981' }}>
                      (soit {(extrapolation.waterOlympicPools || 0).toFixed(1)} piscines olympiques
                      préservées en {currentYear})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="metric-value">
                      {fmtVolume(extrapolation.waterRealLitres || 0)}
                    </span>
                    <span className="metric-sub" style={{ color: '#10b981' }}>
                      (d'eau potable épargnée en {currentYear})
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper">
                <Trash2 size={18} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Déchets Moléculaires</span>
                {(extrapolation.wasteGarbageTrucks || 0) >= 1 ? (
                  <>
                    <span className="metric-value">
                      {(extrapolation.wasteGarbageTrucks || 0).toFixed(1)} conteneurs 🔋
                    </span>
                    <span className="metric-sub" style={{ color: '#10b981' }}>
                      (soit {(extrapolation.wasteGarbageTrucks || 0).toFixed(1)} camions-poubelles évités
                      en {currentYear})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="metric-value">
                      {fmtMass(extrapolation.wasteRealKg || 0)}
                    </span>
                    <span className="metric-sub" style={{ color: '#10b981' }}>
                      (de résidus non produits en {currentYear})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '0.85rem' }}>
          Calcul de la projection temporelle...
        </p>
      )}
    </aside>
  );
};
