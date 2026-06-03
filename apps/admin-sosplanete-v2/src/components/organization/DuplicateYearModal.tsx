'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, AlertTriangle, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

interface DuplicateYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetYear: string) => void;
  sourceYear: string;
  availableYears: string[];
  isLoading?: boolean;
  error?: string | null;
}

export const DuplicateYearModal: React.FC<DuplicateYearModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sourceYear,
  availableYears,
  isLoading,
  error,
}) => {
  const otherYears = availableYears.filter((y) => y !== sourceYear);
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedYear(otherYears[0] || '');
    }
  }, [isOpen, availableYears, sourceYear]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md"
          >
            <GlassCard padding="none" className="overflow-hidden border-none shadow-2xl bg-white/95">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Copy size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Dupliquer l'Espace</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Année source : {sourceYear}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form / Selection */}
                {otherYears.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                        Année scolaire cible (existante)
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm"
                        disabled={isLoading}
                      >
                        {otherYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Warnings */}
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                      <Sparkles className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                          Éléments dupliqués
                        </span>
                        <p className="text-[10px] text-amber-700/90 font-medium leading-relaxed">
                          Les équipes (avec groupes/élèves), les catégories et le catalogue d'actions locales seront dupliqués. Les périodes de l'année cible devront quant à elles être configurées manuellement.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex gap-3">
                      <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider">
                          Sécurité Cible
                        </span>
                        <p className="text-[10px] text-rose-700/90 font-medium leading-relaxed">
                          Si un espace existe déjà pour l'année cible, la duplication sera bloquée pour éviter tout écrasement accidentel.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-500">
                      <AlertTriangle size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Aucune année cible disponible</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      Aucune autre année scolaire n'est disponible dans le système.
                    </p>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="mt-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-bold text-xs flex gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl text-xs font-bold"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                  {otherYears.length > 0 && (
                    <Button
                      variant="primary"
                      className="flex-[2] h-12 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs"
                      onClick={() => onConfirm(selectedYear)}
                      isLoading={isLoading}
                      disabled={isLoading || !selectedYear}
                    >
                      Dupliquer vers {selectedYear}
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
