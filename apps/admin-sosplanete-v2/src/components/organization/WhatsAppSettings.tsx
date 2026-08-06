import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Save, Smartphone, ShieldCheck, Link, Globe, Users, CheckCircle2, AlertCircle, RefreshCw, Send, HelpCircle, BookOpen, QrCode, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { getAuthData } from '@/utils/storage';
import { WhatsAppTestModal } from './WhatsAppTestModal';
import { WhatsAppHelpDrawer } from './WhatsAppHelpDrawer';
import { WhatsAppQrModal } from './WhatsAppQrModal';

interface WhatsAppSettingsProps {
  schoolYear: string;
  teams: any[];
  onRefreshTeams: () => void;
}

export const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({
  schoolYear,
  teams,
  onRefreshTeams,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General System Config State
  const [whatsappCommunityName, setWhatsappCommunityName] = useState('');
  const [whatsappCommunityUrl, setWhatsappCommunityUrl] = useState('');
  const [whatsappGeneralId, setWhatsappGeneralId] = useState('');
  const [whatsappGeneralUrl, setWhatsappGeneralUrl] = useState('');

  // Per-Team WhatsApp Config State: Map<teamId, { inviteUrl: string, groupId: string }>
  const [teamConfigs, setTeamConfigs] = useState<{ [teamId: number]: { inviteUrl: string; groupId: string } }>({});

  // Simulator Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Help Drawer State
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);

  // QR Modal State
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    communityName?: string;
  }>({
    isOpen: false,
    title: '',
    url: '',
  });

  useEffect(() => {
    fetchSystemConfig();
  }, [schoolYear]);

  useEffect(() => {
    if (teams && teams.length > 0) {
      const initial: { [teamId: number]: { inviteUrl: string; groupId: string } } = {};
      teams.forEach((t) => {
        initial[t.id] = {
          inviteUrl: t.whatsappInviteUrl || '',
          groupId: t.whatsappGroupId || '',
        };
      });
      setTeamConfigs(initial);
    }
  }, [teams]);

  const fetchSystemConfig = async () => {
    setLoading(true);
    try {
      const token = getAuthData('access_token');
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const config = await resp.json();
        setWhatsappCommunityName(config.whatsappCommunityName || '');
        setWhatsappCommunityUrl(config.whatsappCommunityUrl || '');
        setWhatsappGeneralId(config.whatsappGeneralId || '');
        setWhatsappGeneralUrl(config.whatsappGeneralUrl || '');
      }
    } catch (e) {
      console.error('Failed to fetch system config for WhatsApp:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const token = getAuthData('access_token');

      // Sauvegarder la configuration globale WhatsApp (groupe unique)
      const sysResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          whatsappCommunityName,
          whatsappCommunityUrl,
          whatsappGeneralId,
          whatsappGeneralUrl,
        }),
      });

      if (sysResp.ok) {
        setStatusMessage({ type: 'success', text: 'Paramètres du Groupe WhatsApp enregistrés avec succès !' });
        onRefreshTeams();
      } else {
        setStatusMessage({ type: 'error', text: 'Erreur lors de la sauvegarde de la configuration.' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Erreur réseau.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Header */}
      <GlassCard className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white border-none shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Groupe & Notifications WhatsApp EVOE
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-1 max-w-2xl">
                Configurez le groupe WhatsApp général de l'établissement pour diffuser les alertes de jeu, duels et bilans hebdomadaires.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
            {/* Button 1: Guide & Aide */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsHelpDrawerOpen(true)}
                className="w-11 h-11 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center transition-all shadow-sm active:scale-95"
                aria-label="Guide & Aide"
              >
                <HelpCircle size={20} className="text-emerald-400" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
                  Guide & Aide pas à pas
                </span>
                <span className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700" />
              </div>
            </div>

            {/* Button 2: Aperçu & Test Virtuel (Simulateur) */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsTestModalOpen(true)}
                className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center transition-all shadow-sm active:scale-95"
                aria-label="Aperçu & Test Virtuel"
              >
                <Smartphone size={20} />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
                  Aperçu Smartphone & Test Virtuel
                </span>
                <span className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700" />
              </div>
            </div>

            {/* Button 3: Enregistrer */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="w-11 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                aria-label="Enregistrer"
              >
                <Save size={20} />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
                  Enregistrer les modifications
                </span>
                <span className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} />}
          {statusMessage.text}
        </motion.div>
      )}

      {/* Global Community Settings */}
      <GlassCard className="p-8 bg-white border border-slate-100 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Globe size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Groupe WhatsApp EVOE (Groupe Unique)
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Paramétrage du groupe WhatsApp général de l'établissement
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Nom du Groupe WhatsApp EVOE
            </label>
            <input
              type="text"
              value={whatsappCommunityName}
              onChange={(e) => setWhatsappCommunityName(e.target.value)}
              placeholder="ex: Groupe EVOE - Collège St-Exupéry"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            <span className="text-[9px] text-slate-400 font-medium italic block">
              Utilisé dans l'en-tête et la signature des messages automatisés du Bot.
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Lien d'Invitation au Groupe WhatsApp
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={whatsappCommunityUrl}
                onChange={(e) => setWhatsappCommunityUrl(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() =>
                  setQrModalData({
                    isOpen: true,
                    title: "Groupe WhatsApp EVOE",
                    url: whatsappCommunityUrl,
                    communityName: whatsappCommunityName,
                  })
                }
                title="Générer le QR Code & l'Affiche d'invitation"
                className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-all shrink-0 active:scale-95 shadow-sm group relative"
              >
                <QrCode size={18} />
              </button>
            </div>
            <span className="text-[9px] text-slate-400 font-medium italic block">
              Lien d'adhésion unique fourni aux élèves pour rejoindre le groupe EVOE en 1 clic.
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Identifiant du Groupe WhatsApp (Group ID)
            </label>
            <input
              type="text"
              value={whatsappGeneralId}
              onChange={(e) => setWhatsappGeneralId(e.target.value)}
              placeholder="ex: 120363048912345678@g.us"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            <span className="text-[9px] text-slate-400 font-medium italic block">
              Identifiant technique du groupe WhatsApp où les messages de jeu seront envoyés.
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              URL de la Passerelle API WhatsApp (Webhook HTTP)
            </label>
            <input
              type="text"
              value={whatsappGeneralUrl}
              onChange={(e) => setWhatsappGeneralUrl(e.target.value)}
              placeholder="http://evolution-api:8080/message/sendText/evoe"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            <span className="text-[9px] text-slate-400 font-medium italic block">
              URL du service de passerelle de messagerie (Evolution API, Twilio, GreenAPI...).
            </span>
          </div>
        </div>
      </GlassCard>

      {/* WhatsApp Test Modal Simulator */}
      <WhatsAppTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        communityName={whatsappCommunityName}
        gatewayUrl={whatsappGeneralUrl}
        chatId={whatsappGeneralId}
        schoolYear={schoolYear}
      />

      {/* WhatsApp Help Drawer Panel */}
      <WhatsAppHelpDrawer
        isOpen={isHelpDrawerOpen}
        onClose={() => setIsHelpDrawerOpen(false)}
      />

      {/* WhatsApp QR Code Generator & Printable Poster Modal */}
      <WhatsAppQrModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        title={qrModalData.title}
        url={qrModalData.url}
        communityName={qrModalData.communityName}
      />
    </div>
  );
};

