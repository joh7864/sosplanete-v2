'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  School, 
  Calendar, 
  Users, 
  Leaf, 
  Trophy, 
  Printer, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  FileSpreadsheet,
  Lock,
  Unlock
} from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { WizardDraftState } from '@/types/wizard';
import { getAuthData, setAuthData } from '@/utils/storage';

interface Step8ReviewLaunchProps {
  state: WizardDraftState;
  onFinalize: (openImmediately: boolean) => Promise<void>;
  isSubmitting: boolean;
}

export const Step8ReviewLaunch: React.FC<Step8ReviewLaunchProps> = ({
  state,
  onFinalize,
  isSubmitting,
}) => {
  const [createdSuccess, setCreatedSuccess] = useState(false);

  // Quality Pre-flight checks
  const checks = [
    {
      title: 'Identité & Ancre',
      valid: Boolean(state.identity.schoolName?.trim()),
      details: state.identity.schoolName || 'Nom manquant',
    },
    {
      title: 'Année & 24 Périodes',
      valid: Boolean(state.calendar.gameStartDate && state.calendar.gameEndDate),
      details: `${state.identity.schoolYear} (${state.calendar.customPeriods?.length || 24} périodes)`,
    },
    {
      title: 'Équipes & Élèves',
      valid: state.organization.teams.length > 0,
      details: `${state.organization.teams.length} équipe(s) • ${state.organization.students.length} élève(s)`,
    },
    {
      title: 'Catalogue d\'Actions',
      valid: state.catalog.selectedActionRefIds.length > 0,
      details: `${state.catalog.selectedActionRefIds.length} écogeste(s) sélectionné(s)`,
    },
    {
      title: 'Règles de Jeu',
      valid: true,
      details: `Objectif ${state.gamification.avgActionsPerChildPerPeriod} actions • Marge +${state.gamification.animalAdvanceMargin}`,
    },
  ];

  const allValid = checks.every((c) => c.valid);

  const handlePrintCredentials = () => {
    window.print();
  };

  return (
    <div>
      <StepHeader
        stepNumber={8}
        title="Bilan Qualité & Activation Finale"
        subtitle="Vérifiez le récapitulatif de votre espace avant de le valider et de générer les accès élèves."
        objective="Contrôler la conformité de l'espace et choisir le statut initial d'ouverture."
        impact="Une fois validé, l'espace sera prêt à fonctionner et les fiches élèves pourront être imprimées."
        tip="Par sécurité, nous vous recommandons d'enregistrer en mode fermé (brouillon) pour vérifier les effectifs avant d'ouvrir aux élèves."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left Column : Quality Checklist & Summary */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-md">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-6">
              <ShieldCheck size={20} className="text-emerald-600" />
              Checklist Qualité Pré-Lancement
            </h3>

            <div className="space-y-3">
              {checks.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                    c.valid ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        c.valid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {c.valid ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {c.title}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{c.details}</div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      c.valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {c.valid ? 'Conforme' : 'À compléter'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column : Actions & Launch Mode */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-2">
                Validation & Enregistrement
              </h3>
              <p className="text-xs text-slate-600 mb-6">
                Sélectionnez comment vous souhaitez activer votre espace :
              </p>

              <div className="space-y-4 mb-6">
                {/* Mode 1 : Brouillon / Fermé */}
                <button
                  type="button"
                  disabled={!allValid || isSubmitting}
                  onClick={() => onFinalize(false)}
                  className="w-full p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-500 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-slate-900 group-hover:text-emerald-800 flex items-center gap-2">
                      <Lock size={16} className="text-amber-500" />
                      Enregistrer en Brouillon (Fermé)
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                      Recommandé
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    L'espace est créé en sécurité. Les élèves ne peuvent pas encore s'y connecter tant que vous ne cliquez pas sur "Ouvrir".
                  </p>
                </button>

                {/* Mode 2 : Ouvrir immédiatement */}
                <button
                  type="button"
                  disabled={!allValid || isSubmitting}
                  onClick={() => onFinalize(true)}
                  className="w-full p-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-left shadow-lg shadow-emerald-600/20"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black flex items-center gap-2">
                      <Unlock size={16} />
                      Ouvrir l'Espace dès maintenant
                    </span>
                    <ArrowRight size={16} />
                  </div>
                  <p className="text-xs text-emerald-100">
                    Active l'espace immédiatement pour permettre aux enfants de se connecter dès aujourd'hui.
                  </p>
                </button>
              </div>
            </div>

            {/* Print button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrintCredentials}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <Printer size={16} /> Imprimer les fiches élèves & QR codes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
