'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Star, Loader2, Info, LayoutGrid, List, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GalleryGroup } from '@/components/catalog/GalleryGroup';
import { TopBar } from '@/components/layout/TopBar';
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

export default function CatalogPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [groupBy, setGroupBy] = useState<GroupBy>('stars');
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actions, setActions] = useState<ActionRef[]>([]);
  const [loading, setLoading] = useState(false);

  // Toggle all logic
  const handleToggleAll = () => {
    const newState = !isAllExpanded;
    setIsAllExpanded(newState);
  };

  useEffect(() => {
    const fetchActions = async () => {
      setLoading(true);
      try {
        const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
        const token = getAuthData('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref/search${query}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setActions(data);
        }
      } catch (error) {
        console.error("Erreur chargement catalogue:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchActions();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const groupedActions = useMemo(() => {
    const groups: { [key: string]: ActionRef[] } = {};
    
    actions.forEach(action => {
      let key = 'Inconnu';
      if (groupBy === 'stars') {
        key = `${action.weightedStars} Étoiles`;
      } else if (groupBy === 'category') {
        key = action.category || 'Sans catégorie';
      } else if (groupBy === 'impact') {
        key = action.impactLabel || 'Impact non défini';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(action);
    });

    // Custom Impact Order
    const impactOrder = ['high', 'fort', 'moderate', 'modéré', 'low', 'faible', 'behaviour', 'comportement'];

    return Object.entries(groups).sort((a, b) => {
      if (groupBy === 'stars') return b[0].localeCompare(a[0]); // Stars Desc
      
      if (groupBy === 'impact') {
        const indexA = impactOrder.indexOf(a[0].toLowerCase());
        const indexB = impactOrder.indexOf(b[0].toLowerCase());
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
      }

      return a[0].localeCompare(b[0]); // Alpha Asc
    });
  }, [actions, groupBy]);

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={14} 
            className={`${i < count ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
          />
        ))}
      </div>
    );
  };

  const getImpactStyles = (label: string) => {
    switch (label?.toLowerCase()) {
      case 'high':
      case 'fort':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium':
      case 'moyen':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <>
      <TopBar 
        title="Catalogue des actions SOS Planète"
        selector={
          <span className="bg-sky-100 text-sky-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-sky-200 mt-1 ml-3">
            {actions.length} ACTIONS
          </span>
        }
        actions={
          <>
            <div className="flex bg-slate-100 p-1 rounded-[10px] border border-slate-200">
                <button 
                   onClick={() => setViewMode('list')}
                   className={`p-1.5 flex items-center justify-center rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                   title="Vue Liste"
                >
                    <List size={16} />
                </button>
                <button 
                   onClick={() => setViewMode('gallery')}
                   className={`p-1.5 flex items-center justify-center rounded-md transition-all ${viewMode === 'gallery' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                   title="Vue Galerie"
                >
                    <LayoutGrid size={16} />
                </button>
            </div>
          </>
        }
      />

      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-xl">
             <Input 
                placeholder="Filtrer par ID, nom ou catégorie..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={loading ? <Loader2 size={18} className="animate-spin text-sky-500" /> : <Search size={18} className="text-slate-400" />}
                className="bg-white/70 border-white/40 shadow-sm focus:shadow-md transition-all h-12 rounded-2xl"
             />
          </div>

          <AnimatePresence>
            {viewMode === 'gallery' && (
                <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   className="flex items-center gap-4"
                >
                    <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-white/40 shadow-sm">
                        <Filter size={14} className="ml-2 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Grouper par</span>
                        {['stars', 'category', 'impact'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setGroupBy(type as GroupBy)}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === type ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:bg-white'}`}
                            >
                                {type === 'stars' ? 'Étoiles' : type === 'category' ? 'Catégorie' : 'Impact'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={handleToggleAll}
                            title={isAllExpanded ? "Tout plier" : "Tout déplier"}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-sky-600 transition-all text-[10px] font-bold uppercase tracking-wider"
                        >
                            {isAllExpanded ? (
                                <><ChevronRight size={14} /> Tout plier</>
                            ) : (
                                <><ChevronDown size={14} /> Tout déplier</>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <GlassCard padding="none" className="overflow-hidden bg-white/70 border-white/40 shadow-xl backdrop-blur-2xl rounded-2xl">
                {/* Action Table Header */}
                <div className="grid grid-cols-[80px_1fr_150px_120px_140px_60px] gap-4 px-8 py-3 bg-slate-50/50 text-[10px] uppercase font-bold tracking-widest text-slate-400 border-b border-slate-100">
                  <div>ID</div>
                  <div>Titre Action</div>
                  <div>Catégorie</div>
                  <div>Impact</div>
                  <div>Étoiles</div>
                  <div className="text-right pr-2">Actions</div>
                </div>

                {/* Action List */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {actions.map((action) => (
                    <motion.div 
                      key={action.id}
                      className="grid grid-cols-[80px_1fr_150px_120px_140px_60px] gap-4 px-8 py-2 items-center border-b border-slate-50 hover:bg-[var(--color-cream)]/50 transition-all group"
                    >
                      <div className="font-bold text-[var(--accent-primary)] text-sm tracking-tight">{action.code}</div>
                      <div className="font-semibold text-slate-700 text-sm line-clamp-1 group-hover:text-slate-900 transition-colors">
                        {action.referenceName}
                      </div>
                      <div className="text-xs font-medium text-slate-400 italic">
                        {action.category || 'Non classé'}
                      </div>
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getImpactStyles(action.impactLabel)}`}>
                          {action.impactLabel || 'N/A'}
                        </span>
                      </div>
                      <div>{renderStars(action.weightedStars)}</div>
                      <div className="flex justify-end pr-1">
                        <button className="p-2 rounded-xl text-slate-300 hover:text-[var(--accent-primary)] hover:bg-white transition-all">
                          <Plus size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {actions.length === 0 && !loading && (
                    <div className="py-20 text-center flex flex-col items-center gap-3 text-slate-300">
                      <Search size={40} className="opacity-20" />
                      <p className="italic text-sm">Aucune action trouvée dans le référentiel.</p>
                    </div>
                  )}
                </div>

                {/* Footer info */}
                <div className="p-4 bg-slate-50/30 text-center">
                    <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-2">
                      <Info size={12} /> Affichage de {actions.length} actions extraites du référentiel technique SOS Planète.
                    </p>
                </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="gallery-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pb-20"
          >
            {groupedActions.map(([groupName, groupActions]) => (
              <GalleryGroup 
                key={groupName} 
                title={groupName} 
                actions={groupActions} 
                forceOpen={isAllExpanded} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}
