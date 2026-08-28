'use client';

import React, { useEffect, useState } from 'react';
import { 
  Leaf, 
  Droplets, 
  Trash, 
  Zap, 
  Check, 
  Search, 
  CheckSquare, 
  Square, 
  Filter, 
  RefreshCw, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { WizardDraftState } from '@/types/wizard';
import { getAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';

interface Step5ActionsCatalogProps {
  state: WizardDraftState;
  onChange: (updater: (prev: WizardDraftState) => WizardDraftState) => void;
}

export const Step5ActionsCatalog: React.FC<Step5ActionsCatalogProps> = ({ state, onChange }) => {
  const [actionRefs, setActionRefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingSource, setSyncingSource] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const isDuplicate = state.mode === 'duplicate' && Boolean(state.duplication.sourceInstanceId);

  useEffect(() => {
    fetchActionsAndInit();
  }, [state.duplication.sourceInstanceId, state.duplication.fromSchoolYear]);

  const fetchActionsAndInit = async () => {
    setLoading(true);
    try {
      const token = getAuthData('access_token');
      // 1. Fetch Global Action References
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let loadedRefs: any[] = [];
      if (resp.ok) {
        loadedRefs = await resp.json();
        setActionRefs(loadedRefs);
      }

      // 2. If Duplicate mode, fetch local actions from source year
      if (isDuplicate && state.duplication.sourceInstanceId) {
        if (state.catalog.selectedActionRefIds.length === 0) {
          await handleReloadSourceCatalog(loadedRefs);
        }
      } else {
        // Ex Nihilo: default 25 recommended actions if none selected yet
        if (state.catalog.selectedActionRefIds.length === 0 && loadedRefs.length > 0) {
          const default25 = loadedRefs.slice(0, 25).map((a: any) => a.id);
          onChange((prev) => ({
            ...prev,
            catalog: {
              ...prev.catalog,
              selectedActionRefIds: default25,
            },
          }));
        }
      }
    } catch (e) {
      console.error('Fetch action refs error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReloadSourceCatalog = async (allRefs: any[] = actionRefs) => {
    if (!state.duplication.sourceInstanceId) return;
    setSyncingSource(true);
    try {
      const token = getAuthData('access_token');
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/local-actions?instanceId=${state.duplication.sourceInstanceId}&schoolYear=${state.duplication.fromSchoolYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.ok) {
        const localActions = await resp.json();
        const extractedRefIds = localActions
          .map((la: any) => la.actionRefId || la.actionRef?.id || la.id)
          .filter(Boolean);

        if (extractedRefIds.length > 0) {
          onChange((prev) => ({
            ...prev,
            catalog: {
              ...prev.catalog,
              selectedActionRefIds: extractedRefIds,
            },
          }));
        } else if (allRefs.length > 0) {
          // Fallback if source year had no local actions
          const default25 = allRefs.slice(0, 25).map((a: any) => a.id);
          onChange((prev) => ({
            ...prev,
            catalog: {
              ...prev.catalog,
              selectedActionRefIds: default25,
            },
          }));
        }
      }
    } catch (e) {
      console.error('Reload source catalog error:', e);
    } finally {
      setSyncingSource(false);
    }
  };

  const toggleAction = (id: number) => {
    onChange((prev) => {
      const isSelected = prev.catalog.selectedActionRefIds.includes(id);
      const updated = isSelected
        ? prev.catalog.selectedActionRefIds.filter((item) => item !== id)
        : [...prev.catalog.selectedActionRefIds, id];

      return {
        ...prev,
        catalog: {
          ...prev.catalog,
          selectedActionRefIds: updated,
        },
      };
    });
  };

  const handleSelectAllFiltered = (filteredIds: number[]) => {
    onChange((prev) => {
      const set = new Set([...prev.catalog.selectedActionRefIds, ...filteredIds]);
      return {
        ...prev,
        catalog: {
          ...prev.catalog,
          selectedActionRefIds: Array.from(set),
        },
      };
    });
  };

  const handleUnselectAllFiltered = (filteredIds: number[]) => {
    onChange((prev) => ({
      ...prev,
      catalog: {
        ...prev.catalog,
        selectedActionRefIds: prev.catalog.selectedActionRefIds.filter(
          (id) => !filteredIds.includes(id),
        ),
      },
    }));
  };

  // Categories list
  const categories = Array.from(
    new Set(actionRefs.map((a) => a.category || a.categoryRef?.name || 'Autre')),
  ).filter(Boolean);

  const filteredActions = actionRefs.filter((a) => {
    const cat = a.category || a.categoryRef?.name || 'Autre';
    const matchCat = selectedCategory === 'all' || cat === selectedCategory;
    const matchSearch =
      search.trim() === '' ||
      a.referenceName?.toLowerCase().includes(search.toLowerCase()) ||
      a.code?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredIds = filteredActions.map((a) => a.id);
  const selectedCount = state.catalog.selectedActionRefIds.length;

  return (
    <div>
      <StepHeader
        stepNumber={5}
        title="Catalogue d'Actions Écologiques Locales"
        subtitle="Sélectionnez ou reconduisez les écogestes que les élèves pourront réaliser et enregistrer pendant leurs périodes de jeu."
        objective="Choisir le bouquet d'actions écologiques (actions de l'an dernier reconduites ou ~25 recommandées)."
        impact="Chaque action rapporte des points et contribue au compteur de CO2, d'eau et de déchets évités."
        tip="En mode Duplication, votre bouquet d'actions de l'an dernier est reconduit automatiquement. Vous pouvez l'enrichir ou le modifier."
      />

      {/* Duplication Banner if in Duplicate Mode */}
      {isDuplicate && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-50/80 border-2 border-blue-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-200 text-blue-900 rounded">
                Duplication du Catalogue
              </span>
              <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                Reconduction automatique du catalogue de la saison <strong>{state.duplication.fromSchoolYear}</strong> ({selectedCount} actions pré-cochées)
              </h4>
            </div>
          </div>

          <button
            type="button"
            disabled={syncingSource}
            onClick={() => handleReloadSourceCatalog()}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-blue-700 hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
          >
            <RefreshCw size={14} className={syncingSource ? 'animate-spin text-blue-600' : ''} />
            <span>Recharger catalogue N-1</span>
          </button>
        </div>
      )}

      {/* Toolbar: Search, Filters, Count */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-md mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher une action (ex: lumière, vélo, gourde)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Check size={14} strokeWidth={3} />
              {selectedCount} action{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectAllFiltered(filteredIds)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Tout cocher
              </button>
              <button
                type="button"
                onClick={() => handleUnselectAllFiltered(filteredIds)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Tout décocher
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Toutes ({actionRefs.length})
          </button>
          {categories.map((cat) => {
            const count = actionRefs.filter(
              (a) => (a.category || a.categoryRef?.name || 'Autre') === cat,
            ).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions Grid */}
      {loading ? (
        <div className="p-12 flex items-center justify-center text-slate-400 gap-2">
          <Loader2 size={24} className="animate-spin text-emerald-600" />
          <span className="text-xs font-bold">Chargement du catalogue d'actions...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredActions.map((action) => {
            const isSelected = state.catalog.selectedActionRefIds.includes(action.id);
            const categoryName = action.category || action.categoryRef?.name || 'Général';

            // Resolve legacy and evoe small icons
            const legacyImg = action.image 
              ? (action.image.startsWith('http') || action.image.startsWith('/') ? action.image : getAssetUrl(`actions/${action.image}`))
              : (action.code ? getAssetUrl(`actions/${action.code}.png`) : getAssetUrl('logo-sosplanete.png'));

            const evoeImg = action.imageEvoe
              ? (action.imageEvoe.startsWith('http') || action.imageEvoe.startsWith('/') ? action.imageEvoe : getAssetUrl(`missions/${action.imageEvoe}`))
              : (action.code ? getAssetUrl(`missions/${action.code}_evoe.jpg`) : null);

            return (
              <div
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border-2 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/60 border-emerald-500 shadow-sm'
                    : 'bg-white/80 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {/* Mini-icône SOS Planète Legacy */}
                      <div className="relative" title="Icône SOS Planète">
                        <img
                          src={legacyImg}
                          alt="SP"
                          className="w-8 h-8 object-contain rounded-lg bg-emerald-50 p-1 border border-emerald-200 shrink-0 shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="absolute -bottom-1 -right-1 text-[8px] bg-emerald-600 text-white rounded px-1 font-black leading-tight">
                          SP
                        </span>
                      </div>

                      {/* Mini-icône Évoé Science-Fiction */}
                      <div className="relative" title="Icône Évoé">
                        <img
                          src={evoeImg || legacyImg}
                          alt="EV"
                          className="w-8 h-8 object-cover rounded-lg bg-slate-900 p-0.5 border border-slate-700 shrink-0 shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="absolute -bottom-1 -right-1 text-[8px] bg-indigo-600 text-white rounded px-1 font-black leading-tight">
                          ÉV
                        </span>
                      </div>

                      <div className="flex flex-col ml-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {action.code || `#${action.id}`}
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-600">
                          {categoryName}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-300 border border-slate-200'
                      }`}
                    >
                      {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 mb-1 leading-snug">
                    {action.referenceName}
                  </h4>
                  {action.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {action.description}
                    </p>
                  )}
                </div>

                {/* Eco-Impact Badges */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Leaf size={12} /> {action.defaultCo2 ?? 0}g CO2
                  </span>
                  <span className="flex items-center gap-1 text-blue-700">
                    <Droplets size={12} /> {action.defaultWater ?? 0}L Eau
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <Trash size={12} /> {action.defaultWaste ?? 0}g Déc.
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
