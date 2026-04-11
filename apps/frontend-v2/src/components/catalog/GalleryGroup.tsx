'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ActionGalleryCard } from './ActionGalleryCard';

interface ActionRef {
  id: number;
  code: string;
  referenceName: string;
  category: string;
  impactLabel: string;
  weightedStars: number;
  image?: string;
}

interface GalleryGroupProps {
  title: string;
  actions: ActionRef[];
  forceOpen?: boolean;
}

export const GalleryGroup: React.FC<GalleryGroupProps> = ({ title, actions, forceOpen }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  // Sync with global control
  React.useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);
  
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 mb-6 transition-all">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-4 cursor-pointer group hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown size={18} className="text-sky-500" /> : <ChevronRight size={18} className="text-slate-400" />}
            <h2 className="text-sm font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-[0.2em] whitespace-nowrap">
            {title}
            </h2>
        </div>
        <div className="h-px bg-slate-100 flex-1" />
        <span className="text-[11px] font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 shadow-sm min-w-[32px] text-center">
          {actions.length}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               transition={{ duration: 0.3, ease: 'easeInOut' }}
               className="overflow-hidden"
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 px-4 pt-4 pb-6">
                    {actions.map((action) => (
                        <motion.div
                        key={action.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        layout
                        >
                        <ActionGalleryCard action={action} />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
