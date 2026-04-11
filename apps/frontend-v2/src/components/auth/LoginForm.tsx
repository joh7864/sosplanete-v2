'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Identifiants incorrects ou serveur indisponible');
      }

      const data = await response.json();
      
      // Stockage local du token et des infos de base
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_role', data.user.role || 'AM');
      localStorage.setItem('user_name', data.user.name || '');
      
      const managedInstances = data.user.managedInstances || [];
      localStorage.setItem('managed_instances', JSON.stringify(managedInstances));
      
      // Animation et redirection basée sur le rôle et le nombre d'instances
      setTimeout(() => {
        if (data.user.role === 'AS') {
          localStorage.removeItem('active_instance_id');
          router.push('/dashboard/users');
        } else if (managedInstances.length > 1) {
          // Cas Isabelle : charger une nouvelle session fraîche (vue globale par défaut)
          localStorage.removeItem('active_instance_id');
          router.push('/dashboard');
        } else {
          // Instance unique : sélection automatique
          if (managedInstances.length === 1) {
            localStorage.setItem('active_instance_id', managedInstances[0].id.toString());
            router.push('/dashboard/organization');
          } else {
            router.push('/dashboard');
          }
        }
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
          
          <div className="flex justify-end mt-1">
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
