'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Leaf, 
  Wind, 
  Sun, 
  Droplets, 
  Mountain, 
  Globe, 
  Users, 
  Palette,
  Loader2,
  Trash2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

interface TeamEditModalProps {
  team?: any | null;
  instanceId: number;
  onClose: () => void;
  onUpdate: () => void;
}

const PASTEL_COLORS = [
  { name: 'Menthe', value: '#D1FAE5' }, // Emerald-100
  { name: 'Ciel', value: '#E0F2FE' },   // Sky-100
  { name: 'Pêche', value: '#FFEDD5' },  // Orange-100
  { name: 'Lilas', value: '#F3E8FF' },  // Purple-100
  { name: 'Rose', value: '#FCE7F3' },   // Pink-100
  { name: 'Sable', value: '#FEF3C7' },  // Amber-100
];

const ICONS = [
  { id: 'leaf', icon: <Leaf size={24} />, name: 'Nature' },
  { id: 'wind', icon: <Wind size={24} />, name: 'Air' },
  { id: 'sun', icon: <Sun size={24} />, name: 'Énergie' },
  { id: 'drop', icon: <Droplets size={24} />, name: 'Eau' },
  { id: 'mountain', icon: <Mountain size={24} />, name: 'Sommet' },
  { id: 'globe', icon: <Globe size={24} />, name: 'Planète' },
];

export const TeamEditModal: React.FC<TeamEditModalProps> = ({ 
  team, 
  instanceId, 
  onClose, 
  onUpdate 
}) => {
  const [name, setName] = useState(team?.name || '');
  const [color, setColor] = useState(team?.color || PASTEL_COLORS[0].value);
  const [icon, setIcon] = useState(team?.icon || 'leaf');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = team 
      ? `${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/teams`;
    
    const method = team ? 'PATCH' : 'POST';

    try {
      const resp = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({
          name,
          color,
          icon,
          instanceId: Number(instanceId),
        }),
      });

      if (resp.ok) {
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error('Save team error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("⚠️ ATTENTION : Supprimer cette équipe entraînera la suppression définitive de TOUS les groupes et joueurs associés. Voulez-vous continuer ?")) {
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
      });

      if (resp.ok) {
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error('Delete team error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg"
      >
        <GlassCard padding="none" className="overflow-hidden border-none shadow-2xl">
          {/* Header avec couleur dynamique */}
          <div className="h-2 w-full transition-colors duration-500" style={{ backgroundColor: color }} />
          
          <form onSubmit={handleSubmit} className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                  {team ? 'Modifier l\'équipe' : 'Nouvelle Équipe'}
                </h2>
                <p className="text-slate-500 font-medium">Configurez l'identité visuelle de ce groupe.</p>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Nom */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Nom de l'équipe
                </label>
                <Input 
                  placeholder="Ex: Les Gardiens de la Terre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-lg font-bold"
                  autoFocus
                  required
                />
              </div>

              {/* Sélection d'Icône */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   Icône thématique
                </label>
                <div className="grid grid-cols-6 gap-3">
                   {ICONS.map((item) => (
                     <button
                        key={item.id}
                        type="button"
                        onClick={() => setIcon(item.id)}
                        className={`aspect-square flex items-center justify-center rounded-2xl border-2 transition-all ${icon === item.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200 scale-110' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}
                        title={item.name}
                     >
                        {item.icon}
                     </button>
                   ))}
                </div>
              </div>

              {/* Sélection de Couleur */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   Couleur d'accent (Pastel)
                </label>
                <div className="flex flex-wrap gap-4">
                   {PASTEL_COLORS.map((c) => (
                     <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`w-10 h-10 rounded-full border-2 transition-all relative flex items-center justify-center ${color === c.value ? 'ring-4 ring-emerald-500/10 scale-110 border-white shadow-md' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c.value }}
                     >
                        {color === c.value && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                     </button>
                   ))}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 flex gap-4">
              {team && (
                <button 
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-4 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all flex items-center justify-center disabled:opacity-50"
                  title="Supprimer l'équipe"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-600"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                className="flex-[2] h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 text-white font-black uppercase tracking-widest text-sm"
                disabled={loading || !name}
              >
                {loading ? <Loader2 className="animate-spin" /> : team ? 'Enregistrer les modifications' : 'Créer l\'équipe'}
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};
