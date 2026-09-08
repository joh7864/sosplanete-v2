import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertCircle, RotateCcw, Scroll, Terminal, CheckCircle2, Lock } from 'lucide-react';
import { getPeriodGlyph } from '../../utils/periodGlyphs2070';

export interface ChronoPeriodItem {
  periodId: number;
  periodIndex: number;
  startDate: string;
  endDate: string;
  isCurrentPeriod: boolean;
  totalEggs: number;
  solvedEggs: number;
  ratio: number;
  glyphIndex: number;
  glyphLetter: string;
  isCompleted: boolean;
  canReplay: boolean;
}

interface ChronoEggModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasRosettaStone: boolean;
  isMetaEnigmaUnlocked: boolean;
  periods: ChronoPeriodItem[];
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
  periods,
  loading = false,
  onReplayPeriod,
  onOpenRosetta,
  onOpenTerminal,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-slate-900/95 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
          style={{
            boxShadow: '0 0 45px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    Chrono-Egg : Archive Temporelle 2070
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                    Méta-Énigme
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Journal des glyphes runiques découverts au fil des périodes de la saison
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Bouton vers la Pierre de Rosette : STRICTEMENT conditionnel */}
              {hasRosettaStone && (
                <button
                  type="button"
                  onClick={onOpenRosetta}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Consulter la Pierre de Rosette 2070 pour décoder les glyphes"
                >
                  <Scroll size={14} />
                  <span className="hidden sm:inline">Pierre de Rosette</span>
                </button>
              )}

              {/* Bouton Terminal de Décryptage */}
              <button
                type="button"
                onClick={onOpenTerminal}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isMetaEnigmaUnlocked
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'
                }`}
                title="Saisir le mot de passe secret final"
              >
                <Terminal size={14} />
                <span>{isMetaEnigmaUnlocked ? 'Vision 2050 Active' : 'Déchiffrer le Code'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
            {/* Bannière explicative */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <Sparkles size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-amber-300 font-bold">Protocole de l'Arche : </strong>
                Chaque période recèle des Easter Eggs qui gravent progressivement un fragment de glyphe dans l'œuf. 
                Si vous avez manqué des énigmes lors d'une période passée,{' '}
                <strong className="text-amber-200">cliquez sur son œuf pour lancer un Rattrapage Temporel</strong> et reconstituer le symbole complet !
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Synchronisation avec les archives temporelles...</span>
              </div>
            ) : periods.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                Aucune archive temporelle enregistrée pour le moment.
              </div>
            ) : (
              /* Grille des Périodes avec Œufs 3D */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {periods.map((item) => {
                  const glyphDef = getPeriodGlyph(item.periodIndex);
                  const isZero = item.solvedEggs === 0;
                  const isPartial = item.solvedEggs > 0 && item.solvedEggs < item.totalEggs;
                  const isFull = item.isCompleted;

                  // Nombre de segments de glyphe révélés
                  const revealedCount = isZero
                    ? 0
                    : Math.max(1, Math.round((item.solvedEggs / item.totalEggs) * glyphDef.segments.length));
                  const activeSegments = glyphDef.segments.slice(0, revealedCount);

                  return (
                    <motion.div
                      key={item.periodId}
                      whileHover={{ scale: 1.02, y: -2 }}
                      onClick={() => {
                        if (item.canReplay) {
                          onReplayPeriod(item.periodId);
                        }
                      }}
                      className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        item.canReplay ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isFull
                          ? 'bg-slate-800/80 border-amber-500/40 shadow-lg shadow-amber-950/20'
                          : isPartial
                            ? 'bg-slate-800/50 border-amber-500/25 hover:border-amber-500/50'
                            : 'bg-slate-800/30 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      {/* Badge Période & État */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                          Période {item.periodIndex} {item.isCurrentPeriod && '(En cours)'}
                        </span>
                        {isFull ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 size={11} /> 100% Découvert
                          </span>
                        ) : isPartial ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Fragmenté ({item.solvedEggs}/{item.totalEggs})
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Non résolu
                          </span>
                        )}
                      </div>

                      {/* Représentation 3D de l'Œuf de cette Période */}
                      <div className="flex items-center justify-center py-4">
                        <div className="relative w-20 h-24 flex items-center justify-center">
                          <svg
                            viewBox="0 0 32 38"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-full h-full drop-shadow-md"
                          >
                            <defs>
                              <radialGradient
                                id={`shading-${item.periodId}`}
                                cx="35%"
                                cy="28%"
                                r="65%"
                              >
                                <stop offset="0%" stopColor="#475569" />
                                <stop offset="45%" stopColor="#1e293b" />
                                <stop offset="85%" stopColor="#0f172a" />
                                <stop offset="100%" stopColor="#050811" />
                              </radialGradient>
                              <radialGradient
                                id={`zenith-${item.periodId}`}
                                cx="32%"
                                cy="24%"
                                r="38%"
                              >
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                                <stop offset="40%" stopColor="#94a3b8" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                              </radialGradient>
                            </defs>

                            {/* Ombre portée */}
                            <ellipse cx="16" cy="36.5" rx="10" ry="1.5" fill="#000000" opacity="0.5" />

                            {/* Coque 3D */}
                            <path
                              d="M16 2 C8 2 3 13 3 23 C3 30 8.5 36 16 36 C23.5 36 29 30 29 23 C29 13 24 2 16 2 Z"
                              fill={`url(#shading-${item.periodId})`}
                              stroke={isFull ? '#fbbf24' : isPartial ? '#f59e0b' : '#475569'}
                              strokeWidth="1.2"
                            />

                            {/* Reflet zénithal */}
                            <path
                              d="M16 2 C8 2 3 13 3 23 C3 30 8.5 36 16 36 C23.5 36 29 30 29 23 C29 13 24 2 16 2 Z"
                              fill={`url(#zenith-${item.periodId})`}
                            />

                            {/* Cas 1: 0 œuf résolu -> Gravure 3D d'un '?' énigmatique */}
                            {isZero && (
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

                            {/* Cas 2: Segments de glyphe découverts (Partiel ou Complet) */}
                            {activeSegments.length > 0 && (
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

                      {/* Informations du Glyphe & Action */}
                      <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-200">
                            {isZero ? 'Glyphe inconnu' : glyphDef.name}
                          </div>
                          {hasRosettaStone && isFull && (
                            <div className="text-[11px] text-indigo-300 font-mono">
                              Traduction : <strong>{glyphDef.letter}</strong>
                            </div>
                          )}
                        </div>

                        {item.canReplay ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                            <RotateCcw size={12} />
                            <span>Rattrapage</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-400 font-bold">Complet</div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span>
                {isMetaEnigmaUnlocked
                  ? 'Protocole Oméga validé : La Vision 2050 est disponible sur vos cartes de missions.'
                  : 'Reconstituez les glyphes de toutes les périodes pour découvrir le mot de passe final.'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
