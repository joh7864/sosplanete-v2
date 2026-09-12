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
}

export function PlayerTrackingTab({
  instanceId,
  schoolYear,
  instanceYearId,
  teams = [],
  groups = [],
}: PlayerTrackingTabProps) {
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

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filters state
  const [searchPseudo, setSearchPseudo] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals & Drawers
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
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
        if (selectedGroupId !== 'all') params.append('groupId', selectedGroupId);
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
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setSessionsLoading(false);
      }
    },
    [instanceId, schoolYear, selectedTeamId, selectedGroupId, selectedStatus, searchPseudo],
  );

  useEffect(() => {
    fetchKpis();
    fetchSessions(1);

    // Auto-rafraîchissement toutes les 15 secondes pour le suivi LIVE
    const interval = setInterval(() => {
      fetchKpis();
      fetchSessions(currentPage);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchKpis, fetchSessions, currentPage]);

  const handleExportSessionsCsv = () => {
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
    link.setAttribute('download', `tracabilite_joueurs_${instanceId}_${schoolYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const getPlayerAvatar = (pseudo: string, avatarPath?: string) => {
    if (avatarPath && avatarPath !== 'avatars/default.png') {
      return getAssetUrl(avatarPath);
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${pseudo}&backgroundColor=f1f5f9`;
  };

  const totalPages = Math.ceil(totalSessionsCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Sessions Live */}
        <GlassCard className="p-4 flex flex-col justify-between min-h-[124px] relative overflow-visible transition-all">
          <div className="flex items-start justify-between w-full">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                En direct
              </p>
              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live
              </span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
              <Radio size={18} />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800">
                {kpisLoading ? '...' : (kpis?.activeSessions ?? kpis?.activeSessionsNow ?? 0)}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                {(kpis?.activeSessions ?? kpis?.activeSessionsNow ?? 0) > 1 ? 'joueurs connectés' : 'joueur connecté'}
              </p>
            </div>

            {/* Joueurs connectés en direct avec Avatar et Tooltip */}
            {kpis?.activePlayers && kpis.activePlayers.length > 0 ? (
              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 flex-wrap">
                {kpis.activePlayers.slice(0, 6).map((player) => (
                  <div
                    key={player.sessionId}
                    onClick={() => setSelectedSessionId(player.sessionId)}
                    title={`${player.pseudo} (${player.teamName || 'Sans équipe'}) • ${player.deviceType?.includes('MOBILE') ? 'Mobile' : 'Ordinateur'} • En direct`}
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

      {/* RGPD Alert / Information Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900 leading-snug">
              Conformité RGPD & Minimisation des Données
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-snug">
              Les traces de parcours sont des données techniques temporaires d'élèves. Il est
              recommandé de purger les historiques de plus de 90 jours ou en fin d'année.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPurgeModal(true)}
          className="shrink-0 flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Trash2 size={14} />
          Purger l'historique
        </button>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
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

          {/* Group Filter */}
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Tous les groupes</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id.toString()}>
                {g.name}
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
            <option value="CLOSED">Terminées</option>
            <option value="EXPIRED">Expirées</option>
          </select>

          {/* Reset Filters */}
          {(searchPseudo ||
            selectedTeamId !== 'all' ||
            selectedGroupId !== 'all' ||
            selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchPseudo('');
                setSelectedTeamId('all');
                setSelectedGroupId('all');
                setSelectedStatus('all');
              }}
              className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"
              title="Réinitialiser les filtres"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              fetchKpis();
              fetchSessions(currentPage);
            }}
            disabled={sessionsLoading || kpisLoading}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-40"
            title="Rafraîchir les données en direct"
          >
            <RotateCcw size={14} className={sessionsLoading || kpisLoading ? 'animate-spin text-emerald-600' : ''} />
            Actualiser
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportSessionsCsv}
            disabled={sessions.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-40"
          >
            <Download size={15} />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <GlassCard className="p-0 overflow-hidden rounded-2xl border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-3.5 px-4">Joueur</th>
                <th className="py-3.5 px-4">Équipe & Classe</th>
                <th className="py-3.5 px-4">Appareil</th>
                <th className="py-3.5 px-4">Connexion</th>
                <th className="py-3.5 px-4">Durée</th>
                <th className="py-3.5 px-4">Activité</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Parcours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 text-xs font-medium text-slate-700">
              {sessionsLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin inline-block mr-2 text-emerald-500" />
                    Chargement des sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
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
                  const groupName = s.groupName || s.child?.group?.name;
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
                            <span className="font-black text-slate-800 block text-xs">
                              {pseudo}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Team & Group */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {teamName ? (
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full w-fit">
                              {teamName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Sans équipe</span>
                          )}
                          {groupName && (
                            <span className="text-[10px] text-slate-500 font-bold">
                              {groupName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            {isMobile ? (
                              <Smartphone size={13} className="text-sky-500" />
                            ) : (
                              <Monitor size={13} className="text-indigo-500" />
                            )}
                            {isMobile
                              ? s.deviceType === 'MOBILE_LANDSCAPE'
                                ? 'Mobile Paysage'
                                : 'Mobile'
                              : 'Ordinateur'}
                          </span>
                          {s.browser && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              {s.browser} {s.os ? `• ${s.os}` : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800">
                            {s.startedAt
                              ? new Date(s.startedAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                })
                              : '---'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {s.startedAt
                              ? new Date(s.startedAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700">
                          {formatDuration(s.durationSeconds || 0)}
                        </span>
                      </td>

                      {/* Activity Summary */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                s.missionsCount > 0
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'text-slate-400 bg-slate-50'
                              }`}
                              title={
                                s.missionsDone && s.missionsDone.length > 0
                                  ? `Missions impulsées :\n• ${s.missionsDone.join('\n• ')}`
                                  : 'Aucune mission impulsée'
                              }
                            >
                              <CheckCircle2 size={11} className={s.missionsCount > 0 ? 'text-amber-600' : 'text-slate-400'} />
                              {s.missionsCount || 0} mission{s.missionsCount > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                              <Eye size={11} />
                              {s.pagesVisitedCount || 0} vues
                            </span>
                          </div>
                          {s.missionsDone && s.missionsDone.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {s.missionsDone.slice(0, 2).map((mName: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[9px] font-medium bg-amber-50/80 text-amber-900 border border-amber-200/70 rounded px-1.5 py-0.5 truncate max-w-[130px]"
                                  title={mName}
                                >
                                  ⚡ {mName}
                                </span>
                              ))}
                              {s.missionsDone.length > 2 && (
                                <span
                                  className="text-[9px] text-amber-700 font-bold bg-amber-100/60 px-1 py-0.5 rounded"
                                  title={s.missionsDone.slice(2).join('\n• ')}
                                >
                                  +{s.missionsDone.length - 2}
                                </span>
                              )}
                            </div>
                          )}
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
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Affichage de <strong>{sessions.length}</strong> sur{' '}
            <strong>{totalSessionsCount}</strong> sessions
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPage > 1) fetchSessions(currentPage - 1);
              }}
              disabled={currentPage <= 1 || sessionsLoading}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-700 px-2">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => {
                if (currentPage < totalPages) fetchSessions(currentPage + 1);
              }}
              disabled={currentPage >= totalPages || sessionsLoading}
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
        onClose={() => setSelectedSessionId(null)}
      />

      {/* Purge Modal */}
      <PurgeConfirmModal
        isOpen={showPurgeModal}
        onClose={() => setShowPurgeModal(false)}
        instanceId={instanceId}
        schoolYear={schoolYear}
        onPurged={() => {
          fetchKpis();
          fetchSessions(1);
        }}
      />
    </div>
  );
}
