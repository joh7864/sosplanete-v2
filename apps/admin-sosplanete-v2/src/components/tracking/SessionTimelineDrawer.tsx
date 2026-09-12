'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { getAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';

interface SessionTimelineDrawerProps {
  sessionId: string | null;
  onClose: () => void;
}

export const SessionTimelineDrawer: React.FC<SessionTimelineDrawerProps> = ({
  sessionId,
  onClose,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setData(null);
      return;
    }

    const fetchJourney = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthData('access_token');
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tracking/sessions/${sessionId}/journey`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!resp.ok) {
          throw new Error('Impossible de charger le parcours de cette session');
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
  }, [sessionId]);

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
    return `${m}m ${s}s`;
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'LOGIN':
        return {
          icon: LogIn,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          dot: 'bg-emerald-400',
          title: 'Connexion',
        };
      case 'LOGOUT':
        return {
          icon: LogOut,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/30',
          dot: 'bg-rose-400',
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

  return (
    <AnimatePresence>
      {sessionId && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-black/50 backdrop-blur-sm">
          {/* Backdrop dismiss */}
          <div className="flex-1" onClick={onClose} />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl text-white overflow-hidden"
          >
            {/* Header Drawer */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                  {data?.session?.avatar ? (
                    <img
                      src={getAssetUrl(data.session.avatar)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Layers size={22} className="text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black tracking-tight text-white m-0">
                      {data?.session?.childPseudo || 'Explorateur'}
                    </h2>
                    {data?.session?.teamName && (
                      <span
                        className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${data.session.teamColor}20`,
                          color: data.session.teamColor,
                          border: `1px solid ${data.session.teamColor}50`,
                        }}
                      >
                        {data.session.teamName}
                      </span>
                    )}
                    {data?.session?.groupName && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        {data.session.groupName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Calendar size={13} />
                    {data?.session?.startedAt
                      ? new Date(data.session.startedAt).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '---'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Session Metadata Badges */}
            {data?.session && (
              <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between text-xs gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-slate-300">
                  {data.session.deviceType?.includes('MOBILE') ? (
                    <span className="flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-md font-bold text-[11px]">
                      <Smartphone size={13} />{' '}
                      {data.session.deviceType === 'MOBILE_LANDSCAPE'
                        ? 'Mobile Paysage'
                        : 'Mobile Portrait'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-md font-bold text-[11px]">
                      <Monitor size={13} /> Ordinateur
                    </span>
                  )}
                  {data.session.browser && (
                    <span className="text-slate-400 text-[11px]">
                      {data.session.browser} • {data.session.os}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-slate-300 font-medium">
                    <Clock size={13} className="text-emerald-400" />
                    Durée :{' '}
                    <strong className="text-white">
                      {formatDuration(data.session.durationSeconds)}
                    </strong>
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      data.session.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {data.session.status === 'ACTIVE' ? 'En direct' : 'Terminé'}
                  </span>
                </div>
              </div>
            )}

            {/* Body Content : Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 size={32} className="animate-spin text-emerald-500" />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Reconstitution du parcours...
                  </span>
                </div>
              ) : error ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                  {error}
                </div>
              ) : data?.events?.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Aucun événement enregistré sur cette session.
                </div>
              ) : (
                <div className="relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                  {data?.events?.map((ev: any) => {
                    const badge = getEventBadge(ev.eventType);
                    const Icon = badge.icon;

                    return (
                      <div key={ev.id} className="relative mb-6 last:mb-0 group">
                        {/* Timeline Node Dot */}
                        <div
                          className={`absolute -left-[30px] top-1.5 w-5 h-5 rounded-full border-2 border-slate-900 ${badge.dot} flex items-center justify-center z-10`}
                        />

                        {/* Event Card */}
                        <div
                          className={`p-3.5 rounded-xl border transition-all ${badge.bg} hover:border-slate-600`}
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
                              <span className="flex items-center gap-1 text-slate-400 bg-slate-950/40 px-2 py-0.5 rounded">
                                <Clock size={11} /> {formatDuration(ev.timeSpentSeconds)}
                              </span>
                            )}

                            {ev.metadata?.pointsIT && (
                              <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded font-black">
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
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all text-xs"
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
