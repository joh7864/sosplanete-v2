import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Key, Trash2, Save, Eye, EyeOff, Upload, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { getAuthData } from '@/utils/storage';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    pseudo: string; 
    password?: string; 
    isDelegate?: boolean;
    gender?: string | null;
    birthDate?: string | null;
    avatar?: string | null;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: { 
    pseudo: string; 
    password?: string; 
    isDelegate?: boolean;
    gender?: string | null;
    birthDate?: string | null;
    avatar?: string | null;
  };
  isNew?: boolean;
}

export const EditPlayerModal: React.FC<EditPlayerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  isNew = false
}) => {
  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHashed, setIsHashed] = useState(false);
  const [isDelegate, setIsDelegate] = useState(false);
  
  // Nouveaux états
  const [gender, setGender] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/children/upload-avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
        body: formData,
      });
      if (resp.ok) {
        const { filename } = await resp.json();
        setAvatar(filename);
      } else {
        console.error('Error uploading avatar:', resp.statusText);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPseudo(initialData?.pseudo || '');
      const rawPass = initialData?.password || '';
      
      // Détection du hash bcrypt ($2b$10$...)
      const hashed = rawPass.startsWith('$2b$') || rawPass.startsWith('$2a$');
      setIsHashed(hashed);
      
      // Si c'est un hash, on ne l'affiche pas dans l'input pour ne pas polluer l'UI
      setPassword(hashed ? '' : rawPass);
      setShowPassword(false);
      setIsDelegate(initialData?.isDelegate || false);
      setGender(initialData?.gender || null);
      
      const rawBirth = initialData?.birthDate || '';
      setBirthDate(rawBirth ? rawBirth.substring(0, 10) : '');
      setAvatar(initialData?.avatar || null);
      setShowAvatarPicker(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: { 
        pseudo: string; 
        password?: string; 
        isDelegate?: boolean;
        gender: string | null;
        birthDate: string | null;
        avatar: string | null;
      } = { 
        pseudo, 
        isDelegate,
        gender: gender || null,
        birthDate: birthDate || null,
        avatar: avatar || null
      };
      if (password && password.trim() !== '') {
        payload.password = password;
      }
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error('Error saving player:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011/api/v1')
    .replace('/api/v1', '')
    .replace('/api', '')
    .replace(/\/+$/, '');

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
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  {isNew ? 'Nouvel Équipier' : 'Profil Joueur'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Accès et Identification
                </p>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Avatar Selector Group */}
              <div className="flex flex-col items-center gap-2 pb-2 border-b border-slate-100/80">
                <div 
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="group/avatar relative w-20 h-20 rounded-full bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400 transition-all"
                >
                  {avatar ? (
                    <img 
                      src={`${cleanApiUrl}/static/${avatar}`} 
                      alt="Player avatar" 
                      className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover/avatar:text-emerald-500 transition-colors text-center p-2">
                      <span className="text-2xl font-black">{pseudo ? pseudo[0].toUpperCase() : '?'}</span>
                      <span className="text-[7px] font-black uppercase tracking-wider mt-1 opacity-70">Auto</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-white text-[9px] font-bold uppercase transition-all backdrop-blur-[1px]">
                    Modifier
                  </div>
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cliquez pour choisir un avatar</span>
              </div>

              {/* Avatar Picker Section */}
              <AnimatePresence>
                {showAvatarPicker && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-50 rounded-2xl border border-slate-100 p-4"
                  >
                    {/* Option Upload Avatar */}
                    <div className="flex items-center gap-4 mb-4 p-3 bg-white rounded-xl border border-slate-100">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden hover:border-emerald-400 hover:bg-emerald-50/30 transition-all shrink-0"
                      >
                        {uploading ? (
                          <Loader2 size={16} className="animate-spin text-emerald-500" />
                        ) : (
                          <Upload size={16} className="text-slate-400 hover:text-emerald-500" />
                        )}
                      </button>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Avatar personnalisé</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">PNG, JPG, WebP (Max 2 Mo)</span>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarUpload} 
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Choisir un avatar 3D</span>
                      {avatar && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setAvatar(null);
                            setShowAvatarPicker(false);
                          }}
                          className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                        >
                          Rétablir auto
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-6 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                      {Array.from({ length: 39 }, (_, i) => {
                        const idxStr = (i + 1).toString().padStart(2, '0');
                        const file = `avatars_3D/avatar_${idxStr}.png`;
                        const url = `${cleanApiUrl}/static/${file}`;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setAvatar(file);
                              setShowAvatarPicker(false);
                            }}
                            className={`w-10 h-10 rounded-xl bg-white border flex items-center justify-center overflow-hidden hover:scale-105 hover:border-emerald-400 transition-all ${avatar === file ? 'ring-2 ring-emerald-500 border-transparent shadow-md' : 'border-slate-100'}`}
                            title={`Avatar ${idxStr}`}
                          >
                            <img src={url} alt={`Avatar ${idxStr}`} className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pseudonyme */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  <User size={12} /> Pseudonyme
                </label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <span className="text-lg font-black italic">@</span>
                  </div>
                  <input 
                    autoFocus
                    required
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder="pseudo"
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Sexe et Date de naissance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Sexe / Genre
                  </label>
                  <select
                    value={gender || ''}
                    onChange={(e) => setGender(e.target.value || null)}
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  >
                    <option value="">Non spécifié</option>
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                    <option value="E">Enfant</option>
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  <Key size={12} /> Mot de passe
                </label>
                <div className="relative group">
                   <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-500 transition-colors" size={18} />
                   <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (isHashed) setIsHashed(false); // Si on tape, ce n'est plus le hash existant
                    }}
                    placeholder={isHashed ? '•••••••• (Sécurisé)' : '••••••••'}
                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 font-bold focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 px-1 font-medium leading-relaxed italic">
                  {isHashed 
                    ? "Ce mot de passe est déjà sécurisé. Laissez le champ vide pour le conserver, ou tapez-en un nouveau pour le changer."
                    : "Note : Les élèves utilisent ce mot de passe pour se connecter sur leur interface locale."}
                </p>
              </div>

              {/* Accès Mission Planète */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Accès Mission Planète</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">Autoriser cet élève à voir le tableau de bord global</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDelegate(!isDelegate)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDelegate ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDelegate ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Actions de sauvegarde et suppression */}
              <div className="pt-4 flex gap-3">
                {!isNew && onDelete && (
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={onDelete}
                    className="h-12 px-4 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
                
                <Button 
                  type="submit"
                  isLoading={loading}
                  className="h-12 flex-1 rounded-xl bg-slate-900 text-white shadow-lg hover:shadow-xl transition-all font-black uppercase text-[10px] tracking-widest"
                >
                  <Save size={14} className="mr-2" />
                  {isNew ? "Créer l'élève" : "Mettre à jour"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
