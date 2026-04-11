'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  School, 
  ArrowRight, 
  Users, 
  Settings2, 
  LogOut,
  Leaf,
  Droplets,
  Trash
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function SelectInstancePage() {
  const router = useRouter();
  const [instances, setInstances] = useState<any[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const rawInstances = localStorage.getItem('managed_instances');
    const name = localStorage.getItem('user_name');
    
    if (rawInstances) {
      setInstances(JSON.parse(rawInstances));
    } else {
      // Si pas d'instances stockées, retour au login
      router.push('/');
    }
    
    if (name) setUserName(name);
  }, [router]);

  const handleSelect = (instanceId: number) => {
    localStorage.setItem('active_instance_id', instanceId.toString());
    router.push('/dashboard/organization');
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100 blur-[120px] opacity-30" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-[120px] opacity-30" />

      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight"
          >
            Bienvenue, {userName || 'Isabelle'} !
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 mt-4 text-lg font-medium"
          >
            Veuillez sélectionner l'espace sur lequel vous souhaitez travailler aujourd'hui.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {instances.map((instance, idx) => (
            <motion.div
              key={instance.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => handleSelect(instance.id)}
            >
              <GlassCard className="h-full border-none shadow-2xl hover:shadow-emerald-500/10 transition-all group p-8 bg-white/80">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                      <School size={32} />
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                       <Settings2 size={20} />
                    </div>
                  </div>

                  <h2 className="text-2xl font-black text-slate-800 mb-2 truncate">
                    {instance.schoolName}
                  </h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">
                     ESPACE DE GESTION
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Users size={16} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-500">Équipiers</span>
                      </div>
                    </div>
                    <Button 
                      variant="primary" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      Sélectionner <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-400 hover:text-rose-500 font-bold uppercase tracking-widest text-xs transition-colors"
            >
              <LogOut size={16} /> Me déconnecter
            </button>
        </div>
      </div>
    </main>
  );
}
