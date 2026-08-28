'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Loader2, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  Upload,
  Leaf,
  Zap,
  Star,
  Layers,
  SlidersHorizontal,
  ImagePlus,
  Droplets,
  Check,
  X,
  ArrowUpDown
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GalleryGroup } from '@/components/catalog/GalleryGroup';
import { ReferenceCsvModal } from '@/components/catalog/ReferenceCsvModal';
import { CatalogMapping } from '@/components/catalog/CatalogMapping';
import { ActionRefEditModal } from '@/components/catalog/ActionRefEditModal';
import { ActionRef } from '@/types';
import { getAuthData } from '@/utils/storage';

const CATEGORY_SF_MAP: Record<string, string> = {
  Eau: 'Ressources vitales',
  "L'eau": 'Ressources vitales',
  Alimentation: 'Ressources vitales',
  "L'alimentation": 'Ressources vitales',
  Courses: 'Ressources vitales',
  Maison: 'Ressources vitales',
  Biodiversité: 'Bio-génétique',
  'La biodiversité': 'Bio-génétique',
  Animaux: 'Bio-génétique',
  Electricité: 'Energie',
  Energie: 'Energie',
  "L'énergie": 'Energie',
  Déchets: 'Recyclage',
  'Les déchets': 'Recyclage',
  Transport: 'Propulsion',
  Numérique: 'Numérique',
};

type ViewMode = 'list' | 'gallery';
type GroupBy = 'category' | 'stars' | 'impact' | 'it';
type ViewUniverse = 'legacy' | 'evoe';

interface CatalogSectionProps {
  /** Mode AS : affiche le référentiel global avec édition et import CSV. Mode AM : affiche le catalogue local. */
  role: 'AS' | 'AM';
  instanceId?: number;
  schoolYear?: string;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({ role, instanceId, schoolYear }) => {
  // Pour AS : référentiel global
  const [viewUniverse, setViewUniverse] = useState<ViewUniverse>('legacy');
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [groupBy, setGroupBy] = useState<GroupBy>('stars');
  const [isAllExpanded, setIsAllExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actions, setActions] = useState<ActionRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Filters & Sorting state
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [minStars, setMinStars] = useState<number>(0);
  const [impactFilters, setImpactFilters] = useState({ co2: false, water: false, waste: false });
  const [sortBy, setSortBy] = useState<string>('stars-desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [syncingImages, setSyncingImages] = useState(false);

  // Modal d'édition d'une ActionRef
  const [editingAction, setEditingAction] = useState<ActionRef | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const token = getAuthData('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref/search${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setActions(data);
      }
    } catch (error) {
      console.error('Erreur chargement référentiel:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'AS') {
      const timer = setTimeout(fetchActions, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, role]);

  const handleSyncImages = async () => {
    setSyncingImages(true);
    try {
      const token = getAuthData('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref/sync-images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.updatedCount} image(s) synchronisée(s) avec succès depuis le dossier uploads !`);
        fetchActions();
      } else {
        alert("Erreur lors de la synchronisation des images.");
      }
    } catch (e) {
      alert("Erreur réseau lors de la synchronisation.");
    } finally {
      setSyncingImages(false);
    }
  };

  const handleDeleteAction = async (id: number) => {
    try {
      const token = getAuthData('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setActions((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert('Erreur lors de la suppression de l’action.');
      }
    } catch (err) {
      console.error('Erreur suppression action:', err);
    }
  };

  const handleOpenEdit = (action: ActionRef) => {
    setEditingAction(action);
    setIsEditModalOpen(true);
  };

  const handleSaveAction = (updated: ActionRef) => {
    setActions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const getITGroupLabel = (action: ActionRef): string => {
    const it = 10 + Math.round((12 * (action.defaultCo2 || 0)) + (4 * (action.defaultWaste || 0)) + (0.04 * (action.defaultWater || 0)));
    if (it <= 15) return '⚡ 10 à 15 IT (Impact Modéré)';
    if (it <= 35) return '⚡ 16 à 35 IT (Impact Significatif)';
    if (it <= 70) return '⚡ 36 à 70 IT (Impact Majeur)';
    return '⚡ 71+ IT (Impact Critique / Boss)';
  };

  const categories = useMemo(() => Array.from(new Set(actions.map(a => a.category).filter((c): c is string => !!c))).sort(), [actions]);
  const activeFiltersCount = (filterCategory ? 1 : 0) + (minStars > 0 ? 1 : 0) + (impactFilters.co2 ? 1 : 0) + (impactFilters.water ? 1 : 0) + (impactFilters.waste ? 1 : 0);

  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      const matchCat = !filterCategory || action.category === filterCategory;
      const matchStars = (action.weightedStars ?? 1) >= minStars;
      const matchCo2 = !impactFilters.co2 || (action.defaultCo2 ?? 0) > 0;
      const matchWater = !impactFilters.water || (action.defaultWater ?? 0) > 0;
      const matchWaste = !impactFilters.waste || (action.defaultWaste ?? 0) > 0;
      return matchCat && matchStars && matchCo2 && matchWater && matchWaste;
    }).sort((a, b) => {
      const getIT = (act: ActionRef) => {
        const co2 = act.defaultCo2 || 0;
        const water = act.defaultWater || 0;
        const waste = act.defaultWaste || 0;
        return 10 + Math.round((12 * co2) + (4 * waste) + (0.04 * water));
      };
      if (sortBy === 'it-desc') return getIT(b) - getIT(a);
      if (sortBy === 'it-asc') return getIT(a) - getIT(b);
      if (sortBy === 'code-asc') return a.code.localeCompare(b.code);
      if (sortBy === 'co2-desc') return (b.defaultCo2 ?? 0) - (a.defaultCo2 ?? 0);
      if (sortBy === 'water-desc') return (b.defaultWater ?? 0) - (a.defaultWater ?? 0);
      if (sortBy === 'waste-desc') return (b.defaultWaste ?? 0) - (a.defaultWaste ?? 0);
      return (b.weightedStars ?? 1) - (a.weightedStars ?? 1);
    });
  }, [actions, filterCategory, minStars, impactFilters, sortBy]);

  const groupedActions = useMemo(() => {
    const groups: { [key: string]: ActionRef[] } = {};
    filteredActions.forEach(action => {
      let key = '';
      if (groupBy === 'stars') {
        key = `${action.weightedStars ?? 1} Étoiles`;
      } else if (groupBy === 'category') {
        key = action.category || 'Sans catégorie';
        if (viewUniverse === 'evoe') {
          const categoryName = action.category || '';
          const cleanName = categoryName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          let matchedSector = 'Secteur Inconnu';
          for (const [legacyCat, sfSector] of Object.entries(CATEGORY_SF_MAP)) {
            const cleanLegacy = legacyCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (cleanName.toLowerCase() === cleanLegacy.toLowerCase()) {
              matchedSector = sfSector;
              break;
            }
          }
          key = matchedSector;
        }
      } else if (groupBy === 'it') {
        key = getITGroupLabel(action);
      } else {
        key = action.impactLabel || 'Impact non défini';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(action);
    });

    return Object.entries(groups).sort((a, b) => {
      if (groupBy === 'stars') return (parseInt(b[0]) || 0) - (parseInt(a[0]) || 0);
      if (groupBy === 'it') {
        const order = ['⚡ 1 à 5 IT', '⚡ 6 à 15 IT', '⚡ 16 à 35 IT', '⚡ 36+ IT'];
        const idxA = order.findIndex(o => a[0].startsWith(o));
        const idxB = order.findIndex(o => b[0].startsWith(o));
        return idxA - idxB;
      }
      return a[0].localeCompare(b[0]);
    });
  }, [filteredActions, groupBy, viewUniverse]);

  const getImpactStyles = (label: string) => {
    switch (label?.toLowerCase()) {
      case 'high': case 'fort': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': case 'moyen': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  // AM : affiche le catalogue local via CatalogMapping (page Mon Établissement préservée à 100%)
  if (role === 'AM') {
    if (!instanceId || !schoolYear) {
      return (
        <div className="p-12 text-center text-slate-400 text-sm">
          Sélectionnez une instance pour voir le catalogue.
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">Catalogue des actions</h2>
          <p className="text-sm text-slate-400 mt-0.5">Configuration du catalogue de votre établissement</p>
        </div>
        <CatalogMapping instanceId={instanceId} schoolYear={schoolYear} />
      </div>
    );
  }

  // AS : Référentiel global avec commutateur d'univers, édition complète et barre d'outils
  return (
    <div className="flex flex-col gap-6">
      {/* Top Header avec Univers Toggle et Import CSV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            Catalogue Référentiel Global
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
              {filteredActions.length} / {actions.length} action{actions.length > 1 ? 's' : ''}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Édition des visuels, indicateurs d'impacts réels et équivalences de missions SF
          </p>
        </div>
      </div>

      {/* Barre d'outils moderne harmonisée */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col p-3 gap-3 transition-all">
        <div className="flex items-center gap-3">
          {/* Recherche */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Rechercher par code, nom ou catégorie dans tout le référentiel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-slate-50 border-none rounded-xl pl-11 pr-4 shadow-inner text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:bg-white transition-all outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
            {loading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />}
          </div>

          {/* View Mode Toggle */}
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'gallery' : 'list')}
            title={viewMode === 'list' ? "Passer en vue cartes" : "Passer en vue liste"}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all border border-slate-100/50 shrink-0"
          >
            {viewMode === 'list' ? <LayoutGrid size={18} /> : <List size={18} />}
          </button>

          {/* Universe Toggle Switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/50 shrink-0">
            <button
              onClick={() => {
                setViewUniverse('legacy');
                if (groupBy === 'it') setGroupBy('category');
              }}
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
            className={`flex items-center gap-2 px-4 h-11 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shrink-0 ${showAdvancedFilters ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            <SlidersHorizontal size={14} />
            Filtres & Tri
            {activeFiltersCount > 0 && <span className="w-4 h-4 rounded-full bg-white text-emerald-600 flex items-center justify-center text-[9px]">{activeFiltersCount}</span>}
          </button>

          {/* Sync Images Button */}
          <button 
            onClick={handleSyncImages}
            disabled={syncingImages}
            title="Scanner et synchroniser automatiquement les images depuis le dossier uploads"
            className={`w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm shrink-0 ${syncingImages ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ImagePlus size={18} className={syncingImages ? 'animate-spin text-emerald-500' : ''} />
          </button>

          {/* Import CSV */}
          <button 
            onClick={() => setShowImportModal(true)}
            title="Importer des actions de référence (CSV)"
            className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm shrink-0"
          >
            <Upload size={18} />
          </button>

          {/* Fold / Unfold All */}
          {viewMode === 'gallery' && (
            <button
              onClick={() => setIsAllExpanded(!isAllExpanded)}
              className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-emerald-700 transition-all shadow-sm flex items-center justify-center shrink-0"
              title={isAllExpanded ? 'Tout replier' : 'Tout déplier'}
            >
              {isAllExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
        </div>

        {/* Tiroir Filtres & Tri avancés */}
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
                    <option value="">📂 Toutes les catégories ({actions.length})</option>
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
                    <option value="stars-desc">⭐ Score / Étoiles (5 → 1)</option>
                    <option value="it-desc">⚡ Points IT (Max → Min)</option>
                    <option value="it-asc">⚡ Points IT (Min → Max)</option>
                    <option value="code-asc">🔤 Code (A → Z)</option>
                    <option value="co2-desc">🌱 Impact CO2 Max</option>
                    <option value="water-desc">💧 Impact Eau Max</option>
                    <option value="waste-desc">🗑️ Impact Déchets Max</option>
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

                {/* Reset filters button */}
                {activeFiltersCount > 0 && (
                  <button 
                    onClick={() => { 
                      setFilterCategory(null); 
                      setMinStars(0); 
                      setImpactFilters({co2:false,water:false,waste:false}); 
                      setSortBy('stars-desc');
                    }}
                    className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-2 hover:underline shrink-0"
                  >Réinitialiser</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Liste ou Galerie */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard padding="none" className="overflow-hidden bg-white/80 shadow-xl rounded-2xl">
              <div className="grid grid-cols-[70px_1fr_130px_120px_100px_90px] gap-3 px-6 py-3 bg-slate-50/80 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                <div>CODE</div>
                <div>{viewUniverse === 'evoe' ? 'MISSION SF / ACTION' : 'TITRE ACTION'}</div>
                <div>CATÉGORIE</div>
                <div>{viewUniverse === 'evoe' ? 'POINTS IT' : 'IMPACTS (CO2/H2O/DECH)'}</div>
                <div>ÉTOILES</div>
                <div className="text-right">ACTIONS</div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-50">
                {filteredActions.map((action) => {
                  const itPts = 10 + Math.round((12 * (action.defaultCo2 || 0)) + (4 * (action.defaultWaste || 0)) + (0.04 * (action.defaultWater || 0)));
                  return (
                    <div 
                      key={action.id} 
                      onClick={() => handleOpenEdit(action)}
                      className="grid grid-cols-[70px_1fr_130px_120px_100px_90px] gap-3 px-6 py-3 items-center hover:bg-slate-50/90 transition-all cursor-pointer group"
                    >
                      <div className="font-black text-slate-900 text-xs tracking-wider">{action.code}</div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{action.referenceName}</div>
                        {viewUniverse === 'evoe' && (
                          <div className="text-[10px] text-cyan-600 font-medium truncate">
                            🚀 Mission : {action.referenceName}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium truncate">{action.category}</div>
                      <div>
                        {viewUniverse === 'evoe' ? (
                          <span className="text-xs font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                            ⚡ {itPts} IT
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-bold">
                            {action.defaultCo2 ?? 0}kg / {action.defaultWater ?? 0}L
                          </span>
                        )}
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={10} 
                            className={i < (action.weightedStars ?? 1) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                          />
                        ))}
                      </div>
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenEdit(action)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                          title="Modifier"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Supprimer définitivement l'action ${action.code} ?`)) {
                              handleDeleteAction(action.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div key={`gallery-${groupBy}-${viewUniverse}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
            {groupedActions.map(([groupName, groupActions]) => (
              <GalleryGroup 
                key={groupName} 
                title={groupName} 
                actions={groupActions} 
                forceOpen={isAllExpanded}
                viewUniverse={viewUniverse}
                onEditAction={handleOpenEdit}
                onDeleteAction={handleDeleteAction}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal d'édition globale */}
      <ActionRefEditModal
        action={editingAction}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAction(null);
        }}
        onSave={handleSaveAction}
        onDelete={handleDeleteAction}
      />

      {/* Modal d'import CSV */}
      <ReferenceCsvModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onImport={fetchActions} 
      />
    </div>
  );
};
