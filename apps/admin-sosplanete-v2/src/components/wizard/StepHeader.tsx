import React from 'react';
import { Sparkles, HelpCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepHeaderProps {
  stepNumber: number;
  totalSteps?: number;
  title: string;
  subtitle: string;
  badge?: string;
  objective: string;
  impact: string;
  tip?: string;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  stepNumber,
  totalSteps = 8,
  title,
  subtitle,
  badge,
  objective,
  impact,
  tip,
}) => {
  return (
    <div className="mb-8">
      {/* Top badges */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-sm flex items-center gap-1.5">
          <Sparkles size={13} className="text-emerald-600" />
          Étape {stepNumber} / {totalSteps}
        </span>
        {badge && (
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-amber-500/10 text-amber-700 border border-amber-500/20">
            {badge}
          </span>
        )}
      </div>

      {/* Main Title & Subtitle */}
      <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
        {title}
      </h1>
      <p className="text-slate-600 text-base md:text-lg max-w-3xl leading-relaxed">
        {subtitle}
      </p>

      {/* Pedagogical Briefing Box */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              Ce qui est attendu
            </h4>
            <p className="text-sm text-slate-700 font-medium leading-snug">
              {objective}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              Impact dans le jeu
            </h4>
            <p className="text-sm text-slate-700 font-medium leading-snug">
              {impact}
            </p>
          </div>
        </div>

        {tip && (
          <div className="md:col-span-2 flex items-start gap-3 pt-3 border-t border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb size={16} />
            </div>
            <p className="text-xs text-amber-900 font-medium leading-snug">
              <strong className="font-bold text-amber-950">Conseil : </strong>
              {tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
