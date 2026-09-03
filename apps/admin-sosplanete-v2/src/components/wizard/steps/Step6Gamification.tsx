'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Globe, Sparkles, Sliders } from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { WizardDraftState } from '@/types/wizard';
import { getAuthData } from '@/utils/storage';

interface AnnualImpactDataType {
  moyCo2Monde?: number;
  moyEauMonde?: number;
  moyDechetsMonde?: number;
  dActuel?: number;
  difficultyFactor?: number;
  annualMultiplierWeight?: number;
  assiduityWeight?: number;
}

interface Step6GamificationProps {
  state: WizardDraftState;
  onChange: (updater: (prev: WizardDraftState) => WizardDraftState) => void;
}

export const Step6Gamification: React.FC<Step6GamificationProps> = ({ state, onChange }) => {
  const [annualData, setAnnualData] = useState<AnnualImpactDataType | null>(null);

  const fetchGlobalImpactData = useCallback(async () => {
    try {
      const yearInt = parseInt(state.identity.schoolYear?.split('-')[0] || '2025', 10);
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/impact/annual-data?year=${yearInt}`,
        { headers: { Authorization: `Bearer ${getAuthData('access_token')}` } },
      );
      if (resp.ok) {
        setAnnualData(await resp.json());
      }
    } catch (e) {
      console.warn('Fetch global annual impact data error:', e);
    }
  }, [state.identity.schoolYear]);

  useEffect(() => {
    fetchGlobalImpactData();
  }, [fetchGlobalImpactData]);

  return (
    <div>
      <StepHeader
        stepNumber={6}
        title="Paramètres de Gamification & Règles de Jeu"
        subtitle="Ajustez l'intensité du défi collectif et découvrez les constantes mondiales appliquées au calcul des impacts."
        objective="Calibrer l'objectif par élève, la vitesse de l'animal mascotte et le seuil de bienveillance."
        impact="Ces réglages influencent la jauge de la course Éco-Barre et la thermométrie de la Terre."
        tip="Les valeurs par défaut (8 actions / période, marge +2, bienveillance 40%) sont équilibrées pour toutes les classes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left Column : Local GameConfig Sliders */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-md">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-6">
              <Sliders size={18} className="text-emerald-600" />
              Réglages Locaux du Défi Établissement
            </h3>

            {/* Slider 1 : Actions cibles par enfant */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Objectif Moyen par Élève par Période
                </label>
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-sm shadow-sm">
                  {state.gamification.avgActionsPerChildPerPeriod} actions
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="20"
                step="1"
                value={state.gamification.avgActionsPerChildPerPeriod}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    gamification: {
                      ...prev.gamification,
                      avgActionsPerChildPerPeriod: parseInt(e.target.value, 10),
                    },
                  }))
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                <span>Doux (4)</span>
                <span>Recommandé (8)</span>
                <span>Intensif (20)</span>
              </div>
            </div>

            {/* Slider 2 : Marge animal */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Marge d&apos;Avance de l&apos;Animal Mascotte
                </label>
                <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-black text-sm shadow-sm">
                  +{state.gamification.animalAdvanceMargin} paliers
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={state.gamification.animalAdvanceMargin}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    gamification: {
                      ...prev.gamification,
                      animalAdvanceMargin: parseInt(e.target.value, 10),
                    },
                  }))
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Détermine l&apos;avance prise par la mascotte en début de période. Les enfants doivent la rattraper.
              </p>
            </div>

            {/* Slider 3 : Seuil de bienveillance */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Seuil de Bienveillance
                </label>
                <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-black text-sm shadow-sm">
                  {Math.round(state.gamification.bienveillanceThreshold * 100)} %
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={state.gamification.bienveillanceThreshold}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    gamification: {
                      ...prev.gamification,
                      bienveillanceThreshold: parseFloat(e.target.value),
                    },
                  }))
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Pourcentage de participation minimal requis pour déclencher un palier d&apos;encouragement collectif.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column : Global Parameters & Tuning Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Globe size={20} />
              </div>
              <div>
                <h4 className="text-base font-black text-white">
                  Constantes Mondiales & Tuning ({state.identity.schoolYear || '2025-2026'})
                </h4>
                <p className="text-xs text-slate-400">
                  Héritées automatiquement pour calibrer le thermomètre Terre
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300 font-semibold">Moyenne CO2 Monde :</span>
                <span className="font-bold text-emerald-400">
                  {annualData?.moyCo2Monde ?? '4.7'} tCO2e / an
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300 font-semibold">Moyenne Eau Monde :</span>
                <span className="font-bold text-blue-400">
                  {annualData?.moyEauMonde ? `${(annualData.moyEauMonde / 1000).toLocaleString('fr-FR')} m³` : '1 385 m³'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300 font-semibold">Moyenne Déchets :</span>
                <span className="font-bold text-amber-400">
                  {annualData?.moyDechetsMonde ?? '270'} kg / an
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300 font-semibold">Jour Dépassement Terre :</span>
                <span className="font-bold text-rose-400">
                  Jour #{annualData?.dActuel ?? '214'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-[11px] text-slate-400">
                <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" />
                  Facteurs de Tuning Appliqués :
                </div>
                <div>• Facteur de difficulté : {annualData?.difficultyFactor ?? '2.0'}</div>
                <div>• Multiplicateur annuel : {annualData?.annualMultiplierWeight ?? '1.0'}</div>
                <div>• Poids assiduité : {annualData?.assiduityWeight ?? '0.0'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
