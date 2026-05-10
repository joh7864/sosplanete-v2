'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  Search, Loader2, FolderOpen, Tag, Check, X, ArrowRight, LayoutGrid, List, Filter
} from 'lucide-react';
import { getAuthData } from '@/utils/storage';
import { LocalAction } from '@/types';

// Interface minimale compatible avec le type Category local de CategorySettings
interface CategoryLike {
  id: number;
  name: string;
  icon?: string | null;
  order: number;
}

interface ActionCategoryMapperProps {
  instanceId: number;
  schoolYear: string;
  categories: CategoryLike[];
  onMappingChanged?: () => void;
}

// ── Draggable action chip ─────────────────────────────────────────────────────
function DraggableActionChip({
  action,
  isSelected,
  onSelect,
}: {
  action: LocalAction;
  isSelected: boolean;
  onSelect: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: action.id,
    data: { type: 'action', action },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={`group flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all cursor-grab active:cursor-grabbing select-none
        ${isSelected ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30'}`}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(action.id); }}
        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-emerald-500 text-white' : 'border border-slate-200 bg-white'}`}
      >
        {isSelected && <Check size={10} strokeWidth={3} />}
      </button>

      {/* Drag handle + label */}
      <span {...attributes} {...listeners} className="flex-grow truncate text-xs">
        <span className="text-emerald-600 font-black mr-1">{action.actionRef?.code}</span>
        {action.label}
      </span>
    </div>
  );
}

// ── Droppable category zone ───────────────────────────────────────────────────
function DroppableCategoryZone({
  category,
  actions,
  onRemoveAction,
}: {
  category: CategoryLike | null;
  actions: LocalAction[];
  onRemoveAction: (actionId: number) => void;
}) {
  const id = category ? `cat-${category.id}` : 'cat-null';
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 min-h-[80px] rounded-2xl border-2 p-3 transition-all
        ${isOver ? 'border-emerald-400 bg-emerald-50 scale-[1.01]' : 'border-slate-100 bg-slate-50/50'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <FolderOpen size={12} className="text-emerald-600" />
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
          {category ? category.name : 'Sans catégorie'}
        </span>
        <span className="ml-auto text-[10px] font-black text-slate-300 shrink-0">{actions.length}</span>
      </div>

      {/* Actions in this category */}
      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {actions.map(action => (
            <div
              key={action.id}
              className="group/chip flex items-center gap-1 pl-2 pr-1 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600 hover:border-rose-200 hover:text-rose-500 transition-all"
            >
              <span className="text-emerald-500 font-black">{action.actionRef?.code}</span>
              <span className="max-w-[80px] truncate">{action.label}</span>
              <button
                onClick={() => onRemoveAction(action.id)}
                className="opacity-0 group-hover/chip:opacity-100 w-4 h-4 rounded flex items-center justify-center hover:bg-rose-50 transition-all"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex items-center justify-center h-12 rounded-xl border-dashed border-2 transition-all
          ${isOver ? 'border-emerald-300 text-emerald-400' : 'border-slate-100 text-slate-200'}`}>
          <ArrowRight size={16} />
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ActionCategoryMapper({ instanceId, schoolYear, categories, onMappingChanged }: ActionCategoryMapperProps) {
  const [localActions, setLocalActions] = useState<LocalAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeAction, setActiveAction] = useState<LocalAction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnassigned, setFilterUnassigned] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    fetchActions();
  }, [instanceId, schoolYear]);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const token = getAuthData('access_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/local-actions?instanceId=${instanceId}&schoolYear=${schoolYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setLocalActions(await res.json());
    } catch (e) {
      console.error('[ActionCategoryMapper] fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const assignCategory = async (actionIds: number[], categoryId: number | null) => {
    setSaving(true);
    try {
      const token = getAuthData('access_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-actions/bulk-assign-category`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ actionIds, categoryId }),
      });
      // Optimistic update
      setLocalActions(prev => prev.map(a =>
        actionIds.includes(a.id) ? { ...a, categoryId } : a
      ));
      setSelectedIds([]);
      onMappingChanged?.();
    } catch (e) {
      console.error('[ActionCategoryMapper] assign error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const action = localActions.find(a => a.id === event.active.id);
    setActiveAction(action || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveAction(null);
    const { over, active } = event;
    if (!over) return;

    const overId = over.id as string;
    let targetCategoryId: number | null = null;

    if (overId.startsWith('cat-')) {
      const catIdStr = overId.replace('cat-', '');
      targetCategoryId = catIdStr === 'null' ? null : parseInt(catIdStr, 10);
    } else {
      return;
    }

    const draggedId = active.id as number;
    const idsToAssign = selectedIds.includes(draggedId) ? selectedIds : [draggedId];
    assignCategory(idsToAssign, targetCategoryId);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredActions = useMemo(() => {
    let result = localActions;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.label.toLowerCase().includes(q) || a.actionRef?.code?.toLowerCase().includes(q)
      );
    }
    if (filterUnassigned) {
      result = result.filter(a => !a.categoryId);
    }
    return result;
  }, [localActions, searchQuery, filterUnassigned]);

  // Group actions by category for the right panel
  const actionsByCategory = useMemo(() => {
    const groups = new Map<number | null, LocalAction[]>();
    groups.set(null, []);
    categories.forEach(c => groups.set(c.id, []));
    localActions.forEach(a => {
      const key = a.categoryId ?? null;
      if (!groups.has(key)) groups.set(null, [...(groups.get(null) || []), a]);
      else groups.get(key)!.push(a);
    });
    return groups;
  }, [localActions, categories]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex-grow">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Rechercher une action..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            onClick={() => setFilterUnassigned(!filterUnassigned)}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterUnassigned ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            <Filter size={12} /> Non classées
          </button>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
              <span className="text-[10px] font-black text-slate-500">{selectedIds.length} sélectionnée(s)</span>
              <select
                onChange={e => {
                  const val = e.target.value;
                  assignCategory(selectedIds, val === 'null' ? null : parseInt(val, 10));
                  e.target.value = '';
                }}
                defaultValue=""
                disabled={saving}
                className="h-9 px-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black border-none outline-none cursor-pointer"
              >
                <option value="" disabled>Affecter à...</option>
                <option value="null">— Sans catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                onClick={() => setSelectedIds([])}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {saving && <Loader2 size={16} className="animate-spin text-emerald-500 shrink-0" />}
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-[300px_1fr] gap-4 items-start">

          {/* Left panel — Action list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions à classer</span>
              <span className="text-[10px] font-bold text-slate-300">{filteredActions.length}/{localActions.length}</span>
            </div>
            <div className="p-3 flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto">
              {filteredActions.map(action => (
                <DraggableActionChip
                  key={action.id}
                  action={action}
                  isSelected={selectedIds.includes(action.id)}
                  onSelect={toggleSelect}
                />
              ))}
              {filteredActions.length === 0 && (
                <div className="py-8 text-center text-slate-300 text-xs font-bold">
                  {searchQuery || filterUnassigned ? 'Aucun résultat' : 'Aucune action dans ce catalogue'}
                </div>
              )}
            </div>
          </div>

          {/* Right panel — Category zones */}
          <div className="flex flex-col gap-3">
            {/* Unassigned zone */}
            <DroppableCategoryZone
              category={null}
              actions={actionsByCategory.get(null) || []}
              onRemoveAction={(id) => assignCategory([id], null)}
            />
            {/* Category zones */}
            {categories.map(cat => (
              <DroppableCategoryZone
                key={cat.id}
                category={cat}
                actions={actionsByCategory.get(cat.id) || []}
                onRemoveAction={(id) => assignCategory([id], null)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeAction && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-2xl shadow-emerald-500/30 cursor-grabbing">
            <Tag size={12} />
            <span className="opacity-80 mr-1">{activeAction.actionRef?.code}</span>
            {activeAction.label}
            {selectedIds.length > 1 && selectedIds.includes(activeAction.id) && (
              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-md">+{selectedIds.length - 1}</span>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
