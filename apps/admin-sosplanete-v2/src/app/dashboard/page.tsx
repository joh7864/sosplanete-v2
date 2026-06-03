'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Loader2, Search, TrendingUp, LayoutGrid, List as ListIcon
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InstanceDeleteConfirm } from '@/components/instances/InstanceDeleteConfirm';
import { getAuthData, setAuthData } from '@/utils/storage';
import { useSchoolYear } from '@/hooks/useSchoolYear';
import { DashboardKpiBar } from '@/components/dashboard/DashboardKpiBar';
import { InstanceCard, Instance } from '@/components/dashboard/InstanceCard';

export default function DashboardSummaryPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [amUsers, setAmUsers] = useState<any[]>([]);
  const [activePopoverId, setActivePopoverId] = useState<number | null>(null);
  const [updatingAdminId, setUpdatingAdminId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);

  const { schoolYear } = useSchoolYear();

  useEffect(() => {
    const role = getAuthData('user_role');
    setUserRole(role);
    if (role === 'AS') {
      fetchAMUsers();
    }

    const handleClickOutside = () => setActivePopoverId(null);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [schoolYear]);

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

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances?schoolYear=${schoolYear}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setInstances(data);
        
        // Update local storage so the sidebar works with up-to-date instances
        setAuthData('managed_instances', JSON.stringify(data));
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
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({ isOpen: !instance.isOpen, schoolYear }),
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
          Authorization: `Bearer ${getAuthData('access_token')}`,
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

  // KPIs Calculations
  const stats = instances.reduce((acc, curr: any) => ({
    teams: acc.teams + (curr.teamsCount || 0),
    groups: acc.groups + 0, 
    actions: acc.actions + (curr.totalActionsDone || 0),
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
                 title="Vue Liste"
              >
                  <ListIcon size={16} />
              </button>
              <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-1.5 flex items-center justify-center rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                 title="Vue Grille"
              >
                  <LayoutGrid size={16} />
              </button>
            </div>
            {(userRole === 'AS' || userRole === 'AM') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  window.location.href = '/dashboard/organization?tab=general&new=true';
                }}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all border-none"
                title="Nouvel Espace"
              >
                <Plus size={20} />
              </motion.button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-20">

      {/* KPI Stats Bar */}
      <DashboardKpiBar stats={stats} />

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
            {filteredInstances.map((instance) => (
              <InstanceCard 
                key={instance.id}
                instance={instance}
                viewMode={viewMode}
                userRole={userRole}
                amUsers={amUsers}
                activePopoverId={activePopoverId}
                setActivePopoverId={setActivePopoverId}
                updatingAdminId={updatingAdminId}
                onToggleStatus={toggleInstanceStatus}
                onAdminChange={handleAdminChange}
                onDeleteClick={(inst) => { setSelectedInstance(inst); setShowDeleteConfirm(true); }}
              />
            ))}

            {/* Empty space card for adding new (only in grid mode for AS) */}
            {viewMode === 'grid' && (userRole === 'AS' || userRole === 'AM') && (
              <button 
                onClick={() => {
                  window.location.href = '/dashboard/organization?tab=general&new=true';
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
            {!searchQuery && (userRole === 'AS' || userRole === 'AM') && (
              <Button 
                variant="primary" 
                onClick={() => {
                  window.location.href = '/dashboard/organization?tab=general&new=true';
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
