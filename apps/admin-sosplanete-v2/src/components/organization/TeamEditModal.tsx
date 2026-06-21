'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Trash2, Upload, RefreshCw, Palette } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';

interface TeamEditModalProps {
  isOpen?: boolean;
  team?: any | null;
  instanceId: number;
  schoolYear: string;
  instanceYearId?: number | null;
  onClose: () => void;
  onUpdate: () => void;
}

const PRESET_COLORS = [
  '#D1FAE5', // Emerald-100
  '#E0F2FE', // Sky-100
  '#FFEDD5', // Orange-100
  '#F3E8FF', // Purple-100
  '#FCE7F3', // Pink-100
  '#FEF3C7', // Amber-100
  '#40916C', // Vert forêt
  '#1D4ED8', // Bleu roi
  '#DC2626', // Rouge
  '#7C3AED', // Violet
  '#D97706', // Ambre
  '#0F766E', // Teal
];

export const TeamEditModal: React.FC<TeamEditModalProps> = ({
  isOpen,
  team,
  instanceId,
  schoolYear,
  instanceYearId,
  onClose,
  onUpdate,
}) => {
  const [name, setName]         = useState(team?.name || '');
  const [color, setColor]       = useState(team?.color || PRESET_COLORS[0]);
  const [icon, setIcon]         = useState<string>(team?.icon || '');
  const [whatsappInviteUrl, setWhatsappInviteUrl] = useState(team?.whatsappInviteUrl || '');
  const [whatsappGroupId, setWhatsappGroupId]     = useState(team?.whatsappGroupId || '');
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [availableIcons, setAvailableIcons] = useState<string[]>([]);
  const [iconsLoading, setIconsLoading]     = useState(false);
  const [iconPreview, setIconPreview]       = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger la liste des icônes disponibles côté serveur
  useEffect(() => {
    const loadIcons = async () => {
      setIconsLoading(true);
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/icons`, {
          headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
        });
        if (resp.ok) {
          const files: string[] = await resp.json();
          setAvailableIcons(files);
        }
      } catch { /* silently fail */ }
      finally { setIconsLoading(false); }
    };
    loadIcons();
  }, []);

  // Calculer la preview de l'icône courante
  useEffect(() => {
    if (icon) {
      // Si c'est un vrai nom de fichier (avec extension), construire l'URL
      const hasExt = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(icon);
      if (hasExt) {
        setIconPreview(getAssetUrl(`teams/${icon.split('/').pop()}`));
      } else {
        setIconPreview(''); // ancienne valeur type 'leaf' — invalide, on ignore
      }
    } else {
      setIconPreview('');
    }
  }, [icon]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/upload-icon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
        body: formData,
      });
      if (resp.ok) {
        const { filename } = await resp.json();
        setIcon(filename);
        setAvailableIcons(prev => [filename, ...prev]);
      }
    } catch { /* silently fail */ }
    finally { setUploading(false); }
  };

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
          schoolYear,
          instanceYearId: instanceYearId ? Number(instanceYearId) : undefined,
          whatsappInviteUrl,
          whatsappGroupId,
        }),
      });
      if (resp.ok) { onUpdate(); onClose(); }
    } catch (err) {
      console.error('Save team error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('⚠️ Supprimer cette équipe et tous ses groupes/joueurs ?')) return;
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) { onUpdate(); onClose(); }
    } catch (err) {
      console.error('Delete team error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
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
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <GlassCard padding="none" className="overflow-hidden border-none shadow-2xl">
          {/* Barre de couleur dynamique */}
          <div className="h-2 w-full transition-colors duration-300" style={{ backgroundColor: color }} />

          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-7">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                  {team ? "Modifier l'équipe" : 'Nouvelle Équipe'}
                </h2>
                <p className="text-slate-500 font-medium mt-1">Identité visuelle de l'équipe.</p>
              </div>
              <button type="button" onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom de l'équipe</label>
              <Input
                placeholder="Ex: Les Gardiens de la Terre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-base font-bold"
                autoFocus
                required
              />
            </div>

            {/* Icône */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Icône de l'équipe</label>

              {/* Preview + Upload */}
              <div className="flex items-center gap-6">
                <div 
                  className="relative group cursor-pointer w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-emerald-400 flex items-center justify-center overflow-hidden shrink-0 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                  ) : iconPreview ? (
                    <>
                      <img src={iconPreview} alt="icône" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <Upload size={20} />
                      <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight px-1">Upload</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-sm font-bold text-slate-800">Image de l'équipe</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] leading-relaxed">
                    Cliquez sur l'image pour uploader. Formats acceptés : PNG, JPG, WebP. Taille max : 2 Mo.
                  </p>
                  {icon && (
                    <button type="button" onClick={() => setIcon('')} className="mt-2 w-max flex items-center gap-1 text-[11px] font-bold text-rose-500/70 hover:text-rose-500 transition-colors">
                      <X size={12} /> Retirer l'image
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp,.gif" className="hidden" onChange={handleUpload} />
              </div>

              {/* Galerie des icônes existantes */}
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <RefreshCw size={9} /> Bibliothèque d'icônes
                </p>
                {iconsLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs"><Loader2 size={14} className="animate-spin" /> Chargement...</div>
                ) : (
                  <div className="grid grid-cols-8 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                    {availableIcons.map(filename => {
                      const url = getAssetUrl(`teams/${filename}`);
                      const isSelected = icon === filename;
                      return (
                        <button
                          key={filename}
                          type="button"
                          onClick={() => setIcon(filename)}
                          title={filename}
                          className={`aspect-square rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${
                            isSelected ? 'border-emerald-500 ring-2 ring-emerald-300 scale-110' : 'border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <img src={url} alt={filename} className="w-full h-full object-contain p-1 bg-white" />
                        </button>
                      );
                    })}
                    {availableIcons.length === 0 && (
                      <p className="col-span-8 text-[11px] text-slate-400">Aucune icône disponible. Uploadez-en une ci-dessus.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Couleur */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Palette size={11} /> Couleur d'accent
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-9 h-9 rounded-full border-2 transition-all relative flex items-center justify-center ${
                      color === c ? 'ring-4 ring-emerald-500/20 scale-110 border-white shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                  </button>
                ))}

                {/* Color picker natif */}
                <div className="relative flex items-center gap-2 ml-1">
                  <label
                    title="Couleur personnalisée"
                    className="w-9 h-9 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors overflow-hidden"
                    style={{ backgroundColor: PRESET_COLORS.includes(color) ? 'transparent' : color }}
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    {PRESET_COLORS.includes(color)
                      ? <Palette size={14} className="text-slate-400" />
                      : <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                    }
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">{color}</span>
                </div>
              </div>
            </div>

            {/* Liaison WhatsApp Équipe */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 bg-sky-50 px-3 py-1 rounded-full w-fit">
                Liaison WhatsApp Équipe
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lien d'invitation du groupe</label>
                  <Input
                    placeholder="https://chat.whatsapp.com/..."
                    value={whatsappInviteUrl}
                    onChange={(e) => setWhatsappInviteUrl(e.target.value)}
                    className="h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID du groupe WhatsApp</label>
                  <Input
                    placeholder="Ex: 120363212891234567@g.us"
                    value={whatsappGroupId}
                    onChange={(e) => setWhatsappGroupId(e.target.value)}
                    className="h-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex gap-3">
              {team && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-3.5 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all disabled:opacity-50"
                  title="Supprimer l'équipe"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-2xl border-slate-200 text-slate-600" onClick={onClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-[2] h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 text-white font-black uppercase tracking-widest text-sm"
                disabled={loading || !name}
              >
                {loading ? <Loader2 className="animate-spin" /> : team ? 'Enregistrer' : "Créer l'équipe"}
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};
