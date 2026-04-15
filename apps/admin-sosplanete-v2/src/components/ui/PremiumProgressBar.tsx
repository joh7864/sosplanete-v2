'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PremiumProgressBarProps {
  progress: number;
  status: string;
}

export const PremiumProgressBar: React.FC<PremiumProgressBarProps> = ({ progress, status }) => {
  return (
    <div className="w-full flex flex-col gap-4 py-8">
      <div className="flex justify-between items-end mb-1">
        <motion.span 
          key={status}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1"
        >
          {status}
        </motion.span>
        <span className="text-xl font-black text-emerald-500 tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200/50 shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/20"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        />
      </div>

      <div className="flex justify-center mt-2">
        <div className="flex gap-1">
           {[...Array(3)].map((_, i) => (
             <motion.div
               key={i}
               animate={{ 
                 scale: [1, 1.5, 1],
                 opacity: [0.3, 1, 0.3]
               }}
               transition={{ 
                 duration: 1, 
                 repeat: Infinity, 
                 delay: i * 0.2 
               }}
               className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"
             />
           ))}
        </div>
      </div>
    </div>
  );
};
