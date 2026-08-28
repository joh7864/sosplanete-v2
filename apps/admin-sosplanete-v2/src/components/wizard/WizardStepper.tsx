import React from 'react';
import { 
  Compass, 
  School, 
  Calendar, 
  Users, 
  Leaf, 
  Trophy, 
  MessageSquare, 
  CheckCircle2, 
  Check 
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface StepMeta {
  id: number;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

export const WIZARD_STEPS: StepMeta[] = [
  { id: 1, label: 'Mode', shortLabel: 'Mode', icon: Compass },
  { id: 2, label: 'Identité', shortLabel: 'Identité', icon: School },
  { id: 3, label: 'Calendrier & Périodes', shortLabel: 'Calendrier', icon: Calendar },
  { id: 4, label: 'Structure & Élèves', shortLabel: 'Élèves', icon: Users },
  { id: 5, label: 'Catalogue d\'Actions', shortLabel: 'Actions', icon: Leaf },
  { id: 6, label: 'Gamification & Règles', shortLabel: 'Règles', icon: Trophy },
  { id: 7, label: 'Communication', shortLabel: 'Canaux', icon: MessageSquare },
  { id: 8, label: 'Contrôle & Lancement', shortLabel: 'Bilan', icon: CheckCircle2 },
];

interface WizardStepperProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (stepId: number) => void;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  const isStepAccessible = (stepId: number) => {
    return stepId === 1 || completedSteps.includes(stepId) || stepId === currentStep || completedSteps.includes(stepId - 1);
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-sm">
      {/* Visual Header with Tri-color Status Legend */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 text-[11px] font-bold text-slate-500">
        <span className="uppercase tracking-wider text-slate-600 font-extrabold flex items-center gap-1.5">
          Avancement de la configuration
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
            Fait
          </span>
          <span className="flex items-center gap-1 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-xs" />
            En cours
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300 inline-block" />
            À faire
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between relative px-2">
        {/* Progress Line */}
        <div className="absolute top-[22px] left-6 right-6 h-1.5 bg-slate-100 -z-0 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600"
            initial={false}
            animate={{
              width: `${((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Steps Nodes */}
        {WIZARD_STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const accessible = isStepAccessible(step.id);

          // Determine status for tooltip & aria
          let statusText = 'À faire';
          if (isCurrent) statusText = 'En cours';
          else if (isCompleted) statusText = 'Fait (Cliquer pour modifier)';

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <button
                type="button"
                disabled={!accessible}
                onClick={() => accessible && onStepClick(step.id)}
                className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-300 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 ring-4 ring-blue-100 ring-offset-2 scale-115'
                    : isCompleted
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 shadow-md shadow-emerald-500/20'
                    : accessible
                    ? 'bg-white border-2 border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:scale-102'
                    : 'bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed'
                }`}
                title={`Étape ${step.id} : ${step.label} [${statusText}]`}
              >
                {isCompleted && !isCurrent ? (
                  <Check size={18} strokeWidth={3} className="text-white" />
                ) : (
                  <Icon size={20} className={isCurrent ? 'animate-pulse' : ''} />
                )}
              </button>

              <span
                className={`mt-2 text-[10px] md:text-xs tracking-tight hidden sm:block whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'text-blue-700 font-black'
                    : isCompleted
                    ? 'text-emerald-800 font-bold'
                    : 'text-slate-400 font-medium'
                }`}
              >
                {step.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
