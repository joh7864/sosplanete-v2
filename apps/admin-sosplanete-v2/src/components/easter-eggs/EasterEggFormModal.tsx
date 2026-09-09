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
  Image as ImageIcon,
  Upload,
  Target,
  Layers,
  Search,
  Unlock,
  Check,
} from 'lucide-react';
import {
  EasterEggCatalogItem,
  createAdminEgg,
  updateAdminEgg,
  uploadEnigmaImage,
  resolveEnigmaImageUrl,
  fetchActionRefs,
  ActionRefSummary,
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
    description: 'Commande tapée dans le chat (!matrix, !antigravity, !1985...).',
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
  const [specialReward, setSpecialReward] = useState<'NONE' | 'CHRONO_EGG' | 'ROSETTA_STONE'>('NONE');
  const [crypticMessage, setCrypticMessage] = useState('');
  const [explicitHint, setExplicitHint] = useState('');
  
  // Hint delay in hh:mm
  const [delayHours, setDelayHours] = useState(2);
  const [delayMinutes, setDelayMinutes] = useState(0);

  const [triggerType, setTriggerType] = useState('RIDDLE_ANSWER_INPUT');
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [commandConfig, setCommandConfig] = useState('');
  const [customActionType, setCustomActionType] = useState<
    'device_shake' | 'avatar_rapid_click' | 'ships_order_click' | 'sound_frequency_tap' | 'era_warp_fast' | 'custom_event'
  >('device_shake');
  const [customEventKey, setCustomEventKey] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Prérequis de déblocage (Accès libre par défaut)
  const [prerequisiteType, setPrerequisiteType] = useState<'MISSIONS_COUNT' | 'SPECIFIC_MISSIONS' | 'NONE'>('NONE');
  const [reqCount, setReqCount] = useState(3);
  const [reqDistinctSectors, setReqDistinctSectors] = useState(2);
  const [selectedMissionCodes, setSelectedMissionCodes] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<'ALL' | 'ANY'>('ALL');

  // Référentiel des missions
  const [actionRefs, setActionRefs] = useState<ActionRefSummary[]>([]);
  const [loadingActionRefs, setLoadingActionRefs] = useState(false);
  const [searchMissionText, setSearchMissionText] = useState('');
  const [isMissionDropdownOpen, setIsMissionDropdownOpen] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && actionRefs.length === 0) {
      setLoadingActionRefs(true);
      fetchActionRefs()
        .then((data) => setActionRefs(data))
        .catch((err) => console.error('Erreur chargement action-refs:', err))
        .finally(() => setLoadingActionRefs(false));
    }
  }, [isOpen, actionRefs.length]);

  useEffect(() => {
    if (enigmaToEdit) {
      setTitle(enigmaToEdit.title || '');
      setCode(enigmaToEdit.code || '');
      setComplexity(enigmaToEdit.complexity || 'MEDIUM');
      setRewardPointsIT(enigmaToEdit.rewardPointsIT || 50);
      setSpecialReward((enigmaToEdit.specialReward as any) || 'NONE');
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

      if (enigmaToEdit.triggerType === 'CUSTOM_ACTION') {
        const act = enigmaToEdit.triggerConfig?.action;
        if (['device_shake', 'avatar_rapid_click', 'ships_order_click', 'sound_frequency_tap', 'era_warp_fast'].includes(act)) {
          setCustomActionType(act as any);
        } else if (act) {
          setCustomActionType('custom_event');
          setCustomEventKey(act);
        }
      } else {
        setCustomActionType('device_shake');
        setCustomEventKey('');
      }

      // Initialiser les prérequis
      const prereqType = (enigmaToEdit.prerequisiteType as any) || 'NONE';
      setPrerequisiteType(prereqType);

      const prereqConfig = (enigmaToEdit.prerequisiteConfig as any) || {};
      if (prereqType === 'MISSIONS_COUNT') {
        setReqCount(prereqConfig.count != null ? Number(prereqConfig.count) : 3);
        setReqDistinctSectors(prereqConfig.distinctSectors != null ? Number(prereqConfig.distinctSectors) : 2);
        setSelectedMissionCodes([]);
        setMatchMode('ALL');
      } else if (prereqType === 'SPECIFIC_MISSIONS') {
        setSelectedMissionCodes(Array.isArray(prereqConfig.missionCodes) ? prereqConfig.missionCodes : []);
        setMatchMode(prereqConfig.matchMode === 'ANY' ? 'ANY' : 'ALL');
        setReqCount(3);
        setReqDistinctSectors(2);
      } else if (prereqType === 'NONE') {
        setSelectedMissionCodes([]);
        setMatchMode('ALL');
        setReqCount(0);
        setReqDistinctSectors(0);
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
      setCustomActionType('device_shake');
      setCustomEventKey('');
      setImageUrl('');
      setIsActive(true);
      setPrerequisiteType('NONE');
      setReqCount(3);
      setReqDistinctSectors(2);
      setSelectedMissionCodes([]);
      setMatchMode('ALL');
    }
    setError(null);
    setSearchMissionText('');
    setIsMissionDropdownOpen(false);
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
    if (prerequisiteType === 'SPECIFIC_MISSIONS' && selectedMissionCodes.length === 0) {
      setError('Veuillez sélectionner au moins une mission spécifique pour ce mode de prérequis.');
      return;
    }

    setSubmitting(true);
    setError(null);

    let configPayload: any = {};
    if (prerequisiteType === 'MISSIONS_COUNT') {
      configPayload = {
        count: Math.max(1, Number(reqCount) || 1),
        distinctSectors: Math.max(1, Number(reqDistinctSectors) || 1),
      };
    } else if (prerequisiteType === 'SPECIFIC_MISSIONS') {
      const selectedIds = actionRefs
        .filter((ar) => selectedMissionCodes.includes(ar.code))
        .map((ar) => ar.id);

      configPayload = {
        missionCodes: selectedMissionCodes,
        missionIds: selectedIds,
        matchMode,
      };
    } else if (prerequisiteType === 'NONE') {
      configPayload = {};
    }

    const payload: Partial<EasterEggCatalogItem> = {
      title: title.trim(),
      code: code.trim().toUpperCase(),
      complexity,
      rewardPointsIT,
      specialReward: specialReward as any,
      prerequisiteType,
      prerequisiteConfig: configPayload,
      crypticMessage: crypticMessage.trim(),
      explicitHint: explicitHint.trim() || null,
      hintDelayMinutes: delayHours * 60 + delayMinutes,
      triggerType,
      expectedAnswer: triggerType === 'RIDDLE_ANSWER_INPUT' ? expectedAnswer.trim() : null,
      caseSensitive: triggerType === 'RIDDLE_ANSWER_INPUT' ? caseSensitive : false,
      triggerConfig:
        triggerType === 'COMM_LINK_COMMAND'
          ? { command: commandConfig.trim() }
          : triggerType === 'CUSTOM_ACTION'
          ? customActionType === 'custom_event'
            ? { action: customEventKey.trim() || 'custom_event' }
            : customActionType === 'ships_order_click'
            ? { action: 'ships_order_click', sequence: ['scout', 'frigate', 'freighter'] }
            : { action: customActionType }
          : {},
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

            {/* Récompense Spéciale Méta-Jeu 2070 */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-amber-900">
                  ⚡ Récompense Spéciale Méta-Jeu 2070
                </label>
                <span className="text-[11px] font-bold text-amber-700/80">
                  Débloque un artefact clé de la méta-énigme
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSpecialReward('NONE')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    specialReward === 'NONE'
                      ? 'border-amber-500 bg-white shadow-xs text-amber-950 ring-2 ring-amber-500/20'
                      : 'border-amber-200/60 bg-white/60 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-black mb-0.5">Aucun artefact</div>
                  <div className="text-[11px] text-slate-500">Points IT standards uniquement</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSpecialReward('CHRONO_EGG')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    specialReward === 'CHRONO_EGG'
                      ? 'border-amber-500 bg-amber-100/70 shadow-xs text-amber-950 ring-2 ring-amber-500/30'
                      : 'border-amber-200/60 bg-white/60 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-black text-amber-800 flex items-center gap-1.5 mb-0.5">
                    <span>⚡</span> Outil Chrono-Egg
                  </div>
                  <div className="text-[11px] text-slate-600">Journal d'archive des glyphes temporels</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSpecialReward('ROSETTA_STONE')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    specialReward === 'ROSETTA_STONE'
                      ? 'border-amber-500 bg-amber-100/70 shadow-xs text-amber-950 ring-2 ring-amber-500/30'
                      : 'border-amber-200/60 bg-white/60 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-black text-amber-800 flex items-center gap-1.5 mb-0.5">
                    <span>📜</span> Pierre de Rosette 2070
                  </div>
                  <div className="text-[11px] text-slate-600">Table de décodage des symboles runiques</div>
                </button>
              </div>
            </div>

            {/* Condition de Déblocage / Prérequis */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Target size={16} />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Condition de Déblocage (Prérequis de l'Énigme)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  Déclencheur d'interaction du joueur
                </span>
              </div>

              {/* 3 modes de prérequis */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPrerequisiteType('MISSIONS_COUNT')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    prerequisiteType === 'MISSIONS_COUNT'
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Layers size={15} className={prerequisiteType === 'MISSIONS_COUNT' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className={`text-xs font-bold ${prerequisiteType === 'MISSIONS_COUNT' ? 'text-indigo-950' : 'text-slate-700'}`}>
                      Volume & Diversité
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Nombre d'actions et secteurs distincts requis.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrerequisiteType('SPECIFIC_MISSIONS')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    prerequisiteType === 'SPECIFIC_MISSIONS'
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={15} className={prerequisiteType === 'SPECIFIC_MISSIONS' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className={`text-xs font-bold ${prerequisiteType === 'SPECIFIC_MISSIONS' ? 'text-indigo-950' : 'text-slate-700'}`}>
                      Missions Spécifiques
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    1 ou plusieurs éco-gestes précis ciblés.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrerequisiteType('NONE')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    prerequisiteType === 'NONE'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Unlock size={15} className={prerequisiteType === 'NONE' ? 'text-emerald-600' : 'text-slate-400'} />
                    <span className={`text-xs font-bold ${prerequisiteType === 'NONE' ? 'text-emerald-950' : 'text-slate-700'}`}>
                      Accès Libre
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Directement interactif, sans mission requise.
                  </p>
                </button>
              </div>

              {/* Mode 1 : Volume & Diversité */}
              {prerequisiteType === 'MISSIONS_COUNT' && (
                <div className="pt-2 border-t border-slate-200/60 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Missions complétées requises
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={reqCount}
                        onChange={(e) => setReqCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Secteurs distincts minimum
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={reqDistinctSectors}
                        onChange={(e) => setReqDistinctSectors(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-indigo-700/90 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 flex items-center gap-1.5">
                    💡 <span>L'élève devra valider au moins <strong>{reqCount} mission{reqCount > 1 ? 's' : ''}</strong> sur au moins <strong>{reqDistinctSectors} secteur{reqDistinctSectors > 1 ? 's' : ''} distinct{reqDistinctSectors > 1 ? 's' : ''}</strong> lors de la période pour activer l'énigme.</span>
                  </p>
                </div>
              )}

              {/* Mode 2 : Missions Spécifiques */}
              {prerequisiteType === 'SPECIFIC_MISSIONS' && (
                <div className="pt-2 border-t border-slate-200/60 space-y-3">
                  {/* Condition ET / OU si plus d'une mission */}
                  {selectedMissionCodes.length > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-xs font-bold text-slate-700">Condition entre les missions :</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMatchMode('ALL')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            matchMode === 'ALL'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Toutes requises (ET)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMatchMode('ANY')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            matchMode === 'ANY'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Au moins une (OU)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sélecteur de recherche de mission */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ajouter une mission requise
                    </label>
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Rechercher une mission par nom ou code (ex: douche, vélo, ampoule...)"
                        value={searchMissionText}
                        onChange={(e) => setSearchMissionText(e.target.value)}
                        onFocus={() => setIsMissionDropdownOpen(true)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                      />
                    </div>

                    {/* Menu déroulant de résultats */}
                    {isMissionDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsMissionDropdownOpen(false)}
                        />
                        <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1 space-y-0.5">
                          {loadingActionRefs ? (
                            <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                              <Loader2 size={14} className="animate-spin" /> Chargement du référentiel...
                            </div>
                          ) : actionRefs.filter((ar) => !selectedMissionCodes.includes(ar.code) && (!searchMissionText.trim() || ar.code.toLowerCase().includes(searchMissionText.toLowerCase()) || ar.referenceName.toLowerCase().includes(searchMissionText.toLowerCase()) || (ar.category && ar.category.toLowerCase().includes(searchMissionText.toLowerCase())))).length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                              Aucune mission correspondante trouvée.
                            </div>
                          ) : (
                            actionRefs
                              .filter((ar) => !selectedMissionCodes.includes(ar.code) && (!searchMissionText.trim() || ar.code.toLowerCase().includes(searchMissionText.toLowerCase()) || ar.referenceName.toLowerCase().includes(searchMissionText.toLowerCase()) || (ar.category && ar.category.toLowerCase().includes(searchMissionText.toLowerCase()))))
                              .slice(0, 20)
                              .map((ar) => (
                                <button
                                  key={ar.code || ar.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMissionCodes((prev) => [...prev, ar.code]);
                                    setSearchMissionText('');
                                    setIsMissionDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50/70 transition-colors flex items-center justify-between group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 shrink-0">
                                      {ar.code}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-800 truncate">
                                      {ar.referenceName}
                                    </span>
                                  </div>
                                  {ar.category && (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                      {ar.category}
                                    </span>
                                  )}
                                </button>
                              ))
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Liste des badges de missions sélectionnées */}
                  {selectedMissionCodes.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Missions sélectionnées ({selectedMissionCodes.length}) :
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedMissionCodes.map((code) => {
                          const action = actionRefs.find((a) => a.code === code);
                          return (
                            <div
                              key={code}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 border border-indigo-200/80 rounded-xl text-xs font-medium text-indigo-950 shadow-2xs"
                            >
                              <span className="font-mono font-bold text-[10px] bg-indigo-200/70 text-indigo-900 px-1.5 py-0.5 rounded">
                                {code}
                              </span>
                              <span className="font-bold text-slate-800 max-w-[220px] truncate">
                                {action ? action.referenceName : code}
                              </span>
                              {action?.category && (
                                <span className="text-[10px] text-indigo-600 bg-indigo-100/60 px-1.5 py-0.5 rounded font-bold">
                                  {action.category}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedMissionCodes((prev) => prev.filter((c) => c !== code))
                                }
                                className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50 cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-indigo-700/90 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 mt-2">
                        💡 L'énigme sera accessible dès que l'élève aura validé{' '}
                        <strong>
                          {selectedMissionCodes.length === 1
                            ? 'la mission sélectionnée'
                            : matchMode === 'ALL'
                            ? `TOUTES les ${selectedMissionCodes.length} missions sélectionnées`
                            : `AU MOINS L'UNE des ${selectedMissionCodes.length} missions sélectionnées`}
                        </strong>{' '}
                        au cours de la période.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                      <AlertTriangle size={15} className="shrink-0" />
                      <span>Veuillez sélectionner au moins 1 mission dans la liste ci-dessus.</span>
                    </p>
                  )}
                </div>
              )}

              {/* Mode 3 : Accès Libre */}
              {prerequisiteType === 'NONE' && (
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
                    <Unlock size={16} className="text-emerald-600 shrink-0" />
                    <span>L'énigme sera immédiatement disponible pour tous les joueurs dès le début de la période, sans mission préalable requise.</span>
                  </div>
                </div>
              )}
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
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Commande tapée dans le Comm-Link (doit commencer par !)
                </label>
                <input
                  type="text"
                  value={commandConfig}
                  onChange={(e) => setCommandConfig(e.target.value)}
                  placeholder="!matrix ou !antigravity"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-emerald-700 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
                />
                <p className="text-[11px] text-slate-500">
                  💡 Règle Comm-Link : Les commandes d'Easter Eggs doivent obligatoirement commencer par un point d'exclamation (ex: <span className="font-mono font-bold text-emerald-600">!eclipse</span>, <span className="font-mono font-bold text-emerald-600">!matrix</span>).
                </p>
              </div>
            )}

            {/* Conditionnel : Action Personnalisée */}
            {triggerType === 'CUSTOM_ACTION' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-900">
                    ⚙️ Paramétrage de l'Action Personnalisée
                  </label>
                  <span className="text-[11px] font-bold text-indigo-700">
                    Déclenchement interactif
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      value: 'device_shake',
                      label: '📱 Secouer le smartphone',
                      desc: '3 secousses rapides du mobile (accéléromètre)',
                    },
                    {
                      value: 'avatar_rapid_click',
                      label: '👤 Clics sur l’Avatar',
                      desc: '5 clics rapides sur l’avatar de l’agent au QG',
                    },
                    {
                      value: 'ships_order_click',
                      label: '🚀 Vaisseaux Orbitaux',
                      desc: 'Clic ordonné sur les 3 vaisseaux spatiaux 2070',
                    },
                    {
                      value: 'sound_frequency_tap',
                      label: '🔊 Fréquence Audio',
                      desc: '4 clics rapides sur l’icône son pour capter une onde',
                    },
                    {
                      value: 'era_warp_fast',
                      label: '🔄 Saut Temporel Rapide',
                      desc: '3 bascules consécutives entre 2026 et 2070 (< 8s)',
                    },
                    {
                      value: 'custom_event',
                      label: '🛰️ Événement Sur-Mesure',
                      desc: 'Clé d’événement Javascript personnalisée',
                    },
                  ].map((preset) => {
                    const isSelected = customActionType === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setCustomActionType(preset.value as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-indigo-100 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="text-xs font-bold leading-tight">{preset.label}</div>
                        <div
                          className={`text-[11px] mt-1 leading-snug ${
                            isSelected ? 'text-indigo-100' : 'text-slate-500'
                          }`}
                        >
                          {preset.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {customActionType === 'custom_event' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Clé d’Événement Javascript (Ex : solar_alignment, secret_drawer_opened)
                    </label>
                    <input
                      type="text"
                      value={customEventKey}
                      onChange={(e) => setCustomEventKey(e.target.value)}
                      placeholder="nom_evenement_sur_mesure"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Upload Infographie / Schéma visuel */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Infographie / Schéma Visuel Déductif (Optionnel)
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={13} /> Supprimer
                  </button>
                )}
              </div>

              {/* Champ texte modifiable avec bouton d'upload */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/easter-eggs/cadenas_4ch.svg ou URL"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                />
                <label className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs shrink-0">
                  {uploading ? (
                    <Loader2 className="animate-spin text-emerald-600" size={14} />
                  ) : (
                    <Upload size={14} />
                  )}
                  <span>{uploading ? 'Envoi...' : 'Fichier'}</span>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Aperçu en direct */}
              {imageUrl && (
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center p-1">
                    <img
                      src={resolveEnigmaImageUrl(imageUrl)}
                      alt="Aperçu schéma"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{imageUrl}</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5 font-semibold">Aperçu en direct</div>
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
