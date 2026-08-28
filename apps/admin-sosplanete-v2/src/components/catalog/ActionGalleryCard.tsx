'use client';

import React from 'react';
import { ActionRef } from '@/types';
import { motion } from 'framer-motion';
import { Droplets, Cloud, Trash2, Star, Zap, Settings2, Check } from 'lucide-react';
import { getAssetUrl } from '@/utils/assets';

interface ActionGalleryCardProps {
  action: ActionRef;
  viewUniverse?: 'legacy' | 'evoe';
  isEvoe?: boolean;
  actionsDoneCount?: number;
  onEdit?: () => void;
  onRemove?: () => void;
}

const CATEGORY_SF_MAP: Record<string, string> = {
  Eau: 'Ressources vitales',
  "L'eau": 'Ressources vitales',
  Alimentation: 'Ressources vitales',
  "L'alimentation": 'Ressources vitales',
  Courses: 'Ressources vitales',
  Maison: 'Ressources vitales',
  Biodiversité: 'Bio-génétique',
  'La biodiversité': 'Bio-génétique',
  Biodiversite: 'Bio-génétique',
  Animaux: 'Bio-génétique',
  Electricité: 'Énergie',
  Electricite: 'Énergie',
  Électricité: 'Énergie',
  "L'électricité": 'Énergie',
  "L'electricité": 'Énergie',
  Energie: 'Énergie',
  Énergie: 'Énergie',
  "L'énergie": 'Énergie',
  Déchets: 'Recyclage',
  'Les déchets': 'Recyclage',
  Dechets: 'Recyclage',
  Transport: 'Propulsion',
  Numérique: 'Numérique',
  Numerique: 'Numérique',
};

const getSectorSF = (category?: string | null): string => {
  if (!category) return 'Secteur Général';
  const clean = category.trim();
  const unaccented = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const [k, v] of Object.entries(CATEGORY_SF_MAP)) {
    const cleanK = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (unaccented.toLowerCase() === cleanK.toLowerCase()) {
      return v;
    }
  }
  return `Secteur ${category}`;
};

const getCategoryColor = (category: string) => {
  const cat = category?.toLowerCase();
  if (cat?.includes('eau')) return 'border-sky-400 text-sky-600 bg-sky-50/30';
  if (cat?.includes('comportement') || cat?.includes('behaviour') || cat?.includes('biodiv')) return 'border-emerald-400 text-emerald-600 bg-emerald-50/30';
  if (cat?.includes('alim')) return 'border-orange-400 text-orange-600 bg-orange-50/30';
  if (cat?.includes('elec') || cat?.includes('éner')) return 'border-amber-400 text-amber-600 bg-amber-50/30';
  if (cat?.includes('déchet')) return 'border-rose-400 text-rose-600 bg-rose-50/30';
  return 'border-slate-300 text-slate-500 bg-slate-50/30';
};

export const ActionGalleryCard: React.FC<ActionGalleryCardProps> = ({ 
  action, 
  viewUniverse = 'legacy',
  isEvoe: isEvoeProp,
  actionsDoneCount,
  onEdit,
  onRemove
}) => {
  const isEvoe = isEvoeProp !== undefined ? isEvoeProp : viewUniverse === 'evoe';
  const rawCategory = action.category || (action as any).actionRef?.category || (action as any).categoryName || '';
  const displayCategory = isEvoe ? getSectorSF(rawCategory) : (rawCategory || 'Général');
  const colorClasses = getCategoryColor(rawCategory);

  // Calcul dynamique des points IT (Pondération 60% CO2e, 20% Déchets, 20% Eau, base 10)
  const pointsIT = 10 + Math.round((12 * (action.defaultCo2 || 0)) + (4 * (action.defaultWaste || 0)) + (0.04 * (action.defaultWater || 0)));

  // Résolution dynamique de l'image (Convention automatique: code.png pour legacy, code_evoe.jpg pour evoe)
  const legacyImgSrc = action.image 
    ? (action.image.startsWith('http') || action.image.startsWith('/') ? action.image : getAssetUrl(`actions/${action.image}`))
    : (action.code ? getAssetUrl(`actions/${action.code}.png`) : getAssetUrl('logo-sosplanete.png'));

  const evoeImgSrc = action.imageEvoe
    ? (action.imageEvoe.startsWith('http') || action.imageEvoe.startsWith('/') ? action.imageEvoe : getAssetUrl(`missions/${action.imageEvoe}`))
    : (action.code ? getAssetUrl(`missions/${action.code}_evoe.jpg`) : legacyImgSrc);

  const currentImgSrc = isEvoe ? evoeImgSrc : legacyImgSrc;

  return (
    <div className="flex flex-col gap-1.5 w-full relative group">
      {/* Code Badge above the card */}
      <div className="flex items-center justify-between ml-1 mr-1">
        <span className="text-[10px] font-black text-slate-600 tracking-wider uppercase opacity-80">
          {action.code}
        </span>
        <div className="flex items-center gap-1.5">
          {actionsDoneCount !== undefined && (
            <div 
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black border transition-all ${
                actionsDoneCount > 0 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
              title={`${actionsDoneCount} réalisation(s)`}
            >
              {actionsDoneCount > 0 && <Check size={10} strokeWidth={4} />}
              <span>{actionsDoneCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Hover Buttons */}
      {(onEdit || onRemove) && (
        <div className="absolute top-8 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-7 h-7 rounded-lg bg-white/95 text-slate-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-md border border-slate-200/50"
              title="Modifier l'action"
            >
              <Settings2 size={13} />
            </button>
          )}
          {onRemove && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="w-7 h-7 rounded-lg bg-white/95 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-md border border-slate-200/50"
              title="Supprimer du catalogue"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      {/* Card Body */}
      <motion.div
        layoutId={`card-${action.id}`}
        whileHover={{ y: -5, scale: 1.02 }}
        onClick={onEdit}
        className={`relative flex flex-col h-[265px] rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
          isEvoe 
            ? 'border-cyan-500/80 bg-slate-950 text-white shadow-xl shadow-cyan-950/30' 
            : `backdrop-blur-xl shadow-lg ${colorClasses}`
        }`}
      >
        {!isEvoe && <div className="absolute inset-0 bg-white/70 pointer-events-none" />}
        
        {/* Category Header */}
        <div className="relative p-2 flex justify-between items-start z-10">
          <span className={`text-[9px] font-black uppercase tracking-tighter truncate max-w-[120px] ${isEvoe ? 'text-cyan-300' : 'text-slate-800'}`} title={displayCategory}>
            {displayCategory}
          </span>
          
          {!isEvoe ? (
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={8} 
                  className={`${i < (action.weightedStars ?? 1) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                />
              ))}
            </div>
          ) : (
            <span className="text-[9px] font-black text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
              {pointsIT} IT
            </span>
          )}
        </div>

        {/* Image Area */}
        <div className="relative flex-1 flex items-center justify-center p-2 z-10 overflow-hidden">
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            src={currentImgSrc} 
            alt={action.referenceName}
            className={`w-full h-full object-contain mb-2 ${isEvoe ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]' : ''}`}
            onError={(e: any) => { 
              e.target.onerror = null; 
              e.target.src = isEvoe ? legacyImgSrc : '/assets/logo.png'; 
            }}
          />
        </div>

        {/* Title */}
        <div className="relative px-2 pb-1 z-10">
          <h3 
            title={isEvoe ? (action.titreSF || `Mission : ${action.referenceName}`) : action.referenceName}
            className={`text-[11px] font-black leading-tight line-clamp-2 min-h-[2.5em] text-center ${isEvoe ? 'text-cyan-200' : 'text-slate-800'}`}
          >
            {isEvoe ? (action.titreSF || `Mission : ${action.referenceName}`) : action.referenceName}
          </h3>
        </div>

        {/* Footer Metrics */}
        <div className={`relative p-2 pt-1 flex flex-col gap-0.5 z-10 border-t mt-auto ${
          isEvoe ? 'bg-slate-900/90 border-cyan-900/40 text-slate-300' : 'bg-white/50 border-white/30 text-slate-500'
        }`}>
          <div className="flex items-center justify-between text-[9px] font-bold px-1">
             <div className="flex items-center gap-1"><Cloud size={10} className="text-rose-400" /> CO2e</div>
             <span className={isEvoe ? 'text-white' : 'text-slate-700'}>{action.defaultCo2 || 0} kg</span>
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold px-1">
             <div className="flex items-center gap-1"><Droplets size={10} className="text-sky-400" /> Eau</div>
             <span className={isEvoe ? 'text-white' : 'text-slate-700'}>{action.defaultWater || 0} L</span>
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold px-1">
             <div className="flex items-center gap-1"><Trash2 size={10} className="text-emerald-400" /> Déchets</div>
             <span className={isEvoe ? 'text-white' : 'text-slate-700'}>{action.defaultWaste || 0} kg</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
