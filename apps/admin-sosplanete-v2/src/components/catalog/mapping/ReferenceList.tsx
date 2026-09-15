'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { 
  GripVertical,
  Loader2,
  Check,
  Droplets,
  Leaf,
  Trash2,
  Star
} from 'lucide-react';
import { ActionGalleryCard } from '../ActionGalleryCard';
import { ActionRef, LocalAction } from '@/types';

interface ReferenceListProps {
  actions: ActionRef[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  mappedIds: number[];
  loading: boolean;
  globalSearch?: string;
  filterCategory?: string | null;
  minStars?: number;
  impactFilters?: { co2: boolean; water: boolean; waste: boolean };
  viewMode?: 'list' | 'grid';
  isEvoe?: boolean;
  sortBy?: string;
  onOpenDetail?: (action: ActionRef) => void;
}

export const ReferenceList: React.FC<ReferenceListProps> = ({ 
  actions, 
  selectedIds, 
  onSelect, 
  mappedIds,
  loading,
  globalSearch = '',
  filterCategory,
  minStars = 0,
  impactFilters = { co2: false, water: false, waste: false },
  viewMode = 'list',
  isEvoe = false,
  sortBy = 'code-asc',
  onOpenDetail
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'reference-drop-zone' });

  const filteredActions = useMemo(() => {
    return actions.filter(a => {
      const matchSearch = a.referenceName.toLowerCase().includes(globalSearch.toLowerCase()) || a.code.toLowerCase().includes(globalSearch.toLowerCase());
      const matchCat = !filterCategory || a.category === filterCategory;
      const matchStars = a.weightedStars >= minStars;
      
      const matchCo2 = !impactFilters.co2 || (a.defaultCo2 ?? 0) > 0;
      const matchWater = !impactFilters.water || (a.defaultWater ?? 0) > 0;
      const matchWaste = !impactFilters.waste || (a.defaultWaste ?? 0) > 0;

      const isNotMapped = !mappedIds.includes(a.id);
      return matchSearch && matchCat && matchStars && matchCo2 && matchWater && matchWaste && isNotMapped;
    }).sort((a, b) => {
      const getIT = (act: ActionRef) => {
        const co2 = act.defaultCo2 || 0;
        const water = act.defaultWater || 0;
        const waste = act.defaultWaste || 0;
        return Math.round(1 + 1.2 * co2 + 4.7 * waste + 0.0042 * water);
      };
      if (sortBy === 'it-desc') return getIT(b) - getIT(a);
      if (sortBy === 'it-asc') return getIT(a) - getIT(b);
      if (sortBy === 'code-asc') return a.code.localeCompare(b.code);
      if (sortBy === 'stars-desc') {
        const starsA = a.weightedStars ?? 0;
        const starsB = b.weightedStars ?? 0;
        if (starsB !== starsA) return starsB - starsA;
        return a.code.localeCompare(b.code);
      }
      if (sortBy === 'co2-desc') return (b.defaultCo2 ?? 0) - (a.defaultCo2 ?? 0);
      if (sortBy === 'water-desc') return (b.defaultWater ?? 0) - (a.defaultWater ?? 0);
      if (sortBy === 'waste-desc') return (b.defaultWaste ?? 0) - (a.defaultWaste ?? 0);
      return a.code.localeCompare(b.code);
    });
  }, [actions, globalSearch, filterCategory, minStars, impactFilters, mappedIds, sortBy]);

  const toggleSelect = (id: number) => {
    onSelect(
      selectedIds.includes(id) 
        ? selectedIds.filter(i => i !== id) 
        : [...selectedIds, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredActions.length) {
      onSelect([]);
    } else {
      onSelect(filteredActions.map(a => a.id));
    }
  };

  return (
    <div 
      ref={setNodeRef}
      onDragOver={(e) => e.preventDefault()}
      className={`flex flex-col gap-3 h-full p-5 rounded-2xl border transition-all duration-300 ${
        isOver 
          ? 'bg-rose-50/80 border-rose-400 border-dashed shadow-2xl shadow-rose-500/10' 
          : 'bg-white border-slate-200 shadow-xl'
      }`}
    >
      {/* Header Compact with COUNT (Fixed height for alignment) */}
      <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   <h3 className="text-xs font-black text-slate-800 tracking-tight leading-none uppercase">Actions Disponibles</h3>
                   <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-black">{filteredActions.length}</span>
                </div>
              </div>
          </div>

          <button 
            onClick={toggleSelectAll}
            className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2"
          >
            <span>Tout sélectionner</span>
            <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedIds.length === filteredActions.length && filteredActions.length > 0 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}>
                {selectedIds.length === filteredActions.length && filteredActions.length > 0 && <Check size={12} strokeWidth={4} />}
            </div>
          </button>
      </div>

      <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-1.5 mt-3">
        {loading ? (
          <div className="flex items-center justify-center py-20 opacity-20">
             <Loader2 size={32} className="animate-spin text-slate-400" />
          </div>
        ) : (
          viewMode === 'list' ? (
            filteredActions.map(action => (
              <CompactReferenceCard 
                key={action.id} 
                action={action} 
                isSelected={selectedIds.includes(action.id)}
                onToggle={() => toggleSelect(action.id)}
                onOpenDetail={onOpenDetail}
              />
            ))
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {filteredActions.map(action => (
                <GridReferenceCard
                  key={action.id}
                  action={action}
                  isSelected={selectedIds.includes(action.id)}
                  onToggle={() => toggleSelect(action.id)}
                  onOpenDetail={onOpenDetail}
                  isEvoe={isEvoe}
                />
              ))}
            </div>
          )
        )}

        {!loading && filteredActions.length === 0 && (
          <div className="py-20 text-center opacity-40">
             <p className="text-[10px] font-black uppercase tracking-widest">Toutes les actions sont sélectionnées</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const CompactReferenceCard = ({ action, isSelected, onToggle, onOpenDetail }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `ref-${action.id}`,
    data: { type: 'reference', action }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
    pointerEvents: isDragging ? ('none' as const) : undefined
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all select-none ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-lg' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-xl'} ${isDragging ? 'opacity-50 grayscale scale-95' : ''}`}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 cursor-pointer transition-all shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-slate-50 border-slate-100 group-hover:border-emerald-200'}`}
      >
        {isSelected && <Check size={14} strokeWidth={4} />}
      </div>

      <div 
        {...listeners} 
        {...attributes}
        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-emerald-500 transition-colors p-1"
      >
        <GripVertical size={20} />
      </div>

      <div className="flex flex-col flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-100/50">{action.code}</span>
          <span className="text-[12px] font-black text-slate-800 truncate">{action.referenceName}</span>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{action.category}</span>
           <div className="flex items-center gap-1 opacity-80">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-black text-emerald-800">{action.weightedStars}</span>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pr-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
         {action.defaultCo2 > 0 && <Leaf size={14} className="text-emerald-500" />}
         {action.defaultWater > 0 && <Droplets size={14} className="text-sky-500" />}
      </div>
    </div>
  );
};

export const GridReferenceCard = ({ action, isSelected, onToggle, onOpenDetail, isEvoe }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `ref-${action.id}`,
    data: { type: 'reference', action }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
    opacity: 0.8,
    scale: 1.05,
    pointerEvents: isDragging ? ('none' as const) : undefined
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`relative group select-none ${isDragging ? 'z-50' : ''}`}
    >
        {/* Checkbox Overlay */}
        <div 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`absolute top-2 right-2 z-20 w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all cursor-pointer shadow-md ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-slate-200 opacity-0 group-hover:opacity-100'}`}
        >
          {isSelected && <Check size={14} strokeWidth={4} />}
        </div>

        {/* Drag Handle Overlay */}
        <div 
          {...listeners} 
          {...attributes}
          className="absolute top-2 left-2 z-20 w-8 h-8 rounded-lg bg-white/95 text-slate-400 flex items-center justify-center cursor-grab active:cursor-grabbing hover:text-emerald-500 transition-all shadow-md opacity-70 group-hover:opacity-100 border border-slate-200/50"
        >
          <GripVertical size={18} />
        </div>

        <div onClick={(e) => { e.stopPropagation(); onOpenDetail?.(action); }}>
          <ActionGalleryCard action={action} isEvoe={isEvoe} onEdit={() => onOpenDetail?.(action)} />
        </div>
    </div>
  );
};
