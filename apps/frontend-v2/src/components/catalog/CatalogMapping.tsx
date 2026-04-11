'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext, 
  DragOverlay, 
  pointerWithin, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  sortableKeyboardCoordinates, 
} from '@dnd-kit/sortable';
import { 
  Search, 
  Plus, 
  Trash2, 
  Settings2, 
  Filter, 
  Info, 
  ArrowRight,
  ArrowLeft,
  EyeOff,
  Eye,
  Check,
  Upload,
  Star,
  Leaf,
  Droplets,
  X,
  Target,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LocalList } from './mapping/LocalList';
import { ReferenceList } from './mapping/ReferenceList';
import { CatalogCsvModal } from './CatalogCsvModal';
import { LocalActionEditModal } from './LocalActionEditModal';

import { ActionRef, LocalAction } from '@/types';

interface CatalogMappingProps {
  instanceId: number;
}

export const CatalogMapping: React.FC<CatalogMappingProps> = ({ instanceId }) => {
  const [referenceActions, setReferenceActions] = useState<ActionRef[]>([]);
  const [localActions, setLocalActions] = useState<LocalAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefHidden, setIsRefHidden] = useState(false);
  
  // LIFTED FILTER STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [minStars, setMinStars] = useState<number>(0);
  const [impactFilters, setImpactFilters] = useState({ co2: false, water: false, waste: false });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [selectedRefIds, setSelectedRefIds] = useState<number[]>([]);
  const [selectedLocalIds, setSelectedLocalIds] = useState<number[]>([]);

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editingAction, setEditingAction] = useState<LocalAction | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, [instanceId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const [refRes, localRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-actions?instanceId=${instanceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (refRes.ok) setReferenceActions(await refRes.json());
      if (localRes.ok) setLocalActions(await localRes.json());
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMapActions = async (refIds: number[]) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-actions/bulk-import`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ instanceId, actionRefIds: refIds })
      });
      if (response.ok) {
        fetchData();
        setSelectedRefIds([]);
      }
    } catch (e) {
      console.error("Map error:", e);
    }
  };

  const handleUnmapActions = async (localIds: number[]) => {
    try {
      const token = localStorage.getItem('access_token');
      await Promise.all(localIds.map(id => 
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-actions/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));
      fetchData();
      setSelectedLocalIds([]);
    } catch (e) {
      console.error("Unmap error:", e);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type === 'reference' && over.id === 'local-drop-zone') {
      const id = active.id as number;
      handleMapActions(selectedRefIds.includes(id) ? selectedRefIds : [id]);
    }
    if (active.data.current?.type === 'local' && over.id === 'reference-drop-zone') {
      const id = active.id as number;
      handleUnmapActions(selectedLocalIds.includes(id) ? selectedLocalIds : [id]);
    }
  };

  const categories = useMemo(() => Array.from(new Set(referenceActions.map(a => a.category))).sort(), [referenceActions]);
  const activeFiltersCount = (filterCategory ? 1 : 0) + (minStars > 0 ? 1 : 0) + (impactFilters.co2 ? 1 : 0) + (impactFilters.water ? 1 : 0) + (impactFilters.waste ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 h-full min-h-[75vh]">
      
      {/* GLOBAL HUB: SEARCH & FILTERS & TOOLS */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col p-3 gap-3 z-30">
          <div className="flex items-center gap-3">
              {/* Main Search */}
              <div className="relative flex-grow">
                 <Input 
                   placeholder="Rechercher un code ou une action dans tout le catalogue..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="h-11 bg-slate-50 border-none rounded-xl pl-11 shadow-inner text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:bg-white transition-all"
                 />
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
              </div>

              {/* View Mode Toggle */}
              <button 
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                title={viewMode === 'list' ? "Passer en vue cartes" : "Passer en vue liste"}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all border border-slate-100/50"
              >
                {viewMode === 'list' ? <LayoutGrid size={18} /> : <List size={18} />}
              </button>

              {/* Advanced Filter Toggle */}
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-4 h-11 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${showAdvancedFilters ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <SlidersHorizontal size={14} />
                Filtres
                {activeFiltersCount > 0 && <span className="w-4 h-4 rounded-full bg-white text-emerald-600 flex items-center justify-center text-[9px]">{activeFiltersCount}</span>}
              </button>

              {/* Visibility Toggle (Icon only) */}
              <button 
                onClick={() => setIsRefHidden(!isRefHidden)}
                title={isRefHidden ? "Afficher le référentiel" : "Masquer le référentiel"}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${isRefHidden ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
              >
                {isRefHidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

              {/* Import CSV (Icon only) */}
              <button 
                 onClick={() => setShowCsvModal(true)}
                 title="Importation massive par codes (CSV)"
                 className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              >
                 <Upload size={18} />
              </button>
          </div>

          {/* Advanced Filters Drawer */}
          <AnimatePresence>
            {showAdvancedFilters && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="flex flex-col gap-4 pt-1 pb-2 border-t border-slate-50 mt-1 overflow-hidden"
               >
                  <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar pb-1">
                     <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
                        <button onClick={() => setFilterCategory(null)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${!filterCategory ? 'bg-slate-800 text-white shadow-md' : 'bg-white border-2 border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}>Toutes</button>
                        {categories.map(c => (
                          <button key={c} onClick={() => setFilterCategory(c)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${filterCategory === c ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-white border-2 border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}>{c}</button>
                        ))}
                     </div>
                     
                     <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border-2 border-slate-100 h-11 px-4 shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-slate-600 mr-1 uppercase">Score</span>
                        {[1, 2, 3, 4, 5].map(s => (
                          <button 
                            key={s}
                            onClick={() => setMinStars(minStars === s ? 0 : s)}
                            className={`p-1 transition-all ${minStars >= s ? 'text-amber-500' : 'text-slate-300 hover:text-amber-300'}`}
                          >
                            <Star size={16} className={minStars >= s ? 'fill-amber-400' : ''} />
                          </button>
                        ))}
                     </div>

                     <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-slate-100 h-11 px-6 shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-slate-600 mr-2 uppercase">Impacts</span>
                        <button 
                          onClick={() => setImpactFilters({...impactFilters, co2: !impactFilters.co2})}
                          className={`p-1.5 rounded-lg transition-all ${impactFilters.co2 ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-500/40 hover:bg-emerald-50 hover:text-emerald-500'}`}
                        ><Leaf size={16} /></button>
                        <button 
                          onClick={() => setImpactFilters({...impactFilters, water: !impactFilters.water})}
                          className={`p-1.5 rounded-lg transition-all ${impactFilters.water ? 'bg-sky-500 text-white shadow-md' : 'text-sky-500/40 hover:bg-sky-50 hover:text-sky-500'}`}
                        ><Droplets size={16} /></button>
                        <button 
                          onClick={() => setImpactFilters({...impactFilters, waste: !impactFilters.waste})}
                          className={`p-1.5 rounded-lg transition-all ${impactFilters.waste ? 'bg-amber-500 text-white shadow-md' : 'text-amber-500/40 hover:bg-amber-50 hover:text-amber-500'}`}
                        ><Trash2 size={16} /></button>
                     </div>

                     {activeFiltersCount > 0 && (
                        <button 
                          onClick={() => { setFilterCategory(null); setMinStars(0); setImpactFilters({co2:false,water:false,waste:false}); setSearchQuery(''); }}
                          className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-2 hover:underline shrink-0"
                        >Réinitialiser</button>
                     )}
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 h-full flex-grow items-start overflow-hidden">
          
          {/* CATALOGUE LOCAL */}
          <div className={`transition-all duration-500 overflow-hidden h-full ${isRefHidden ? 'col-span-3 px-20' : ''}`}>
             <LocalList 
                actions={localActions} 
                selectedIds={selectedLocalIds}
                onSelect={setSelectedLocalIds}
                onEdit={(action) => setEditingAction(action)}
                onRemove={(id) => handleUnmapActions([id])}
                loading={loading}
                globalSearch={searchQuery}
                filterCategory={filterCategory}
                minStars={minStars}
                impactFilters={impactFilters}
                viewMode={viewMode}
                isFullWidth={isRefHidden}
             />
          </div>

          {!isRefHidden && (
            <div className="flex flex-col items-center justify-center p-4 h-full relative z-10 opacity-20">
               <div className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-xl flex items-center justify-center text-slate-300">
                  <ArrowLeft size={18} />
               </div>
               <div className="w-px bg-gradient-to-b from-transparent via-slate-100 to-transparent flex-grow my-4" />
            </div>
          )}

          {/* RÉFÉRENTIEL GLOBAL */}
          <AnimatePresence>
            {!isRefHidden && (
              <motion.div 
                initial={{ opacity: 0, x: 50, width: 0 }}
                animate={{ opacity: 1, x: 0, width: '100%' }}
                exit={{ opacity: 0, x: 50, width: 0 }}
                className="h-full overflow-hidden"
              >
                <ReferenceList 
                   actions={referenceActions}
                   selectedIds={selectedRefIds}
                   onSelect={setSelectedRefIds}
                   mappedIds={localActions.map(la => la.actionRefId)}
                   loading={loading}
                   globalSearch={searchQuery}
                   filterCategory={filterCategory}
                   minStars={minStars}
                   impactFilters={impactFilters}
                   viewMode={viewMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DragOverlay>
           {/* Custom drag overlay if needed */}
        </DragOverlay>
      </DndContext>

      {/* MODALS */}
      <CatalogCsvModal 
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onImport={fetchData}
        instanceId={instanceId}
      />

      <LocalActionEditModal 
        action={editingAction}
        isOpen={!!editingAction}
        onClose={() => setEditingAction(null)}
        onSave={() => {
          fetchData();
          setEditingAction(null);
        }}
      />
    </div>
  );
};


