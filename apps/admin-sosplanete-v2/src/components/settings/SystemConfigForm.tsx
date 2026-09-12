'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Save, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData } from '@/utils/storage';

export function SystemConfigForm({ schoolYear }: { schoolYear: string }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <AnimalsSettings schoolYear={schoolYear} />
      <TerreMometreSettings schoolYear={schoolYear} />
    </div>
  );
}

function AnimalsSettings({ schoolYear }: { schoolYear: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    avgActionsPerChildPerPeriod: 8,
    animalAdvanceMargin: 2,
    bienveillanceThreshold: 0.40
  });

  useEffect(() => {
    fetchConfig();
  }, [schoolYear]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data) {
          setConfig({
            avgActionsPerChildPerPeriod: data.avgActionsPerChildPerPeriod || 8,
            animalAdvanceMargin: data.animalAdvanceMargin || 2,
            bienveillanceThreshold: data.bienveillanceThreshold || 0.40
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify(config),
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
    <GlassCard className="p-10 rounded-3xl border-none shadow-2xl bg-white/95">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Réglages Stimulation (Animaux)</h2>
          <p className="text-sm font-medium text-slate-500">Configuration par défaut pour l'année {schoolYear}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Actions attendues par enfant par période</label>
           <Input
             type="number"
             value={config.avgActionsPerChildPerPeriod}
             onChange={e => setConfig(prev => ({ ...prev, avgActionsPerChildPerPeriod: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Marge d'avance max (Plafond)</label>
           <Input
             type="number"
             value={config.animalAdvanceMargin}
             onChange={e => setConfig(prev => ({ ...prev, animalAdvanceMargin: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Seuil de bienveillance (ex: 0.40 pour 40%)</label>
           <Input
             type="number" step="0.01"
             value={config.bienveillanceThreshold}
             onChange={e => setConfig(prev => ({ ...prev, bienveillanceThreshold: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
      </div>

      <div className="flex justify-end items-center gap-4 mt-10 pt-6 border-t border-slate-100">
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-600 font-bold text-xs">
              Configuration enregistrée !
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-14 px-8 font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Enregistrer (Année {schoolYear})
        </Button>
      </div>
    </GlassCard>
  );
}

function TerreMometreSettings({ schoolYear }: { schoolYear: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    emissionsParHabitantAn: 11.0,
    temperatureMalade: 42.0,
    temperatureSaine: 37.0,
    populationReference: 68000000,
    youtubeBriefingUrl: '',
    whatsappGeneralUrl: '',
    whatsappGeneralId: '',
    unbridleDpr: false
  });

  useEffect(() => {
    fetchConfig();
  }, [schoolYear]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setConfig({
          emissionsParHabitantAn: data.emissionsParHabitantAn || 11.0,
          temperatureMalade: data.temperatureMalade || 42.0,
          temperatureSaine: data.temperatureSaine || 37.0,
          populationReference: data.populationReference || 68000000,
          youtubeBriefingUrl: data.youtubeBriefingUrl || '',
          whatsappGeneralUrl: data.whatsappGeneralUrl || '',
          whatsappGeneralId: data.whatsappGeneralId || '',
          unbridleDpr: Boolean(data.unbridleDpr)
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify(config),
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
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <GlassCard className="p-10 rounded-3xl border-none shadow-2xl bg-white/95">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Paramètres Globaux & Terre-momètre</h2>
          <p className="text-sm font-medium text-slate-500">Configuration mondiale pour l'année {schoolYear}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Émissions France par habitant/an (tCO2e)</label>
           <Input
             type="number" step="0.1"
             value={config.emissionsParHabitantAn}
             onChange={e => setConfig(prev => ({ ...prev, emissionsParHabitantAn: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Température "Malade" (°C)</label>
           <Input
             type="number" step="0.1"
             value={config.temperatureMalade}
             onChange={e => setConfig(prev => ({ ...prev, temperatureMalade: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Température "Saine" (°C)</label>
           <Input
             type="number" step="0.1"
             value={config.temperatureSaine}
             onChange={e => setConfig(prev => ({ ...prev, temperatureSaine: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Population de référence (ex: 68000000)</label>
           <Input
             type="number"
             value={config.populationReference}
             onChange={e => setConfig(prev => ({ ...prev, populationReference: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">URL YouTube (Briefing Initial)</label>
            <Input
              type="text"
              placeholder="https://youtu.be/..."
              value={config.youtubeBriefingUrl}
              onChange={e => setConfig(prev => ({ ...prev, youtubeBriefingUrl: e.target.value }))}
              className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
            />
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Lien d'invitation WhatsApp Général</label>
            <Input
              type="text"
              placeholder="https://chat.whatsapp.com/..."
              value={config.whatsappGeneralUrl}
              onChange={e => setConfig(prev => ({ ...prev, whatsappGeneralUrl: e.target.value }))}
              className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
            />
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">ID du Groupe WhatsApp Général</label>
            <Input
              type="text"
              placeholder="Ex: 120363212891234567@g.us"
              value={config.whatsappGeneralId}
              onChange={e => setConfig(prev => ({ ...prev, whatsappGeneralId: e.target.value }))}
              className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
            />
         </div>

          {/* Section Rendu 3D WebGL & DPR */}
          <div className="md:col-span-2 pt-6 mt-2 border-t border-slate-100">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${config.unbridleDpr ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    <Cpu size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                      Rendu 3D WebGL : Ratio de Pixels (DPR)
                      <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                        config.unbridleDpr 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {config.unbridleDpr ? '⚡ Débridé (Pleine Résolution)' : '🛡️ Bridé à 1.25 (Recommandé)'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Contrôle la finesse de rendu Three.js et la charge sur le processeur graphique (GPU).</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={config.unbridleDpr}
                    onChange={e => setConfig(prev => ({ ...prev, unbridleDpr: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                config.unbridleDpr
                  ? 'bg-amber-50/80 border-amber-200/80 text-amber-900'
                  : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900'
              }`}>
                {config.unbridleDpr ? (
                  <AlertTriangle className="shrink-0 text-amber-600 mt-0.5" size={16} />
                ) : (
                  <CheckCircle2 className="shrink-0 text-emerald-600 mt-0.5" size={16} />
                )}
                <div>
                  <p className="font-semibold mb-0.5">
                    {config.unbridleDpr 
                      ? 'Mode Débridé activé : consommation GPU élevée' 
                      : 'Recommandation active : DPR bridé par défaut à 1.25'}
                  </p>
                  <p className="text-[11px] opacity-90">
                    {config.unbridleDpr
                      ? 'Ce mode restitue chaque pixel natif (Retina/4K). Recommandé uniquement pour les stations équipées de cartes graphiques dédiées (NVIDIA GeForce / AMD Radeon). Peut provoquer des saccades sur les ordinateurs avec carte graphique intégrée (Intel Core i5).'
                      : 'La finesse visuelle est identique à l\'œil nu, mais la charge GPU est divisée par deux. Cela garantit un affichage fluide à 60 FPS sur tous les PC et ordinateurs portables bureautiques (Intel Core i5, 6 Go RAM).'}
                  </p>
                </div>
              </div>
            </div>
          </div>
      </div>

      <div className="flex justify-end items-center gap-4 mt-10 pt-6 border-t border-slate-100">
         <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-600 font-bold text-xs">
                Configuration enregistrée !
              </motion.div>
            )}
         </AnimatePresence>
         <Button
            onClick={handleSave}
            disabled={saving}
            className="h-14 px-8 font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest"
         >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Enregistrer (Année {schoolYear})
         </Button>
      </div>
    </GlassCard>
  );
}
