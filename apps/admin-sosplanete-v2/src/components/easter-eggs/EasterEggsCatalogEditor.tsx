'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical,
  Plus,
  Search,
  Edit3,
  Trash2,
  Sparkles,
  Clock,
  KeyRound,
  Terminal,
  MousePointer,
  Gamepad2,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  RotateCcw,
  Download,
  Upload,
  Check,
  CheckSquare,
  Square,
  X,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { GlassCard } from '@/components/ui/GlassCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButtonWithTooltip } from '@/components/ui/IconButtonWithTooltip';
import {
  EasterEggCatalogItem,
  fetchAdminCatalog,
  deleteAdminEgg,
  reorderAdminCatalog,
  updateAdminEgg,
  resolveEnigmaImageUrl,
  resetAdminEggProgress,
  exportAdminCatalog,
} from '@/utils/easterEggApi';
import { EasterEggFormModal } from './EasterEggFormModal';
import { EasterEggImportModal } from './EasterEggImportModal';
import { EggGlyphIcon } from './EggGlyphIcon';

function formatDelay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function getTriggerIcon(type: string) {
  switch (type) {
    case 'RIDDLE_ANSWER_INPUT':
      return KeyRound;
    case 'KONAMI_CODE':
      return Gamepad2;
    case 'COMM_LINK_COMMAND':
      return Terminal;
    case 'CLICK_REPEATED':
      return MousePointer;
    case 'SCREEN_EDGE':
      return Maximize2;
    default:
      return Sparkles;
  }
}

function getTriggerLabel(type: string) {
  switch (type) {
    case 'RIDDLE_ANSWER_INPUT':
      return 'Saisie de Réponse / PIN';
    case 'KONAMI_CODE':
      return 'Code Konami';
    case 'COMM_LINK_COMMAND':
      return 'Commande Comm-Link';
    case 'CLICK_REPEATED':
      return 'Multi-clics (3D / Carte)';
    case 'SCREEN_EDGE':
      return 'Constellation 3D / Étoiles';
    case 'LOGO_HOLD':
      return 'Maintien Logo (3s)';
    case 'METRIC_SEQUENCE':
      return 'Séquence Profil';
    default:
      return type;
  }
}

function getDifficultyBadge(diff: string) {
  switch (diff) {
    case 'EASY':
      return { label: 'Facile', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/90' };
    case 'MEDIUM':
      return { label: 'Moyen', color: 'bg-amber-50 text-amber-700 border-amber-200/90' };
    case 'HARD':
      return { label: 'Difficile', color: 'bg-rose-50 text-rose-700 border-rose-200/90' };
    case 'LEGENDARY':
      return { label: 'Légendaire', color: 'bg-purple-50 text-purple-700 border-purple-200/90' };
    default:
      return { label: diff, color: 'bg-slate-100 text-slate-700 border-slate-200/90' };
  }
}

function getSpecialRewardBadge(specialReward?: string) {
  if (!specialReward || specialReward === 'NONE') return null;

  if (specialReward === 'CHRONO_EGG') {
    return {
      label: 'Chrono-Egg',
      icon: '⚡',
      color: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
      tooltip: 'Artefact Méta-Énigme : Outil Chrono-Egg',
    };
  }

  if (specialReward === 'ROSETTA_STONE') {
    return {
      label: 'Pierre de Rosette 2070',
      icon: '📜',
      color: 'bg-indigo-50 text-indigo-900 border-indigo-200 font-bold',
      tooltip: 'Artefact Méta-Énigme : Table de décodage des symboles runiques',
    };
  }

  if (specialReward.startsWith('ARCADE_GAME:')) {
    const gameKey = specialReward.replace('ARCADE_GAME:', '');
    const title = gameKey === 'space-invaders' ? 'Space Invaders' : gameKey;
    return {
      label: `Mini-jeu : ${title}`,
      icon: '🎮',
      color: 'bg-purple-50 text-purple-900 border-purple-200 font-bold',
      tooltip: `Mini-jeu d'arcade débloqué : ${title}`,
    };
  }

  return {
    label: specialReward,
    icon: '🎁',
    color: 'bg-slate-50 text-slate-700 border-slate-200 font-bold',
    tooltip: `Artefact spécial : ${specialReward}`,
  };
}

function getPrerequisiteBadge(prerequisiteType?: string, config?: any) {
  const isFree = !prerequisiteType || prerequisiteType === 'NONE';
  if (isFree) {
    return {
      label: 'Accès libre',
      icon: Unlock,
      badgeBg: 'bg-emerald-100 text-emerald-700 border-2 border-white shadow-xs',
      tooltip: 'Accès libre',
    };
  }

  let detailTooltip = 'Pré-requis obligatoire';
  if (prerequisiteType === 'MISSIONS_COUNT') {
    const count = config?.requiredCount ?? '';
    detailTooltip = count ? `Pré-requis : ${count} missions` : 'Pré-requis obligatoire';
  } else if (prerequisiteType === 'SPECIFIC_MISSIONS') {
    detailTooltip = 'Missions requises';
  }

  return {
    label: 'Pré-requis',
    icon: Lock,
    badgeBg: 'bg-indigo-100 text-indigo-700 border-2 border-white shadow-xs',
    tooltip: detailTooltip,
  };
}

interface SortableEggCardProps {
  egg: EasterEggCatalogItem;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onEdit: (egg: EasterEggCatalogItem) => void;
  onDelete: (egg: EasterEggCatalogItem) => void;
  onToggleActive: (egg: EasterEggCatalogItem) => void;
  onReset: (egg: EasterEggCatalogItem) => void;
}

function SortableEggCard({
  egg,
  index,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onToggleActive,
  onReset,
}: SortableEggCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: egg.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  const TriggerIcon = getTriggerIcon(egg.triggerType);
  const diffBadge = getDifficultyBadge(egg.complexity);
  const prereqBadge = getPrerequisiteBadge(egg.prerequisiteType, egg.prerequisiteConfig);
  const PrereqIcon = prereqBadge.icon;
  const rewardBadge = getSpecialRewardBadge(egg.specialReward);

  return (
    <div ref={setNodeRef} style={style} className="relative group/card h-full">
      <GlassCard
        className={`pt-2.5 pb-3 px-2.5 rounded-2xl transition-all relative flex flex-col justify-between border-t-4 border h-full ${
          isDragging
            ? 'border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
            : isSelected
            ? 'border-t-emerald-600 bg-emerald-50/20 border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
            : !egg.isActive
            ? 'border-t-slate-400 bg-slate-50/60 opacity-60 border-slate-200/80'
            : 'border-t-emerald-500 bg-white/95 border-slate-200/80 hover:border-emerald-300 hover:shadow-md'
        }`}
      >
        <div className="space-y-2.5">
          {/* Top Header Row : Rapproché du haut et des bords latéraux */}
          <div className="flex items-center justify-between gap-1 w-full -mt-0.5">
            {/* Gauche : Poignée de drag & drop + Badge d'ordre #X */}
            <div className="flex items-center gap-1 shrink-0">
              <div
                {...attributes}
                {...listeners}
                className="p-0.5 -ml-1 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing rounded hover:bg-slate-100 transition-colors"
                title="Glisser pour réordonner"
              >
                <GripVertical size={13} />
              </div>

              <span className="font-mono font-bold text-[11px] text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                #{index + 1}
              </span>
            </div>

            {/* Droite : Badge IT pastel + Case à cocher */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                +{egg.rewardPointsIT} IT
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(egg.id);
                }}
                className={`w-5 h-5 -mr-0.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-700 border-slate-700 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-300 hover:border-indigo-400 text-transparent'
                }`}
                title={isSelected ? 'Désélectionner' : 'Sélectionner'}
              >
                <Check size={12} className={isSelected ? 'stroke-[3]' : 'opacity-0'} />
              </button>
            </div>
          </div>

          {/* Icone / Illustration centrale avec conteneur spacieux et pastille Cadenas Pastel */}
          <div className="flex items-center justify-center py-0.5">
            <div className="relative group/glyph">
              <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-slate-100 border border-slate-200/80 flex items-center justify-center shadow-inner group-hover/card:scale-105 transition-transform overflow-hidden">
                <EggGlyphIcon easterEggId={egg.id} size="md" className="text-emerald-600" />
              </div>

              {/* Pastille cadenas pastel (Accès libre 🔓 ou Pré-requis 🔒) en haut à droite */}
              <div className="absolute -top-1.5 -right-1.5 z-20 group/padlock">
                <div
                  className={`w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-help ${prereqBadge.badgeBg}`}
                >
                  <PrereqIcon size={12} strokeWidth={2.4} className="shrink-0" />
                </div>

                {/* Tooltip sombre positionné au-dessus et orienté vers l'intérieur (ne déborde jamais) */}
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover/padlock:flex flex-col items-end z-30 pointer-events-none">
                  <div className="relative bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap border border-slate-800">
                    <div className="absolute right-2 -bottom-1 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-800" />
                    <span className="relative z-10">{prereqBadge.tooltip}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Titre uniquement (ID technique supprimé) */}
          <div className="text-center px-1">
            <h4
              className="text-xs font-black text-slate-900 line-clamp-2 h-8 leading-snug uppercase tracking-tight"
              title={egg.title}
            >
              {egg.title}
            </h4>
          </div>

          {/* Badges de métadonnées compacts sous forme de pilules pastel */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 border-t border-slate-100">
            {/* Difficulté pastel */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-2xs ${diffBadge.color}`}
            >
              {diffBadge.label}
            </span>

            {/* Trigger pastel */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100/90 text-slate-600 border border-slate-200/80 text-[9px] font-bold shadow-2xs">
              <TriggerIcon size={10} className="text-slate-500 shrink-0" />
              <span className="truncate max-w-[105px]">{getTriggerLabel(egg.triggerType)}</span>
            </span>

            {/* Récompense spéciale si présente */}
            {rewardBadge && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] border ${rewardBadge.color}`}
                title={rewardBadge.tooltip}
              >
                <span>{rewardBadge.icon}</span>
              </span>
            )}
          </div>
        </div>

        {/* Barre d'actions inférieure : 4 boutons regroupés et centrés horizontalement */}
        <div
          className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toggle Actif/Inactif */}
          <IconButtonWithTooltip
            tooltip={egg.isActive ? 'Désactiver' : 'Activer'}
            tooltipPosition="top"
            tooltipAlign="center"
            variant={egg.isActive ? 'primary' : 'subtle'}
            size="sm"
            onClick={() => onToggleActive(egg)}
          >
            <Power size={13} />
          </IconButtonWithTooltip>

          {/* Bouton Réinitialiser */}
          <IconButtonWithTooltip
            tooltip="Réinitialiser progression"
            tooltipPosition="top"
            tooltipAlign="center"
            variant="amber"
            size="sm"
            onClick={() => onReset(egg)}
          >
            <RotateCcw size={13} />
          </IconButtonWithTooltip>

          {/* Bouton Modifier */}
          <IconButtonWithTooltip
            tooltip="Modifier cette énigme"
            tooltipPosition="top"
            tooltipAlign="center"
            variant="default"
            size="sm"
            onClick={() => onEdit(egg)}
          >
            <Edit3 size={13} />
          </IconButtonWithTooltip>

          {/* Bouton Supprimer */}
          <IconButtonWithTooltip
            tooltip="Supprimer définitivement"
            tooltipPosition="top"
            tooltipAlign="center"
            variant="danger"
            size="sm"
            onClick={() => onDelete(egg)}
          >
            <Trash2 size={13} />
          </IconButtonWithTooltip>
        </div>
      </GlassCard>
    </div>
  );
}

export function EasterEggsCatalogEditor() {
  const [catalog, setCatalog] = useState<EasterEggCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingEgg, setEditingEgg] = useState<EasterEggCatalogItem | null>(null);
  const [eggToDelete, setEggToDelete] = useState<EasterEggCatalogItem | null>(null);
  const [eggToReset, setEggToReset] = useState<EasterEggCatalogItem | null>(null);
  const [isResetSelectionConfirmOpen, setIsResetSelectionConfirmOpen] = useState(false);
  const [isResetAllConfirmOpen, setIsResetAllConfirmOpen] = useState(false);
  const [selectedEggIds, setSelectedEggIds] = useState<number[]>([]);
  const [reordering, setReordering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCatalog();
      setCatalog(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors du chargement du catalogue.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog;
    const q = searchQuery.toLowerCase();
    return catalog.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.triggerType.toLowerCase().includes(q)
    );
  }, [catalog, searchQuery]);

  // Multi-selection helpers
  const handleToggleSelect = (id: number) => {
    setSelectedEggIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEggIds.length === filteredCatalog.length) {
      setSelectedEggIds([]);
    } else {
      setSelectedEggIds(filteredCatalog.map((e) => e.id));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = catalog.findIndex((item) => item.id === active.id);
    const newIndex = catalog.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(catalog, oldIndex, newIndex);
    setCatalog(newItems);

    setReordering(true);
    try {
      const orderedIds = newItems.map((e) => e.id);
      await reorderAdminCatalog(orderedIds);
      setFeedback({ type: 'success', message: 'Ordre de passage des énigmes mis à jour !' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Erreur lors de la sauvegarde de l’ordre.' });
      loadCatalog();
    } finally {
      setReordering(false);
    }
  };

  const handleToggleActive = async (egg: EasterEggCatalogItem) => {
    try {
      const updated = await updateAdminEgg(egg.id, { isActive: !egg.isActive });
      setCatalog(catalog.map((e) => (e.id === egg.id ? updated : e)));
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Erreur lors du changement de statut.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!eggToDelete) return;
    try {
      await deleteAdminEgg(eggToDelete.id);
      setCatalog(catalog.filter((e) => e.id !== eggToDelete.id));
      setSelectedEggIds((prev) => prev.filter((id) => id !== eggToDelete.id));
      setFeedback({ type: 'success', message: `Énigme "${eggToDelete.title}" supprimée.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la suppression.' });
    } finally {
      setEggToDelete(null);
    }
  };

  // Export Catalogue JSON
  const handleExportCatalog = async () => {
    setExporting(true);
    try {
      const data = await exportAdminCatalog();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nowStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `easter-eggs-catalog-${nowStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({
        type: 'success',
        message: `Catalogue exporté avec succès (${data.length} énigmes exportées en JSON).`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || "Erreur lors de l'export du catalogue." });
    } finally {
      setExporting(false);
    }
  };

  // Reset Actions
  const handleResetSingleConfirm = async () => {
    if (!eggToReset) return;
    setResetting(true);
    try {
      await resetAdminEggProgress({ easterEggIds: [eggToReset.id] });
      setFeedback({
        type: 'success',
        message: `Progression de l'énigme "${eggToReset.title}" réinitialisée (comme si non résolue).`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la réinitialisation.' });
    } finally {
      setResetting(false);
      setEggToReset(null);
    }
  };

  const handleResetSelectionConfirm = async () => {
    if (selectedEggIds.length === 0) return;
    setResetting(true);
    try {
      await resetAdminEggProgress({ easterEggIds: selectedEggIds });
      setFeedback({
        type: 'success',
        message: `Progression réinitialisée avec succès pour les ${selectedEggIds.length} énigme(s) sélectionnée(s).`,
      });
      setSelectedEggIds([]);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la réinitialisation groupée.' });
    } finally {
      setResetting(false);
      setIsResetSelectionConfirmOpen(false);
    }
  };

  const handleResetAllConfirm = async () => {
    setResetting(true);
    try {
      await resetAdminEggProgress({ all: true });
      setFeedback({
        type: 'success',
        message: `Toutes les énigmes du jeu ont été réinitialisées pour l'ensemble des joueurs et des équipes.`,
      });
      setSelectedEggIds([]);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la réinitialisation générale.' });
    } finally {
      setResetting(false);
      setIsResetAllConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1220px] w-full mx-auto px-2 sm:px-4">
      {/* Top Toolbar: Search + Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une énigme par titre, code ou type..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
          />
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Exporter Catalogue */}
          <IconButtonWithTooltip
            tooltip="Exporter tout le catalogue au format JSON"
            tooltipPosition="bottom"
            tooltipAlign="center"
            variant="default"
            size="lg"
            disabled={exporting || catalog.length === 0}
            onClick={handleExportCatalog}
          >
            {exporting ? <Loader2 size={18} className="animate-spin text-emerald-600" /> : <Download size={18} />}
          </IconButtonWithTooltip>

          {/* Importer Catalogue */}
          <IconButtonWithTooltip
            tooltip="Importer un catalogue depuis un fichier JSON"
            tooltipPosition="bottom"
            tooltipAlign="center"
            variant="default"
            size="lg"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload size={18} />
          </IconButtonWithTooltip>

          {/* Tout réinitialiser */}
          <IconButtonWithTooltip
            tooltip="Réinitialiser TOUS les Easter Eggs (comme non résolus)"
            tooltipPosition="bottom"
            tooltipAlign="center"
            variant="amber"
            size="lg"
            disabled={resetting || catalog.length === 0}
            onClick={() => setIsResetAllConfirmOpen(true)}
          >
            <RotateCcw size={18} />
          </IconButtonWithTooltip>

          {/* Créer une énigme */}
          <IconButtonWithTooltip
            tooltip="Créer une nouvelle énigme"
            tooltipPosition="bottom"
            tooltipAlign="end"
            variant="primary-solid"
            size="lg"
            onClick={() => {
              setEditingEgg(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={20} />
          </IconButtonWithTooltip>
        </div>
      </div>

      {/* Multi-Selection Action Bar (appears when eggs are selected) */}
      <AnimatePresence>
        {selectedEggIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-xl flex flex-wrap items-center justify-between gap-3 border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                {selectedEggIds.length} sélectionnée(s)
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-slate-300 hover:text-white underline underline-offset-2 transition-colors"
              >
                {selectedEggIds.length === filteredCatalog.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsResetSelectionConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition-colors"
              >
                <RotateCcw size={14} />
                Réinitialiser la sélection ({selectedEggIds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedEggIds([])}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Fermer la sélection"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reorder instructions banner & Select All Shortcut */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical size={16} className="text-emerald-600 shrink-0" />
          <span className="truncate">
            Glissez-déposez les cartes pour <strong>prioriser l’ordre de parution</strong>. Si un œuf n’est pas résolu,
            il sera reconduit automatiquement.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {filteredCatalog.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
            >
              {selectedEggIds.length === filteredCatalog.length && filteredCatalog.length > 0 ? (
                <>
                  <CheckSquare size={14} className="text-emerald-600" />
                  Tout désélectionner
                </>
              ) : (
                <>
                  <Square size={14} />
                  Tout sélectionner
                </>
              )}
            </button>
          )}

          {reordering && (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] shrink-0">
              <Loader2 size={12} className="animate-spin" />
              Sauvegarde...
            </span>
          )}
        </div>
      </div>

      {/* Feedback banner */}
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
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* Catalog List with DnD */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-emerald-600" size={36} />
          <span className="text-xs font-bold text-slate-500">Chargement du catalogue...</span>
        </div>
      ) : catalog.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <Sparkles size={36} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-800">Catalogue vide</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Aucune énigme n'a été créée pour le moment. Cliquez sur le bouton + pour inaugurer la saison ou importez un catalogue JSON.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredCatalog.map((e) => e.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
              {filteredCatalog.map((egg, idx) => (
                <SortableEggCard
                  key={egg.id}
                  egg={egg}
                  index={idx}
                  isSelected={selectedEggIds.includes(egg.id)}
                  onToggleSelect={handleToggleSelect}
                  onEdit={(e) => {
                    setEditingEgg(e);
                    setIsFormOpen(true);
                  }}
                  onDelete={(e) => setEggToDelete(e)}
                  onToggleActive={handleToggleActive}
                  onReset={(e) => setEggToReset(e)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal Form */}
      <EasterEggFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEgg(null);
        }}
        onSuccess={loadCatalog}
        enigmaToEdit={editingEgg}
      />

      {/* Modal Import Catalog */}
      <EasterEggImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          loadCatalog();
          setFeedback({
            type: 'success',
            message: 'Catalogue importé avec succès !',
          });
          setTimeout(() => setFeedback(null), 4000);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(eggToDelete)}
        onClose={() => setEggToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer cette énigme ?"
        description={`Êtes-vous sûr de vouloir supprimer définitivement l’énigme "${eggToDelete?.title}" (${eggToDelete?.code}) du catalogue ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />

      {/* Reset Single Egg Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(eggToReset)}
        onClose={() => setEggToReset(null)}
        onConfirm={handleResetSingleConfirm}
        title="Réinitialiser cette énigme ?"
        description={`Voulez-vous réinitialiser l'énigme "${eggToReset?.title}" (${eggToReset?.code}) comme si elle n'avait JAMAIS été résolue ? Les découvertes des joueurs et récompenses d'équipe seront supprimées.`}
        confirmLabel="Réinitialiser l'énigme"
        cancelLabel="Annuler"
        variant="warning"
      />

      {/* Reset Selection Confirmation */}
      <ConfirmDialog
        isOpen={isResetSelectionConfirmOpen}
        onClose={() => setIsResetSelectionConfirmOpen(false)}
        onConfirm={handleResetSelectionConfirm}
        title="Réinitialiser la sélection d'énigmes ?"
        description={`Voulez-vous réinitialiser les ${selectedEggIds.length} énigme(s) sélectionnée(s) comme si elles n'avaient jamais été résolues ? Toutes les découvertes et récompenses associées seront remises à zéro.`}
        confirmLabel={`Réinitialiser les ${selectedEggIds.length} énigme(s)`}
        cancelLabel="Annuler"
        variant="warning"
      />

      {/* Reset ALL Eggs Confirmation */}
      <ConfirmDialog
        isOpen={isResetAllConfirmOpen}
        onClose={() => setIsResetAllConfirmOpen(false)}
        onConfirm={handleResetAllConfirm}
        title="Réinitialiser TOUTES les énigmes ?"
        description="ATTENTION : Cette action va réinitialiser l'intégralité des Easter Eggs du jeu pour tous les joueurs et toutes les équipes (découvertes, récompenses et artefacts Oméga). Le catalogue d'énigmes reste intact."
        confirmLabel="Tout réinitialiser à zéro"
        cancelLabel="Annuler"
        variant="danger"
      />
    </div>
  );
}
