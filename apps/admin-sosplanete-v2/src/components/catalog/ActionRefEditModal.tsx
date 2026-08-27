'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  Zap,
  Leaf,
  Cloud,
  Droplets,
  Star,
  RefreshCw,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAssetUrl } from '@/utils/assets';
import { ActionRef } from '@/types';
import { getAuthData } from '@/utils/storage';

interface ActionRefEditModalProps {
  action: ActionRef | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ActionRef) => void;
  onDelete?: (id: number) => void;
}

export const ActionRefEditModal: React.FC<ActionRefEditModalProps> = ({ 
  action, 
  isOpen, 
  onClose, 
  onSave,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'legacy' | 'evoe'>('legacy');
  
  // Champs SOS Planète (Legacy)
  const [referenceName, setReferenceName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [weightedStars, setWeightedStars] = useState(2);
  const [defaultCo2, setDefaultCo2] = useState<number>(0);
  const [defaultWater, setDefaultWater] = useState<number>(0);
  const [defaultWaste, setDefaultWaste] = useState<number>(0);
  const [defaultEnergy, setDefaultEnergy] = useState<number>(0);
  const [image, setImage] = useState('');

  // Champs Évoé (SF)
  const [titreSF, setTitreSF] = useState('');
  const [descriptionSF, setDescriptionSF] = useState('');
  const [imageEvoe, setImageEvoe] = useState('');
  const [pointsIT, setPointsIT] = useState<number | ''>('');
  const [isManualIT, setIsManualIT] = useState(false);

  // État UI
  const [loading, setLoading] = useState(false);
  const [uploadingLegacy, setUploadingLegacy] = useState(false);
  const [uploadingEvoe, setUploadingEvoe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputLegacyRef = React.useRef<HTMLInputElement>(null);
  const fileInputEvoeRef = React.useRef<HTMLInputElement>(null);

  // Calcul automatique des points IT d'après les indicateurs d'impact
  const calculatedIT = useMemo(() => {
    const total = (Number(defaultCo2) || 0) + (Number(defaultWater) || 0) + (Number(defaultWaste) || 0);
    const rounded = Math.round(total);
    return rounded > 0 ? rounded : 10;
  }, [defaultCo2, defaultWater, defaultWaste]);

  useEffect(() => {
    if (action) {
      setReferenceName(action.referenceName || '');
      setCategory(action.category || 'Général');
      setDescription(action.description || '');
      setWeightedStars(action.weightedStars ?? 2);
      setDefaultCo2(action.defaultCo2 ?? 0);
      setDefaultWater(action.defaultWater ?? 0);
      setDefaultWaste(action.defaultWaste ?? 0);
      setDefaultEnergy(action.defaultEnergy ?? 0);
      setImage(action.image || '');
      setImageEvoe(action.imageEvoe || '');

      // Évoé defaults
      setTitreSF(`Mission : ${action.referenceName || ''}`);
      setDescriptionSF(action.description || '');
      
      const autoIT = Math.round((action.defaultCo2 ?? 0) + (action.defaultWater ?? 0) + (action.defaultWaste ?? 0));
      setPointsIT(autoIT > 0 ? autoIT : 10);
      setIsManualIT(false);

      setError(null);
      setSuccess(false);
    }
  }, [action]);

  if (!isOpen || !action) return null;

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, folder: 'actions' | 'missions') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isEvoe = folder === 'missions';
    if (isEvoe) setUploadingEvoe(true);
    else setUploadingLegacy(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = getAuthData('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref/upload-image?folder=${folder}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de l’upload.');
      }

      const result = await res.json();
      if (isEvoe) {
        setImageEvoe(result.filename);
      } else {
        setImage(result.filename);
      }
    } catch (err: any) {
      setError(err.message || 'Impossible d’uploader le fichier.');
    } finally {
      if (isEvoe) setUploadingEvoe(false);
      else setUploadingLegacy(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = getAuthData('access_token');
      const payload = {
        referenceName: referenceName.trim(),
        category: category.trim(),
        description: description.trim() || null,
        weightedStars: Number(weightedStars) || 1,
        defaultCo2: Number(defaultCo2) || 0,
        defaultWater: Number(defaultWater) || 0,
        defaultWaste: Number(defaultWaste) || 0,
        defaultEnergy: Number(defaultEnergy) || 0,
        image: image.trim() || null,
        imageEvoe: imageEvoe.trim() || null,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref/${action.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la mise à jour.');
      }

      const updated = await res.json();
      setSuccess(true);
      setTimeout(() => {
        onSave(updated);
        onClose();
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // Helper pour obtenir la bonne URL de prévisualisation
  const legacyPreviewUrl = image 
    ? (image.startsWith('http') || image.startsWith('/') ? image : getAssetUrl(`actions/${image}`))
    : getAssetUrl('logo-sosplanete.png');

  const evoePreviewUrl = imageEvoe
    ? (imageEvoe.startsWith('http') || imageEvoe.startsWith('/') ? imageEvoe : getAssetUrl(`missions/${imageEvoe}`))
    : legacyPreviewUrl;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-md">
                {action.code}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Édition de l'Action & Mission
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    Référentiel Global
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {referenceName || action.referenceName}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/80 px-6 pt-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('legacy')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs transition-all border-t border-x ${
                activeTab === 'legacy'
                  ? 'bg-white text-emerald-700 border-slate-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 border-transparent'
              }`}
            >
              <Leaf size={16} className={activeTab === 'legacy' ? 'text-emerald-500' : 'text-slate-400'} />
              <span>🌿 Univers SOS Planète (Réel)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('evoe')}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs transition-all border-t border-x ${
                activeTab === 'evoe'
                  ? 'bg-slate-900 text-cyan-400 border-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 border-transparent'
              }`}
            >
              <Zap size={16} className={activeTab === 'evoe' ? 'text-cyan-400' : 'text-slate-400'} />
              <span>🚀 Univers Évoé (Futuriste / SF)</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 text-xs font-bold">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-600 text-xs font-bold">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>Action mise à jour avec succès !</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form Controls Column */}
              <div className="md:col-span-8 flex flex-col gap-4">
                
                {/* 🌿 ONGLET SOS PLANÈTE */}
                {activeTab === 'legacy' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        Libellé Réel de l'Action
                      </label>
                      <Input 
                        value={referenceName}
                        onChange={(e) => setReferenceName(e.target.value)}
                        placeholder="Ex : Éteindre la lumière quand on quitte la pièce"
                        required
                        className="font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                          Catégorie
                        </label>
                        <Input 
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="Ex : Électricité, Déchets, Eau..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                          Niveau d'Étoiles (1 à 5 ★)
                        </label>
                        <div className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-white">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setWeightedStars(star)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star 
                                size={18}
                                className={star <= weightedStars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                              />
                            </button>
                          ))}
                          <span className="ml-auto text-xs font-black text-slate-500">{weightedStars} / 5</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        Description Pédagogique (Monde Réel)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Explications pédagogiques et bienfaits pour la planète..."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium text-slate-700 resize-none transition-all"
                      />
                    </div>

                    {/* Indicateurs d'Impacts Éditables */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Leaf size={14} className="text-emerald-500" /> Indicateurs d'Économie (Hebdomadaires)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            CO2e (kg)
                          </label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={defaultCo2}
                            onChange={(e) => setDefaultCo2(parseFloat(e.target.value) || 0)}
                            className="text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Eau (Litres)
                          </label>
                          <Input 
                            type="number"
                            step="1"
                            value={defaultWater}
                            onChange={(e) => setDefaultWater(parseFloat(e.target.value) || 0)}
                            className="text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Déchets (kg)
                          </label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={defaultWaste}
                            onChange={(e) => setDefaultWaste(parseFloat(e.target.value) || 0)}
                            className="text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Énergie (kWh)
                          </label>
                          <Input 
                            type="number"
                            step="0.1"
                            value={defaultEnergy}
                            onChange={(e) => setDefaultEnergy(parseFloat(e.target.value) || 0)}
                            className="text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Image SOS Planète */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        Visuel SOS Planète (Dossier : uploads/actions/)
                      </label>
                      <div className="flex gap-2">
                        <Input 
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          placeholder="ex: B01.png ou custom-123.jpg"
                          className="font-mono text-xs"
                        />
                        <input 
                          type="file" 
                          ref={fileInputLegacyRef}
                          onChange={(e) => handleUploadImage(e, 'actions')}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fileInputLegacyRef.current?.click()}
                          disabled={uploadingLegacy}
                          className="shrink-0 flex items-center gap-1 text-xs"
                        >
                          {uploadingLegacy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          <span>Téléverser</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 🚀 ONGLET ÉVOÉ */}
                {activeTab === 'evoe' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                        Titre de la Mission Futuriste (SF)
                      </label>
                      <Input 
                        value={titreSF}
                        onChange={(e) => setTitreSF(e.target.value)}
                        placeholder="Ex : Mission : Furtivité Énergétique"
                        className="font-bold text-slate-800 border-cyan-200 focus:border-cyan-500"
                      />
                    </div>

                    {/* Points IT (Impulsions Temporelles) */}
                    <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col gap-2 shadow-lg shadow-cyan-950/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-cyan-400" />
                          <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                            Points IT (Impulsions Temporelles)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50">
                          {isManualIT ? 'Surcharge Manuelle' : 'Calcul Automatique'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex-1">
                          <Input 
                            type="number"
                            value={isManualIT ? pointsIT : calculatedIT}
                            onChange={(e) => {
                              setIsManualIT(true);
                              setPointsIT(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                            }}
                            className="bg-slate-800 border-slate-700 text-cyan-400 font-black text-lg"
                          />
                        </div>

                        {isManualIT && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setIsManualIT(false);
                              setPointsIT(calculatedIT);
                            }}
                            className="shrink-0 flex items-center gap-1.5 text-xs bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                          >
                            <RefreshCw size={12} />
                            <span>Calcul Auto ({calculatedIT} IT)</span>
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Formule par défaut : (CO2e {defaultCo2}kg + Eau {defaultWater}L + Déchets {defaultWaste}kg) = <strong className="text-cyan-300">{calculatedIT} IT</strong>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                        Briefing Narratif SF (Lore de l'Arche)
                      </label>
                      <textarea
                        value={descriptionSF}
                        onChange={(e) => setDescriptionSF(e.target.value)}
                        rows={3}
                        placeholder="Une anomalie spatio-temporelle fait trembler les fondations de l'Arche ! Pour stabiliser la matrice..."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-xs font-medium text-slate-700 resize-none transition-all"
                      />
                    </div>

                    {/* Image Évoé SF */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                        Visuel Évoé SF (Dossier : uploads/missions/)
                      </label>
                      <div className="flex gap-2">
                        <Input 
                          value={imageEvoe}
                          onChange={(e) => setImageEvoe(e.target.value)}
                          placeholder="ex: B01_evoe.png ou custom-sf-123.jpg"
                          className="font-mono text-xs"
                        />
                        <input 
                          type="file" 
                          ref={fileInputEvoeRef}
                          onChange={(e) => handleUploadImage(e, 'missions')}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fileInputEvoeRef.current?.click()}
                          disabled={uploadingEvoe}
                          className="shrink-0 flex items-center gap-1 text-xs"
                        >
                          {uploadingEvoe ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          <span>Téléverser SF</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Live Preview Column */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <Sparkles size={12} /> Aperçu Direct ({activeTab === 'legacy' ? 'SOS Planète' : 'Évoé SF'})
                </span>

                {/* Card Preview Container */}
                <div className="w-full max-w-[220px]">
                  {activeTab === 'legacy' ? (
                    /* Carte Legacy */
                    <div className="flex flex-col h-[280px] rounded-2xl border-2 border-emerald-300 bg-white/90 shadow-xl overflow-hidden text-slate-800">
                      <div className="p-2 flex justify-between items-center text-[9px] font-bold uppercase text-slate-600 bg-emerald-50/50">
                        <span className="truncate">{category || 'Référence'}</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={8} 
                              className={i < weightedStars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 p-2 flex items-center justify-center overflow-hidden bg-white">
                        <img 
                          src={legacyPreviewUrl} 
                          alt="Preview" 
                          className="max-h-[100px] w-auto object-contain"
                          onError={(e: any) => { e.target.src = '/assets/logo-sosplanete.png'; }}
                        />
                      </div>

                      <div className="px-2 pb-1 text-center">
                        <h4 className="text-[10px] font-bold text-slate-800 line-clamp-2">{referenceName || 'Titre action'}</h4>
                      </div>

                      <div className="p-2 pt-1 bg-slate-50 border-t border-slate-100 text-[8px] font-bold text-slate-500 flex flex-col gap-0.5">
                        <div className="flex justify-between"><span>CO2e</span><span className="text-slate-800">{defaultCo2} kg</span></div>
                        <div className="flex justify-between"><span>Eau</span><span className="text-slate-800">{defaultWater} L</span></div>
                        <div className="flex justify-between"><span>Déchets</span><span className="text-slate-800">{defaultWaste} kg</span></div>
                      </div>
                    </div>
                  ) : (
                    /* Carte Évoé SF */
                    <div className="flex flex-col h-[280px] rounded-2xl border-2 border-cyan-500 bg-slate-950 text-white shadow-2xl shadow-cyan-950/40 overflow-hidden">
                      <div className="p-2 flex justify-between items-center text-[9px] font-bold uppercase text-cyan-300 bg-slate-900/80 border-b border-cyan-900/50">
                        <span className="truncate">Secteur SF</span>
                        <div className="flex items-center gap-1 bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/60 font-black">
                          <Zap size={9} />
                          <span>{isManualIT ? pointsIT : calculatedIT} IT</span>
                        </div>
                      </div>

                      <div className="flex-1 p-2 flex items-center justify-center overflow-hidden bg-slate-900/50 relative">
                        <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 to-transparent pointer-events-none" />
                        <img 
                          src={evoePreviewUrl} 
                          alt="SF Preview" 
                          className="max-h-[100px] w-auto object-contain z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                          onError={(e: any) => { e.target.src = legacyPreviewUrl; }}
                        />
                      </div>

                      <div className="px-2 pb-1 text-center">
                        <h4 className="text-[10px] font-black text-cyan-300 line-clamp-2">{titreSF || 'Mission SF'}</h4>
                      </div>

                      <div className="p-2 pt-1 bg-slate-900/90 border-t border-cyan-900/40 text-[8px] font-medium text-slate-400 flex flex-col gap-0.5">
                        <span className="line-clamp-2 text-slate-300">{descriptionSF || 'Briefing de mission...'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'action ${action.code} du catalogue global ?`)) {
                      onDelete(action.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 text-xs font-black transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={16} />
                  <span>Supprimer l'action</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Annuler
                </Button>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black flex items-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Enregistrer l'action</span>
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
