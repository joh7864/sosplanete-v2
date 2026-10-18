'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  Activity,
  Smartphone,
  Monitor,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Eye,
  Radio,
  UserCheck,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';
import { SessionTimelineDrawer } from './SessionTimelineDrawer';
import { PurgeConfirmModal } from './PurgeConfirmModal';

interface PlayerTrackingTabProps {
  instanceId: number;
  schoolYear: string;
  instanceYearId?: number;
  teams?: Array<{ id: number; name: string }>;
  groups?: Array<{ id: number; name: string }>;
  onRenderTopBarActions?: (actions: React.ReactNode | null) => void;
}

export function PlayerTrackingTab({
  instanceId,
  schoolYear,
  instanceYearId,
  teams = [],
  groups = [],
  onRenderTopBarActions,
}: PlayerTrackingTabProps) {
  // Mode d'affichage : 'player' (par joueur unique, groupé) ou 'session' (par session individuelle)
  const [viewMode, setViewMode] = useState<'player' | 'session'>('player');

  // KPIs state
  const [kpis, setKpis] = useState<{
    activeSessions?: number;
    activeSessionsNow?: number;
    activePlayers?: Array<{
      sessionId: string;
      childId: number;
      pseudo: string;
      avatar: string | null;
      teamName: string | null;
      teamColor: string;
      groupName: string | null;
      deviceType?: string;
      lastActiveAt?: string;
    }>;
    totalSessions?: number;
    avgDurationMinutes?: number;
    avgDurationSeconds?: number;
    totalActivePlayers?: number;
    uniquePlayersCount?: number;
    totalRegisteredPlayers?: number;
    totalChildrenCount?: number;
    participationRate?: number;
    hasOldSessions90Days?: boolean;
    daysSinceOldest?: number;
  } | null>(null);
  const [kpisLoading, setKpisLoading] = useState(false);

  // Grouped Players state
  const [players, setPlayers] = useState<any[]>([]);
  const [totalPlayersCount, setTotalPlayersCount] = useState(0);
  const [playersLoading, setPlayersLoading] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filters state
  const [searchPseudo, setSearchPseudo] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tracking_auto_refresh_sec');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 120) {
          return parsed;
        }
      }
    }
    return 15;
  });

  // Modals & Drawers
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  const fetchKpis = useCallback(async () => {
    if (!instanceId) return;
    setKpisLoading(true);
    try {
      const token = getAuthData('access_token');
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tracking/sessions-kpis?instanceId=${instanceId}&schoolYear=${schoolYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (resp.ok) {
        const json = await resp.json();
        setKpis(json);
      }
    } catch (err) {
      console.error('Failed to fetch sessions KPIs:', err);
    } finally {
      setKpisLoading(false);
    }
  }, [instanceId, schoolYear]);

  // Récupération des joueurs groupés
  const fetchPlayers = useCallback(
    async (page = 1) => {
      if (!instanceId) return;
      setPlayersLoading(true);
      try {
        const token = getAuthData('access_token');
        const params = new URLSearchParams({
          instanceId: instanceId.toString(),
          schoolYear,
          page: page.toString(),
          limit: pageSize.toString(),
        });

        if (selectedTeamId !== 'all') params.append('teamId', selectedTeamId);
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        if (searchPseudo.trim()) params.append('childPseudo', searchPseudo.trim());

        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tracking/players?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (resp.ok) {
          const json = await resp.json();
          setPlayers(json.players || []);
          setTotalPlayersCount(json.total || 0);
          setCurrentPage(json.page || page);
        } else {
          console.error(`Failed to fetch players: HTTP ${resp.status}`);
          setPlayers([]);
          setTotalPlayersCount(0);
        }
      } catch (err) {
        console.error('Failed to fetch players:', err);
        setPlayers([]);
        setTotalPlayersCount(0);
      } finally {
        setPlayersLoading(false);
      }
    },
    [instanceId, schoolYear, selectedTeamId, selectedStatus, searchPseudo],
  );

  // Récupération des sessions individuelles
  const fetchSessions = useCallback(
    async (page = 1) => {
      if (!instanceId) return;
      setSessionsLoading(true);
      try {
        const token = getAuthData('access_token');
        const params = new URLSearchParams({
          instanceId: instanceId.toString(),
          schoolYear,
          page: page.toString(),
          limit: pageSize.toString(),
        });

        if (selectedTeamId !== 'all') params.append('teamId', selectedTeamId);
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        if (searchPseudo.trim()) params.append('childPseudo', searchPseudo.trim());

        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tracking/sessions?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (resp.ok) {
          const json = await resp.json();
          setSessions(json.sessions || []);
          setTotalSessionsCount(json.total || 0);
          setCurrentPage(json.page || page);
        } else {
          console.error(`Failed to fetch sessions: HTTP ${resp.status}`);
          setSessions([]);
          setTotalSessionsCount(0);
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        setSessions([]);
        setTotalSessionsCount(0);
      } finally {
        setSessionsLoading(false);
      }
    },
    [instanceId, schoolYear, selectedTeamId, selectedStatus, searchPseudo],
  );

  useEffect(() => {
    fetchKpis();
    if (viewMode === 'player') {
      fetchPlayers(1);
    } else {
      fetchSessions(1);
    }
  }, [fetchKpis, fetchPlayers, fetchSessions, viewMode]);

  // Auto-rafraîchissement configurable en secondes (0 = désactivé)
  useEffect(() => {
    if (autoRefreshSec <= 0) return;
    const interval = setInterval(() => {
      fetchKpis();
      if (viewMode === 'player') {
        fetchPlayers(currentPage);
      } else {
        fetchSessions(currentPage);
      }
    }, autoRefreshSec * 1000);

    return () => clearInterval(interval);
  }, [fetchKpis, fetchPlayers, fetchSessions, currentPage, autoRefreshSec, viewMode]);

  // Sauvegarde automatique et transparente du délai de rafraîchissement dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tracking_auto_refresh_sec', autoRefreshSec.toString());
    }
  }, [autoRefreshSec]);

  // Déportation du champ de rafraîchissement auto et du bouton actualiser dans la TopBar
  useEffect(() => {
    if (!onRenderTopBarActions) return;

    onRenderTopBarActions(
      <div className="flex items-center gap-2">
        <div 
          className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm"
          title="Intervalle de rafraîchissement automatique en secondes (0 = désactivé, choix recommandé : 15s à 120s)"
        >
          <Clock size={13} className="text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-semibold">Auto :</span>
          <input
            type="number"
            min={0}
            max={120}
            step={15}
            value={autoRefreshSec}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setAutoRefreshSec(isNaN(val) ? 0 : Math.max(0, Math.min(120, val)));
            }}
            className="w-12 px-1 py-0.5 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span className="text-[11px] text-slate-500 font-mono">s</span>
        </div>

        <button
          onClick={() => {
            fetchKpis();
            if (viewMode === 'player') {
              fetchPlayers(currentPage);
            } else {
              fetchSessions(currentPage);
            }
          }}
          disabled={sessionsLoading || playersLoading || kpisLoading}
          className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all shadow-sm disabled:opacity-40 flex items-center justify-center group"
          title="Actualiser les données (KPIs en direct et liste)"
        >
          <RotateCcw
            size={16}
            className={`${sessionsLoading || playersLoading || kpisLoading ? 'animate-spin text-emerald-600' : 'group-hover:rotate-180 transition-transform duration-500'}`}
          />
        </button>
      </div>
    );

    return () => {
      onRenderTopBarActions(null);
    };
  }, [onRenderTopBarActions, autoRefreshSec, sessionsLoading, playersLoading, kpisLoading, fetchKpis, fetchSessions, fetchPlayers, currentPage, viewMode]);

  const handleExportCsv = () => {
    if (viewMode === 'player') {
      if (!players || players.length === 0) {
        alert('Aucun joueur à exporter.');
        return;
      }

      const headers = [
        'ID Joueur',
        'Pseudo',
        'Équipe',
        'Groupe',
        'Nombre Sessions',
        'Temps Total (secondes)',
        'Temps Total (formaté)',
        'Statut',
        'Dernière Activité',
        'Première Session',
        'Missions Impulsées',
        'Pages Vues',
      ];

      const rows = players.map((p) => [
        p.childId,
        `"${p.pseudo || ''}"`,
        `"${p.teamName || ''}"`,
        `"${p.groupName || ''}"`,
        p.sessionsCount || 0,
        p.totalDurationSeconds || 0,
        formatDuration(p.totalDurationSeconds || 0),
        p.status === 'ACTIVE' ? 'En direct' : p.sessionsCount > 0 ? 'Déconnecté' : 'Jamais connecté',
        p.lastActiveAt ? new Date(p.lastActiveAt).toLocaleString('fr-FR') : '',
        p.firstSessionAt ? new Date(p.firstSessionAt).toLocaleString('fr-FR') : '',
        p.missionsCount || 0,
        p.pagesVisitedCount || 0,
      ]);

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activite_joueurs_${instanceId}_${schoolYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      if (!sessions || sessions.length === 0) {
        alert('Aucune session à exporter.');
        return;
      }

      const headers = [
        'ID Session',
        'Pseudo Joueur',
        'Équipe',
        'Groupe',
        'Date Début',
        'Dernière Activité',
        'Durée (secondes)',
        'Durée (formatée)',
        'Statut',
        'Appareil',
        'Navigateur',
        'OS',
        'Nb Événements',
        'Missions Validées',
        'Pages Vues',
      ];

      const rows = sessions.map((s) => [
        s.id,
        `"${s.childPseudo || s.child?.pseudo || ''}"`,
        `"${s.teamName || s.child?.team?.name || ''}"`,
        `"${s.groupName || s.child?.group?.name || ''}"`,
        s.startedAt ? new Date(s.startedAt).toLocaleString('fr-FR') : '',
        s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString('fr-FR') : '',
        s.durationSeconds || 0,
        formatDuration(s.durationSeconds || 0),
        s.status === 'ACTIVE' ? 'En direct' : 'Terminée',
        s.deviceType || '',
        `"${s.browser || ''}"`,
        `"${s.os || ''}"`,
        s.eventCount || 0,
        s.missionsCount || 0,
        s.pagesVisitedCount || 0,
      ]);

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activite_sessions_${instanceId}_${schoolYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h}h ${remM > 0 ? `${remM}m` : ''}`;
    }
    return `${m}m ${s}s`;
  };

  const getPlayerAvatar = (pseudo: string, avatarPath?: string | null) => {
    if (avatarPath) return getAssetUrl(avatarPath);
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pseudo || 'avatar')}`;
  };

  const totalItemsCount = viewMode === 'player' ? totalPlayersCount : totalSessionsCount;
  const totalPages = Math.max(1, Math.ceil(totalItemsCount / pageSize));
  const isLoading = viewMode === 'player' ? playersLoading : sessionsLoading;

  return (
    <div className="space-y-6">
      {/* 4 KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* En direct / Sessions Actives */}
        <GlassCard className="p-4 flex flex-col justify-between min-h-[124px] relative overflow-hidden">
          <div className="flex items-start justify-between w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Joueurs En Direct
            </p>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500 relative">
              <Radio size={18} />
              {(kpis?.activeSessionsNow ?? kpis?.activeSessions ?? 0) > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800">
                {kpisLoading ? '...' : (kpis?.activeSessionsNow ?? kpis?.activeSessions ?? 0)}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">connecté(s)</p>
            </div>

            {/* Avatars des joueurs actuellement connectés avec tooltips riches */}
            {kpis?.activePlayers && kpis.activePlayers.length > 0 ? (
              <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-100/60 overflow-x-auto custom-scrollbar">
                {kpis.activePlayers.slice(0, 6).map((player) => (
                  <div
                    key={player.sessionId}
                    onClick={() => setSelectedChildId(player.childId)}
                    className="relative group cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  >
                    <div
                      className="w-7 h-7 rounded-full border-2 shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center transition-all group-hover:ring-2 group-hover:ring-emerald-400"
                      style={{ borderColor: player.teamColor || '#10b981' }}
                    >
                      <img
                        src={getPlayerAvatar(player.pseudo, player.avatar || undefined)}
                        alt={player.pseudo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Pastille verte live */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />

                    {/* Pastille mobile si applicable */}
                    {player.deviceType?.includes('MOBILE') && (
                      <span className="absolute -top-1 -right-1 text-[8px] bg-sky-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-xs border border-white">
                        📱
                      </span>
                    )}

                    {/* Tooltip au survol */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                      <div className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-1.5 border border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{player.pseudo}</span>
                        {player.teamName && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor: `${player.teamColor}30`,
                              color: player.teamColor || '#34d399',
                            }}
                          >
                            {player.teamName}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-normal">
                          • {player.deviceType?.includes('MOBILE') ? '📱 Mobile' : '💻 PC'}
                        </span>
                      </div>
                      <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700" />
                    </div>
                  </div>
                ))}
                {kpis.activePlayers.length > 6 && (
                  <span
                    className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full"
                    title={`Et ${kpis.activePlayers.length - 6} autres joueurs connectés`}
                  >
                    +{kpis.activePlayers.length - 6}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic mt-2 pt-1 border-t border-slate-100/60">
                Aucun joueur en direct
              </p>
            )}
          </div>
        </GlassCard>

        {/* Total Sessions */}
        <GlassCard className="p-4 flex flex-col justify-between min-h-[124px]">
          <div className="flex items-start justify-between w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Connexions
            </p>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-800">
              {kpisLoading ? '...' : kpis?.totalSessions?.toLocaleString() ?? 0}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
              sur l'année {schoolYear}
            </p>
          </div>
        </GlassCard>

        {/* Durée Moyenne */}
        <GlassCard className="p-4 flex flex-col justify-between min-h-[124px]">
          <div className="flex items-start justify-between w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Durée Moyenne
            </p>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-800">
              {kpisLoading
                ? '...'
                : kpis?.avgDurationMinutes !== undefined
                ? `${kpis.avgDurationMinutes} min`
                : `${Math.round((kpis?.avgDurationSeconds || 0) / 60)} min`}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">par session</p>
          </div>
        </GlassCard>

        {/* Taux Participation */}
        <GlassCard className="p-4 flex flex-col justify-between min-h-[124px]">
          <div className="flex items-start justify-between w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Taux d'Engagement
            </p>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-500">
              <Activity size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-800">
              {kpisLoading ? '...' : `${kpis?.participationRate ?? 0}%`}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
              {(kpis?.totalActivePlayers ?? kpis?.uniquePlayersCount ?? 0)} / {(kpis?.totalRegisteredPlayers ?? kpis?.totalChildrenCount ?? 0)} joueurs
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Toggle Vue par Joueur / Vue par Session */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
            <button
              onClick={() => {
                setViewMode('player');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'player'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Regrouper la trace par joueur unique"
            >
              <Users size={14} />
              <span>Par Joueur</span>
            </button>
            <button
              onClick={() => {
                setViewMode('session');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'session'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualiser toutes les sessions individuelles"
            >
              <Clock size={14} />
              <span>Par Session</span>
            </button>
          </div>

          {/* Search pseudo */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher un pseudo..."
              value={searchPseudo}
              onChange={(e) => setSearchPseudo(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Team Filter */}
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Toutes les équipes</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id.toString()}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Tous les statuts</option>
            <option value="ACTIVE">En direct</option>
            <option value="CLOSED">Terminées / Déconnectés</option>
            {viewMode === 'session' && <option value="EXPIRED">Expirées</option>}
          </select>

          {/* Reset Filters */}
          {(searchPseudo || selectedTeamId !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchPseudo('');
                setSelectedTeamId('all');
                setSelectedStatus('all');
              }}
              className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"
              title="Réinitialiser les filtres"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {/* Actions : Exporter CSV & Purger l'historique */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            disabled={totalItemsCount === 0}
            className="p-2 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all shadow-sm disabled:opacity-40 flex items-center justify-center group"
            title={viewMode === 'player' ? "Exporter l'activité par joueur en CSV" : "Exporter l'historique des sessions en CSV"}
          >
            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={() => setShowPurgeModal(true)}
            className="p-2 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl transition-all shadow-sm flex items-center justify-center group"
            title="Purger l'historique des sessions (RGPD)"
          >
            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <GlassCard className="p-0 overflow-hidden rounded-2xl border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-3.5 px-4">Joueur</th>
                <th className="py-3.5 px-4">Équipe</th>
                <th className="py-3.5 px-4">Appareil{viewMode === 'player' ? 's' : ''}</th>
                {viewMode === 'player' ? (
                  <>
                    <th className="py-3.5 px-4">Sessions</th>
                    <th className="py-3.5 px-4">Temps Cumulé</th>
                    <th className="py-3.5 px-4">Dernière Activité</th>
                  </>
                ) : (
                  <>
                    <th className="py-3.5 px-4">Connexion</th>
                    <th className="py-3.5 px-4">Durée</th>
                  </>
                )}
                <th className="py-3.5 px-4">Activité</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Parcours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 text-xs font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={viewMode === 'player' ? 9 : 8} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin inline-block mr-2 text-emerald-500" />
                    Chargement des données...
                  </td>
                </tr>
              ) : viewMode === 'player' ? (
                players.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                      Aucun joueur enregistré correspondant à ces filtres.
                    </td>
                  </tr>
                ) : (
                  players.map((p) => {
                    const pseudo = p.pseudo || 'Joueur';
                    const avatar = p.avatar;
                    const teamName = p.teamName;
                    const hasActive = p.status === 'ACTIVE';

                    return (
                      <tr
                        key={p.childId}
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedChildId(p.childId)}
                      >
                        {/* Pseudo & Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                              <img
                                src={getPlayerAvatar(pseudo, avatar)}
                                alt={pseudo}
                                className="w-full h-full object-cover"
                              />
                              {hasActive && (
                                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                              )}
                            </div>
                            <div>
                              <span className="font-black text-slate-800 block text-xs whitespace-nowrap">
                                {pseudo}
                              </span>
                              {p.groupName && (
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  {p.groupName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Team */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {teamName ? (
                            <span
                              className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block"
                              style={{
                                backgroundColor: `${p.teamColor}15`,
                                color: p.teamColor,
                                border: `1px solid ${p.teamColor}40`,
                              }}
                            >
                              {teamName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sans équipe</span>
                          )}
                        </td>

                        {/* Devices */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700">
                            {p.deviceTypes?.some((d: string) => d?.includes('MOBILE')) && (
                              <Smartphone size={13} className="text-sky-500 shrink-0" />
                            )}
                            {p.deviceTypes?.some((d: string) => !d?.includes('MOBILE')) && (
                              <Monitor size={13} className="text-indigo-500 shrink-0" />
                            )}
                            <span className="text-xs font-bold">
                              {p.deviceTypes?.length > 1
                                ? 'Multi-appareil'
                                : p.deviceTypes?.[0]?.includes('MOBILE')
                                ? 'Mobile'
                                : 'Ordinateur'}
                            </span>
                          </div>
                        </td>

                        {/* Sessions count */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs font-bold">
                            <Layers size={12} className="text-emerald-600 shrink-0" />
                            <span>{p.sessionsCount || 0} session{p.sessionsCount > 1 ? 's' : ''}</span>
                          </span>
                        </td>

                        {/* Total Duration */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-700 text-xs">
                            {formatDuration(p.totalDurationSeconds || 0)}
                          </span>
                        </td>

                        {/* Last Activity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.lastActiveAt ? (
                            <div>
                              <span className="font-bold text-slate-800 text-xs block">
                                {new Date(p.lastActiveAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {new Date(p.lastActiveAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Jamais connecté</span>
                          )}
                        </td>

                        {/* Activity Micro-badges */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                                p.missionsCount > 0
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs'
                                  : 'text-slate-400 bg-slate-50 border border-slate-100'
                              }`}
                              title={`${p.missionsCount || 0} mission(s) impulsée(s)`}
                            >
                              <CheckCircle2
                                size={12}
                                className={p.missionsCount > 0 ? 'text-amber-600 shrink-0' : 'text-slate-300 shrink-0'}
                              />
                              <span>{p.missionsCount || 0}</span>
                            </span>

                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs"
                              title={`${p.pagesVisitedCount || 0} écran(s) visité(s)`}
                            >
                              <Eye size={12} className="text-sky-500 shrink-0" />
                              <span>{p.pagesVisitedCount || 0}</span>
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              hasActive
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 animate-pulse'
                                : p.sessionsCount > 0
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}
                          >
                            {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            {hasActive ? 'En direct' : p.sessionsCount > 0 ? 'Déconnecté' : 'Non connecté'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChildId(p.childId);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 font-bold text-[11px] transition-all inline-flex items-center gap-1.5 shadow-sm"
                          >
                            Parcours
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                      Aucune session enregistrée correspondant à ces filtres.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => {
                    const pseudo = s.childPseudo || s.child?.pseudo || 'Joueur';
                    const avatar = s.avatar || s.child?.avatar;
                    const teamName = s.teamName || s.child?.team?.name;
                    const isMobile = s.deviceType?.includes('MOBILE');

                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedSessionId(s.id)}
                      >
                        {/* Pseudo & Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              <img
                                src={getPlayerAvatar(pseudo, avatar)}
                                alt={pseudo}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="font-black text-slate-800 block text-xs whitespace-nowrap">
                                {pseudo}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Team */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {teamName ? (
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                              {teamName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sans équipe</span>
                          )}
                        </td>

                        {/* Device */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 cursor-help transition-colors hover:bg-slate-100"
                            title={`Appareil : ${
                              isMobile
                                ? s.deviceType === 'MOBILE_LANDSCAPE'
                                  ? 'Mobile (Paysage)'
                                  : 'Mobile (Portrait)'
                                : 'Ordinateur / Bureau'
                            }\nNavigateur : ${s.browser || 'Non renseigné'}\nSystème : ${s.os || 'Non renseigné'}`}
                          >
                            {isMobile ? (
                              <Smartphone size={13} className="text-sky-500 shrink-0" />
                            ) : (
                              <Monitor size={13} className="text-indigo-500 shrink-0" />
                            )}
                            <span className="text-xs font-bold">
                              {isMobile ? 'Mobile' : 'Ordinateur'}
                            </span>
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-800">
                            {s.startedAt
                              ? new Date(s.startedAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                })
                              : '---'}
                          </span>
                          {s.startedAt && (
                            <span className="text-[11px] font-mono text-slate-400 ml-1.5">
                              {new Date(s.startedAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-700 text-xs">
                            {formatDuration(s.durationSeconds || 0)}
                          </span>
                        </td>

                        {/* Activity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                                s.missionsCount > 0
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs'
                                  : 'text-slate-400 bg-slate-50 border border-slate-100'
                              }`}
                              title={`${s.missionsCount || 0} mission(s) impulsée(s)`}
                            >
                              <CheckCircle2
                                size={12}
                                className={s.missionsCount > 0 ? 'text-amber-600 shrink-0' : 'text-slate-300 shrink-0'}
                              />
                              <span>{s.missionsCount || 0}</span>
                            </span>

                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs"
                              title={`Écrans & pages consultés : ${s.pagesVisitedCount || 0}`}
                            >
                              <Eye size={12} className="text-sky-500 shrink-0" />
                              <span>{s.pagesVisitedCount || 0}</span>
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              s.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 animate-pulse'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {s.status === 'ACTIVE' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                            {s.status === 'ACTIVE' ? 'En direct' : 'Terminée'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSessionId(s.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 font-bold text-[11px] transition-all inline-flex items-center gap-1.5 shadow-sm"
                          >
                            Parcours
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Affichage de <strong>{viewMode === 'player' ? players.length : sessions.length}</strong> sur{' '}
            <strong>{totalItemsCount}</strong> {viewMode === 'player' ? 'joueurs' : 'sessions'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  if (viewMode === 'player') fetchPlayers(currentPage - 1);
                  else fetchSessions(currentPage - 1);
                }
              }}
              disabled={currentPage <= 1 || isLoading}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-700 px-2">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  if (viewMode === 'player') fetchPlayers(currentPage + 1);
                  else fetchSessions(currentPage + 1);
                }
              }}
              disabled={currentPage >= totalPages || isLoading}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Timeline Drawer */}
      <SessionTimelineDrawer
        sessionId={selectedSessionId}
        childId={selectedChildId}
        instanceId={instanceId}
        schoolYear={schoolYear}
        onClose={() => {
          setSelectedSessionId(null);
          setSelectedChildId(null);
        }}
      />

      {/* Purge Modal */}
      <PurgeConfirmModal
        isOpen={showPurgeModal}
        onClose={() => setShowPurgeModal(false)}
        instanceId={instanceId}
        schoolYear={schoolYear}
        onPurged={() => {
          fetchKpis();
          if (viewMode === 'player') fetchPlayers(1);
          else fetchSessions(1);
        }}
      />
    </div>
  );
}
