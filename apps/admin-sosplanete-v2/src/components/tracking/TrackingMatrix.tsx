'use client';

import React from 'react';
import { Search, Maximize2, Minimize2, Check, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAssetUrl } from '@/utils/assets';


interface Period {
  label: string;
  start: string;
  end: string;
}

interface Child {
  id: number;
  pseudo: string;
  teamId: number;
  teamName: string;
  groupId: number;
  groupName: string;
  avatar?: string;
  weeks: number[];
  total: number;
}

interface TrackingMatrixProps {
  periods: Period[];
  filteredChildren: Child[];
  visiblePeriodIndices: number[];
  computedWeeklyTotals: number[];
  computedTableGrandTotal: number;
  teams: Array<{ id: number; name: string }>;
  groups: Array<{ id: number; name: string }>;
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  selectedGroup: string;
  setSelectedGroup: (group: string) => void;
  search: string;
  setSearch: (search: string) => void;
  hideInactive: boolean;
  setHideInactive: (hide: boolean) => void;
  hideEmptyPeriods: boolean;
  setHideEmptyPeriods: (hide: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (full: boolean) => void;
  loading?: boolean;
}

export function TrackingMatrix({
  periods,
  filteredChildren,
  visiblePeriodIndices,
  computedWeeklyTotals,
  computedTableGrandTotal,
  teams,
  groups,
  selectedTeam,
  setSelectedTeam,
  selectedGroup,
  setSelectedGroup,
  search,
  setSearch,
  hideInactive,
  setHideInactive,
  hideEmptyPeriods,
  setHideEmptyPeriods,
  isFullscreen,
  setIsFullscreen,
  loading = false
}: TrackingMatrixProps) {
  const CELL_WIDTH = 32; // px

  const getHeatmapStyle = (count: number) => {
    if (count === 0) return 'bg-slate-50/30 text-slate-300';
    if (count <= 2) return 'bg-emerald-100 text-emerald-800 font-bold';
    if (count <= 5) return 'bg-emerald-300 text-emerald-900 font-bold';
    if (count <= 10) return 'bg-emerald-500 text-white font-black';
    return 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20';
  };

  const getPlayerAvatar = (pseudo: string, avatarPath?: string) => {
    if (avatarPath && avatarPath !== 'avatars/default.png') {
      return getAssetUrl(avatarPath);
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${pseudo}&backgroundColor=f1f5f9`;
  };


  return (
    <div className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] bg-slate-950/20 backdrop-blur-md p-4 md:p-10 flex items-center justify-center' : ''}`}>
      <GlassCard padding="none" className={`overflow-hidden border-none shadow-2xl transition-all duration-300 ${isFullscreen ? 'w-full h-full' : ''}`}>
        <div className={`flex flex-col h-full ${isFullscreen ? 'p-8' : 'p-6'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Détail des actions</h2>
                <div className="px-2 py-0.5 rounded-full bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-tighter">Live</div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Saisie hebdomadaire par élève</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Hide Inactive Toggle */}
              <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={hideInactive}
                  onChange={(e) => setHideInactive(e.target.checked)}
                  className="w-3 h-3 accent-emerald-500 rounded border-slate-300"
                />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Masquer enfants inactifs</span>
              </label>

              {/* Hide Empty Periods Toggle */}
              <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={hideEmptyPeriods}
                  onChange={(e) => setHideEmptyPeriods(e.target.checked)}
                  className="w-3 h-3 accent-sky-500 rounded border-slate-300"
                />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Masquer périodes vides</span>
              </label>

              {/* Team Filter */}
              <select 
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setSelectedGroup('all');
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 cursor-pointer"
              >
                <option value="all">Toutes les équipes</option>
                {teams.map(t => <option key={t.id} value={t.id.toString()}>{t.name}</option>)}
              </select>

              {/* Group Filter */}
              <select 
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 cursor-pointer"
              >
                <option value="all">Tous les groupes</option>
                {groups.map(g => <option key={g.id} value={g.id.toString()}>{g.name}</option>)}
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Chercher élève..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-40 font-black"
                />
              </div>

              {/* FULLSCREEN TOGGLE */}
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-1.5 rounded-xl border transition-all ${isFullscreen ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:text-slate-900'}`}
                title={isFullscreen ? "Quitter le plein écran" : "Passer en plein écran"}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          <div className={`overflow-x-auto custom-scrollbar flex-1 ${isFullscreen ? 'h-full' : ''}`}>
            <div className={`min-w-fit flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="w-[120px] px-3 py-2 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 sticky left-0 bg-slate-50/50 z-20">Enfant</th>
                    <th className="w-[80px] px-3 py-2 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 sticky left-[120px] bg-slate-50/50 z-20">Équipe</th>
                    <th className="w-[80px] px-3 py-2 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 sticky left-[200px] bg-slate-50/50 z-20">Groupe</th>
                    <th className="w-[60px] px-3 py-2 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 text-center bg-emerald-50/50">Total</th>
                    <th className="p-0 border-b border-slate-100">
                      <div className="flex">
                        {visiblePeriodIndices.map((idx) => {
                          const p = periods[idx];
                          return (
                            <div key={idx} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} className="p-0.5 text-[8px] font-black uppercase text-slate-500 tracking-tighter border-l border-slate-100/50 text-center flex flex-col items-center justify-center h-12 bg-white/50">
                              <span className="text-slate-400 text-[7px] leading-none opacity-70">{p.label}</span>
                              <span className="text-slate-800 font-bold mt-0.5 leading-none">
                                {new Date(p.start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </th>
                  </tr>
                </thead>
              </table>
              
              <div className={`custom-scrollbar ${isFullscreen ? 'flex-1 overflow-y-auto' : 'max-h-[600px] overflow-y-auto'}`}>
                <table className="w-full text-left border-collapse table-fixed">
                  <tbody className="divide-y divide-slate-100">
                    {filteredChildren.map((child) => (
                      <tr key={child.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="w-[120px] px-3 py-1.5 border-b border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                               <img src={getPlayerAvatar(child.pseudo, child.avatar)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[11px] font-black text-emerald-600 truncate">{child.pseudo}</span>
                          </div>
                        </td>
                        <td className="w-[80px] px-3 py-1.5 border-b border-slate-100 sticky left-[120px] bg-white group-hover:bg-slate-50/50 z-10 text-[9px] font-black text-slate-800 truncate">
                          {child.teamName}
                        </td>
                        <td className="w-[80px] px-3 py-1.5 border-b border-slate-100 sticky left-[200px] bg-white group-hover:bg-slate-50/50 z-10 text-[8px] font-bold text-slate-400 uppercase tracking-tight truncate">
                          {child.groupName}
                        </td>
                        <td className="w-[60px] px-3 py-1.5 text-center font-black text-[10px] text-slate-800 bg-emerald-50/10">
                          {child.total}
                        </td>
                        <td className="p-0">
                          <div className="flex h-full">
                            {visiblePeriodIndices.map((idx) => {
                              const count = child.weeks[idx] || 0;
                              return (
                                <div key={idx} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} className="px-0.5 py-0.5 h-9 flex items-center justify-center border-l border-slate-50/50">
                                  <div className={`w-full h-full rounded-md flex items-center justify-center text-[10px] transition-all hover:scale-110 cursor-default ${getHeatmapStyle(count)}`}>
                                    {count > 0 ? count : <div className="w-1 h-1 rounded-full bg-slate-200" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <table className="w-full text-left border-collapse table-fixed">
                <tfoot>
                  <tr className="bg-slate-900 text-white">
                    <td className="w-[280px] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-emerald-400">Total Hebdomadaire Filtré</td>
                    <td className="w-[60px] px-3 py-2 text-center font-black text-[10px] text-white">{computedTableGrandTotal}</td>
                    <td className="p-0">
                      <div className="flex">
                        {visiblePeriodIndices.map((idx) => (
                          <div key={idx} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} className="p-1.5 text-center text-[9px] font-black text-white border-l border-white/10">
                            {computedWeeklyTotals[idx]}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
