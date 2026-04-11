'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Camera, Save, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper pour l'URL de l'avatar
  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
           setUser(data);
           setName(data.name || '');
           setEmail(data.email || '');
        }
      }
    } catch (error) {
      console.error('Erreur profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { name, email };
      if (newPassword) payload.password = newPassword;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(true);
        setNewPassword('');
        // Sync local storage name if changed
        setAuthData('user_name', name);
        window.dispatchEvent(new Event('storage'));
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthData('access_token')}`
        },
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        setUser({ ...user, avatar: data.url });
        // Synchroniser le localStorage pour la sidebar
        setAuthData('userAvatar', data.url);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error('Avatar upload failed', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNewPassword('');
    setSuccess(false);
    fetchProfile();
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-emerald-600 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <GlassCard className="relative p-0 rounded-2xl border-white/40 shadow-2xl overflow-hidden bg-white/95">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
          
          {/* Left Column: Avatar Only */}
          <div className="flex flex-col items-center justify-start p-10 bg-slate-50/30 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="relative group mt-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAvatarClick}
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden cursor-pointer bg-white relative transition-all"
              >
                {user.avatar ? (
                  <img src={getAvatarUrl(user.avatar) || ''} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-emerald-100">{(name[0] || '?').toUpperCase()}</span>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white" size={24} />
                </div>
              </motion.div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white bg-emerald-500 shadow-md" />
            </div>
            
            {saving && (
               <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 tracking-widest animate-pulse">
                  <Loader2 className="animate-spin" size={12} /> Sync...
               </div>
            )}
          </div>

          {/* Right Column: Clean Forms */}
          <div className="p-12 flex flex-col gap-10">
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-8">
              
              {/* Identity Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-2 py-0.5 rounded-md mb-1">Pseudo</label>
                   <Input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre pseudo"
                      className="bg-white border-slate-200 h-14 rounded-2xl text-lg font-bold text-slate-700 focus:border-emerald-300 shadow-sm"
                    />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-2 py-0.5 rounded-md mb-1">Email (Contact)</label>
                   <div className="relative">
                      <Input 
                        value={email}
                        disabled
                        className="bg-slate-50/50 border-slate-100 h-14 rounded-2xl text-lg font-bold text-slate-400 opacity-60 cursor-not-allowed pl-12"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-2 py-0.5 rounded-md mb-1">Sécurité</label>
                <div className="flex flex-col gap-3">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nouveau mot de passe"
                    className="bg-white border-slate-200 h-14 rounded-2xl text-lg font-medium text-slate-600 placeholder:text-slate-300 focus:border-emerald-300 shadow-sm"
                    suffix={
                       <button
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                       >
                         {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                       </button>
                    }
                  />
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic ml-2">
                    Utiliser un mot de passe robuste avec au moins une majuscule, une minuscule, un chiffre et un caractère spécial (#!&amp;@=)
                  </p>
                </div>
              </div>

              {/* Read-only Identifiers bottom-aligned */}
              <div className="grid grid-cols-2 gap-8 mt-4 pt-4 border-t border-slate-50">
                <div className="flex flex-col gap-1">
                   <span className="text-[13px] font-bold text-slate-500">Rôle</span>
                   <span className="text-base font-medium text-slate-400 italic">
                      {user.role === 'AS' ? 'Administrateur' : 'Équipe Terrain'}
                   </span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[13px] font-bold text-slate-500">ID unique</span>
                   <span className="text-base font-medium text-slate-400 italic">
                      #{user.id.toString().padStart(4, '0')}
                   </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between items-center mt-4">
                <AnimatePresence>
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Profil à jour
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 ml-auto">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-all border border-transparent"
                  >
                    Annuler
                  </button>
                  <Button 
                    type="submit" 
                    disabled={saving} 
                    className="h-12 px-8 gap-2 font-black shadow-lg shadow-emerald-500/10 rounded-xl"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Mettre à jour
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
