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

interface ActionRef {
  id: number;
  code: string;
  referenceName: string;
  category: string;
  impactLabel: string;
  weightedStars: number;
  image?: string;
  defaultCo2: number;
  defaultWater: number;
  defaultWaste: number;
}

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
  impactFilters = { co2: false, water: false, waste: false }
}) => {
  const { setNodeRef } = useDroppable({ id: 'reference-drop-zone' });

  const filteredActions = useMemo(() => {
    return actions.filter(a => {
      const matchSearch = a.referenceName.toLowerCase().includes(globalSearch.toLowerCase()) || a.code.toLowerCase().includes(globalSearch.toLowerCase());
      const matchCat = !filterCategory || a.category === filterCategory;
      const matchStars = a.weightedStars >= minStars;
      
      const matchCo2 = !impactFilters.co2 || a.defaultCo2 > 0;
      const matchWater = !impactFilters.water || a.defaultWater > 0;
      const matchWaste = !impactFilters.waste || a.defaultWaste > 0;

      const isNotMapped = !mappedIds.includes(a.id);
      return matchSearch && matchCat && matchStars && matchCo2 && matchWater && matchWaste && isNotMapped;
    });
  }, [actions, globalSearch, filterCategory, minStars, impactFilters, mappedIds]);

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter(idx => idx !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredActions.length) {
      onSelect([]);
    } else {
      onSelect(filteredActions.map(a => a.id));
    }
  };

  return (
    <div ref={setNodeRef} className="flex flex-col gap-3 h-full bg-white/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      
      <div className="flex items-center justify-between px-1">
         <button 
          onClick={toggleSelectAll}
          className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-2"
         >
           <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedIds.length === filteredActions.length && filteredActions.length > 0 ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-slate-200'}`}>
              {selectedIds.length === filteredActions.length && filteredActions.length > 0 && <Check size={12} strokeWidth={4} />}
           </div>
           Tout sélectionner
         </button>
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
           {filteredActions.length} disponibles
         </span>
      </div>

      <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-1.5 mt-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-10">
             <Loader2 size={32} className="animate-spin text-emerald-500" />
          </div>
        ) : (
          filteredActions.map(action => (
            <DraggableActionCard 
              key={action.id} 
              action={action} 
              isSelected={selectedIds.includes(action.id)}
              onToggle={() => toggleSelect(action.id)}
            />
          ))
        )}
        
        {!loading && filteredActions.length === 0 && (
          <div className="py-20 text-center opacity-40 italic text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
            Aucune action trouvée<br/>pour ces critères.
          </div>
        )}
      </div>
    </div>
  );
};

const DraggableActionCard = ({ action, isSelected, onToggle }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: action.id,
    data: { type: 'reference', action }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-lg' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-xl'} ${isDragging ? 'opacity-50 grayscale scale-95' : ''}`}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 cursor-pointer transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-slate-50 border-slate-100 group-hover:border-emerald-200'}`}
      >
        {isSelected && <Check size={14} strokeWidth={4} />}
      </div>

      <div 
        {...listeners} 
        {...attributes}
        className="cursor-grab active:cursor-grabbing text-slate-100 group-hover:text-emerald-400 transition-colors"
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
