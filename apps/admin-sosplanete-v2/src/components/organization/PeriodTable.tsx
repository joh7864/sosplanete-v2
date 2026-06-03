'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Loader2, Plus, ArrowUpDown, ChevronUp, ChevronDown, Edit3, Check, X, Unlock, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAuthData } from '@/utils/storage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Period {
  id: number;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  _count?: { actionsDone: number };
}

interface PeriodTableProps {
  instanceYearId: number;
  refreshTrigger: number;
}

export function PeriodTable({ instanceYearId, refreshTrigger }: PeriodTableProps) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const [sortField, setSortField] = useState<'date' | 'actions'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showConfirm, setShowConfirm] = useState<{ id: number, message: string } | null>(null);

  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  useEffect(() => {
    if (instanceYearId) {
      fetchPeriods();
    }
  }, [instanceYearId, refreshTrigger]);

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
      console.error('[PeriodTable] fetchPeriods failed:', e);
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
    nextEnd.setDate(nextEnd.getDate() + 6); // 1 week

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
      } else {
        setStatus({ type: 'error', msg: "Erreur d'enregistrement de la période." });
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', msg: 'Erreur réseau.' });
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const openPeriod = async (id: number) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/periods/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
        body: JSON.stringify({ isOpen: true }),
      });
      if (resp.ok) {
        fetchPeriods();
        setStatus({ type: 'success', msg: 'Période réouverte !' });
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus({ type: 'error', msg: "Erreur lors de la réouverture." });
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const askDeletePeriod = async (id: number) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/periods/${id}/impact`, { headers: { Authorization: `Bearer ${getAuthData('access_token')}` } });
      if (resp.ok) {
        const data = await resp.json();
        setShowConfirm({ id, message: `Voulez-vous vraiment supprimer cette période ? ${data.count} actions seront définitivement supprimées.` });
      } else {
        setShowConfirm({ id, message: `Voulez-vous vraiment supprimer cette période ?` });
      }
    } catch (e) {
      setShowConfirm({ id, message: `Voulez-vous vraiment supprimer cette période ?` });
    }
  };

  const deletePeriod = async (id: number) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/periods/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getAuthData('access_token')}` } });
      setShowConfirm(null);
      if (resp.ok) {
        fetchPeriods();
        setStatus({ type: 'success', msg: 'Période supprimée !' });
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus({ type: 'error', msg: "Erreur lors de la suppression." });
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
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
              <div key="new-period" className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-6 py-3 items-center bg-emerald-50/30 border-l-4 border-l-emerald-500">
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
        <div className="fixed bottom-8 right-8 z-[100]">
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
    </>
  );
}
