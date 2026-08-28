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
  Leaf,
  Zap,
  Info,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAssetUrl } from '@/utils/assets';
import { LocalAction, Category } from '@/types';
import { getAuthData } from '@/utils/storage';

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
  const [activeTab, setActiveTab] = useState<'legacy' | 'evoe'>('legacy');

  // Champs SOS Planète (Local)
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  // Champs Évoé SF (Local)
  const [titreSF, setTitreSF] = useState('');
  const [descriptionSF, setDescriptionSF] = useState('');
  const [imageEvoe, setImageEvoe] = useState('');
  const [pointsIT, setPointsIT] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [uploadingLegacy, setUploadingLegacy] = useState(false);
  const [uploadingEvoe, setUploadingEvoe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputLegacyRef = React.useRef<HTMLInputElement>(null);
  const fileInputEvoeRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (action) {
      setLabel(action.label || '');
      setDescription(action.description || '');
      setImage(action.image || '');
      setImageEvoe(action.imageEvoe || '');
      setCategoryId(action.categoryId || null);

      setTitreSF(action.evoeMission?.titreSF || `Mission : ${action.label || ''}`);
      setDescriptionSF(action.evoeMission?.descriptionSF || action.description || '');
      setPointsIT(action.evoeMission?.pointsGagnes || action.evoeMission?.pointsIT || '');

      setError(null);
    }
  }, [action]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, folder: 'actions' | 'missions') => {
    const file = e.target.files?.[0];
    if (!file || !action) return;

    const isEvoe = folder === 'missions';
    if (isEvoe) setUploadingEvoe(true);
    else setUploadingLegacy(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = getAuthData('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-actions/${action.id}/image?folder=${folder}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const { filename } = await response.json();
        if (isEvoe) {
          setImageEvoe(filename);
        } else {
          setImage(filename);
        }
      } else {
        setError("Erreur lors de l'upload de l'image.");
      }
    } catch (e) {
      setError("Erreur réseau lors de l'upload.");
    } finally {
      if (isEvoe) setUploadingEvoe(false);
      else setUploadingLegacy(false);
      if (e.target) e.target.value = '';
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
          label: label.trim(),
          description: description.trim() || null,
          image: image.trim() || null,
          imageEvoe: imageEvoe.trim() || null,
          categoryId: categoryId ? Number(categoryId) : null,
          titreSF: titreSF.trim() || undefined,
          descriptionSF: descriptionSF.trim() || undefined,
          pointsIT: pointsIT !== '' ? Number(pointsIT) : undefined,
        })
      });

      if (response.ok) {
        onSave(await response.json());
        onClose();
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

  const legacyPreviewUrl = image 
    ? (image.startsWith('http') || image.startsWith('/') ? image : getAssetUrl(`actions/${image}`))
    : (action.actionRef?.image ? getAssetUrl(`actions/${action.actionRef.image}`) : getAssetUrl('logo.png'));

  const evoePreviewUrl = imageEvoe
    ? (imageEvoe.startsWith('http') || imageEvoe.startsWith('/') ? imageEvoe : getAssetUrl(`missions/${imageEvoe}`))
    : (action.actionRef?.imageEvoe ? getAssetUrl(`missions/${action.actionRef.imageEvoe}`) : legacyPreviewUrl);

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
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-inner font-black">
                 {action.actionRef?.code || <Settings2 size={20} />}
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tight">Personnaliser l'Action Locale</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                   Référence : <span className="text-emerald-600">{action.actionRef?.code}</span> — {action.actionRef?.referenceName}
                 </p>
              </div>
           </div>
           <button onClick={onClose} className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-800 transition-all">
              <X size={18} />
           </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('legacy')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all border-t border-x ${
              activeTab === 'legacy'
                ? 'bg-white text-emerald-700 border-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 border-transparent'
            }`}
          >
            <Leaf size={14} className={activeTab === 'legacy' ? 'text-emerald-500' : 'text-slate-400'} />
            <span>🌿 SOS Planète (Local)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evoe')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all border-t border-x ${
              activeTab === 'evoe'
                ? 'bg-slate-900 text-cyan-400 border-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 border-transparent'
            }`}
          >
            <Zap size={14} className={activeTab === 'evoe' ? 'text-cyan-400' : 'text-slate-400'} />
            <span>🚀 Évoé SF (Local)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[65vh]">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-2 text-rose-600 text-xs font-bold">
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}

          {activeTab === 'legacy' ? (
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6">
              {/* Image Legacy */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Image SOS Planète</span>
                <input 
                  type="file" 
                  ref={fileInputLegacyRef} 
                  onChange={(e) => handleFileUpload(e, 'actions')} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputLegacyRef.current?.click()}
                  className="aspect-square rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center relative group overflow-hidden shadow-inner cursor-pointer hover:border-emerald-300 transition-all"
                >
                  {uploadingLegacy ? (
                    <Loader2 className="animate-spin text-emerald-500" size={24} />
                  ) : (
                    <>
                      <img 
                        src={legacyPreviewUrl}
                        alt="Legacy"
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
                        onError={(e: any) => { 
                          e.target.onerror = null;
                          e.target.src = '/assets/logo.png'; 
                        }}
                      />
                      <div className="absolute inset-0 bg-emerald-600/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white p-2 text-center text-[10px] font-bold">
                        <Upload size={16} className="mb-1" />
                        <span>Changer</span>
                      </div>
                    </>
                  )}
                </div>
                {image && (
                  <button 
                    type="button"
                    onClick={() => setImage('')}
                    className="text-[9px] text-slate-400 hover:text-rose-500 font-bold"
                  >
                    Rétablir défaut
                  </button>
                )}
              </div>

              {/* Form Legacy */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 block">
                    Nom local de l'action
                  </label>
                  <Input 
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Nom de l'action pour vos élèves..."
                    className="font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 block">
                    Catégorie
                  </label>
                  <select 
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Sans catégorie --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 block">
                    Description d'aide aux élèves
                  </label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Conseils et explications pédagogiques..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6">
              {/* Image SF */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-cyan-600 tracking-widest">Image Évoé SF</span>
                <input 
                  type="file" 
                  ref={fileInputEvoeRef} 
                  onChange={(e) => handleFileUpload(e, 'missions')} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputEvoeRef.current?.click()}
                  className="aspect-square rounded-2xl bg-slate-900 border-2 border-cyan-900/60 flex items-center justify-center relative group overflow-hidden shadow-inner cursor-pointer hover:border-cyan-500 transition-all"
                >
                  {uploadingEvoe ? (
                    <Loader2 className="animate-spin text-cyan-400" size={24} />
                  ) : (
                    <>
                      <img 
                        src={evoePreviewUrl}
                        alt="SF"
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
                        onError={(e: any) => { e.target.src = legacyPreviewUrl; }}
                      />
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-cyan-400 p-2 text-center text-[10px] font-bold">
                        <Upload size={16} className="mb-1" />
                        <span>Changer SF</span>
                      </div>
                    </>
                  )}
                </div>
                {imageEvoe && (
                  <button 
                    type="button"
                    onClick={() => setImageEvoe('')}
                    className="text-[9px] text-slate-400 hover:text-rose-500 font-bold"
                  >
                    Rétablir défaut
                  </button>
                )}
              </div>

              {/* Form SF */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-cyan-700 tracking-widest mb-1 block">
                    Titre Futuriste (SF)
                  </label>
                  <Input 
                    value={titreSF}
                    onChange={(e) => setTitreSF(e.target.value)}
                    placeholder="Ex : Mission : Fusion de Plasma"
                    className="font-bold text-slate-800 border-cyan-200 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-cyan-700 tracking-widest mb-1 block">
                    Points IT (Surcharge locale)
                  </label>
                  <Input 
                    type="number"
                    value={pointsIT}
                    onChange={(e) => setPointsIT(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="Points IT accordés..."
                    className="font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-cyan-700 tracking-widest mb-1 block">
                    Briefing Narratif SF
                  </label>
                  <textarea 
                    value={descriptionSF}
                    onChange={(e) => setDescriptionSF(e.target.value)}
                    rows={3}
                    placeholder="Directive temporelle de mission..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info note */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex gap-3 items-center text-slate-600 text-xs">
            <Info size={18} className="text-emerald-500 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              Les indicateurs d'impacts de base (CO2e, Eau, Déchets) sont définis au niveau mondial dans le catalogue référentiel.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
           <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl text-xs">
             Annuler
           </Button>
           <Button 
            onClick={handleSave} 
            className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
            disabled={loading}
           >
             {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
             <span>Enregistrer les modifications</span>
           </Button>
        </div>
      </motion.div>
    </div>
  );
};
