'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Trash2, 
  Image as ImageIcon, 
  Type, 
  AlignLeft, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Settings2,
  ExternalLink,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAssetUrl } from '@/utils/assets';

import { ActionRef, LocalAction, Category } from '@/types';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

interface LocalActionEditModalProps {
  action: LocalAction | null;
  categories?: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: LocalAction) => void;
}

export const LocalActionEditModal: React.FC<LocalActionEditModalProps> = ({ 
  action, 
  categories = [],
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (action) {
      setLabel(action.label || '');
      setDescription(action.description || '');
      setImage(action.image || '');
      setCategoryId(action.categoryId || null);
      setError(null);
    }
  }, [action]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !action) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = getAuthData('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-actions/${action.id}/image`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const { url } = await response.json();
        setImage(url);
      } else {
        setError("Erreur lors de l'upload de l'image.");
      }
    } catch (e) {
      setError("Erreur réseau lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!action) return;
    setLoading(true);
    setError(null);

    try {
      const token = getAuthData('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-actions/${action.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          label,
          description: description || undefined,
          image: image || undefined,
          categoryId: categoryId ? Number(categoryId) : null
        })
      });

      if (response.ok) {
        onSave(await response.json());
      } else {
        setError("Erreur lors de l'enregistrement.");
      }
    } catch (e) {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-inner">
                 <Settings2 size={24} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight">Personnaliser l'Action</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                   Référence : <span className="text-emerald-500">{action.actionRef.code}</span>
                 </p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-800 transition-all">
              <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
           
           <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-8">
              {/* Preview & Image Selection */}
              <div className="flex flex-col gap-3">
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Icône / Image</span>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileUpload} 
                   accept="image/*" 
                   className="hidden" 
                 />
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="aspect-square rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center relative group overflow-hidden shadow-inner cursor-pointer hover:border-emerald-300 transition-all"
                 >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                        <span className="text-[10px] font-black text-emerald-500 uppercase">Envoi...</span>
                      </div>
                    ) : (
                      <>
                        <img 
                          src={image || (action.actionRef.image ? getAssetUrl(`actions/${action.actionRef.image}`) : getAssetUrl('logo-sosplanete.png'))}
                          className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).src = getAssetUrl('logo-sosplanete.png'); }}
                        />
                        <div className="absolute inset-0 bg-emerald-500/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white p-4 text-center">
                           <ImageIcon size={24} className="mb-2" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Changer l'image</span>
                        </div>
                      </>
                    )}
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setImage('')} 
                   className="text-[9px] h-7 uppercase font-black tracking-widest text-slate-400 hover:text-rose-500"
                 >
                   Rétablir par défaut
                 </Button>
              </div>

              {/* Form Fields */}
              <div className="flex flex-col gap-6">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 flex items-center gap-2">
                       <Type size={12} className="text-emerald-500" /> Libellé court (Nom)
                    </label>
                    <Input 
                      placeholder="Nom de l'action pour vos élèves..." 
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="h-14 bg-slate-50 border-none rounded-2xl text-lg font-black text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner"
                    />
                 </div>

                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 flex items-center gap-2">
                       <Settings2 size={12} className="text-emerald-500" /> Catégorie de l'Action
                    </label>
                    <select 
                      value={categoryId || ''}
                      onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner appearance-none outline-none"
                    >
                      <option value="">-- Sans catégorie --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                 </div>

                 <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                         <AlignLeft size={12} className="text-emerald-500" /> Description d'aide (longue)
                      </label>
                      <button 
                        onClick={() => setIsPreview(!isPreview)}
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all ${isPreview ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {isPreview ? 'Éditer' : 'Aperçu HTML'}
                      </button>
                    </div>
                    
                    {isPreview ? (
                      <div 
                        className="w-full min-h-[120px] p-5 bg-emerald-50/30 border-2 border-emerald-100/50 rounded-2xl prose-sos overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: description || '<p class="italic text-slate-400">Aucune description...</p>' }}
                      />
                    ) : (
                      <textarea 
                        placeholder="Expliquez l'action en quelques lignes pour aider les élèves à comprendre... (HTML autorisé)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full min-h-[120px] p-5 bg-slate-50 border-none rounded-2xl text-sm text-slate-600 font-medium focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner resize-none overflow-y-auto"
                      />
                    )}
                 </div>
              </div>
           </div>

           {/* Info alert about fixed fields */}
           <div className="mt-4 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                 <Info size={20} />
              </div>
              <div>
                 <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                   Les <span className="font-black text-emerald-700">étoiles</span> et les <span className="font-black text-emerald-700">impacts</span> (CO2, Eau, Déchets) sont définis au niveau mondial par SOS Planète et ne peuvent pas être modifiés localement.
                 </p>
              </div>
           </div>

           {error && <div className="text-rose-500 text-[10px] font-bold text-center">{error}</div>}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
           <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-2xl">Annuler</Button>
           <Button 
            onClick={handleSave} 
            className="h-14 px-12 bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
            disabled={loading}
           >
             {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} className="mr-2" /> Mettre à jour</>}
           </Button>
        </div>
      </motion.div>
    </div>
  );
};
