import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layout, Palette, Trash2, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: { name: string; color: string };
  isNew?: boolean;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  isNew = false
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setColor(initialData?.color || 'var(--color-sky)');
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ name, color });
      onClose();
    } catch (error) {
      console.error('Error saving group:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { name: 'Mint', value: 'var(--color-mint)' },
    { name: 'Sky', value: 'var(--color-sky)' },
    { name: 'Peach', value: 'var(--color-peach)' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {isNew ? 'Créer un groupe' : 'Paramètres du groupe'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Gestion opérationnelle du groupe
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  <Layout size={12} /> Nom du groupe
                </label>
                <input 
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: CM1 Neyron, Groupe Bleus..."
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  <Palette size={12} /> Couleur d'accentuation
                </label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center border-2 ${color === c.value ? 'border-emerald-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c.value }}
                    >
                      {color === c.value && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                {!isNew && onDelete && (
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={onDelete}
                    className="h-14 px-6 rounded-2xl text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={20} />
                  </Button>
                )}
                
                <Button 
                  type="submit"
                  isLoading={loading}
                  className="h-14 flex-1 rounded-2xl bg-slate-900 text-white shadow-xl hover:translate-y-[-2px] transition-all"
                >
                  <Save size={18} className="mr-2" />
                  {isNew ? "Créer le groupe" : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
