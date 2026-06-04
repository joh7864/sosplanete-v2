'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trophy, Play, Pause, SkipBack, SkipForward, RefreshCcw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAuthData } from '@/utils/storage';

// Palette de couleurs distinctes par école (inspiré Flourish)
const SCHOOL_COLORS = [
  '#7c3aed', // Violet
  '#db2777', // Rose
  '#2563eb', // Bleu
  '#16a34a', // Vert
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#ca8a04', // Jaune
  '#be185d', // Fuchsia
  '#1d4ed8', // Indigo
  '#15803d', // Vert foncé
];

// Formatage intelligent des valeurs CO2e
const formatCo2Value = (val: number): string => {
  if (val === 0) return '0';
  if (val >= 1000) return `${(val / 1000).toFixed(2)} tCO2e`;
  return `${val.toFixed(1)} kgCO2e`;
};

// Formatage des dates de période : "01-janv", "16-mars"
const formatPeriodDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).replace('.', '');
};

export function EcoBarRace({ schoolYear, highlightedInstanceId }: { schoolYear: string, highlightedInstanceId?: number | null }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [colorMap, setColorMap] = useState<Record<number, string>>({});
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/eco-bar-race/history?schoolYear=${schoolYear}`, {
          headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setHistory(data);
          if (data.length > 0) {
            setSelectedPeriod(data[data.length - 1].period);
            const allIds: number[] = [];
            data.forEach((snapshot: any) => {
              snapshot.rankings?.forEach((r: any) => {
                if (!allIds.includes(r.instanceId)) allIds.push(r.instanceId);
              });
            });
            const map: Record<number, string> = {};
            allIds.forEach((id, i) => { map[id] = SCHOOL_COLORS[i % SCHOOL_COLORS.length]; });
            setColorMap(map);
          } else {
            setHistory([]);
            setSelectedPeriod(null);
          }
        }
      } catch (e) {
        console.error('Fetch history error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [schoolYear, refreshKey]);

  // Lecteur automatique
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && history.length > 0 && selectedPeriod !== null) {
      interval = setInterval(() => {
        setSelectedPeriod(prev => {
          if (prev === null) return history[0]?.period || null;
          const idx = history.findIndex(h => h.period === prev);
          if (idx < history.length - 1) return history[idx + 1].period;
          setIsPlaying(false);
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, history, selectedPeriod]);

  const togglePlay = () => {
    if (!isPlaying && selectedPeriod === history[history.length - 1]?.period) {
      setSelectedPeriod(history[0]?.period);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRecalculateEcoBarRace = async () => {
    setIsRecalculating(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/eco-bar-race/recalculate?schoolYear=${schoolYear}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (e) {
      console.error('Recalculate eco-bar-race error:', e);
    } finally {
      setIsRecalculating(false);
    }
  };

  const currentSnapshot = history.find(h => h.period === selectedPeriod);
  const rankings: any[] = currentSnapshot?.rankings || [];

  const chartData = useMemo(() => {
    return [...rankings]
      .sort((a, b) => b.co2Total - a.co2Total)
      .map(r => ({
        name: r.instanceName,
        co2: r.co2Total,
        icon: r.icon,
        instanceId: r.instanceId,
        isCurrent: highlightedInstanceId ? r.instanceId === highlightedInstanceId : false,
        color: colorMap[r.instanceId] || '#64748b',
      }));
  }, [rankings, highlightedInstanceId, colorMap]);

  const maxCo2 = chartData[0]?.co2 || 1;
  const totalCo2 = rankings.reduce((sum, r) => sum + r.co2Total, 0);

  // Dates représentatives pour la timeline (max ~10)
  const representativePeriods = useMemo(() => {
    if (history.length === 0) return [];
    if (history.length <= 10) return history;
    const step = Math.ceil(history.length / 9);
    const result: any[] = [];
    for (let i = 0; i < history.length; i += step) result.push(history[i]);
    if (result[result.length - 1]?.period !== history[history.length - 1]?.period) {
      result.push(history[history.length - 1]);
    }
    return result;
  }, [history]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 size={32} className="animate-spin text-emerald-500" />
      <p className="text-slate-500 font-medium">Chargement de la course...</p>
    </div>
  );

  if (history.length === 0) return (
    <div className="w-full">
      <GlassCard className="p-10 rounded-3xl flex flex-col items-center justify-center min-h-[400px]">
        <Trophy size={48} className="text-slate-200 mb-4" />
        <h2 className="text-xl font-black text-slate-800">Aucune donnée pour la course</h2>
        <p className="text-slate-500 mb-6">Cliquez sur le bouton ci-dessous pour générer l'historique.</p>
        <button
          onClick={handleRecalculateEcoBarRace}
          disabled={isRecalculating}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-200 transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={18} className={isRecalculating ? "animate-spin" : ""} />
          {isRecalculating ? "Calcul en cours..." : "Générer la course"}
        </button>
      </GlassCard>
    </div>
  );

  return (
    <div className="space-y-4 flex flex-col w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800">🏆 Eco-Bar-Race</h2>
            <p className="text-slate-500 text-sm">Course aux économies réelles de CO2e entre tous les établissements.</p>
          </div>
          <button
            onClick={handleRecalculateEcoBarRace}
            disabled={isRecalculating}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
            title="Recalculer la course"
          >
            <RefreshCcw size={18} className={isRecalculating ? "animate-spin text-emerald-500" : ""} />
          </button>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total cumulé</p>
          <p className="text-xl font-black text-slate-700">{formatCo2Value(totalCo2)}</p>
        </div>
      </div>

      {/* CARTE PRINCIPALE */}
      <GlassCard className="w-full rounded-3xl overflow-hidden relative" style={{ padding: '28px 32px 0px' }}>

        {/* GRAPHIQUE CUSTOM FRAMER MOTION */}
        <div className="relative z-10 pr-[320px]">
          {/* Échelle X en tête parfaitement alignée */}
          <div className="relative ml-[144px] mb-6 h-4">
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <div 
                key={ratio} 
                className="absolute top-0 text-[10px] font-bold text-slate-400 -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${ratio * 100}%` }}
              >
                {formatCo2Value(maxCo2 * ratio)}
              </div>
            ))}
          </div>

          {/* BARRES ANIMÉES */}
          <div className="flex flex-col gap-[4px]">
            <AnimatePresence>
              {chartData.map((entry) => (
                <motion.div
                  key={entry.instanceId}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    layout: { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.3 },
                  }}
                  className="flex items-center gap-3"
                >
                  {/* NOM de l'école */}
                  <div className="w-[148px] pr-4 text-right shrink-0">
                    <span
                      className="text-[13px] font-black truncate block"
                      style={{ color: entry.isCurrent ? entry.color : '#334155' }}
                    >
                      {entry.name}
                    </span>
                  </div>

                  {/* ZONE DE BARRE */}
                  <div className="flex-1 relative overflow-visible" style={{ height: '36px' }}>

                    {/* Barre colorée animée */}
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 rounded-r-lg"
                      style={{ background: entry.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max((entry.co2 / maxCo2) * 100, 1)}%` }}
                      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                    />

                    {/* Conteneur aligné sur la fin de la barre */}
                    <motion.div
                      className="absolute top-0 bottom-0 flex items-center z-10"
                      animate={{ left: `${Math.max((entry.co2 / maxCo2) * 100, 1)}%` }}
                      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {/* Icône placée à l'intérieur de la barre (décalée vers la gauche) */}
                      {entry.icon && (
                        <div 
                          className="absolute right-full mr-1.5 w-[28px] h-[28px] rounded-full bg-white flex items-center justify-center shadow-sm border-[2px] overflow-hidden shrink-0"
                          style={{ borderColor: entry.color }}
                        >
                          {entry.icon.startsWith('/') || entry.icon.startsWith('http') ? (
                            <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '')}${entry.icon}`} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="text-[14px] leading-none drop-shadow-sm">{entry.icon}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Valeur à l'extérieur de la barre */}
                      <div
                        className="font-black text-[12px] whitespace-nowrap pl-2"
                        style={{ color: entry.color }}
                      >
                        {formatCo2Value(entry.co2)}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* AXE X + CONTRÔLES EN DESSOUS DES BARRES */}
        <div className="mt-3 relative z-10 pr-[320px]">
          {/* Ligne de l'axe */}
          <div className="h-px bg-slate-200 ml-[144px]" />

          <div className="flex items-start mt-1 pb-6">
            {/* Bouton Play à gauche, sous les labels de nom */}
            <div className="w-[148px] flex items-center gap-1 shrink-0 pt-1">
              <button
                onClick={() => { setIsPlaying(false); setSelectedPeriod(history[0]?.period); }}
                disabled={selectedPeriod === history[0]?.period}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <SkipBack size={13} />
              </button>
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
              >
                {isPlaying
                  ? <Pause size={15} fill="currentColor" />
                  : <Play size={15} fill="currentColor" className="ml-0.5" />
                }
              </button>
              <button
                onClick={() => { setIsPlaying(false); setSelectedPeriod(history[history.length - 1]?.period); }}
                disabled={selectedPeriod === history[history.length - 1]?.period}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <SkipForward size={13} />
              </button>
            </div>

            {/* Dates étalées sous les barres comme axe X */}
            <div className="flex-1 relative flex flex-col pt-1">
              {/* Ligne de l'axe (Track) */}
              <div className="absolute top-[5px] left-0 right-0 h-[2px] bg-slate-100 rounded-full" />
              
              {/* Curseur vert mobile */}
              {history.length > 0 && (
                <motion.div 
                  className="absolute top-0 z-20 flex flex-col items-center"
                  style={{ x: '-50%' }}
                  animate={{ 
                    left: `${(history.findIndex(h => h.period === selectedPeriod) / Math.max(history.length - 1, 1)) * 100}%` 
                  }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                >
                  {/* Pointe du curseur */}
                  <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-md mb-1" />
                  {/* Ligne de rappel verticale fine (monte vers les barres) */}
                  <div className="absolute top-[-440px] w-px h-[440px] bg-emerald-500/10 pointer-events-none" />
                </motion.div>
              )}

              <div className="flex justify-between w-full">
                {representativePeriods.map(h => (
                  <button
                    key={h.period}
                    onClick={() => { setIsPlaying(false); setSelectedPeriod(h.period); }}
                    className={`relative flex flex-col items-center gap-0.5 text-[10px] font-black transition-all whitespace-nowrap z-10 ${
                      selectedPeriod === h.period
                        ? 'text-emerald-600'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <div className={`w-px h-2 ${
                      selectedPeriod === h.period ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                    {h.periodDate ? formatPeriodDate(h.periodDate) : `P${h.period}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FILIGRANE DATE visible en bas à droite, derrière les barres */}
        {currentSnapshot?.periodDate && (
          <div className="absolute bottom-[60px] right-8 text-right pointer-events-none select-none z-0">
            <p className="text-[56px] font-black leading-none text-slate-200">
              {formatPeriodDate(currentSnapshot.periodDate)}
            </p>
            <p className="text-lg font-black text-slate-300 mt-1">
              Total : {formatCo2Value(totalCo2)}
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
