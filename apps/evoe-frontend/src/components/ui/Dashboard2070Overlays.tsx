import React from 'react';
import {
  Shield,
  Zap,
  Droplet,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { fmtMass, fmtVolume, getVibrantTeamColor } from '../../utils/format';
import { EvoeRadarMeter } from './EvoeRadarMeter';
import MobileContextCarousel from './MobileContextCarousel';

export interface Dashboard2070OverlaysProps {
  era: '2026' | '2070';
  extrapolation: any;
  showExtrapolation: boolean;
  setShowExtrapolation: React.Dispatch<React.SetStateAction<boolean>>;
  showRadar: boolean;
  setShowRadar: React.Dispatch<React.SetStateAction<boolean>>;
  eodN1Percent: number;
  eodNPercent: number;
  currentYear: number | string;
  handleResetPropulsion: () => void;
  isResettingPropulsion: boolean;
  dashboardStatus: any;
  selectedRadarTeamId: number | string | null;
  setSelectedRadarTeamId: React.Dispatch<React.SetStateAction<number | string | null>>;
  isMobile: boolean;
  selectedSector: string | null;
  chatOpen: boolean;
  selectedProfileId: number | null;
  evoeImgUrl: string;
}

export const Dashboard2070Overlays: React.FC<Dashboard2070OverlaysProps> = ({
  era,
  extrapolation,
  showExtrapolation,
  setShowExtrapolation,
  showRadar,
  setShowRadar,
  eodN1Percent,
  eodNPercent,
  currentYear,
  handleResetPropulsion,
  isResettingPropulsion,
  dashboardStatus,
  selectedRadarTeamId,
  setSelectedRadarTeamId,
  isMobile,
  selectedSector,
  chatOpen,
  selectedProfileId,
  evoeImgUrl,
}) => {
  if (era !== '2070') return null;

  return (
    <>
      <div className="evoe-dashboards-container">
        {/* Panel de Gauche : Extrapolation Temporelle */}
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

        {/* Panel de Droite : Course des Vaisseaux & Stase */}
        <aside
          id="panel-radar-2070"
          className={`evoe-glass-panel panel-right ${showRadar ? 'mobile-active' : ''}`}
        >
          <div className="evoe-panel-title-row">
            <h2>Radar Temporel</h2>
            <button
              className="evoe-reset-btn"
              onClick={handleResetPropulsion}
              disabled={isResettingPropulsion}
              title="Recalculer les niveaux technologiques"
            >
              <RefreshCw className={`icon-sm ${isResettingPropulsion ? 'spin-loading' : ''}`} />
            </button>
            <button className="panel-close-btn" onClick={() => setShowRadar(false)}>
              ×
            </button>
          </div>
          {dashboardStatus ? (
            <div className="vessels-list">
              {[...dashboardStatus.teams]
                .sort((a, b) => b.position - a.position)
                .map((t: any) => {
                  const isSelected =
                    selectedRadarTeamId !== null &&
                    selectedRadarTeamId !== undefined &&
                    String(selectedRadarTeamId) === String(t.id);
                  const vibrantColor = getVibrantTeamColor(t.color);
                  return (
                    <div
                      key={t.id}
                      id={`radar-team-${t.id}`}
                      className={`vessel-row ${isSelected ? 'highlighted-vessel' : ''}`}
                      onClick={() =>
                        setSelectedRadarTeamId((prev) =>
                          prev !== null && prev !== undefined && String(prev) === String(t.id) ? null : t.id,
                        )
                      }
                      style={{
                        cursor: 'pointer',
                        border: isSelected
                          ? `1.5px solid ${vibrantColor}`
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        borderLeft: isSelected ? `5px solid ${vibrantColor}` : `4px solid ${vibrantColor}`,
                        background: isSelected
                          ? `linear-gradient(135deg, ${vibrantColor}28 0%, rgba(10, 16, 28, 0.95) 60%, rgba(12, 18, 32, 0.98) 100%)`
                          : 'rgba(255, 255, 255, 0.02)',
                        boxShadow: isSelected
                          ? `0 0 22px ${vibrantColor}55, 0 0 45px ${vibrantColor}25, inset 0 0 14px ${vibrantColor}20`
                          : 'none',
                        transform: isSelected ? 'scale(1.025)' : 'none',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <div className="vessel-row-header">
                        <span
                          className="vessel-team-name"
                          style={{
                            color: isSelected ? vibrantColor : t.color || '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textShadow: isSelected ? `0 0 12px ${vibrantColor}` : 'none',
                          }}
                        >
                          {t.icon ? (
                            <img
                              src={`${evoeImgUrl}teams/${t.icon.split('/').pop()}`}
                              alt=""
                              style={{
                                width: '24px',
                                height: '24px',
                                objectFit: 'contain',
                                background: isSelected ? `${vibrantColor}30` : 'rgba(0,0,0,0.15)',
                                border: isSelected ? `1px solid ${vibrantColor}` : 'none',
                                borderRadius: '4px',
                                padding: '2px',
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: '1.2rem',
                                width: '24px',
                                height: '24px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              🛸
                            </span>
                          )}
                          {t.name}
                        </span>
                        <span
                          className="vessel-tech"
                          title={t.propulsionDesc}
                          style={{
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            ...(isSelected
                              ? {
                                  background: `${vibrantColor}25`,
                                  color: vibrantColor,
                                  border: `1px solid ${vibrantColor}80`,
                                  boxShadow: `0 0 10px ${vibrantColor}40`,
                                }
                              : {}),
                          }}
                        >
                          {t.propulsionType}
                        </span>
                      </div>

                      <div
                        className="vessel-stats-grid"
                        style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1px' }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            color: '#a0aec0',
                          }}
                          title="CO₂ évité (kg/semaine)"
                        >
                          <Shield size={14} style={{ color: '#00ffcc' }} />
                          <strong style={{ color: '#fff' }}>{fmtMass(t.co2 || 0)}</strong>
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            color: '#a0aec0',
                          }}
                          title="Eau épargnée (L)"
                        >
                          <Droplet size={14} style={{ color: '#00b3ff' }} />
                          <strong style={{ color: '#fff' }}>{fmtVolume(t.water || 0)}</strong>
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            color: '#a0aec0',
                          }}
                          title="Déchets évités (kg)"
                        >
                          <Trash2 size={14} style={{ color: '#ff9f43' }} />
                          <strong style={{ color: '#fff' }}>{fmtMass(t.waste || 0)}</strong>
                        </span>
                      </div>

                      {/* Deux mini-compteurs circulaires de contrôle (Régénération & Stabilité) */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-around',
                          padding: '0 20px',
                          marginTop: '0px',
                          marginBottom: '0px',
                        }}
                      >
                        <EvoeRadarMeter
                          value={t.position || 0}
                          label="REGEN."
                          color="#00ffcc"
                          id={`timeline-${t.id}`}
                          displayValue={`${Math.round(t.position || 0)}%`}
                          tooltipTitle="Régénération Planétaire"
                          tooltipText="Progression globale de l'arche vers 2070. Mesure l'énergie régénérée par les éco-actions du Codex (CO₂, Eau, Déchets)."
                          placement="left"
                        />
                        <EvoeRadarMeter
                          value={t.crewBioStability || 0}
                          label="STABILITÉ"
                          color={
                            t.crewBioStability < 40
                              ? '#ff3b3b'
                              : t.crewBioStability < 80
                                ? '#ff9f43'
                                : '#10b981'
                          }
                          id={`stability-${t.id}`}
                          tooltipTitle="Bio-Stabilité Temporelle"
                          tooltipText="Cohésion quantique et assiduité de l'équipage. Un score élevé protège le vaisseau contre les anomalies de stase."
                          placement="right"
                        />
                      </div>

                      {/* Alerte Paradoxe Temporel graduée et cohérente */}
                      {(() => {
                        const regen = t.position || 0;
                        const stability = t.crewBioStability || 0;
                        const points = t.points || 0;

                        if (points === 0 || regen === 0) {
                          return (
                            <div
                              className="vessel-paradox-warning"
                              style={{
                                color: '#a0aec0',
                                animation: 'none',
                                opacity: 0.85,
                                marginTop: '2px',
                              }}
                            >
                              <AlertTriangle
                                size={13}
                                style={{ filter: 'drop-shadow(0 0 2px rgba(160,174,192,0.4))' }}
                              />
                              <span style={{ letterSpacing: '-0.1px' }}>
                                En attente des premières impulsions du Codex.
                              </span>
                            </div>
                          );
                        } else if (regen >= 75 && stability >= 70) {
                          return (
                            <div
                              className="vessel-paradox-warning"
                              style={{
                                color: '#10b981',
                                animation: 'none',
                                opacity: 0.95,
                                marginTop: '2px',
                              }}
                            >
                              <CheckCircle2
                                size={13}
                                style={{ filter: 'drop-shadow(0 0 2px rgba(16,185,129,0.5))' }}
                              />
                              <span style={{ letterSpacing: '-0.1px' }}>
                                Ligne temporelle optimale et flux hautement régénéré.
                              </span>
                            </div>
                          );
                        } else if (regen >= 40 || stability >= 50) {
                          return (
                            <div
                              className="vessel-paradox-warning"
                              style={{ color: '#ffd700', animation: 'none', marginTop: '2px' }}
                            >
                              <CheckCircle2
                                size={13}
                                style={{ filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.4))' }}
                              />
                              <span style={{ letterSpacing: '-0.1px' }}>
                                Progression stable — Bon rythme d'impulsions.
                              </span>
                            </div>
                          );
                        } else if (regen >= 15 || stability >= 25) {
                          return (
                            <div
                              className="vessel-paradox-warning"
                              style={{ color: '#ff9f43', marginTop: '2px' }}
                            >
                              <AlertTriangle
                                size={13}
                                style={{ filter: 'drop-shadow(0 0 2px rgba(255,159,67,0.4))' }}
                              />
                              <span style={{ letterSpacing: '-0.1px' }}>
                                Légère désynchronisation temporelle détectée.
                              </span>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              className="vessel-paradox-warning"
                              style={{ color: '#ff3b3b', marginTop: '2px' }}
                            >
                              <AlertOctagon
                                size={13}
                                style={{ filter: 'drop-shadow(0 0 3px rgba(255,59,59,0.5))' }}
                              />
                              <span style={{ letterSpacing: '-0.1px' }}>
                                Instabilité de la stase — Impulsions urgentes requises.
                              </span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  );
                })}
            </div>
          ) : (
            <p style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '0.85rem' }}>
              Verrouillage des signatures thermiques des vaisseaux...
            </p>
          )}
        </aside>
      </div>

      {/* Carrousel de contrôle mobile en 2070 */}
      {isMobile &&
        !selectedSector &&
        !chatOpen &&
        !selectedProfileId &&
        !showExtrapolation &&
        !showRadar && (
          <MobileContextCarousel
            extrapolation={extrapolation}
            dashboardStatus={dashboardStatus}
            setShowExtrapolation={setShowExtrapolation}
            setShowRadar={setShowRadar}
          />
        )}

      {/* Dock de contrôle mobile au bas de l'écran (affiché uniquement sur desktop/tablette paysage) */}
      {!isMobile && (
        <div className="evoe-mobile-dock">
          <button
            className={`dock-btn ${showExtrapolation ? 'active' : ''}`}
            onClick={() => setShowExtrapolation((v) => !v)}
          >
            📊 Extrapolation 2070
          </button>
          <button
            className={`dock-btn ${showRadar ? 'active' : ''}`}
            onClick={() => setShowRadar((v) => !v)}
          >
            📡 Radar Temporel
          </button>
        </div>
      )}

      {/* Overlay d'arrière-plan pour fermer au clic en dehors */}
      {(showExtrapolation || showRadar) && (
        <div
          className="evoe-mobile-overlay"
          onClick={() => {
            setShowExtrapolation(false);
            setShowRadar(false);
          }}
        />
      )}
    </>
  );
};
