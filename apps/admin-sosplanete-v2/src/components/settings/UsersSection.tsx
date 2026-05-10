'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mail, Trash2, Loader2, X, Eye, EyeOff, Lock } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserEditModal } from '@/components/users/UserEditModal';
import { getAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';

export const UsersSection: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'AS' | 'AM'>('AM');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) setUsers(await resp.json());
    } catch (e) {
      console.error('Fetch users error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError(null);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({ email, name, password, role }),
      });
      if (resp.ok) {
        setShowAddModal(false);
        resetForm();
        fetchUsers();
      } else {
        const data = await resp.json().catch(() => ({}));
        setCreateError(data.message || `Erreur ${resp.status}`);
      }
    } catch (e) {
      console.error('Create error:', e);
      setCreateError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) fetchUsers();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const resetForm = () => {
    setEmail(''); setName(''); setPassword(''); setRole('AM');
  };

  const formatDate = (date: string) => {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Gestion des utilisateurs</h2>
          <p className="text-sm text-slate-400 mt-0.5">{users.length} compte{users.length > 1 ? 's' : ''}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="h-10 px-4 flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
        >
          <Plus size={18} /> Nouvel utilisateur
        </motion.button>
      </div>

      {/* Liste */}
      <GlassCard className="p-0 overflow-hidden shadow-xl">
        <div className="grid grid-cols-[1fr_200px_200px_100px] gap-4 px-8 py-4 bg-slate-50/50 text-[10px] uppercase font-bold tracking-widest text-slate-400 border-b border-slate-100">
          <div>Utilisateur</div>
          <div>Rôle</div>
          <div>Dernière activité</div>
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-sky-500" /></div>
        ) : (
          <div className="divide-y divide-slate-50">
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="grid grid-cols-[1fr_200px_200px_100px] gap-4 px-8 py-4 items-center hover:bg-slate-50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border-2 border-white shadow-sm flex items-center justify-center text-xs font-black text-emerald-700 overflow-hidden">
                    {u.avatar
                      ? <img src={getAssetUrl(u.avatar)} className="w-full h-full object-cover" alt={u.name} />
                      : (u.name ? u.name[0] : (u.email ? u.email[0] : '?')).toUpperCase()
                    }
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{u.name || 'Sans nom'}</span>
                    <span className="text-xs text-slate-400">{u.email}</span>
                  </div>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${u.role === 'AS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                    {u.role === 'AS' ? 'Administrateur' : 'Équipe Terrain'}
                  </span>
                </div>
                <div className="text-sm text-slate-700 font-bold">{formatDate(u.lastSeenAt)}</div>
                <div className="flex justify-end gap-2 text-slate-300">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                    className="p-2 rounded-xl hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-400 text-sm">Aucun utilisateur trouvé.</div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Modal Création */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg"
            >
              <GlassCard className="flex flex-col gap-6 p-8 bg-white/90">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Nouvel Utilisateur</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleCreateUser} className="flex flex-col gap-5">
                  <Input label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Marc Lefebvre" required />
                  <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marc@example.com" icon={<Mail size={18} />} required />
                  <Input
                    label="Mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    required
                    suffix={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-500">Rôle</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setRole('AM')} className={`py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${role === 'AM' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-100 text-slate-400'}`}>
                        Gestionnaire Terrain
                      </button>
                      <button type="button" onClick={() => setRole('AS')} className={`py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${role === 'AS' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-100 text-slate-400'}`}>
                        Administrateur
                      </button>
                    </div>
                  </div>
                  {createError && (
                    <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-bold">
                      {Array.isArray(createError) ? (createError as string[]).join(' · ') : createError}
                    </div>
                  )}
                  <Button type="submit" disabled={submitting} className="h-14 mt-4 font-bold text-lg">
                    {submitting ? <Loader2 className="animate-spin" /> : 'Créer le compte'}
                  </Button>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
        {selectedUser && (
          <UserEditModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdate={fetchUsers} />
        )}
      </AnimatePresence>
    </div>
  );
};
