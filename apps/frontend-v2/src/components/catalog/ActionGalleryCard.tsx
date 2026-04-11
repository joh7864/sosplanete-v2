'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Cloud, Trash2, Star } from 'lucide-react';
import { getAssetUrl } from '@/utils/assets';

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
  image?: string;
}

interface ActionGalleryCardProps {
  action: ActionRef;
}

const getCategoryColor = (category: string) => {
  const cat = category?.toLowerCase();
  if (cat?.includes('eau')) return 'border-sky-400 text-sky-600 bg-sky-50/30';
  if (cat?.includes('comportement') || cat?.includes('behaviour') || cat?.includes('biodiv')) return 'border-emerald-400 text-emerald-600 bg-emerald-50/30';
  if (cat?.includes('alim')) return 'border-orange-400 text-orange-600 bg-orange-50/30';
  if (cat?.includes('elec') || cat?.includes('éner')) return 'border-amber-400 text-amber-600 bg-amber-50/30';
  if (cat?.includes('déchet')) return 'border-rose-400 text-rose-600 bg-rose-50/30';
  return 'border-slate-300 text-slate-500 bg-slate-50/30';
};

export const ActionGalleryCard: React.FC<ActionGalleryCardProps> = ({ action }) => {
  const colorClasses = getCategoryColor(action.category);
  const [imgSrc, setImgSrc] = React.useState(getAssetUrl(action.image ? `actions/${action.image}` : null));
  const [fallbackTried, setFallbackTried] = React.useState(false);

  const handleImageError = () => {
    if (fallbackTried) return;
    
    // Tenter .jpg si .png échoue (cas D11/D12)
    if (imgSrc.toLowerCase().endsWith('.png')) {
       setImgSrc(imgSrc.replace(/\.png$/i, '.jpg'));
       setFallbackTried(true);
    } else if (imgSrc.toLowerCase().endsWith('.jpg')) {
       setImgSrc(imgSrc.replace(/\.jpg$/i, '.png'));
       setFallbackTried(true);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* ID Label above the card */}
      <span className="text-[10px] font-black text-slate-600 ml-1 tracking-wider uppercase opacity-80">
        {action.code}
      </span>

      <motion.div
        layoutId={`card-${action.id}`}
        whileHover={{ y: -5, scale: 1.02 }}
        className={`relative flex flex-col h-[260px] rounded-2xl border-2 backdrop-blur-xl shadow-lg transition-colors cursor-pointer overflow-hidden ${colorClasses}`}
      >
        <div className="absolute inset-0 bg-white/70 pointer-events-none" />
        
        {/* Category Badge */}
        <div className="relative p-2 flex justify-between items-start z-10 text-slate-800">
          <span className="text-[9px] font-bold uppercase tracking-tighter truncate max-w-[80px]">
            {action.category || 'Référence'}
          </span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={8} 
                className={`${i < action.weightedStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
              />
            ))}
          </div>
        </div>

        {/* Action Image Area */}
        <div className="relative flex-1 flex items-center justify-center p-2 z-10 overflow-hidden">
          {action.image ? (
            <motion.img 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              src={imgSrc} 
              alt={action.referenceName}
              className="w-full h-full object-contain mb-2"
              onError={handleImageError}
            />
          ) : (
             <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center border border-white/90 shadow-inner">
               <Cloud size={32} className="text-slate-300" />
             </div>
          )}
        </div>

        {/* Action Title */}
        <div className="relative px-2 pb-1 z-10">
          <h3 className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2 min-h-[2.5em] text-center">
            {action.referenceName}
          </h3>
        </div>

        {/* Metrics Footer (Stacked Badges) */}
        <div className="relative p-2 pt-1 flex flex-col gap-0.5 z-10 bg-white/50 border-t border-white/30 mt-auto">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1">
             <div className="flex items-center gap-1"><Cloud size={10} className="text-rose-400" /> CO2e</div>
             <span className="text-slate-700">{action.defaultCo2 || 0} kg</span>
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1">
             <div className="flex items-center gap-1"><Droplets size={10} className="text-sky-400" /> Eau</div>
             <span className="text-slate-700">{action.defaultWater || 0} L</span>
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1">
             <div className="flex items-center gap-1"><Trash2 size={10} className="text-emerald-400" /> Déchets</div>
             <span className="text-slate-700">{action.defaultWaste || 0} kg</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
