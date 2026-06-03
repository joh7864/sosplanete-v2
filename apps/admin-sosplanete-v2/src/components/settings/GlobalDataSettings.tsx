'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, AlertTriangle, Loader2, Save, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData } from '@/utils/storage';

export function GlobalDataSettings({ schoolYear }: { schoolYear: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [constants, setConstants] = useState({
    dActuel: 0,
    moyCo2Monde: 0,
    moyEauMonde: 0,
    moyDechetsMonde: 0,
    popMonde: 0
  });

  const selectedYear = parseInt(schoolYear.split('-')[1]); // End year

  useEffect(() => {
    fetchConstants(selectedYear);
  }, [selectedYear]);

  const fetchConstants = async (year: number) => {
    setLoading(true);
    try {
      const constResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/impact/constants?schoolYear=${schoolYear}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (constResp.ok) {
        const data = await constResp.json();
        setConstants({
          dActuel: data.dActuel ?? 0,
          moyCo2Monde: data.moyCo2Monde ?? 0,
          moyEauMonde: data.moyEauMonde ?? 0,
          moyDechetsMonde: data.moyDechetsMonde ?? 0,
          popMonde: data.popMonde ?? 0
        });
      } else {
        setConstants({ dActuel: 0, moyCo2Monde: 0, moyEauMonde: 0, moyDechetsMonde: 0, popMonde: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/impact/constants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({
          schoolYear,
          dActuel: Number(constants.dActuel),
          moyCo2Monde: Number(constants.moyCo2Monde),
          moyEauMonde: Number(constants.moyEauMonde),
          moyDechetsMonde: Number(constants.moyDechetsMonde),
          popMonde: Number(constants.popMonde)
        }),
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
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Globe className="text-orange-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Constantes d'Impact Mondiales</h2>
              <p className="text-sm font-medium text-slate-500">
                Configuration des seuils planétaires de référence pour l'année <strong>{schoolYear}</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-sky-50 text-sky-800 p-5 rounded-2xl text-sm leading-relaxed font-medium flex flex-col gap-2 border border-sky-100">
            <div className="flex items-center gap-2 font-black text-sky-900 border-b border-sky-200/50 pb-2 mb-1">
               <AlertTriangle size={16} /> Règle de calcul
            </div>
            <p>Le bilan de l'année scolaire <strong>{selectedYear-1}-{selectedYear}</strong> utilise les données mondiales de l'année civile <strong>{selectedYear-1}</strong>.</p>
            <p className="opacity-80">Les champs ci-dessous correspondent donc aux statistiques de {selectedYear-1}.</p>
          </div>

          <div className="bg-emerald-50 text-emerald-800 p-5 rounded-2xl text-sm leading-relaxed font-medium flex flex-col gap-2 border border-emerald-100">
            <div className="flex items-center gap-2 font-black text-emerald-900 border-b border-emerald-200/50 pb-2 mb-1">
               <Globe size={16} /> Où trouver les données ?
            </div>
            <ul className="list-disc list-inside opacity-90 space-y-1 text-xs">
               <li>Jour dépassement : <a href="https://www.overshootday.org/" target="_blank" className="underline font-bold">overshootday.org</a></li>
               <li>CO2 : Banque mondiale / GIEC.</li>
               <li>Eau & Déchets : Rapports nationaux / ONU.</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Jour du dépassement {selectedYear-1} (1-365)</label>
               <Input
                 type="number"
                 required
                 value={constants.dActuel || ''}
                 onChange={e => setConstants(prev => ({ ...prev, dActuel: Number(e.target.value) }))}
                 className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
                 placeholder="Ex: 214"
               />
               <p className="text-xs text-slate-400 pl-1">Numéro du jour dans l'année (ex: 214 = 1er Août)</p>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Empreinte CO2 {selectedYear-1} (tCO2e/hab/an)</label>
               <Input
                 type="number" step="0.01"
                 required
                 value={constants.moyCo2Monde || ''}
                 onChange={e => setConstants(prev => ({ ...prev, moyCo2Monde: Number(e.target.value) }))}
                 className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
                 placeholder="Ex: 4.7"
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Empreinte Eau {selectedYear-1} (L/hab/an)</label>
               <Input
                 type="number"
                 required
                 value={constants.moyEauMonde || ''}
                 onChange={e => setConstants(prev => ({ ...prev, moyEauMonde: Number(e.target.value) }))}
                 className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
                 placeholder="Ex: 1200000"
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Empreinte Déchets {selectedYear-1} (kg/hab/an)</label>
               <Input
                 type="number" step="0.1"
                 required
                 value={constants.moyDechetsMonde || ''}
                 onChange={e => setConstants(prev => ({ ...prev, moyDechetsMonde: Number(e.target.value) }))}
                 className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
                 placeholder="Ex: 450"
              />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Population Mondiale {selectedYear-1} (Milliards)</label>
               <Input
                 type="number" step="0.001"
                 required
                 value={constants.popMonde || ''}
                 onChange={e => setConstants(prev => ({ ...prev, popMonde: Number(e.target.value) }))}
                 className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
                 placeholder="Ex: 8.1"
               />
               <p className="text-xs text-slate-400 pl-1">Utilisé pour l'extrapolation (ex: 8.105)</p>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 mt-8 pt-6 border-t border-slate-100">
             <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Enregistré pour {selectedYear-1}
                  </motion.div>
                )}
             </AnimatePresence>
             <Button
                type="submit"
                disabled={saving}
                className="h-14 px-8 font-black shadow-xl rounded-2xl bg-orange-600 hover:bg-orange-700 outline-none text-white uppercase tracking-widest"
             >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Enregistrer les données {selectedYear-1}
             </Button>
          </div>
        </form>
      </div>
    </GlassCard>
  );
}
