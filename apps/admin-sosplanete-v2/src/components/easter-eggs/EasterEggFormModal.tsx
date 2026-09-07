'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  HelpCircle,
  Clock,
  KeyRound,
  FileText,
  AlertTriangle,
  Loader2,
  Trash2,
  Terminal,
  MousePointer,
  Gamepad2,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';
import {
  EasterEggCatalogItem,
  createAdminEgg,
  updateAdminEgg,
  uploadEnigmaImage,
  resolveEnigmaImageUrl,
} from '@/utils/easterEggApi';

interface EasterEggFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  enigmaToEdit?: EasterEggCatalogItem | null;
}

const TRIGGER_TYPES = [
  {
    value: 'RIDDLE_ANSWER_INPUT',
    label: 'Cadenas / Saisie de Réponse',
    description: 'Pavé de saisie compact (code 4 chiffres, mot-clé secret...).',
    icon: KeyRound,
  },
  {
    value: 'KONAMI_CODE',
    label: 'Code Konami (Touches)',
    description: 'Séquence culte : Haut, Haut, Bas, Bas, Gauche, Droite...',
    icon: Gamepad2,
  },
  {
    value: 'COMM_LINK_COMMAND',
    label: 'Commande Comm-Link',
    description: 'Commande tapée dans le chat (/matrix, /antigravity, /1985...).',
    icon: Terminal,
  },
  {
    value: 'CLICK_REPEATED',
    label: 'Clics Répétés (Globe / 3D)',
    description: 'Multi-clics rapides sur un élément interactif (ex : 7 clics globe).',
    icon: MousePointer,
  },
  {
    value: 'SCREEN_EDGE',
    label: 'Bord d’Écran / Constellation 3D',
    description: 'Déclenchement spatial ou triangle d’étoiles célestes.',
    icon: Maximize2,
  },
  {
    value: 'LOGO_HOLD',
    label: 'Maintien Long sur Logo',
    description: 'Pression maintenue 3 secondes sur le logo de l’Arche.',
    icon: Sparkles,
  },
  {
    value: 'METRIC_SEQUENCE',
    label: 'Séquence Profil Harmonique',
    description: 'Combinaison de jauges de ressources (Carbone, Eau, Déchets).',
    icon: HelpCircle,
  },
  {
    value: 'CUSTOM_ACTION',
    label: 'Action Personnalisée',
    description: 'Déclencheur sur-mesure ou logique avancée.',
    icon: FileText,
  },
];

const DIFFICULTIES = [
  { value: 'EASY', label: 'Facile' },
  { value: 'MEDIUM', label: 'Moyen' },
  { value: 'HARD', label: 'Difficile' },
  { value: 'LEGENDARY', label: 'Légendaire' },
];

export function EasterEggFormModal({
  isOpen,
  onClose,
  onSuccess,
  enigmaToEdit,
}: EasterEggFormModalProps) {
  const isEdit = Boolean(enigmaToEdit);

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [complexity, setComplexity] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY'>('MEDIUM');
  const [rewardPointsIT, setRewardPointsIT] = useState(60);
  const [crypticMessage, setCrypticMessage] = useState('');
  const [explicitHint, setExplicitHint] = useState('');
  
  // Hint delay in hh:mm
  const [delayHours, setDelayHours] = useState(2);
  const [delayMinutes, setDelayMinutes] = useState(0);

  const [triggerType, setTriggerType] = useState('RIDDLE_ANSWER_INPUT');
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [commandConfig, setCommandConfig] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enigmaToEdit) {
      setTitle(enigmaToEdit.title || '');
      setCode(enigmaToEdit.code || '');
      setComplexity(enigmaToEdit.complexity || 'MEDIUM');
      setRewardPointsIT(enigmaToEdit.rewardPointsIT || 50);
      setCrypticMessage(enigmaToEdit.crypticMessage || '');
      setExplicitHint(enigmaToEdit.explicitHint || '');
      
      const totalMin = enigmaToEdit.hintDelayMinutes ?? 120;
      setDelayHours(Math.floor(totalMin / 60));
      setDelayMinutes(totalMin % 60);

      setTriggerType(enigmaToEdit.triggerType || 'RIDDLE_ANSWER_INPUT');
      setExpectedAnswer(enigmaToEdit.expectedAnswer || '');
      setCaseSensitive(enigmaToEdit.caseSensitive ?? false);
      setImageUrl(enigmaToEdit.imageUrl || '');
      setIsActive(enigmaToEdit.isActive ?? true);

      if (enigmaToEdit.triggerConfig?.command) {
        setCommandConfig(enigmaToEdit.triggerConfig.command);
      } else {
        setCommandConfig('');
      }
    } else {
      setTitle('');
      setCode(`EE_${Date.now().toString().slice(-6)}`);
      setComplexity('MEDIUM');
      setRewardPointsIT(60);
      setCrypticMessage('');
      setExplicitHint('');
      setDelayHours(2);
      setDelayMinutes(0);
      setTriggerType('RIDDLE_ANSWER_INPUT');
      setExpectedAnswer('');
      setCaseSensitive(false);
      setCommandConfig('');
      setImageUrl('');
      setIsActive(true);
    }
    setError(null);
  }, [enigmaToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const res = await uploadEnigmaImage(file);
      setImageUrl(res.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du téléversement de l’image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError('Le titre est requis.');
      return;
    }
    if (!code.trim()) {
      setError('Le code d’identification unique est requis.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: Partial<EasterEggCatalogItem> = {
      title: title.trim(),
      code: code.trim().toUpperCase(),
      complexity,
      rewardPointsIT,
      crypticMessage: crypticMessage.trim(),
      explicitHint: explicitHint.trim() || null,
      hintDelayMinutes: delayHours * 60 + delayMinutes,
      triggerType,
      expectedAnswer: triggerType === 'RIDDLE_ANSWER_INPUT' ? expectedAnswer.trim() : null,
      caseSensitive: triggerType === 'RIDDLE_ANSWER_INPUT' ? caseSensitive : false,
      triggerConfig: triggerType === 'COMM_LINK_COMMAND' ? { command: commandConfig.trim() } : {},
      imageUrl: imageUrl.trim() || null,
      isActive,
    };

    try {
      if (isEdit && enigmaToEdit) {
        await updateAdminEgg(enigmaToEdit.id, payload);
      } else {
        await createAdminEgg(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’enregistrement de l’énigme.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl my-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 bg-white/95 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">
                  {isEdit ? 'Modifier l’Énigme SF' : 'Créer une Nouvelle Énigme SF'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Catalogue permanent d’Easter Eggs & Lore 2070
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs font-bold">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Row 1: Titre & Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Titre de l’Énigme *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Le Cadenas à 4 Chiffres de l'Arche"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200 text-slate-800 placeholder-slate-400 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Code Unique (Identifiant) *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ex : EE_CADENAS_4CH_ARCHE"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200 text-slate-800 placeholder-slate-400 font-mono font-bold text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Row 2: Difficulté & Points IT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Niveau de Difficulté
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setComplexity(d.value as any)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center truncate cursor-pointer ${
                        complexity === d.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 font-black shadow-xs'
                          : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Points IT Remportés (+IT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={500}
                    step={5}
                    value={rewardPointsIT}
                    onChange={(e) => setRewardPointsIT(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200 text-slate-800 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all pr-16 shadow-xs"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-700 pointer-events-none">
                    PTS IT
                  </div>
                </div>
              </div>
            </div>

            {/* Lore 2070 / Message cryptique */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Récit d’Ambiance 2070 (Message Cryptique de la Mascotte)
              </label>
              <textarea
                rows={3}
                value={crypticMessage}
                onChange={(e) => setCrypticMessage(e.target.value)}
                placeholder="Transmission prioritaire 2070 : Nos scientifiques ont scellé une capsule d'énergie..."
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium shadow-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Texte affiché dans la bulle de la mascotte après remplissage des prérequis.
              </p>
            </div>

            {/* 2ème Indice & Minuteur en hh:mm */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <Clock size={16} />
                <span className="text-xs font-black uppercase tracking-wider">
                  2ème Indice Explicite & Minuteur de Déblocage
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contenu du 2ème Indice (Guidage déductif sans trahir la solution)
                </label>
                <textarea
                  rows={2}
                  value={explicitHint}
                  onChange={(e) => setExplicitHint(e.target.value)}
                  placeholder="Ex : La règle 4 est la clé de voûte : elle élimine 9, 5, 1 et 3..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Délai avant déblocage (en heures et minutes)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={delayHours}
                      onChange={(e) => setDelayHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 bg-slate-50 border border-slate-200 rounded-lg py-1 text-slate-800 font-mono text-center font-bold text-sm focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-bold text-slate-500">heures</span>
                  </div>

                  <span className="text-slate-400 font-bold">:</span>

                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={delayMinutes}
                      onChange={(e) => setDelayMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-12 bg-slate-50 border border-slate-200 rounded-lg py-1 text-slate-800 font-mono text-center font-bold text-sm focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-bold text-slate-500">min</span>
                  </div>

                  <div className="ml-auto text-xs text-slate-500 font-medium">
                    Total : <span className="text-emerald-700 font-mono font-bold">{delayHours * 60 + delayMinutes}</span> minutes
                  </div>
                </div>
              </div>
            </div>

            {/* Type de Déclencheur */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Type de Déclencheur Secret
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TRIGGER_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = triggerType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTriggerType(t.value)}
                      className={`flex items-start gap-3 p-3.5 text-left rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-slate-800 ring-1 ring-emerald-500/30 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-800 leading-tight">{t.label}</div>
                        <div className="text-[11px] text-slate-500 leading-snug mt-1 line-clamp-2">
                          {t.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditionnel : Saisie de code attendu */}
            {triggerType === 'RIDDLE_ANSWER_INPUT' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Réponse / Code Attendu (Ex : 4207) *
                  </label>
                  <input
                    type="text"
                    value={expectedAnswer}
                    onChange={(e) => setExpectedAnswer(e.target.value)}
                    placeholder="4207"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-base font-black tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-4 sm:pt-5">
                  <span className="text-xs font-semibold text-slate-700">Sensible à la casse</span>
                  <button
                    type="button"
                    onClick={() => setCaseSensitive(!caseSensitive)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      caseSensitive ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'
                    }`}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>
            )}

            {/* Conditionnel : Commande Comm-Link */}
            {triggerType === 'COMM_LINK_COMMAND' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Commande tapée dans le Comm-Link
                </label>
                <input
                  type="text"
                  value={commandConfig}
                  onChange={(e) => setCommandConfig(e.target.value)}
                  placeholder="/matrix ou /antigravity"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-emerald-700 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
                />
              </div>
            )}

            {/* Upload Infographie / Schéma visuel */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Infographie / Schéma Visuel Déductif (Optionnel)
              </label>

              {imageUrl ? (
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center p-1">
                    <img
                      src={resolveEnigmaImageUrl(imageUrl)}
                      alt="Schéma"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{imageUrl}</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5 font-semibold">Image associée active</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-6 bg-white text-center transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    {uploading ? (
                      <Loader2 className="animate-spin text-emerald-600" size={24} />
                    ) : (
                      <ImageIcon className="text-slate-400" size={24} />
                    )}
                    <span className="text-xs font-bold text-slate-700">
                      {uploading ? 'Téléversement en cours...' : 'Cliquer pour téléverser une image (PNG, WebP, JPG)'}
                    </span>
                    <span className="text-[10px] text-slate-400">Max 5 Mo</span>
                  </div>
                </div>
              )}
            </div>

            {/* Statut Actif / Inactif */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-sm font-bold text-slate-800 block">Statut de l’énigme</span>
                <span className="text-xs text-slate-500">
                  {isActive ? 'Active dans le catalogue pour les futures sessions' : 'Désactivée (mise de côté)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </form>

          {/* Footer with clean, non-overflowing buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/80 bg-white/95 sticky bottom-0 z-10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : isEdit ? (
                <span>Mettre à jour</span>
              ) : (
                <span>Créer l’énigme</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
