'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Save, HelpCircle, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getAuthData } from '@/utils/storage';

export function TuningSimulator({ schoolYear }: { schoolYear: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | 'all'>('all');

  const [baseData, setBaseData] = useState<any>(null);
  const [tuning, setTuning] = useState({
    assiduityWeight: 0.0,
    annualMultiplierWeight: 1.0,
    difficultyFactor: 2.0,
    worldProjectionMultiplier: 1.0,
  });

  // Result state
  const [simulatedPlanets, setSimulatedPlanets] = useState<number>(0);
  const [simulatedEod, setSimulatedEod] = useState<Date | null>(null);

  useEffect(() => {
    fetchBaseData(selectedInstanceId);
  }, [schoolYear]);

  const fetchBaseData = async (instId: number | 'all' = selectedInstanceId) => {
    setLoading(true);
    try {
      const query = instId !== 'all'
        ? `schoolYear=${schoolYear}&instanceId=${instId}`
        : `schoolYear=${schoolYear}`;
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/impact/simulation-base?${query}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setBaseData(data);
        setTuning({
          assiduityWeight: data.annualData.assiduityWeight ?? 0.0,
          annualMultiplierWeight: data.annualData.annualMultiplierWeight ?? 1.0,
          difficultyFactor: data.annualData.difficultyFactor ?? 2.0,
          worldProjectionMultiplier: data.annualData.worldProjectionMultiplier ?? 1.0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (baseData) {
      simulateImpact();
    }
  }, [tuning, baseData]);

  const simulateImpact = () => {
    if (!baseData) return;

    const {
      nbChildrenTotal,
      actionsCount,
      realCo2,
      realWater,
      realWaste,
      catalogSize,
      gameDuration,
      annualData
    } = baseData;

    const totalPossibleEntries = nbChildrenTotal * catalogSize * gameDuration;
    const assiduiteRatio = totalPossibleEntries > 0 ? actionsCount / totalPossibleEntries : 0;

    const baseAnnualRatio = 52.0 / gameDuration;
    const annualRatio = 1 + (baseAnnualRatio - 1) * tuning.annualMultiplierWeight;

    const avgCo2PerChild = nbChildrenTotal > 0 ? realCo2 / nbChildrenTotal : 0;
    const avgWaterPerChild = nbChildrenTotal > 0 ? realWater / nbChildrenTotal : 0;
    const avgWastePerChild = nbChildrenTotal > 0 ? realWaste / nbChildrenTotal : 0;

    const effortCo2Indiv = (avgCo2PerChild / 1000) * annualRatio * tuning.worldProjectionMultiplier;
    const effortWaterIndiv = avgWaterPerChild * annualRatio * tuning.worldProjectionMultiplier;
    const effortWasteIndiv = avgWastePerChild * annualRatio * tuning.worldProjectionMultiplier;

    const pCo2 = effortCo2Indiv / (annualData.moyCo2Monde || 4.7);
    const pWater = effortWaterIndiv / (annualData.moyEauMonde || 1385000);
    const pWaste = effortWasteIndiv / (annualData.moyDechetsMonde || 270);

    const rawEffortRatio = pCo2 * 0.6 + pWater * 0.2 + pWaste * 0.2;
    const weightedEffortRatio = rawEffortRatio * (1 - tuning.assiduityWeight) + (rawEffortRatio * assiduiteRatio) * tuning.assiduityWeight;

    const year = parseInt(schoolYear.split('-')[0], 10);
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const jAnnee = isLeapYear ? 366 : 365;

    const basePlanetes = jAnnee / (annualData.dActuel || 214);
    
    const reductionImpactTotal = 0.25 * (1 - Math.exp(-weightedEffortRatio * tuning.difficultyFactor));
    const nbPlanetes = basePlanetes * (1 - reductionImpactTotal);
    const nouveauJourAnnee = jAnnee / nbPlanetes;

    const eodDate = new Date(`${year}-01-01`);
    eodDate.setDate(eodDate.getDate() + Math.floor(nouveauJourAnnee) - 1);

    setSimulatedPlanets(nbPlanetes);
    setSimulatedEod(eodDate);
  };

  const handleSave = async () => {
    setSaving(true);
    const year = parseInt(schoolYear.split('-')[0], 10);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/impact/annual-tuning/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify(tuning),
      });
      if (resp.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-emerald-600 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 max-w-7xl mx-auto h-full relative">
      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* Colonne de gauche : Contrôles */}
        <GlassCard className="flex-1 p-8 rounded-3xl border-none shadow-2xl bg-white/95">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Réglage de l'Algorithme <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest">{schoolYear}</span>
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Simulez et enregistrez les critères d'impact pour tous les espaces.</p>
            </div>
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className={`p-2 rounded-xl transition-all ${showHelp ? 'bg-sky-100 text-sky-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              <HelpCircle size={24} />
            </button>
          </div>

          {/* Sélecteur de périmètre / Espace */}
          <div className="mb-8 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-0.5">
                Périmètre de Simulation
              </label>
              <p className="text-[11px] text-slate-400 font-medium">
                Testez l'algorithme sur un établissement précis ou sur l'ensemble des écoles.
              </p>
            </div>
            <select
              value={selectedInstanceId}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                setSelectedInstanceId(val);
                fetchBaseData(val);
              }}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm cursor-pointer min-w-[200px]"
            >
              <option value="all">🌍 Tous les espaces (Global)</option>
              {baseData?.instancesList?.map((inst: any) => (
                <option key={inst.id} value={inst.id}>
                  🏫 {inst.schoolName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-8">
            <SliderControl 
              label="Poids de l'Assiduité"
              value={tuning.assiduityWeight}
              min={0} max={1} step={0.1}
              onChange={(v: number) => setTuning({...tuning, assiduityWeight: v})}
              formatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            />

            <SliderControl 
              label="Extrapolation Annuelle (Sprint vs Marathon)"
              value={tuning.annualMultiplierWeight}
              min={0} max={1} step={0.1}
              onChange={(v: number) => setTuning({...tuning, annualMultiplierWeight: v})}
              formatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            />

            <SliderControl 
              label="Facteur de Difficulté"
              value={tuning.difficultyFactor}
              min={0.1} max={5.0} step={0.1}
              onChange={(v: number) => setTuning({...tuning, difficultyFactor: v})}
              formatter={(v: number) => v.toFixed(1)}
            />

            <SliderControl 
              label="Projection Mondiale"
              value={tuning.worldProjectionMultiplier}
              min={0.1} max={1.0} step={0.05}
              onChange={(v: number) => setTuning({...tuning, worldProjectionMultiplier: v})}
              formatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            />
          </div>

          <div className="mt-12 flex justify-between items-center border-t border-slate-100 pt-6">
            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-600 text-xs font-black uppercase tracking-widest">
                  Enregistré avec succès !
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button onClick={handleSave} disabled={saving} className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 px-6 shadow-xl shadow-emerald-500/20 font-black tracking-widest uppercase text-xs">
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
              Appliquer à {schoolYear}
            </Button>
          </div>
        </GlassCard>

        {/* Colonne de droite : Résultats de simulation */}
        <GlassCard className="w-full lg:w-96 p-8 rounded-3xl border-none shadow-xl bg-slate-800 text-white flex flex-col justify-center">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 text-center">Résultats de la simulation</h3>
          
          <div className="space-y-8">
            <div className="text-center">
              <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400 mb-2">Terres Nécessaires</div>
              <motion.div 
                key={simulatedPlanets} 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="text-6xl font-black tracking-tighter"
              >
                {simulatedPlanets.toFixed(2)}
              </motion.div>
            </div>

            <div className="w-full h-px bg-slate-700" />

            <div className="text-center">
              <div className="text-[10px] uppercase font-black tracking-widest text-sky-400 mb-2">Date de Dépassement</div>
              <motion.div 
                key={simulatedEod?.getTime()} 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="text-4xl font-black tracking-tight"
              >
                {simulatedEod ? simulatedEod.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' }) : '...'}
              </motion.div>
              <div className="text-sm font-medium text-slate-400 mt-2">{schoolYear.split('-')[0]}</div>
            </div>
          </div>
          
          <div className="mt-8 text-xs text-slate-400 text-center px-4 leading-relaxed">
            Calculs basés sur <strong className="text-white font-bold">{baseData?.actionsCount || 0} actions</strong> ({baseData?.nbChildrenTotal || 0} élèves) dans {selectedInstanceId === 'all' ? <span className="text-emerald-400 font-bold">tous les espaces réunis</span> : <span className="text-sky-400 font-bold">l'espace sélectionné</span>}.
          </div>
        </GlassCard>
      </div>

      {/* Panneau d'aide latéral */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="overflow-hidden bg-sky-50 rounded-3xl shadow-inner border border-sky-100 flex-shrink-0"
          >
            <div className="p-6 w-[320px]">
              <div className="flex justify-between items-center mb-6 border-b border-sky-200 pb-4">
                <h3 className="font-black text-sky-800 uppercase tracking-widest text-[11px] flex items-center gap-2">
                  <HelpCircle size={14} /> Guide de réglage
                </h3>
                <button onClick={() => setShowHelp(false)} className="text-sky-400 hover:text-sky-700">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6 text-sm text-sky-900 leading-relaxed font-medium">
                <div>
                  <strong className="text-sky-700 block mb-1">Poids de l'Assiduité</strong>
                  0% : on ignore le rythme de saisie. 100% : un joueur qui saisit tout en une semaine est dilué le reste de l'année.
                </div>
                <div>
                  <strong className="text-sky-700 block mb-1">Extrapolation Annuelle</strong>
                  0% : on compte l'effort brut. 100% : on présume que le rythme frénétique du jeu (6 semaines) sera maintenu toute l'année (x8).
                </div>
                <div>
                  <strong className="text-sky-700 block mb-1">Facteur de Difficulté</strong>
                  2.0 : La courbe monte très vite (très généreux). Plus le chiffre est petit (ex: 0.5), plus il est dur d'atteindre les 25% de réduction mondiale.
                </div>
                <div>
                  <strong className="text-sky-700 block mb-1">Projection Mondiale</strong>
                  100% : transpose l'économie brute d'un enfant français à 8,1 Milliards d'humains. Un pourcentage plus bas permet de niveler avec la réalité de l'empreinte mondiale.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, onChange, formatter }: any) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-black text-slate-700 uppercase tracking-widest">{label}</label>
        <span className="text-emerald-600 font-black text-sm bg-emerald-50 px-3 py-1 rounded-xl">
          {formatter ? formatter(value) : value}
        </span>
      </div>
      <input 
        type="range" 
        min={min} max={max} step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-emerald-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
