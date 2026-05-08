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
  AlertTriangle,
  ShieldCheck,
  Building2,
  Globe
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';
import { useSchoolYear } from '@/hooks/useSchoolYear';
import { UsersSection } from '@/components/settings/UsersSection';
import { CatalogSection } from '@/components/settings/CatalogSection';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  type ActiveTab = 'profile' | 'users' | 'catalog' | 'data';
  type ActiveDataTab = 'impact' | 'animals' | 'terreMometre';

  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as ActiveTab) || 'profile';

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [activeDataTab, setActiveDataTab] = useState<ActiveDataTab>('impact');
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

  const tabDef: { id: ActiveTab; label: string; icon: string; adminOnly?: boolean }[] = [
    { id: 'profile', label: 'Mon profil', icon: '👤' },
    { id: 'catalog', label: 'Catalogue', icon: '📚' },
    { id: 'users', label: 'Utilisateurs', icon: '👥', adminOnly: true },
    { id: 'data', label: 'Données de calcul', icon: '🌍', adminOnly: true },
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
                >
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

        {/* Données de calcul — pleine largeur */}
        {activeTab === 'data' && isAS && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-1 p-1 bg-white/80 rounded-2xl border border-slate-100 shadow-sm w-fit">
              {([
                { id: 'impact', label: 'Impact Annuel' },
                { id: 'animals', label: 'Animaux' },
                { id: 'terreMometre', label: 'Terre-momètre' },
              ] as { id: ActiveDataTab; label: string }[]).map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveDataTab(sub.id)}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeDataTab === sub.id ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
            {activeDataTab === 'impact' && <GlobalDataSettings schoolYear={schoolYear} />}
            {activeDataTab === 'animals' && <AnimalsSettings schoolYear={schoolYear} />}
            {activeDataTab === 'terreMometre' && <TerreMometreSettings schoolYear={schoolYear} />}
          </div>
        )}

        {/* Profil & Utilisateurs — largeur contrainte pour lisibilité */}
        {(activeTab === 'profile' || activeTab === 'users') && (
          <div className="max-w-5xl mx-auto">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'users' && isAS && <UsersSection />}
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

function GlobalDataSettings({ schoolYear }: { schoolYear: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [constants, setConstants] = useState({
    dActuel: 0,
    moyCo2Monde: 0,
    moyEauMonde: 0,
    moyDechetsMonde: 0,
    popMonde: 0
  });

  const selectedYear = parseInt(schoolYear.split('-')[1]); // Année de fin

  useEffect(() => {
    fetchConstants(selectedYear);
  }, [selectedYear]);

  const fetchConstants = async (year: number) => {
    setLoading(true);
    try {
      const constResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/impact/constants?schoolYear=${schoolYear}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (constResp.ok) {
        const data = await constResp.json();
        setConstants({
          dActuel: data.dActuel ?? 0,
          moyCo2Monde: data.moyCo2Monde ?? 0,
          moyEauMonde: data.moyEauMonde ?? 0,
          moyDechetsMonde: data.moyDechetsMonde ?? 0,
          popMonde: data.popMonde ?? 0
        });
      } else {
        setConstants({ dActuel: 0, moyCo2Monde: 0, moyEauMonde: 0, moyDechetsMonde: 0, popMonde: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/impact/constants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({
          schoolYear,
          dActuel: Number(constants.dActuel),
          moyCo2Monde: Number(constants.moyCo2Monde),
          moyEauMonde: Number(constants.moyEauMonde),
          moyDechetsMonde: Number(constants.moyDechetsMonde),
          popMonde: Number(constants.popMonde)
        }),
      });
      if (resp.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-emerald-600 w-12 h-12" />
      </div>
    );
  }

  return (
    <GlassCard className="p-10 rounded-3xl border-none shadow-2xl bg-white/95">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Globe className="text-orange-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Constantes d'Impact Mondiales</h2>
              <p className="text-sm font-medium text-slate-500">
                Configuration des seuils planétaires de référence pour l'année <strong>{schoolYear}</strong>.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-sky-50 text-sky-800 p-5 rounded-2xl text-sm leading-relaxed font-medium flex flex-col gap-2 border border-sky-100">
            <div className="flex items-center gap-2 font-black text-sky-900 border-b border-sky-200/50 pb-2 mb-1">
               <AlertTriangle size={16} /> Règle de calcul
            </div>
            <p>Le bilan de l'année scolaire <strong>{selectedYear-1}-{selectedYear}</strong> utilise les données mondiales de l'année civile <strong>{selectedYear-1}</strong>.</p>
            <p className="opacity-80">Les champs ci-dessous correspondent donc aux statistiques de {selectedYear-1}.</p>
          </div>

          <div className="bg-emerald-50 text-emerald-800 p-5 rounded-2xl text-sm leading-relaxed font-medium flex flex-col gap-2 border border-emerald-100">
            <div className="flex items-center gap-2 font-black text-emerald-900 border-b border-emerald-200/50 pb-2 mb-1">
               <Globe size={16} /> Où trouver les données ?
            </div>
            <ul className="list-disc list-inside opacity-90 space-y-1 text-xs">
               <li>Jour dépassement : <a href="https://www.overshootday.org/" target="_blank" className="underline font-bold">overshootday.org</a></li>
               <li>CO2 : Banque mondiale / GIEC.</li>
               <li>Eau & Déchets : Rapports nationaux / ONU.</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Jour du dépassement {selectedYear-1} (1-365)</label>
               <Input 
                 type="number"
                 required
                 value={constants.dActuel || ''}
                 onChange={e => setConstants(prev => ({ ...prev, dActuel: Number(e.target.value) }))}
                 className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
                 placeholder="Ex: 214"
               />
               <p className="text-xs text-slate-400 pl-1">Numéro du jour dans l'année (ex: 214 = 1er Août)</p>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Empreinte CO2 {selectedYear-1} (tCO2e/hab/an)</label>
               <Input 
                 type="number" step="0.01"
                 required
                 value={constants.moyCo2Monde || ''}
                 onChange={e => setConstants(prev => ({ ...prev, moyCo2Monde: Number(e.target.value) }))}
                 className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
                 placeholder="Ex: 4.7"
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Empreinte Eau {selectedYear-1} (L/hab/an)</label>
               <Input 
                 type="number"
                 required
                 value={constants.moyEauMonde || ''}
                 onChange={e => setConstants(prev => ({ ...prev, moyEauMonde: Number(e.target.value) }))}
                 className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
                 placeholder="Ex: 1200000"
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Empreinte Déchets {selectedYear-1} (kg/hab/an)</label>
               <Input 
                 type="number" step="0.1"
                 required
                 value={constants.moyDechetsMonde || ''}
                 onChange={e => setConstants(prev => ({ ...prev, moyDechetsMonde: Number(e.target.value) }))}
                 className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
                 placeholder="Ex: 450"
              />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Population Mondiale {selectedYear-1} (Milliards)</label>
               <Input 
                 type="number" step="0.001"
                 required
                 value={constants.popMonde || ''}
                 onChange={e => setConstants(prev => ({ ...prev, popMonde: Number(e.target.value) }))}
                 className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
                 placeholder="Ex: 8.1"
               />
               <p className="text-xs text-slate-400 pl-1">Utilisé pour l'extrapolation (ex: 8.105)</p>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 mt-8 pt-6 border-t border-slate-100">
             <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Enregistré pour {selectedYear-1}
                  </motion.div>
                )}
             </AnimatePresence>
             <Button 
                type="submit" 
                disabled={saving} 
                className="h-14 px-8 font-black shadow-xl rounded-2xl bg-orange-600 hover:bg-orange-700 outline-none text-white uppercase tracking-widest"
             >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Enregistrer les données {selectedYear-1}
             </Button>
          </div>
        </form>
      </div>
    </GlassCard>
  );
}

function AnimalsSettings({ schoolYear }: { schoolYear: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    avgActionsPerChildPerPeriod: 8,
    animalAdvanceMargin: 2,
    bienveillanceThreshold: 0.40
  });

  useEffect(() => {
    fetchConfig();
  }, [schoolYear]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data) {
          setConfig({
            avgActionsPerChildPerPeriod: data.avgActionsPerChildPerPeriod || 8,
            animalAdvanceMargin: data.animalAdvanceMargin || 2,
            bienveillanceThreshold: data.bienveillanceThreshold || 0.40
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify(config),
      });
      if (resp.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="p-10 rounded-3xl border-none shadow-2xl bg-white/95">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Réglages Stimulation (Animaux)</h2>
          <p className="text-sm font-medium text-slate-500">Configuration par défaut pour l'année {schoolYear}.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Actions attendues par enfant par période</label>
           <Input 
             type="number"
             value={config.avgActionsPerChildPerPeriod}
             onChange={e => setConfig(prev => ({ ...prev, avgActionsPerChildPerPeriod: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Marge d'avance max (Plafond)</label>
           <Input 
             type="number"
             value={config.animalAdvanceMargin}
             onChange={e => setConfig(prev => ({ ...prev, animalAdvanceMargin: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Seuil de bienveillance (ex: 0.40 pour 40%)</label>
           <Input 
             type="number" step="0.01"
             value={config.bienveillanceThreshold}
             onChange={e => setConfig(prev => ({ ...prev, bienveillanceThreshold: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
      </div>
      
      <div className="flex justify-end items-center gap-4 mt-10 pt-6 border-t border-slate-100">
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-600 font-bold text-xs">
              Configuration enregistrée !
            </motion.div>
          )}
        </AnimatePresence>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="h-14 px-8 font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Enregistrer (Année {schoolYear})
        </Button>
      </div>
    </GlassCard>
  );
}

function TerreMometreSettings({ schoolYear }: { schoolYear: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    emissionsParHabitantAn: 11.0,
    temperatureMalade: 42.0,
    temperatureSaine: 37.0,
    populationReference: 68000000
  });

  useEffect(() => {
    fetchConfig();
  }, [schoolYear]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setConfig(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify(config),
      });
      if (resp.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <GlassCard className="p-10 rounded-3xl border-none shadow-2xl bg-white/95">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Paramètres Terre-momètre</h2>
          <p className="text-sm font-medium text-slate-500">Configuration mondiale pour l'année {schoolYear}.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Émissions France par habitant/an (tCO2e)</label>
           <Input 
             type="number" step="0.1"
             value={config.emissionsParHabitantAn}
             onChange={e => setConfig(prev => ({ ...prev, emissionsParHabitantAn: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Température "Malade" (°C)</label>
           <Input 
             type="number" step="0.1"
             value={config.temperatureMalade}
             onChange={e => setConfig(prev => ({ ...prev, temperatureMalade: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Température "Saine" (°C)</label>
           <Input 
             type="number" step="0.1"
             value={config.temperatureSaine}
             onChange={e => setConfig(prev => ({ ...prev, temperatureSaine: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Population de référence (ex: 68000000)</label>
           <Input 
             type="number"
             value={config.populationReference}
             onChange={e => setConfig(prev => ({ ...prev, populationReference: Number(e.target.value) }))}
             className="bg-slate-50/50 h-14 rounded-2xl text-lg font-bold"
           />
        </div>
      </div>

      <div className="flex justify-end items-center gap-4 mt-10 pt-6 border-t border-slate-100">
         <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-600 font-bold text-xs">
                Configuration enregistrée !
              </motion.div>
            )}
         </AnimatePresence>
         <Button 
            onClick={handleSave}
            disabled={saving}
            className="h-14 px-8 font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest"
         >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Enregistrer (Année {schoolYear})
         </Button>
      </div>
    </GlassCard>
  );
}
