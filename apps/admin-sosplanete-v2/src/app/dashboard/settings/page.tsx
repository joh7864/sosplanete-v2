'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle, 
  Eye, 
  EyeOff,
  BarChart2,
  Calendar,
  Box,
  Check,
  AlertTriangle,
  History,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  return (
    <>
      <TopBar 
        title="Paramètres" 
        subtitle="Mon profil"
      />

      <div className="pb-20 pt-10">
        <div className="max-w-5xl mx-auto">
          <ProfileSection />
        </div>
      </div>
    </>
  );
}

function ProfileSection() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAvatarUrl = (path: string | null) => {
    return getAssetUrl(path);
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
        setAuthData('userAvatar', data.url);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error('Avatar upload failed', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-emerald-600 w-12 h-12" />
      </div>
    );
  }

  return (
    <GlassCard className="relative p-0 rounded-3xl border-none shadow-2xl overflow-hidden bg-white/95">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
        
        {/* Left Column: Avatar & Quick Info */}
        <div className="flex flex-col items-center justify-start p-10 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100">
          <div className="relative group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAvatarClick}
              className="w-40 h-40 rounded-3xl border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden cursor-pointer bg-white relative transition-all"
            >
              {user.avatar ? (
                <img src={getAvatarUrl(user.avatar) || ''} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                  <span className="text-5xl font-black text-emerald-200">{(name[0] || '?').toUpperCase()}</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white" size={32} />
              </div>
            </motion.div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="mt-8 w-full space-y-4">
             <div className="flex flex-col items-center text-center">
                <span className="text-xl font-black text-slate-800 tracking-tight">{name}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                   {user.role === 'AS' ? 'Administrateur SOS' : 'Manager Espace'}
                </span>
             </div>

             <div className="pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-3 text-slate-500">
                   <ShieldCheck size={16} className="text-emerald-500" />
                   <span className="text-xs font-bold leading-none">Accès sécurisé</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                   <Building2 size={16} className="text-sky-500" />
                   <span className="text-xs font-bold leading-none">ID #{user.id.toString().padStart(4, '0')}</span>
                </div>
             </div>
          </div>
          
          {saving && (
             <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 tracking-widest animate-pulse">
                <Loader2 className="animate-spin" size={12} /> Synchronisation...
             </div>
          )}
        </div>

        {/* Right Column: Forms */}
        <div className="p-12 flex flex-col gap-10">
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-10">
            
            {/* Identity section */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-full">Informations Personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pseudo Public</label>
                   <Input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre pseudo"
                      className="bg-slate-50 border-none h-14 rounded-2xl text-lg font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Connexion</label>
                   <div className="relative">
                      <Input 
                        value={email}
                        disabled
                        className="bg-slate-100/50 border-none h-14 rounded-2xl text-lg font-bold text-slate-400 opacity-60 cursor-not-allowed pl-12"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest bg-sky-50 w-fit px-3 py-1 rounded-full flex items-center gap-2">
                 <Lock size={12} /> Sécurité du compte
              </h3>
              <div className="flex flex-col gap-3">
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className="bg-slate-50 border-none h-14 rounded-2xl text-lg font-medium text-slate-600 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm"
                  suffix={
                     <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="text-slate-400 hover:text-sky-600 transition-colors p-1"
                     >
                       {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                     </button>
                  }
                />
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic ml-2">
                  Laissez vide pour conserver le mot de passe actuel.
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-between items-center mt-4 pt-8 border-t border-slate-100">
              <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Profil mis à jour
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4 ml-auto">
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="h-14 px-10 gap-3 font-black shadow-xl shadow-emerald-500/20 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest text-sm"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Mettre à jour mon profil
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </GlassCard>
  );
}
