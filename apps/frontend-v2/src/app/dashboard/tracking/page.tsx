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
  Minimize2
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <GlassCard className="p-4 flex flex-col justify-between h-[110px]">
          <div className="flex items-start justify-between w-full">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions Totales</p>
              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">+12% cette sem.</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-800">{data.grandTotal.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Depuis le début du jeu</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between h-[110px]">
          <div className="flex items-start justify-between w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cette Semaine</p>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <Calendar size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-800">{data.weeklyTotals[data.weeklyTotals.length - 1]?.toLocaleString() || 0}</h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Actions en S{data.config.periodsCount}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between h-[110px]">
          <div className="flex items-start justify-between w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Enfant</p>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
              <Trophy size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 overflow-hidden">
            <h3 className="text-2xl font-black text-slate-800 truncate select-none">@{data.children.reduce((prev, current) => (prev.total > current.total) ? prev : current).pseudo}</h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap truncate">{data.children.reduce((prev, current) => (prev.total > current.total) ? prev : current).total} actions</p>
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
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Masquer inactifs</span>
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
                      <option value="all">Toutes les classes</option>
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
                            {data.periods.map((p, i) => (
                              <div key={i} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} className="p-0.5 text-[8px] font-black uppercase text-slate-500 tracking-tighter border-l border-slate-100/50 text-center flex flex-col items-center justify-center h-12 bg-white/50">
                                <span className="text-slate-400 text-[7px] leading-none opacity-70">{p.label}</span>
                                <span className="text-slate-800 font-bold mt-0.5 leading-none">
                                  {new Date(p.start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                </span>
                              </div>
                            ))}
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
                                <span className="text-[9px] font-black text-emerald-600 truncate">@{child.pseudo}</span>
                              </div>
                            </td>
                            <td className="w-[60px] px-3 py-1.5 text-center font-black text-[10px] text-slate-800 bg-emerald-50/10">
                              {child.total}
                            </td>
                            <td className="p-0">
                              <div className="flex h-full">
                                {child.weeks.map((count, i) => (
                                  <div key={i} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} className="px-0.5 py-0.5 h-9 flex items-center justify-center border-l border-slate-50/50">
                                    <div className={`w-full h-full rounded-md flex items-center justify-center text-[10px] transition-all hover:scale-110 cursor-default ${getHeatmapStyle(count)}`}>
                                      {count > 0 ? count : <div className="w-1 h-1 rounded-full bg-slate-200" />}
                                    </div>
                                  </div>
                                ))}
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
                        <td className="w-[340px] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-emerald-400">Total Hebdomadaire</td>
                        <td className="w-[60px] px-3 py-2 text-center font-black text-[10px] text-white">{data.grandTotal}</td>
                        <td className="p-0">
                          <div className="flex">
                            {data.weeklyTotals.map((total, i) => (
                              <div key={i} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} className="p-1.5 text-center text-[9px] font-black text-white border-l border-white/10">
                                {total}
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
    </div>
  );
}
