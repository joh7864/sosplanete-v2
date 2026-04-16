'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Box, Loader2, Save, CheckCircle, AlertTriangle, Building2, Link as LinkIcon, Lock, Unlock, Trash2, RotateCcw, Plus, ArrowUpDown, ChevronUp, ChevronDown, Edit3, Check, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData } from '@/utils/storage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Period {
  id: number;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  _count?: { actionsDone: number };
}

import { useRouter } from 'next/navigation';

export function GeneralSettings({ instanceId, currentInstance, onUpdate }: { instanceId: number | null, currentInstance: any, onUpdate: () => void }) {
  const router = useRouter();
  const isNew = !instanceId;
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  // Settings Ecole
  const [schoolName, setSchoolName] = useState(currentInstance?.schoolName || '');
  const [hostUrl, setHostUrl] = useState(currentInstance?.hostUrl || '');
  const [isOpen, setIsOpen] = useState(currentInstance?.isOpen || false);
  const [unlockedChapters, setUnlockedChapters] = useState(currentInstance?.unlockedChapters?.toString() || '0');
  const [adminId, setAdminId] = useState<number | null>(currentInstance?.adminId || null);

  // Settings Config Jeu
  const [gameStartDate, setGameStartDate] = useState('');
  const [gamePeriodsCount, setGamePeriodsCount] = useState('24');

  // Périodes de saisies
  const [periods, setPeriods] = useState<Period[]>([]);
  const [sortField, setSortField] = useState<'date' | 'actions'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showConfirm, setShowConfirm] = useState<{ id: number, message: string } | null>(null);

  // Édition de période
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  
  // Utiliser la récupération des utilisateurs AM pour le select
  const [amUsers, setAmUsers] = useState<any[]>([]);

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
    // Trouver la période la plus récente (par date de fin)
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
    setEditingPeriodId(-1); // ID spécial pour le nouvel élément
  };

  const savePeriodEdit = async (id: number) => {
    setSaving(true);
    try {
      const isNew = id === -1;
      const url = isNew 
        ? `${process.env.NEXT_PUBLIC_API_URL}/periods`
        : `${process.env.NEXT_PUBLIC_API_URL}/periods/${id}`;
      
      const method = 'POST'; // Le contrôleur utilise POST pour les deux cas (create et update :id)
      const body = { 
        startDate: new Date(editStartDate).toISOString(), 
        endDate: new Date(editEndDate).toISOString(),
        ...(isNew ? { instanceId } : {})
      };
      if (!instanceId) return; // Sécurité

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

  useEffect(() => {
    if (currentInstance) {
      setSchoolName(currentInstance.schoolName || '');
      setHostUrl(currentInstance.hostUrl || '');
      setIsOpen(currentInstance.isOpen || false);
      setUnlockedChapters(currentInstance.unlockedChapters?.toString() || '0');
      setAdminId(currentInstance.adminId || null);
      if (currentInstance.gameStartDate) setGameStartDate(new Date(currentInstance.gameStartDate).toISOString().split('T')[0]);
      if (currentInstance.gamePeriodsCount) setGamePeriodsCount(currentInstance.gamePeriodsCount.toString());
    }
    fetchAMUsers();
    if (instanceId) fetchPeriods();
  }, [currentInstance, instanceId]);

  const fetchAMUsers = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, { headers: { Authorization: `Bearer ${getAuthData('access_token')}` } });
      if (resp.ok) setAmUsers((await resp.json()).filter((u: any) => u.role === 'AM' || u.role === 'AS'));
    } catch (e) {}
  };

  const fetchPeriods = async () => {
    if (!instanceId) return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/periods?instanceId=${instanceId}`, { headers: { Authorization: `Bearer ${getAuthData('access_token')}` } });
      if (resp.ok) {
        setPeriods(await resp.json());
      }
    } catch (e) {}
  };

  const handleSaveGeneral = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const url = isNew 
        ? `${process.env.NEXT_PUBLIC_API_URL}/instances`
        : `${process.env.NEXT_PUBLIC_API_URL}/instances/${instanceId}`;
      
      const method = isNew ? 'POST' : 'PATCH';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
        body: JSON.stringify({ 
          schoolName, 
          hostUrl, 
          isOpen, 
          unlockedChapters: parseInt(unlockedChapters), 
          adminId, 
          gameStartDate: gameStartDate ? new Date(gameStartDate).toISOString() : null, 
          gamePeriodsCount: parseInt(gamePeriodsCount) 
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setStatus({ type: 'success', msg: isNew ? 'Espace créé avec succès !' : 'Paramètres enregistrés !' });
        setTimeout(() => setStatus(null), 3000);
        
        if (isNew && data.id) {
          // Si c'est une création, on redirige vers la page de l'instance
          router.push(`/dashboard/organization?tab=general&instanceId=${data.id}`);
        } else {
          onUpdate();
        }
      } else {
        setStatus({ type: 'error', msg: "Erreur d'enregistrement." });
      }
    } catch (e) {
      setStatus({ type: 'error', msg: 'Erreur réseau.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (currentInstance) {
      setSchoolName(currentInstance.schoolName || '');
      setHostUrl(currentInstance.hostUrl || '');
      setIsOpen(currentInstance.isOpen || false);
      setUnlockedChapters(currentInstance.unlockedChapters?.toString() || '0');
      setAdminId(currentInstance.adminId || null);
      if (currentInstance.gameStartDate) setGameStartDate(new Date(currentInstance.gameStartDate).toISOString().split('T')[0]);
      if (currentInstance.gamePeriodsCount) setGamePeriodsCount(currentInstance.gamePeriodsCount.toString());
    }
  };

  const createNextPeriod = async () => {
    setSaving(true);
    try {
      let nextStart = new Date();
      if (periods.length > 0) {
        const lastPeriod = periods[periods.length - 1];
        nextStart = new Date(lastPeriod.endDate);
        nextStart.setDate(nextStart.getDate() + 1);
      }
      
      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextEnd.getDate() + 6); // 1 semaine

      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
        body: JSON.stringify({ 
          startDate: nextStart.toISOString(), 
          endDate: nextEnd.toISOString(), 
          instanceId: instanceId 
        }),
      });

      if (resp.ok) {
        fetchPeriods();
        setStatus({ type: 'success', msg: 'Période ajoutée !' });
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* 2 BLOCS EN GRILLE : Paramètres École & Jeu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6 border-none shadow-xl bg-white/95 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500"><Building2 size={20} /></div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Paramètres de l'école</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration de base</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <Input label="Nom de l'établissement" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required icon={<Building2 size={16} />} />
            <Input label="URL personnalisée" value={hostUrl} onChange={(e) => setHostUrl(e.target.value)} icon={<LinkIcon size={16} />} />
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Statut d'Accès</label>
                <button type="button" onClick={() => setIsOpen(!isOpen)} className={`px-4 py-3 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${isOpen ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-tight ${isOpen ? 'text-emerald-600' : 'text-amber-600'}`}>{isOpen ? 'Ouvert' : 'Fermé'}</span>
                  </div>
                  {isOpen ? <Unlock size={16} className="text-emerald-500" /> : <Lock size={16} className="text-amber-500" />}
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Chapitres Histoire</label>
                <Input type="number" min="0" max="10" value={unlockedChapters} onChange={(e) => setUnlockedChapters(e.target.value)} className="!py-2" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
               <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Gestionnaire Principal</label>
               <select value={adminId || ''} onChange={(e) => setAdminId(e.target.value ? Number(e.target.value) : null)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-600 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all">
                  <option value="">-- Aucun --</option>
                  {amUsers.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
               </select>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-3">
             <button onClick={handleReset} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <RotateCcw size={14} /> Annuler
             </button>
             <Button onClick={() => handleSaveGeneral()} disabled={saving} className="bg-emerald-600 text-white px-6 h-11 rounded-xl text-xs font-black shrink-0">
                {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />} Enregistrer
             </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-6 border-none shadow-xl bg-white/95 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-sky-50 rounded-xl text-sky-500"><Calendar size={20} /></div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Configuration Jeu</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Période scolaire active</p>
            </div>
          </div>
          
          <div className="space-y-4 flex-1">
            <Input label="Date de début du jeu" type="date" value={gameStartDate} onChange={(e) => setGameStartDate(e.target.value)} icon={<Calendar size={16} />} />
            <Input label="Durée totale (semaines)" type="number" min="1" max="52" value={gamePeriodsCount} onChange={(e) => setGamePeriodsCount(e.target.value)} icon={<Box size={16} />} />
            
            <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 mt-4">
              <p className="text-[10px] font-bold text-sky-600 leading-relaxed uppercase tracking-tight">
                Cette configuration définit la structure temporelle globale utilisée par les algorithmes de calcul de l'impact planétaire.
              </p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-3">
             <button onClick={handleReset} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <RotateCcw size={14} /> Annuler
             </button>
             <Button onClick={() => handleSaveGeneral()} disabled={saving} className="bg-sky-600 text-white px-6 h-11 rounded-xl text-xs font-black shrink-0">
                {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />} Enregistrer
             </Button>
          </div>
        </GlassCard>
      </div>

      {/* BLOC 3 : Périodes de Saisie avec format TABLEAU CONDENSÉ - CACHÉ LORS D'UNE CRÉATION */}
      {!isNew && (
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
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-6 py-3 bg-slate-50 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors"
              onClick={() => toggleSort('date')}
            >
              Dates de la période
              {sortField === 'date' ? (
                sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
              ) : <ArrowUpDown size={10} className="opacity-30" />}
            </div>
            <div className="text-center">Statut</div>
            <div 
              className="flex items-center justify-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors"
              onClick={() => toggleSort('actions')}
            >
              Saisies
              {sortField === 'actions' ? (
                sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
              ) : <ArrowUpDown size={10} className="opacity-30" />}
            </div>
            <div className="text-right pr-2">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
            {/* NOVELLE LIGNE EN COURS D'AJOUT */}
            {isAddingNew && (
              <div key="new-period" className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-6 py-3 items-center bg-emerald-50/30 border-l-4 border-l-emerald-500 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={editStartDate} 
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                    />
                    <div className="h-px w-2 bg-slate-300" />
                    <input 
                      type="date" 
                      value={editEndDate} 
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-center">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-100 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Nouveau
                  </span>
                </div>

                <div className="flex justify-center">
                   <div className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-black rounded-full border border-slate-200">
                      0 act.
                   </div>
                </div>

                <div className="flex justify-end gap-1.5">
                  <button 
                    onClick={() => savePeriodEdit(-1)} 
                    title="Créer la période"
                    className="p-2 text-emerald-600 hover:bg-white rounded-lg transition-all shadow-sm bg-emerald-50"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={cancelEditing} 
                    title="Annuler"
                    className="p-2 text-rose-500 hover:bg-white rounded-lg transition-all shadow-sm bg-rose-50"
                  >
                    <X size={16} />
                  </button>
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
                        <input 
                          type="date" 
                          value={editStartDate} 
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                        <div className="h-px w-2 bg-slate-200" />
                        <input 
                          type="date" 
                          value={editEndDate} 
                          onChange={(e) => setEditEndDate(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-slate-700">
                          {new Date(p.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                        <div className="h-px w-4 bg-slate-200" />
                        <span className="text-sm font-bold text-slate-700">
                          {new Date(p.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex justify-center">
                    {p.isOpen ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Ouverte
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                        Terminée
                      </span>
                    )}
                  </div>

                  <div className="flex justify-center">
                     <div className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-black rounded-full border border-indigo-100">
                        {p._count?.actionsDone || 0} act.
                     </div>
                  </div>

                  <div className="flex justify-end gap-1.5">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => savePeriodEdit(p.id)} 
                          title="Sauvegarder"
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={cancelEditing} 
                          title="Annuler"
                          className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEditing(p)} 
                          title="Modifier les dates"
                          className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        {!p.isOpen && (
                          <button 
                            onClick={() => openPeriod(p.id)} 
                            title="Réouvrir la période"
                            className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Unlock size={16} />
                        </button>
                        )}
                        <button 
                          onClick={() => askDeletePeriod(p.id)} 
                          title="Supprimer la période"
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
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
    )}

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
