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
  Layers
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GalleryGroup } from '@/components/catalog/GalleryGroup';
import { ReferenceCsvModal } from '@/components/catalog/ReferenceCsvModal';
import { CatalogMapping } from '@/components/catalog/CatalogMapping';
import { ActionRefEditModal } from '@/components/catalog/ActionRefEditModal';
import { ActionRef } from '@/types';
import { getAuthData } from '@/utils/storage';

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
    const it = Math.round((action.defaultCo2 || 0) + (action.defaultWater || 0) + (action.defaultWaste || 0)) || 10;
    if (it <= 5) return '⚡ 1 à 5 IT (Impact Modéré)';
    if (it <= 15) return '⚡ 6 à 15 IT (Impact Significatif)';
    if (it <= 35) return '⚡ 16 à 35 IT (Impact Majeur)';
    return '⚡ 36+ IT (Impact Critique / Boss)';
  };

  const groupedActions = useMemo(() => {
    const groups: { [key: string]: ActionRef[] } = {};
    actions.forEach(action => {
      let key = '';
      if (groupBy === 'stars') {
        key = `${action.weightedStars ?? 1} Étoiles`;
      } else if (groupBy === 'category') {
        key = action.category || 'Sans catégorie';
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
  }, [actions, groupBy]);

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
              {actions.length} action{actions.length > 1 ? 's' : ''}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Édition des visuels, indicateurs d'impacts réels et équivalences de missions SF
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Commutateur d'Univers */}
          <div className="flex p-1 bg-slate-200/80 rounded-2xl border border-slate-300/60 shadow-inner">
            <button
              onClick={() => {
                setViewUniverse('legacy');
                if (groupBy === 'it') setGroupBy('category');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewUniverse === 'legacy'
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Leaf size={14} className={viewUniverse === 'legacy' ? 'text-emerald-500' : ''} />
              <span>🌿 SOS Planète</span>
            </button>
            <button
              onClick={() => setViewUniverse('evoe')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewUniverse === 'evoe'
                  ? 'bg-slate-900 text-cyan-400 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap size={14} className={viewUniverse === 'evoe' ? 'text-cyan-400' : ''} />
              <span>🚀 Évoé SF</span>
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowImportModal(true)}
            className="h-10 px-4 flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
          >
            <Upload size={16} /> <span>Importer CSV</span>
          </motion.button>
        </div>
      </div>

      {/* Barre d'outils / Filtres */}
      <GlassCard className="p-4 px-6 flex flex-col md:flex-row gap-4 items-center justify-between !rounded-2xl border-white/40 shadow-xl bg-white/80">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Recherche */}
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" size={18} />
            <input
              type="text"
              placeholder="Rechercher par code, nom ou catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-slate-100 rounded-2xl text-xs focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder:text-slate-300"
            />
            {loading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />}
          </div>

          {/* GroupBy Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/70 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setGroupBy('category')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                groupBy === 'category' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Catégories
            </button>
            <button
              onClick={() => setGroupBy('stars')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                groupBy === 'stars' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Étoiles
            </button>
            <button
              onClick={() => setGroupBy('impact')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                groupBy === 'impact' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Impact
            </button>
            {viewUniverse === 'evoe' && (
              <button
                onClick={() => setGroupBy('it')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                  groupBy === 'it' ? 'bg-slate-900 text-cyan-400 shadow-sm' : 'text-cyan-700 hover:text-cyan-900'
                }`}
              >
                <Zap size={11} /> Niveau d'IT
              </button>
            )}
          </div>
        </div>

        {/* View Mode & Fold/Unfold */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-100/70 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vue Liste"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'gallery' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vue Galerie de Cartes"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <button
            onClick={() => setIsAllExpanded(!isAllExpanded)}
            className="p-2.5 rounded-xl bg-white border border-slate-200/60 text-slate-500 hover:text-emerald-700 transition-all shadow-sm flex items-center gap-1 text-xs font-bold"
            title={isAllExpanded ? 'Tout replier' : 'Tout déplier'}
          >
            {isAllExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span className="hidden sm:inline">{isAllExpanded ? 'Replier' : 'Déplier'}</span>
          </button>
        </div>
      </GlassCard>

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
                {actions.map((action) => {
                  const itPts = Math.round((action.defaultCo2 || 0) + (action.defaultWater || 0) + (action.defaultWaste || 0)) || 10;
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
