'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext, 
  DragOverlay, 
  rectIntersection, 
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
  List,
  ArrowUpDown,
  ImagePlus,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LocalList } from './mapping/LocalList';
import { ReferenceList } from './mapping/ReferenceList';
import { CatalogCsvModal } from './CatalogCsvModal';
import { LocalActionEditModal } from './LocalActionEditModal';

import { ActionRef, LocalAction } from '@/types';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

interface CatalogMappingProps {
  instanceId: number;
  schoolYear: string;
  /** Optionnel — si fourni, l'API scope directement sur l'instanceYearId */
  instanceYearId?: number;
}

export const CatalogMapping: React.FC<CatalogMappingProps> = ({ instanceId, schoolYear, instanceYearId }) => {
  const [referenceActions, setReferenceActions] = useState<ActionRef[]>([]);
  const [localActions, setLocalActions] = useState<LocalAction[]>([]);
  const [instanceCategories, setInstanceCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefHidden, setIsRefHidden] = useState(false);
  
  // LIFTED FILTER STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [minStars, setMinStars] = useState<number>(0);
  const [impactFilters, setImpactFilters] = useState({ co2: false, water: false, waste: false });
  const [sortBy, setSortBy] = useState<string>('done-desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [selectedRefIds, setSelectedRefIds] = useState<number[]>([]);
  const [selectedLocalIds, setSelectedLocalIds] = useState<number[]>([]);

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editingAction, setEditingAction] = useState<LocalAction | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [viewUniverse, setViewUniverse] = useState<'legacy' | 'evoe'>('legacy');

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, [instanceId, schoolYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getAuthData('access_token');
      const scopeQuery = instanceYearId
        ? `instanceId=${instanceId}&schoolYear=${schoolYear}&instanceYearId=${instanceYearId}`
        : `instanceId=${instanceId}&schoolYear=${schoolYear}`;
      const [refRes, localRes, catRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-actions?${scopeQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories?${scopeQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (refRes.ok) setReferenceActions(await refRes.json());
      if (localRes.ok) setLocalActions(await localRes.json());
      if (catRes.ok) setInstanceCategories(await catRes.json());
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMapActions = async (refIds: number[]) => {
    try {
      const token = getAuthData('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-actions/bulk-import`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instanceId: Number(instanceId),
          actionRefIds: refIds,
          schoolYear,
          ...(instanceYearId ? { instanceYearId } : {})
        })
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
      const token = getAuthData('access_token');
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
    
    const activeIdStr = String(active.id);
    if (active.data.current?.type === 'reference' && over.id === 'local-drop-zone') {
      const id = parseInt(activeIdStr.replace('ref-', ''), 10);
      handleMapActions(selectedRefIds.includes(id) ? selectedRefIds : [id]);
    }
    if (active.data.current?.type === 'local' && over.id === 'reference-drop-zone') {
      const id = parseInt(activeIdStr.replace('local-', ''), 10);
      handleUnmapActions(selectedLocalIds.includes(id) ? selectedLocalIds : [id]);
    }
  };

  const [syncingImages, setSyncingImages] = useState(false);

  const handleSyncImages = async () => {
    setSyncingImages(true);
    try {
      const token = getAuthData('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref/sync-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.updatedCount} image(s) synchronisée(s) avec succès depuis le dossier uploads !`);
        fetchData();
      } else {
        alert("Erreur lors de la synchronisation des images.");
      }
    } catch (e) {
      alert("Erreur réseau lors de la synchronisation.");
    } finally {
      setSyncingImages(false);
    }
  };

  const categories = useMemo(() => Array.from(new Set(referenceActions.map(a => a.category).filter((c): c is string => !!c))).sort(), [referenceActions]);
  const activeFiltersCount = (filterCategory ? 1 : 0) + (minStars > 0 ? 1 : 0) + (impactFilters.co2 ? 1 : 0) + (impactFilters.water ? 1 : 0) + (impactFilters.waste ? 1 : 0) + (sortBy !== 'done-desc' ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 h-full min-h-[75vh]">
      
      {/* GLOBAL HUB: STICKY SEARCH & FILTERS & TOOLS */}
      <div className="sticky top-[140px] lg:top-[146px] z-30 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col p-3 gap-3 transition-all">
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

              {/* Universe Toggle Switch */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                <button
                  onClick={() => setViewUniverse('legacy')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewUniverse === 'legacy' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Leaf size={14} /> SOS Planète
                </button>
                <button
                  onClick={() => setViewUniverse('evoe')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewUniverse === 'evoe' ? 'bg-slate-900 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Zap size={14} /> Évoé SF
                </button>
              </div>

              {/* Advanced Filter Toggle */}
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-4 h-11 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${showAdvancedFilters ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <SlidersHorizontal size={14} />
                Filtres & Tri
                {activeFiltersCount > 0 && <span className="w-4 h-4 rounded-full bg-white text-emerald-600 flex items-center justify-center text-[9px]">{activeFiltersCount}</span>}
              </button>

              {/* Bulk Delete Local Selection (Icon only) */}
              <AnimatePresence>
                {selectedLocalIds.length > 0 && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    onClick={() => {
                      if (window.confirm(`Voulez-vous vraiment supprimer les ${selectedLocalIds.length} actions sélectionnées ?`)) {
                        handleUnmapActions(selectedLocalIds);
                      }
                    }}
                    title="Supprimer la sélection du catalogue local"
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                  >
                    <Trash2 size={18} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Bulk Add Reference Selection (Icon only) */}
              <AnimatePresence>
                {selectedRefIds.length > 0 && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    onClick={() => {
                      handleMapActions(selectedRefIds);
                    }}
                    title={`Ajouter les ${selectedRefIds.length} actions sélectionnées à mon catalogue`}
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Sync Images Button (Icon only) */}
              <button 
                 onClick={handleSyncImages}
                 disabled={syncingImages}
                 title="Scanner et synchroniser automatiquement les images depuis le dossier uploads"
                 className={`w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm ${syncingImages ? 'opacity-50 pointer-events-none' : ''}`}
              >
                 <ImagePlus size={18} className={syncingImages ? 'animate-spin text-emerald-500' : ''} />
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

          {/* Advanced Filters & Sorting Drawer */}
          <AnimatePresence>
            {showAdvancedFilters && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="flex flex-col gap-4 pt-2 pb-2 border-t border-slate-100 mt-1 overflow-hidden"
               >
                  <div className="flex flex-wrap items-center gap-3">
                     
                     {/* PREMIUM COMPACT CATEGORY COMBOBOX */}
                     <div className="relative flex items-center">
                        <select
                          value={filterCategory || ''}
                          onChange={(e) => setFilterCategory(e.target.value ? e.target.value : null)}
                          className="h-11 bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 pr-9 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:border-emerald-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer shadow-sm appearance-none"
                        >
                          <option value="">📂 Toutes les catégories ({referenceActions.length})</option>
                          {categories.map(c => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>

                     {/* SORT SELECTOR */}
                     <div className="relative flex items-center">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="h-11 bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 pr-9 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:border-emerald-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer shadow-sm appearance-none"
                        >
                          <option value="done-desc">📉 Réalisations (Décroissant)</option>
                          <option value="done-asc">📈 Réalisations (Croissant)</option>
                          <option value="it-desc">⚡ Points IT (Max → Min)</option>
                          <option value="it-asc">⚡ Points IT (Min → Max)</option>
                          <option value="code-asc">🔤 Code (A → Z)</option>
                          <option value="stars-desc">⭐ Score / Étoiles (5 → 1)</option>
                        </select>
                        <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                     
                     {/* STARS FILTER */}
                     <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border-2 border-slate-200 h-11 px-3 shadow-sm">
                        <span className="text-[10px] font-black text-slate-500 mr-1 uppercase">Score</span>
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

                     {/* IMPACT FILTERS */}
                     <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border-2 border-slate-200 h-11 px-3 shadow-sm">
                        <span className="text-[10px] font-black text-slate-500 mr-1 uppercase">Impacts</span>
                        <button 
                          onClick={() => setImpactFilters({...impactFilters, co2: !impactFilters.co2})}
                          title="Filtre CO2"
                          className={`p-1.5 rounded-lg transition-all ${impactFilters.co2 ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-500/40 hover:bg-emerald-100/50 hover:text-emerald-600'}`}
                        ><Leaf size={16} /></button>
                        <button 
                          onClick={() => setImpactFilters({...impactFilters, water: !impactFilters.water})}
                          title="Filtre Eau"
                          className={`p-1.5 rounded-lg transition-all ${impactFilters.water ? 'bg-sky-500 text-white shadow-md' : 'text-sky-500/40 hover:bg-sky-100/50 hover:text-sky-600'}`}
                        ><Droplets size={16} /></button>
                        <button 
                          onClick={() => setImpactFilters({...impactFilters, waste: !impactFilters.waste})}
                          title="Filtre Déchets"
                          className={`p-1.5 rounded-lg transition-all ${impactFilters.waste ? 'bg-amber-500 text-white shadow-md' : 'text-amber-500/40 hover:bg-amber-100/50 hover:text-amber-600'}`}
                        ><Trash2 size={16} /></button>
                     </div>

                     {activeFiltersCount > 0 && (
                        <button 
                          onClick={() => { 
                            setFilterCategory(null); 
                            setMinStars(0); 
                            setImpactFilters({co2:false,water:false,waste:false}); 
                            setSearchQuery(''); 
                            setSortBy('done-desc');
                          }}
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
        collisionDetection={rectIntersection}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 h-full flex-grow items-start overflow-hidden">
          
          {/* CATALOGUE LOCAL */}
          <div className={`transition-all duration-500 overflow-hidden h-full ${isRefHidden ? 'col-span-3' : ''}`}>
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
                sortBy={sortBy}
                isEvoe={viewUniverse === 'evoe'}
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
                   isEvoe={viewUniverse === 'evoe'}
                   sortBy={sortBy}
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
        schoolYear={schoolYear}
      />

      <LocalActionEditModal 
        action={editingAction}
        categories={instanceCategories}
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


