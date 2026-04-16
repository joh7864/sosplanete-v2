'use client';

import React, { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { 
  Plus, 
  Trash2, 
  Settings2, 
  Check,
  Star,
  Leaf,
  Droplets
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionGalleryCard } from '../ActionGalleryCard';
import { LocalAction } from '@/types';

interface LocalListProps {
  actions: LocalAction[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (action: LocalAction) => void;
  onRemove: (id: number) => void;
  loading: boolean;
  globalSearch?: string;
  filterCategory?: string | null;
  minStars?: number;
  impactFilters?: { co2: boolean; water: boolean; waste: boolean };
  viewMode?: 'list' | 'grid';
  isFullWidth?: boolean;
}

export const LocalList: React.FC<LocalListProps> = ({ 
  actions, 
  selectedIds, 
  onSelect, 
  onEdit, 
  onRemove,
  loading,
  globalSearch = '',
  filterCategory,
  minStars = 0,
  impactFilters = { co2: false, water: false, waste: false },
  viewMode = 'list',
  isFullWidth = false
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'local-drop-zone' });

  const filteredLocal = useMemo(() => {
    return actions.filter(la => {
      const matchSearch = la.label.toLowerCase().includes(globalSearch.toLowerCase()) || la.actionRef.code.toLowerCase().includes(globalSearch.toLowerCase());
      const matchCat = !filterCategory || (la.category && (typeof la.category === 'string' ? la.category === filterCategory : la.category.name === filterCategory));
      const matchStars = (la.actionRef.weightedStars || 0) >= minStars;
      
      const matchCo2 = !impactFilters.co2 || (la.actionRef.defaultCo2 ?? 0) > 0;
      const matchWater = !impactFilters.water || (la.actionRef.defaultWater ?? 0) > 0;
      const matchWaste = !impactFilters.waste || (la.actionRef.defaultWaste ?? 0) > 0;

      return matchSearch && matchCat && matchStars && matchCo2 && matchWater && matchWaste;
    });
  }, [actions, globalSearch, filterCategory, minStars, impactFilters]);

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter(idx => idx !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLocal.length) {
      onSelect([]);
    } else {
      onSelect(filteredLocal.map(la => la.id));
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col gap-3 h-full p-5 rounded-2xl border transition-all duration-300 ${isOver ? 'bg-emerald-50/80 border-emerald-400 border-dashed shadow-2xl shadow-emerald-500/10' : 'bg-white border-slate-200 shadow-xl'}`}
    >
      {/* Header Compact with COUNT (Fixed height for alignment) */}
      <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Settings2 size={16} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   <h3 className="text-xs font-black text-slate-800 tracking-tight leading-none uppercase">Mon Catalogue</h3>
                   <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-black">{actions.length}</span>
                </div>
              </div>
          </div>

          <button 
           onClick={toggleSelectAll}
           className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-2"
          >
            <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedIds.length === filteredLocal.length && filteredLocal.length > 0 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200'}`}>
               {selectedIds.length === filteredLocal.length && filteredLocal.length > 0 && <Check size={12} strokeWidth={4} />}
            </div>
          </button>
      </div>

      <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-1.5 mt-3">
        {loading ? (
          <div className="flex items-center justify-center py-20 opacity-20">
             <Settings2 size={32} className="animate-spin" />
          </div>
        ) : (
          viewMode === 'list' ? (
            filteredLocal.map(action => (
              <CompactLocalCard 
                key={action.id} 
                action={action} 
                isSelected={selectedIds.includes(action.id)}
                onToggle={() => toggleSelect(action.id)}
                onEdit={() => onEdit(action)}
                onRemove={() => onRemove(action.id)}
              />
            ))
          ) : (
            <div className={`grid gap-4 pt-2 transition-all duration-500 ${isFullWidth ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredLocal.map(action => (
                <div key={action.id} className="relative group">
                   {/* Checkbox Overlay */}
                   <div 
                    onClick={(e) => { e.stopPropagation(); toggleSelect(action.id); }}
                    className={`absolute top-2 right-2 z-20 w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all cursor-pointer shadow-md ${selectedIds.includes(action.id) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 opacity-0 group-hover:opacity-100'}`}
                   >
                     {selectedIds.includes(action.id) && <Check size={14} strokeWidth={4} />}
                   </div>

                   {/* Quick Edit/Remove Mini Overlay */}
                   <div className="absolute bottom-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(action); }}
                        className="w-7 h-7 rounded-lg bg-white/90 text-slate-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-md"
                      >
                         <Settings2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(action.id); }}
                        className="w-7 h-7 rounded-lg bg-white/90 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-md"
                      >
                         <Trash2 size={12} />
                      </button>
                   </div>

                   <div onClick={() => onEdit(action)}>
                    <ActionGalleryCard 
                      action={{
                        ...action.actionRef,
                        referenceName: action.label, // Use local label
                        category: typeof action.category === 'string' ? action.category : (action.category?.name || 'Référence')
                      }} 
                    />
                   </div>
                </div>
              ))}
            </div>
          )
        )}

        {!loading && actions.length === 0 && (
          <div className="py-20 text-center opacity-40 flex flex-col items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                <Plus size={24} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Glissez des actions<br/>depuis le référentiel</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CompactLocalCard = ({ action, isSelected, onToggle, onEdit, onRemove }: any) => {
  return (
    <div 
      onClick={onEdit}
      className={`group relative flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg'}`}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 group-hover:border-emerald-300'}`}
      >
        {isSelected && <Check size={14} strokeWidth={4} />}
      </div>

      <div className="flex flex-col flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1 py-0.5 rounded border border-slate-200/50">{action.actionRef.code}</span>
          <span className="text-[12px] font-black text-slate-700 truncate">{action.label}</span>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">
             {typeof action.category === 'string' ? action.category : (action.category?.name || 'Sans catégorie')}
           </span>
           <div className="flex items-center gap-1 opacity-70">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-black text-slate-400">{action.actionRef.weightedStars}</span>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
         <button 
           onClick={(e) => { e.stopPropagation(); onRemove(); }}
           className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
         >
           <Trash2 size={14} />
         </button>
      </div>
    </div>
  );
};
