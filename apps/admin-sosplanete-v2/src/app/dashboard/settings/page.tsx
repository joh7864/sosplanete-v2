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
  ShieldCheck,
  Building2
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData, setAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';
import { useSchoolYear } from '@/hooks/useSchoolYear';
import { UsersSection } from '@/components/settings/UsersSection';
import { CatalogSection } from '@/components/settings/CatalogSection';
import { AnchorsManager } from '@/components/organization/AnchorsManager';
import { GlobalDataSettings } from '@/components/settings/GlobalDataSettings';
import { SystemConfigForm } from '@/components/settings/SystemConfigForm';
import { ManagedSpacesSection } from '@/components/settings/ManagedSpacesSection';
import { TuningSimulator } from '@/components/settings/TuningSimulator';
import { FTUXSettings } from '@/components/settings/FTUXSettings';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  type ActiveTab = 'profile' | 'users' | 'catalog' | 'data' | 'tuning' | 'anchors' | 'ftux';

  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as ActiveTab) || 'profile';

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const { schoolYear } = useSchoolYear();

  // Lecture du rôle via useSession (remplace le fetch manuel)
  const [userRole, setUserRole] = useState<'AS' | 'AM' | null>(null);
  const [instanceId, setInstanceId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
        });
        if (resp.ok) {
          const user = await resp.json();
          setUserRole(user.role);
        }
      } catch (e) { /* ignore */ }
    };
    fetchRole();

    // Récupération de l'instanceId active pour le mode AM
    const savedId = typeof window !== 'undefined'
      ? localStorage.getItem('active_instance_id')
      : null;
    if (savedId) setInstanceId(parseInt(savedId));
  }, []);

  const isAS = userRole === 'AS';

  const tabDef: { id: ActiveTab; label: string; icon: string; adminOnly?: boolean; tooltip?: string }[] = [
    { id: 'profile', label: 'Profil & Notifications', icon: '👤' },
    { id: 'users', label: 'Utilisateurs', icon: '👥', adminOnly: true },
    { id: 'catalog', label: 'Catalogue', icon: '📚' },
    { id: 'data', label: 'Données de calcul', icon: '🌍', adminOnly: true },
    { id: 'tuning', label: 'Tuning critères', icon: '🎛️', adminOnly: true },
    { id: 'anchors', label: 'Ecoles', icon: '🏢', adminOnly: true },
    { id: 'ftux', label: 'FTUX', icon: '✨', adminOnly: true, tooltip: 'First Time User eXperience' },
  ];

  const visibleTabs = tabDef.filter(t => !t.adminOnly || isAS);

  return (
    <>
      <TopBar
        title="Paramètres"
        subtitle={tabDef.find(t => t.id === activeTab)?.label}
        bottomContent={
          <>
            {visibleTabs.map((tab, idx) => (
              <React.Fragment key={tab.id}>
                {idx > 0 && <div className="w-px h-5 bg-slate-200 shrink-0" />}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 py-4 px-6 text-[13px] font-black uppercase tracking-widest transition-all duration-300 relative whitespace-nowrap ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-800'}`}
                  title={tab.tooltip || tab.label}
                >
                  <span className="text-lg opacity-80">{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeSettingsTab" className="absolute bottom-[-1px] left-6 right-6 h-[3px] bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.3)]" />
                  )}
                </button>
              </React.Fragment>
            ))}
          </>
        }
      />

      <div className="pb-20 pt-10">

        {/* Catalogue — pleine largeur */}
        {activeTab === 'catalog' && (
          <CatalogSection
            role={userRole ?? 'AM'}
            instanceId={instanceId ?? undefined}
            schoolYear={schoolYear}
          />
        )}

        {/* Données de calcul — grille de cards, pleine largeur */}
        {activeTab === 'data' && isAS && (
          <div className="flex flex-col gap-6">
            {/* Impact Annuel : card principale, pleine largeur */}
            <GlobalDataSettings schoolYear={schoolYear} />

            {/* Animaux + Terre-momètre : 2 colonnes */}
            <SystemConfigForm schoolYear={schoolYear} />
          </div>
        )}

        {/* Tuning Simulateur — pleine largeur */}
        {activeTab === 'tuning' && isAS && (
          <TuningSimulator schoolYear={schoolYear} />
        )}

        {/* FTUX Settings — pleine largeur */}
        {activeTab === 'ftux' && isAS && (
          <FTUXSettings schoolYear={schoolYear} />
        )}

        {/* Profil & Utilisateurs — largeur contrainte pour lisibilité */}
        {(activeTab === 'profile' || activeTab === 'users' || activeTab === 'anchors') && (
          <div className={`${activeTab === 'profile' ? 'w-full' : 'max-w-5xl mx-auto'}`}>
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'users' && isAS && <UsersSection />}
            {activeTab === 'anchors' && isAS && <AnchorsManager />}
          </div>
        )}

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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <GlassCard className="relative p-0 rounded-3xl border-none shadow-2xl overflow-hidden bg-white/95 h-full">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-full">
          
          {/* Left Column: Avatar & Quick Info */}
          <div className="flex flex-col items-center justify-start p-10 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 h-full">
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
          <div className="p-12 flex flex-col justify-between h-full">
            <form onSubmit={handleUpdateProfile} className="flex flex-col justify-between h-full flex-grow gap-8">
              
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

      <ManagedSpacesSection />
      </div>

      <NotificationsHistory />
    </div>
  );
}

function NotificationsHistory() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const token = getAuthData('access_token');
    if (!token) return;
    try {
      const [rResp, sResp] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/sent`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      if (rResp.ok) setNotifications(await rResp.json());
      if (sResp.ok) setSentNotifications(await sResp.json());
    } catch (e) {
      console.error('Failed to fetch notifications history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    const token = getAuthData('access_token');
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        fetchAll();
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    const token = getAuthData('access_token');
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        fetchAll();
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const list = activeSubTab === 'received' ? notifications : sentNotifications;

  return (
    <GlassCard className="p-8 rounded-3xl bg-white/95 border-none shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Historique des Notifications</h2>
          <p className="text-xs font-medium text-slate-400 mt-1">Suivez les demandes d'initialisation et configurations de vos espaces.</p>
        </div>
        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/50 self-start">
          <button
            onClick={() => setActiveSubTab('received')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeSubTab === 'received' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
          >
            Reçues ({notifications.length})
          </button>
          <button
            onClick={() => setActiveSubTab('sent')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeSubTab === 'sent' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
          >
            Envoyées ({sentNotifications.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-10 text-slate-400 font-bold text-sm italic">
          Aucune notification {activeSubTab === 'received' ? 'reçue' : 'envoyée'}.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((notif: any) => {
            const dateStr = new Date(notif.createdAt).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short'
            });

            let statusText = 'Lu';
            let statusClass = 'bg-slate-50 text-slate-500';
            if (notif.status === 'DELETED') {
              statusText = 'Annulée';
              statusClass = 'bg-rose-50 text-rose-600';
            } else if (!notif.isRead && notif.status === 'PENDING') {
              statusText = 'En attente';
              statusClass = 'bg-amber-50 text-amber-600 animate-pulse';
            } else if (notif.status === 'PROCESSED') {
              statusText = 'Traité';
              statusClass = 'bg-emerald-50 text-emerald-600';
            } else if (notif.isRead) {
              statusText = 'Lu';
              statusClass = 'bg-slate-100 text-slate-500';
            }

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border transition-all ${!notif.isRead && activeSubTab === 'received' && notif.status !== 'DELETED' ? 'bg-slate-50/50 border-emerald-100 shadow-[0_4px_12px_rgba(16,185,129,0.03)]' : 'bg-white border-slate-100/80 hover:bg-slate-50/20'} ${notif.status === 'DELETED' ? 'opacity-70' : ''}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dateStr}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>
                    <h4 className={`text-sm font-black text-slate-800 ${notif.status === 'DELETED' ? 'line-through text-slate-400' : ''}`}>{notif.title}</h4>
                    <p className={`text-xs text-slate-500 leading-relaxed font-medium ${notif.status === 'DELETED' ? 'text-slate-400' : ''}`}>{notif.content}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeSubTab === 'received' && !notif.isRead && notif.status !== 'DELETED' && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-xs font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-all"
                      >
                        Lu
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

