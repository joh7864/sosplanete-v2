'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Loader2, Save, CheckCircle, AlertTriangle, Plus, ArrowUpDown, ChevronUp, ChevronDown, Edit3, Check, X, Unlock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getAuthData } from '@/utils/storage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Period {
  id: number;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  _count?: { actionsDone: number };
}

import { Box, RotateCcw } from 'lucide-react';

export function PeriodSettings({ instanceId, schoolYear, instanceYearId }: { instanceId: number, schoolYear: string, instanceYearId?: number }) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  const [sortField, setSortField] = useState<'date' | 'actions'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showConfirm, setShowConfirm] = useState<{ id: number, message: string } | null>(null);

  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // Settings Config Jeu
  const [gameStartDate, setGameStartDate] = useState('');
  const [gameEndDate, setGameEndDate] = useState('');
  const [gamePeriodsCount, setGamePeriodsCount] = useState('24');
  
  const savedGameStartDate = React.useRef('');
  const savedGameEndDate = React.useRef('');
  const savedGamePeriodsCount = React.useRef('24');

  const calculatedWeeks = useMemo(() => {
    if (!gameStartDate || !gameEndDate) return 0;
    const start = new Date(gameStartDate);
    const end = new Date(gameEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }, [gameStartDate, gameEndDate]);

  useEffect(() => {
    if (instanceYearId) {
      fetchPeriods();
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

        setGameStartDate(start);
        setGameEndDate(end);
        setGamePeriodsCount(periodsCount);

        savedGameStartDate.current = start;
        savedGameEndDate.current = end;
        savedGamePeriodsCount.current = periodsCount;
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
          ...(calculatedWeeks > 0 && { gamePeriodsCount: calculatedWeeks }),
          force: true, // We auto-force here or we'd need the dialog logic
        }),
      });

      if (resp.ok) {
        setStatus({ type: 'success', msg: 'Configuration enregistrée !' });
        setTimeout(() => setStatus(null), 3000);
        fetchPeriods();
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
  };

  const fetchPeriods = async () => {
    if (!instanceYearId) return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/periods?instanceYearId=${instanceYearId}`, { 
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` } 
      });
      if (resp.ok) {
        setPeriods(await resp.json());
      }
    } catch (e) {
      console.error('[PeriodSettings] fetchPeriods failed:', e);
    }
  };

  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => {
      let valA, valB;
      if (sortField === 'date') {
        valA = new Date(a.startDate).getTime();
        valB = new Date(b.startDate).getTime();
      } else {
        valA = a._count?.actionsDone || 0;
        valB = b._count?.actionsDone || 0;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [periods, sortField, sortOrder]);

  const toggleSort = (field: 'date' | 'actions') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const startEditing = (p: Period) => {
    setEditingPeriodId(p.id);
    setEditStartDate(new Date(p.startDate).toISOString().split('T')[0]);
    setEditEndDate(new Date(p.endDate).toISOString().split('T')[0]);
    setIsAddingNew(false);
  };

  const cancelEditing = () => {
    setEditingPeriodId(null);
    setIsAddingNew(false);
  };

  const prepareAddPeriod = () => {
    let nextStart = new Date();
    if (periods.length > 0) {
      const sortedByEnd = [...periods].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
      nextStart = new Date(sortedByEnd[0].endDate);
      nextStart.setDate(nextStart.getDate() + 1);
    }
    
    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextEnd.getDate() + 6); // 1 semaine
    
    setEditStartDate(nextStart.toISOString().split('T')[0]);
    setEditEndDate(nextEnd.toISOString().split('T')[0]);
    setIsAddingNew(true);
    setEditingPeriodId(-1);
  };

  const savePeriodEdit = async (id: number) => {
    setSaving(true);
    try {
      const isNew = id === -1;
      const url = isNew 
        ? `${process.env.NEXT_PUBLIC_API_URL}/periods`
        : `${process.env.NEXT_PUBLIC_API_URL}/periods/${id}`;
      
      const method = 'POST';
      const body = { 
        startDate: new Date(editStartDate).toISOString(), 
        endDate: new Date(editEndDate).toISOString(),
        ...(isNew ? { instanceYearId } : {})
      };
      
      if (!instanceYearId && isNew) return;

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        setEditingPeriodId(null);
        setIsAddingNew(false);
        fetchPeriods();
        setStatus({ type: 'success', msg: isNew ? 'Période ajoutée !' : 'Période mise à jour !' });
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const openPeriod = async (id: number) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/periods/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
      body: JSON.stringify({ isOpen: true }),
    });
    fetchPeriods();
  };

  const askDeletePeriod = async (id: number) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/periods/${id}/impact`, { headers: { Authorization: `Bearer ${getAuthData('access_token')}` } });
      if (resp.ok) {
        const data = await resp.json();
        setShowConfirm({ id, message: `Voulez-vous vraiment supprimer cette période ? ${data.count} actions seront définitivement supprimées.` });
      }
    } catch (e) {
      setShowConfirm({ id, message: `Voulez-vous vraiment supprimer cette période ?` });
    }
  };

  const deletePeriod = async (id: number) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/periods/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getAuthData('access_token')}` } });
    setShowConfirm(null);
    fetchPeriods();
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
                    disabled={saving} 
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

      <GlassCard className="p-6 border-none shadow-xl bg-white/95">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500"><Calendar size={20} /></div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Périodes de Saisie</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calendrier des semaines actives</p>
            </div>
          </div>
          <button 
            onClick={prepareAddPeriod}
            disabled={saving || isAddingNew}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all text-[11px] font-black uppercase tracking-widest group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} className="group-hover:scale-110 transition-transform" />}
            Ajouter une semaine
          </button>
        </div>

        <div className="rounded-2xl border border-slate-50 overflow-hidden shadow-sm">
          <div className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-6 py-3 bg-slate-50 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
            <div className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => toggleSort('date')}>
              Dates de la période
              {sortField === 'date' ? (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
            </div>
            <div className="text-center">Statut</div>
            <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => toggleSort('actions')}>
              Saisies
              {sortField === 'actions' ? (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
            </div>
            <div className="text-right pr-2">Actions</div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
            {isAddingNew && (
              <div key="new-period" className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-6 py-3 items-center bg-emerald-50/30 border-l-4 border-l-emerald-500 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm" />
                    <div className="h-px w-2 bg-slate-300" />
                    <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm" />
                  </div>
                </div>
                <div className="flex justify-center">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-100 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Nouveau
                  </span>
                </div>
                <div className="flex justify-center">
                   <div className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-black rounded-full border border-slate-200">0 act.</div>
                </div>
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => savePeriodEdit(-1)} title="Créer la période" className="p-2 text-emerald-600 hover:bg-white rounded-lg transition-all shadow-sm bg-emerald-50"><Check size={16} /></button>
                  <button onClick={cancelEditing} title="Annuler" className="p-2 text-rose-500 hover:bg-white rounded-lg transition-all shadow-sm bg-rose-50"><X size={16} /></button>
                </div>
              </div>
            )}

            {sortedPeriods.map(p => {
              const isEditing = editingPeriodId === p.id;
              return (
                <div key={p.id} className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-6 py-3 items-center hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                        <div className="h-px w-2 bg-slate-200" />
                        <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-slate-700">{new Date(p.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                        <div className="h-px w-4 bg-slate-200" />
                        <span className="text-sm font-bold text-slate-700">{new Date(p.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {p.isOpen ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ouverte
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                        Terminée
                      </span>
                    )}
                  </div>
                  <div className="flex justify-center">
                     <div className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-black rounded-full border border-indigo-100">{p._count?.actionsDone || 0} act.</div>
                  </div>
                  <div className="flex justify-end gap-1.5">
                    {isEditing ? (
                      <>
                        <button onClick={() => savePeriodEdit(p.id)} title="Sauvegarder" className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"><Check size={16} /></button>
                        <button onClick={cancelEditing} title="Annuler" className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditing(p)} title="Modifier les dates" className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                        {!p.isOpen && (
                          <button onClick={() => openPeriod(p.id)} title="Réouvrir la période" className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"><Unlock size={16} /></button>
                        )}
                        <button onClick={() => askDeletePeriod(p.id)} title="Supprimer la période" className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            
            {periods.length === 0 && (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <Calendar size={32} className="text-slate-200" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Aucune période configurée</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {status && (
          <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-4 duration-300">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
               {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
               <span className="font-bold text-sm">{status.msg}</span>
            </div>
          </div>
      )}

      {showConfirm && (
        <ConfirmDialog 
          isOpen={true} 
          onClose={() => setShowConfirm(null)} 
          onConfirm={() => deletePeriod(showConfirm.id)} 
          title="Attention: Suppression de période" 
          description={showConfirm.message} 
        />
      )}
    </div>
  );
}
