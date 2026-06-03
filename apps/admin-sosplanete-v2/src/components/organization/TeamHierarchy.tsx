'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Users, Settings2, Droplets, Leaf, Trash, Trash2, ChevronDown, Check, Star, Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAssetUrl } from '@/utils/assets';
import { getAuthData } from '@/utils/storage';
import { formatEcoImpact } from '@/utils/format';

export function TeamCard({ 
  team, isExpanded, onToggle, vitalityCalc, setSelectedTeam, setShowTeamModal,
  isSelectionMode, isSelected, onSelect, onDeleteTeam, onEditGroup, onAddGroup, onEditPlayer, onAddPlayer,
  onDeletePlayer, onSelectPlayer, selectedChildrenIds, refreshData
}: any) {
  const [isUploadingIcon, setIsUploadingIcon] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDirectLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingIcon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/upload-icon`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthData('access_token')}` },
        body: formData
      });
      
      if (!uploadResp.ok) throw new Error("Upload failed");
      const { filename } = await uploadResp.json();

      const patchResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthData('access_token')}`
        },
        body: JSON.stringify({ icon: filename })
      });

      if (!patchResp.ok) throw new Error("Update failed");

      if (refreshData) {
        refreshData();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Direct upload failed", err);
      alert("Erreur lors de l'upload du logo");
    } finally {
      setIsUploadingIcon(false);
      // Reset input value so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cardColor = team.color || '#40916C';
  const logoPath = team.icon ? getAssetUrl(`teams/${team.icon.split('/').pop()}`) : null;

  const groupsCount = team.groups?.length || 0;
  const playersCount = team.groups?.reduce((acc: number, g: any) => acc + (g.children?.length || 0), 0) || 0;
  
  const teamImpact = team.groups?.reduce((acc: any, g: any) => {
    const calc = vitalityCalc(g);
    return { co2: acc.co2 + calc.co2, water: acc.water + calc.water, waste: acc.waste + calc.waste };
  }, { co2:0, water:0, waste:0 }) || { co2:0, water:0, waste:0 };

  return (
    <motion.div layout className={`relative transition-all duration-500 ${isExpanded ? 'col-span-full' : ''}`}>
      <GlassCard 
        padding="none" 
        className={`border-none shadow-xl flex flex-col transition-all bg-white/70 ${isExpanded ? 'ring-1 ring-slate-200' : 'hover:scale-[1.02] cursor-pointer ring-1 ring-slate-100 hover:ring-emerald-200'}`}
        onClick={() => { if (isSelectionMode) onSelect(team.id); else if (!isExpanded) onToggle(); }}
      >
        <div className="h-1.5 w-full rounded-t-2xl" style={{ backgroundColor: cardColor }} />
        
        {isSelectionMode && (
          <div className="absolute top-6 left-6 z-10">
             <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200'}`}>
                {isSelected && <Check size={14} strokeWidth={4} />}
             </div>
          </div>
        )}

        <div className="p-6">
          <input 
            ref={fileInputRef} 
            type="file" 
            accept=".png,.jpg,.jpeg,.webp,.gif" 
            className="hidden" 
            onChange={handleDirectLogoUpload} 
          />
          {!isExpanded ? (
            /* COMPACT GRID VIEW */
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div 
                  className="relative w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border border-slate-100 shrink-0 cursor-pointer group hover:opacity-80 transition-all"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  {isUploadingIcon && <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10"><Loader2 size={16} className="animate-spin text-emerald-500" /></div>}
                  {logoPath ? <img src={logoPath} alt="" className="w-full h-full object-cover p-1.5" /> : <Users className="text-slate-300 group-hover:text-emerald-500 transition-colors" size={20} />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-800 truncate">{team.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{groupsCount} Groupes • {playersCount} Joueurs</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex gap-3">
                  <div className="flex items-center gap-1"><Leaf size={12} className="text-emerald-500"/><span className="text-[10px] font-black">{formatEcoImpact(teamImpact.co2, 'co2', 1)}</span></div>
                  <div className="flex items-center gap-1"><Droplets size={12} className="text-blue-500"/><span className="text-[10px] font-black">{formatEcoImpact(teamImpact.water, 'water', 1)}</span></div>
                  <div className="flex items-center gap-1"><Trash size={12} className="text-amber-500"/><span className="text-[10px] font-black">{formatEcoImpact(teamImpact.waste, 'waste', 1)}</span></div>
                </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); setShowTeamModal(true); }}
                     className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                     title="Paramètres de l'équipe"
                   >
                     <Settings2 size={16} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDeleteTeam(); }}
                     className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                     title="Supprimer l'équipe"
                   >
                     <Trash2 size={16} />
                   </button>
                   <ChevronDown size={18} className="text-slate-300" />
              </div>
            </div>
          ) : (
            /* EXPANDED FULL WIDTH VIEW */
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                   <div 
                     className="relative w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden border border-slate-100 shrink-0 cursor-pointer group hover:opacity-80 transition-all"
                     onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                   >
                      {isUploadingIcon && <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10"><Loader2 size={24} className="animate-spin text-emerald-500" /></div>}
                      {logoPath ? <img src={logoPath} alt="" className="w-full h-full object-cover p-2" /> : <Users className="text-slate-300 group-hover:text-emerald-500 transition-colors" size={32} />}
                   </div>
                   <div>
                      <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{team.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold text-slate-500">{groupsCount} groupes</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-sm font-bold text-slate-500">{playersCount} joueurs</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
                  <div className="hidden md:flex items-center gap-6">
                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-2 text-emerald-600 font-black"><Leaf size={14} /> {formatEcoImpact(teamImpact.co2, 'co2', 1)}</div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CO2 Évité</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-2 text-blue-600 font-black"><Droplets size={14} /> {formatEcoImpact(teamImpact.water, 'water', 1)}</div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eau sauvée</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-2 text-amber-600 font-black"><Trash size={14} /> {formatEcoImpact(teamImpact.waste, 'waste', 1)}</div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Déchets</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddGroup(); }}
                    title="Ajouter un groupe"
                    className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggle(); }} 
                    className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 shadow-sm border border-slate-200 hover:bg-slate-100 transition-all rotate-180"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              </div>

              <div className="w-full">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {team.groups.map((group: any) => {
                       // Pre-calculate group totals for the footer
                       let groupTotalActions = 0, groupTotalCo2 = 0, groupTotalWater = 0, groupTotalWaste = 0;
                       group.children?.forEach((c: any) => {
                          const pActs = c.actionsDone?.length || 0;
                          groupTotalActions += pActs;
                          c.actionsDone?.forEach((a: any) => {
                             groupTotalCo2 += a.savedCo2; groupTotalWater += a.savedWater; groupTotalWaste += a.savedWaste;
                          });
                       });

                       const forceTonnesCo2 = groupTotalCo2 >= 1000;
                       const forceM3Water = groupTotalWater >= 1000;
                       const forceTonnesWaste = groupTotalWaste >= 1000;

                       // Sort players: Actions Desc, then Name Asc
                       const sortedChildren = [...(group.children || [])].sort((a, b) => {
                         const actionsA = a.actionsDone?.length || 0;
                         const actionsB = b.actionsDone?.length || 0;
                         if (actionsB !== actionsA) return actionsB - actionsA;
                         return a.pseudo.localeCompare(b.pseudo);
                       });

                       return (
                        <div key={group.id} className="rounded-2xl bg-white border border-slate-100 flex flex-col shadow-sm hover:shadow-md transition-all overflow-hidden">
                          <div className="h-1 w-full" style={{ backgroundColor: group.color || cardColor }} />
                          <div className="p-6 flex flex-col gap-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-lg font-black text-slate-800 tracking-tight">{group.name}</h5>
                                <div className="flex items-center gap-2 mt-0.5">
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{group.children.length} Équipiers</p>
                                   <div className="w-1 h-1 rounded-full bg-slate-200" />
                                   <p className="text-[10px] text-[var(--color-sage)] font-black uppercase tracking-widest">{groupTotalActions} Actions</p>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <button onClick={() => onAddPlayer(group.id)} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm"><Plus size={14} /></button>
                                <button onClick={() => onEditGroup(group)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors border border-slate-100"><Settings2 size={14} /></button>
                              </div>
                            </div>

                            {/* TABLE-LIKE LIST */}
                            <div className="flex flex-col mt-2">
                              {/* HEADER */}
                              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                 <div className="w-6 shrink-0" />
                                 <div className="w-32 shrink-0">Pseudo</div>
                                 <div className="flex items-center gap-3 shrink-0 flex-1 justify-end">
                                    <div className="w-12 text-right flex items-center justify-end gap-1">
                                       <Star size={10} className="text-amber-500 opacity-70" /> Actions
                                    </div>
                                    <div className="w-14 text-right flex items-center justify-end gap-1 text-[7px]">
                                       <Leaf size={10} className="text-emerald-500 opacity-70" /> CO2e
                                    </div>
                                    <div className="w-12 text-right flex items-center justify-end gap-1 text-[7px]">
                                       <Droplets size={10} className="text-blue-500 opacity-70" /> Eau
                                    </div>
                                    <div className="w-12 text-right flex items-center justify-end gap-1 text-[7px]">
                                       <Trash size={10} className="text-amber-500 opacity-70" /> Déchets
                                    </div>
                                 </div>
                              </div>

                              {/* ROWS */}
                              <div className="flex flex-col max-h-[250px] overflow-y-auto custom-scrollbar">
                                 {sortedChildren.map((c: any) => {
                                   const playerActions = c.actionsDone?.length || 0;
                                   let pCo2 = 0, pWater = 0, pWaste = 0;
                                   c.actionsDone?.forEach((a: any) => {
                                      pCo2 += a.savedCo2; pWater += a.savedWater; pWaste += a.savedWaste;
                                   });

                                   return (
                                     <div 
                                       key={c.id} 
                                       className="flex items-center justify-between py-1 px-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group/row"
                                     >
                                       <div className="flex items-center gap-3 w-32 shrink-0 overflow-hidden">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); onSelectPlayer(c.id); }}
                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${selectedChildrenIds.includes(c.id) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200'}`}
                                          >
                                            {selectedChildrenIds.includes(c.id) && <Check size={10} strokeWidth={4} />}
                                          </button>
                                          <div 
                                            className="min-w-0 cursor-pointer hover:text-emerald-600 transition-colors"
                                            onClick={() => onEditPlayer(c)}
                                          >
                                            <span className="text-[11px] font-black text-slate-800 truncate block">{c.pseudo}</span>
                                          </div>
                                       </div>

                                       <div className="flex items-center gap-3 shrink-0 flex-1 justify-end">
                                          <div className="w-12 text-right">
                                            <span className="text-[10px] font-black text-amber-600">{playerActions}</span>
                                          </div>
                                          <div className="w-14 text-right">
                                            <span className="text-[10px] font-bold text-slate-500">{formatEcoImpact(pCo2, 'co2', 1, forceTonnesCo2)}</span>
                                          </div>
                                          <div className="w-12 text-right">
                                            <span className="text-[10px] font-bold text-slate-500">{formatEcoImpact(pWater, 'water', 1, forceM3Water)}</span>
                                          </div>
                                          <div className="w-12 text-right">
                                            <span className="text-[10px] font-bold text-slate-500">{formatEcoImpact(pWaste, 'waste', 1, forceTonnesWaste)}</span>
                                          </div>
                                          
                                          <div className="w-6 flex justify-end">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); onDeletePlayer(c); }}
                                              className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-40 group-hover/row:opacity-100"
                                              title="Supprimer l'équipier"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                       </div>
                                     </div>
                                   );
                                 })}
                              </div>

                              {/* FOOTER (TOTALS) */}
                              <div className="flex items-center justify-between px-3 py-2 mt-1 border-t-2 border-slate-50 bg-slate-50/10 rounded-b-xl backdrop-blur-sm">
                                 <div className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Groupe</div>
                                 <div className="flex items-center gap-3 shrink-0">
                                    <div className="w-12 text-right">
                                       <span className="text-[10px] font-black text-amber-600">{groupTotalActions}</span>
                                    </div>
                                    <div className="w-12 text-right">
                                       <span className="text-[10px] font-black text-slate-800">{formatEcoImpact(groupTotalCo2, 'co2', 1, forceTonnesCo2)}</span>
                                    </div>
                                    <div className="w-14 text-right">
                                       <span className="text-[10px] font-black text-slate-800">{formatEcoImpact(groupTotalWater, 'water', 1, forceM3Water)}</span>
                                    </div>
                                    <div className="w-12 text-right">
                                       <span className="text-[10px] font-black text-slate-800">{formatEcoImpact(groupTotalWaste, 'waste', 1, forceTonnesWaste)}</span>
                                    </div>
                                 </div>
                              </div>
                            </div>
                          </div>
                        </div>
                       );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
