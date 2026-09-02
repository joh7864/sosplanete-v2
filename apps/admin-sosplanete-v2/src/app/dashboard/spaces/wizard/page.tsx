'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Trash2,
  Check, 
  Sparkles, 
  Clock, 
  Loader2, 
  X,
  Building2,
  AlertCircle
} from 'lucide-react';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { Step1Mode } from '@/components/wizard/steps/Step1Mode';
import { Step2Identity } from '@/components/wizard/steps/Step2Identity';
import { Step3CalendarPeriods } from '@/components/wizard/steps/Step3CalendarPeriods';
import { Step4OrganizationStudents } from '@/components/wizard/steps/Step4OrganizationStudents';
import { Step5ActionsCatalog } from '@/components/wizard/steps/Step5ActionsCatalog';
import { Step6Gamification } from '@/components/wizard/steps/Step6Gamification';
import { Step7Communication } from '@/components/wizard/steps/Step7Communication';
import { Step8ReviewLaunch } from '@/components/wizard/steps/Step8ReviewLaunch';
import { WizardDraftState, INITIAL_WIZARD_STATE } from '@/types/wizard';
import { getAuthData, setAuthData } from '@/utils/storage';

const DRAFT_KEY = 'sosplanete_space_wizard_draft';

export default function SpaceWizardPage() {
  const router = useRouter();
  const [state, setState] = useState<WizardDraftState>(INITIAL_WIZARD_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Enregistré');
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState(false);
  const autoSaveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed: WizardDraftState = JSON.parse(stored);
        if (parsed && parsed.identity) {
          setState(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not parse stored draft:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Auto-save debounce whenever state changes
  useEffect(() => {
    if (!isLoaded) return;

    setAutoSaveStatus('Sauvegarde en cours...');
    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);

    autoSaveDebounceRef.current = setTimeout(() => {
      try {
        const updatedWithMeta: WizardDraftState = {
          ...state,
          meta: {
            ...state.meta,
            lastSavedAt: new Date().toISOString(),
            instanceNamePreview: state.identity.schoolName || 'Nouvel Espace',
          },
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(updatedWithMeta));
        setAutoSaveStatus('Brouillon auto-enregistré');
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    }, 600);

    return () => {
      if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    };
  }, [state, isLoaded]);

  // Step navigation
  const handleNextStep = () => {
    setState((prev) => {
      const current = prev.currentStep;
      const next = Math.min(current + 1, 8);
      const completed = Array.from(new Set([...prev.completedSteps, current]));
      return {
        ...prev,
        currentStep: next,
        completedSteps: completed,
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (stepId: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: stepId,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAndExit = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    } catch (e) {}
    router.push('/dashboard');
  };

  const handleCancelAndDiscard = () => {
    setConfirmCancelModal(true);
  };

  // Finalize Submission Handler
  const handleFinalize = async (openImmediately: boolean) => {
    setIsSubmitting(true);
    const token = getAuthData('access_token');

    try {
      if (state.mode === 'duplicate' && state.duplication.sourceInstanceId) {
        // --- DUPLICATION BRANCH ---
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/instances/${state.duplication.sourceInstanceId}/duplicate-year`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              fromSchoolYear: state.duplication.fromSchoolYear,
              toSchoolYear: state.duplication.toSchoolYear,
              cloneChildren: state.duplication.cloneChildren,
            }),
          },
        );

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setErrorModal({
            title: 'Échec de la duplication',
            message: err.message || 'Une erreur est survenue lors du clonage de l\'espace.',
          });
          setIsSubmitting(false);
          return;
        }

        const data = await resp.json();
        const instanceId = state.duplication.sourceInstanceId;

        // If openImmediately is true, update isOpen
        if (openImmediately) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${instanceId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              isOpen: true,
              schoolYear: state.duplication.toSchoolYear,
            }),
          });
        }

        // Clean draft and redirect
        localStorage.removeItem(DRAFT_KEY);
        setAuthData('active_instance_id', instanceId.toString());
        setAuthData('active_school_year', state.duplication.toSchoolYear);
        window.dispatchEvent(new CustomEvent('schoolYearChange', { detail: state.duplication.toSchoolYear }));

        router.push(`/dashboard/organization?instanceId=${instanceId}`);
      } else {
        // --- EX NIHILO BRANCH ---
        const createPayload = {
          schoolName: state.identity.selectedAnchorId ? undefined : state.identity.schoolName,
          instanceId: state.identity.selectedAnchorId || undefined,
          hostUrl: state.identity.hostUrl?.trim() || undefined,
          icon: state.identity.icon || undefined,
          adminId: state.identity.adminId || undefined,
          currentSchoolYear: state.identity.schoolYear,
          schoolYear: state.identity.schoolYear,
          gameStartDate: state.calendar.gameStartDate,
          gameEndDate: state.calendar.gameEndDate,
          gamePeriodsCount: state.calendar.gamePeriodsCount,
          periodStartDay: state.calendar.periodStartDay ?? 3,
          isOpen: openImmediately,
        };

        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(createPayload),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setErrorModal({
            title: 'Échec de la création',
            message: err.message || 'Une erreur est survenue lors de la création de l\'espace.',
          });
          setIsSubmitting(false);
          return;
        }

        const data = await resp.json();
        const newInstanceId = data.id || data.instanceId;

        // Clean draft and set active
        localStorage.removeItem(DRAFT_KEY);
        if (newInstanceId) {
          setAuthData('active_instance_id', newInstanceId.toString());
          setAuthData('active_school_year', state.identity.schoolYear);
          window.dispatchEvent(new CustomEvent('schoolYearChange', { detail: state.identity.schoolYear }));
          router.push(`/dashboard/organization?instanceId=${newInstanceId}`);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (e) {
      console.error('Finalize error:', e);
      setErrorModal({
        title: 'Erreur Réseau',
        message: 'Une erreur réseau est survenue. Veuillez vérifier votre connexion au serveur.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-blue-50/30 text-slate-900 flex flex-col justify-between">
      {/* Top Focus Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 leading-tight">
                Assistant SOS Planète
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Configuration d'Espace
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
              {state.identity.schoolName || 'Nouvel Établissement'} • {state.identity.schoolYear}
            </p>
          </div>
        </div>

        {/* Status & Exit Controls */}
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-semibold px-3 py-1 rounded-full bg-slate-100">
            <Clock size={13} className="text-slate-400" />
            {autoSaveStatus}
          </span>

          {/* Bouton Annuler / Abandonner (Icône seule avec Tooltip) */}
          <button
            type="button"
            onClick={handleCancelAndDiscard}
            title="Annuler et abandonner le brouillon"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-all shadow-xs"
          >
            <Trash2 size={18} />
          </button>

          {/* Bouton Sauvegarder & Quitter (Icône seule avec Tooltip) */}
          <button
            type="button"
            onClick={handleSaveAndExit}
            title="Sauvegarder et quitter"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 flex items-center justify-center transition-all shadow-xs"
          >
            <Save size={18} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {/* Stepper Roadmap */}
        <div className="mb-8">
          <WizardStepper
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Step Views with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="min-h-[500px]"
          >
            {state.currentStep === 1 && <Step1Mode state={state} onChange={setState} />}
            {state.currentStep === 2 && <Step2Identity state={state} onChange={setState} />}
            {state.currentStep === 3 && <Step3CalendarPeriods state={state} onChange={setState} />}
            {state.currentStep === 4 && <Step4OrganizationStudents state={state} onChange={setState} />}
            {state.currentStep === 5 && <Step5ActionsCatalog state={state} onChange={setState} />}
            {state.currentStep === 6 && <Step6Gamification state={state} onChange={setState} />}
            {state.currentStep === 7 && <Step7Communication state={state} onChange={setState} />}
            {state.currentStep === 8 && (
              <Step8ReviewLaunch
                state={state}
                onFinalize={handleFinalize}
                isSubmitting={isSubmitting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Sticky Control Bar */}
      <footer className="sticky bottom-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-4 md:px-8 py-4 shadow-lg flex items-center justify-between">
        <button
          type="button"
          disabled={state.currentStep === 1 || isSubmitting}
          onClick={handlePrevStep}
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} /> Précédent
        </button>

        <div className="text-xs font-bold text-slate-500">
          Étape <span className="text-slate-900 font-black">{state.currentStep}</span> sur 8
        </div>

        {state.currentStep < 8 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 hover:scale-102"
          >
            Suivant <ArrowRight size={16} />
          </button>
        ) : (
          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <Sparkles size={14} /> Prêt pour activation ci-dessus
          </div>
        )}
      </footer>

      {/* Modern Ultra-Premium Error Dialog */}
      {errorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-white/60 ring-1 ring-black/5"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 ring-4 ring-rose-50 shrink-0">
                <AlertCircle size={28} />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                Information Système
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
              {errorModal.title}
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6">
              <p className="text-xs md:text-sm font-semibold text-slate-700 leading-relaxed">
                {errorModal.message}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setErrorModal(null)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-slate-900/20 active:scale-98"
              >
                Compris
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modern Ultra-Premium Cancel Confirmation Dialog */}
      {confirmCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-white/60 ring-1 ring-black/5"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 ring-4 ring-rose-50 shrink-0">
                <Trash2 size={28} />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                Confirmation Requise
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
              Abandonner la création ?
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6">
              <p className="text-xs md:text-sm font-semibold text-slate-700 leading-relaxed">
                Voulez-vous vraiment annuler la configuration de cet espace ? Le brouillon en cours sera définitivement supprimé.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmCancelModal(false)}
                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Continuer la configuration
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem(DRAFT_KEY);
                  } catch (e) {}
                  router.push('/dashboard');
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 active:scale-98"
              >
                Oui, abandonner
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
