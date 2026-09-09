import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Scroll, Terminal, CheckCircle2, Lock } from 'lucide-react';
import { getPeriodGlyph } from '../../utils/periodGlyphs2070';
import type { ChronoCycleItem } from '../../types/easterEgg';
export type ChronoPeriodItem = ChronoCycleItem;
export type { ChronoCycleItem };

interface ChronoEggModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasRosettaStone: boolean;
  isMetaEnigmaUnlocked: boolean;
  cycles?: ChronoCycleItem[];
  periods?: ChronoCycleItem[]; // Rétro-compatibilité
  loading?: boolean;
  onReplayPeriod: (periodId: number) => void;
  onOpenRosetta: () => void;
  onOpenTerminal: () => void;
}

export const ChronoEggModal: React.FC<ChronoEggModalProps> = ({
  isOpen,
  onClose,
  hasRosettaStone,
  isMetaEnigmaUnlocked,
  cycles,
  periods,
  loading = false,
  onReplayPeriod,
  onOpenRosetta,
  onOpenTerminal,
}) => {
  if (!isOpen) return null;

  const cycleList: ChronoCycleItem[] = cycles || periods || [];

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(3, 7, 18, 0.84)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 20000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1160px',
            maxHeight: '90vh',
            background: 'linear-gradient(175deg, rgba(15, 23, 42, 0.98) 0%, rgba(9, 13, 27, 0.99) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 45px rgba(245, 158, 11, 0.18)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: '#f1f5f9',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(69, 26, 3, 0.25), rgba(15, 23, 42, 0.95))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  boxShadow: 'inset 0 0 12px rgba(245, 158, 11, 0.2)',
                }}
              >
                ⚡
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.03em', margin: 0 }}>
                    Chrono-Egg : Archives Temporelles 2070
                  </h2>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      color: '#fcd34d',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                    }}
                  >
                    Méta-Énigme
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Journal des glyphes runiques découverts au fil des cycles de la saison
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Bouton vers la Pierre de Rosette */}
              {hasRosettaStone && (
                <button
                  type="button"
                  onClick={onOpenRosetta}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(129, 140, 248, 0.4)',
                    color: '#c7d2fe',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title="Consulter la Pierre de Rosette 2070 pour décoder les glyphes"
                >
                  <Scroll size={14} />
                  <span>Pierre de Rosette</span>
                </button>
              )}

              {/* Bouton Terminal de Décryptage */}
              <button
                type="button"
                onClick={onOpenTerminal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  backgroundColor: isMetaEnigmaUnlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  border: isMetaEnigmaUnlocked ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(245, 158, 11, 0.45)',
                  color: isMetaEnigmaUnlocked ? '#6ee7b7' : '#fcd34d',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title="Saisir le mot de passe secret final"
              >
                <Terminal size={14} />
                <span>{isMetaEnigmaUnlocked ? 'Vision 2050 Active' : 'Déchiffrer le Code'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxSizing: 'border-box',
            }}
          >
            {/* Bannière explicative */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.22)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <Sparkles size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.45' }}>
                <strong style={{ color: '#fcd34d', fontWeight: 800 }}>Protocole de l'Arche : </strong>
                Chaque cycle de 2 semaines recèle des Easter Eggs gravant progressivement un fragment de glyphe dans l'œuf.
                Pour relever un défi temporel non résolu,{' '}
                <strong style={{ color: '#fef08a' }}>cliquez directement sur l'œuf pour lancer l'énigme</strong> et reconstituer son glyphe !
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #fbbf24',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <span>Synchronisation avec les archives temporelles...</span>
              </div>
            ) : cycleList.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                Aucune archive temporelle enregistrée pour le moment.
              </div>
            ) : (
              /* Grille des 23 Cycles avec Œufs 3D */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                  gap: '12px',
                }}
              >
                {cycleList.map((item) => {
                  const glyphDef = getPeriodGlyph(item.glyphIndex || (item.cycleIndex - 1) % 12);
                  const isZero = item.solvedEggs === 0;
                  const isPartial = item.hasEgg && item.solvedEggs > 0 && item.solvedEggs < item.totalEggs;
                  const isFull = item.hasEgg && item.isCompleted;
                  const isLocked = item.isLocked || item.isFuture;
                  const isEmpty = !item.hasEgg && !isLocked;
                  const isActionable = !isLocked && (item.canReplay || (item.isCurrentCycle && !item.isCompleted));

                  // Nombre de segments de glyphe révélés
                  const revealedCount = isZero || isEmpty || isLocked
                    ? 0
                    : Math.max(1, Math.round((item.solvedEggs / item.totalEggs) * glyphDef.segments.length));
                  const activeSegments = glyphDef.segments.slice(0, revealedCount);

                  return (
                    <motion.div
                      key={item.cycleIndex}
                      whileHover={isActionable ? { scale: 1.03, y: -2 } : undefined}
                      onClick={
                        isActionable
                          ? () => {
                              onReplayPeriod(item.periodStartId || item.periodId || item.cycleIndex);
                            }
                          : undefined
                      }
                      style={{
                        position: 'relative',
                        padding: '12px',
                        borderRadius: '16px',
                        border: isLocked
                          ? '1px solid rgba(255, 255, 255, 0.06)'
                          : isEmpty
                            ? '1px solid rgba(148, 163, 184, 0.2)'
                            : isActionable
                              ? '1.5px solid rgba(245, 158, 11, 0.55)'
                              : isFull
                                ? '1.5px solid rgba(245, 158, 11, 0.45)'
                                : isPartial
                                  ? '1px solid rgba(245, 158, 11, 0.3)'
                                  : '1px solid rgba(255, 255, 255, 0.12)',
                        backgroundColor: isLocked
                          ? 'rgba(10, 15, 28, 0.4)'
                          : isEmpty
                            ? 'rgba(15, 23, 42, 0.35)'
                            : isFull
                              ? 'rgba(30, 41, 59, 0.75)'
                              : isPartial
                                ? 'rgba(30, 41, 59, 0.5)'
                                : 'rgba(15, 23, 42, 0.45)',
                        boxShadow: isActionable
                          ? '0 0 16px rgba(245, 158, 11, 0.22)'
                          : isFull
                            ? '0 0 16px rgba(245, 158, 11, 0.15)'
                            : 'none',
                        opacity: isLocked ? 0.55 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: isActionable ? 'pointer' : isLocked ? 'not-allowed' : 'default',
                        transition: 'all 0.2s ease',
                      }}
                      title={isLocked ? 'Cycle verrouillé' : isActionable ? "Cliquer sur l'œuf pour lancer l'énigme" : undefined}
                    >
                      {/* Badge Titre & État (Strictement Cycle <n> + Statut précis) */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: isLocked ? '#64748b' : '#cbd5e1' }}>
                          Cycle {item.cycleIndex}
                        </span>

                        {isLocked ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '9px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(100, 116, 139, 0.2)',
                              color: '#94a3b8',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                            }}
                          >
                            <Lock size={9} /> Verrouillé
                          </span>
                        ) : isEmpty ? (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(71, 85, 105, 0.25)',
                              color: '#94a3b8',
                              border: '1px solid rgba(148, 163, 184, 0.25)',
                            }}
                          >
                            Sans Easter Egg
                          </span>
                        ) : item.isCurrentCycle ? (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(245, 158, 11, 0.25)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.45)',
                            }}
                          >
                            En cours
                          </span>
                        ) : isFull ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '9px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: '#6ee7b7',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                            }}
                          >
                            <CheckCircle2 size={10} /> Résolu
                          </span>
                        ) : isPartial ? (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(245, 158, 11, 0.2)',
                              color: '#fcd34d',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                            }}
                          >
                            Fragmenté
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(244, 63, 94, 0.2)',
                              color: '#fda4af',
                              border: '1px solid rgba(244, 63, 94, 0.35)',
                            }}
                          >
                            Non résolu
                          </span>
                        )}
                      </div>

                      {/* Badge Artefact Majeur : Pierre de Rosette (uniquement si cycle non verrouillé) */}
                      {!isLocked && item.specialReward === 'ROSETTA_STONE' && (
                        <div style={{ marginBottom: '4px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: '8.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(99, 102, 241, 0.25)',
                              border: '1px solid #818cf8',
                              color: '#c7d2fe',
                              boxShadow: '0 0 8px rgba(99, 102, 241, 0.3)',
                              letterSpacing: '0.02em',
                            }}
                          >
                            <Scroll size={10} /> Pierre de Rosette
                          </span>
                        </div>
                      )}

                      {/* Représentation 3D de l'Œuf du Cycle */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
                        <div style={{ position: 'relative', width: '64px', height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg
                            viewBox="0 0 32 38"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ width: '100%', height: '100%', filter: isLocked ? 'none' : 'drop-shadow(0 6px 10px rgba(0,0,0,0.45))' }}
                          >
                            <defs>
                              <radialGradient
                                id={`shading-${item.cycleIndex}`}
                                cx="35%"
                                cy="28%"
                                r="65%"
                              >
                                <stop offset="0%" stopColor={isLocked ? '#334155' : isEmpty ? '#1e293b' : '#475569'} />
                                <stop offset="45%" stopColor={isLocked ? '#1e293b' : isEmpty ? '#0f172a' : '#1e293b'} />
                                <stop offset="85%" stopColor="#0f172a" />
                                <stop offset="100%" stopColor="#050811" />
                              </radialGradient>
                              <radialGradient
                                id={`zenith-${item.cycleIndex}`}
                                cx="32%"
                                cy="24%"
                                r="38%"
                              >
                                <stop offset="0%" stopColor="#ffffff" stopOpacity={isLocked ? '0.15' : isEmpty ? '0.2' : '0.45'} />
                                <stop offset="40%" stopColor="#94a3b8" stopOpacity={isLocked ? '0.05' : '0.15'} />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                              </radialGradient>
                            </defs>

                            {/* Ombre portée */}
                            <ellipse cx="16" cy="36.5" rx="10" ry="1.5" fill="#000000" opacity="0.5" />

                            {/* Coque 3D */}
                            <path
                              d="M16 2 C8 2 3 13 3 23 C3 30 8.5 36 16 36 C23.5 36 29 30 29 23 C29 13 24 2 16 2 Z"
                              fill={`url(#shading-${item.cycleIndex})`}
                              stroke={isLocked ? '#334155' : isEmpty ? '#475569' : isFull ? '#fbbf24' : isPartial ? '#f59e0b' : '#475569'}
                              strokeWidth={isLocked ? '0.8' : '1.2'}
                              strokeDasharray={isEmpty ? '3 2' : undefined}
                            />

                            {/* Reflet zénithal */}
                            <path
                              d="M16 2 C8 2 3 13 3 23 C3 30 8.5 36 16 36 C23.5 36 29 30 29 23 C29 13 24 2 16 2 Z"
                              fill={`url(#zenith-${item.cycleIndex})`}
                            />

                            {/* État 1: Verrouillé -> Cadenas gravé au centre */}
                            {isLocked && (
                              <g style={{ opacity: 0.65 }}>
                                <circle cx="16" cy="18" r="3.5" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
                                <rect x="12" y="19" width="8" height="6" rx="1.5" fill="#64748b" />
                              </g>
                            )}

                            {/* État 2: Cycle sans Easter Egg -> Halo neutre passif */}
                            {isEmpty && (
                              <g style={{ opacity: 0.45 }}>
                                <circle cx="16" cy="22" r="3" fill="#64748b" />
                              </g>
                            )}

                            {/* État 3: Énigme non résolue -> Point d'interrogation énigmatique */}
                            {!isLocked && !isEmpty && isZero && (
                              <g style={{ filter: 'drop-shadow(0 0 2px rgba(244, 63, 94, 0.4))' }}>
                                <text
                                  x="16"
                                  y="24"
                                  textAnchor="middle"
                                  fill="#cbd5e1"
                                  fontSize="14"
                                  fontWeight="900"
                                  fontFamily="monospace"
                                  opacity="0.75"
                                >
                                  ?
                                </text>
                              </g>
                            )}

                            {/* État 4 & 5: Segments de glyphe gravés (Partiel ou Complet) */}
                            {!isLocked && !isEmpty && activeSegments.length > 0 && (
                              <g style={{ filter: 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.8))' }}>
                                {activeSegments.map((seg, sIdx) => (
                                  <g key={sIdx}>
                                    <path
                                      d={seg.d}
                                      stroke="#fbbf24"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      fill="none"
                                    />
                                    <path
                                      d={seg.d}
                                      stroke="#ffffff"
                                      strokeWidth="0.7"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      fill="none"
                                    />
                                    {seg.points?.map((pt, pIdx) => (
                                      <circle key={pIdx} cx={pt.cx} cy={pt.cy} r="1.3" fill="#fbbf24" />
                                    ))}
                                  </g>
                                ))}
                              </g>
                            )}
                          </svg>
                        </div>
                      </div>

                      {/* Bas de Carte : Soit le Nom du Glyphe (si résolu), soit le Nom de l'Énigme */}
                      <div
                        style={{
                          marginTop: '8px',
                          paddingTop: '6px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!isLocked && !isEmpty && (
                          <div
                            style={{
                              fontWeight: 800,
                              color: isFull ? '#fbbf24' : '#f1f5f9',
                              fontSize: '0.72rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textAlign: 'center',
                              width: '100%',
                            }}
                            title={isFull ? `Glyphe : ${glyphDef.name}` : (item.eggTitle || 'Énigme temporelle')}
                          >
                            {isFull ? glyphDef.name : (item.eggTitle || 'Énigme temporelle')}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(10, 15, 30, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '0.78rem',
              color: '#94a3b8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#fbbf24',
                  boxShadow: '0 0 8px #fbbf24',
                }}
              />
              <span>
                {isMetaEnigmaUnlocked
                  ? 'Protocole Oméga validé : La Vision 2050 est disponible sur vos cartes de missions.'
                  : 'Reconstituez les glyphes de tous les cycles pour découvrir le mot de passe final.'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 20px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
