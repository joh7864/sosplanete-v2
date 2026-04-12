'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Globe, Link as LinkIcon, Users, Loader2, AlertTriangle, Lock, Unlock, Calendar, Hash } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

interface InstanceEditModalProps {
  instance?: any;
  onClose: () => void;
  onUpdate: () => void;
}

export const InstanceEditModal: React.FC<InstanceEditModalProps> = ({ instance, onClose, onUpdate }) => {
  const [schoolName, setSchoolName] = useState(instance?.schoolName || '');
  const [hostUrl, setHostUrl] = useState(instance?.hostUrl || '');
  const [adminId, setAdminId] = useState<number | undefined>(instance?.adminId);
  const [instanceIsOpen, setInstanceIsOpen] = useState<boolean>(instance?.isOpen || false);
  const [gameStartDate, setGameStartDate] = useState(instance?.gameStartDate ? new Date(instance.gameStartDate).toISOString().split('T')[0] : '');
  const [gamePeriodsCount, setGamePeriodsCount] = useState<number>(instance?.gamePeriodsCount || 24);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!instance;

  useEffect(() => {
    fetchAMUsers();
  }, []);

  const fetchAMUsers = async () => {
    setLoadingUsers(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const allUsers = await resp.json();
        // Filtrer pour n'avoir que les AM et AS
        setUsers(allUsers.filter((u: any) => u.role === 'AM' || u.role === 'AS'));
      }
    } catch (e) {
      console.error('Fetch users error:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      schoolName,
      hostUrl: hostUrl || undefined,
      adminId: adminId ? Number(adminId) : undefined,
      isOpen: instanceIsOpen,
      gameStartDate: gameStartDate || undefined,
      gamePeriodsCount: gamePeriodsCount ? Number(gamePeriodsCount) : undefined,
    };

    try {
      const url = isEdit 
        ? `${process.env.NEXT_PUBLIC_API_URL}/instances/${instance.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/instances`;
      
      const method = isEdit ? 'PATCH' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        onUpdate();
        onClose();
      } else {
        const data = await resp.json();
        setError(data.message || "Une erreur est survenue");
      }
    } catch (e) {
      setError("Erreur de connexion au serveur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-xl relative"
      >
        <GlassCard className="overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-2xl rounded-2xl flex flex-col min-h-[500px]">
          <div className="flex-1 p-8 md:p-10 flex flex-col gap-8">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <Globe size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Configuration Espace</span>
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                  {isEdit ? "Modifier l'école" : "Nouvelle École"}
                </h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3 animate-shake">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nom de l'établissement"
                  placeholder="Ex: École Primaire des Lilas"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  icon={<Globe size={18} />}
                />

                <Input
                  label="URL personnalisée (Optionnel)"
                  placeholder="Ex: https://lilas.sos-planete.fr"
                  value={hostUrl}
                  onChange={(e) => setHostUrl(e.target.value)}
                  icon={<LinkIcon size={18} />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Date de début du jeu"
                  type="date"
                  value={gameStartDate}
                  onChange={(e) => setGameStartDate(e.target.value)}
                  icon={<Calendar size={18} />}
                />

                <Input
                  label="Nombre de périodes"
                  type="number"
                  min="1"
                  max="52"
                  value={gamePeriodsCount}
                  onChange={(e) => setGamePeriodsCount(Number(e.target.value))}
                  icon={<Hash size={18} />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-600 ml-1">Gestionnaire Métier (AM)</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-smooth">
                      <Users size={18} />
                    </div>
                    <select
                      value={adminId || ''}
                      onChange={(e) => setAdminId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-smooth appearance-none font-medium text-slate-800"
                    >
                      <option value="">-- Aucun --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-slate-600 ml-1">Statut de l'espace</label>
                  <button
                    type="button"
                    onClick={() => setInstanceIsOpen(!instanceIsOpen)}
                    className={`
                      group relative overflow-hidden p-4 rounded-2xl border-2 transition-all duration-500
                      flex items-center justify-between text-left
                      ${instanceIsOpen ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}
                    `}
                  >
                    <div className="flex flex-col justify-center gap-0.5 z-10">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${instanceIsOpen ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {instanceIsOpen ? 'Ouvert au public' : 'En préparation'}
                      </span>
                      <p className="text-xs font-bold text-slate-700 leading-tight">
                        {instanceIsOpen ? 'Les joueurs peuvent se connecter' : 'Accès réservé au gestionnaire'}
                      </p>
                    </div>

                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 z-10 shrink-0
                      ${instanceIsOpen ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-0' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 rotate-[-12deg]'}
                    `}>
                      {instanceIsOpen ? <Unlock size={20} /> : <Lock size={20} />}
                    </div>

                    {/* Subtle background decoration */}
                    <div className={`
                      absolute right-[-10%] bottom-[-20%] transition-transform duration-700 opacity-[0.05] pointer-events-none
                      ${instanceIsOpen ? 'scale-[3] text-emerald-900 group-hover:scale-[4]' : 'scale-0 text-slate-900'}
                    `}>
                      <Unlock size={64} />
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={onClose} 
                  className="flex-1 h-14 rounded-2xl"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-[2] h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 text-white font-black uppercase tracking-widest text-sm flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin text-white" /> : (
                    <>
                      <Save size={20} />
                      {isEdit ? "Mettre à jour" : "Créer l'espace"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
