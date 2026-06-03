'use client';

import React from 'react';
import { Leaf, Droplets, Trash } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatEcoImpact } from '@/utils/format';

interface DashboardKpiBarProps {
  stats: {
    teams: number;
    players: number;
    actions: number;
    co2: number;
    water: number;
    waste: number;
  };
}

export function DashboardKpiBar({ stats }: DashboardKpiBarProps) {
  return (
    <GlassCard className="mb-2 border-none shadow-xl overflow-hidden py-6 px-10 bg-white/80">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left: Inventory Counts */}
        <div className="flex items-center gap-8 lg:gap-12 flex-wrap">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-slate-800 leading-none">{stats.teams}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Équipes</span>
          </div>
          <div className="w-[2px] h-12 bg-slate-200 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-3xl font-black text-slate-800 leading-none">{stats.players}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Joueurs</span>
          </div>
          <div className="w-[2px] h-12 bg-slate-200 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-3xl font-black text-emerald-600 leading-none">{stats.actions}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Actions</span>
          </div>
        </div>

        {/* Right: Eco Impacts */}
        <div className="flex items-center gap-8 lg:gap-12 ml-auto">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-slate-800 leading-none">{formatEcoImpact(stats.co2, 'co2')}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">CO2e évité</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500 shadow-sm"><Leaf size={24} /></div>
          </div>
          <div className="w-[2px] h-12 bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-slate-800 leading-none">{formatEcoImpact(stats.water, 'water')}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Eau préservée</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 shadow-sm"><Droplets size={24} /></div>
          </div>
          <div className="w-[2px] h-12 bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-slate-800 leading-none">{formatEcoImpact(stats.waste, 'waste')}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Déchets évités</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 shadow-sm"><Trash size={24} /></div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
