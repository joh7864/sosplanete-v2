import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Save, Smartphone, ShieldCheck, Link, Globe, Users, CheckCircle2, AlertCircle, RefreshCw, Send, HelpCircle, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { getAuthData } from '@/utils/storage';
import { WhatsAppTestModal } from './WhatsAppTestModal';
import { WhatsAppHelpDrawer } from './WhatsAppHelpDrawer';

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

      // 1. Sauvegarder la configuration globale de l'instance/système
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

      // 2. Sauvegarder les configurations par équipe
      for (const team of teams) {
        const cfg = teamConfigs[team.id];
        if (cfg) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              whatsappInviteUrl: cfg.inviteUrl,
              whatsappGroupId: cfg.groupId,
            }),
          });
        }
      }

      if (sysResp.ok) {
        setStatusMessage({ type: 'success', text: 'Paramètres de la Communauté WhatsApp enregistrés avec succès !' });
        onRefreshTeams();
      } else {
        setStatusMessage({ type: 'error', text: 'Erreur lors de la sauvegarde de la configuration générale.' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Erreur réseau.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTeamConfigChange = (teamId: number, field: 'inviteUrl' | 'groupId', value: string) => {
    setTeamConfigs((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value,
      },
    }));
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
                Communauté & Notifications WhatsApp
                <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
                  Evoe Sync
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-1 max-w-2xl">
                Configurez le canal d'Annonces Global et les sous-groupes d'équipes pour diffuser les alertes de jeu, duels et bilans hebdomadaires.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsHelpDrawerOpen(true)}
              className="h-11 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <HelpCircle size={16} className="text-emerald-400" /> Guide & Aide
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsTestModalOpen(true)}
              className="h-11 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Smartphone size={16} /> Aperçu & Test Virtuel
            </Button>
            <Button
              onClick={handleSaveAll}
              isLoading={saving}
              className="h-11 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20"
            >
              <Save size={14} className="mr-2" /> Enregistrer
            </Button>
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
              1. Canaux de la Communauté Établissement (Fil Global)
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Paramétrage du canal principal d'annonces
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Nom de la Communauté WhatsApp
            </label>
            <input
              type="text"
              value={whatsappCommunityName}
              onChange={(e) => setWhatsappCommunityName(e.target.value)}
              placeholder="ex: Communauté SOS Planète - Collège St-Exupéry"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            <span className="text-[9px] text-slate-400 font-medium italic block">
              Utilisé dans l'en-tête et la signature des messages automatisés du Bot.
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Lien d'Invitation à la Communauté (Parent)
            </label>
            <input
              type="text"
              value={whatsappCommunityUrl}
              onChange={(e) => setWhatsappCommunityUrl(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            <span className="text-[9px] text-slate-400 font-medium italic block">
              Lien d'adhésion unique fourni aux élèves pour rejoindre la communauté en 1 clic.
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Identifiant du Fil d'Annonces Global (Group ID)
            </label>
            <input
              type="text"
              value={whatsappGeneralId}
              onChange={(e) => setWhatsappGeneralId(e.target.value)}
              placeholder="ex: 120363048912345678@g.us"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            <span className="text-[9px] text-slate-400 font-medium italic block">
              Identifiant technique du canal d'annonces où les numéros d'élèves sont masqués.
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
              placeholder="https://api.evolution-api.com/message/sendText/..."
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            <span className="text-[9px] text-slate-400 font-medium italic block">
              URL du service de passerelle de messagerie (Evolution API, Twilio, GreenAPI...).
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Per-Team WhatsApp Channels */}
      <GlassCard className="p-8 bg-white border border-slate-100 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                2. Sous-Groupes WhatsApp par Équipe
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Configuration des fils de discussion d'équipes
              </p>
            </div>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 italic">
            Aucune équipe enregistrée pour cet établissement.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {teams.map((team) => {
              const cfg = teamConfigs[team.id] || { inviteUrl: '', groupId: '' };
              return (
                <div key={team.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0"
                      style={{ backgroundColor: team.color || '#10b981' }}
                    />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Équipe {team.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        Lien d'Invitation Sous-Groupe Équipe
                      </label>
                      <input
                        type="text"
                        value={cfg.inviteUrl}
                        onChange={(e) => handleTeamConfigChange(team.id, 'inviteUrl', e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        Identifiant du Sous-Groupe Équipe (Group ID)
                      </label>
                      <input
                        type="text"
                        value={cfg.groupId}
                        onChange={(e) => handleTeamConfigChange(team.id, 'groupId', e.target.value)}
                        placeholder="ex: 120363048999999999@g.us"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
    </div>
  );
};
