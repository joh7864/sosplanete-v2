'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  Power
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
} from '@/utils/easterEggApi';
import { EasterEggFormModal } from './EasterEggFormModal';

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
      return { label: 'Facile', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'MEDIUM':
      return { label: 'Moyen', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'HARD':
      return { label: 'Difficile', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'LEGENDARY':
      return { label: 'Légendaire', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    default:
      return { label: diff, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

interface SortableEggCardProps {
  egg: EasterEggCatalogItem;
  index: number;
  onEdit: (egg: EasterEggCatalogItem) => void;
  onDelete: (egg: EasterEggCatalogItem) => void;
  onToggleActive: (egg: EasterEggCatalogItem) => void;
}

function SortableEggCard({
  egg,
  index,
  onEdit,
  onDelete,
  onToggleActive,
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

  return (
    <div ref={setNodeRef} style={style} className="relative group/card">
      <GlassCard
        className={`p-5 bg-white/95 border transition-all rounded-3xl ${
          isDragging
            ? 'border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
            : egg.isActive
            ? 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
            : 'border-slate-200/60 opacity-60 bg-slate-50/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Drag Handle & Order Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              {...attributes}
              {...listeners}
              className="p-2 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing rounded-xl hover:bg-slate-100 transition-colors"
              title="Glisser pour réordonner la priorité de passage"
            >
              <GripVertical size={20} />
            </div>

            <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-black text-sm text-slate-700 shadow-xs">
              #{index + 1}
            </div>
          </div>

          {/* Thumbnail if present */}
          {egg.imageUrl && (
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 hidden sm:flex items-center justify-center p-1 shadow-xs">
              <img
                src={resolveEnigmaImageUrl(egg.imageUrl)}
                alt={egg.title}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Enigma Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-black text-slate-800 truncate">{egg.title}</h3>
              <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 font-bold">
                {egg.code}
              </span>
            </div>

            <p className="text-xs text-slate-500 line-clamp-1 mb-2">
              {egg.crypticMessage || 'Pas de message cryptique'}
            </p>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Trigger */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold">
                <TriggerIcon size={12} className="text-emerald-600" />
                {getTriggerLabel(egg.triggerType)}
              </span>

              {/* Difficulty */}
              <span
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border ${diffBadge.color}`}
              >
                {diffBadge.label}
              </span>

              {/* Points IT */}
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black font-mono">
                +{egg.rewardPointsIT} IT
              </span>

              {/* 2nd Hint delay */}
              {egg.explicitHint && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold"
                  title={egg.explicitHint}
                >
                  <Clock size={11} />
                  Indice à {formatDelay(egg.hintDelayMinutes || 120)}
                </span>
              )}

              {/* Expected answer */}
              {egg.expectedAnswer && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-mono">
                  Code : <strong className="text-slate-800">{egg.expectedAnswer}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Action buttons (Icon Buttons with Tooltips) */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
            {/* Active Toggle */}
            <IconButtonWithTooltip
              tooltip={egg.isActive ? 'Énigme active (cliquer pour désactiver)' : 'Énigme désactivée (cliquer pour activer)'}
              variant={egg.isActive ? 'primary' : 'subtle'}
              size="md"
              onClick={() => onToggleActive(egg)}
            >
              <Power size={16} />
            </IconButtonWithTooltip>

            {/* Edit Button */}
            <IconButtonWithTooltip
              tooltip="Modifier cette énigme"
              variant="default"
              size="md"
              onClick={() => onEdit(egg)}
            >
              <Edit3 size={16} />
            </IconButtonWithTooltip>

            {/* Delete Button */}
            <IconButtonWithTooltip
              tooltip="Supprimer définitivement l’énigme"
              tooltipPosition="top"
              tooltipAlign="end"
              variant="danger"
              size="md"
              onClick={() => onDelete(egg)}
            >
              <Trash2 size={16} />
            </IconButtonWithTooltip>
          </div>
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
  const [editingEgg, setEditingEgg] = useState<EasterEggCatalogItem | null>(null);
  const [eggToDelete, setEggToDelete] = useState<EasterEggCatalogItem | null>(null);
  const [reordering, setReordering] = useState(false);
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
      setFeedback({ type: 'success', message: `Énigme "${eggToDelete.title}" supprimée.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la suppression.' });
    } finally {
      setEggToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Toolbar: Search + Create Button (Icon with Tooltip) */}
      <div className="flex items-center justify-between gap-4">
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

        {/* Global Create Button with Tooltip */}
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

      {/* Reorder instructions banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-emerald-600" />
          <span>
            Glissez-déposez les cartes pour <strong>prioriser l’ordre de parution</strong>. Si un œuf n’est pas résolu,
            il sera reconduit automatiquement.
          </span>
        </div>
        {reordering && (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] shrink-0">
            <Loader2 size={12} className="animate-spin" />
            Sauvegarde...
          </span>
        )}
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
            Aucune énigme n'a été créée pour le moment. Cliquez sur le bouton + pour inaugurer la saison.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredCatalog.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filteredCatalog.map((egg, idx) => (
                <SortableEggCard
                  key={egg.id}
                  egg={egg}
                  index={idx}
                  onEdit={(e) => {
                    setEditingEgg(e);
                    setIsFormOpen(true);
                  }}
                  onDelete={(e) => setEggToDelete(e)}
                  onToggleActive={handleToggleActive}
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
    </div>
  );
}
