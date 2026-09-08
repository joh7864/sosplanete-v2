import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scroll, Terminal, Sparkles, HelpCircle } from 'lucide-react';
import { PERIOD_GLYPHS_2070 } from '../../utils/periodGlyphs2070';

interface RosettaStoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTerminal: () => void;
}

export const RosettaStoneModal: React.FC<RosettaStoneModalProps> = ({
  isOpen,
  onClose,
  onOpenTerminal,
}) => {
  const [selectedGlyphId, setSelectedGlyphId] = React.useState<number | null>(null);

  if (!isOpen) return null;

  const glyphList = Object.values(PERIOD_GLYPHS_2070);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-slate-900/95 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
          style={{
            boxShadow: '0 0 50px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
                <Scroll size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    La Pierre de Rosette 2070
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                    Table de Décodage
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Matrice linguistique de l'Arche : traduction des runes quantiques en alphabet contemporain
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
            {/* Notice */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3 text-xs text-slate-300">
              <Sparkles size={18} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-300">Guide de Transcription :</strong> Chaque glyphe découvert sur la coque d'un œuf temporel correspond à une lettre de notre alphabet. En assemblant les symboles dans l'ordre chronologique des périodes, vous obtiendrez le mot de passe secret de l'Arche !
              </div>
            </div>

            {/* Matrice des Glyphes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {glyphList.map((g) => {
                const isSelected = selectedGlyphId === g.id;
                return (
                  <motion.div
                    key={g.id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedGlyphId(isSelected ? null : g.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-400 shadow-lg shadow-indigo-900/30 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/60 border-slate-700/70 hover:border-indigo-500/50 hover:bg-slate-800'
                    }`}
                  >
                    {/* Dessin SVG du glyphe complet */}
                    <div className="w-14 h-16 flex items-center justify-center bg-slate-900/80 rounded-xl border border-slate-700/60 p-1">
                      <svg viewBox="0 0 32 38" className="w-full h-full drop-shadow-md">
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
                    </div>

                    {/* Équivalent Alphabet */}
                    <div className="text-center">
                      <div className="text-xl font-black font-mono text-amber-300">
                        = {g.letter}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px] font-bold">
                        {g.name}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Vous avez identifié le mot de passe complet ?
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTerminal();
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
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
