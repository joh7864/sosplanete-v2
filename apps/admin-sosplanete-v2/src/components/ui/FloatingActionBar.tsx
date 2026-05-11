import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, ArrowRight, Save } from 'lucide-react';

export type ActionBarStatus = 'idle' | 'dirty' | 'saving' | 'success' | 'next';

interface FloatingActionBarProps {
  status: ActionBarStatus;
  onSave: () => void;
  onNext?: () => void;
  nextLabel?: string;
  saveLabel?: string;
}

export function FloatingActionBar({
  status,
  onSave,
  onNext,
  nextLabel = 'Continuer',
  saveLabel = 'Enregistrer les modifications',
}: FloatingActionBarProps) {
  // Optionnel: On peut ne pas rendre le composant s'il n'y a pas d'action
  // mais la logique AnimatePresence se charge de ça.

  return (
    <AnimatePresence>
      {status !== 'idle' && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-50"
        >
          <motion.div
            layout
            className="bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-full p-2 flex items-center gap-4 pointer-events-auto overflow-hidden"
            style={{ minWidth: 200 }}
          >
            <AnimatePresence mode="wait">
              {status === 'dirty' && (
                <motion.button
                  key="save"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={onSave}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs py-4 px-10 rounded-full w-full flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-colors"
                >
                  <Save size={16} />
                  {saveLabel}
                </motion.button>
              )}

              {status === 'saving' && (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex items-center justify-center gap-2 py-4 px-10 text-emerald-600 font-black uppercase tracking-widest text-xs"
                >
                  <Loader2 size={16} className="animate-spin" />
                  Sauvegarde...
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="bg-emerald-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/40"
                >
                  <Check strokeWidth={3} />
                </motion.div>
              )}

              {status === 'next' && onNext && (
                <motion.button
                  key="next"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={onNext}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-xs py-4 px-10 rounded-full w-full flex items-center justify-center gap-3 transition-colors whitespace-nowrap shadow-xl shadow-slate-900/30"
                >
                  {nextLabel}
                  <ArrowRight size={16} strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
