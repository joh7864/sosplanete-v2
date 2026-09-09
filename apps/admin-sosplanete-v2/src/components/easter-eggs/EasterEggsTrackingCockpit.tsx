'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar,
  Sparkles,
  Users,
  Trophy,
  Clock,
  ArrowLeftRight,
  StopCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Medal,
  Award,
  Calendar,
  Check,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButtonWithTooltip } from '@/components/ui/IconButtonWithTooltip';
import { getAssetUrl, resolvePlayerAvatar } from '@/utils/assets';
import {
  AdminTrackingResponse,
  DetectiveLeaderboard,
  fetchAdminTracking,
  fetchAdminLeaderboard,
  closeInstanceEgg,
  forceInstanceHint,
  resetAdminEggProgress,
} from '@/utils/easterEggApi';
import { ManualActivationModal } from './ManualActivationModal';

interface EasterEggsTrackingCockpitProps {
  instanceYearId: number;
  viewModeProp?: 'live' | 'leaderboard';
  onViewModeChangeProp?: (m: 'live' | 'leaderboard') => void;
}

function resolveTeamLogo(icon: string | null | undefined): string | null {
  if (!icon) return null;
  const filename = icon.split('/').pop();
  if (!filename) return null;
  return getAssetUrl(`teams/${filename}`);
}

function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
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

export function EasterEggsTrackingCockpit({
  instanceYearId,
  viewModeProp,
  onViewModeChangeProp,
}: EasterEggsTrackingCockpitProps) {
  // Mode switcher: 'live' (Période en cours) vs 'leaderboard' (Leaderboard Général Saison)
  const [internalViewMode, setInternalViewMode] = useState<'live' | 'leaderboard'>('live');
  const viewMode = viewModeProp !== undefined ? viewModeProp : internalViewMode;
  const setViewMode = (m: 'live' | 'leaderboard') => {
    setInternalViewMode(m);
    onViewModeChangeProp?.(m);
  };
  const [targetActionEggId, setTargetActionEggId] = useState<number | null>(null);

  // Live tracking state
  const [data, setData] = useState<AdminTrackingResponse | null>(null);
  const [selectedEggId, setSelectedEggId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<DetectiveLeaderboard | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Notifications & Modals
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualModalMode, setManualModalMode] = useState<'replace' | 'add'>('replace');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showForceHintConfirm, setShowForceHintConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [targetResetEgg, setTargetResetEgg] = useState<{ id: number; title: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTracking = async (showSpinner = true, targetEggId?: number) => {
    if (showSpinner) setRefreshing(true);
    try {
      const activeEggId = targetEggId !== undefined ? targetEggId : (selectedEggId ?? undefined);
      const res = await fetchAdminTracking(instanceYearId, activeEggId);
      setData(res);
      if (res.currentEgg && (!selectedEggId || targetEggId !== undefined)) {
        setSelectedEggId(res.currentEgg.id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur chargement tracking' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectEgg = (eggId: number) => {
    setSelectedEggId(eggId);
    loadTracking(true, eggId);
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
      await closeInstanceEgg(instanceYearId, targetActionEggId || selectedEggId || undefined);
      setFeedback({ type: 'success', message: 'Easter Egg clôturé avec succès pour cette période.' });
      loadTracking(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la clôture.' });
    } finally {
      setActionLoading(false);
      setShowCloseConfirm(false);
      setTargetActionEggId(null);
    }
  };

  const handleForceHint = async () => {
    setActionLoading(true);
    try {
      await forceInstanceHint(instanceYearId, targetActionEggId || selectedEggId || undefined);
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
      setTargetActionEggId(null);
    }
  };

  const handleResetEggInCockpit = async () => {
    if (!targetResetEgg) return;
    setActionLoading(true);
    try {
      await resetAdminEggProgress({
        easterEggIds: [targetResetEgg.id],
        instanceYearId,
      });
      setFeedback({
        type: 'success',
        message: `Progression de "${targetResetEgg.title}" réinitialisée avec succès (comme si non résolue).`,
      });
      loadTracking(true);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erreur lors de la réinitialisation.',
      });
    } finally {
      setActionLoading(false);
      setShowResetConfirm(false);
      setTargetResetEgg(null);
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
  const requiredQuota = data?.settings?.easterEggRequiredPlayers ?? 2;

  const displayedEggs =
    data?.periodActiveEggs && data.periodActiveEggs.length > 0
      ? data.periodActiveEggs
      : data?.currentEgg
      ? [
          {
            instanceId: data.activeInstance?.id || 0,
            eggId: data.currentEgg.id,
            code: data.currentEgg.code,
            title: data.currentEgg.title,
            rewardPointsIT: data.currentEgg.rewardPointsIT,
            forceHint: !!data.activeInstance?.forceHint,
          },
        ]
      : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
        <div className="space-y-6">
          {/* 1ère Partie : En-tête des Easter Eggs de la Période en cours */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/95 border border-slate-200/80 rounded-3xl shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-700 shadow-xs shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Easter Eggs de la Période en cours
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Période {period?.periodIndex || 1}
                  </span>
                  {displayedEggs.length > 1 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                      {displayedEggs.length} Easter Eggs actifs
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {period ? `Du ${formatDateOnly(period.startDate)} au ${formatDateOnly(period.endDate)}` : 'Saison en cours'}
                </p>
              </div>
            </div>

            {/* Boutons d'action sous forme de boutons-icônes avec tooltips */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Bouton-icône + : Ajouter un Easter Egg */}
              <IconButtonWithTooltip
                tooltip="Ajouter un Easter Egg sur cette période"
                tooltipPosition="bottom"
                variant="primary"
                onClick={() => {
                  setManualModalMode('add');
                  setIsManualModalOpen(true);
                }}
              >
                <Plus size={16} />
              </IconButtonWithTooltip>

              {/* Bouton-icône ArrowLeftRight : Déclencher ou remplacer */}
              <IconButtonWithTooltip
                tooltip="Déclencher ou remplacer l'Easter Egg actif"
                tooltipPosition="bottom"
                variant="default"
                onClick={() => {
                  setManualModalMode('replace');
                  setIsManualModalOpen(true);
                }}
              >
                <ArrowLeftRight size={16} className="text-purple-600" />
              </IconButtonWithTooltip>

              {/* Bouton-icône Actualiser */}
              <IconButtonWithTooltip
                tooltip="Actualiser le suivi en direct"
                tooltipPosition="bottom"
                tooltipAlign="end"
                variant="default"
                disabled={refreshing}
                onClick={() => loadTracking(true)}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? 'animate-spin text-emerald-600' : 'text-slate-600'}
                />
              </IconButtonWithTooltip>
            </div>
          </div>

          {/* 2ème Partie : Grille des Cartes des Easter Eggs (au moins 3 cartes par ligne) */}
          {displayedEggs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-400">
              Aucun Easter Egg programmé pour cette période.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedEggs.map((pEgg, idx) => {
                const isSelected = (selectedEggId ?? data?.currentEgg?.id) === pEgg.eggId;
                const discoverersCount = pEgg.discoverers?.length || 0;

                // Groupement des découvreurs par équipe
                const discoverersByTeam = Object.values(
                  (pEgg.discoverers || []).reduce((acc, d) => {
                    const key = d.teamId || d.teamName;
                    if (!acc[key]) {
                      acc[key] = {
                        teamId: d.teamId,
                        teamName: d.teamName,
                        teamColor: d.teamColor,
                        teamIcon: d.teamIcon,
                        players: [],
                      };
                    }
                    acc[key]!.players.push(d);
                    return acc;
                  }, {} as Record<string | number, { teamId?: number; teamName: string; teamColor: string; teamIcon?: string | null; players: NonNullable<typeof pEgg.discoverers> }>)
                );

                return (
                  <GlassCard
                    key={pEgg.instanceId || pEgg.eggId}
                    onClick={() => handleSelectEgg(pEgg.eggId)}
                    className={`p-5 rounded-3xl transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between border ${
                      isSelected
                        ? 'bg-gradient-to-b from-purple-50/70 to-white border-purple-400 shadow-md shadow-purple-500/10 ring-2 ring-purple-400/40'
                        : 'bg-white/95 border-slate-200/80 hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isSelected ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Easter Egg #{idx + 1}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          +{pEgg.rewardPointsIT} IT
                        </span>
                      </div>

                      <h4 className="font-black text-base text-slate-800 leading-snug mb-1.5 line-clamp-2">
                        {pEgg.title}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400 truncate mb-3">
                        {pEgg.code}
                      </p>

                      {/* Section Équipe et Joueurs Déclencheurs - Liste épurée et premium */}
                      <div className="pt-3 pb-2 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                          <span className="uppercase tracking-wider">Déclencheurs</span>
                          {discoverersCount > 0 && (
                            <span className="font-mono text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded-full text-[10px] font-bold border border-purple-100">
                              {discoverersCount} {discoverersCount > 1 ? 'joueurs' : 'joueur'}
                            </span>
                          )}
                        </div>

                        {discoverersByTeam.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-1">
                            Non déclenché pour le moment
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {discoverersByTeam.map((group, gIdx) => {
                              const isCompleted = pEgg.teamsCompleted?.some(tc => tc.teamId === group.teamId);
                              const rewardInfo = pEgg.teamsCompleted?.find(tc => tc.teamId === group.teamId);
                              const required = data?.settings?.easterEggRequiredPlayers ?? 2;

                              return (
                                <div key={gIdx} className="space-y-1">
                                  {/* Ligne En-tête équipe : Nom + Statut */}
                                  <div className="flex items-center justify-between text-xs">
                                    <div
                                      className="flex items-center gap-1.5 font-bold"
                                      style={{ color: group.teamColor || '#10b981' }}
                                    >
                                      {group.teamIcon ? (
                                        <img
                                          src={resolveTeamLogo(group.teamIcon)!}
                                          alt=""
                                          className="w-4 h-4 rounded-full object-cover shrink-0"
                                        />
                                      ) : (
                                        <span
                                          className="w-2 h-2 rounded-full shrink-0"
                                          style={{ backgroundColor: group.teamColor || '#10b981' }}
                                        />
                                      )}
                                      <span className="truncate max-w-[140px]">{group.teamName}</span>
                                    </div>

                                    {isCompleted ? (
                                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                                        <Check size={12} className="stroke-[3]" />
                                        <span>Validé</span>
                                        <span className="font-mono text-[10px] text-emerald-700 font-black">
                                          +{rewardInfo?.awardedPointsIT || pEgg.rewardPointsIT} IT
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                                        {group.players.length} / {required} joueur{required > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>

                                  {/* Rangée élégante des joueurs : Avatar stack + pseudos fluides */}
                                  <div className="flex items-center gap-2 pl-4">
                                    <div className="flex -space-x-1.5 overflow-hidden py-0.5 shrink-0">
                                      {group.players?.map((pl) => (
                                        <div
                                          key={pl.childId}
                                          className="w-5 h-5 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center overflow-hidden text-[8px] font-bold text-slate-700 relative shrink-0 shadow-2xs"
                                          title={`@${pl.pseudo}`}
                                        >
                                          <span className="select-none">{pl.pseudo.slice(0, 2).toUpperCase()}</span>
                                          <img
                                            src={resolvePlayerAvatar(pl.avatar, pl.pseudo, pl.gender)}
                                            alt={pl.pseudo}
                                            className="w-full h-full object-cover absolute inset-0 z-10"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    <div className="text-[11px] text-slate-600 font-medium truncate">
                                      {group.players?.map((pl, pIdx) => (
                                        <span key={pl.childId}>
                                          <span className="font-semibold text-slate-700">@{pl.pseudo}</span>
                                          {pIdx < (group.players?.length || 0) - 1 && (
                                            <span className="text-slate-400 mr-1.5">,</span>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions bar at bottom of each card */}
                    <div
                      className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        {pEgg.forceHint ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Eye size={11} /> Indice révélé
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            {isSelected ? 'Sélectionné' : 'Cliquer pour suivre'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Bouton-icône Eye : Forcer l'apparition du 2ème indice */}
                        <IconButtonWithTooltip
                          tooltip={pEgg.forceHint ? '2ème indice déjà révélé' : 'Forcer l’apparition du 2ème indice'}
                          tooltipPosition="top"
                          variant="amber"
                          size="sm"
                          disabled={pEgg.forceHint}
                          onClick={() => {
                            setTargetActionEggId(pEgg.eggId);
                            setShowForceHintConfirm(true);
                          }}
                        >
                          <Eye size={15} />
                        </IconButtonWithTooltip>

                        {/* Bouton-icône RotateCcw : Réinitialiser la progression */}
                        <IconButtonWithTooltip
                          tooltip="Réinitialiser la progression (comme non résolu)"
                          tooltipPosition="top"
                          variant="amber"
                          size="sm"
                          onClick={() => {
                            setTargetResetEgg({ id: pEgg.eggId, title: pEgg.title });
                            setShowResetConfirm(true);
                          }}
                        >
                          <RotateCcw size={15} />
                        </IconButtonWithTooltip>

                        {/* Bouton-icône StopCircle : Clôturer cet Easter Egg */}
                        <IconButtonWithTooltip
                          tooltip="Clôturer immédiatement cet Easter Egg"
                          tooltipPosition="top"
                          tooltipAlign="end"
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setTargetActionEggId(pEgg.eggId);
                            setShowCloseConfirm(true);
                          }}
                        >
                          <StopCircle size={15} />
                        </IconButtonWithTooltip>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {/* 3ème Partie : Avancement & Quotas par Équipe (Global sur la période) */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data?.teamsTracking.map((team) => {
                  const solvedCount = team.solvedEggsCount || 0;
                  const totalEggs = team.activeEggsTotal || displayedEggs.length || 1;
                  const isAllSolved = solvedCount >= totalEggs && totalEggs > 0;
                  const isPartiallySolved = solvedCount > 0;
                  const totalPoints = team.totalAwardedPointsIT ?? team.awardedPointsIT ?? 0;
                  const hasActivePlayers = (team.contributingPlayers?.length || team.discoveredCount || 0) > 0;

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
                        {/* Header de l'équipe avec statut synthétique */}
                        <div className="flex items-center justify-between mb-3.5 gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
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
                            <h4 className="font-black text-base text-slate-800 truncate">{team.teamName}</h4>
                          </div>

                          {/* Statut synthétique */}
                          {isAllSolved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs shrink-0">
                              <Trophy size={13} className="text-emerald-700" />
                              {totalEggs > 1 ? 'Tous validés' : 'Validé'} ({solvedCount}/{totalEggs}) • +{totalPoints} IT
                            </span>
                          ) : isPartiallySolved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
                              <Trophy size={13} />
                              {solvedCount}/{totalEggs} résolu{solvedCount > 1 ? 's' : ''} • +{totalPoints} IT
                            </span>
                          ) : hasActivePlayers ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                              En cours ({team.discoveredCount} actif{team.discoveredCount > 1 ? 's' : ''})
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-500 shrink-0">
                              En attente
                            </span>
                          )}
                        </div>

                        {/* Liste épurée des Easter Eggs de la période pour cette équipe */}
                        <div className="space-y-2 my-2 py-1">
                          {(team.eggsProgress && team.eggsProgress.length > 0
                            ? team.eggsProgress
                            : displayedEggs.map((de) => {
                                const isDone = team.solvedEggs?.some(se => se.easterEggId === de.eggId);
                                const r = team.solvedEggs?.find(se => se.easterEggId === de.eggId);
                                const pl = (de.discoverers || []).filter(disc => disc.teamId === team.teamId);
                                return {
                                  eggId: de.eggId,
                                  title: de.title,
                                  code: de.code,
                                  rewardPointsIT: de.rewardPointsIT,
                                  isCompleted: !!isDone,
                                  playersCount: pl.length,
                                  requiredPlayers: requiredQuota,
                                  players: pl,
                                  reward: r ? { rank: r.rank, awardedPointsIT: r.awardedPointsIT, completedAt: r.completedAt } : null,
                                };
                              })
                          ).map((egg) => {
                            const isDone = egg.isCompleted;
                            const hasProgress = !isDone && egg.playersCount > 0;

                            return (
                              <div
                                key={egg.eggId}
                                className="flex flex-col gap-1 py-1.5 border-b border-slate-100/70 last:border-0"
                              >
                                <div className="flex items-center justify-between text-xs gap-2">
                                  <div className="flex items-center gap-1.5 font-bold truncate min-w-0 text-slate-800">
                                    {isDone ? (
                                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 stroke-[2.5]" />
                                    ) : hasProgress ? (
                                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 ring-4 ring-amber-100" />
                                    ) : (
                                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0" />
                                    )}
                                    <span className="truncate">{egg.title}</span>
                                  </div>

                                  {isDone ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                                      <span>Validé</span>
                                      <span className="font-mono font-black">
                                        +{egg.reward?.awardedPointsIT || egg.rewardPointsIT} IT
                                      </span>
                                    </span>
                                  ) : hasProgress ? (
                                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 shrink-0">
                                      En cours ({egg.playersCount}/{egg.requiredPlayers})
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                                      0 / {egg.requiredPlayers}
                                    </span>
                                  )}
                                </div>

                                {/* Pseudos et avatars des joueurs ayant découvert cet œuf */}
                                {egg.players && egg.players.length > 0 && (
                                  <div className="flex items-center gap-2 pl-5 pt-0.5 text-[11px]">
                                    <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                      {egg.players.map((pl) => (
                                        <div
                                          key={pl.childId}
                                          className="w-4 h-4 rounded-full ring-1.5 ring-white bg-slate-100 flex items-center justify-center overflow-hidden text-[7px] font-bold text-slate-700 relative shrink-0 shadow-2xs"
                                          title={`@${pl.pseudo}`}
                                        >
                                          <span className="select-none">{pl.pseudo.slice(0, 2).toUpperCase()}</span>
                                          <img
                                            src={resolvePlayerAvatar(pl.avatar, pl.pseudo, pl.gender)}
                                            alt={pl.pseudo}
                                            className="w-full h-full object-cover absolute inset-0 z-10"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                    <span className="text-slate-600 font-medium truncate">
                                      {egg.players.map((p) => `@${p.pseudo}`).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2.5 border-t border-slate-100 mt-2">
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
                Aucun agent n'a encore découvert d'Easter Egg pour cette période.
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
                        <th className="py-3.5 px-4">Easter Egg Déclenché</th>
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
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-[10px] text-slate-700 relative">
                                <span className="select-none">{d.pseudo.slice(0, 2).toUpperCase()}</span>
                                <img
                                  src={resolvePlayerAvatar(d.avatar, d.pseudo, d.gender)}
                                  alt={d.pseudo}
                                  className="w-full h-full object-cover absolute inset-0 z-10"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
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
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-900 font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs">
                                <Sparkles size={13} className="text-purple-600 shrink-0" />
                                <span>{d.easterEggTitle || d.easterEggCode || `Easter Egg #${d.easterEggId || ''}`}</span>
                              </span>
                              {d.rewardPointsIT ? (
                                <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 font-mono font-bold text-amber-700 text-[11px] shrink-0">
                                  +{d.rewardPointsIT} IT
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
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

                        <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden mb-2 flex items-center justify-center font-black text-slate-700 text-lg shadow-inner relative">
                          <span className="select-none">{det.pseudo.slice(0, 2).toUpperCase()}</span>
                          <img
                            src={resolvePlayerAvatar(det.avatar, det.pseudo, det.gender)}
                            alt={det.pseudo}
                            className="w-full h-full object-cover absolute inset-0 z-10"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
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
                                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-[10px] text-slate-700 relative">
                                  <span className="select-none">{det.pseudo.slice(0, 2).toUpperCase()}</span>
                                  <img
                                    src={resolvePlayerAvatar(det.avatar, det.pseudo, det.gender)}
                                    alt={det.pseudo}
                                    className="w-full h-full object-cover absolute inset-0 z-10"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
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
          loadTracking(true);
        }}
        instanceYearId={instanceYearId}
        currentEggId={egg?.id}
        initialMode={manualModalMode}
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

      {/* Confirmation Réinitialisation en direct */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => {
          setShowResetConfirm(false);
          setTargetResetEgg(null);
        }}
        onConfirm={handleResetEggInCockpit}
        title="Réinitialiser cette énigme en direct ?"
        description={`Voulez-vous réinitialiser la progression de "${targetResetEgg?.title}" pour cette instance ? Les découvertes individuelles et récompenses d'équipe associées seront effacées (comme si elle n'avait jamais été résolue).`}
        confirmLabel="Réinitialiser l'énigme"
        cancelLabel="Annuler"
        variant="warning"
      />
    </div>
  );
}
