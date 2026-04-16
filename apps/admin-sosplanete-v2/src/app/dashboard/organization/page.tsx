'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Team, Group, Child, ActionDone } from '@/types';
import { TeamEditModal } from '@/components/organization/TeamEditModal';
import { CsvImportModal } from '@/components/organization/CsvImportModal';
import { EditGroupModal } from '@/components/organization/EditGroupModal';
import { EditPlayerModal } from '@/components/organization/EditPlayerModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TopBar } from '@/components/layout/TopBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CatalogMapping } from '@/components/catalog/CatalogMapping';
import { GeneralSettings } from '@/components/organization/GeneralSettings';
import { CategorySettings } from '@/components/organization/CategorySettings';
import { 
  Plus, 
  Users, 
  Settings2, 
  Droplets, 
  Leaf, 
  Trash,
  Trash2,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Upload,
  CheckSquare,
  Check,
  Star,
  Globe,
  Unlock,
  Lock,
  Building2,
  Box,
  BarChart2,
  Calendar,
  BookOpen
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getAssetUrl } from '@/utils/assets';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';
import { formatEcoImpact } from '@/utils/format';

export default function OrganizationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>}>
      <OrganizationContent />
    </Suspense>
  );
}

function OrganizationContent() {
  const searchParams = useSearchParams();
  const urlInstanceId = searchParams.get('instanceId');
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'teams' | 'catalog' | 'categories'>(
    searchParams.get('tab') as any || 'general'
  );

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [instanceId, setInstanceId] = useState<number | null>(urlInstanceId ? parseInt(urlInstanceId) : null);

  const [managedInstances, setManagedInstances] = useState<any[]>([]);
  const [amUsers, setAmUsers] = useState<any[]>([]);
  const [activePopoverId, setActivePopoverId] = useState<number | null>(null);
  const [updatingAdminId, setUpdatingAdminId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check managed instances
    const savedInstances = getAuthData('managed_instances');
    if (savedInstances) setManagedInstances(JSON.parse(savedInstances));

    const isNewInstance = searchParams.get('new') === 'true';

    // Si pas d'ID dans l'URL, on cherche dans le localStorage (sauf si on crée une nouvelle instance)
    if (!instanceId && !isNewInstance) {
      const savedActiveId = getAuthData('active_instance_id');
      if (savedActiveId) {
        setInstanceId(parseInt(savedActiveId));
      }
    }

    const role = getAuthData('user_role');
    setUserRole(role);
    if (role === 'AS') {
      fetchAMUsers();
    }

    const handleClickOutside = () => setActivePopoverId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [instanceId]);

  const fetchAMUsers = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const allUsers = await resp.json();
        setAmUsers(allUsers.filter((u: any) => u.role === 'AM' || u.role === 'AS'));
      }
    } catch (e) {
      console.error('Fetch users error:', e);
    }
  };

  const updateManagedInstances = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setManagedInstances(data);
        setAuthData('managed_instances', JSON.stringify(data));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error('Fetch instances error:', e);
    }
  };

  const handleAdminChange = async (targetInstanceId: number, newAdminId: number) => {
    setUpdatingAdminId(targetInstanceId);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances/${targetInstanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({ adminId: newAdminId }),
      });
      if (resp.ok) {
        await updateManagedInstances();
        setActivePopoverId(null);
      }
    } catch (e) {
      console.error('Update admin error:', e);
    } finally {
      setUpdatingAdminId(null);
    }
  };

  const activeInstanceName = managedInstances.find(i => i.id.toString() === instanceId?.toString())?.schoolName || "l'Organisation";

  const getAvatarUrl = (path: string | null) => {
    return getAssetUrl(path);
  };

  useEffect(() => {
    if (instanceId) {
      fetchTeams();
    } else if (searchParams.get('new') === 'true') {
      setLoading(false);
    }
  }, [instanceId]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams?instanceId=${instanceId}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        setTeams(await resp.json());
      } else {
        setError("Impossible de charger les équipes.");
      }
    } catch (e) {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const loadData = fetchTeams; // Alias

  // --- NEW CRUD & BULK STATES ---
  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<{ teams: number[], groups: number[], children: number[] }>({ teams: [], groups: [], children: [] });
  
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  const [confirmData, setConfirmData] = useState<{title: string, description: string, onConfirm: () => Promise<void>} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- CRUD HANDLERS ---
  const toggleSelection = (type: 'teams' | 'groups' | 'children', id: number) => {
    setSelectedEntities(prev => {
      const arr = prev[type];
      if (arr.includes(id)) {
        return { ...prev, [type]: arr.filter(x => x !== id) };
      } else {
        return { ...prev, [type]: [...arr, id] };
      }
    });
  };

  const handleBulkDelete = async (type?: 'teams' | 'groups' | 'children', ids?: number[]) => {
    setIsLoading(true);
    try {
      if (type && ids) {
        // Individual/Contextual bulk delete
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${type === 'teams' ? 'bulk-delete' : `${type}/bulk-delete`}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
          body: JSON.stringify({ ids })
        });
      } else {
        // Global selection bulk delete
        if (selectedEntities.teams.length > 0) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/bulk-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
            body: JSON.stringify({ ids: selectedEntities.teams })
          });
        }
        if (selectedEntities.groups.length > 0) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/groups/bulk-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
            body: JSON.stringify({ ids: selectedEntities.groups })
          });
        }
        if (selectedEntities.children.length > 0) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/children/bulk-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
            body: JSON.stringify({ ids: selectedEntities.children })
          });
        }
        setSelectedEntities({ teams: [], groups: [], children: [] });
        setSelectionMode(false);
      }
      await fetchTeams();
    } catch (e) {
      console.error(e);
      setError("Erreur lors de la suppression.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGroup = async (data: { name: string; color: string }) => {
    try {
      const url = isNewGroup ? `${process.env.NEXT_PUBLIC_API_URL}/teams/groups` : `${process.env.NEXT_PUBLIC_API_URL}/teams/groups/${selectedGroup?.id}`;
      const method = isNewGroup ? 'POST' : 'PATCH';
      const body = isNewGroup ? { teamId: selectedTeam?.id, ...data } : data;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
        body: JSON.stringify(body)
      });
      await fetchTeams();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePlayer = async (data: { pseudo: string; password?: string }) => {
    try {
      const url = isNewPlayer ? `${process.env.NEXT_PUBLIC_API_URL}/teams/children` : `${process.env.NEXT_PUBLIC_API_URL}/teams/children/${selectedPlayer?.id}`;
      const method = isNewPlayer ? 'POST' : 'PATCH';
      const body = isNewPlayer ? { groupId: selectedGroup?.id, ...data } : data;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthData('access_token')}` },
        body: JSON.stringify(body)
      });
      await fetchTeams();
    } catch (e) {
      console.error(e);
    }
  };

  const calculateGroupVitality = (group: Group) => {
    let co2 = 0, water = 0, waste = 0;
    group.children?.forEach((child: Child) => {
      child.actionsDone?.forEach((action: ActionDone) => {
        co2 += action.savedCo2;
        water += action.savedWater;
        waste += action.savedWaste;
      });
    });
    return { co2, water, waste };
  };

  const isNewInstance = searchParams.get('new') === 'true';

  if (!instanceId && !isNewInstance) {
    return (
      <>
        <TopBar title="Configuration des Espaces" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="p-5 bg-emerald-50 rounded-3xl">
            <Globe size={48} className="text-emerald-500" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-800 mb-2">Aucun espace sélectionné</h2>
            <p className="text-slate-500 font-medium max-w-md">
              Veuillez sélectionner un espace dans le menu latéral pour accéder à sa configuration.
            </p>
          </div>
          {managedInstances.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {managedInstances.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => {
                    setAuthData('active_instance_id', inst.id.toString());
                    setInstanceId(inst.id);
                    window.dispatchEvent(new Event('storage'));
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group"
                >
                  <Building2 size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <span className="font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">{inst.schoolName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <TopBar title="Configuration" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={48} className="animate-spin text-emerald-500" />
          <p className="text-slate-500 font-medium">Chargement de votre organisation...</p>
        </div>
      </>
    );
  }

  const currentInstance = managedInstances.find(i => i.id === instanceId);

  return (
    <>
        <TopBar 
          title={activeTab === 'catalog' ? "Catalogue des actions SOS Planète" : (isNewInstance ? "Création d'un nouvel Espace" : (instanceId ? `Configuration de l'Espace ${currentInstance?.schoolName || ''}` : "Configuration des Espaces"))}
          subtitle={activeTab === 'catalog' ? "Personnalisez le catalogue pour cet espace" : (isNewInstance ? "Remplissez les informations de base pour démarrer" : "Gérez l'académie, le catalogue et les équipes")}
          selector={
            managedInstances.length > 1 ? (
                  <div className="relative">
                       <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                              document.getElementById('in-page-switcher')?.classList.toggle('hidden');
                          }}
                          className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-emerald-500"
                          title="Changer d'académie"
                      >
                          <Building2 size={24} />
                      </motion.button>
                      <div id="in-page-switcher" className="hidden absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-50 z-[90] p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-2 mb-1 sticky top-0 bg-white/95 backdrop-blur-xl z-10">Changer d'académie</p>
                           {managedInstances.map(inst => (
                               <button
                                   key={inst.id}
                                   onClick={() => {
                                       setAuthData('active_instance_id', inst.id.toString());
                                       setInstanceId(inst.id);
                                       window.dispatchEvent(new Event('storage'));
                                       document.getElementById('in-page-switcher')?.classList.add('hidden');
                                   }}
                                   className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 ${instanceId === inst.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
                               >
                                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                       <Building2 size={14} className={instanceId === inst.id ? 'text-emerald-500' : 'text-slate-400'} />
                                   </div>
                                   <div className="flex flex-col text-left overflow-hidden">
                                       <span className="text-xs font-black truncate w-full">{inst.schoolName}</span>
                                       <span className="text-[8px] font-bold opacity-60 truncate w-full">{inst.hostUrl}</span>
                                   </div>
                               </button>
                           ))}
                      </div>
                  </div>
            ) : undefined
          }
          className={isNewInstance ? "border-b-0" : ""}
          bottomContent={
            instanceId ? (
              <>
                  <button
                     onClick={() => setActiveTab('general')}
                     className={`flex items-center gap-3 py-4 pr-6 pl-4 text-[13px] font-black uppercase tracking-widest transition-all duration-300 relative whitespace-nowrap ${activeTab === 'general' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-800'}`}
                  >
                     <Settings2 size={18} /> Paramètres généraux
                     {activeTab === 'general' && <motion.div layoutId="activeOrganizationTab" className="absolute bottom-[-1px] left-0 right-6 h-[3px] bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.3)]" />}
                  </button>
                  <div className="w-px h-5 bg-slate-200 shrink-0" />

                  <button
                     onClick={() => setActiveTab('teams')}
                     className={`flex items-center gap-3 py-4 px-6 text-[13px] font-black uppercase tracking-widest transition-all duration-300 relative whitespace-nowrap ${activeTab === 'teams' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-800'}`}
                  >
                     <Users size={18} /> Configuration des équipes
                     {activeTab === 'teams' && <motion.div layoutId="activeOrganizationTab" className="absolute bottom-[-1px] left-6 right-6 h-[3px] bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.3)]" />}
                  </button>
                  <div className="w-px h-5 bg-slate-200 shrink-0" />
                  
                  <button
                     onClick={() => setActiveTab('catalog')}
                     className={`flex items-center gap-3 py-4 px-6 text-[13px] font-black uppercase tracking-widest transition-all duration-300 relative whitespace-nowrap ${activeTab === 'catalog' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-800'}`}
                  >
                     <BookOpen size={18} /> Configuration du catalogue
                     {activeTab === 'catalog' && <motion.div layoutId="activeOrganizationTab" className="absolute bottom-[-1px] left-6 right-6 h-[3px] bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.3)]" />}
                  </button>
                  <div className="w-px h-5 bg-slate-200 shrink-0" />

                  <button
                     onClick={() => setActiveTab('categories')}
                     className={`flex items-center gap-3 py-4 px-6 text-[13px] font-black uppercase tracking-widest transition-all duration-300 relative whitespace-nowrap ${activeTab === 'categories' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-800'}`}
                  >
                     <Droplets size={18} /> Configuration des catégories
                     {activeTab === 'categories' && <motion.div layoutId="activeOrganizationTab" className="absolute bottom-[-1px] left-6 right-6 h-[3px] bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.3)]" />}
                  </button>
              </>
            ) : undefined
          }
        />

        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-20 pt-6">
        {/* PAGE CONTENT */}
        {!instanceId && !isNewInstance ? (
            <div className="py-20 flex flex-col items-center gap-8 text-center max-w-2xl mx-auto">
                <div className="w-24 h-24 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                    <Building2 size={48} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sélectionnez un établissement</h2>
                  <p className="text-slate-500 mt-2">Choisissez l'académie ou l'école que vous souhaitez configurer aujourd'hui.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
                    {managedInstances.map(inst => (
                        <motion.button
                           key={inst.id}
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => {
                               setAuthData('active_instance_id', inst.id.toString());
                               setInstanceId(inst.id);
                               window.dispatchEvent(new Event('storage'));
                           }}
                           className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xl hover:border-emerald-500 hover:shadow-emerald-500/10 transition-all flex flex-col items-center gap-4 group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                <Building2 size={24} />
                            </div>
                            <div className="flex flex-col items-center flex-1">
                                <span className="font-black text-slate-800">{inst.schoolName}</span>
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{inst.hostUrl}</span>
                            </div>
                            
                            <div className="w-full mt-2 pt-4 border-t border-slate-100 flex items-center justify-between">
                              <div 
                                className="flex items-center gap-2 relative group/popover"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (userRole === 'AS') setActivePopoverId(activePopoverId === inst.id ? null : inst.id);
                                }}
                              >
                                <div className={`w-8 h-8 rounded-full bg-slate-50 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 transition-transform ${userRole === 'AS' ? 'group-hover/popover:scale-105 cursor-pointer' : ''} ${updatingAdminId === inst.id ? 'opacity-50' : ''}`}>
                                  {updatingAdminId === inst.id ? (
                                    <Loader2 size={12} className="animate-spin text-emerald-500" />
                                  ) : inst.admin?.avatar ? (
                                    <img src={getAvatarUrl(inst.admin.avatar) || ''} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Users size={14} className="text-slate-300" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0 pr-2">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Gestionnaire</span>
                                  <span className={`text-xs text-slate-800 font-bold truncate max-w-[100px] leading-tight transition-colors ${userRole === 'AS' ? 'group-hover/popover:text-emerald-600 cursor-pointer' : ''}`}>
                                      {inst.admin?.name || inst.admin?.email?.split('@')[0] || 'Non assigné'}
                                  </span>
                                </div>

                                {/* Admin Selector Popover (Only AS) */}
                                <AnimatePresence>
                                  {userRole === 'AS' && activePopoverId === inst.id && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                      animate={{ opacity: 1, y: -8, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] overflow-hidden text-left"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Réassigner le gestionnaire</span>
                                      </div>
                                      <div className="max-h-[180px] overflow-y-auto p-1 custom-scrollbar">
                                        {amUsers.map((user: any) => (
                                          <button
                                            key={user.id}
                                            onClick={() => handleAdminChange(inst.id, user.id)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${inst.adminId === user.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
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
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        ) : (
          <>
        {activeTab === 'general' ? (
          <GeneralSettings instanceId={instanceId!} currentInstance={currentInstance} onUpdate={updateManagedInstances} />
        ) : activeTab === 'categories' ? (
          <CategorySettings instanceId={instanceId!} />
        ) : activeTab === 'catalog' ? (
          <CatalogMapping instanceId={instanceId!} />
        ) : activeTab === 'teams' ? (
          <>
            {/* Global Stats Bar Integrated Actions */}
            {(() => {
              const totalGroups = teams.reduce((acc: number, t: any) => acc + (t.groups?.length || 0), 0);
              const totalPlayers = teams.reduce((acc: number, t: any) => acc + (t.groups?.reduce((accG: number, g: any) => accG + (g.children?.length || 0), 0) || 0), 0);
              const totalActions = teams.reduce((acc: number, t: any) => acc + (t.groups?.reduce((accG: number, g: any) => 
                accG + (g.children?.reduce((accC: number, c: any) => accC + (c.actionsDone?.length || 0), 0) || 0)
              , 0) || 0), 0);
              
              let totalCo2 = 0, totalWater = 0, totalWaste = 0;
              teams.forEach((t: any) => t.groups?.forEach((g: any) => {
                const vit = calculateGroupVitality(g);
                totalCo2 += vit.co2;
                totalWater += vit.water;
                totalWaste += vit.waste;
              }));

          return (
            <GlassCard className="mb-2 border-none shadow-xl overflow-hidden py-4 px-8 bg-white/80">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 lg:gap-10 flex-wrap">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-800 leading-none">{teams.length}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Équipes</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-800 leading-none">{totalGroups}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Groupes</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-800 leading-none">{totalPlayers}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Joueurs</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-emerald-600 leading-none">{totalActions}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Actions</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 lg:gap-8 ml-auto">
                    <div className="flex items-center gap-4 border-r border-slate-100 pr-6 mr-2">
                        <div className="flex items-center gap-2">
                           <Leaf size={18} className="text-emerald-500" />
                           <div className="flex flex-col items-end">
                             <span className="text-lg font-black text-slate-800 leading-none">{formatEcoImpact(totalCo2, 'co2')}</span>
                             <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">CO2e</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Droplets size={18} className="text-blue-500" />
                           <div className="flex flex-col items-end">
                             <span className="text-lg font-black text-slate-800 leading-none">{formatEcoImpact(totalWater, 'water')}</span>
                             <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Eau</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Trash2 size={18} className="text-amber-500" />
                           <div className="flex flex-col items-end">
                             <span className="text-lg font-black text-slate-800 leading-none">{formatEcoImpact(totalWaste, 'waste')}</span>
                             <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Déchets</span>
                           </div>
                        </div>
                    </div>

                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectionMode(!isSelectionMode)}
                        title={isSelectionMode ? "Désactiver la sélection" : "Activer la sélection"}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelectionMode ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      >
                         <CheckSquare size={18} />
                      </button>
                      <button 
                         onClick={() => setShowImportModal(true)}
                         title="Importer des données (CSV)"
                         className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                      >
                         <Upload size={18} />
                      </button>
                   </div>
                </div>
             </div>
            </GlassCard>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {teams.map((team, idx) => (
          <TeamCard 
            key={team.id} 
            team={team} 
            index={idx} 
            isExpanded={expandedId === team.id}
            onToggle={() => setExpandedId(expandedId === team.id ? null : team.id)}
            vitalityCalc={calculateGroupVitality}
            setSelectedTeam={setSelectedTeam}
            setShowTeamModal={setShowTeamModal}
            isSelectionMode={isSelectionMode}
            isSelected={selectedEntities.teams.includes(team.id)}
            onSelect={(id: number) => toggleSelection('teams', id)}
            onEditGroup={(g: any) => {
              setSelectedGroup(g);
              setShowGroupModal(true);
              setIsNewGroup(false);
            }}
            onAddGroup={() => {
              setSelectedTeam(team);
              setShowGroupModal(true);
              setIsNewGroup(true);
            }}
            onEditPlayer={(p: any) => {
              setSelectedPlayer(p);
              setShowPlayerModal(true);
              setIsNewPlayer(false);
            }}
            onAddPlayer={(gId: number) => {
              setSelectedGroup({ id: gId } as any);
              setShowPlayerModal(true);
              setIsNewPlayer(true);
            }}
            onSelectPlayer={(id: number) => toggleSelection('children', id)}
            selectedChildrenIds={selectedEntities.children}
            onDeletePlayer={(p: any) => {
              setConfirmData({
                title: "Supprimer l'équipier",
                description: `Voulez-vous vraiment supprimer @${p.pseudo} ? Cette action est irréversible.`,
                onConfirm: () => handleBulkDelete('children', [p.id])
              });
            }}
          />
        ))}

        {/* Empty space card for adding new team (only in grid) */}
        {!expandedId && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group cursor-pointer min-h-[160px]"
            onClick={() => {
              setSelectedTeam(null);
              setShowTeamModal(true);
            }}
          >
            <GlassCard className="h-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-emerald-300 hover:text-emerald-500 transition-all bg-white/20">
               <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <Plus size={24} />
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest">Nouvelle équipe</span>
            </GlassCard>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isSelectionMode && (selectedEntities.teams.length > 0 || selectedEntities.groups.length > 0 || selectedEntities.children.length > 0) && (
          <motion.div 
             initial={{ y: 100, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 100, opacity: 0 }}
             className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] w-full max-w-2xl px-4"
          >
             <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-slate-700/50 backdrop-blur-xl bg-opacity-90">
               <div className="flex items-center gap-6 px-4">
                  <div className="flex flex-col">
                     <span className="text-xl font-black">{selectedEntities.teams.length + selectedEntities.groups.length + selectedEntities.children.length}</span>
                     <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 leading-none">Éléments sélectionnés</span>
                  </div>
               </div>
               <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setSelectedEntities({ teams: [], groups: [], children: [] })} className="text-slate-400 hover:text-white">Désélectionner</Button>
                  <Button onClick={() => setConfirmData({ title: "Suppression", description: "Confirmer ?", onConfirm: handleBulkDelete })} className="bg-red-500 hover:bg-red-600 px-8 rounded-2xl">
                     <Trash2 size={18} className="mr-2" /> Supprimer
                  </Button>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {showImportModal && (
          <CsvImportModal 
            isOpen={showImportModal} 
            onClose={() => setShowImportModal(false)} 
            onImport={loadData}
            instanceId={instanceId || 0}
            instanceName={activeInstanceName}
          />
        )}
        
        {showTeamModal && (
          <TeamEditModal 
            isOpen={showTeamModal}
            onClose={() => setShowTeamModal(false)}
            team={selectedTeam}
            instanceId={instanceId || 0}
            onUpdate={loadData}
          />
        )}

        {showGroupModal && (
          <EditGroupModal 
            isOpen={showGroupModal}
            onClose={() => setShowGroupModal(false)}
            isNew={isNewGroup}
            initialData={selectedGroup ? { name: selectedGroup.name, color: selectedGroup.color || '' } : undefined}
            onSave={handleSaveGroup}
            onDelete={!isNewGroup ? async () => {
              setConfirmData({
                title: "Supprimer ce groupe",
                description: `Êtes-vous sûr de vouloir supprimer le groupe "${selectedGroup?.name}" ? Tous les joueurs associés seront également supprimés.`,
                onConfirm: () => handleBulkDelete('groups', [selectedGroup!.id])
              });
            } : undefined}
          />
        )}

        {showPlayerModal && (
          <EditPlayerModal 
            isOpen={showPlayerModal}
            onClose={() => setShowPlayerModal(false)}
            isNew={isNewPlayer}
            initialData={selectedPlayer ? { pseudo: selectedPlayer.pseudo, password: selectedPlayer.password || '' } : undefined}
            onSave={handleSavePlayer}
            onDelete={!isNewPlayer ? async () => {
              setConfirmData({
                title: "Supprimer l'équipier",
                description: `Supprimer définitivement l'accès pour @${selectedPlayer?.pseudo} ?`,
                onConfirm: () => handleBulkDelete('children', [selectedPlayer!.id])
              });
            } : undefined}
          />
        )}

        {confirmData && (
          <ConfirmDialog 
            isOpen={!!confirmData}
            onClose={() => setConfirmData(null)}
            onConfirm={async () => {
              await confirmData?.onConfirm();
              setConfirmData(null);
            }}
            title={confirmData?.title || ''}
            description={confirmData?.description || ''}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>
      
          </>
        ) : null}
      </>
    )}
    </div>
    </>
  );
}

function TeamCard({ 
  team, isExpanded, onToggle, vitalityCalc, setSelectedTeam, setShowTeamModal,
  isSelectionMode, isSelected, onSelect, onEditGroup, onAddGroup, onEditPlayer, onAddPlayer,
  onDeletePlayer, onSelectPlayer, selectedChildrenIds
}: any) {
  const cardColor = team.color || '#40916C';
  // Résolution de l'image de l'équipe via le backend
  const logoPath = team.icon ? getAssetUrl(`teams/${team.icon.split('/').pop()}`) : null;

  const groupsCount = team.groups?.length || 0;
  const playersCount = team.groups?.reduce((acc: number, g: any) => acc + (g.children?.length || 0), 0) || 0;
  
  const teamImpact = team.groups?.reduce((acc: any, g: any) => {
    const calc = vitalityCalc(g);
    return { co2: acc.co2 + calc.co2, water: acc.water + calc.water, waste: acc.waste + calc.waste };
  }, { co2:0, water:0, waste:0 }) || { co2:0, water:0, waste:0 };

  return (
    <motion.div layout className={`relative transition-all duration-500 ${isExpanded ? 'col-span-full' : ''}`}>
      <GlassCard 
        padding="none" 
        className={`border-none shadow-xl overflow-hidden flex flex-col transition-all bg-white/70 ${isExpanded ? 'ring-1 ring-slate-200' : 'hover:scale-[1.02] cursor-pointer ring-1 ring-slate-100 hover:ring-emerald-200'}`}
        onClick={() => { if (isSelectionMode) onSelect(team.id); else if (!isExpanded) onToggle(); }}
      >
        <div className="h-1.5 w-full" style={{ backgroundColor: cardColor }} />
        
        {isSelectionMode && (
          <div className="absolute top-6 left-6 z-10">
             <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200'}`}>
                {isSelected && <Check size={14} strokeWidth={4} />}
             </div>
          </div>
        )}

        <div className="p-6">
          {!isExpanded ? (
            /* COMPACT GRID VIEW */
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                  {logoPath ? <img src={logoPath} alt="" className="w-full h-full object-cover p-1.5" /> : <Users className="text-slate-300" size={20} />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-800 truncate">{team.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{groupsCount} Groupes • {playersCount} Joueurs</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex gap-3">
                  <div className="flex items-center gap-1"><Leaf size={12} className="text-emerald-500"/><span className="text-[10px] font-black">{formatEcoImpact(teamImpact.co2, 'co2', 1)}</span></div>
                  <div className="flex items-center gap-1"><Droplets size={12} className="text-blue-500"/><span className="text-[10px] font-black">{formatEcoImpact(teamImpact.water, 'water', 1)}</span></div>
                  <div className="flex items-center gap-1"><Trash size={12} className="text-amber-500"/><span className="text-[10px] font-black">{formatEcoImpact(teamImpact.waste, 'waste', 1)}</span></div>
                </div>
                <div className="flex items-center gap-1">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); setShowTeamModal(true); }}
                     className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                   >
                     <Settings2 size={16} />
                   </button>
                   <ChevronDown size={18} className="text-slate-300" />
                </div>
              </div>
            </div>
          ) : (
            /* EXPANDED FULL WIDTH VIEW */
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                      {logoPath ? <img src={logoPath} alt="" className="w-full h-full object-cover p-2" /> : <Users className="text-slate-300" size={32} />}
                   </div>
                   <div>
                      <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{team.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold text-slate-500">{groupsCount} groupes</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-sm font-bold text-slate-500">{playersCount} joueurs</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
                  <div className="hidden md:flex items-center gap-6">
                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-2 text-emerald-600 font-black"><Leaf size={14} /> {formatEcoImpact(teamImpact.co2, 'co2', 1)}</div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CO2 Évité</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-2 text-blue-600 font-black"><Droplets size={14} /> {formatEcoImpact(teamImpact.water, 'water', 1)}</div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eau sauvée</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-2 text-amber-600 font-black"><Trash size={14} /> {formatEcoImpact(teamImpact.waste, 'waste', 1)}</div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Déchets</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddGroup(); }}
                    title="Ajouter un groupe"
                    className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggle(); }} 
                    className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 shadow-sm border border-slate-200 hover:bg-slate-100 transition-all rotate-180"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              </div>

              <div className="w-full">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {team.groups.map((group: any) => {
                       // Pre-calculate group totals for the footer
                       let groupTotalActions = 0, groupTotalCo2 = 0, groupTotalWater = 0, groupTotalWaste = 0;
                       group.children?.forEach((c: any) => {
                          const pActs = c.actionsDone?.length || 0;
                          groupTotalActions += pActs;
                          c.actionsDone?.forEach((a: any) => {
                             groupTotalCo2 += a.savedCo2; groupTotalWater += a.savedWater; groupTotalWaste += a.savedWaste;
                          });
                       });

                       const forceTonnesCo2 = groupTotalCo2 >= 1000;
                       const forceM3Water = groupTotalWater >= 1000;
                       const forceTonnesWaste = groupTotalWaste >= 1000;

                       // Sort players: Actions Desc, then Name Asc
                       const sortedChildren = [...(group.children || [])].sort((a, b) => {
                         const actionsA = a.actionsDone?.length || 0;
                         const actionsB = b.actionsDone?.length || 0;
                         if (actionsB !== actionsA) return actionsB - actionsA;
                         return a.pseudo.localeCompare(b.pseudo);
                       });

                       return (
                        <div key={group.id} className="rounded-2xl bg-white border border-slate-100 flex flex-col shadow-sm hover:shadow-md transition-all overflow-hidden">
                          <div className="h-1 w-full" style={{ backgroundColor: group.color || cardColor }} />
                          <div className="p-6 flex flex-col gap-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-lg font-black text-slate-800 tracking-tight">{group.name}</h5>
                                <div className="flex items-center gap-2 mt-0.5">
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{group.children.length} Équipiers</p>
                                   <div className="w-1 h-1 rounded-full bg-slate-200" />
                                   <p className="text-[10px] text-[var(--color-sage)] font-black uppercase tracking-widest">{groupTotalActions} Actions</p>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <button onClick={() => onAddPlayer(group.id)} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm"><Plus size={14} /></button>
                                <button onClick={() => onEditGroup(group)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors border border-slate-100"><Settings2 size={14} /></button>
                              </div>
                            </div>

                            {/* TABLE-LIKE LIST */}
                            <div className="flex flex-col mt-2">
                              {/* HEADER */}
                              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                 <div className="w-6 shrink-0" />
                                 <div className="w-32 shrink-0">Pseudo</div>
                                 <div className="flex items-center gap-3 shrink-0 flex-1 justify-end">
                                    <div className="w-12 text-right flex items-center justify-end gap-1">
                                       <Star size={10} className="text-amber-500 opacity-70" /> Actions
                                    </div>
                                    <div className="w-14 text-right flex items-center justify-end gap-1 text-[7px]">
                                       <Leaf size={10} className="text-emerald-500 opacity-70" /> CO2e
                                    </div>
                                    <div className="w-12 text-right flex items-center justify-end gap-1 text-[7px]">
                                       <Droplets size={10} className="text-blue-500 opacity-70" /> Eau
                                    </div>
                                    <div className="w-12 text-right flex items-center justify-end gap-1 text-[7px]">
                                       <Trash size={10} className="text-amber-500 opacity-70" /> Déchets
                                    </div>
                                 </div>
                              </div>

                              {/* ROWS */}
                              <div className="flex flex-col max-h-[250px] overflow-y-auto custom-scrollbar">
                                 {sortedChildren.map((c: any) => {
                                   const playerActions = c.actionsDone?.length || 0;
                                   let pCo2 = 0, pWater = 0, pWaste = 0;
                                   c.actionsDone?.forEach((a: any) => {
                                      pCo2 += a.savedCo2; pWater += a.savedWater; pWaste += a.savedWaste;
                                   });

                                   return (
                                     <div 
                                       key={c.id} 
                                       className="flex items-center justify-between py-1 px-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group/row"
                                     >
                                       <div className="flex items-center gap-3 w-32 shrink-0 overflow-hidden">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); onSelectPlayer(c.id); }}
                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${selectedChildrenIds.includes(c.id) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200'}`}
                                          >
                                            {selectedChildrenIds.includes(c.id) && <Check size={10} strokeWidth={4} />}
                                          </button>
                                          <div 
                                            className="min-w-0 cursor-pointer hover:text-emerald-600 transition-colors"
                                            onClick={() => onEditPlayer(c)}
                                          >
                                            <span className="text-[11px] font-black text-slate-800 truncate block">{c.pseudo}</span>
                                          </div>
                                       </div>

                                       <div className="flex items-center gap-3 shrink-0 flex-1 justify-end">
                                          <div className="w-12 text-right">
                                            <span className="text-[10px] font-black text-amber-600">{playerActions}</span>
                                          </div>
                                          <div className="w-14 text-right">
                                            <span className="text-[10px] font-bold text-slate-500">{formatEcoImpact(pCo2, 'co2', 1, forceTonnesCo2)}</span>
                                          </div>
                                          <div className="w-12 text-right">
                                            <span className="text-[10px] font-bold text-slate-500">{formatEcoImpact(pWater, 'water', 1, forceM3Water)}</span>
                                          </div>
                                          <div className="w-12 text-right">
                                            <span className="text-[10px] font-bold text-slate-500">{formatEcoImpact(pWaste, 'waste', 1, forceTonnesWaste)}</span>
                                          </div>
                                          
                                          <div className="w-6 flex justify-end">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); onDeletePlayer(c); }}
                                              className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover/row:opacity-100"
                                              title="Supprimer l'équipier"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                       </div>
                                     </div>
                                   );
                                 })}
                              </div>

                              {/* FOOTER (TOTALS) */}
                              <div className="flex items-center justify-between px-3 py-2 mt-1 border-t-2 border-slate-50 bg-slate-50/10 rounded-b-xl backdrop-blur-sm">
                                 <div className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Groupe</div>
                                 <div className="flex items-center gap-3 shrink-0">
                                    <div className="w-12 text-right">
                                       <span className="text-[10px] font-black text-amber-600">{groupTotalActions}</span>
                                    </div>
                                    <div className="w-12 text-right">
                                       <span className="text-[10px] font-black text-slate-800">{formatEcoImpact(groupTotalCo2, 'co2', 1, forceTonnesCo2)}</span>
                                    </div>
                                    <div className="w-14 text-right">
                                       <span className="text-[10px] font-black text-slate-800">{formatEcoImpact(groupTotalWater, 'water', 1, forceM3Water)}</span>
                                    </div>
                                    <div className="w-12 text-right">
                                       <span className="text-[10px] font-black text-slate-800">{formatEcoImpact(groupTotalWaste, 'waste', 1, forceTonnesWaste)}</span>
                                    </div>
                                 </div>
                              </div>
                            </div>
                          </div>
                        </div>
                       );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
