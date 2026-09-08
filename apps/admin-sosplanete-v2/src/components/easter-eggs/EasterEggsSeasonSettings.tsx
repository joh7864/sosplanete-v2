'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Users,
  Trophy,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  Info,
  Minus,
  Plus,
  KeyRound,
  Binary
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButtonWithTooltip } from '@/components/ui/IconButtonWithTooltip';
import {
  EasterEggSettings,
  updateAdminSettings,
} from '@/utils/easterEggApi';

interface EasterEggsSeasonSettingsProps {
  instanceYearId: number;
  initialSettings?: EasterEggSettings;
  onSettingsSaved?: () => void;
}

export function EasterEggsSeasonSettings({
  instanceYearId,
  initialSettings,
  onSettingsSaved,
}: EasterEggsSeasonSettingsProps) {
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState(2);
  const [requiredPlayers, setRequiredPlayers] = useState(2);
  const [maxWinningTeams, setMaxWinningTeams] = useState(0);
  const [metaEnigmaSecretWord, setMetaEnigmaSecretWord] = useState('CHRONOS');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (initialSettings) {
      setEnabled(initialSettings.easterEggsEnabled ?? true);
      setFrequency(initialSettings.easterEggFrequency ?? 2);
      setRequiredPlayers(initialSettings.easterEggRequiredPlayers ?? 2);
      setMaxWinningTeams(initialSettings.easterEggMaxWinningTeams ?? 0);
      setMetaEnigmaSecretWord(initialSettings.metaEnigmaSecretWord || 'CHRONOS');
    }
  }, [initialSettings]);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await updateAdminSettings(instanceYearId, {
        easterEggsEnabled: enabled,
        easterEggFrequency: frequency,
        easterEggRequiredPlayers: requiredPlayers,
        easterEggMaxWinningTeams: maxWinningTeams,
        metaEnigmaSecretWord: metaEnigmaSecretWord.trim().toUpperCase(),
      });
      setFeedback({ type: 'success', message: 'Paramètres généraux de la saison enregistrés avec succès !' });
      if (onSettingsSaved) onSettingsSaved();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Info Card with Activation Switch and Quick Save */}
      <GlassCard className="p-6 bg-white/95 border-slate-200/80 shadow-sm rounded-3xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
                enabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <Power size={24} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                Activation Générale des Easter Eggs
              </h2>
              <p className="text-xs text-slate-500">
                Active ou suspend l’apparition de l’Œuf temporel et des énigmes dans l’univers des élèves
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Save Icon Button with Tooltip */}
            <IconButtonWithTooltip
              tooltip="Enregistrer les paramètres"
              tooltipPosition="bottom"
              tooltipAlign="end"
              variant="primary-solid"
              size="md"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            </IconButtonWithTooltip>

            {/* Main Power Toggle Switch with Tooltip */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                title={enabled ? 'Désactiver les Easter Eggs' : 'Activer les Easter Eggs'}
                aria-label={enabled ? 'Désactiver les Easter Eggs' : 'Activer les Easter Eggs'}
                className={`w-16 h-8 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                  enabled ? 'bg-emerald-500 justify-end shadow-md shadow-emerald-500/20' : 'bg-slate-200 justify-start'
                }`}
              >
                <motion.div layout className="w-6 h-6 rounded-full bg-white shadow-md" />
              </button>
              <span className="pointer-events-none absolute bottom-full right-0 mb-2 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900/90 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-150 whitespace-nowrap shadow-md z-30">
                {enabled ? 'Easter Eggs Activés (cliquer pour désactiver)' : 'Easter Eggs Suspendus (cliquer pour activer)'}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paramètre 1: Fréquence */}
        <GlassCard className="p-6 bg-white/95 border-slate-200/80 shadow-sm rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-emerald-600">
            <Sparkles size={20} />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Fréquence de Parution
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Rythme d’apparition d’un nouvel Easter Egg à travers les périodes scolaires du jeu.
          </p>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setFrequency(n)}
                className={`py-3 rounded-2xl text-center border transition-all cursor-pointer ${
                  frequency === n
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-black ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="block text-base font-black">{n}</span>
                <span className="text-[10px] uppercase font-bold tracking-tight text-slate-500">
                  {n === 1 ? 'Période' : 'Périodes'}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Par défaut : 1 œuf toutes les 2 périodes (l’œuf non résolu est reconduit jusqu’à découverte).
          </p>
        </GlassCard>

        {/* Paramètre 2: Quota Joueurs par Équipe */}
        <GlassCard className="p-6 bg-white/95 border-slate-200/80 shadow-sm rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-amber-500">
            <Users size={20} />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Quota Minimum par Équipe
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nombre d’élèves d’une même équipe devant valider l’action pour débloquer les points IT collectifs.
          </p>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-3">
              <IconButtonWithTooltip
                tooltip="Diminuer le quota"
                variant="default"
                size="md"
                onClick={() => setRequiredPlayers(Math.max(1, requiredPlayers - 1))}
              >
                <Minus size={16} />
              </IconButtonWithTooltip>

              <div className="text-center w-16">
                <span className="text-2xl font-black text-slate-800 font-mono">{requiredPlayers}</span>
                <span className="block text-[10px] text-slate-400 uppercase font-bold">joueurs</span>
              </div>

              <IconButtonWithTooltip
                tooltip="Augmenter le quota"
                variant="default"
                size="md"
                onClick={() => setRequiredPlayers(Math.min(10, requiredPlayers + 1))}
              >
                <Plus size={16} />
              </IconButtonWithTooltip>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl">
                Esprit d’Équipe
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Encourage la collaboration : dès qu’un joueur trouve, il partage l’indice dans le salon de son équipe !
          </p>
        </GlassCard>

        {/* Paramètre 3: Limite Équipes Gagnantes */}
        <GlassCard className="p-6 bg-white/95 border-slate-200/80 shadow-sm rounded-3xl space-y-4 md:col-span-2">
          <div className="flex items-center gap-3 text-purple-600">
            <Trophy size={20} />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Équipes Gagnantes Récompensées
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Définissez si toutes les équipes remplissant le quota remportent les points IT, ou uniquement les premières plus rapides.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            {[
              { val: 0, label: 'Toutes les équipes', desc: 'Sans limite de podium' },
              { val: 1, label: '1ère équipe uniquement', desc: 'Course exclusive' },
              { val: 2, label: '2 premières équipes', desc: 'Podium Or & Argent' },
              { val: 3, label: '3 premières équipes', desc: 'Top 3 classique' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setMaxWinningTeams(opt.val)}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  maxWinningTeams === opt.val
                    ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="block font-black text-sm text-slate-800">{opt.label}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">{opt.desc}</span>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Summary Card - High Contrast & Crystal Clear Nature/Pastel */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-tight">
              Synthèse de la Configuration Active
            </h4>
            <p className="text-xs text-slate-500">
              Récapitulatif des règles appliquées à la saison et à l’univers des élèves
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Bloc 1: Statut */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              Statut Général
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${enabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={`text-sm font-black font-mono ${enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                {enabled ? 'Activé' : 'Désactivé'}
              </span>
            </div>
          </div>

          {/* Bloc 2: Fréquence */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              Fréquence
            </span>
            <span className="text-sm font-black font-mono text-emerald-700">
              1 œuf / {frequency} {frequency === 1 ? 'période' : 'périodes'}
            </span>
          </div>

          {/* Bloc 3: Quota Équipe */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              Quota par Équipe
            </span>
            <span className="text-sm font-black font-mono text-amber-700">
              {requiredPlayers} joueurs min.
            </span>
          </div>

          {/* Bloc 4: Équipes Récompensées */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              Podium Récompensé
            </span>
            <span className="text-sm font-black font-mono text-purple-700">
              {maxWinningTeams === 0 ? 'Toutes les équipes' : `Top ${maxWinningTeams} ${maxWinningTeams === 1 ? 'équipe' : 'équipes'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Card Méta-Énigme 2070 & Vision Avant / Après */}
      <GlassCard className="p-6 bg-white/95 border-slate-200/80 shadow-sm rounded-3xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
              Méta-Énigme 2070 & Vision Temporelle 2050
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                Artefacts
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Paramétrez le mot de passe secret final déduit de la collection des glyphes de périodes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Mot de Passe Secret Final (Alphabet Contemporain)
            </label>
            <div className="relative">
              <input
                type="text"
                value={metaEnigmaSecretWord}
                onChange={(e) => setMetaEnigmaSecretWord(e.target.value.toUpperCase())}
                placeholder="Ex : CHRONOS, TERRA, FUTUR..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all shadow-xs"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                {metaEnigmaSecretWord.length} LETTRES
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Chaque période est associée à une lettre encodée sous forme de glyphe runique de 2070 sur l'œuf.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Binary size={15} className="text-amber-600" />
              <span>Mécanique des Artefacts Méta-Jeu :</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
              <li>
                <strong className="text-slate-700">Chrono-Egg :</strong> Débloqué via un Easter Egg dédié dans le catalogue. Permet aux élèves de consulter l'historique de leurs glyphes et de relancer les périodes manquées.
              </li>
              <li>
                <strong className="text-slate-700">Pierre de Rosette 2070 :</strong> Débloquée via un autre Easter Egg dédié. Fournit la table de correspondance pour traduire les glyphes runiques en lettres.
              </li>
              <li>
                <strong className="text-slate-700">Vision 2050 (Avant/Après) :</strong> Débloquée définitivement dès que les élèves saisissent le bon mot de passe dans le Terminal Temporel.
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Feedback Toast */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-600/20 transition-all whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Enregistrer les Paramètres</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
