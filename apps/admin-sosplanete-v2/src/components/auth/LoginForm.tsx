'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (!response.ok) {
        throw new Error('Identifiants incorrects ou serveur indisponible');
      }

      const data = await response.json();
      
      // Stockage local du token et des infos de base
      setAuthData('access_token', data.access_token, rememberMe);
      setAuthData('user_role', data.user.role || 'AM', rememberMe);
      setAuthData('user_name', data.user.name || '', rememberMe);
      
      const managedInstances = data.user.managedInstances || [];
      setAuthData('managed_instances', JSON.stringify(managedInstances), rememberMe);
      
      // Animation et redirection vers le tableau de bord global
      setTimeout(() => {
        if (data.user.role === 'AS') {
          removeAuthData('active_instance_id');
        } else if (managedInstances.length === 1) {
          // Instance unique : sélection automatique en arrière-plan mais redirection vers dashboard
          setAuthData('active_instance_id', managedInstances[0].id.toString(), rememberMe);
        } else {
          removeAuthData('active_instance_id');
        }
        router.push('/dashboard');
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-md px-4"
    >
      <GlassCard className="flex flex-col gap-8 shadow-2xl relative overflow-hidden backdrop-blur-xl border-white/40 bg-white/70">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500 blur-[100px] opacity-20" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-mint blur-[100px] opacity-20" />

        <div className="text-center relative z-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-800">Bonjour !</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Agissons ensemble pour la planète.</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-3 font-semibold"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
          <Input
            label="Adresse Email"
            type="email"
            placeholder="votre@email.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required
            className="shadow-sm"
          />
          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
            suffix={
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            required
            className="shadow-sm"
          />
          
          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border-2 border-slate-300 rounded-md bg-white peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all duration-200" />
                <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">Rester connecté</span>
            </label>

            <button type="button" className="text-sm font-bold text-sage hover:underline opacity-80">
              Mot de passe oublié ?
            </button>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            disabled={loading}
            className="mt-4 h-14 font-black text-lg shadow-xl shadow-emerald-500/10 active:scale-95 transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Se connecter <ArrowRight size={18} />
              </span>
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-slate-400 mt-4 relative z-10 px-6">
          Pas encore de compte ? Contactez votre établissement.
        </div>
      </GlassCard>
    </motion.div>
  );
};
