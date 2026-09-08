import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, CheckCircle2, AlertTriangle, Loader2, Sparkles, KeyRound } from 'lucide-react';

interface TemporalTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onSuccessUnlock: () => void;
  onSubmitCode: (code: string) => Promise<{ success: boolean; message: string }>;
}

export const TemporalTerminalModal: React.FC<TemporalTerminalModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onSuccessUnlock,
  onSubmitCode,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res = await onSubmitCode(code.trim().toUpperCase());
      setFeedback(res);
      if (res.success) {
        onSuccessUnlock();
      }
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.message || 'Erreur lors de la validation du code temporel.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCharClick = (char: string) => {
    if (code.length < 15) {
      setCode((prev) => (prev + char).toUpperCase());
    }
  };

  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  const KEYBOARD_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-slate-900/95 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
          style={{
            boxShadow: '0 0 50px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner">
                <Terminal size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    Terminal de Décryptage Temporel
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    Console Oméga
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Saisie manuelle du mot de passe secret de l'Arche
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
            {isUnlocked ? (
              <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-base font-black text-emerald-300">
                  Protocole Oméga Autorisé !
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  L'Arche a validé votre accréditation. La fonctionnalité <strong>Vision 2050 (Avant / Après)</strong> est définitivement accessible depuis vos cartes de missions pour explorer l'impact futur de vos actions.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                    Code Secret Décrypté (Saisie Manuelle Obligatoire)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="TAPEZ LE MOT DE PASSE..."
                      autoFocus
                      disabled={loading}
                      className="w-full px-4 py-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xl text-center tracking-[0.3em] uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 shadow-inner"
                    />
                  </div>
                </div>

                {/* Clavier Virtuel Cybernétique (pour confort tactile/clic) */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                    Pavé d'Alphabet Temporel
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {KEYBOARD_LETTERS.map((char) => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleCharClick(char)}
                        className="w-8 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-slate-200 hover:text-white font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer border border-slate-700/60"
                      >
                        {char}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleBackspace}
                      className="px-3 h-9 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center transition-all cursor-pointer border border-rose-500/30"
                    >
                      Effacer
                    </button>
                  </div>
                </div>

                {/* Feedback message */}
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
                      feedback.success
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {feedback.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{feedback.message}</span>
                  </motion.div>
                )}

                {/* Bouton de validation */}
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Vérification Quantique...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={18} />
                      <span>Transmettre le Code à l'Arche</span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
