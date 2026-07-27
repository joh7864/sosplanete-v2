import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Smartphone, Sparkles, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

import { getAuthData } from '@/utils/storage';

interface WhatsAppTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityName: string;
  gatewayUrl: string;
  chatId: string;
  schoolYear: string;
}

export const WhatsAppTestModal: React.FC<WhatsAppTestModalProps> = ({
  isOpen,
  onClose,
  communityName,
  gatewayUrl,
  chatId,
  schoolYear,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'podium' | 'challenge' | 'stase' | 'report'>('podium');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const getTemplateMessage = (type: string) => {
    const name = communityName || 'Communauté SOS Planète';
    switch (type) {
      case 'podium':
        return (
          `🏆 *ALERTE CLASSEMENT 3D — ${name.toUpperCase()}*\n` +
          `─────────────────────────\n\n` +
          `🔥 *Coup de théâtre sur la ligne temporelle !*\n` +
          `Agent *@Romain* vient de ravir la 1ère place du classement global à *@William* !\n\n` +
          `⚡ Vitalité Moteur : *98.4 HP*\n` +
          `🌱 Impact cumulé : *42.5 kg CO2e évités*\n\n` +
          `🚀 _Accédez au Podium 3D et reprenez la tête !_\n` +
          `👉 https://evoe.app/launch?target=leaderboard`
        );
      case 'challenge':
        return (
          `⚔️ *DUEL INTER-ÉQUIPES — ${name.toUpperCase()}*\n` +
          `─────────────────────────\n\n` +
          `⚡ *L'Équipe Air a défié l'Équipe Terre !*\n` +
          `🎯 Défi : *"Zéro Déchet au Déjeuner"*\n` +
          `⏳ Chrono Temporel : *48 heures restantes*\n\n` +
          `Relevez le défi pour débloquer les propulseurs de votre Vaisseau !\n\n` +
          `👉 https://evoe.app/launch?target=challenge&id=42`
        );
      case 'stase':
        return (
          `⚠️ *ALERTES PARADOXE TEMPOREL — ${name.toUpperCase()}*\n` +
          `─────────────────────────\n\n` +
          `🧬 *Attention Équipage Équipe Feu !*\n` +
          `Certains descendants s'effacent en 2070 car 3 agents n'ont pas validé d'éco-missions cette semaine :\n` +
          `• @Julien\n` +
          `• @Sarah\n\n` +
          `Accélérez vos rapports de mission au Codex pour stabiliser le Moteur ! 🔌`
        );
      case 'report':
      default:
        return (
          `🔮 *BILAN HEBDOMADAIRE TEMPOREL — ${name.toUpperCase()}*\n` +
          `─────────────────────────\n\n` +
          `🛡️ *Stabilité de la Timeline* : 88% (🟢 Stable)\n` +
          `🌱 *Bilan Carbone* : 142.5 kg CO2e évités\n` +
          `💧 *Eau préservée* : 1,250 Litres\n\n` +
          `🥇 *Vaisseau Leader* : Équipe Air (Moteur N°4)\n` +
          `🏆 *Top 3 Agents* : @Romain, @William, @Mariane\n\n` +
          `🚀 _Consultez votre classement complet sur EVOE !_`
        );
    }
  };

  const currentMessage = getTemplateMessage(selectedTemplate);

  const handleSendRealTest = async () => {
    setIsSending(true);
    setTestResult(null);
    try {
      const token = getAuthData('access_token');
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/whatsapp/send-test?schoolYear=${schoolYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gatewayUrl: gatewayUrl || undefined,
          chatId: chatId || undefined,
          message: currentMessage,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setTestResult(data);
      } else {
        setTestResult({ success: false, message: 'Erreur HTTP lors du test réseau.' });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Erreur réseau.' });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Bar Header */}
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Simulateur & Aperçu Canaux WhatsApp
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
                    Test Temps Réel
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {communityName || 'Communauté SOS Planète'} — Prévisualisez et testez la livraison des notifications.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 custom-scrollbar">
            {/* Left Controls & Template Selection (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Choisir un modèle d'événement à simuler
                </span>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'podium', label: '🏆 Dépassement du Top 3 (Podium)', desc: 'Notification instantanée sur le fil global' },
                    { id: 'challenge', label: '⚔️ Lancement de Défi / Duel', desc: 'Alerte de combat inter-équipes' },
                    { id: 'stase', label: '⚠️ Alerte Paradoxe Temporel', desc: 'Rappel d\'inactivité pour équipage' },
                    { id: 'report', label: '📊 Bilan Hebdomadaire (Vendredi)', desc: 'Synthèse d\'impact et score global' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setSelectedTemplate(tpl.id as any);
                        setTestResult(null);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        selectedTemplate === tpl.id
                          ? 'bg-emerald-50 border-emerald-500/40 text-emerald-900 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{tpl.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{tpl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Info */}
              <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-white">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  Configuration Actuelle
                </div>
                <div className="space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="truncate"><strong className="text-slate-300">Communauté:</strong> {communityName || 'Non défini'}</div>
                  <div className="truncate"><strong className="text-slate-300">Passerelle:</strong> {gatewayUrl || 'Mode Simulation'}</div>
                  <div className="truncate"><strong className="text-slate-300">ID Canal:</strong> {chatId || 'Mode Simulation'}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 italic">
                  💡 En mode simulation, l'aperçu du smartphone à droite reproduit l'affichage réel sans consommer votre quota.
                </div>
              </div>

              {/* Test Actions */}
              <div className="mt-auto space-y-3 pt-2">
                <Button
                  onClick={handleSendRealTest}
                  isLoading={isSending}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  <Send size={14} className="mr-2" />
                  Tester l'envoi réel vers WhatsApp
                </Button>
              </div>

              {/* Test Result Alert */}
              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : testResult.simulated 
                    ? 'bg-amber-50 border-amber-200 text-amber-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="font-black flex items-center gap-1.5 mb-1">
                    {testResult.success ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} />}
                    {testResult.message}
                  </div>
                  {testResult.simulated && (
                    <p className="text-[11px] opacity-80 mt-1">
                      Configurez l'URL de passerelle et l'ID de canal dans l'admin pour activer la livraison sur de vrais smartphones.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Smartphone Screen Mockup (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900/5 p-6 rounded-3xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Aperçu Smartphone — Rendu WhatsApp Direct
              </span>

              {/* Smartphone Frame */}
              <div className="w-[320px] sm:w-[350px] h-[540px] bg-slate-950 rounded-[42px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden">
                {/* iPhone Notch Top */}
                <div className="w-28 h-4 bg-slate-900 rounded-b-xl mx-auto mb-1 shrink-0 z-20" />

                {/* WhatsApp Chat Header */}
                <div className="bg-[#075e54] text-white p-3 pt-1 flex items-center gap-3 shrink-0 rounded-t-2xl z-10 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#075e54] font-black text-xs flex items-center justify-center shrink-0 border border-white/20">
                    🌱
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate">{communityName || 'Communauté SOS Planète'}</span>
                    <span className="text-[9px] text-emerald-100/80 font-medium">Fil d'Annonces (234 membres)</span>
                  </div>
                </div>

                {/* WhatsApp Chat Wallpaper Background */}
                <div className="flex-1 bg-[#e5ddd5] p-3 overflow-y-auto custom-scrollbar flex flex-col justify-end space-y-3 relative">
                  {/* Date Pill */}
                  <div className="self-center bg-white/80 backdrop-blur-sm text-slate-600 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    Aujourd'hui
                  </div>

                  {/* Incoming WhatsApp Bubble */}
                  <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[90%] border border-slate-200/50 space-y-2 relative animate-fade-in">
                    {/* Bot Sender Badge */}
                    <div className="text-[10px] font-black text-[#075e54] flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-500" /> EVOE Temporal Bot
                    </div>

                    {/* Formatted Message Body */}
                    <div className="text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                      {currentMessage.split('👉')[0]}
                    </div>

                    {/* Action Link Button Inside Bubble */}
                    {currentMessage.includes('👉') && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200/60 transition-colors"
                        >
                          <span className="truncate">🚀 Ouvrir l'App EVOE</span>
                          <ExternalLink size={12} className="shrink-0 text-emerald-600" />
                        </a>
                      </div>
                    )}

                    {/* Timestamp & Read Checkmarks */}
                    <div className="text-[9px] text-slate-400 font-medium text-right mt-1">
                      17:00
                    </div>
                  </div>
                </div>

                {/* iPhone Home Bar Bottom */}
                <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto mt-2 shrink-0" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
