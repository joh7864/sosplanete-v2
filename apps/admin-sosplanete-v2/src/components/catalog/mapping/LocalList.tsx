'use client';

import React, { useState, useMemo } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { 
  Plus, 
  Trash2, 
  Settings2, 
  Check,
  Star,
  Leaf,
  Droplets,
  GripVertical
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
  sortBy?: string;
  isEvoe?: boolean;
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
  isFullWidth = false,
  sortBy = 'done-desc',
  isEvoe = false
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'local-drop-zone' });

  const filteredLocal = useMemo(() => {
    const list = actions.filter(la => {
      const matchSearch = la.label.toLowerCase().includes(globalSearch.toLowerCase()) || la.actionRef.code.toLowerCase().includes(globalSearch.toLowerCase());
      const matchCat = !filterCategory || (la.category && (typeof la.category === 'string' ? la.category === filterCategory : la.category.name === filterCategory));
      const matchStars = (la.actionRef.weightedStars || 0) >= minStars;
      
      const matchCo2 = !impactFilters.co2 || (la.actionRef.defaultCo2 ?? 0) > 0;
      const matchWater = !impactFilters.water || (la.actionRef.defaultWater ?? 0) > 0;
      const matchWaste = !impactFilters.waste || (la.actionRef.defaultWaste ?? 0) > 0;

      return matchSearch && matchCat && matchStars && matchCo2 && matchWater && matchWaste;
    });

    return [...list].sort((a, b) => {
      const getIT = (item: LocalAction) => {
        const co2 = item.actionRef.defaultCo2 || 0;
        const water = item.actionRef.defaultWater || 0;
        const waste = item.actionRef.defaultWaste || 0;
        return 10 + Math.round((12 * co2) + (4 * waste) + (0.04 * water));
      };
      if (sortBy === 'it-desc') {
        const itA = getIT(a);
        const itB = getIT(b);
        if (itB !== itA) return itB - itA;
        return a.actionRef.code.localeCompare(b.actionRef.code);
      }
      if (sortBy === 'it-asc') {
        const itA = getIT(a);
        const itB = getIT(b);
        if (itA !== itB) return itA - itB;
        return a.actionRef.code.localeCompare(b.actionRef.code);
      }
      const countA = a._count?.actionsDone ?? 0;
      const countB = b._count?.actionsDone ?? 0;
      if (sortBy === 'done-desc') {
        if (countB !== countA) return countB - countA;
        return a.actionRef.code.localeCompare(b.actionRef.code);
      }
      if (sortBy === 'done-asc') {
        if (countA !== countB) return countA - countB;
        return a.actionRef.code.localeCompare(b.actionRef.code);
      }
      if (sortBy === 'code-asc') {
        return a.actionRef.code.localeCompare(b.actionRef.code);
      }
      if (sortBy === 'stars-desc') {
        const starsA = a.actionRef.weightedStars ?? 0;
        const starsB = b.actionRef.weightedStars ?? 0;
        if (starsB !== starsA) return starsB - starsA;
        return a.actionRef.code.localeCompare(b.actionRef.code);
      }
      return countB - countA;
    });
  }, [actions, globalSearch, filterCategory, minStars, impactFilters, sortBy]);

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
                <DraggableGridLocalCard
                  key={action.id}
                  action={action}
                  isSelected={selectedIds.includes(action.id)}
                  onToggle={() => toggleSelect(action.id)}
                  onEdit={() => onEdit(action)}
                  onRemove={() => onRemove(action.id)}
                  isEvoe={isEvoe}
                />
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

const CompactLocalCard = ({ action, isSelected, onToggle, onEdit, onRemove, isEvoe }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `local-${action.id}`,
    data: { type: 'local', action }
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
      onClick={onEdit}
      className={`group relative flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg'} ${isDragging ? 'opacity-50 grayscale scale-95' : ''}`}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 group-hover:border-emerald-300'}`}
      >
        {isSelected && <Check size={14} strokeWidth={4} />}
      </div>

      <div 
        {...listeners} 
        {...attributes}
        className="cursor-grab active:cursor-grabbing text-slate-200 hover:text-emerald-400 transition-colors"
      >
        <GripVertical size={16} />
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
      
      {/* Badge de réalisations */}
      {action._count?.actionsDone !== undefined && (
        <div 
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black border transition-all shrink-0 ${
            action._count.actionsDone > 0 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
              : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}
          title={`${action._count.actionsDone} réalisation(s) par les élèves`}
        >
          {action._count.actionsDone > 0 && <Check size={12} strokeWidth={4} />}
          <span>{action._count.actionsDone > 0 ? action._count.actionsDone : '0'}</span>
        </div>
      )}

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

const DraggableGridLocalCard = ({ action, isSelected, onToggle, onEdit, onRemove, isEvoe }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `local-${action.id}`,
    data: { type: 'local', action }
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
      className={`relative group transition-all ${isSelected ? 'scale-95' : ''} ${isDragging ? 'opacity-50 grayscale' : 'hover:scale-[1.02]'}`}
    >
      {/* Checkbox Overlay */}
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`absolute top-2 right-2 z-20 w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all cursor-pointer shadow-md ${isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 opacity-0 group-hover:opacity-100'}`}
      >
        {isSelected && <Check size={14} strokeWidth={4} />}
      </div>

      <div 
        {...listeners} 
        {...attributes}
        className="absolute top-10 right-2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border-2 border-slate-100 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-emerald-500 hover:border-emerald-300 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
      >
        <GripVertical size={14} />
      </div>

      {/* Quick Edit/Remove Mini Overlay */}
      <div className="absolute bottom-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-7 h-7 rounded-lg bg-white/90 text-slate-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-md"
        >
          <Settings2 size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-7 h-7 rounded-lg bg-white/90 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-md"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div onClick={onEdit}>
        <ActionGalleryCard 
          action={{
            ...action.actionRef,
            referenceName: action.label,
            category: (typeof action.category === 'string' ? action.category : action.category?.name) || action.actionRef.category || 'Général'
          }}
          isEvoe={isEvoe}
          actionsDoneCount={action._count?.actionsDone}
        />
      </div>
    </div>
  );
};
