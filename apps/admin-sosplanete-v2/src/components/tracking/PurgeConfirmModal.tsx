'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Loader2, CheckCircle2 } from 'lucide-react';
import { getAuthData } from '@/utils/storage';

interface PurgeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: number;
  schoolYear: string;
  onPurged: () => void;
}

export const PurgeConfirmModal: React.FC<PurgeConfirmModalProps> = ({
  isOpen,
  onClose,
  instanceId,
  schoolYear,
  onPurged,
}) => {
  const [purgeOption, setPurgeOption] = useState<'90days' | 'all'>('90days');
  const [isPurging, setIsPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePurge = async () => {
    setIsPurging(true);
    setError(null);
    try {
      const token = getAuthData('access_token');
      const body: any = {
        instanceId,
        schoolYear,
        olderThanDays: purgeOption === '90days' ? 90 : undefined,
      };

      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracking/sessions/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        throw new Error('Erreur lors de la purge des données');
      }

      const res = await resp.json();
      setSuccessMessage(res.message || 'Données purgées avec succès');
      setTimeout(() => {
        setSuccessMessage(null);
        onPurged();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Impossible de réaliser la purge');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white m-0">
                    Purger l'Historique des Connexions
                  </h3>
                  <p className="text-xs text-slate-400 m-0 mt-0.5">
                    Action explicite et irréversible (RGPD)
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            {successMessage ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-3">
                <CheckCircle2 size={20} />
                {successMessage}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Cette opération supprime les logs techniques de sessions et de parcours.
                  <strong className="text-emerald-400"> Les totaux d'impact et les missions réalisées dans l'application restent 100% conservés.</strong>
                </p>

                <div className="space-y-3 mb-6">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      purgeOption === '90days'
                        ? 'bg-amber-500/10 border-amber-500/40 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="purgeOption"
                      value="90days"
                      checked={purgeOption === '90days'}
                      onChange={() => setPurgeOption('90days')}
                      className="mt-1 accent-amber-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-white block">
                        Purger uniquement les logs de plus de 90 jours (Recommandé)
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Conserve les 3 derniers mois pour le suivi pédagogique en cours.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      purgeOption === 'all'
                        ? 'bg-rose-500/10 border-rose-500/40 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="purgeOption"
                      value="all"
                      checked={purgeOption === 'all'}
                      onChange={() => setPurgeOption('all')}
                      className="mt-1 accent-rose-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-white block">
                        Purger l'intégralité des logs de l'année scolaire
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Remet à zéro l'historique des connexions (idéal en fin d'année scolaire).
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={onClose}
                    disabled={isPurging}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePurge}
                    disabled={isPurging}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50"
                  >
                    {isPurging ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    Confirmer la purge
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
