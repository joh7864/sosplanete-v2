'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Copy, ArrowRight, School, Calendar, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { WizardDraftState, WizardTeam, WizardStudent } from '@/types/wizard';
import { getAuthData } from '@/utils/storage';

interface Step1ModeProps {
  state: WizardDraftState;
  onChange: (updater: (prev: WizardDraftState) => WizardDraftState) => void;
}

export const Step1Mode: React.FC<Step1ModeProps> = ({ state, onChange }) => {
  const [instances, setInstances] = useState<any[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    fetchInstances();
  }, []);

  useEffect(() => {
    if (state.duplication.sourceInstanceId) {
      loadYearsForInstance(state.duplication.sourceInstanceId);
    }
  }, [state.duplication.sourceInstanceId]);

  const loadYearsForInstance = async (instanceId: number) => {
    try {
      const token = getAuthData('access_token');
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${instanceId}/years`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const years: string[] = await resp.json();
        if (years && years.length > 0) {
          setAvailableYears(years);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch years endpoint:', e);
    }

    // Fallback: check instances list or defaults
    const selected = instances.find((i) => i.id === instanceId);
    const years = selected?.instanceYears?.map((iy: any) => iy.schoolYear) || [];
    if (years.length > 0) {
      setAvailableYears(years);
    } else {
      setAvailableYears(['2025-2026', '2024-2025', '2023-2024']);
    }
  };

  const fetchInstances = async () => {
    setLoadingInstances(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances?schoolYear=all`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setInstances(data);
      }
    } catch (e) {
      console.error('Fetch instances error:', e);
    } finally {
      setLoadingInstances(false);
    }
  };

  const selectMode = (mode: 'ex_nihilo' | 'duplicate') => {
    onChange((prev) => ({
      ...prev,
      mode,
    }));
  };

  const fetchAndApplySourceData = async (instanceId: number, fromYear: string) => {
    try {
      const token = getAuthData('access_token');
      // 1. Fetch teams & children
      const teamsResp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams?instanceId=${instanceId}&schoolYear=${fromYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let mappedTeams: WizardTeam[] = [];
      let mappedStudents: WizardStudent[] = [];

      if (teamsResp.ok) {
        const rawTeams = await teamsResp.json();
        mappedTeams = rawTeams.map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color || '#10b981',
          icon: t.icon || '🌿',
          groups: (t.groups || []).map((g: any) => ({
            id: g.id,
            name: g.name,
            color: g.color || t.color,
            childrenCount: g.children?.length || g._count?.children || 0,
          })),
        }));

        rawTeams.forEach((t: any) => {
          (t.groups || []).forEach((g: any) => {
            (g.children || []).forEach((c: any) => {
              mappedStudents.push({
                pseudo: c.pseudo,
                password: c.password || '',
                avatar: c.avatar || '🌿',
                isDelegate: c.isDelegate || false,
                teamName: t.name,
                groupName: g.name,
              });
            });
          });
        });
      }

      // 2. Fetch local actions
      const actionsResp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/local-actions?instanceId=${instanceId}&schoolYear=${fromYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let selectedActionRefIds: number[] = [];
      if (actionsResp.ok) {
        const rawActions = await actionsResp.json();
        selectedActionRefIds = rawActions.map((la: any) => la.actionRefId || la.id);
      }

      onChange((prev) => ({
        ...prev,
        organization: {
          teams: mappedTeams.length > 0 ? mappedTeams : prev.organization.teams,
          students: mappedStudents,
        },
        catalog: {
          ...prev.catalog,
          selectedActionRefIds: selectedActionRefIds.length > 0 ? selectedActionRefIds : prev.catalog.selectedActionRefIds,
        },
      }));
    } catch (e) {
      console.error('Error fetching source instance data:', e);
    }
  };

  const handleSourceInstanceChange = (instanceId: number) => {
    loadYearsForInstance(instanceId);
    const selected = instances.find((i) => i.id === instanceId);
    const years = selected?.instanceYears?.map((iy: any) => iy.schoolYear) || [];
    const fromYear = years[0] || '2025-2026';

    // Calculate target year N+1 automatically
    const match = fromYear.match(/^(\d{4})/);
    const startYear = match ? parseInt(match[1], 10) : 2025;
    const toYear = `${startYear + 1}-${startYear + 2}`;

    onChange((prev) => ({
      ...prev,
      duplication: {
        ...prev.duplication,
        sourceInstanceId: instanceId,
        fromSchoolYear: fromYear,
        toSchoolYear: toYear,
      },
      identity: {
        ...prev.identity,
        selectedAnchorId: instanceId,
        schoolName: selected?.schoolName || prev.identity.schoolName,
        schoolYear: toYear,
        hostUrl: selected?.instanceYears?.[0]?.hostUrl || prev.identity.hostUrl,
        icon: selected?.instanceYears?.[0]?.icon || prev.identity.icon,
        adminId: selected?.adminId || prev.identity.adminId,
      },
    }));

    // Auto fetch source data
    fetchAndApplySourceData(instanceId, fromYear);
  };

  return (
    <div>
      <StepHeader
        stepNumber={1}
        title="Comment souhaitez-vous créer votre espace ?"
        subtitle="Sélectionnez le mode de démarrage le plus adapté à votre situation pour initialiser les paramètres."
        objective="Choisir entre une création vierge de zéro ou le clonage d'une saison précédente."
        impact="Le mode Duplication vous fait gagner du temps en conservant vos équipes, catégories et réglages de l'an dernier."
        tip="Si votre école a déjà participé à SOS Planète, privilégiez la duplication pour reconduire votre configuration."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Option A : Ex Nihilo */}
        <div
          onClick={() => selectMode('ex_nihilo')}
          className={`cursor-pointer rounded-2xl p-6 md:p-8 transition-all duration-300 border-2 flex flex-col justify-between ${
            state.mode === 'ex_nihilo'
              ? 'bg-emerald-50/70 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20'
              : 'bg-white/80 border-slate-200/80 hover:border-emerald-300 hover:shadow-md'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                <Sparkles size={28} />
              </div>
              {state.mode === 'ex_nihilo' && (
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Check size={16} strokeWidth={3} />
                </span>
              )}
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              Création Ex Nihilo
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Idéal pour un <strong>nouvel établissement</strong> ou pour repartir d'une page blanche. Vous configurerez l'identité, les équipes et le catalogue étape par étape.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>Configuration vierge guidée</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Option B : Duplication */}
        <div
          onClick={() => selectMode('duplicate')}
          className={`cursor-pointer rounded-2xl p-6 md:p-8 transition-all duration-300 border-2 flex flex-col justify-between ${
            state.mode === 'duplicate'
              ? 'bg-blue-50/70 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20'
              : 'bg-white/80 border-slate-200/80 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-inner">
                <Copy size={28} />
              </div>
              {state.mode === 'duplicate' && (
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Check size={16} strokeWidth={3} />
                </span>
              )}
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              Duplication / Report Annuel
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Idéal pour <strong>reconduire une saison N vers N+1</strong>. Clone la structure, les équipes, le catalogue personnalisé et décale automatiquement les dates de +1 an.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
            <span>Clonage instantané avec scores remis à 0</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Bloc de sélection de la source si mode == 'duplicate' */}
      {state.mode === 'duplicate' && (
        <div className="p-6 md:p-8 rounded-2xl bg-white border border-blue-200 shadow-lg shadow-blue-500/5 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">
                Sélection de l'Espace Source & Options de Clonage
              </h4>
              <p className="text-xs text-slate-500">
                Indiquez l'établissement et l'année scolaire à reporter sur la nouvelle saison.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {/* Espace Source */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Établissement Source *
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={state.duplication.sourceInstanceId || ''}
                onChange={(e) => handleSourceInstanceChange(parseInt(e.target.value, 10))}
              >
                <option value="">-- Choisir une école --</option>
                {instances.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.schoolName}
                  </option>
                ))}
              </select>
            </div>

            {/* Année Source */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Année Scolaire Source *
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={state.duplication.fromSchoolYear}
                onChange={(e) => {
                  const fromYear = e.target.value;
                  const match = fromYear.match(/^(\d{4})/);
                  const startYear = match ? parseInt(match[1], 10) : 2024;
                  const toYear = `${startYear + 1}-${startYear + 2}`;
                  onChange((prev) => ({
                    ...prev,
                    duplication: { ...prev.duplication, fromSchoolYear: fromYear, toSchoolYear: toYear },
                    identity: { ...prev.identity, schoolYear: toYear },
                  }));
                  if (state.duplication.sourceInstanceId) {
                    fetchAndApplySourceData(state.duplication.sourceInstanceId, fromYear);
                  }
                }}
              >
                {availableYears.length > 0 ? (
                  availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2023-2024">2023-2024</option>
                  </>
                )}
              </select>
            </div>

            {/* Année Cible */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Année Scolaire Cible *
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-blue-800 cursor-not-allowed"
                value={state.duplication.toSchoolYear}
                readOnly
                placeholder="2025-2026"
              />
            </div>
          </div>

          {/* Options de duplication des élèves */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Gestion des effectifs élèves
            </h5>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="cloneChildrenOption"
                  checked={state.duplication.cloneChildren === true}
                  onChange={() => onChange((prev) => ({
                    ...prev,
                    duplication: { ...prev.duplication, cloneChildren: true }
                  }))}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    Option 1 : Cloner la structure (Équipes + Classes) ET les comptes élèves
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Les pseudos, mots de passe et avatars sont reconduits pour la nouvelle année avec les compteurs d'actions remis à zéro.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="cloneChildrenOption"
                  checked={state.duplication.cloneChildren === false}
                  onChange={() => onChange((prev) => ({
                    ...prev,
                    duplication: { ...prev.duplication, cloneChildren: false }
                  }))}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    Option 2 : Cloner uniquement la structure (Équipes + Classes vides)
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Idéal si les élèves changent complètement : les classes restent créées et vous pourrez importer un nouveau fichier CSV à l'étape 4.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
