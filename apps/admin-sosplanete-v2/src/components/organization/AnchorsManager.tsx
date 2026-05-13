'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Search, Trash2, Edit3, Save, X, AlertTriangle, CheckCircle, Loader2, User, Globe, Settings2, Lock, Unlock } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';
import { useRouter } from 'next/navigation';
import { useSchoolYear } from '@/hooks/useSchoolYear';

export function AnchorsManager() {
  const [anchors, setAnchors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteYearInfo, setDeleteYearInfo] = useState<{instanceId: number, schoolYear: string, schoolName: string} | null>(null);
  const router = useRouter();
  const { setSchoolYear } = useSchoolYear();

  useEffect(() => {
    fetchAnchors();
  }, []);

  const fetchAnchors = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances?schoolYear=all`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        setAnchors(await resp.json());
      }
    } catch (e) {
      console.error('Failed to fetch anchors:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (id: number) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({ schoolName: editName }),
      });
      if (resp.ok) {
        setAnchors(anchors.map(a => a.id === id ? { ...a, schoolName: editName } : a));
        setEditingId(null);
        showStatus('success', 'Nom de l\'établissement mis à jour (impact global).');
      } else {
        showStatus('error', 'Erreur lors de la mise à jour.');
      }
    } catch (e) {
      showStatus('error', 'Erreur réseau.');
    }
  };

  const handleDeleteAnchor = async (id: number) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
      });
      if (resp.ok) {
        setAnchors(anchors.filter(a => a.id !== id));
        showStatus('success', 'Établissement et tout son historique supprimés définitivement.');
      } else {
        showStatus('error', 'Erreur lors de la suppression.');
      }
    } catch (e) {
      showStatus('error', 'Erreur réseau.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleDeleteYearConfig = async () => {
    if (!deleteYearInfo) return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${deleteYearInfo.instanceId}/year?schoolYear=${deleteYearInfo.schoolYear}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        showStatus('success', `Configuration de l'année ${deleteYearInfo.schoolYear} supprimée.`);
        fetchAnchors();
      } else {
        showStatus('error', 'Erreur lors de la suppression de l\'année.');
      }
    } catch (e) {
      showStatus('error', 'Erreur réseau.');
    } finally {
      setDeleteYearInfo(null);
    }
  };

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  };

  const filteredAnchors = anchors.filter(a => a.schoolName.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenConfig = (anchorId: number, schoolYear: string) => {
    setSchoolYear(schoolYear);
    router.push(`/dashboard/organization?tab=general&instanceId=${anchorId}`);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Search Bar Premium */}
      <div className="flex items-center gap-4 bg-white/80 p-3 rounded-2xl border border-slate-100 shadow-xl backdrop-blur-xl sticky top-0 z-10">
        <div className="bg-emerald-50 p-3 rounded-xl shadow-inner text-emerald-500">
          <Search size={20} />
        </div>
        <input 
          type="text"
          placeholder="Rechercher une école globale..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none text-slate-700 font-black text-lg placeholder:text-slate-300 placeholder:font-bold outline-none"
        />
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
           <Building2 size={16} className="text-slate-400" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{filteredAnchors.length} Écoles</span>
        </div>
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredAnchors.map((anchor) => (
          <GlassCard key={anchor.id} className="p-0 rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white/95">
            <div className="flex flex-col">
              
              {/* Header de l'école */}
              <div className="p-8 pb-6 flex items-center justify-between border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-50">
                    <Building2 size={28} />
                  </div>
                  <div className="flex flex-col">
                    {editingId === anchor.id ? (
                      <div className="flex items-center gap-2">
                        <Input 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-10 text-lg font-black min-w-[300px] bg-white"
                          autoFocus
                        />
                        <button onClick={() => handleUpdateName(anchor.id)} className="p-2.5 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all shadow-sm">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2.5 text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all shadow-sm">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">{anchor.schoolName}</h3>
                          <button 
                            onClick={() => { setEditingId(anchor.id); setEditName(anchor.schoolName); }}
                            className="p-1.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Renommer globalement"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">ID Global: #{anchor.id.toString().padStart(4, '0')}</span>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">{anchor.instanceYears?.length || 0} Années Actives</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setDeleteId(anchor.id)}
                  className="p-4 text-rose-400 hover:text-white hover:bg-rose-500 rounded-2xl transition-all shadow-sm hover:shadow-rose-500/20"
                  title="Destruction totale de l'école"
                >
                  <Trash2 size={24} />
                </button>
              </div>

              {/* Liste des années scolaire (Instances) */}
              <div className="px-8 py-6 space-y-3">
                 {anchor.instanceYears && anchor.instanceYears.length > 0 ? (
                   anchor.instanceYears.sort((a: any, b: any) => b.schoolYear.localeCompare(a.schoolYear)).map((iy: any) => (
                     <motion.div 
                        key={iy.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group/year"
                     >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 items-center">
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${iy.isOpen ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`} title={iy.isOpen ? 'Espace Ouvert' : 'Espace Fermé'}>
                                 {iy.isOpen ? <Unlock size={18} /> : <Lock size={18} />}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-sm font-black text-slate-700">{iy.schoolYear}</span>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Année Scolaire</span>
                              </div>
                           </div>

                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 overflow-hidden">
                                 {iy.admin?.avatar ? <img src={getAssetUrl(iy.admin.avatar)} className="w-full h-full object-cover" /> : <User size={14} />}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-slate-600 truncate max-w-[150px]">{iy.admin?.name || iy.admin?.email?.split('@')[0] || 'Non assigné'}</span>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gestionnaire</span>
                              </div>
                           </div>

                           <div className="flex items-center gap-3">
                              <Globe size={14} className="text-slate-300" />
                              <div className="flex flex-col overflow-hidden">
                                 <span className="text-sm font-bold text-slate-600 truncate max-w-[200px]">{iy.hostUrl || 'Pas d\'URL'}</span>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Accès Espace</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-2 ml-6">
                           <button 
                             onClick={() => setDeleteYearInfo({ instanceId: anchor.id, schoolYear: iy.schoolYear, schoolName: anchor.schoolName })}
                             className="p-2.5 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                             title="Supprimer la configuration de cette année"
                           >
                              <Trash2 size={18} />
                           </button>
                           <button 
                             onClick={() => handleOpenConfig(anchor.id, iy.schoolYear)}
                             className="p-2.5 text-emerald-500 bg-emerald-50 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                             title="Ouvrir la configuration de cette année"
                           >
                              <Settings2 size={18} />
                           </button>
                        </div>
                     </motion.div>
                   ))
                 ) : (
                   <div className="py-4 text-center text-slate-300 font-bold text-xs uppercase tracking-widest italic">
                     Aucune instance créée pour cet établissement
                   </div>
                 )}
              </div>
            </div>
          </GlassCard>
        ))}

        {filteredAnchors.length === 0 && (
          <div className="text-center py-20">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="text-slate-200" size={40} />
             </div>
             <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Aucun établissement trouvé</p>
          </div>
        )}
      </div>

      {/* Warning Box - Now below the list */}
      <div className="bg-rose-50/50 border border-rose-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center md:items-start shadow-sm mt-12">
        <div className="bg-white p-4 rounded-2xl shadow-sm text-rose-500 shrink-0">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h2 className="text-xl font-black text-rose-900 tracking-tight mb-2">Attention</h2>
          <p className="text-sm font-medium text-rose-700/80 leading-relaxed">
            Renommer une école modifiera son nom pour toutes les années passées et futures. 
            La suppression détruira définitivement l'école et la totalité de ses données (équipes, élèves, historiques) pour toutes les années scolaires enregistrées.
            Cette action est irréversible et doit être effectuée avec prudence.
          </p>
        </div>
      </div>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {deleteId && (
          <ConfirmDialog 
            isOpen={true}
            title="Destruction Totale de l'École"
            description="Attention ! Vous êtes sur le point de supprimer définitivement cette école et TOUTES ses années scolaires associées (équipes, élèves, scores, historiques). Cette action est IRRÉVERSIBLE."
            confirmLabel="Détruire définitivement"
            cancelLabel="Annuler"
            variant="danger"
            onConfirm={() => handleDeleteAnchor(deleteId)}
            onClose={() => setDeleteId(null)}
          />
        )}

        {deleteYearInfo && (
          <ConfirmDialog 
            isOpen={true}
            title={`Supprimer la configuration ${deleteYearInfo.schoolYear} ?`}
            description={`Attention ! Cette action supprimera définitivement toutes les données de jeu (équipes, périodes, scores) pour l'année ${deleteYearInfo.schoolYear}. L'établissement "${deleteYearInfo.schoolName}" lui-même sera conservé.`}
            confirmLabel="Supprimer la configuration annuelle"
            cancelLabel="Annuler"
            variant="danger"
            onConfirm={handleDeleteYearConfig}
            onClose={() => setDeleteYearInfo(null)}
          />
        )}

        {status && (
          <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-4 duration-300">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
              {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <span className="font-bold text-sm">{status.msg}</span>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

