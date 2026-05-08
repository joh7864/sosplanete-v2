'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

interface InitializeYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (year: string) => void;
  currentYears: string[];
  isLoading?: boolean;
}

export const InitializeYearModal: React.FC<InitializeYearModalProps> = ({ isOpen, onClose, onConfirm, currentYears, isLoading }) => {
  const lastYear = currentYears[currentYears.length - 1] || "2024-2025";
  const firstYear = currentYears[0] || "2024-2025";

  const [startNext, endNext] = lastYear.split('-').map(Number);
  const nextYear = `${startNext + 1}-${endNext + 1}`;

  const [startPrev, endPrev] = firstYear.split('-').map(Number);
  const prevYear = `${startPrev - 1}-${endPrev - 1}`;

  const [selectedYear, setSelectedYear] = React.useState(nextYear);

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
            <GlassCard padding="none" className="overflow-hidden border-none shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Nouvelle Année</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Initialisation du système</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedYear(nextYear)}
                    className={`w-full group relative p-4 rounded-2xl transition-all text-left border-2 ${selectedYear === nextYear ? 'bg-emerald-50/50 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedYear === nextYear ? 'text-emerald-600' : 'text-slate-400'}`}>Futur (Suivant)</span>
                        <span className="text-lg font-black text-slate-800">{nextYear}</span>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Initialiser l'année scolaire suivante</p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${selectedYear === nextYear ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedYear(prevYear)}
                    className={`w-full group relative p-4 rounded-2xl transition-all text-left border-2 ${selectedYear === prevYear ? 'bg-slate-800 border-slate-800 shadow-lg shadow-slate-900/10' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedYear === prevYear ? 'text-slate-400' : 'text-slate-400'}`}>Passé (Précédent)</span>
                        <span className={`text-lg font-black ${selectedYear === prevYear ? 'text-white' : 'text-slate-800'}`}>{prevYear}</span>
                        <p className={`text-[10px] font-medium mt-1 ${selectedYear === prevYear ? 'text-slate-400' : 'text-slate-400'}`}>Initialiser l'année scolaire précédente</p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${selectedYear === prevYear ? 'bg-white text-slate-800' : 'bg-slate-50 text-slate-400'}`}>
                        <ArrowLeft size={20} />
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 mb-6">
                   <Sparkles className="text-amber-500 shrink-0" size={18} />
                   <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                     L'initialisation créera les configurations par défaut et les périodes pour tous les espaces de l'académie pour cette période.
                   </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs" onClick={onClose} disabled={isLoading}>Annuler</Button>
                  <Button 
                    variant="primary" 
                    className="flex-[2] h-12 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs" 
                    onClick={() => onConfirm(selectedYear)}
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    Initialiser {selectedYear}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
