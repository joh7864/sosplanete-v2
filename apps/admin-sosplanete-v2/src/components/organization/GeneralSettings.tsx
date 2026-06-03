'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Box, Loader2, Save, CheckCircle, AlertTriangle, Building2, Link as LinkIcon, Lock, Unlock, Trash2, RotateCcw, Plus, ArrowUpDown, ChevronUp, ChevronDown, Edit3, Check, X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData, setAuthData } from '@/utils/storage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

export function GeneralSettings({ instanceId, currentInstance, onUpdate, schoolYear }: { instanceId: number | null, currentInstance: any, onUpdate: () => void, schoolYear: string }) {
  const router = useRouter();
  const { user, isManager } = useSession();
  const isNew = !instanceId;
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [schoolName, setSchoolName] = useState(currentInstance?.schoolName || '');
  const [icon, setIcon] = useState(currentInstance?.icon || '');
  const [hostUrl, setHostUrl] = useState(currentInstance?.hostUrl || '');
  const [isOpen, setIsOpen] = useState(currentInstance?.isOpen || false);
  const [unlockedChapters, setUnlockedChapters] = useState(currentInstance?.unlockedChapters?.toString() || '0');
  const [adminId, setAdminId] = useState<number | null>(currentInstance?.adminId || null);

  // Autocomplétion
  const [searchQuery, setSearchQuery] = useState(currentInstance?.schoolName || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedAnchorId, setSelectedAnchorId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [deleteWarning, setDeleteWarning] = useState<{ affectedActions: number, message: string } | null>(null);
  
  // Utiliser la récupération des utilisateurs AM pour le select
  const [amUsers, setAmUsers] = useState<any[]>([]);

  useEffect(() => {
    if (currentInstance) {
      setSchoolName(currentInstance.schoolName || '');
      setSearchQuery(currentInstance.schoolName || '');
      setIcon(currentInstance.icon || '');
      setHostUrl(currentInstance.hostUrl || '');
      setIsOpen(currentInstance.isOpen || false);
      setUnlockedChapters(currentInstance.unlockedChapters?.toString() || '0');
      setAdminId(currentInstance.adminId || null);
    } else {
      setSchoolName('');
      setSearchQuery('');
      setSelectedAnchorId(null);
      setIcon('');
      setHostUrl('');
      setIsOpen(false);
      setUnlockedChapters('0');
      if (isManager && user) {
        setAdminId(user.id);
      } else {
        setAdminId(null);
      }
    }
    if (!isManager && getAuthData('user_role') !== 'AM') {
      fetchAMUsers();
    }
  }, [currentInstance, instanceId, schoolYear, isManager, user]);

  useEffect(() => {
    if (isNew && searchQuery.length > 1 && !selectedAnchorId) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(async () => {
        try {
          const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/search?q=${encodeURIComponent(searchQuery)}`, {
            headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
          });
          if (resp.ok) {
            setSuggestions(await resp.json());
            setShowSuggestions(true);
          }
        } catch (e) {}
      }, 300);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery, isNew, selectedAnchorId]);

  const fetchAMUsers = async () => {
    if (getAuthData('user_role') === 'AM') return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, { headers: { Authorization: `Bearer ${getAuthData('access_token')}` } });
      if (resp.ok) setAmUsers((await resp.json()).filter((u: any) => u.role === 'AM' || u.role === 'AS'));
    } catch (e) {
      console.error('[GeneralSettings] fetchAMUsers failed:', e);
    }
  };

  const handleSaveGeneral = async (e?: React.FormEvent, force: boolean = false) => {
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
          schoolName: selectedAnchorId ? undefined : searchQuery, 
          instanceId: selectedAnchorId || undefined,
          icon,
          hostUrl, 
          isOpen, 
          unlockedChapters: parseInt(unlockedChapters), 
          adminId,
          currentSchoolYear: schoolYear,
          schoolYear,
          force,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setStatus({ type: 'success', msg: isNew ? 'Espace créé avec succès !' : 'Paramètres enregistrés !' });
        setTimeout(() => setStatus(null), 3000);
        if (isNew && data.id) {
          // Mise à jour locale pour éviter le saut d'instance au refresh
          setAuthData('active_instance_id', data.id.toString());
          await onUpdate();
          router.push(`/dashboard/organization?tab=periods&instanceId=${data.id}`);
        } else {
          onUpdate();
        }
      } else if (resp.status === 409) {
        const data = await resp.json();
        try {
          const parsed = JSON.parse(data.message);
          setDeleteWarning({ affectedActions: parsed.affectedActions, message: parsed.message });
        } catch (err) {
          setDeleteWarning({ affectedActions: data.affectedActions || 0, message: data.message });
        }
      } else {
        const errData = await resp.json().catch(() => ({}));
        console.error('[GeneralSettings] PATCH error:', JSON.stringify(errData));
        setStatus({ type: 'error', msg: `Erreur ${resp.status}: ${errData?.message || 'inconnu'}` });
      }
    } catch (e) {
      setStatus({ type: 'error', msg: 'Erreur réseau.' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteWarning = async () => {
    setDeleteWarning(null);
    await handleSaveGeneral(undefined, true);
  };

  const handleCancelDeleteWarning = () => {
    setDeleteWarning(null);
  };


  const handleReset = () => {
    if (currentInstance) {
      setSchoolName(currentInstance.schoolName || '');
      setIcon(currentInstance.icon || '');
      setHostUrl(currentInstance.hostUrl || '');
      setIsOpen(currentInstance.isOpen || false);
      setUnlockedChapters(currentInstance.unlockedChapters?.toString() || '0');
      setAdminId(currentInstance.adminId || null);
    }
  };

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!instanceId) {
      alert("Veuillez d'abord enregistrer l'établissement avant d'ajouter une icône.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${instanceId}/icon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthData('access_token')}`
        },
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        setIcon(data.url);
        onUpdate();
      }
    } catch (e) {
      console.error('Icon upload failed', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      <GlassCard className="relative p-0 rounded-3xl border-none shadow-2xl bg-white/95">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          
          {/* Left Column: Logo & Quick Info */}
          <div className="flex flex-col items-center justify-start p-10 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="relative group">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-40 h-40 rounded-3xl border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden cursor-pointer bg-white relative transition-all"
              >
                {icon ? (
                  <img src={icon.startsWith('/') || icon.startsWith('http') ? `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '')}${icon}` : ''} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                    <Building2 className="text-emerald-200" size={48} />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white" size={32} />
                </div>
              </motion.div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handleIconChange}
              />
            </div>

            <div className="mt-8 w-full space-y-4">
               <div className="flex flex-col items-center text-center">
                  <span className="text-xl font-black text-slate-800 tracking-tight">{schoolName || 'Nouvel Espace'}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                     Configuration Globale
                  </span>
               </div>

               {instanceId && (
                 <div className="pt-6 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-3 text-slate-500">
                       {isOpen ? <Unlock size={16} className="text-emerald-500" /> : <Lock size={16} className="text-amber-500" />}
                       <span className="text-xs font-bold leading-none">{isOpen ? 'Accès Ouvert' : 'Accès Fermé'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                       <Building2 size={16} className="text-sky-500" />
                       <span className="text-xs font-bold leading-none">ID #{instanceId.toString().padStart(4, '0')}</span>
                    </div>
                 </div>
               )}
            </div>
            
            {saving && (
               <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 tracking-widest animate-pulse">
                  <Loader2 className="animate-spin" size={12} /> Synchronisation...
               </div>
            )}
          </div>

          {/* Right Column: Forms */}
          <div className="p-12 flex flex-col gap-10">
            <div className="flex flex-col gap-10">
              
              {/* Identity section */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-full">Informations de base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2 relative">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'établissement</label>
                     <Input 
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedAnchorId(null);
                        }}
                        disabled={!isNew}
                        placeholder="Rechercher ou Créer..."
                        className="bg-slate-50 border-none h-14 rounded-2xl text-lg font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                          {suggestions.map((s) => {
                            const lastYear = s.instanceYears?.[0];
                            return (
                              <button
                                key={s.id}
                                className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-slate-50 flex items-center justify-between transition-colors"
                                onClick={() => {
                                  setSelectedAnchorId(s.id);
                                  setSearchQuery(s.schoolName);
                                  if (lastYear) {
                                    setHostUrl(lastYear.hostUrl || '');
                                    setIcon(lastYear.icon || '');
                                    if (!isManager) {
                                      setAdminId(s.adminId || null);
                                    }
                                  }
                                  setShowSuggestions(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800">{s.schoolName}</span>
                                  {lastYear && <span className="text-xs text-slate-400">Dernière config: {lastYear.schoolYear}</span>}
                                </div>
                                <Plus size={16} className="text-emerald-500" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {showSuggestions && suggestions.length === 0 && searchQuery.length > 1 && (
                        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden px-4 py-3 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-500" />
                            Créer la nouvelle école "{searchQuery}"
                          </span>
                        </div>
                      )}
                      {selectedAnchorId && isNew && (
                        <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1 ml-1">
                          <CheckCircle size={14} /> École liée existante (données pré-remplies)
                        </div>
                      )}
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL personnalisée</label>
                     <div className="relative">
                        <Input 
                          value={hostUrl}
                          onChange={(e) => setHostUrl(e.target.value)}
                          placeholder="mon-ecole.nnauru.org"
                          className="bg-slate-50 border-none h-14 rounded-2xl text-lg font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pl-12"
                        />
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                     </div>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest bg-sky-50 w-fit px-3 py-1 rounded-full flex items-center gap-2">
                   <Lock size={12} /> Gestion & Accès
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gestionnaire Principal</label>
                      {isManager ? (
                        <div className="relative">
                          <Input 
                            value={user ? (user.name ? `${user.name} (${user.email})` : user.email) : 'Chargement...'}
                            disabled
                            className="bg-slate-100 border-slate-200 h-14 rounded-2xl text-sm font-bold text-slate-500 pl-12 cursor-not-allowed"
                          />
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                      ) : (
                        <select 
                          value={adminId || ''} 
                          onChange={(e) => setAdminId(e.target.value ? Number(e.target.value) : null)} 
                          className="w-full bg-slate-50 border-none h-14 rounded-2xl px-4 font-bold text-slate-700 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                        >
                           <option value="">-- Aucun --</option>
                           {amUsers.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                        </select>
                      )}
                  </div>

                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chapitres Histoire</label>
                     <Input 
                       type="number" min="0" max="10" 
                       value={unlockedChapters} 
                       onChange={(e) => setUnlockedChapters(e.target.value)} 
                       className="bg-slate-50 border-none h-14 rounded-2xl text-lg font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm" 
                     />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Statut d'Accès de l'Espace</label>
                    <button type="button" onClick={() => setIsOpen(!isOpen)} className={`px-4 h-14 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${isOpen ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                      <div>
                        <span className={`text-xs font-black uppercase tracking-tight ${isOpen ? 'text-emerald-600' : 'text-amber-600'}`}>{isOpen ? 'Ouvert' : 'Fermé'}</span>
                      </div>
                      {isOpen ? <Unlock size={20} className="text-emerald-500" /> : <Lock size={20} className="text-amber-500" />}
                    </button>
                  </div>
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
                      className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> {status.msg}
                    </motion.div>
                  )}
                  {status && status.type === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-rose-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                      <AlertTriangle size={16} /> {status.msg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 ml-auto">
                  <Button 
                    onClick={() => handleSaveGeneral()} 
                    disabled={saving} 
                    className="h-14 px-10 gap-3 font-black shadow-xl shadow-emerald-500/20 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest text-sm"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Enregistrer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {deleteWarning && (
        <ConfirmDialog 
          isOpen={true} 
          onClose={handleCancelDeleteWarning} 
          onConfirm={handleConfirmDeleteWarning} 
          title="⚠️ Attention : Risque de perte de données" 
          description={deleteWarning.message} 
        />
      )}
    </div>
  );
}
