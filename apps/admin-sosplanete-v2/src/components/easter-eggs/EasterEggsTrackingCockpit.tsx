'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar,
  Sparkles,
  Users,
  Trophy,
  Clock,
  Play,
  Square,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Medal,
  Award,
  Calendar,
  Check
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButtonWithTooltip } from '@/components/ui/IconButtonWithTooltip';
import { getAssetUrl } from '@/utils/assets';
import {
  AdminTrackingResponse,
  DetectiveLeaderboard,
  fetchAdminTracking,
  fetchAdminLeaderboard,
  closeInstanceEgg,
  forceInstanceHint,
} from '@/utils/easterEggApi';
import { ManualActivationModal } from './ManualActivationModal';

interface EasterEggsTrackingCockpitProps {
  instanceYearId: number;
}

function resolveTeamLogo(icon: string | null | undefined): string | null {
  if (!icon) return null;
  const filename = icon.split('/').pop();
  if (!filename) return null;
  return getAssetUrl(`teams/${filename}`);
}

function formatTime(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m} min ${s} s`;
  return `${s} s`;
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ' (' +
    d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) +
    ')'
  );
}

export function EasterEggsTrackingCockpit({ instanceYearId }: EasterEggsTrackingCockpitProps) {
  // Mode switcher: 'live' (Période en cours) vs 'leaderboard' (Leaderboard Général Saison)
  const [viewMode, setViewMode] = useState<'live' | 'leaderboard'>('live');

  // Live tracking state
  const [data, setData] = useState<AdminTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<DetectiveLeaderboard | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Notifications & Modals
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showForceHintConfirm, setShowForceHintConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTracking = async (showSpinner = true) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetchAdminTracking(instanceYearId);
      setData(res);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur chargement tracking' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLeaderboardData = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetchAdminLeaderboard(instanceYearId);
      setLeaderboard(res);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur chargement leaderboard' });
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    loadTracking(true);
    // Polling toutes les 15s si en mode live
    const interval = setInterval(() => {
      if (viewMode === 'live') {
        loadTracking(false);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [instanceYearId, viewMode]);

  useEffect(() => {
    if (viewMode === 'leaderboard') {
      loadLeaderboardData();
    }
  }, [viewMode, instanceYearId]);

  const handleCloseEgg = async () => {
    setActionLoading(true);
    try {
      await closeInstanceEgg(instanceYearId);
      setFeedback({ type: 'success', message: 'Easter Egg en cours clôturé avec succès.' });
      loadTracking(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la clôture.' });
    } finally {
      setActionLoading(false);
      setShowCloseConfirm(false);
    }
  };

  const handleForceHint = async () => {
    setActionLoading(true);
    try {
      await forceInstanceHint(instanceYearId);
      setFeedback({
        type: 'success',
        message: 'Le 2ème indice est maintenant immédiatement visible pour tous les élèves !',
      });
      loadTracking(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors du forçage de l’indice.' });
    } finally {
      setActionLoading(false);
      setShowForceHintConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={36} />
        <span className="text-xs font-bold text-slate-500">Connexion au Cockpit Temps Réel...</span>
      </div>
    );
  }

  const egg = data?.currentEgg;
  const period = data?.currentPeriod;
  const isHintForced = data?.activeInstance?.forceHint ?? false;
  const isManuallyOpened = Boolean(data?.activeInstance);
  const requiredQuota = data?.settings?.easterEggRequiredPlayers ?? 2;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Status & View Mode Switcher */}
      <GlassCard className="p-6 bg-white/95 border-slate-200/80 shadow-sm rounded-3xl relative">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Egg / Season Info */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
              {viewMode === 'live' ? (
                <Radar size={28} className="animate-pulse" />
              ) : (
                <Trophy size={28} className="text-amber-500" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {viewMode === 'live' ? (
                  <>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      En Direct • Période {period?.periodIndex || 1}
                    </span>

                    {isManuallyOpened ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                        Déclenchement Manuel AM
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                        Cycle Automatique
                      </span>
                    )}

                    {isHintForced && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        2ème Indice Forcé
                      </span>
                    )}
                  </>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    Saison en cours • Palmarès Détectives
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-800">
                {viewMode === 'live'
                  ? egg
                    ? egg.title
                    : 'Aucun Easter Egg actif pour cette période'
                  : 'Classement Général des Détectives'}
              </h2>

              {viewMode === 'live' ? (
                egg && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {egg.code} • Récompense : +{egg.rewardPointsIT} IT • Quota équipe : {requiredQuota} joueurs
                  </p>
                )
              ) : (
                <p className="text-xs text-slate-500 mt-0.5">
                  Podium des meilleurs élèves enquêteurs et statistiques collectives des équipes
                </p>
              )}
            </div>
          </div>

          {/* Action Toolbar & Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto">
            {/* View Mode Toggle Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-xs mr-1">
              <IconButtonWithTooltip
                tooltip="Vue En Direct (Période en cours)"
                tooltipPosition="bottom"
                variant={viewMode === 'live' ? 'primary' : 'subtle'}
                size="sm"
                active={viewMode === 'live'}
                onClick={() => setViewMode('live')}
              >
                <Radar size={15} />
              </IconButtonWithTooltip>

              <IconButtonWithTooltip
                tooltip="Vue Leaderboard Général (Saison)"
                tooltipPosition="bottom"
                variant={viewMode === 'leaderboard' ? 'amber' : 'subtle'}
                size="sm"
                active={viewMode === 'leaderboard'}
                onClick={() => setViewMode('leaderboard')}
              >
                <Trophy size={15} />
              </IconButtonWithTooltip>
            </div>

            {/* Live Actions (Icon Buttons with Tooltip) */}
            {viewMode === 'live' && (
              <>
                {/* Ouvrir Manuellement */}
                <IconButtonWithTooltip
                  tooltip="Ouvrir manuellement un Easter Egg sur cette période"
                  tooltipPosition="bottom"
                  variant="primary"
                  onClick={() => setIsManualModalOpen(true)}
                >
                  <Play size={16} />
                </IconButtonWithTooltip>

                {/* Forcer 2ème Indice */}
                {egg && (
                  <IconButtonWithTooltip
                    tooltip={isHintForced ? '2ème indice déjà forcé' : 'Forcer l’apparition du 2ème indice'}
                    tooltipPosition="bottom"
                    variant="amber"
                    disabled={isHintForced}
                    onClick={() => setShowForceHintConfirm(true)}
                  >
                    <Zap size={16} />
                  </IconButtonWithTooltip>
                )}

                {/* Clôturer l'Egg en cours */}
                {egg && (
                  <IconButtonWithTooltip
                    tooltip="Clôturer immédiatement cet Easter Egg"
                    tooltipPosition="bottom"
                    tooltipAlign="end"
                    variant="danger"
                    onClick={() => setShowCloseConfirm(true)}
                  >
                    <Square size={16} />
                  </IconButtonWithTooltip>
                )}
              </>
            )}

            {/* Refresh Button */}
            <IconButtonWithTooltip
              tooltip={viewMode === 'live' ? 'Actualiser le suivi en direct' : 'Actualiser le classement'}
              tooltipPosition="bottom"
              tooltipAlign="end"
              variant="default"
              disabled={refreshing || loadingLeaderboard}
              onClick={() => {
                if (viewMode === 'live') loadTracking(true);
                else loadLeaderboardData();
              }}
            >
              <RefreshCw
                size={16}
                className={refreshing || loadingLeaderboard ? 'animate-spin text-emerald-600' : 'text-slate-600'}
              />
            </IconButtonWithTooltip>
          </div>
        </div>
      </GlassCard>

      {/* Feedback banner */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* VUE 1 : EN DIRECT (PÉRIODE EN COURS)                                       */}
      {/* ========================================================================= */}
      {viewMode === 'live' && (
        <>
          {/* Section 1: Team Progress Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Avancement & Quotas par Équipe
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Objectif : <strong className="text-emerald-600">{requiredQuota} joueurs</strong> validés par équipe
              </span>
            </div>

            {data?.teamsTracking.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-400">
                Aucune équipe enregistrée sur cet espace.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.teamsTracking.map((team) => {
                  const quotaMet = team.discoveredCount >= requiredQuota;
                  const percent = Math.min(100, Math.round((team.discoveredCount / requiredQuota) * 100));

                  return (
                    <GlassCard
                      key={team.teamId}
                      className="p-5 bg-white/95 border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Team Color Top Accent */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1.5"
                        style={{ backgroundColor: team.teamColor || '#10b981' }}
                      />

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center overflow-hidden border border-slate-200/80 shrink-0">
                              {team.teamIcon ? (
                                <img
                                  src={resolveTeamLogo(team.teamIcon)!}
                                  alt={team.teamName}
                                  className="w-full h-full object-cover p-1"
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center font-black text-[11px]"
                                  style={{
                                    backgroundColor: `${team.teamColor || '#10b981'}20`,
                                    color: team.teamColor || '#10b981',
                                  }}
                                >
                                  {team.teamName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <h4 className="font-black text-base text-slate-800">{team.teamName}</h4>
                          </div>

                          {team.isRewarded ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Trophy size={13} />
                              {team.rewardRank === 1 ? '1ère place' : `${team.rewardRank}e place`} • +
                              {team.awardedPointsIT} IT
                            </span>
                          ) : quotaMet ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                              Quota Atteint !
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">
                              En attente ({team.discoveredCount}/{requiredQuota})
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 mb-2">
                          <div className="flex justify-between text-xs text-slate-500 font-medium">
                            <span>Progression collective</span>
                            <span className="font-mono font-bold text-slate-800">
                              {team.discoveredCount} / {requiredQuota} joueurs
                            </span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
                            <motion.div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percent}%`,
                                backgroundColor: team.teamColor || '#10b981',
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                        <span>
                          Membres totaux : <strong className="text-slate-700">{team.totalPlayers}</strong>
                        </span>
                        {team.completedAt && (
                          <span className="text-emerald-600 font-semibold">
                            Validé le {formatDateTime(team.completedAt)}
                          </span>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Individual Discoveries Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Journal Horodaté des Découvreurs ({data?.individualDiscoveries.length || 0})
                </h3>
              </div>
              <span className="text-xs text-slate-500">En direct par ordre chronologique</span>
            </div>

            {data?.individualDiscoveries.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-400">
                Aucun agent n'a encore découvert l'Easter Egg pour cette période.
              </div>
            ) : (
              <GlassCard className="bg-white/95 border-slate-200/80 shadow-sm rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-600 font-black uppercase tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="py-3.5 px-4">Rang</th>
                        <th className="py-3.5 px-4">Agent Découvreur</th>
                        <th className="py-3.5 px-4">Équipe</th>
                        <th className="py-3.5 px-4">Heure de Découverte</th>
                        <th className="py-3.5 px-4">Temps de Résolution</th>
                        <th className="py-3.5 px-4">Réponse / Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.individualDiscoveries.map((d, index) => (
                        <tr key={d.childId + '-' + index} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">
                            #{index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-[10px] text-slate-700">
                                {d.avatar ? (
                                  <img src={d.avatar} alt={d.pseudo} className="w-full h-full object-cover" />
                                ) : (
                                  d.pseudo.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <span className="font-bold text-slate-800">@{d.pseudo}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold text-[11px]"
                              style={{
                                backgroundColor: `${d.teamColor || '#10b981'}15`,
                                color: d.teamColor || '#10b981',
                              }}
                            >
                              {d.teamIcon ? (
                                <img
                                  src={resolveTeamLogo(d.teamIcon)!}
                                  alt=""
                                  className="w-4 h-4 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: d.teamColor || '#10b981' }}
                                />
                              )}
                              {d.teamName || 'Équipe'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono">
                            {formatDateTime(d.discoveredAt)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {formatTime(d.resolutionTimeSeconds)}
                          </td>
                          <td className="py-3 px-4">
                            {d.answerSubmitted ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 font-mono font-bold text-emerald-700 text-[11px]">
                                {d.answerSubmitted}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Action secrète</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* VUE 2 : LEADERBOARD GÉNÉRAL (SAISON EN COURS)                              */}
      {/* ========================================================================= */}
      {viewMode === 'leaderboard' && (
        <div className="space-y-6">
          {loadingLeaderboard ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-amber-500" size={32} />
              <span className="text-xs font-bold text-slate-500">Calcul du classement de la saison...</span>
            </div>
          ) : !leaderboard || leaderboard.topDetectives.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
              <Trophy size={40} className="mx-auto text-amber-300" />
              <h4 className="text-base font-bold text-slate-800">Aucune découverte enregistrée cette saison</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Le palmarès des détectives s'affichera dès que les premiers élèves auront résolu les Easter Eggs
                dans l’univers du jeu.
              </p>
            </div>
          ) : (
            <>
              {/* Podium Top 3 Detectives */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Medal size={18} className="text-amber-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Podium Détectives de la Saison
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {leaderboard.topDetectives.slice(0, 3).map((det, idx) => {
                    const medals = [
                      {
                        title: '1ère Place (Or)',
                        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
                        accent: 'border-amber-300 shadow-amber-100',
                        trophyColor: 'text-amber-500',
                      },
                      {
                        title: '2ème Place (Argent)',
                        badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
                        accent: 'border-slate-200 shadow-slate-100',
                        trophyColor: 'text-slate-400',
                      },
                      {
                        title: '3ème Place (Bronze)',
                        badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
                        accent: 'border-orange-200 shadow-orange-100',
                        trophyColor: 'text-orange-500',
                      },
                    ];
                    const m = medals[idx] || medals[2];

                    return (
                      <GlassCard
                        key={det.childId}
                        className={`p-5 bg-white/95 rounded-3xl border ${m.accent} shadow-sm text-center flex flex-col items-center justify-between relative overflow-hidden`}
                      >
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border mb-3 ${m.badgeColor}`}
                        >
                          {m.title}
                        </span>

                        <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden mb-2 flex items-center justify-center font-black text-slate-700 text-lg shadow-inner">
                          {det.avatar ? (
                            <img src={det.avatar} alt={det.pseudo} className="w-full h-full object-cover" />
                          ) : (
                            det.pseudo.slice(0, 2).toUpperCase()
                          )}
                        </div>

                        <h4 className="font-black text-slate-800 text-base">@{det.pseudo}</h4>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold mt-1"
                          style={{
                            backgroundColor: `${det.teamColor || '#10b981'}15`,
                            color: det.teamColor || '#10b981',
                          }}
                        >
                          {det.teamIcon ? (
                            <img
                              src={resolveTeamLogo(det.teamIcon)!}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: det.teamColor || '#10b981' }}
                            />
                          )}
                          {det.teamName}
                        </span>

                        <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-around text-xs">
                          <div>
                            <span className="block font-bold text-slate-400 text-[10px] uppercase">Résolus</span>
                            <span className="font-mono font-black text-slate-800 text-sm">{det.solvedCount}</span>
                          </div>
                          <div>
                            <span className="block font-bold text-slate-400 text-[10px] uppercase">Points IT</span>
                            <span className="font-mono font-black text-emerald-600 text-sm">
                              +{det.totalPointsContributed}
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>

              {/* Table Complete Detectives */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                      Classement Intégral des Détectives ({leaderboard.topDetectives.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">Cumul de tous les Easter Eggs trouvés</span>
                </div>

                <GlassCard className="bg-white/95 border-slate-200/80 shadow-sm rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-slate-600 font-black uppercase tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th className="py-3.5 px-4">Rang</th>
                          <th className="py-3.5 px-4">Agent Détective</th>
                          <th className="py-3.5 px-4">Équipe</th>
                          <th className="py-3.5 px-4">Énigmes Résolues</th>
                          <th className="py-3.5 px-4">Points IT Débloqués</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leaderboard.topDetectives.map((det, index) => (
                          <tr key={det.childId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-500">
                              #{index + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-[10px] text-slate-700">
                                  {det.avatar ? (
                                    <img src={det.avatar} alt={det.pseudo} className="w-full h-full object-cover" />
                                  ) : (
                                    det.pseudo.slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <span className="font-bold text-slate-800">@{det.pseudo}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold text-[11px]"
                                style={{
                                  backgroundColor: `${det.teamColor || '#10b981'}15`,
                                  color: det.teamColor || '#10b981',
                                }}
                              >
                                {det.teamIcon ? (
                                  <img
                                    src={resolveTeamLogo(det.teamIcon)!}
                                    alt=""
                                    className="w-4 h-4 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: det.teamColor || '#10b981' }}
                                  />
                                )}
                                {det.teamName}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                              {det.solvedCount} énigme{det.solvedCount > 1 ? 's' : ''}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-mono font-bold text-emerald-700 text-xs">
                                +{det.totalPointsContributed} IT
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>

              {/* Table Teams Ranking */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-purple-600" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                      Classement des Équipes sur la Saison ({leaderboard.teamsRanking.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">Points d'équipe collectifs remportés</span>
                </div>

                <GlassCard className="bg-white/95 border-slate-200/80 shadow-sm rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-slate-600 font-black uppercase tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th className="py-3.5 px-4">Rang</th>
                          <th className="py-3.5 px-4">Équipe</th>
                          <th className="py-3.5 px-4">Énigmes Réussies</th>
                          <th className="py-3.5 px-4">1ères Places (Victoires)</th>
                          <th className="py-3.5 px-4">Points IT Collectés</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leaderboard.teamsRanking.map((team, index) => (
                          <tr key={team.teamId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-500">
                              #{index + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="relative w-7 h-7 rounded-full bg-white shadow-xs border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
                                  {team.icon ? (
                                    <img
                                      src={resolveTeamLogo(team.icon)!}
                                      alt={team.name}
                                      className="w-full h-full object-cover p-0.5"
                                    />
                                  ) : (
                                    <div
                                      className="w-full h-full flex items-center justify-center font-bold text-[10px]"
                                      style={{
                                        backgroundColor: `${team.color || '#10b981'}20`,
                                        color: team.color || '#10b981',
                                      }}
                                    >
                                      {team.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <span className="font-bold text-slate-800">{team.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                              {team.solvedEnigmasCount}
                            </td>
                            <td className="py-3 px-4">
                              {team.firstPlacesCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                                  <Trophy size={11} />
                                  {team.firstPlacesCount}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 font-mono font-bold text-purple-700 text-xs">
                                +{team.totalPointsIT} IT
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modale d'Ouverture Manuelle */}
      <ManualActivationModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={() => {
          setFeedback({ type: 'success', message: 'Easter Egg activé avec succès sur la période en cours.' });
          loadTracking(true);
        }}
        instanceYearId={instanceYearId}
        currentEggId={egg?.id}
      />

      {/* Confirmation Clôture */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleCloseEgg}
        title="Clôturer cet Easter Egg ?"
        description="Voulez-vous clôturer manuellement l'Easter Egg actif pour cette période ? Les élèves ne pourront plus interagir avec jusqu'au prochain cycle ou déclenchement."
        confirmLabel="Clôturer"
        cancelLabel="Annuler"
        variant="danger"
      />

      {/* Confirmation Force Indice 2 */}
      <ConfirmDialog
        isOpen={showForceHintConfirm}
        onClose={() => setShowForceHintConfirm(false)}
        onConfirm={handleForceHint}
        title="Forcer le 2ème Indice immédiatement ?"
        description="Le délai du minuteur sera court-circuité : tous les élèves de l'établissement verront immédiatement le 2ème indice explicite dans la bulle de la mascotte."
        confirmLabel="Forcer l'indice"
        cancelLabel="Annuler"
        variant="warning"
      />
    </div>
  );
}
