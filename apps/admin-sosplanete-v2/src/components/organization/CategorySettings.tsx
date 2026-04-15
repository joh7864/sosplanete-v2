import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit3, Trash2, FolderOpen, Save, X, Image as ImageIcon, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Category {
  id: number;
  name: string;
  icon: string | null;
  order: number;
  _count?: { localActions: number };
}

function SortableCategoryItem({ 
  cat, 
  openEdit, 
  setDeleteConfirm 
}: { 
  cat: Category; 
  openEdit: (cat: Category) => void; 
  setDeleteConfirm: (id: number) => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/card">
      <GlassCard className={`p-6 border-none shadow-xl bg-white/90 flex flex-col items-center text-center transition-all ${isDragging ? 'ring-2 ring-emerald-500 shadow-2xl' : 'hover:scale-[1.02] border-2 border-transparent hover:border-emerald-100'}`}>
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="absolute top-4 left-4 p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing opacity-0 group-hover/card:opacity-100 transition-opacity"
        >
          <GripVertical size={20} />
        </div>

        <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-100 shadow-inner overflow-hidden">
          {cat.icon ? (
            <img src={getAssetUrl(`categories/${cat.icon}`) || ''} alt={cat.name} className="w-10 h-10 object-contain" />
          ) : (
            <FolderOpen size={24} className="text-emerald-500" />
          )}
        </div>
        <h3 className="font-black text-slate-800 text-lg mb-1">{cat.name}</h3>
        <div className="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 mb-2">
          {cat._count?.localActions || 0} actions au catalogue
        </div>

        <div className="flex items-center gap-2 mt-6 w-full pt-4 border-t border-slate-100">
          <button onClick={() => openEdit(cat)} className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 font-black text-[10px] uppercase tracking-widest transition-all">
            <Edit3 size={14} /> Modifier
          </button>
          <button onClick={() => setDeleteConfirm(cat.id)} className="w-11 py-2.5 flex items-center justify-center bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

export function CategorySettings({ instanceId }: { instanceId: number }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [order, setOrder] = useState('0');
  
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCategories();
  }, [instanceId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories?instanceId=${instanceId}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` }
      });
      if (resp.ok) setCategories(await resp.json());
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Sync with API
        syncOrder(newOrder);
        
        return newOrder;
      });
    }
  };

  const syncOrder = async (newOrder: Category[]) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`
        },
        body: JSON.stringify({
          instanceId,
          categoryIds: newOrder.map(c => c.id)
        })
      });
    } catch (e) {
      console.error('Erreur lors de la synchronisation du tri', e);
      fetchCategories(); // Rollback if error
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const url = selectedCat ? `${process.env.NEXT_PUBLIC_API_URL}/categories/${selectedCat.id}` : `${process.env.NEXT_PUBLIC_API_URL}/categories`;
    const method = selectedCat ? 'PATCH' : 'POST';
    const payload = {
      name,
      icon: icon.toLowerCase() || null,
      order: parseInt(order),
      instanceId,
    };

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
        body: JSON.stringify(payload),
      });
      setShowModal(false);
      fetchCategories();
    } catch (e) {} finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` }
      });
      fetchCategories();
    } catch (e) {} finally {
      setDeleteConfirm(null);
    }
  };

  const openNew = () => {
    setSelectedCat(null);
    setName('');
    setIcon('');
    setOrder('0');
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setSelectedCat(cat);
    setName(cat.name);
    setIcon(cat.icon || '');
    setOrder(cat.order.toString());
    setShowModal(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Configuration des catégories</h2>
          <p className="text-sm text-slate-500 mt-1">Gérez les catégories d'actions pour cette école.</p>
        </div>
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-6 py-3 h-auto shadow-lg shadow-emerald-500/20 text-[11px] font-black uppercase tracking-widest transition-all">
          <Plus size={18} className="mr-2" /> Nouvelle catégorie
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={categories.map(c => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <SortableCategoryItem 
                  key={cat.id} 
                  cat={cat} 
                  openEdit={openEdit} 
                  setDeleteConfirm={setDeleteConfirm} 
                />
              ))}
              {categories.length === 0 && (
                <div className="col-span-full py-10 text-center flex flex-col items-center">
                  <FolderOpen size={48} className="text-slate-200 mb-4" />
                  <p className="text-lg font-bold text-slate-400 font-black uppercase tracking-widest">Aucune catégorie</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-3xl relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">{selectedCat ? 'Modifier' : 'Nouvelle'} catégorie</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <Input label="Nom de la catégorie" value={name} onChange={(e) => setName(e.target.value)} required icon={<FolderOpen size={18} />} />
              <div className="space-y-1">
                <Input label="Nom du fichier icône (lowercase)" value={icon} onChange={(e) => setIcon(e.target.value.toLowerCase())} placeholder="ex: environnement.png" icon={<ImageIcon size={18} />} />
                <p className="text-[10px] text-slate-400 font-bold ml-1 italic">Les fichiers doivent être en minuscules dans ./uploads/categories/</p>
              </div>
              <Input label="Ordre d'affichage" type="number" value={order} onChange={(e) => setOrder(e.target.value)} icon={<Plus size={18} />} />
              
              <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 mt-4 transition-all active:scale-95">
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="mr-2" />} Enregistrer
              </Button>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDialog 
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteCategory(deleteConfirm)}
          title="Supprimer la catégorie ?"
          description="Cette action est irréversible. Les actions liées pourraient ne plus avoir de catégorie assignée."
        />
      )}
    </div>
  );
}
