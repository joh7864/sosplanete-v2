'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

interface InstanceDeleteConfirmProps {
  instance: any;
  onClose: () => void;
  onConfirm: () => void;
}

export const InstanceDeleteConfirm: React.FC<InstanceDeleteConfirmProps> = ({ instance, onClose, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${instance.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
      });

      if (resp.ok) {
        onConfirm();
        onClose();
      } else {
        const data = await resp.json();
        setError(data.message || "Impossible de supprimer cet espace");
      }
    } catch (e) {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 bg-white shadow-2xl rounded-2xl border-none">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-xl border border-rose-100">
              <Trash2 size={40} />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Supprimer l'espace ?</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Vous êtes sur le point de supprimer <span className="text-slate-800 font-black">"{instance.schoolName}"</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100/50 flex flex-col gap-2 text-left">
              <div className="flex items-center gap-2 text-amber-700 font-black text-[10px] uppercase tracking-widest">
                <AlertTriangle size={14} /> Attention
              </div>
              <p className="text-xs text-amber-800 font-bold leading-relaxed">
                Cette action est <span className="underline decoration-2 decoration-amber-300">irréversible</span>. 
                Toutes les données associées (équipes, élèves, historique) seront définitivement supprimées.
              </p>
            </div>

            {error && (
              <div className="w-full p-4 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
                {error}
              </div>
            )}

            <div className="flex flex-col w-full gap-3 mt-2">
              <Button 
                onClick={handleDelete} 
                disabled={submitting}
                className="h-14 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 font-black uppercase tracking-widest text-sm"
              >
                {submitting ? <Loader2 size={24} className="animate-spin" /> : "Oui, supprimer définitivement"}
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose} 
                disabled={submitting}
                className="h-12 text-slate-400 hover:text-slate-600 font-bold"
              >
                Annuler
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
