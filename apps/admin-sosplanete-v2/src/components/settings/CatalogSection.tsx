'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Loader2, LayoutGrid, List, ChevronDown, ChevronRight, Edit3, Trash2, Upload } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GalleryGroup } from '@/components/catalog/GalleryGroup';
import { ReferenceCsvModal } from '@/components/catalog/ReferenceCsvModal';
import { CatalogMapping } from '@/components/catalog/CatalogMapping';
import { getAuthData } from '@/utils/storage';

// Type local pour le référentiel AS — aligné exactement avec GalleryGroup et ActionGalleryCard
interface ActionRef {
  id: number;
  code: string;
  referenceName: string;
  category: string;
  impactLabel: string;
  weightedStars: number;
  image?: string;
  defaultCo2?: number | null;
  defaultWater?: number | null;
  defaultWaste?: number | null;
}

type ViewMode = 'list' | 'gallery';
type GroupBy = 'stars' | 'category' | 'impact';

interface CatalogSectionProps {
  /** Mode AS : affiche le référentiel global avec import CSV. Mode AM : affiche le catalogue local en lecture seule. */
  role: 'AS' | 'AM';
  instanceId?: number;
  schoolYear?: string;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({ role, instanceId, schoolYear }) => {
  // Pour AS : référentiel global
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [groupBy, setGroupBy] = useState<GroupBy>('stars');
  const [isAllExpanded, setIsAllExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actions, setActions] = useState<ActionRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const token = getAuthData('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref/search${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setActions(await response.json());
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

  const groupedActions = useMemo(() => {
    const groups: { [key: string]: ActionRef[] } = {};
    actions.forEach(action => {
      const key = groupBy === 'stars'
        ? `${action.weightedStars} Étoiles`
        : groupBy === 'category'
          ? (action.category || 'Sans catégorie')
          : (action.impactLabel || 'Impact non défini');
      if (!groups[key]) groups[key] = [];
      groups[key].push(action);
    });
    return Object.entries(groups).sort((a, b) => {
      if (groupBy === 'stars') return (parseInt(b[0]) || 0) - (parseInt(a[0]) || 0);
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

  // AM : affiche le catalogue local via CatalogMapping (déjà géré, pas de mode édition)
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
          <p className="text-sm text-slate-400 mt-0.5">Consultation uniquement</p>
        </div>
        <CatalogMapping instanceId={instanceId} schoolYear={schoolYear} />
      </div>
    );
  }

  // AS : référentiel global avec import CSV
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Catalogue des actions SOS Planète</h2>
          <p className="text-sm text-slate-400 mt-0.5">{actions.length} action{actions.length > 1 ? 's' : ''} dans le référentiel</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowImportModal(true)}
          className="h-10 px-4 flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
        >
          <Upload size={18} /> Importer CSV
        </motion.button>
      </div>

      {/* Filtres */}
      <GlassCard className="p-4 px-6 flex flex-col md:flex-row gap-4 items-center justify-between !rounded-2xl border-white/40 shadow-xl bg-white/80">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" size={18} />
            <input
              type="text"
              placeholder="Rechercher par code, nom ou catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder:text-slate-300"
            />
            {loading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />}
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl border border-slate-100">
            {(['category', 'stars', 'impact'] as GroupBy[]).map(g => (
              <button key={g} onClick={() => setGroupBy(g)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === g ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                {g === 'category' ? 'Catégories' : g === 'stars' ? 'Étoiles' : 'Impact'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-100/50 rounded-xl border border-slate-100">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}><List size={20} /></button>
            <button onClick={() => setViewMode('gallery')} className={`p-2 rounded-lg transition-all ${viewMode === 'gallery' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={20} /></button>
          </div>
          <button onClick={() => setIsAllExpanded(!isAllExpanded)} className="p-3 rounded-xl bg-white border border-slate-100 text-slate-500 hover:text-emerald-600 transition-all shadow-sm">
            {isAllExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </GlassCard>

      {/* Liste ou Galerie */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard padding="none" className="overflow-hidden bg-white/70 shadow-xl rounded-2xl">
              <div className="grid grid-cols-[80px_1fr_150px_120px_100px] gap-4 px-8 py-3 bg-slate-50/50 text-[10px] uppercase font-bold tracking-widest text-slate-400 border-b border-slate-100">
                <div>CODE</div><div>TITRE</div><div>CATÉGORIE</div><div>IMPACT</div><div className="text-right">ACTIONS</div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {actions.map((action) => (
                  <div key={action.id} className="grid grid-cols-[80px_1fr_150px_120px_100px] gap-4 px-8 py-3 items-center border-b border-slate-50 hover:bg-white/80 transition-all">
                    <div className="font-bold text-emerald-600 text-sm">{action.code}</div>
                    <div className="font-semibold text-slate-700 text-sm">{action.referenceName}</div>
                    <div className="text-xs text-slate-400 italic">{action.category}</div>
                    <div><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getImpactStyles(action.impactLabel ?? '')}`}>{action.impactLabel || 'N/A'}</span></div>
                    <div className="flex justify-end gap-1">
                      <button className="p-2 rounded-lg text-slate-300 hover:text-sky-600 hover:bg-sky-50 transition-all"><Edit3 size={16} /></button>
                      <button className="p-2 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div key={`gallery-${groupBy}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
            {groupedActions.map(([groupName, groupActions]) => (
              <GalleryGroup key={groupName} title={groupName} actions={groupActions} forceOpen={isAllExpanded} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ReferenceCsvModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={fetchActions} />
    </div>
  );
};
