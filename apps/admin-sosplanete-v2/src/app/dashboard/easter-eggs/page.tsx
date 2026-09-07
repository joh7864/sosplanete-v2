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
  AlertCircle
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAuthData } from '@/utils/storage';
import { useSchoolYear } from '@/hooks/useSchoolYear';
import { useInstanceYear } from '@/hooks/useInstanceYear';
import { EasterEggsSeasonSettings } from '@/components/easter-eggs/EasterEggsSeasonSettings';
import { EasterEggsCatalogEditor } from '@/components/easter-eggs/EasterEggsCatalogEditor';
import { EasterEggsTrackingCockpit } from '@/components/easter-eggs/EasterEggsTrackingCockpit';
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
  const { schoolYear } = useSchoolYear();
  const { instanceYearId, loading: resolvingYear } = useInstanceYear(instanceId, schoolYear);

  const [settingsData, setSettingsData] = useState<any>(null);

  useEffect(() => {
    if (urlInstanceId) {
      setInstanceId(parseInt(urlInstanceId));
    } else {
      const savedId = getAuthData('active_instance_id');
      if (savedId) setInstanceId(parseInt(savedId));
    }
  }, [urlInstanceId]);

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
    router.replace(`/dashboard/easter-eggs?${params.toString()}`);
  };

  const tabs = [
    { id: 'cockpit', label: 'Cockpit & Leaderboard', icon: Radar },
    { id: 'catalog', label: 'Catalogue & Ordre', icon: Sparkles },
    { id: 'settings', label: 'Paramètres Saison', icon: Sliders },
  ];

  return (
    <div className="flex flex-col min-h-full pb-16">
      {/* TopBar avec onglets intégrés */}
      <TopBar
        title={
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥚</span>
            <span>Easter Eggs & Énigmes SF</span>
          </div>
        }
        subtitle="Pilotage, Catalogue & Paramètres de la Saison"
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
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Aucun établissement sélectionné</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Veuillez sélectionner un établissement dans le menu pour accéder au cockpit de suivi en direct et aux paramètres.
            </p>
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
                <EasterEggsTrackingCockpit instanceYearId={instanceYearId} />
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
