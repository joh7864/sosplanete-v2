'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Star, Loader2, Info, LayoutGrid, List, Filter, ChevronDown, ChevronRight, Edit3, Trash2, Upload, Database, Download } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GalleryGroup } from '@/components/catalog/GalleryGroup';
import { TopBar } from '@/components/layout/TopBar';
import { ReferenceCsvModal } from '@/components/catalog/ReferenceCsvModal';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

interface ActionRef {
  id: number;
  code: string;
  referenceName: string;
  category: string;
  impactLabel: string;
  weightedStars: number;
  defaultCo2?: number;
  defaultWater?: number;
  defaultWaste?: number;
}

type ViewMode = 'list' | 'gallery';
type GroupBy = 'stars' | 'category' | 'impact';

export default function ReferencePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [groupBy, setGroupBy] = useState<GroupBy>('stars');
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actions, setActions] = useState<ActionRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleToggleAll = () => setIsAllExpanded(!isAllExpanded);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const token = getAuthData('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref/search${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setActions(await response.json());
    } catch (error) {
      console.error("Erreur chargement référentiel:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchActions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const groupedActions = useMemo(() => {
    const groups: { [key: string]: ActionRef[] } = {};
    actions.forEach(action => {
      let key = groupBy === 'stars' ? `${action.weightedStars} Étoiles` : (groupBy === 'category' ? (action.category || 'Sans catégorie') : (action.impactLabel || 'Impact non défini'));
      if (!groups[key]) groups[key] = [];
      groups[key].push(action);
    });
    
    return Object.entries(groups).sort((a, b) => {
      if (groupBy === 'stars') {
        // Sort stars descending (5 to 0)
        const starsA = parseInt(a[0]) || 0;
        const starsB = parseInt(b[0]) || 0;
        return starsB - starsA;
      }
      if (groupBy === 'impact') {
        // Sort impact: High > Moderate > Low > Behaviour
        const order = { 'high': 0, 'fort': 0, 'moderate': 1, 'moyen': 1, 'low': 2, 'faible': 2, 'behaviour': 3, 'comportement': 3 };
        const getOrder = (key: string) => {
           const k = key.toLowerCase();
           for (const [pattern, val] of Object.entries(order)) {
              if (k.includes(pattern)) return val;
           }
           return 99;
        };
        return getOrder(a[0]) - getOrder(b[0]);
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

  return (
    <>
      <TopBar 
        title="Gestion du Référentiel"
        actions={
          <Button 
            variant="primary" 
            className="h-9 px-5 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 text-white font-black uppercase tracking-widest text-[10px]"
          >
            <Plus size={16} /> Nouvelle Action
          </Button>
        }
      />
      <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 lg:px-8">

      <GlassCard className="p-4 px-6 flex flex-col md:flex-row gap-6 items-center justify-between !rounded-2xl border-white/40 shadow-xl bg-white/80">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500" size={18} />
            <input 
              type="text"
              placeholder="Rechercher par code, nom ou catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder:text-slate-300"
            />
            {loading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />}
          </div>

          <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />

          {/* Grouping Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl border border-slate-100">
            <button
              onClick={() => setGroupBy('category')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'category' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Catégories
            </button>
            <button
              onClick={() => setGroupBy('stars')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'stars' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Étoiles
            </button>
            <button
              onClick={() => setGroupBy('impact')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'impact' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Impact
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-100/50 rounded-xl border border-slate-100">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('gallery')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'gallery' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-slate-100 mx-1" />

          {/* Bouton Import Référentiel */}
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group"
            title="Importer le référentiel CSV"
          >
            <Upload size={18} className="group-hover:scale-110 transition-transform" />
          </button>
          
          <button 
            onClick={handleToggleAll}
            className="p-3 rounded-xl bg-white border border-slate-100 text-slate-500 hover:text-emerald-600 transition-all shadow-sm group"
          >
            {isAllExpanded ? <ChevronDown size={20} className="group-hover:scale-110 transition-transform" /> : <ChevronRight size={20} className="group-hover:scale-110 transition-transform" />}
          </button>
        </div>
      </GlassCard>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div 
            key="list" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <GlassCard padding="none" className="overflow-hidden bg-white/70 shadow-xl rounded-2xl">
                <div className="grid grid-cols-[80px_1fr_150px_120px_100px] gap-4 px-8 py-3 bg-slate-50/50 text-[10px] uppercase font-bold tracking-widest text-slate-400 border-b border-slate-100">
                  <div>CODE</div>
                  <div>TITRE ACTION</div>
                  <div>CATÉGORIE</div>
                  <div>IMPACT</div>
                  <div className="text-right">ACTIONS</div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {actions.map((action) => (
                    <div key={action.id} className="grid grid-cols-[80px_1fr_150px_120px_100px] gap-4 px-8 py-3 items-center border-b border-slate-50 hover:bg-white/80 transition-all group">
                      <div className="font-bold text-[var(--accent-primary)] text-sm">{action.code}</div>
                      <div className="font-semibold text-slate-700 text-sm">{action.referenceName}</div>
                      <div className="text-xs text-slate-400 italic">{action.category}</div>
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getImpactStyles(action.impactLabel)}`}>
                          {action.impactLabel || 'N/A'}
                        </span>
                      </div>
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
          <motion.div 
            key={`gallery-${groupBy}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col"
          >
            {groupedActions.map(([groupName, groupActions]) => (
              <GalleryGroup key={groupName} title={groupName} actions={groupActions} forceOpen={isAllExpanded} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      <ReferenceCsvModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onImport={fetchActions} 
      />
    </>
  );
}
