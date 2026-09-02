'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Loader2, Save, CheckCircle, AlertTriangle, Box, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getAuthData } from '@/utils/storage';
import { PeriodTable } from './PeriodTable';

export function PeriodSettings({ instanceId, schoolYear, instanceYearId }: { instanceId: number, schoolYear: string, instanceYearId?: number }) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const [periodsRefreshTrigger, setPeriodsRefreshTrigger] = useState(0);

  // Settings Config Jeu
  const [gameStartDate, setGameStartDate] = useState('');
  const [gameEndDate, setGameEndDate] = useState('');
  const [gamePeriodsCount, setGamePeriodsCount] = useState('24');
  const [periodStartDay, setPeriodStartDay] = useState<number>(3);
  
  const savedGameStartDate = React.useRef('');
  const savedGameEndDate = React.useRef('');
  const savedGamePeriodsCount = React.useRef('24');
  const savedPeriodStartDay = React.useRef<number>(3);

  const calculatedWeeks = useMemo(() => {
    if (!gameStartDate || !gameEndDate) return 0;
    const start = new Date(gameStartDate);
    const end = new Date(gameEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }, [gameStartDate, gameEndDate]);

  const dateError = useMemo(() => {
    if (!gameStartDate || !gameEndDate) return null;
    const start = new Date(gameStartDate);
    const end = new Date(gameEndDate);
    if (start >= end) {
      return "La date de début de jeu doit être antérieure à la date de fin.";
    }
    return null;
  }, [gameStartDate, gameEndDate]);

  useEffect(() => {
    if (instanceYearId) {
      fetchGameConfig();
    }
  }, [instanceYearId, schoolYear]);

  const fetchGameConfig = async () => {
    if (!instanceId) return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/game-config/${instanceId}?schoolYear=${schoolYear}`, { headers: { Authorization: `Bearer ${getAuthData('access_token')}` } });
      if (resp.ok) {
        const data = await resp.json();
        const start = data.gameStartDate ? new Date(data.gameStartDate).toISOString().split('T')[0] : '';
        const end = data.gameEndDate ? new Date(data.gameEndDate).toISOString().split('T')[0] : '';
        const periodsCount = data.gamePeriodsCount ? data.gamePeriodsCount.toString() : '24';
        const startDay = data.periodStartDay !== undefined ? data.periodStartDay : 3;

        setGameStartDate(start);
        setGameEndDate(end);
        setGamePeriodsCount(periodsCount);
        setPeriodStartDay(startDay);

        savedGameStartDate.current = start;
        savedGameEndDate.current = end;
        savedGamePeriodsCount.current = periodsCount;
        savedPeriodStartDay.current = startDay;
      }
    } catch (e) {
      console.error('[PeriodSettings] fetchGameConfig failed:', e);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${instanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
        body: JSON.stringify({ 
          schoolYear,
          ...(gameStartDate && { gameStartDate: new Date(gameStartDate).toISOString() }),
          ...(gameEndDate && { gameEndDate: new Date(gameEndDate).toISOString() }),
          periodStartDay: Number(periodStartDay),
          ...(calculatedWeeks > 0 && { gamePeriodsCount: calculatedWeeks }),
          force: true,
        }),
      });

      if (resp.ok) {
        setStatus({ type: 'success', msg: 'Configuration enregistrée !' });
        setTimeout(() => setStatus(null), 3000);
        setPeriodsRefreshTrigger(prev => prev + 1);
        fetchGameConfig();
      } else {
        setStatus({ type: 'error', msg: "Erreur d'enregistrement." });
      }
    } catch (e) {
      setStatus({ type: 'error', msg: 'Erreur réseau.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfig = () => {
    setGameStartDate(savedGameStartDate.current);
    setGameEndDate(savedGameEndDate.current);
    setGamePeriodsCount(savedGamePeriodsCount.current);
    setPeriodStartDay(savedPeriodStartDay.current);
  };

  if (!instanceYearId) {
    return (
      <GlassCard className="p-6 border-none shadow-xl bg-white/95">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertTriangle size={48} className="text-amber-500" />
          <h2 className="text-lg font-black text-slate-800">Espace non configuré pour cette année</h2>
          <p className="text-slate-500 text-sm">Veuillez vérifier les paramètres généraux de l'espace.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">

      <GlassCard className="relative p-0 rounded-3xl border-none shadow-2xl overflow-hidden bg-white/95">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          
          {/* Left Column: Logo & Quick Info */}
          <div className="flex flex-col items-center justify-start p-10 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="w-40 h-40 rounded-3xl border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden bg-sky-50 relative transition-all">
               <Calendar className="text-sky-300" size={64} />
            </div>

            <div className="mt-8 w-full space-y-4">
               <div className="flex flex-col items-center text-center">
                  <span className="text-xl font-black text-slate-800 tracking-tight">Périodes</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                     Configuration globale
                  </span>
               </div>
            </div>
            
            {saving && (
               <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-sky-600 tracking-widest animate-pulse">
                  <Loader2 className="animate-spin" size={12} /> Calcul en cours...
               </div>
            )}
          </div>

          {/* Right Column: Forms */}
          <div className="p-12 flex flex-col gap-10">
            <div className="flex flex-col gap-10">
              
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest bg-sky-50 w-fit px-3 py-1 rounded-full">Calendrier de l'espace</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date de début du jeu</label>
                     <div className="relative">
                       <input 
                         type="date" 
                         value={gameStartDate} 
                         onChange={(e) => setGameStartDate(e.target.value)} 
                         className="w-full bg-slate-50 border-none h-14 rounded-2xl px-4 pl-12 font-bold text-slate-700 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm" 
                       />
                       <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                     </div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date de fin du jeu</label>
                     <div className="relative">
                       <input 
                         type="date" 
                         value={gameEndDate} 
                         onChange={(e) => setGameEndDate(e.target.value)} 
                         className="w-full bg-slate-50 border-none h-14 rounded-2xl px-4 pl-12 font-bold text-slate-700 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm" 
                       />
                       <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jour de début de période</label>
                     <select
                       value={periodStartDay}
                       onChange={(e) => setPeriodStartDay(parseInt(e.target.value, 10))}
                       className="w-full bg-slate-50 border-none h-14 rounded-2xl px-4 font-bold text-slate-700 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm"
                     >
                       <option value={0}>Dimanche</option>
                       <option value={1}>Lundi</option>
                       <option value={2}>Mardi</option>
                       <option value={3}>Mercredi</option>
                       <option value={4}>Jeudi</option>
                       <option value={5}>Vendredi</option>
                       <option value={6}>Samedi</option>
                     </select>
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durée totale (semaines)</label>
                     <div className="relative">
                       <input 
                         type="number" 
                         value={calculatedWeeks} 
                         disabled 
                         className="w-full bg-slate-100/50 border-none h-14 rounded-2xl px-4 pl-12 font-bold text-slate-400 text-sm outline-none shadow-sm cursor-not-allowed" 
                       />
                       <Box size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                     </div>
                  </div>
                </div>

                {dateError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-rose-700 mt-4">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-wider">Date Incohérente</span>
                      <p className="text-xs font-semibold">{dateError}</p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 mt-4">
                  <p className="text-[10px] font-bold text-sky-600 leading-relaxed uppercase tracking-tight">
                    Cette configuration définit la structure temporelle globale utilisée par les algorithmes de calcul de l'impact planétaire.
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between items-center mt-4 pt-8 border-t border-slate-100">
                <AnimatePresence>
                  {status && status.type === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sky-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Calculé
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 ml-auto">
                  <button onClick={handleResetConfig} className="px-4 h-14 rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <RotateCcw size={16} /> Annuler
                  </button>
                  <Button 
                    onClick={() => handleSaveConfig()} 
                    disabled={saving || !!dateError} 
                    className="h-14 px-10 gap-3 font-black shadow-xl shadow-sky-500/20 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white uppercase tracking-widest text-sm"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Calculer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <PeriodTable instanceYearId={instanceYearId} refreshTrigger={periodsRefreshTrigger} />

      {status && (
          <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-4 duration-300">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
               {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
               <span className="font-bold text-sm">{status.msg}</span>
            </div>
          </div>
      )}
    </div>
  );
}

