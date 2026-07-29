import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, BookOpen, Link, ShieldCheck, Globe, Users, ExternalLink, Info, Copy, Sparkles, CheckCircle2 } from 'lucide-react';

interface WhatsAppHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppHelpDrawer: React.FC<WhatsAppHelpDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex justify-end">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Slide-over Right Panel Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  Guide Configuration & Liens WhatsApp
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
                    Aide Étape par Étape
                  </span>
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Comprendre chaque champ et récupérer vos liens d'invitation et IDs.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Intro Alert Box */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/60 text-xs text-emerald-900 leading-relaxed flex items-start gap-3">
              <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-black block text-emerald-950 mb-1">
                  Architecture en Communauté Scolaire
                </strong>
                Structurer votre établissement en Communauté WhatsApp garantit le **masquage des numéros de téléphone des élèves** sur le fil d'Annonces Global tout en maintenant l'engagement de jeu en 1 clic.
              </div>
            </div>

            {/* Section 1 : Nom de la Communauté */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                🌐 Nom de la Communauté WhatsApp
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Il s'agit du nom officiel de votre établissement (ex: <strong className="text-slate-800">"Communauté SOS Planète - Collège St-Exupéry"</strong>).
              </p>
              <div className="p-3 bg-white rounded-xl border border-slate-200/60 text-[11px] text-slate-500 font-medium italic">
                💡 Ce nom est automatiquement réutilisé en en-tête et signature de tous les bulletins hebdomadaires et alertes diffusés par le Bot EVOE.
              </div>
            </div>

            {/* Section 2 : Lien d'Invitation à la Communauté */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                🔗 Lien d'Invitation Parent à la Communauté
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Le lien unique fourni aux élèves pour rejoindre la Communauté WhatsApp en 1 clic depuis leur smartphone.
              </p>

              <div className="p-4 bg-white rounded-xl border border-slate-200/60 space-y-2 text-xs">
                <strong className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-emerald-700">
                  📱 Comment récupérer ce lien sur votre Smartphone ?
                </strong>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
                  <li>Ouvrez WhatsApp sur votre smartphone et allez sur l'onglet <strong>Communautés</strong>.</li>
                  <li>Appuyez sur le nom de votre Communauté d'établissement.</li>
                  <li>Appuyez sur <strong>Inviter des membres</strong> ou <strong>Lien d'invitation</strong>.</li>
                  <li>Sélectionnez <strong>Copier le lien</strong>.</li>
                  <li>Collez ce lien dans le champ de l'interface Admin.</li>
                </ol>
              </div>
            </div>

            {/* Section 3 : Identifiant du Fil d'Annonces Global (Group ID) */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                📢 Identifiant du Fil d'Annonces Global (Group ID)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                C'est l'identifiant technique du canal d'Annonces général (ex: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono">120363048912345678@g.us</code>).
              </p>

              <div className="p-4 bg-emerald-950 text-emerald-100 rounded-xl space-y-2 text-xs border border-emerald-800/50">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <ShieldCheck size={16} /> Confidentialité & Protection des Élèves (RGPD)
                </div>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  Dans ce canal d'annonces, WhatsApp <strong>masque automatiquement les numéros de téléphone</strong> de tous les participants entre eux. Seuls les administrateurs et le Bot EVOE écrivent.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200/60 space-y-2 text-xs">
                <strong className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-emerald-700">
                  🔍 Comment obtenir le Group ID du Canal d'Annonces ?
                </strong>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
                  <li><strong>Option A (WhatsApp Web)</strong> : Ouvrez le canal dans WhatsApp Web sur PC. L'ID apparaît dans l'URL du navigateur juste après le signe <code className="bg-slate-100 px-1 py-0.5 rounded">/g/</code>.</li>
                  <li><strong>Option B (Passerelle API)</strong> : Si vous utilisez Evolution API ou GreenAPI, scannez le QR Code dans l'Admin. L'ID du canal est détecté automatiquement.</li>
                </ul>
              </div>
            </div>

            {/* Section 4 : URL de la Passerelle API WhatsApp */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                ⚙️ URL de la Passerelle API WhatsApp (Webhook HTTP)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                C'est l'adresse du serveur de messagerie qui expédie les notifications vers WhatsApp.
              </p>
              <div className="p-4 bg-white rounded-xl border border-slate-200/60 space-y-2 text-xs">
                <strong className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-emerald-700">
                  💡 Passerelles compatibles :
                </strong>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  <li><strong>Evolution API</strong> (Gratuite & Auto-hébergée via Docker)</li>
                  <li><strong>Twilio WhatsApp Sandbox</strong> (Gratuit pour tests)</li>
                  <li><strong>GreenAPI / Whapi.cloud</strong></li>
                </ul>
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                  * Si vous laissez ce champ vide, le mode <strong>Simulateur Virtuel</strong> reste 100% opérationnel dans l'Admin sans aucun frais.
                </p>
              </div>
            </div>

            {/* Section 5 : Liens des Sous-Groupes d'Équipes */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  5
                </div>
                🚀 Sous-Groupes WhatsApp par Équipe
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chaque équipe (Air, Terre, Feu, Eau...) dispose de son sous-groupe restreint où les équipiers échangent leurs stratégies.
              </p>
              <div className="p-4 bg-white rounded-xl border border-slate-200/60 space-y-2 text-xs">
                <strong className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-emerald-700">
                  📋 Procédure pour chaque équipe :
                </strong>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-[11px]">
                  <li>Allez sur le groupe WhatsApp de l'équipe (ex: <em>Équipe Air</em>).</li>
                  <li>Appuyez sur le nom du groupe → <strong>Inviter via un lien</strong> → <strong>Copier le lien</strong>.</li>
                  <li>Collez le lien et le Group ID en face de l'équipe correspondante dans le tableau.</li>
                </ol>
              </div>
            </div>

            {/* Section 6 : Comment les élèves rejoignent la Communauté & leur Groupe */}
            <div className="p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 space-y-4">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  6
                </div>
                👥 Comment vos élèves rejoignent la Communauté & leur Groupe ?
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Le parcours d'intégration des élèves est conçu pour être rapide, fluide et sécurisé sur smartphone ou ordinateur.
              </p>

              <div className="p-4 bg-white rounded-xl border border-slate-200/60 space-y-2 text-xs">
                <strong className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-emerald-700">
                  🚀 Le parcours en 3 étapes :
                </strong>
                <ol className="list-decimal list-inside space-y-2 text-slate-700 text-[11px] leading-relaxed">
                  <li>
                    <strong>Diffusion du lien / QR Code</strong> : Partagez le lien d'invitation parent (ou projetez son QR Code généré dans l'Admin) aux élèves en classe ou via l'ENT.
                  </li>
                  <li>
                    <strong>Adhésion à la Communauté</strong> : En cliquant sur le lien ou en scannant le QR Code, l'élève valide <em>« Rejoindre la communauté »</em> sur WhatsApp.
                  </li>
                  <li>
                    <strong>Accès automatique</strong> : L'élève est instantanément ajouté au <strong>Fil d'Annonces Global 📢</strong> et peut directement rejoindre le <strong>sous-groupe de son Équipe 🚀</strong> (ex: <em>Équipe Air</em>).
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-emerald-950 text-emerald-100 rounded-xl space-y-2 text-xs border border-emerald-800/50">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <ShieldCheck size={16} /> Protection Maximale (Conformité Éducation / RGPD)
                </div>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  Dans le Fil d'Annonces de la Communauté, aucun élève ne voit le numéro de téléphone des autres membres. WhatsApp masque automatiquement tous les participants.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2.5">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Changement d'équipe en cours de jeu ?</strong>
                  <br />
                  Si un élève change d'équipe dans EVOE, l'enseignant le retire simplement de l'ancien sous-groupe d'équipe dans WhatsApp et lui fournit le lien du sous-groupe de sa nouvelle équipe.
                </div>
              </div>
            </div>
          </div>

          {/* Footer Close Action */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              J'ai compris, fermer le guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
