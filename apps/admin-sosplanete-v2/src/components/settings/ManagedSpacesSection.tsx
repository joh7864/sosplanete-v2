'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Trash2, Settings2, Lock, Unlock, Copy, User, Globe, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';
import { useRouter } from 'next/navigation';
import { useSchoolYear } from '@/hooks/useSchoolYear';
import { DuplicateYearModal } from '@/components/organization/DuplicateYearModal';

export function ManagedSpacesSection() {
  const [anchors, setAnchors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Year deletion states
  const [deleteYearInfo, setDeleteYearInfo] = useState<{ instanceId: number; schoolYear: string; schoolName: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Duplication states
  const [duplicateInstanceId, setDuplicateInstanceId] = useState<number | null>(null);
  const [duplicateSourceYear, setDuplicateSourceYear] = useState<string | null>(null);
  const [duplicateAvailableYears, setDuplicateAvailableYears] = useState<string[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [systemYears, setSystemYears] = useState<string[]>([]);

  const router = useRouter();
  const { setSchoolYear } = useSchoolYear();

  useEffect(() => {
    fetchProfile();
    fetchSystemYears();
  }, []);

  const fetchProfile = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const user = await resp.json();
        setCurrentUser(user);
        fetchAnchors(user.id);
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e);
      setLoading(false);
    }
  };

  const fetchAnchors = async (userId?: number) => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances?schoolYear=all`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        const activeUserId = userId ?? currentUser?.id;
        if (activeUserId) {
          const filtered = data
            .map((anchor: any) => {
              const filteredYears = anchor.instanceYears?.filter((iy: any) => iy.adminId === activeUserId) || [];
              return { ...anchor, instanceYears: filteredYears };
            })
            .filter((anchor: any) => anchor.instanceYears.length > 0);
          setAnchors(filtered);
        } else {
          setAnchors(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch anchors:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemYears = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/years`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        setSystemYears(await resp.json());
      }
    } catch (e) {
      console.error('Failed to fetch system years:', e);
    }
  };

  const handleDeleteYearConfig = async () => {
    if (!deleteYearInfo) return;
    setDeleteLoading(true);
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/instances/${deleteYearInfo.instanceId}/year?schoolYear=${deleteYearInfo.schoolYear}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
        }
      );
      if (resp.ok) {
        showStatus('success', `L'espace pour l'année ${deleteYearInfo.schoolYear} a été supprimé avec succès.`);
        fetchAnchors();
      } else {
        showStatus('error', "Erreur lors de la suppression de l'espace.");
      }
    } catch (e) {
      showStatus('error', 'Erreur réseau.');
    } finally {
      setDeleteLoading(false);
      setDeleteYearInfo(null);
    }
  };

  const handleDuplicateYear = (anchor: any, fromYear: string) => {
    setDuplicateInstanceId(anchor.id);
    setDuplicateSourceYear(fromYear);
    setDuplicateAvailableYears(systemYears);
    setDuplicateError(null);
    setShowDuplicateModal(true);
  };

  const handleDuplicateYearConfirm = async (targetYear: string) => {
    if (!duplicateInstanceId || !duplicateSourceYear) return;
    setDuplicateLoading(true);
    setDuplicateError(null);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${duplicateInstanceId}/duplicate-year`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({
          fromSchoolYear: duplicateSourceYear,
          toSchoolYear: targetYear,
        }),
      });

      if (resp.ok) {
        showStatus('success', `Espace dupliqué de ${duplicateSourceYear} vers ${targetYear} avec succès.`);
        setShowDuplicateModal(false);
        setSchoolYear(targetYear);
        fetchAnchors();
      } else {
        const errorData = await resp.json();
        setDuplicateError(errorData.message || 'Erreur lors de la duplication.');
      }
    } catch (e) {
      setDuplicateError('Erreur réseau.');
    } finally {
      setDuplicateLoading(false);
    }
  };

  const handleOpenConfig = (anchorId: number, schoolYear: string) => {
    setSchoolYear(schoolYear);
    router.push(`/dashboard/organization?tab=general&instanceId=${anchorId}`);
  };

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 grid grid-cols-1 gap-6 auto-rows-fr">
        {anchors.map((anchor) => (
          <GlassCard key={anchor.id} className="p-0 rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white/95 h-full flex flex-col">
            <div className="flex flex-col h-full">
              {/* Card Header (School Identity) */}
              <div className="p-8 pb-6 flex items-center justify-between border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-50">
                    <Building2 size={28} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{anchor.schoolName}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                        ID Global: #{anchor.id.toString().padStart(4, '0')}
                      </span>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">
                        {anchor.instanceYears?.length || 0} Années Actives
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* School Years list */}
              <div className="px-8 py-6 space-y-3 flex-grow overflow-y-auto">
                {anchor.instanceYears && anchor.instanceYears.length > 0 ? (
                  anchor.instanceYears
                    .sort((a: any, b: any) => b.schoolYear.localeCompare(a.schoolYear))
                    .map((iy: any) => (
                      <motion.div
                        key={iy.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group/year"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 items-center">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                                iy.isOpen ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'
                              }`}
                              title={iy.isOpen ? 'Espace Ouvert' : 'Espace Fermé'}
                            >
                              {iy.isOpen ? <Unlock size={18} /> : <Lock size={18} />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-700">{iy.schoolYear}</span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Année Scolaire
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 overflow-hidden">
                              {iy.admin?.avatar ? <img src={getAssetUrl(iy.admin.avatar)} className="w-full h-full object-cover" /> : <User size={14} />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-600 truncate max-w-[150px]">
                                {iy.admin?.name || iy.admin?.email?.split('@')[0] || 'Non assigné'}
                              </span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Gestionnaire
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Globe size={14} className="text-slate-300" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-bold text-slate-600 truncate max-w-[200px]">
                                {iy.hostUrl || "Pas d'URL"}
                              </span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Accès Espace
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-6">
                          <button
                            onClick={() =>
                              setDeleteYearInfo({
                                instanceId: anchor.id,
                                schoolYear: iy.schoolYear,
                                schoolName: anchor.schoolName,
                              })
                            }
                            className="p-2.5 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            title="Supprimer la configuration de cette année"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDuplicateYear(anchor, iy.schoolYear)}
                            className="p-2.5 text-blue-500 bg-blue-50 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                            title="Dupliquer la configuration de cette année"
                          >
                            <Copy size={18} />
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
                    Aucun espace créé pour cet établissement
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        ))}

        {anchors.length === 0 && (
          <GlassCard className="p-0 rounded-[2.5rem] border-none shadow-2xl bg-white/95 h-full flex flex-col items-center justify-center py-20 min-h-[400px]">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="text-slate-200" size={40} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs text-center px-6">
              Vous ne gérez aucun espace actuellement
            </p>
          </GlassCard>
        )}
      </div>

      {/* Modals & Dialogs */}
      <AnimatePresence>
        {deleteYearInfo && (
          <ConfirmDialog
            isOpen={true}
            title={`Supprimer la configuration ${deleteYearInfo.schoolYear} ?`}
            description={`Attention ! Cette action supprimera définitivement toutes les données de jeu (équipes, élèves, scores, saisies) pour l'année ${deleteYearInfo.schoolYear}. L'établissement "${deleteYearInfo.schoolName}" lui-même sera conservé.`}
            confirmLabel={deleteLoading ? 'Suppression...' : 'Supprimer la configuration annuelle'}
            cancelLabel="Annuler"
            variant="danger"
            onConfirm={handleDeleteYearConfig}
            onClose={() => setDeleteYearInfo(null)}
          />
        )}

        {status && (
          <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-4 duration-300">
            <div
              className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
                status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}
            >
              {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <span className="font-bold text-sm">{status.msg}</span>
            </div>
          </div>
        )}
      </AnimatePresence>

      <DuplicateYearModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={handleDuplicateYearConfirm}
        sourceYear={duplicateSourceYear || ''}
        availableYears={duplicateAvailableYears}
        isLoading={duplicateLoading}
        error={duplicateError}
      />
    </div>
  );
}
