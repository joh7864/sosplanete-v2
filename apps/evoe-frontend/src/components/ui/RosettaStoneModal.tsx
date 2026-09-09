import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scroll, Terminal, Sparkles, Lock, Play, CheckCircle2 } from 'lucide-react';
import { PERIOD_GLYPHS_2070 } from '../../utils/periodGlyphs2070';

interface RosettaStoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTerminal: () => void;
  periods?: any[];
  onResolvePeriod?: (periodId: number) => void;
}

export const RosettaStoneModal: React.FC<RosettaStoneModalProps> = ({
  isOpen,
  onClose,
  onOpenTerminal,
  periods = [],
  onResolvePeriod,
}) => {
  const [selectedGlyphId, setSelectedGlyphId] = React.useState<number | null>(null);

  if (!isOpen) return null;

  const glyphList = Object.values(PERIOD_GLYPHS_2070);

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
          boxSizing: 'border-box',
          pointerEvents: 'auto',
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
            maxWidth: '840px',
            maxHeight: '90vh',
            background: 'linear-gradient(175deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 14, 30, 0.99) 100%)',
            border: '1.5px solid rgba(99, 102, 241, 0.45)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 45px rgba(99, 102, 241, 0.2)',
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
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(49, 46, 129, 0.3), rgba(15, 23, 42, 0.95))',
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
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(129, 140, 248, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a5b4fc',
                }}
              >
                <Scroll size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.03em', margin: 0 }}>
                    La Pierre de Rosette 2070
                  </h2>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      color: '#c7d2fe',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      border: '1px solid rgba(129, 140, 248, 0.35)',
                    }}
                  >
                    Table de Décodage
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Matrice linguistique de l'Arche : traduction des runes quantiques en alphabet contemporain
                </p>
              </div>
            </div>

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

          {/* Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxSizing: 'border-box',
            }}
          >
            {/* Notice */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '16px',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(129, 140, 248, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '0.8rem',
                color: '#cbd5e1',
                lineHeight: '1.5',
              }}
            >
              <Sparkles size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#c7d2fe' }}>Guide de Transcription :</strong> Chaque glyphe découvert sur la coque d'un œuf temporel correspond à une lettre de notre alphabet. En assemblant les symboles dans l'ordre chronologique des périodes, vous obtiendrez le mot de passe secret de l'Arche !
              </div>
            </div>

            {/* Matrice des Glyphes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '14px',
              }}
            >
              {glyphList.map((g) => {
                const isSelected = selectedGlyphId === g.id;
                const isDiscovered = periods && periods.length > 0
                  ? periods.some((p: any) => (p.glyphIndex === g.id - 1 || p.glyphIndex === g.id) && p.isCompleted)
                  : false;

                // Trouver un cycle associé pour décrypter ce glyphe si non résolu
                const targetPeriod = periods && periods.length > 0
                  ? (periods.find((p: any) => (p.glyphIndex === g.id - 1 || p.glyphIndex === g.id) && p.hasEgg && !p.isCompleted && !p.isLocked) ||
                     periods.find((p: any) => (p.glyphIndex === g.id - 1 || p.glyphIndex === g.id) && p.hasEgg && !p.isLocked) ||
                     periods.find((p: any) => (p.glyphIndex === g.id - 1 || p.glyphIndex === g.id)))
                  : null;

                const canLaunchEnigma = !isDiscovered && targetPeriod && targetPeriod.hasEgg && !targetPeriod.isLocked;

                return (
                  <motion.div
                    key={g.id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (canLaunchEnigma && onResolvePeriod) {
                        onClose();
                        onResolvePeriod(targetPeriod.periodId);
                      } else {
                        setSelectedGlyphId(isSelected ? null : g.id);
                      }
                    }}
                    style={{
                      padding: '14px',
                      borderRadius: '16px',
                      border: isDiscovered
                        ? (isSelected ? '1.5px solid #818cf8' : '1px solid rgba(129, 140, 248, 0.35)')
                        : '1px dashed rgba(148, 163, 184, 0.25)',
                      backgroundColor: isDiscovered
                        ? (isSelected ? 'rgba(49, 46, 129, 0.6)' : 'rgba(30, 41, 59, 0.6)')
                        : 'rgba(15, 23, 42, 0.6)',
                      boxShadow: isDiscovered && isSelected
                        ? '0 0 20px rgba(99, 102, 241, 0.35)'
                        : 'none',
                      cursor: canLaunchEnigma ? 'pointer' : 'default',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      position: 'relative',
                      opacity: isDiscovered ? 1 : 0.85,
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Badge d'état du glyphe */}
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      {isDiscovered ? (
                        <span
                          title="Glyphe décrypté"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                          }}
                        >
                          <CheckCircle2 size={11} />
                        </span>
                      ) : (
                        <span
                          title="Glyphe scellé"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(148, 163, 184, 0.1)',
                            color: '#94a3b8',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                          }}
                        >
                          <Lock size={10} />
                        </span>
                      )}
                    </div>

                    {/* Dessin SVG du glyphe ou silhouette masquée */}
                    <div
                      style={{
                        width: '56px',
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        borderRadius: '12px',
                        border: isDiscovered ? '1px solid rgba(129, 140, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '4px',
                        position: 'relative',
                      }}
                    >
                      {isDiscovered ? (
                        <svg viewBox="0 0 32 38" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                          {g.segments.map((seg, sIdx) => (
                            <g key={sIdx}>
                              <path
                                d={seg.d}
                                stroke="#818cf8"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                              <path
                                d={seg.d}
                                stroke="#ffffff"
                                strokeWidth="0.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                              {seg.points?.map((pt, pIdx) => (
                                <circle key={pIdx} cx={pt.cx} cy={pt.cy} r="1.5" fill="#a5b4fc" />
                              ))}
                            </g>
                          ))}
                        </svg>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', opacity: 0.7, fontFamily: 'monospace' }}>
                            ?
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Équivalent Alphabet ou Masque */}
                    <div style={{ textAlign: 'center', width: '100%' }}>
                      {isDiscovered ? (
                        <>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'monospace', color: '#fcd34d' }}>
                            = {g.letter}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginTop: '2px', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto' }}>
                            {g.name}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'monospace', color: '#64748b' }}>
                            = ?
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '2px', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto' }}>
                            Non décrypté
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bouton-icône avec tooltip pour résoudre directement l'œuf si non décodé */}
                    {!isDiscovered && (
                      <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'center' }}>
                        <button
                          type="button"
                          title={
                            canLaunchEnigma
                              ? `Décrypter ce glyphe (Résoudre l'énigme du Cycle ${targetPeriod?.cycleIndex})`
                              : targetPeriod?.isLocked
                              ? 'Cycle futur verrouillé'
                              : 'Cycle non disponible'
                          }
                          disabled={!canLaunchEnigma}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canLaunchEnigma && onResolvePeriod) {
                              onClose();
                              onResolvePeriod(targetPeriod.periodId);
                            }
                          }}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            backgroundColor: canLaunchEnigma ? '#4f46e5' : 'rgba(255, 255, 255, 0.05)',
                            border: canLaunchEnigma ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: canLaunchEnigma ? '#ffffff' : '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: canLaunchEnigma ? 'pointer' : 'not-allowed',
                            boxShadow: canLaunchEnigma ? '0 0 12px rgba(79, 70, 229, 0.45)' : 'none',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (canLaunchEnigma) {
                              e.currentTarget.style.backgroundColor = '#6366f1';
                              e.currentTarget.style.transform = 'scale(1.08)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (canLaunchEnigma) {
                              e.currentTarget.style.backgroundColor = '#4f46e5';
                              e.currentTarget.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          {canLaunchEnigma ? <Play size={13} fill="currentColor" /> : <Lock size={12} />}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(10, 15, 30, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ color: '#94a3b8' }}>
              Vous avez identifié le mot de passe complet ?
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTerminal();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#4f46e5',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  boxShadow: '0 0 15px rgba(79, 70, 229, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Terminal size={15} />
                <span>Ouvrir le Terminal de Décryptage</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
