'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Camera, 
  Mail, 
  Shield, 
  Key, 
  User as UserIcon, 
  Loader2, 
  CheckCircle,
  Clock,
  Circle,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'AS' | 'AM';
  avatar?: string;
  lastSeenAt?: string;
}

interface UserEditModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onUpdate }) => {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'AS' | 'AM'>(user.role);
  const [avatar, setAvatar] = useState(user.avatar);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper pour l'URL de l'avatar
  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  };

  const isOnline = () => {
    if (!user.lastSeenAt) return false;
    const lastSeen = new Date(user.lastSeenAt).getTime();
    const now = new Date().getTime();
    return (now - lastSeen) < 5 * 60 * 1000; // < 5 mins
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        setAvatar(data.url);
        onUpdate();
      }
    } catch (e) {
      console.error('Avatar upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = { name, email, role };
      if (password) payload.password = password;

      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        onUpdate();
        onClose();
      }
    } catch (e) {
      console.error('Update failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-2xl"
      >
        <GlassCard className="relative overflow-hidden border-white/40 shadow-2xl p-0 h-auto rounded-2xl bg-white/90 backdrop-blur-2xl">
          {/* Left colored bar based on role */}
          <div className={`absolute inset-y-0 left-0 w-2 ${role === 'AS' ? 'bg-sage shadow-[10px_0_20px_rgba(64,145,108,0.2)]' : 'bg-mint shadow-[10px_0_20px_rgba(128,237,153,0.2)]'}`} />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-8 p-2 rounded-full bg-slate-900/10 text-slate-500 hover:text-slate-800 hover:bg-slate-900/20 transition-all z-10"
          >
            <X size={20} />
          </button>

          <form onSubmit={handleSubmit} className="p-10 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row gap-10 items-start">
              {/* Avatar Section */}
              <div className="relative group">
                <div 
                  onClick={handleAvatarClick}
                  className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl cursor-pointer bg-slate-100 flex items-center justify-center relative transition-transform group-hover:scale-105 active:scale-95"
                >
                  {avatar ? (
                    <img src={getAvatarUrl(avatar) || ''} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-slate-300">{(name ? name[0] : (email ? email[0] : '?')).toUpperCase()}</span>
                  )}
                  
                  {/* Camera Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>

                  {uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="animate-spin text-sky-500" />
                    </div>
                  )}
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {/* Status indicator on avatar */}
                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white shadow-lg ${isOnline() ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>

              {/* Header Info */}
              <div className="flex-1 flex flex-col gap-1 pt-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{name || 'Utilisateur'}</h2>
                  {isOnline() && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                      <Circle size={8} className="fill-emerald-500" /> En ligne
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-slate-500 text-sm font-bold">
                  <span className="flex items-center gap-1">
                    <Mail size={14} className="text-slate-400" /> {email}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1">
                    <Shield size={14} className="text-slate-400" /> ID: <span className="text-slate-300">#{user.id}</span>
                  </span>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dernière activité</span>
                    <div className="flex items-center gap-2 text-slate-800 text-xs font-black">
                       <Clock size={14} className="text-slate-400" /> {formatDate(user.lastSeenAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields - Grid 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-8 border-t border-slate-100">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-2 py-0.5 rounded-md mb-1">Pseudo</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom ou pseudo"
                  icon={<UserIcon size={18} />}
                  className="bg-white border-slate-200 shadow-sm h-12"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-2 py-0.5 rounded-md mb-1">Email (Contact)</label>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  icon={<Mail size={18} />}
                  className="bg-white border-slate-200 shadow-sm h-12"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-2 py-0.5 rounded-md mb-1">Sécurité</label>
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Modifier le mot de passe..."
                  icon={<Key size={18} />}
                  className="bg-white border-slate-200 shadow-sm h-12"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-2 py-0.5 rounded-md mb-1">Rôle Système</label>
                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 h-[52px]">
                   <button
                    type="button"
                    onClick={() => setRole('AM')}
                    className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'AM' ? 'bg-white text-emerald-600 shadow-md border border-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                    Gestionnaire Espace
                   </button>
                   <button
                    type="button"
                    onClick={() => setRole('AS')}
                    className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'AS' ? 'bg-white text-sage shadow-md border border-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                    Gestionnaire Référentiel
                   </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-6 mt-4">
              <button 
                type="button" 
                onClick={onClose} 
                className="text-sm font-black text-slate-500 hover:text-slate-800 transition-all uppercase tracking-widest underline underline-offset-4 decoration-slate-200"
              >
                Annuler
              </button>
              <Button type="submit" disabled={submitting} className="px-10 h-14 font-black tracking-tight text-lg shadow-xl shadow-emerald-500/20 gap-3">
                {submitting ? <Loader2 className="animate-spin" /> : (
                  <>
                    <Save size={22} />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};
