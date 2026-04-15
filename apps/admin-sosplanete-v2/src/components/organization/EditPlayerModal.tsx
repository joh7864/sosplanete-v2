import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Key, Trash2, Save } from 'lucide-react';
import { Button } from '../ui/Button';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { pseudo: string; password?: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: { pseudo: string; password?: string };
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

  useEffect(() => {
    if (isOpen) {
      setPseudo(initialData?.pseudo || '');
      setPassword(initialData?.password || '');
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ pseudo, password });
      onClose();
    } catch (error) {
      console.error('Error saving player:', error);
    } finally {
      setLoading(false);
    }
  };

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
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  <Key size={12} /> Mot de passe
                </label>
                <div className="relative group">
                   <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-500 transition-colors" size={18} />
                   <input 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 font-bold focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all outline-none"
                  />
                </div>
                <p className="text-[9px] text-slate-400 px-1 font-medium leading-relaxed italic">
                  Note : Les élèves utilisent ce mot de passe pour se connecter sur leur interface locale.
                </p>
              </div>

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
