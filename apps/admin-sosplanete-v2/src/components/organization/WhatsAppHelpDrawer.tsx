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
                  Architecture Simplifiée : Groupe WhatsApp Unique
                </strong>
                Tous les membres de l'établissement rejoignent un **groupe WhatsApp général unique**. Les discussions d'équipes et défis se déroulent dans le chat intégré **Com-Link** de l'application EVOE.
              </div>
            </div>

            {/* Section 1 : Nom du Groupe */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                🌐 Nom du Groupe WhatsApp EVOE
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Il s'agit du nom officiel de votre groupe (ex: <strong className="text-slate-800">"Groupe EVOE - Collège St-Exupéry"</strong>).
              </p>
              <div className="p-3 bg-white rounded-xl border border-slate-200/60 text-[11px] text-slate-500 font-medium italic">
                💡 Ce nom est automatiquement réutilisé en en-tête et signature de tous les bulletins hebdomadaires et alertes diffusés par le Bot EVOE.
              </div>
            </div>

            {/* Section 2 : Lien d'Invitation */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                🔗 Lien d'Invitation au Groupe WhatsApp
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Le lien d'invitation unique fourni aux élèves pour rejoindre le groupe WhatsApp EVOE en 1 clic.
              </p>

              <div className="p-4 bg-white rounded-xl border border-slate-200/60 space-y-2 text-xs">
                <strong className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-emerald-700">
                  📱 Comment récupérer ce lien sur votre Smartphone ?
                </strong>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
                  <li>Ouvrez WhatsApp sur votre smartphone et allez sur la fiche de votre groupe EVOE.</li>
                  <li>Appuyez sur le nom du groupe en haut pour ouvrir les infos.</li>
                  <li>Appuyez sur <strong>Lien d'invitation au groupe</strong>.</li>
                  <li>Sélectionnez <strong>Copier le lien</strong>.</li>
                  <li>Collez ce lien dans le champ de l'interface Admin.</li>
                </ol>
              </div>
            </div>

            {/* Section 3 : Identifiant du Groupe (Group ID) */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                📢 Identifiant du Groupe WhatsApp (Group ID)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                C'est l'identifiant technique du groupe WhatsApp (ex: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono">120363048912345678@g.us</code>).
              </p>

              <div className="p-4 bg-white rounded-xl border border-slate-200/60 space-y-2 text-xs">
                <strong className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-emerald-700">
                  🔍 Comment obtenir le Group ID via Evolution API ?
                </strong>
                <ol className="list-decimal list-inside space-y-2 text-slate-700 text-[11px] leading-relaxed">
                  <li>Depuis Postman ou l'interface Swagger de votre Evolution API, faites une requête <strong>GET</strong> sur la route : <code className="bg-slate-100 px-1 py-0.5 rounded">/group/fetchAllGroups/NOM_DE_TON_INSTANCE</code></li>
                  <li><em>N'oubliez pas d'inclure votre <strong>apikey</strong> dans les Headers de la requête.</em></li>
                  <li>L'API va renvoyer un JSON contenant tous vos groupes. Recherchez le nom de votre groupe (ex: "Evoe") dans ce texte.</li>
                  <li>Juste à côté du nom, vous trouverez son champ <code className="font-bold">id</code>. Copiez cette valeur (ex: <code className="bg-slate-100 px-1 py-0.5 rounded">120363048912345678@g.us</code>) et collez-la ici.</li>
                </ol>
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
                C'est l'adresse du serveur de messagerie qui expédie les notifications vers WhatsApp (ex: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono">http://evolution-api:8080/message/sendText/evoe</code>).
              </p>
            </div>
            {/* Section 5 : Comment les élèves rejoignent le Groupe WhatsApp */}
            <div className="p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 space-y-4">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  5
                </div>
                👥 Comment vos élèves rejoignent le Groupe WhatsApp EVOE ?
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Le parcours d'intégration des élèves est conçu pour être rapide et fluide.
              </p>

              <div className="p-4 bg-white rounded-xl border border-slate-200/60 space-y-2 text-xs">
                <strong className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-emerald-700">
                  🚀 Le parcours en 2 étapes :
                </strong>
                <ol className="list-decimal list-inside space-y-2 text-slate-700 text-[11px] leading-relaxed">
                  <li>
                    <strong>Diffusion du lien / QR Code</strong> : Partagez le lien d'invitation au groupe (ou projetez son QR Code généré dans l'Admin) aux élèves en classe ou via l'ENT.
                  </li>
                  <li>
                    <strong>Adhésion au Groupe</strong> : En cliquant sur le lien ou en scannant le QR Code, l'élève valide <em>« Rejoindre le groupe »</em> sur WhatsApp.
                  </li>
                </ol>
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
