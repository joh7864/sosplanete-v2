'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Save } from 'lucide-react';
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
    populationReference: 68000000
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
        setConfig(data);
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
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <GlassCard className="p-10 rounded-3xl border-none shadow-2xl bg-white/95">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Paramètres Terre-momètre</h2>
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
