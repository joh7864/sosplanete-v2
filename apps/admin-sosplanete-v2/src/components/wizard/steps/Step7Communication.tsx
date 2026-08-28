'use client';

import React from 'react';
import { MessageSquare, Video, ExternalLink, Info, CheckCircle2 } from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { WizardDraftState } from '@/types/wizard';

interface Step7CommunicationProps {
  state: WizardDraftState;
  onChange: (updater: (prev: WizardDraftState) => WizardDraftState) => void;
}

export const Step7Communication: React.FC<Step7CommunicationProps> = ({ state, onChange }) => {
  return (
    <div>
      <StepHeader
        stepNumber={7}
        title="Canaux de Communication & Stimulation (Optionnels)"
        subtitle="Renseignez les liens d'animation pour engager les parents et les équipes au fil des semaines."
        objective="Ajouter les canaux WhatsApp et la vidéo de lancement (facultatif)."
        impact="Permet de partager les classements et de diffuser la vidéo immersive dès la première connexion des élèves."
        tip="Vous pouvez ignorer cette étape et la configurer ultérieurement dans les paramètres de l'espace."
      />

      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-md max-w-3xl mb-8 space-y-6">
        {/* WhatsApp Community URL */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
            <MessageSquare size={16} className="text-emerald-600" />
            Lien d'Invitation de la Communauté WhatsApp Générale
          </label>
          <input
            type="url"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="https://chat.whatsapp.com/..."
            value={state.communication.whatsappCommunityUrl}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                communication: {
                  ...prev.communication,
                  whatsappCommunityUrl: e.target.value,
                },
              }))
            }
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Regroupe l'ensemble des encadrants et parents d'élèves pour les annonces hebdomadaires.
          </p>
        </div>

        {/* YouTube Briefing URL */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
            <Video size={16} className="text-rose-600" />
            URL de la Vidéo de Briefing YouTube
          </label>
          <input
            type="url"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="https://www.youtube.com/watch?v=..."
            value={state.communication.youtubeBriefingUrl}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                communication: {
                  ...prev.communication,
                  youtubeBriefingUrl: e.target.value,
                },
              }))
            }
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Vidéo projetée en classe ou vue par les élèves pour lancer l'aventure SOS Planète / Évoé.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Ces réglages sont purement optionnels. Vous pouvez passer directement à l'étape suivante.
          </span>
        </div>
      </div>
    </div>
  );
};
