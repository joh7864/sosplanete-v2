'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  EasterEggCatalogItem,
  fetchAdminCatalog,
  openInstanceEgg,
} from '@/utils/easterEggApi';

interface ManualActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instanceYearId: number;
  currentEggId?: number;
  initialMode?: 'replace' | 'add';
}

export function ManualActivationModal({
  isOpen,
  onClose,
  onSuccess,
  instanceYearId,
  currentEggId,
  initialMode = 'replace',
}: ManualActivationModalProps) {
  const [catalog, setCatalog] = useState<EasterEggCatalogItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(currentEggId || null);
  const [activationMode, setActivationMode] = useState<'replace' | 'add'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setActivationMode(initialMode);
      fetchAdminCatalog()
        .then((data) => {
          const actives = data.filter((e) => e.isActive);
          setCatalog(actives);
          if (currentEggId) setSelectedId(currentEggId);
          else if (actives.length > 0) setSelectedId(actives[0].id);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, currentEggId]);

  const handleActivate = async () => {
    if (!selectedId) return;
    setActivating(true);
    setError(null);
    try {
      await openInstanceEgg(instanceYearId, selectedId, activationMode === 'replace');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'activation.");
    } finally {
      setActivating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 bg-white/95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                <Play size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800">
                  Ouverture Manuelle d’un Easter Egg
                </h2>
                <p className="text-xs text-slate-500">
                  Déclenchez immédiatement une énigme spécifique sur la période en cours
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs font-semibold">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Mode d'activation sur la période :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActivationMode('replace')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    activationMode === 'replace'
                      ? 'border-emerald-500 bg-emerald-50 text-slate-800 ring-1 ring-emerald-500/30 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                    <span>🔄 Remplacer l'actuel</span>
                    {activationMode === 'replace' && <CheckCircle2 size={14} className="text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Clôture l'énigme en cours et active uniquement celle-ci.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActivationMode('add')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    activationMode === 'add'
                      ? 'border-purple-500 bg-purple-50 text-slate-800 ring-1 ring-purple-500/30 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                    <span className="text-purple-900 font-bold">➕ Ajouter à la période (Multi-Eggs)</span>
                    {activationMode === 'add' && <CheckCircle2 size={14} className="text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ajoute un Easter Egg supplémentaire sur cette période de 2 semaines. Les élèves devront résoudre le 1er pour débloquer le 2ème !
                  </p>
                </button>
              </div>
            </div>

            <p className="text-xs font-black uppercase tracking-wider text-slate-700 pt-1">
              Sélectionnez l’énigme à activer :
            </p>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-emerald-600" size={28} />
              </div>
            ) : catalog.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                Aucune énigme active dans le catalogue.
              </div>
            ) : (
              <div className="space-y-2">
                {catalog.map((egg) => {
                  const isSelected = selectedId === egg.id;
                  const isCurrent = currentEggId === egg.id;
                  return (
                    <button
                      key={egg.id}
                      type="button"
                      onClick={() => setSelectedId(egg.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30 text-slate-800 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs truncate text-slate-800">{egg.title}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase">
                              Actif en ce moment
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {egg.code} • +{egg.rewardPointsIT} IT
                        </span>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                            : 'border-slate-300 bg-slate-50'
                        }`}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/80 bg-white/95">
            <button
              type="button"
              onClick={onClose}
              disabled={activating}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleActivate}
              disabled={activating || !selectedId}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {activating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Activation...</span>
                </>
              ) : (
                'Activer pour la période'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
