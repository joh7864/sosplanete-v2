'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2,
  Building2,
  ChevronDown,
  Loader2,
  Users,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { TrackingView } from '@/components/tracking/TrackingView';
import { getAuthData, setAuthData } from '@/utils/storage';
import { useSchoolYear } from '@/hooks/useSchoolYear';
import { useInstanceYear } from '@/hooks/useInstanceYear';

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="animate-spin text-emerald-500" size={48} />
          <span className="text-xs font-bold text-slate-400">
            Chargement des Statistiques & Suivi...
          </span>
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlInstanceId = searchParams.get('instanceId');

  const [instanceId, setInstanceId] = useState<number | null>(null);
  const [managedInstances, setManagedInstances] = useState<any[]>([]);
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const { schoolYear } = useSchoolYear();
  const { instanceYearId, loading: resolvingYear } = useInstanceYear(instanceId, schoolYear);

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

  const activeInstance = managedInstances.find((i) => i.id === instanceId);
  const activeInstanceName = activeInstance?.schoolName || 'Mon Établissement';

  const handleSelectInstance = (id: number) => {
    setInstanceId(id);
    setAuthData('active_instance_id', id.toString());
    setIsSpaceDropdownOpen(false);
    window.dispatchEvent(new Event('storage'));
    router.replace(`/dashboard/tracking?instanceId=${id}`);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar bg-slate-50/50">
      {/* TopBar */}
      <TopBar
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <BarChart2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-800 tracking-tight m-0">
                  Statistiques & Suivi
                </h1>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {schoolYear}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium m-0 mt-0.5">
                {activeInstanceName} • Mesure d'impact, actions, animaux débloqués & traçabilité
              </p>
            </div>
          </div>
        }
        selector={
          managedInstances.length > 1 ? (
            <div className="relative">
              <button
                onClick={() => setIsSpaceDropdownOpen(!isSpaceDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all"
              >
                <Building2 size={14} className="text-emerald-500" />
                <span className="truncate max-w-[160px]">{activeInstanceName}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              <AnimatePresence>
                {isSpaceDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 overflow-hidden"
                  >
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5">
                      Changer d'Établissement
                    </div>
                    {managedInstances.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => handleSelectInstance(inst.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-colors ${
                          inst.id === instanceId
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Building2
                          size={14}
                          className={inst.id === instanceId ? 'text-emerald-500' : 'text-slate-400'}
                        />
                        <span className="truncate flex-1">{inst.schoolName}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : undefined
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
        {!instanceId ? (
          <div className="py-20 flex flex-col items-center gap-6 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
              <Building2 size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                Sélectionnez un établissement
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choisissez l'établissement pour visualiser l'impact, le suivi des actions et la traçabilité des joueurs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {managedInstances.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => handleSelectInstance(inst.id)}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group"
                >
                  <Building2 size={22} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <span className="font-bold text-xs text-slate-800">{inst.schoolName}</span>
                </button>
              ))}
            </div>
          </div>
        ) : resolvingYear ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <Loader2 size={32} className="animate-spin text-emerald-500" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Chargement de l'année scolaire {schoolYear}...
            </span>
          </div>
        ) : (
          <TrackingView
            instanceId={instanceId}
            schoolYear={schoolYear}
            instanceYearId={instanceYearId ?? undefined}
            activeInstanceName={activeInstanceName}
            managedInstances={managedInstances}
          />
        )}
      </div>
    </div>
  );
}
