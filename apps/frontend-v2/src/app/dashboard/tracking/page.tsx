'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  Users, 
  BarChart2, 
  CheckCircle2, 
  Trophy, 
  Calendar,
  ChevronRight,
  Search,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  Building2,
  Upload,
  Check,
  Maximize2,
  Minimize2,
  X,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getAuthData } from '@/utils/storage';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionsImportModal } from '@/components/tracking/ActionsImportModal';

interface TrackingData {
  config: {
    startDate: string;
    periodsCount: number;
  };
  periods: Array<{ label: string; start: string; end: string }>;
  children: Array<{
    id: number;
    pseudo: string;
    teamId: number;
    teamName: string;
    groupId: number;
    groupName: string;
    avatar?: string;
    weeks: number[];
    total: number;
  }>;
  weeklyTotals: number[];
  grandTotal: number;
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>}>
      <TrackingContent />
    </Suspense>
  );
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const urlInstanceId = searchParams.get('instanceId');
  const [instanceId, setInstanceId] = useState<number | null>(urlInstanceId ? parseInt(urlInstanceId) : null);
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [managedInstances, setManagedInstances] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showInstanceSelector, setShowInstanceSelector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideInactive, setHideInactive] = useState(false);
  const [hideEmptyPeriods, setHideEmptyPeriods] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<'child' | 'team' | 'group' | null>(null);

  // Valeurs de configuration pour la densification
  const CELL_WIDTH = 32; // px
  const STATIC_COLS_WIDTH = 340; // Total des colonnes de gauche


  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instances`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setManagedInstances(data);
      }
    } catch (e) {
      console.error('Fetch instances error:', e);
    }
  };

  useEffect(() => {
    const role = getAuthData('user_role');
    setUserRole(role);

    if (!instanceId) {
      const savedActiveId = getAuthData('active_instance_id');
      if (savedActiveId) {
        setInstanceId(parseInt(savedActiveId));
      } else {
        setLoading(false); // Eviter le chargement infini si aucun espace n'est sélectionné
      }
    } else {
      fetchStats();
    }

    const handleClickOutside = () => setShowInstanceSelector(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [instanceId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracking/stats?instanceId=${instanceId}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        setData(await resp.json());
      }
    } catch (e) {
      console.error('Failed to fetch tracking stats', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={48} className="animate-spin text-emerald-500" />
        <p className="text-slate-500 font-medium">Analyse des performances en cours...</p>
      </div>
    );
  }

  if (!instanceId) {
    return (
      <div className="flex flex-col items-center gap-10 py-10 max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Suivi des Jeux</h2>
          <p className="text-slate-500 mt-2">Veuillez sélectionner un établissement pour consulter ses statistiques de performance.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full px-4">
          {managedInstances.map(inst => (
            <motion.button
              key={inst.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setInstanceId(inst.id);
                // Optionnel : mettre à jour l'espace actif global
                // setAuthData('active_instance_id', inst.id.toString());
              }}
              className="p-8 rounded-3xl bg-white border border-slate-100 shadow-xl hover:border-emerald-500 hover:shadow-emerald-500/10 transition-all flex flex-col items-center gap-4 group text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <Building2 size={32} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-slate-800">{inst.schoolName}</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{inst.hostUrl}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center gap-2">
        <span>Erreur lors du chargement des données de ce site.</span>
      </div>
      <button onClick={() => setInstanceId(null)} className="text-slate-400 font-bold hover:text-slate-800 transition-colors">Retour à la sélection</button>
    </div>
  );

  const teams = Array.from(new Set(data.children.map(c => JSON.stringify({id: c.teamId, name: c.teamName}))))
    .map(s => JSON.parse(s))
    .sort((a, b) => a.name.localeCompare(b.name));
    
  const groups = Array.from(new Set(data.children
    .filter(c => selectedTeam === 'all' || c.teamId.toString() === selectedTeam)
    .map(c => JSON.stringify({id: c.groupId, name: c.groupName}))))
    .map(s => JSON.parse(s))
    .sort((a, b) => a.name.localeCompare(b.name));
    
  const chartData = data.periods.map((p, i) => ({
    name: p.label,
    actions: data.weeklyTotals[i],
    date: new Date(p.start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }));

  const filteredChildren = data.children.filter(c => {
    const matchesSearch = c.pseudo.toLowerCase().includes(search.toLowerCase()) || 
                         c.teamName.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = selectedTeam === 'all' || c.teamId.toString() === selectedTeam;
    const matchesGroup = selectedGroup === 'all' || c.groupId.toString() === selectedGroup;
    const matchesActivity = !hideInactive || c.total > 0;
    return matchesSearch && matchesTeam && matchesGroup && matchesActivity;
  });

  // Calculs dynamiques pour le tableau uniquement
  const computedWeeklyTotals = data.periods.map((_, weekIdx) => {
    return filteredChildren.reduce((sum, child) => sum + (child.weeks[weekIdx] || 0), 0);
  });

  const computedTableGrandTotal = filteredChildren.reduce((sum, child) => sum + child.total, 0);

  const visiblePeriodIndices = data.periods
    .map((_, i) => i)
    .filter(i => !hideEmptyPeriods || computedWeeklyTotals[i] > 0);

  const teamStats = teams.map(team => {
    const teamChildren = data.children.filter(c => c.teamId === team.id);
    const total = teamChildren.reduce((sum, c) => sum + c.total, 0);
    return {
      ...team,
      total,
      memberCount: teamChildren.length,
      avg: teamChildren.length > 0 ? Math.round(total / teamChildren.length) : 0
    };
  }).sort((a, b) => b.total - a.total);

  const groupStats = groups.map(group => {
    const groupChildren = data.children.filter(c => c.groupId === group.id);
    const total = groupChildren.reduce((sum, c) => sum + c.total, 0);
    return {
      ...group,
      total,
      memberCount: groupChildren.length,
      avg: groupChildren.length > 0 ? Math.round(total / groupChildren.length) : 0
    };
  }).sort((a, b) => b.total - a.total);

  const topTeam = teamStats[0];
  const topChild = data.children.length > 0 
    ? [...data.children].sort((a, b) => b.total - a.total)[0]
    : null;

  const getHeatmapStyle = (count: number) => {
    if (count === 0) return 'bg-slate-50/30 text-slate-300';
    if (count <= 2) return 'bg-emerald-100 text-emerald-800 font-bold';
    if (count <= 5) return 'bg-emerald-300 text-emerald-900 font-bold';
    if (count <= 10) return 'bg-emerald-500 text-white font-black';
    return 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20';
  };

  const getPlayerAvatar = (pseudo: string, avatarPath?: string) => {
    if (avatarPath) return avatarPath;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${pseudo}&backgroundColor=f1f5f9`;
  };

  const activeInstanceName = managedInstances.find(i => i.id === instanceId)?.schoolName;

  return (
    <div className="flex flex-col gap-4 pb-20">
      <TopBar 
        title={`Suivi Jeux ${activeInstanceName ? `• ${activeInstanceName}` : ''}`} 
        actions={
          <div className="flex items-center gap-2">
            {userRole === 'AS' && instanceId && (
              <button 
                onClick={() => setShowImportModal(true)}
                className="p-2 rounded-xl bg-white text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-100 shadow-sm"
                title="Importer Saisies CSV"
              >
                <Upload size={20} />
              </button>
            )}

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setShowInstanceSelector(!showInstanceSelector)}
                className={`p-2 rounded-xl transition-all border shadow-sm ${showInstanceSelector ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-slate-100 hover:text-emerald-600 hover:bg-emerald-50'}`}
                title="Changer d'établissement"
              >
                <Building2 size={20} />
              </button>

              <AnimatePresence>
                {showInstanceSelector && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-2 border-b border-slate-50">
                      <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Espaces gérés</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                      {managedInstances.map(inst => (
                        <button
                          key={inst.id}
                          onClick={() => {
                            setInstanceId(inst.id);
                            setShowInstanceSelector(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${instanceId === inst.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <span className="text-xs font-bold truncate">{inst.schoolName}</span>
                          {instanceId === inst.id && <Check size={14} strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        <GlassCard className="p-4 flex flex-col justify-between h-[110px]">
          <div className="flex items-start justify-between w-full">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions Totales</p>
              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">Global</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-800">{data.grandTotal.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Cumulées</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between h-[110px]">
          <div className="flex items-start justify-between w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernière Semaine</p>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <Calendar size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-800">{data.weeklyTotals[data.weeklyTotals.length - 1]?.toLocaleString() || 0}</h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Actions en S{data.weeklyTotals.length}</p>
          </div>
        </GlassCard>

        {/* TOP EQUIPE */}
        <GlassCard 
          onClick={() => setLeaderboardType('team')}
          className="p-4 flex flex-col justify-between h-[110px] cursor-pointer hover:border-amber-500/30 hover:bg-amber-50/10 transition-all group"
        >
          <div className="flex items-start justify-between w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-600 transition-colors">Top Équipe</p>
            <div className="p-2 bg-amber-100 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
              <Trophy size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 overflow-hidden">
            <h3 className="text-2xl font-black text-slate-800 truncate">{topTeam?.name || '---'}</h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap truncate">{topTeam?.total || 0} pts</p>
          </div>
        </GlassCard>

        {/* TOP ENFANT */}
        <GlassCard 
          onClick={() => setLeaderboardType('child')}
          className="p-4 flex flex-col justify-between h-[110px] cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-50/10 transition-all group border-emerald-100/50"
        >
          <div className="flex items-start justify-between w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Top Enfant</p>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
              <Trophy size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 overflow-hidden">
            <h3 className="text-2xl font-black text-slate-800 truncate">{topChild?.pseudo || '---'}</h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap truncate">{topChild?.total || 0} act.</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between h-[110px]">
          <div className="flex items-start justify-between w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Participation</p>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-500">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-800">
              {Math.round((data.children.filter(c => c.total > 0).length / data.children.length) * 100)}%
            </h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{data.children.filter(c => c.total > 0).length} enfants actifs</p>
          </div>
        </GlassCard>
      </div>

      {/* Heatmap Section */}
      <div className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] bg-slate-950/20 backdrop-blur-md p-4 md:p-10 flex items-center justify-center' : ''}`}>
        <GlassCard padding="none" className={`overflow-hidden border-none shadow-2xl transition-all duration-300 ${isFullscreen ? 'w-full h-full' : ''}`}>
          <div className={`flex flex-col h-full ${isFullscreen ? 'p-8' : 'p-6'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Détail des actions</h2>
                    <div className="px-2 py-0.5 rounded-full bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-tighter">Live</div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Saisie hebdomadaire par élève</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                      {/* Hide Inactive Toggle */}
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                        <input 
                          type="checkbox"
                          checked={hideInactive}
                          onChange={(e) => setHideInactive(e.target.checked)}
                          className="w-3 h-3 accent-emerald-500 rounded border-slate-300"
                        />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Masquer enfants inactifs</span>
                      </label>

                      {/* Hide Empty Periods Toggle */}
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                        <input 
                          type="checkbox"
                          checked={hideEmptyPeriods}
                          onChange={(e) => setHideEmptyPeriods(e.target.checked)}
                          className="w-3 h-3 accent-sky-500 rounded border-slate-300"
                        />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Masquer périodes vides</span>
                      </label>

                    {/* Team Filter */}
                    <select 
                      value={selectedTeam}
                      onChange={(e) => {
                        setSelectedTeam(e.target.value);
                        setSelectedGroup('all');
                      }}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 cursor-pointer"
                    >
                      <option value="all">Toutes les équipes</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                    {/* Group Filter */}
                    <select 
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 cursor-pointer"
                    >
                      <option value="all">Tous les groupes</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Chercher élève..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-40 font-black"
                      />
                    </div>

                    {/* FULLSCREEN TOGGLE */}
                    <button 
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className={`p-1.5 rounded-xl border transition-all ${isFullscreen ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:text-slate-900'}`}
                      title={isFullscreen ? "Quitter le plein écran" : "Passer en plein écran"}
                    >
                      {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>
              </div>

              <div className={`overflow-x-auto custom-scrollbar flex-1 ${isFullscreen ? 'h-full' : ''}`}>
                <div className={`min-w-fit flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="w-[80px] px-3 py-2 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 sticky left-0 bg-slate-50/50 z-20">Équipe</th>
                        <th className="w-[80px] px-3 py-2 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 sticky left-[80px] bg-slate-50/50 z-20">Groupe</th>
                        <th className="w-[120px] px-3 py-2 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Enfant</th>
                        <th className="w-[60px] px-3 py-2 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 text-center bg-emerald-50/50">Total</th>
                        <th className="p-0 border-b border-slate-100">
                          <div className="flex">
                            {visiblePeriodIndices.map((idx) => {
                              const p = data.periods[idx];
                              return (
                                <div key={idx} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} className="p-0.5 text-[8px] font-black uppercase text-slate-500 tracking-tighter border-l border-slate-100/50 text-center flex flex-col items-center justify-center h-12 bg-white/50">
                                  <span className="text-slate-400 text-[7px] leading-none opacity-70">{p.label}</span>
                                  <span className="text-slate-800 font-bold mt-0.5 leading-none">
                                    {new Date(p.start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </th>
                      </tr>
                    </thead>
                  </table>
                  
                  <div className={`custom-scrollbar ${isFullscreen ? 'flex-1 overflow-y-auto' : 'max-h-[600px] overflow-y-auto'}`}>
                    <table className="w-full text-left border-collapse table-fixed">
                      <tbody className="divide-y divide-slate-100">
                        {filteredChildren.map((child) => (
                          <tr key={child.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="w-[80px] px-3 py-1.5 border-b border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 text-[9px] font-black text-slate-800 truncate">
                              {child.teamName}
                            </td>
                            <td className="w-[80px] px-3 py-1.5 border-b border-slate-100 sticky left-[80px] bg-white group-hover:bg-slate-50/50 z-10 text-[8px] font-bold text-slate-400 uppercase tracking-tight truncate">
                              {child.groupName}
                            </td>
                            <td className="w-[120px] px-3 py-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                                   <img src={getPlayerAvatar(child.pseudo, child.avatar)} alt="" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[9px] font-black text-emerald-600 truncate">{child.pseudo}</span>
                              </div>
                            </td>
                            <td className="w-[60px] px-3 py-1.5 text-center font-black text-[10px] text-slate-800 bg-emerald-50/10">
                              {child.total}
                            </td>
                            <td className="p-0">
                              <div className="flex h-full">
                                {visiblePeriodIndices.map((idx) => {
                                  const count = child.weeks[idx] || 0;
                                  return (
                                    <div key={idx} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} className="px-0.5 py-0.5 h-9 flex items-center justify-center border-l border-slate-50/50">
                                      <div className={`w-full h-full rounded-md flex items-center justify-center text-[10px] transition-all hover:scale-110 cursor-default ${getHeatmapStyle(count)}`}>
                                        {count > 0 ? count : <div className="w-1 h-1 rounded-full bg-slate-200" />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <table className="w-full text-left border-collapse table-fixed">
                    <tfoot>
                      <tr className="bg-slate-900 text-white">
                        <td className="w-[340px] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-emerald-400">Total Hebdomadaire Filtré</td>
                        <td className="w-[60px] px-3 py-2 text-center font-black text-[10px] text-white">{computedTableGrandTotal}</td>
                        <td className="p-0">
                          <div className="flex">
                            {visiblePeriodIndices.map((idx) => (
                              <div key={idx} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} className="p-1.5 text-center text-[9px] font-black text-white border-l border-white/10">
                                {computedWeeklyTotals[idx]}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
          </div>
        </GlassCard>
      </div>

      {/* Global Evolution Chart */}
      <GlassCard className="p-8">
        <h2 className="text-xl font-black text-slate-800 mb-8">Évolution Hebdomadaire Globale</h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                labelStyle={{ fontWeight: 900, marginBottom: '4px', color: '#1e293b' }}
              />
              <Area 
                type="monotone" 
                dataKey="actions" 
                stroke="#10b981" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorActions)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {instanceId && (
        <ActionsImportModal 
            isOpen={showImportModal}
            instanceId={instanceId}
            onClose={() => setShowImportModal(false)}
            onImport={() => fetchStats()}
        />
      )}

      {/* LEADERBOARD OVERLAY */}
      <AnimatePresence>
        {leaderboardType && (
          <LeaderboardOverlay 
            type={leaderboardType}
            teamData={teamStats}
            groupData={groupStats}
            childData={[...filteredChildren].sort((a, b) => b.total - a.total)}
            onClose={() => setLeaderboardType(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// COMPOSANT LEADERBOARD PREMIUM
const LeaderboardOverlay = ({ type, teamData, groupData, childData, onClose }: { 
  type: 'child' | 'team' | 'group', 
  teamData: any[], 
  groupData: any[],
  childData: any[],
  onClose: () => void 
}) => {
  const [localType, setLocalType] = useState<'child' | 'team' | 'group'>(type);
  
  const currentData = localType === 'team' ? teamData : localType === 'group' ? groupData : childData;
  const title = localType === 'team' ? 'Classement des Équipes' : localType === 'group' ? 'Classement des Groupes' : 'Classement des Joueurs';
  const unit = localType === 'team' ? 'points' : localType === 'group' ? 'points' : 'actions';
  
  // Top 3 pour le podium
  const top3 = currentData.slice(0, 3);
  const others = currentData.slice(3);
  const maxScore = currentData[0]?.total || 1;

  const getPlayerAvatar = (pseudo: string, avatarPath?: string) => {
    if (avatarPath) return avatarPath;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${pseudo}&backgroundColor=f1f5f9`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10"
    >
      <div 
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-md" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="relative w-full max-w-xl max-h-[90vh] bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/20 overflow-hidden border border-white/50 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex flex-col border-b border-slate-100/30 shrink-0 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                <Trophy size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-white/50 text-slate-400 hover:text-slate-800 hover:bg-white transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Selector (only for collectives) */}
          {(type === 'team' || type === 'group') && (
            <div className="flex bg-slate-100/50 p-1 rounded-xl w-full">
              <button 
                onClick={() => setLocalType('team')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black tracking-tight rounded-lg transition-all ${localType === 'team' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Users size={14} />
                ÉQUIPES
              </button>
              <button 
                onClick={() => setLocalType('group')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black tracking-tight rounded-lg transition-all ${localType === 'group' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Building2 size={14} />
                GROUPES
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">
          {/* PODIUM */}
          {currentData.length > 0 ? (
            <>
          <div className="grid grid-cols-3 gap-3 mb-6 items-end max-w-md mx-auto pt-4 text-center">
            {/* 2nd Place - Silver Medal */}
            {top3[1] && (
              <motion.div 
                key={`${localType}-2`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="relative group/medal">
                  {/* Medal Glow */}
                  <div className="absolute inset-0 bg-slate-300/30 rounded-full blur-xl group-hover:bg-slate-300/50 transition-colors" />
                  
                  <div className="relative w-16 h-16 rounded-full border-[6px] border-slate-300 overflow-hidden shadow-xl bg-white flex items-center justify-center z-10 transition-transform hover:scale-105">
                    {localType !== 'child' ? (
                       <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                         {localType === 'team' ? <Users size={24} /> : <Building2 size={24} />}
                       </div>
                    ) : (
                      <img src={getPlayerAvatar(top3[1].pseudo, top3[1].avatar)} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-gradient-to-br from-slate-200 to-slate-400 rounded-full flex items-center justify-center text-[10px] font-black text-slate-700 shadow-lg border-2 border-white z-20">2</div>
                </div>
                <div className="w-full bg-slate-100/60 backdrop-blur-sm rounded-xl p-2 text-center border border-slate-200">
                  <p className="text-[10px] font-black text-slate-800 truncate mb-0.5">{localType === 'child' ? top3[1].pseudo : top3[1].name}</p>
                  <p className="text-[9px] font-bold text-slate-500">{top3[1].total} {unit}</p>
                </div>
              </motion.div>
            )}

            {/* 1st Place - Gold Medal */}
            {top3[0] && (
              <motion.div 
                key={`${localType}-1`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative group/medal">
                  {/* Olympic Sparkle Animation */}
                   <motion.div 
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} 
                    transition={{ repeat: Infinity, duration: 4 }} 
                    className="absolute -top-8 left-1/2 -translate-x-1/2 text-amber-500 drop-shadow-lg z-20"
                   >
                     <Sparkles size={32} />
                   </motion.div>
                   
                   {/* Gold Glow */}
                  <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-2xl group-hover:bg-amber-400/60 transition-colors" />

                  <div className="relative w-24 h-24 rounded-full border-[8px] border-amber-400 overflow-hidden shadow-2xl shadow-amber-500/40 bg-white flex items-center justify-center z-10 scale-110 transition-transform hover:scale-115">
                    {localType !== 'child' ? (
                       <div className="w-full h-full flex items-center justify-center text-amber-500 bg-gradient-to-br from-amber-50 to-amber-100">
                          {localType === 'team' ? <Users size={32} /> : <Building2 size={32} />}
                       </div>
                    ) : (
                      <img src={getPlayerAvatar(top3[0].pseudo, top3[0].avatar)} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-9 h-9 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center text-xs font-black text-white shadow-xl border-2 border-white z-20">1</div>
                </div>
                <div className="w-full bg-amber-50/80 backdrop-blur-sm rounded-xl p-3 text-center border border-amber-200 shadow-xl shadow-amber-500/5">
                  <p className="text-sm font-black text-slate-800 truncate mb-0.5">{localType === 'child' ? top3[0].pseudo : top3[0].name}</p>
                  <p className="text-[10px] font-black text-amber-600">{top3[0].total} {unit}</p>
                </div>
              </motion.div>
            )}

            {/* 3rd Place - Bronze Medal */}
            {top3[2] && (
              <motion.div 
                key={`${localType}-3`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="relative group/medal">
                  {/* Bronze Glow */}
                  <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-xl group-hover:bg-orange-400/40 transition-colors" />

                  <div className="relative w-16 h-16 rounded-full border-[6px] border-orange-400 overflow-hidden shadow-xl bg-white flex items-center justify-center z-10 transition-transform hover:scale-105">
                    {localType !== 'child' ? (
                       <div className="w-full h-full flex items-center justify-center text-orange-500 bg-orange-50">
                          {localType === 'team' ? <Users size={24} /> : <Building2 size={24} />}
                       </div>
                    ) : (
                      <img src={getPlayerAvatar(top3[2].pseudo, top3[2].avatar)} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg border-2 border-white z-20">3</div>
                </div>
                <div className="w-full bg-orange-50/40 backdrop-blur-sm rounded-xl p-2 text-center border border-orange-200">
                  <p className="text-[10px] font-black text-slate-800 truncate mb-0.5">{localType === 'child' ? top3[2].pseudo : top3[2].name}</p>
                  <p className="text-[9px] font-bold text-orange-600/70">{top3[2].total} {unit}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* LIST */}
          <div className="space-y-1.5 mt-4">
            {others.map((item, idx) => (
              <motion.div 
                key={`${localType}-${idx}`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="group flex items-center gap-3 p-2 rounded-2xl border border-slate-100 bg-white/30 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:-translate-y-0.5"
              >
                <div className="w-8 text-[10px] font-black text-slate-400 group-hover:text-slate-800 transition-colors">#{idx + 4}</div>
                
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {localType !== 'child' ? (
                    localType === 'team' ? <Users size={14} className="text-slate-400" /> : <Building2 size={14} className="text-slate-400" />
                  ) : (
                    <img src={getPlayerAvatar(item.pseudo, item.avatar)} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-[11px] font-black text-slate-800">{localType === 'child' ? item.pseudo : item.name}</span>
                    <span className="text-[11px] font-black text-slate-900">{item.total} <span className="text-[9px] text-slate-400 uppercase tracking-tighter ml-1 font-medium">{unit}</span></span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      key={`${localType}-${idx}-progress`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.total / maxScore) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${localType === 'child' ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic text-sm">
              <Users size={40} className="mb-4 opacity-20" />
              Pas encore de données
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
