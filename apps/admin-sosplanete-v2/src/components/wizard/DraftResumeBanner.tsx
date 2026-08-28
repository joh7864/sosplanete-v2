'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Trash2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardDraftState } from '@/types/wizard';

const DRAFT_KEY = 'sosplanete_space_wizard_draft';

export const DraftResumeBanner: React.FC = () => {
  const router = useRouter();
  const [draft, setDraft] = useState<WizardDraftState | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed: WizardDraftState = JSON.parse(stored);
        if (parsed && parsed.identity) {
          setDraft(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to read wizard draft:', e);
    }
  }, []);

  const handleResume = () => {
    router.push('/dashboard/spaces/wizard');
  };

  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous vraiment supprimer ce brouillon en cours ?')) {
      try {
        localStorage.removeItem(DRAFT_KEY);
        setDraft(null);
      } catch (err) {}
    }
  };

  if (!draft) return null;

  const formattedDate = draft.meta?.lastSavedAt 
    ? new Date(draft.meta.lastSavedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  const displayName = draft.identity?.schoolName?.trim() || 'Espace en cours de création';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-8 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-2 border-emerald-500/30 shadow-md backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-800 border border-emerald-600/20">
                Brouillon en cours
              </span>
              {formattedDate && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} /> Modifié le {formattedDate}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {displayName}
              <span className="ml-2 font-medium text-xs text-slate-500">
                (Étape {draft.currentStep || 1} / 8)
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1"
            title="Supprimer ce brouillon"
          >
            <Trash2 size={14} /> Abandonner
          </button>

          <button
            type="button"
            onClick={handleResume}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            Reprendre la configuration <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
