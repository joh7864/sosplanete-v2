'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Smartphone,
  Monitor,
  CheckCircle2,
  XCircle,
  Eye,
  Zap,
  Sparkles,
  LogOut,
  LogIn,
  Loader2,
  Calendar,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  User,
  Activity,
} from 'lucide-react';
import { getAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';

interface SessionTimelineDrawerProps {
  sessionId?: string | null;
  childId?: number | null;
  instanceId?: number;
  schoolYear?: string;
  onClose: () => void;
}

export const SessionTimelineDrawer: React.FC<SessionTimelineDrawerProps> = ({
  sessionId,
  childId,
  instanceId,
  schoolYear,
  onClose,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const isOpen = Boolean(sessionId || childId);

  useEffect(() => {
    if (!sessionId && !childId) {
      setData(null);
      return;
    }

    const fetchJourney = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthData('access_token');
        let url = '';
        if (childId) {
          const params = new URLSearchParams();
          if (instanceId) params.append('instanceId', instanceId.toString());
          if (schoolYear) params.append('schoolYear', schoolYear);
          url = `${process.env.NEXT_PUBLIC_API_URL}/tracking/players/${childId}/journey?${params.toString()}`;
        } else if (sessionId) {
          url = `${process.env.NEXT_PUBLIC_API_URL}/tracking/sessions/${sessionId}/journey`;
        }

        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          throw new Error('Impossible de charger le parcours');
        }
        const json = await resp.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [sessionId, childId, instanceId, schoolYear]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'LOGIN':
        return {
          icon: LogIn,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          dot: 'bg-emerald-400 shadow-sm shadow-emerald-500/50',
          title: 'Connexion',
        };
      case 'LOGOUT':
        return {
          icon: LogOut,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/30',
          dot: 'bg-rose-400 shadow-sm shadow-rose-500/50',
          title: 'Déconnexion',
        };
      case 'MISSION_DONE':
        return {
          icon: CheckCircle2,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          dot: 'bg-amber-400 shadow-lg shadow-amber-500/50',
          title: 'Mission Impulsée',
        };
      case 'MISSION_CANCELLED':
        return {
          icon: XCircle,
          color: 'text-slate-400',
          bg: 'bg-slate-800 border-slate-700',
          dot: 'bg-slate-400',
          title: 'Mission Annulée',
        };
      case 'CHALLENGE_INTERACTION':
        return {
          icon: Zap,
          color: 'text-purple-400',
          bg: 'bg-purple-500/10 border-purple-500/30',
          dot: 'bg-purple-400',
          title: 'Défi Équipe',
        };
      case 'EASTER_EGG_INTERACTION':
        return {
          icon: Sparkles,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/30',
          dot: 'bg-cyan-400',
          title: 'Énigme SF',
        };
      case 'PAGE_VIEW':
      default:
        return {
          icon: Eye,
          color: 'text-sky-400',
          bg: 'bg-sky-500/10 border-sky-500/30',
          dot: 'bg-sky-400',
          title: 'Vue Explorée',
        };
    }
  };

  // Groupement par date calendaire
  const dayGroups = useMemo(() => {
    if (!data?.events || data.events.length === 0) return [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const groupsMap = new Map<string, {
      dateKey: string;
      dateObj: Date;
      formattedDate: string;
      isToday: boolean;
      isYesterday: boolean;
      events: any[];
      missionsCount: number;
      pointsIT: number;
      sessionIds: Set<string>;
    }>();

    for (const ev of data.events) {
      const d = new Date(ev.timestamp);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!groupsMap.has(dateKey)) {
        const isToday = dateKey === todayStr;
        const isYesterday = dateKey === yesterdayStr;
        const formattedDate = d.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        groupsMap.set(dateKey, {
          dateKey,
          dateObj: d,
          formattedDate,
          isToday,
          isYesterday,
          events: [],
          missionsCount: 0,
          pointsIT: 0,
          sessionIds: new Set(),
        });
      }

      const group = groupsMap.get(dateKey)!;
      group.events.push(ev);
      if (ev.eventType === 'MISSION_DONE') {
        group.missionsCount++;
      }
      if (ev.metadata?.pointsIT) {
        group.pointsIT += Number(ev.metadata.pointsIT);
      }
      if (ev.sessionId) {
        group.sessionIds.add(ev.sessionId);
      }
    }

    // Tri des dates de la plus récente à la plus ancienne
    return Array.from(groupsMap.values()).sort(
      (a, b) => b.dateObj.getTime() - a.dateObj.getTime(),
    );
  }, [data]);

  // Initialisation : déplier le jour le plus récent par défaut
  useEffect(() => {
    if (dayGroups.length > 0) {
      setExpandedDays((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        return { [dayGroups[0].dateKey]: true };
      });
    }
  }, [dayGroups]);

  const toggleDay = (dateKey: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const expandAllDays = () => {
    const all: Record<string, boolean> = {};
    dayGroups.forEach((g) => {
      all[g.dateKey] = true;
    });
    setExpandedDays(all);
  };

  const collapseAllDays = () => {
    setExpandedDays({});
  };

  const getDayDuration = (group: (typeof dayGroups)[0]) => {
    if (data?.sessions && data.sessions.length > 0) {
      const matchingSessions = data.sessions.filter((s: any) =>
        group.sessionIds.has(s.id),
      );
      if (matchingSessions.length > 0) {
        return matchingSessions.reduce(
          (acc: number, s: any) => acc + (s.durationSeconds || 0),
          0,
        );
      }
    }
    return group.events.reduce(
      (acc, ev) => acc + (ev.timeSpentSeconds || 0),
      0,
    );
  };

  const playerOrSession = data?.player || data?.session;
  const isPlayerMode = Boolean(childId || data?.player);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-black/60 backdrop-blur-sm">
          {/* Backdrop dismiss */}
          <div className="flex-1" onClick={onClose} />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl text-white overflow-hidden"
          >
            {/* Header Drawer */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/95 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg relative">
                  {playerOrSession?.avatar ? (
                    <img
                      src={getAssetUrl(playerOrSession.avatar)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={26} className="text-emerald-400" />
                  )}
                  {playerOrSession?.status === 'ACTIVE' && (
                    <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black tracking-tight text-white m-0">
                      {playerOrSession?.pseudo || playerOrSession?.childPseudo || 'Explorateur'}
                    </h2>
                    {playerOrSession?.teamName && (
                      <span
                        className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${playerOrSession.teamColor}20`,
                          color: playerOrSession.teamColor,
                          border: `1px solid ${playerOrSession.teamColor}50`,
                        }}
                      >
                        {playerOrSession.teamName}
                      </span>
                    )}
                    {playerOrSession?.groupName && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        {playerOrSession.groupName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Activity size={13} className="text-emerald-400" />
                    <span>
                      {isPlayerMode
                        ? `Parcours complet de l'élève • ${dayGroups.length} date${dayGroups.length > 1 ? 's' : ''} enregistrée${dayGroups.length > 1 ? 's' : ''}`
                        : `Parcours de session`}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                title="Fermer le parcours"
              >
                <X size={18} />
              </button>
            </div>

            {/* Metrics & Mode Badges Bar */}
            {playerOrSession && (
              <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800/70 flex items-center justify-between text-xs gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-slate-300">
                  {isPlayerMode ? (
                    <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-bold text-[11px]">
                      <Layers size={13} /> {data?.sessions?.length || 0} session{(data?.sessions?.length || 0) > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-md font-bold text-[11px]">
                      {data?.session?.deviceType?.includes('MOBILE') ? (
                        <>
                          <Smartphone size={13} /> Mobile
                        </>
                      ) : (
                        <>
                          <Monitor size={13} /> Ordinateur
                        </>
                      )}
                    </span>
                  )}

                  <span className="flex items-center gap-1 text-slate-300 font-medium ml-1">
                    <Clock size={13} className="text-emerald-400" />
                    Temps total :{' '}
                    <strong className="text-white">
                      {formatDuration(playerOrSession.durationSeconds || playerOrSession.totalDurationSeconds || 0)}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      playerOrSession.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {playerOrSession.status === 'ACTIVE' ? 'En direct' : 'Déconnecté'}
                  </span>

                  {dayGroups.length > 1 && (
                    <button
                      onClick={() => {
                        const allOpen = dayGroups.every((g) => expandedDays[g.dateKey]);
                        if (allOpen) collapseAllDays();
                        else expandAllDays();
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700 flex items-center gap-1 transition-all"
                      title="Déplier ou replier toutes les dates"
                    >
                      <ChevronsUpDown size={12} />
                      {dayGroups.every((g) => expandedDays[g.dateKey]) ? 'Tout replier' : 'Tout déplier'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Body Content : Timeline grouped by Date */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 size={32} className="animate-spin text-emerald-500" />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Reconstitution du parcours par date...
                  </span>
                </div>
              ) : error ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                  {error}
                </div>
              ) : dayGroups.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  Aucun événement enregistré sur ce parcours.
                </div>
              ) : (
                <div className="space-y-6">
                  {dayGroups.map((group) => {
                    const isExpanded = expandedDays[group.dateKey] ?? false;
                    const duration = getDayDuration(group);

                    return (
                      <div
                        key={group.dateKey}
                        className="rounded-2xl border border-slate-800/90 bg-slate-950/40 overflow-hidden transition-all shadow-sm"
                      >
                        {/* Sticky Date Group Header */}
                        <div
                          onClick={() => toggleDay(group.dateKey)}
                          className="sticky top-0 z-20 px-4 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition-colors select-none group"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                              <Calendar size={14} />
                            </div>

                            <span className="text-sm font-black text-white capitalize">
                              {group.formattedDate}
                            </span>

                            {group.isToday && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                                Aujourd'hui
                              </span>
                            )}
                            {group.isYesterday && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-700 text-slate-200">
                                Hier
                              </span>
                            )}
                          </div>

                          {/* Day summary badges & collapse chevron */}
                          <div className="flex items-center gap-2 text-xs">
                            {duration > 0 && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-800/70 border border-slate-700/60 px-2 py-0.5 rounded-md">
                                <Clock size={11} className="text-emerald-400" />
                                {formatDuration(duration)}
                              </span>
                            )}

                            {group.missionsCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                                <CheckCircle2 size={11} />
                                {group.missionsCount} mission{group.missionsCount > 1 ? 's' : ''}
                              </span>
                            )}

                            {group.pointsIT > 0 && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                                <Award size={11} /> +{group.pointsIT} IT
                              </span>
                            )}

                            <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors ml-1">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                          </div>
                        </div>

                        {/* Events list under this date */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 pt-5 pl-7 relative before:content-[''] before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-800/80">
                                {group.events.map((ev: any, idx: number) => {
                                  const badge = getEventBadge(ev.eventType);
                                  const Icon = badge.icon;
                                  const prevEv = group.events[idx - 1];
                                  const isNewSession =
                                    idx > 0 &&
                                    ev.sessionId &&
                                    prevEv?.sessionId &&
                                    ev.sessionId !== prevEv.sessionId;

                                  return (
                                    <React.Fragment key={ev.id || `${ev.sessionId}-${idx}`}>
                                      {/* Session change indicator inside same day */}
                                      {isNewSession && (
                                        <div className="relative my-4 -ml-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-semibold shadow-inner">
                                          {ev.deviceType?.includes('MOBILE') ? (
                                            <Smartphone size={12} className="text-sky-400 shrink-0" />
                                          ) : (
                                            <Monitor size={12} className="text-indigo-400 shrink-0" />
                                          )}
                                          <span className="text-white font-bold">Autre session</span>
                                          <span>•</span>
                                          <span>{ev.deviceType?.includes('MOBILE') ? 'Mobile' : 'Ordinateur'}</span>
                                          {ev.browser && <span>({ev.browser})</span>}
                                          <span className="ml-auto font-mono text-[10px] text-slate-500">
                                            {formatTime(ev.timestamp)}
                                          </span>
                                        </div>
                                      )}

                                      <div className="relative mb-5 last:mb-0 group/card">
                                        {/* Timeline Node Dot */}
                                        <div
                                          className={`absolute -left-[30px] top-1.5 w-5 h-5 rounded-full border-2 border-slate-900 ${badge.dot} flex items-center justify-center z-10`}
                                        />

                                        {/* Event Card */}
                                        <div
                                          className={`p-3.5 rounded-xl border transition-all ${badge.bg} hover:border-slate-600 shadow-sm`}
                                        >
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                            <span
                                              className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${badge.color}`}
                                            >
                                              <Icon size={14} />
                                              {badge.title}
                                            </span>
                                            <span className="text-[11px] font-mono text-slate-400">
                                              {formatTime(ev.timestamp)}
                                            </span>
                                          </div>

                                          <p className="text-sm font-bold text-white mb-1">
                                            {ev.label || ev.target}
                                          </p>

                                          {/* Event Details / Metadata */}
                                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-300">
                                            {ev.timeSpentSeconds > 0 && (
                                              <span className="flex items-center gap-1 text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                                                <Clock size={11} /> {formatDuration(ev.timeSpentSeconds)}
                                              </span>
                                            )}

                                            {ev.metadata?.pointsIT && (
                                              <span className="flex items-center gap-1 text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded font-black">
                                                <Award size={11} /> +{ev.metadata.pointsIT} IT
                                              </span>
                                            )}

                                            {ev.metadata?.missionTitle && (
                                              <span className="text-slate-400 italic truncate max-w-xs">
                                                « {ev.metadata.missionTitle} »
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer summary */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span>
                Total événements :{' '}
                <strong className="text-white">{data?.events?.length || 0}</strong>
                {dayGroups.length > 0 && (
                  <span className="text-slate-500 ml-2">
                    ({dayGroups.length} journée{dayGroups.length > 1 ? 's' : ''})
                  </span>
                )}
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all text-xs"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
