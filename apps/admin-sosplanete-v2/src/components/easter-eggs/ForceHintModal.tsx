'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertCircle, CheckCircle2, Loader2, X, RotateCcw, Zap, Users } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { forceInstanceHint } from '@/utils/easterEggApi';

interface ForceHintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  instanceYearId: number;
  egg: {
    id: number;
    title: string;
    forceHint?: boolean;
    forcedHintTeamIds?: number[];
  } | null;
  teams: Array<{
    id: number;
    name: string;
    color?: string | null;
    icon?: string | null;
  }>;
}

export function ForceHintModal({
  isOpen,
  onClose,
  onSuccess,
  instanceYearId,
  egg,
  teams,
}: ForceHintModalProps) {
  const [targetType, setTargetType] = useState<'ALL' | 'TEAM'>('ALL');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetType('ALL');
      setSelectedTeamId(teams[0]?.id ?? null);
      setError(null);
    }
  }, [isOpen, teams]);

  if (!isOpen || !egg) return null;

  const isGlobalForced = !!egg.forceHint;
  const forcedTeamIds = egg.forcedHintTeamIds || [];
  const isSelectedTeamForced =
    targetType === 'TEAM' && selectedTeamId !== null && forcedTeamIds.includes(selectedTeamId);
  const canRevoke = isGlobalForced || (targetType === 'TEAM' && isSelectedTeamForced);

  const handleSubmit = async (revoke: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const teamIdParam = targetType === 'TEAM' && selectedTeamId !== null ? selectedTeamId : undefined;
      await forceInstanceHint(instanceYearId, egg.id, teamIdParam, revoke);

      let msg = '';
      if (revoke) {
        msg = teamIdParam
          ? `Forçage annulé pour l'équipe sélectionnée (minuteur rétabli).`
          : `Forçage annulé pour toutes les équipes (minuteur rétabli).`;
      } else {
        msg = teamIdParam
          ? `2ème indice révélé immédiatement pour l'équipe sélectionnée !`
          : `2ème indice révélé immédiatement pour toutes les équipes !`;
      }

      onSuccess(msg);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la gestion de l’indice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard className="p-6 bg-white border-slate-200 shadow-2xl rounded-3xl overflow-hidden space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Gestion du 2ème Indice Explicite
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Énigme : <strong className="text-slate-700">{egg.title}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current State Info Banner */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  État Actuel :
                </span>
                {isGlobalForced ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                    <Zap size={10} />
                    Forcé pour TOUTES les équipes
                  </span>
                ) : forcedTeamIds.length > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                    <Zap size={10} />
                    Forcé pour {forcedTeamIds.length} équipe(s)
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">
                    Minuteur standard actif (délai configuré avant révélation automatique).
                  </span>
                )}
              </div>
            </div>

            {/* Target Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Cible de l'action
              </label>

              <div className="space-y-2">
                {/* Option: All Teams */}
                <label
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    targetType === 'ALL'
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="hintTarget"
                      checked={targetType === 'ALL'}
                      onChange={() => setTargetType('ALL')}
                      className="text-amber-500 focus:ring-amber-500 h-4 w-4"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-800">
                        Toutes les équipes de l'instance
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Révèle immédiatement l'indice pour l'ensemble des élèves
                      </span>
                    </div>
                  </div>
                  {isGlobalForced && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-200 text-amber-900">
                      Actif
                    </span>
                  )}
                </label>

                {/* Option: Specific Team */}
                <label
                  className={`flex flex-col gap-2 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    targetType === 'TEAM'
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="hintTarget"
                      checked={targetType === 'TEAM'}
                      onChange={() => setTargetType('TEAM')}
                      className="text-amber-500 focus:ring-amber-500 h-4 w-4"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-800">
                        Une équipe spécifique
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Débloque l'indice uniquement pour les membres de cette équipe
                      </span>
                    </div>
                  </div>

                  {targetType === 'TEAM' && (
                    <div className="pt-2 pl-7">
                      <select
                        value={selectedTeamId ?? ''}
                        onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                      >
                        {teams.map((t) => {
                          const isTeamForced = forcedTeamIds.includes(t.id);
                          return (
                            <option key={t.id} value={t.id}>
                              {t.name} {isTeamForced ? '• (Indice forcé)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Fermer
              </button>

              <div className="flex items-center gap-2">
                {canRevoke && (
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    title="Rétablir le délai d'attente du minuteur"
                  >
                    <RotateCcw size={14} />
                    <span>Rétablir timer</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Zap size={14} />
                  )}
                  <span>Forcer l'indice</span>
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
