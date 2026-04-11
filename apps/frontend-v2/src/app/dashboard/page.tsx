'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Globe, Plus, Users, Trash2, Edit3, Loader2, Search, TrendingUp, LayoutGrid, List as ListIcon, Lock, Unlock, Settings2, Leaf, Droplets, Trash, Building2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InstanceEditModal } from '@/components/instances/InstanceEditModal';
import { InstanceDeleteConfirm } from '@/components/instances/InstanceDeleteConfirm';

interface Instance {
  id: number;
  schoolName: string;
  hostUrl: string | null;
  adminId: number | null;
  isOpen: boolean;
  admin: {
    id: number;
    email: string;
    name: string | null;
    avatar: string | null;
  } | null;
  _count: {
    teams: number;
    localActions: number;
  };
  playersCount: number;
  totalImpacts: {
    co2: number;
    water: number;
    waste: number;
  };
}

export default function DashboardSummaryPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [amUsers, setAmUsers] = useState<any[]>([]);
  const [activePopoverId, setActivePopoverId] = useState<number | null>(null);
  const [updatingAdminId, setUpdatingAdminId] = useState<number | null>(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    setUserRole(role);
    fetchInstances();
    if (role === 'AS') {
      fetchAMUsers();
    }

    const handleClickOutside = () => setActivePopoverId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchAMUsers = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (resp.ok) {
        const allUsers = await resp.json();
        setAmUsers(allUsers.filter((u: any) => u.role === 'AM' || u.role === 'AS'));
      }
    } catch (e) {
      console.error('Fetch users error:', e);
    }
  };

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setInstances(data);
        
        // Update local storage so the sidebar works with up-to-date instances
        localStorage.setItem('managed_instances', JSON.stringify(data));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error('Fetch instances error:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleInstanceStatus = async (instance: Instance) => {
    if (userRole !== 'AS') return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${instance.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ isOpen: !instance.isOpen }),
      });
      if (resp.ok) fetchInstances();
    } catch (e) {
      console.error('Toggle status error:', e);
    }
  };

  const handleAdminChange = async (instanceId: number, newAdminId: number) => {
    setUpdatingAdminId(instanceId);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${instanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ adminId: newAdminId }),
      });
      if (resp.ok) {
        await fetchInstances();
        setActivePopoverId(null);
      }
    } catch (e) {
      console.error('Update admin error:', e);
    } finally {
      setUpdatingAdminId(null);
    }
  };

  const filteredInstances = instances.filter(i => 
    i.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.hostUrl?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  };

  // KPIs Calculations
  const stats = instances.reduce((acc, curr) => ({
    teams: acc.teams + (curr._count?.teams || 0),
    groups: acc.groups + 0, // Groups count not directly in instance yet, but not critical for global view if not strictly requested, wait the configuration page has groups and players. The instance data gives teams, players, actions.
    actions: acc.actions + (curr._count?.localActions || 0),
    players: acc.players + (curr.playersCount || 0),
    co2: acc.co2 + (curr.totalImpacts?.co2 || 0),
    water: acc.water + (curr.totalImpacts?.water || 0),
    waste: acc.waste + (curr.totalImpacts?.waste || 0),
  }), { teams: 0, groups: 0, actions: 0, players: 0, co2: 0, water: 0, waste: 0 });

  return (
    <>
      {/* Header Section */}
      <TopBar 
        title="Tableau de bord"
        subtitle={userRole === 'AS' ? "Pilotez les différents établissements et surveillez l'activité des gestionnaires." : "Bienvenue sur votre espace de pilotage."}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-[10px] border border-slate-200">
              <button 
                 onClick={() => setViewMode('list')}
                 className={`p-1.5 flex items-center justify-center rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <ListIcon size={16} />
              </button>
              <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-1.5 flex items-center justify-center rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <LayoutGrid size={16} />
              </button>
            </div>
            {userRole === 'AS' && (
              <Button 
                variant="primary" 
                className="h-9 px-4 lg:px-5 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 text-white font-black uppercase tracking-widest text-[9px] lg:text-[10px]"
                onClick={() => {
                  setSelectedInstance(null);
                  setShowEditModal(true);
                }}
              >
                <Plus size={16} /> <span className="hidden sm:inline">Nouvel Espace</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-20">


      {/* KPI Stats Bar (from Organization) */}
      <GlassCard className="mb-2 border-none shadow-xl overflow-hidden py-6 px-10 bg-white/80">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: Inventory Counts */}
          <div className="flex items-center gap-8 lg:gap-12 flex-wrap">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-800 leading-none">{stats.teams}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Équipes</span>
            </div>
            <div className="w-[2px] h-12 bg-slate-200 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-800 leading-none">{stats.players}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Joueurs</span>
            </div>
            <div className="w-[2px] h-12 bg-slate-200 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-3xl font-black text-[var(--color-sage)] leading-none">{stats.actions}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Actions</span>
            </div>
          </div>

          {/* Right: Eco Impacts */}
          <div className="flex items-center gap-8 lg:gap-12 ml-auto">
             <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-slate-800 leading-none">{stats.co2}kg</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">CO2e évité</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500 shadow-sm"><Leaf size={24}/></div>
             </div>
             <div className="w-[2px] h-12 bg-slate-200 hidden sm:block" />
             <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-slate-800 leading-none">{(stats.water / 1000).toFixed(2)}m³</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Eau préservée</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 shadow-sm"><Droplets size={24}/></div>
             </div>
             <div className="w-[2px] h-12 bg-slate-200 hidden sm:block" />
             <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-slate-800 leading-none">{stats.waste}kg</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Déchets évités</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 shadow-sm"><Trash size={24}/></div>
             </div>
          </div>
        </div>
      </GlassCard>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-xl">
             <Input 
                placeholder="Rechercher une école, un URL..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={loading ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : <Search size={18} className="text-slate-400" />}
                className="bg-white/70 border-white/40 shadow-sm focus:shadow-md transition-all h-14 rounded-2xl"
             />
          </div>
          
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest bg-white/50 px-4 py-2 rounded-xl border border-white/40 shadow-sm">
            <TrendingUp size={14} className="text-emerald-500" />
            {instances.length} Établissement{instances.length > 1 ? 's' : ''}
          </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && instances.length === 0 ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[40vh] gap-4"
          >
            <Loader2 size={40} className="animate-spin text-emerald-500" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement des données...</p>
          </motion.div>
        ) : filteredInstances.length > 0 ? (
          <motion.div 
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch" : "flex flex-col gap-4"}
          >
            {filteredInstances.map((instance) => {
              const cardColor = instance.isOpen ? '#10b981' : '#fbbf24';

              return viewMode === 'grid' ? (
                <GlassCard key={instance.id} className="hover:scale-[1.02] transition-all cursor-pointer group overflow-hidden h-full border-none shadow-xl" padding="none">
                  <div 
                    className="h-1.5 w-full" 
                    style={{ backgroundColor: cardColor }} 
                  />
                  <div className="p-5 flex flex-col justify-between h-full min-h-[220px]">
                    {/* Header: Title & Action Icons */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <Link 
                           href={`/dashboard/organization?instanceId=${instance.id}`}
                           className="hover:text-emerald-600 transition-colors inline-block max-w-full"
                           onClick={(e) => {
                             e.stopPropagation();
                             localStorage.setItem('active_instance_id', instance.id.toString());
                             window.dispatchEvent(new Event('storage'));
                           }}
                        >
                           <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight truncate">{instance.schoolName}</h3>
                        </Link>
                        {instance.hostUrl && (
                           <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">https://{instance.hostUrl}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {userRole === 'AS' && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedInstance(instance); setShowEditModal(true); }}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedInstance(instance); setShowDeleteConfirm(true); }}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Stats */}
                    <div className="flex items-center justify-between mb-6 border-y border-slate-50 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <span className="text-base font-black text-emerald-600 leading-none">{instance._count?.teams || 0}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Équipes</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100" />
                        <div className="flex flex-col items-center">
                          <span className="text-base font-black text-emerald-600 leading-none">{instance.playersCount || 0}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Joueurs</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100" />
                        <div className="flex flex-col items-center">
                          <span className="text-base font-black text-[var(--color-sage)] leading-none">{instance._count?.localActions || 0}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Actions</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 items-end shrink-0">
                        <div className="flex items-center gap-1.5 justify-end">
                           <span className="text-[10px] font-bold text-slate-700">{instance.totalImpacts?.co2 || 0}kg</span>
                           <Leaf size={14} className="text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                           <span className="text-[10px] font-bold text-slate-700">{instance.totalImpacts?.water || 0}L</span>
                           <Droplets size={14} className="text-blue-500" />
                        </div>
                      </div>
                    </div>

                    {/* Footer: Manager & Buttons */}
                    <div className="flex items-center justify-between mt-auto">
                      <div 
                        className="flex items-center gap-2 relative group/popover"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (userRole === 'AS') setActivePopoverId(activePopoverId === instance.id ? null : instance.id);
                        }}
                      >
                        <div className={`w-8 h-8 rounded-full bg-slate-50 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 transition-transform ${userRole === 'AS' ? 'group-hover/popover:scale-105 cursor-pointer' : ''} ${updatingAdminId === instance.id ? 'opacity-50' : ''}`}>
                          {updatingAdminId === instance.id ? (
                            <Loader2 size={12} className="animate-spin text-emerald-500" />
                          ) : instance.admin?.avatar ? (
                            <img src={getAvatarUrl(instance.admin.avatar) || ''} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={14} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 pr-2">
                           <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Gestionnaire</span>
                           <span className={`text-xs text-slate-800 font-bold truncate max-w-[100px] leading-tight transition-colors ${userRole === 'AS' ? 'group-hover/popover:text-emerald-600 cursor-pointer' : ''}`}>
                              {instance.admin?.name || instance.admin?.email?.split('@')[0] || 'Non assigné'}
                           </span>
                        </div>

                        {/* Admin Selector Popover (Only AS) */}
                        <AnimatePresence>
                          {userRole === 'AS' && activePopoverId === instance.id && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: -8, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Réassigner le gestionnaire</span>
                              </div>
                              <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                {amUsers.map((user: any) => (
                                  <button
                                    key={user.id}
                                    onClick={() => handleAdminChange(instance.id, user.id)}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${instance.adminId === user.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                      {user.avatar ? <img src={getAvatarUrl(user.avatar) || ''} className="w-full h-full object-cover" /> : <Users size={14} className="text-slate-300" />}
                                    </div>
                                    <div className="flex flex-col items-start overflow-hidden text-left">
                                      <span className="text-xs font-bold truncate w-full">{user.name || 'Sans nom'}</span>
                                      <span className="text-[9px] text-slate-400 truncate w-full">{user.email}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex items-center gap-2">
                         <div className="relative group/status">
                            <button 
                               onClick={(e) => { e.stopPropagation(); toggleInstanceStatus(instance); }}
                               className={`p-2.5 rounded-xl transition-all shadow-sm ${userRole === 'AS' ? 'active:scale-95' : 'cursor-default'} ${instance.isOpen ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                            >
                               {instance.isOpen ? <Unlock size={18} /> : <Lock size={18} />}
                            </button>
                         </div>

                        <div className="relative group/config">
                           <Link 
                              href={`/dashboard/organization?instanceId=${instance.id}`}
                              className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm active:scale-95 border border-emerald-100 block"
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.setItem('active_instance_id', instance.id.toString());
                                window.dispatchEvent(new Event('storage'));
                              }}
                           >
                              <Settings2 size={18} />
                           </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ) : (
                <GlassCard key={instance.id} className="p-4 hover:bg-slate-50 transition-all border-none shadow-md">
                   <div className="flex items-center gap-6">
                      <div className={`p-3 rounded-2xl transition-colors ${instance.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {instance.isOpen ? <Globe size={24} /> : <Lock size={24} />}
                      </div>
                      <div className="flex-1">
                        <Link 
                          href={`/dashboard/organization?instanceId=${instance.id}`}
                          className="hover:text-emerald-600 transition-colors"
                          onClick={() => {
                            localStorage.setItem('active_instance_id', instance.id.toString());
                            window.dispatchEvent(new Event('storage'));
                          }}
                        >
                          <h3 className="font-black text-slate-800">{instance.schoolName}</h3>
                        </Link>
                        <div className="flex items-center gap-3 mt-1">
                           <p className="text-xs text-slate-400 font-medium">{instance.hostUrl || 'Pas d\'URL'}</p>
                        </div>
                      </div>

                      <div className="flex gap-8 text-center px-10 border-x border-slate-100">
                         <div className="flex flex-col">
                            <span className="text-lg font-black text-emerald-600 leading-none">{instance._count?.teams || 0}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Équipes</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-lg font-black text-emerald-600 leading-none">{instance.playersCount || 0}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Joueurs</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-2 pr-2">
                        {userRole === 'AS' && (
                          <>
                            <button 
                              onClick={() => { setSelectedInstance(instance); setShowEditModal(true); }}
                              className="p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button 
                              onClick={() => { setSelectedInstance(instance); setShowDeleteConfirm(true); }}
                              className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        <Link 
                            href={`/dashboard/organization?instanceId=${instance.id}`}
                            className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100 ml-2"
                            onClick={() => {
                              localStorage.setItem('active_instance_id', instance.id.toString());
                              window.dispatchEvent(new Event('storage'));
                            }}
                        >
                            <Settings2 size={18} />
                        </Link>
                      </div>
                   </div>
                </GlassCard>
              );
            })}

            {/* Empty space card for adding new (only in grid mode for AS) */}
            {viewMode === 'grid' && userRole === 'AS' && (
              <button 
                onClick={() => {
                  setSelectedInstance(null);
                  setShowEditModal(true);
                }}
                className="h-full min-h-[180px] border-4 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-emerald-500/30 hover:bg-emerald-50/20 hover:text-emerald-600 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 shadow-sm transition-all">
                  <Plus size={24} />
                </div>
                <span className="font-black uppercase tracking-widest text-xs">Ajouter une école</span>
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200">
              <Search size={48} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Aucun résultat</h3>
              <p className="text-slate-500 font-medium">
                {searchQuery ? `Aucun espace ne correspond à "${searchQuery}"` : "Vous n'avez pas encore d'espaces."}
              </p>
            </div>
            {!searchQuery && userRole === 'AS' && (
              <Button 
                variant="primary" 
                onClick={() => {
                  setSelectedInstance(null);
                  setShowEditModal(true);
                }}
                className="bg-emerald-600"
              >
                Créer la première école
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && userRole === 'AS' && (
          <InstanceEditModal 
            instance={selectedInstance}
            onClose={() => {
              setShowEditModal(false);
              setSelectedInstance(null);
            }}
            onUpdate={fetchInstances}
          />
        )}
        {showDeleteConfirm && userRole === 'AS' && (
          <InstanceDeleteConfirm 
            instance={selectedInstance}
            onClose={() => {
              setShowDeleteConfirm(false);
              setSelectedInstance(null);
            }}
            onConfirm={fetchInstances}
          />
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
