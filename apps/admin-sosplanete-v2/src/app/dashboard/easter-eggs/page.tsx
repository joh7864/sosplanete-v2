'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Sliders,
  Radar,
  Loader2,
  Building2,
  AlertCircle,
  ChevronDown,
  Plus,
  Trophy,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAuthData, setAuthData } from '@/utils/storage';
import { useSchoolYear } from '@/hooks/useSchoolYear';
import { useInstanceYear } from '@/hooks/useInstanceYear';
import { EasterEggsSeasonSettings } from '@/components/easter-eggs/EasterEggsSeasonSettings';
import { EasterEggsCatalogEditor } from '@/components/easter-eggs/EasterEggsCatalogEditor';
import { EasterEggsTrackingCockpit } from '@/components/easter-eggs/EasterEggsTrackingCockpit';
import { EasterEggFormModal } from '@/components/easter-eggs/EasterEggFormModal';
import { fetchAdminTracking } from '@/utils/easterEggApi';

export default function EasterEggsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="animate-spin text-emerald-500" size={48} />
          <span className="text-xs font-bold text-slate-400">Chargement de l'espace Easter Eggs...</span>
        </div>
      }
    >
      <EasterEggsContent />
    </Suspense>
  );
}

function EasterEggsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlInstanceId = searchParams.get('instanceId');
  const urlTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'settings' | 'catalog' | 'cockpit'>(
    urlTab === 'settings' || urlTab === 'catalog' || urlTab === 'cockpit' ? urlTab : 'cockpit'
  );

  const [instanceId, setInstanceId] = useState<number | null>(null);
  const [managedInstances, setManagedInstances] = useState<any[]>([]);
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [cockpitViewMode, setCockpitViewMode] = useState<'live' | 'leaderboard'>('live');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { schoolYear } = useSchoolYear();
  const { instanceYearId, loading: resolvingYear } = useInstanceYear(instanceId, schoolYear);

  const [settingsData, setSettingsData] = useState<any>(null);

  // 1. Initialisation de l'instanceId depuis l'URL ou le storage
  useEffect(() => {
    if (urlInstanceId) {
      setInstanceId(parseInt(urlInstanceId));
    } else {
      const savedId = getAuthData('active_instance_id');
      if (savedId) setInstanceId(parseInt(savedId));
    }
  }, [urlInstanceId]);

  // 2. Chargement et synchronisation des Espaces (Instances)
  useEffect(() => {
    const savedInstances = getAuthData('managed_instances');
    if (savedInstances) {
      try {
        const parsed = JSON.parse(savedInstances);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setManagedInstances(parsed);
          if (!instanceId && !urlInstanceId) {
            const savedActiveId = getAuthData('active_instance_id');
            const target = parsed.find((i: any) => i.id.toString() === savedActiveId) || parsed[0];
            setInstanceId(target.id);
            setAuthData('active_instance_id', target.id.toString());
          }
        }
      } catch (e) {
        console.error('Erreur parsing managed_instances:', e);
      }
    }

    const fetchInstances = async () => {
      try {
        const token = getAuthData('access_token');
        if (!token) return;
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances?schoolYear=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const list = await resp.json();
          if (Array.isArray(list) && list.length > 0) {
            setManagedInstances(list);
            setAuthData('managed_instances', JSON.stringify(list));
            if (!instanceId && !urlInstanceId) {
              const savedActiveId = getAuthData('active_instance_id');
              const target = list.find((i: any) => i.id.toString() === savedActiveId) || list[0];
              setInstanceId(target.id);
              setAuthData('active_instance_id', target.id.toString());
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement instances:', err);
      }
    };

    fetchInstances();
  }, [schoolYear]);

  // 3. Fermer le dropdown lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = () => setIsSpaceDropdownOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // 4. Chargement des settings de la saison dès que instanceYearId est disponible
  useEffect(() => {
    if (instanceYearId) {
      fetchAdminTracking(instanceYearId)
        .then((res) => {
          if (res?.settings) setSettingsData(res.settings);
        })
        .catch((e) => console.error('Erreur chargement settings initiales:', e));
    }
  }, [instanceYearId]);

  const handleTabChange = (tab: 'settings' | 'catalog' | 'cockpit') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    if (instanceId) params.set('instanceId', instanceId.toString());
    router.replace(`/dashboard/easter-eggs?${params.toString()}`);
  };

  const handleSelectInstance = (id: number) => {
    setInstanceId(id);
    setAuthData('active_instance_id', id.toString());
    window.dispatchEvent(new Event('storage'));
    setIsSpaceDropdownOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('instanceId', id.toString());
    params.set('tab', activeTab);
    router.replace(`/dashboard/easter-eggs?${params.toString()}`);
  };

  const currentInstance = managedInstances.find((i) => i.id === instanceId);

  const tabs = [
    { id: 'cockpit', label: 'Cockpit & Leaderboard', icon: Radar },
    { id: 'catalog', label: 'Catalogue & Ordre', icon: Sparkles },
    { id: 'settings', label: 'Paramètres Saison', icon: Sliders },
  ];

  return (
    <div className="flex flex-col min-h-full pb-16">
      {/* TopBar avec sélecteur d'espace homogène et onglets intégrés */}
      <TopBar
        title={
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥚</span>
            <span>Easter Eggs & Énigmes SF</span>
          </div>
        }
        subtitle={
          currentInstance
            ? `Pilotage, Catalogue & Paramètres de la Saison • Espace ${currentInstance.schoolName}`
            : "Pilotage, Catalogue & Paramètres de la Saison"
        }
        actions={
          activeTab === 'cockpit' ? (
            <div className="flex items-center gap-2.5">
              {/* Bascule Vue en direct / Vue Leaderboard */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCockpitViewMode('live')}
                  className={`p-1.5 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                    cockpitViewMode === 'live'
                      ? 'bg-white shadow-sm text-emerald-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Vue En Direct (Période en cours)"
                >
                  <Radar size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setCockpitViewMode('leaderboard')}
                  className={`p-1.5 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                    cockpitViewMode === 'leaderboard'
                      ? 'bg-white shadow-sm text-emerald-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Vue Leaderboard Général (Saison)"
                >
                  <Trophy size={16} />
                </button>
              </div>

              {/* Bouton Créer un nouveau Easter egg */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="p-2 flex items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all border-none cursor-pointer"
                title="Créer un nouveau Easter egg"
              >
                <Plus size={18} />
              </motion.button>
            </div>
          ) : undefined
        }
        selector={
          managedInstances.length > 0 ? (
            <div className="relative group" id="easter-eggs-space-switcher-wrapper">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (managedInstances.length > 1) {
                    setIsSpaceDropdownOpen(!isSpaceDropdownOpen);
                  }
                }}
                className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-emerald-500 flex items-center justify-center cursor-pointer relative"
                title={
                  currentInstance
                    ? `Espace actuel : ${currentInstance.schoolName} — Cliquer pour changer d'établissement`
                    : "Changer d'Espace"
                }
              >
                <Building2 size={24} />
              </motion.button>

              {/* Floating Tooltip Bubble */}
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 opacity-0 group-hover:opacity-100 transition-all duration-150 whitespace-nowrap z-50">
                {currentInstance ? `Espace : ${currentInstance.schoolName}` : "Changer d'Espace"}
              </span>

              <AnimatePresence>
                {isSpaceDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-50 z-[90] p-2 max-h-[400px] overflow-y-auto custom-scrollbar"
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-2 mb-1 sticky top-0 bg-white/95 backdrop-blur-xl z-10 flex items-center justify-between">
                      <span>Changer d'Espace</span>
                      <span className="text-emerald-500 font-bold">{managedInstances.length}</span>
                    </p>
                    {managedInstances.map((inst) => {
                      const isSelected = inst.id === instanceId;
                      return (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => handleSelectInstance(inst.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-700 font-bold'
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Building2
                              size={14}
                              className={isSelected ? 'text-emerald-500' : 'text-slate-400'}
                            />
                          </div>
                          <div className="flex flex-col text-left overflow-hidden">
                            <span className="text-xs font-black truncate w-full">{inst.schoolName}</span>
                            <span className="text-[8px] font-bold opacity-60 truncate w-full">
                              {inst.academy || inst.city || inst.hostUrl || 'Établissement'}
                            </span>
                          </div>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ml-auto" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : undefined
        }
        bottomContent={
          <>
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <React.Fragment key={tab.id}>
                  {idx > 0 && <div className="w-px h-5 bg-slate-200 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`flex items-center gap-2.5 py-4 px-6 text-[13px] font-black uppercase tracking-widest transition-all duration-300 relative whitespace-nowrap ${
                      isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-emerald-500' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeEasterEggsTab"
                        className="absolute bottom-[-1px] left-6 right-6 h-[3px] bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.3)]"
                      />
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </>
        }
      />

      {/* Main Tab Content */}
      <div className="flex-1 pt-8">
        {resolvingYear ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-emerald-500" size={36} />
            <span className="text-xs font-bold text-slate-400">Résolution de l'année scolaire...</span>
          </div>
        ) : !instanceYearId && activeTab !== 'catalog' ? (
          <GlassCard className="p-10 text-center bg-white/95 rounded-3xl border border-slate-200/80 shadow-md max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
              <Building2 size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Sélectionnez un Établissement</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Choisissez un espace pour afficher son cockpit de suivi en temps réel et ses paramètres de saison.
            </p>
            {managedInstances.length > 0 && (
              <div className="flex flex-col gap-2 pt-2">
                {managedInstances.map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => handleSelectInstance(inst.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 size={16} className="text-slate-400 group-hover:text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">{inst.schoolName}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 uppercase tracking-wider">Choisir →</span>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'cockpit' && instanceYearId && (
              <motion.div
                key="cockpit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <EasterEggsTrackingCockpit
                  instanceYearId={instanceYearId}
                  viewModeProp={cockpitViewMode}
                  onViewModeChangeProp={setCockpitViewMode}
                />
              </motion.div>
            )}

            {activeTab === 'catalog' && (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <EasterEggsCatalogEditor />
              </motion.div>
            )}

            {activeTab === 'settings' && instanceYearId && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <EasterEggsSeasonSettings
                  instanceYearId={instanceYearId}
                  initialSettings={settingsData}
                  onSettingsSaved={() => {
                    fetchAdminTracking(instanceYearId).then((res) => {
                      if (res?.settings) setSettingsData(res.settings);
                    });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
