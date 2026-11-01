'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Trophy,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Hourglass,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  Search,
  Lock,
  Lightbulb,
  History,
  Check,
  AlertCircle,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButtonWithTooltip } from '@/components/ui/IconButtonWithTooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EggGlyphIcon } from './EggGlyphIcon';
import {
  fetchAdminChronoFrise,
  closeInstanceEgg,
  forceInstanceHint,
  resetAdminEggProgress,
  AdminChronoFriseResponse,
  ChronoFriseCycle,
  ChronoFriseEgg,
  ChronoFriseResolvedTeam,
} from '@/utils/easterEggApi';

interface EasterEggsChronoFriseProps {
  instanceYearId: number;
}

export function EasterEggsChronoFrise({ instanceYearId }: EasterEggsChronoFriseProps) {
  const [data, setData] = useState<AdminChronoFriseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [selectedTeamId, setSelectedTeamId] = useState<number | 'ALL'>('ALL');
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<number | 'ALL' | 'CURRENT'>('ALL');
  const [searchEggText, setSearchEggText] = useState('');

  // Accordéon : Cycles dépliés (Set d'indices de cycles)
  const [expandedCycles, setExpandedCycles] = useState<Set<number>>(new Set());

  // Référence pour le scroll automatique sur le cycle courant
  const currentCycleRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledRef = useRef(false);

  // Actions d'administration & Confirmations
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [targetActionEggId, setTargetActionEggId] = useState<number | null>(null);
  const [targetResetEgg, setTargetResetEgg] = useState<{ id: number; title: string } | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showForceHintConfirm, setShowForceHintConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetchAdminChronoFrise(instanceYearId);
      setData(res);

      // Ouvrir par défaut le cycle en cours à l'initialisation
      if (!silent && res.cycles && res.cycles.length > 0) {
        const current = res.cycles.find((c) => c.isCurrent);
        if (current) {
          setExpandedCycles(new Set([current.cycleIndex]));
        } else {
          setExpandedCycles(new Set([res.cycles[0].cycleIndex]));
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement de la Chrono-Frise');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (instanceYearId) {
      loadData();
    }
  }, [instanceYearId]);

  // Scroll automatique centré sur le cycle courant au premier chargement des données
  useEffect(() => {
    if (data && !hasScrolledRef.current && currentCycleRef.current) {
      hasScrolledRef.current = true;
      setTimeout(() => {
        currentCycleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [data]);

  // Bascule d'ouverture d'un cycle individuel
  const toggleCycle = (cycleIndex: number) => {
    setExpandedCycles((prev) => {
      const next = new Set(prev);
      if (next.has(cycleIndex)) {
        next.delete(cycleIndex);
      } else {
        next.add(cycleIndex);
      }
      return next;
    });
  };

  // Tout déplier ou tout replier
  const toggleAllCycles = () => {
    if (!data?.cycles) return;
    if (expandedCycles.size === data.cycles.length) {
      setExpandedCycles(new Set());
    } else {
      setExpandedCycles(new Set(data.cycles.map((c) => c.cycleIndex)));
    }
  };

  // Actions d'administration
  const handleCloseEgg = async () => {
    if (!targetActionEggId) return;
    setActionLoading(true);
    try {
      await closeInstanceEgg(instanceYearId, targetActionEggId);
      setFeedback({ type: 'success', message: 'Easter Egg clôturé avec succès.' });
      loadData(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la clôture.' });
    } finally {
      setActionLoading(false);
      setShowCloseConfirm(false);
      setTargetActionEggId(null);
    }
  };

  const handleForceHint = async () => {
    if (!targetActionEggId) return;
    setActionLoading(true);
    try {
      await forceInstanceHint(instanceYearId, targetActionEggId);
      setFeedback({ type: 'success', message: 'Indice explicite révélé immédiatement pour tous les élèves.' });
      loadData(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la révélation.' });
    } finally {
      setActionLoading(false);
      setShowForceHintConfirm(false);
      setTargetActionEggId(null);
    }
  };

  const handleResetEgg = async () => {
    if (!targetResetEgg) return;
    setActionLoading(true);
    try {
      await resetAdminEggProgress({
        easterEggIds: [targetResetEgg.id],
        instanceYearId,
      });
      setFeedback({
        type: 'success',
        message: `Progression de "${targetResetEgg.title}" réinitialisée avec succès.`,
      });
      loadData(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la réinitialisation.' });
    } finally {
      setActionLoading(false);
      setShowResetConfirm(false);
      setTargetResetEgg(null);
    }
  };

  // Cycles filtrés
  const filteredCycles = useMemo(() => {
    if (!data?.cycles) return [];
    return data.cycles.filter((cycle) => {
      // 1. Filtre par cycle
      if (selectedCycleFilter === 'CURRENT' && !cycle.isCurrent) return false;
      if (typeof selectedCycleFilter === 'number' && cycle.cycleIndex !== selectedCycleFilter) return false;

      // 2. Filtre par texte d'œuf
      if (searchEggText.trim()) {
        const query = searchEggText.toLowerCase().trim();
        const matchesEgg = cycle.eggs.some(
          (e) => e.title.toLowerCase().includes(query) || e.code.toLowerCase().includes(query),
        );
        if (!matchesEgg) return false;
      }

      // 3. Filtre par équipe
      if (selectedTeamId !== 'ALL') {
        const teamHasStatus = cycle.teamStatuses.some((ts) => ts.teamId === selectedTeamId);
        if (!teamHasStatus) return false;
      }

      return true;
    });
  }, [data, selectedCycleFilter, searchEggText, selectedTeamId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] gap-3">
        <RefreshCw className="animate-spin text-emerald-500" size={36} />
        <span className="text-xs font-bold text-slate-500">Chargement de la Chrono-Frise de la saison...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <GlassCard className="p-8 text-center bg-white/95 rounded-3xl border border-rose-200/80 shadow-md max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
          <AlertTriangle size={24} />
        </div>
        <h4 className="text-base font-bold text-slate-800">Erreur de chargement</h4>
        <p className="text-xs text-slate-500">{error || 'Données introuvables'}</p>
        <button
          type="button"
          onClick={() => loadData()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer"
        >
          Réessayer
        </button>
      </GlassCard>
    );
  }

  const allCyclesCount = data.cycles.length;
  const isAllExpanded = expandedCycles.size === allCyclesCount && allCyclesCount > 0;

  return (
    <div className="space-y-2 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Feedback Banner */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-bold hover:underline cursor-pointer"
          >
            Fermer
          </button>
        </motion.div>
      )}

      {/* Barre d'outils et Filtres unifiés ultra-compacts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-white/95 backdrop-blur-xl py-1 px-2.5 sm:px-3 rounded-xl border border-slate-200/80 shadow-2xs">
        {/* Titre & Fréquence */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
            <Clock size={13} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-black text-slate-800 tracking-tight">
              Chrono-Frise
            </h2>
            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              1 œuf / {data.frequency} pér.
            </span>
            <span className="text-[10px] text-slate-400 hidden md:inline">• {allCyclesCount} cycles</span>
          </div>
        </div>

        {/* Bloc Filtres */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Filtre Équipe */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-xs">
            <Filter size={10} className="text-slate-400" />
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="bg-transparent border-none text-[10.5px] font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">Toutes les équipes ({data.teams.length})</option>
              {data.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Cycle */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-xs">
            <Calendar size={10} className="text-slate-400" />
            <select
              value={selectedCycleFilter}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL' || val === 'CURRENT') {
                  setSelectedCycleFilter(val);
                } else {
                  setSelectedCycleFilter(Number(val));
                }
              }}
              className="bg-transparent border-none text-[10.5px] font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">Tous les cycles ({data.cycles.length})</option>
              <option value="CURRENT">Cycle en cours</option>
              {data.cycles.map((c) => (
                <option key={c.cycleIndex} value={c.cycleIndex}>
                  Cycle {c.cycleIndex} {c.isCurrent ? '• Actif' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par nom d'énigme */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-xs">
            <Search size={10} className="text-slate-400" />
            <input
              type="text"
              placeholder="Chercher..."
              value={searchEggText}
              onChange={(e) => setSearchEggText(e.target.value)}
              className="bg-transparent border-none text-[10.5px] text-slate-700 placeholder:text-slate-400 outline-none w-24"
            />
          </div>

          {/* Bouton Tout Déplier / Replier */}
          <IconButtonWithTooltip
            tooltip={isAllExpanded ? 'Tout replier' : 'Tout déplier'}
            onClick={toggleAllCycles}
            variant="default"
            size="xs"
          >
            <ChevronsUpDown size={11} className="text-slate-600" />
          </IconButtonWithTooltip>

          {/* Bouton Actualiser */}
          <IconButtonWithTooltip
            tooltip="Actualiser la Chrono-Frise"
            onClick={() => loadData(true)}
            variant="default"
            size="xs"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin text-emerald-600' : 'text-slate-600'} />
          </IconButtonWithTooltip>
        </div>
      </div>

      {/* Liste des Cycles (Tableau unifié élégant et lisible) */}
      <GlassCard className="p-0 overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100">
        {filteredCycles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Aucun cycle ou énigme ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          filteredCycles.map((cycle) => {
            const isExpanded = expandedCycles.has(cycle.cycleIndex);
            const totalEggs = cycle.eggs.length;

            return (
              <div
                key={cycle.cycleIndex}
                ref={cycle.isCurrent ? currentCycleRef : null}
                className={`transition-colors duration-150 ${
                  cycle.isCurrent ? 'bg-amber-50/30' : 'bg-transparent'
                }`}
              >
                {/* Ligne Maîtresse Équilibrée */}
                <div
                  onClick={() => toggleCycle(cycle.cycleIndex)}
                  className={`flex items-center justify-between gap-3 py-2.5 px-3 sm:px-4 cursor-pointer select-none transition-colors min-h-[44px] ${
                    cycle.isCurrent ? 'bg-amber-50/50 hover:bg-amber-50/80' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* 1. Gauche : Identité Cycle & Périodes */}
                  <div className="flex items-center gap-2.5 shrink-0 min-w-[210px]">
                    <div
                      className={`w-6 h-6 rounded-lg text-[10px] font-black shrink-0 flex items-center justify-center ${
                        cycle.isCurrent
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs'
                          : cycle.isPast
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}
                    >
                      C{cycle.cycleIndex}
                    </div>

                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs sm:text-sm font-black text-slate-800">
                        Cycle {cycle.cycleIndex}
                      </span>
                      {cycle.isCurrent ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-white animate-pulse">
                          En cours
                        </span>
                      ) : cycle.isPast ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">
                          Passé
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-400">
                          À venir
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-medium">
                        ({cycle.periodStart?.name || 'P'} → {cycle.periodEnd?.name || 'P'})
                      </span>
                    </div>
                  </div>

                  {/* 2. Centre : Aperçu des Œufs & Glyphes (Doré si résolu, Grisé si non résolu) */}
                  <div className="flex items-center gap-1.5 shrink-0 px-2">
                    {cycle.eggs.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">
                        {cycle.isPast ? 'Aucun œuf résolu (reporté au cycle courant)' : 'Aucun œuf programmé'}
                      </span>
                    ) : (
                      cycle.eggs.map((egg) => {
                        const isEggResolved = egg.isResolvedByAtLeastOneTeam;
                        const originLabel =
                          egg.originType === 'MANUAL_ADD'
                            ? 'Ajout AM'
                            : egg.originType === 'ROLLOVER'
                            ? `Reporté du Cycle ${egg.originCycleIndex || '?'}`
                            : 'Natif';

                        return (
                          <div
                            key={egg.id}
                            className="relative group shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <EggGlyphIcon
                              periodIndex={cycle.cycleIndex}
                              easterEggId={egg.id}
                              size="xs"
                              isResolved={isEggResolved}
                              title={`${egg.title} (${originLabel}) • ${isEggResolved ? 'Résolu par ' + egg.resolvedTeams.length + ' équipe(s)' : 'Non résolu'}`}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* 3. Droite : Équipes ayant résolu */}
                  <div className="flex-1 flex items-center justify-end gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap pl-2">
                    {cycle.cycleResolvedTeams.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">
                        {cycle.isCurrent ? 'En recherche...' : cycle.eggs.length === 0 ? '' : 'Aucune résolution sur ce cycle'}
                      </span>
                    ) : (
                      cycle.cycleResolvedTeams.map((team) => (
                        <div
                          key={team.teamId}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs shrink-0"
                          title={`L'équipe ${team.teamName} a résolu un œuf sur ce cycle`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: team.teamColor || '#10b981' }}
                          />
                          <span className="truncate max-w-[100px]">{team.teamName}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 4. Extrême droite : Total eggs & Chevron */}
                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                      {totalEggs} œuf{totalEggs > 1 ? 's' : ''}
                    </span>

                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown size={14} />
                    </motion.div>
                  </div>
                </div>

                {/* Tiroir Déplié (Mode Détail Oeuf par Oeuf) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: 'easeInOut' }}
                      className="border-t border-slate-100 bg-slate-50/70 p-3 sm:px-4 space-y-2"
                    >
                      {cycle.eggs.length === 0 ? (
                        <div className="py-2.5 px-3 rounded-xl bg-white/80 border border-slate-200/60 text-xs text-slate-500 italic text-center">
                          Aucun œuf n'a été résolu durant ce cycle. L'énigme a été automatiquement reportée au cycle courant.
                        </div>
                      ) : (
                        cycle.eggs.map((egg) => {
                          const isResolved = egg.isResolvedByAtLeastOneTeam;
                          const hasWinner = egg.resolvedTeams.length > 0;
                          const partialTeams = egg.pendingTeams.filter((pt) => pt.discoverersCount > 0);

                          return (
                            <div
                              key={egg.id}
                              className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 py-2 px-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs"
                            >
                              {/* Identité Œuf & Provenance */}
                              <div className="flex items-start gap-3 min-w-[240px] shrink-0">
                                <div className="mt-0.5 shrink-0">
                                  <EggGlyphIcon
                                    periodIndex={cycle.cycleIndex}
                                    easterEggId={egg.id}
                                    size="sm"
                                    isResolved={isResolved}
                                  />
                                </div>
                                <div className="overflow-hidden">
                                  <div className="flex items-center gap-1.5 flex-wrap min-h-[24px]">
                                    <span className="font-bold text-slate-800 truncate max-w-[200px] text-xs sm:text-sm">
                                      {egg.title}
                                    </span>
                                    {egg.originType === 'MANUAL_ADD' && (
                                      <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">
                                        Ajout AM
                                      </span>
                                    )}
                                    {egg.originType === 'ROLLOVER' && (
                                      <span
                                        className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-amber-500 text-white shadow-2xs"
                                        title={`Œuf reporté du Cycle ${egg.originCycleIndex}`}
                                      >
                                        C{egg.originCycleIndex}
                                      </span>
                                    )}
                                    {egg.originType === 'NATURAL' && (
                                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                        Natif
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                    <span>{egg.code}</span>
                                    <span>•</span>
                                    <span className="text-emerald-600 font-bold font-sans">
                                      +{egg.rewardPointsIT} IT
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Équipes Lauréates & En cours */}
                              <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap min-h-[24px]">
                                {!hasWinner && (!egg.previouslyResolvedTeams || egg.previouslyResolvedTeams.length === 0) && partialTeams.length === 0 ? (
                                  <span className="text-xs text-slate-400 italic">
                                    {cycle.isCurrent ? '🔍 Aucun détective pour le moment' : '⏳ Non résolu durant ce cycle'}
                                  </span>
                                ) : (
                                  <>
                                    {/* 0. Équipes ayant déjà validé cet œuf sur un cycle antérieur */}
                                    {egg.previouslyResolvedTeams &&
                                      egg.previouslyResolvedTeams
                                        .filter((prt) => selectedTeamId === 'ALL' || prt.teamId === selectedTeamId)
                                        .map((prt) => (
                                          <div
                                            key={`prev-${prt.teamId}`}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs font-medium text-emerald-900 shadow-2xs shrink-0"
                                            title={`Résolu précédemment au Cycle ${prt.solvedCycleIndex || '?'}`}
                                          >
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-600 text-white shadow-2xs">
                                              C{prt.solvedCycleIndex || '?'}
                                            </span>
                                            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                                              <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: prt.teamColor || '#10b981' }}
                                              />
                                              <span>{prt.teamName}</span>
                                            </div>
                                            <span className="text-[10px] text-emerald-700 font-semibold">
                                              (Validé au C{prt.solvedCycleIndex || '?'})
                                            </span>
                                          </div>
                                        ))}

                                    {/* 1. Équipes ayant remporté la récompense durant ce cycle */}
                                    {egg.resolvedTeams
                                      .filter((rt) => selectedTeamId === 'ALL' || rt.teamId === selectedTeamId)
                                      .map((rt) => {
                                        const rankBadge =
                                          rt.rank === 1
                                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                                            : rt.rank === 2
                                            ? 'bg-slate-200 text-slate-800 border-slate-300'
                                            : rt.rank === 3
                                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                                            : 'bg-slate-100 text-slate-700 border-slate-200';

                                        const solvedDateStr = rt.solvedAt
                                          ? `${new Date(rt.solvedAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} ${new Date(rt.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                          : '';

                                        return (
                                          <div
                                            key={rt.teamId}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-medium shadow-2xs shrink-0"
                                            title={`${rt.teamName} : #${rt.rank || 1} • Validé le ${solvedDateStr} (+${rt.awardedPointsIT || egg.rewardPointsIT} IT) • ${rt.discoverersCount}/${rt.requiredPlayers || rt.totalPlayers} membres`}
                                          >
                                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black border ${rankBadge}`}>
                                              #{rt.rank || 1}
                                            </span>
                                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                              <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: rt.teamColor || '#10b981' }}
                                              />
                                              <span>{rt.teamName}</span>
                                            </div>
                                            {solvedDateStr && (
                                              <span className="text-[10px] text-slate-400 font-normal">
                                                {solvedDateStr}
                                              </span>
                                            )}
                                            <span className="font-mono font-black text-emerald-600 text-[10px]">
                                              +{rt.awardedPointsIT || egg.rewardPointsIT} IT
                                            </span>
                                          </div>
                                        );
                                      })}

                                    {/* 2. Équipes en cours avec progression partielle */}
                                    {partialTeams
                                      .filter((pt) => selectedTeamId === 'ALL' || pt.teamId === selectedTeamId)
                                      .map((pt) => (
                                        <div
                                          key={`pending-${pt.teamId}`}
                                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs font-semibold text-amber-900 shadow-2xs shrink-0"
                                          title={`Progression en cours : ${pt.discoverersCount}/${pt.requiredPlayers || 2} joueurs requis`}
                                        >
                                          <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: pt.teamColor || '#10b981' }}
                                          />
                                          <span>{pt.teamName}</span>
                                          <span className="text-[10px] text-amber-700 font-bold bg-amber-100/90 px-1.5 py-0.2 rounded">
                                            {pt.discoverersCount}/{pt.requiredPlayers || 2} joueurs
                                          </span>
                                        </div>
                                      ))}
                                  </>
                                )}
                              </div>

                              {/* Actions administratives */}
                              <div className="flex items-center gap-1 shrink-0 min-h-[24px]">
                                <IconButtonWithTooltip
                                  tooltip={egg.forceHint ? 'Indice déjà révélé' : 'Révéler le 2ème indice'}
                                  variant="amber"
                                  size="sm"
                                  disabled={egg.forceHint || actionLoading}
                                  onClick={() => {
                                    setTargetActionEggId(egg.id);
                                    setShowForceHintConfirm(true);
                                  }}
                                >
                                  <Lightbulb size={13} />
                                </IconButtonWithTooltip>

                                <IconButtonWithTooltip
                                  tooltip="Réinitialiser la progression"
                                  variant="amber"
                                  size="sm"
                                  disabled={actionLoading}
                                  onClick={() => {
                                    setTargetResetEgg({ id: egg.id, title: egg.title });
                                    setShowResetConfirm(true);
                                  }}
                                >
                                  <History size={13} />
                                </IconButtonWithTooltip>

                                <IconButtonWithTooltip
                                  tooltip="Clôturer cet œuf"
                                  variant="danger"
                                  size="sm"
                                  disabled={actionLoading}
                                  onClick={() => {
                                    setTargetActionEggId(egg.id);
                                    setShowCloseConfirm(true);
                                  }}
                                >
                                  <Lock size={13} />
                                </IconButtonWithTooltip>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </GlassCard>

      {/* Confirmations Modales */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleCloseEgg}
        title="Clôturer cet Easter Egg ?"
        description="Voulez-vous clôturer immédiatement cet Easter Egg pour cette période ? Les élèves ne pourront plus le découvrir."
        confirmLabel="Clôturer"
        cancelLabel="Annuler"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showForceHintConfirm}
        onClose={() => setShowForceHintConfirm(false)}
        onConfirm={handleForceHint}
        title="Révéler l’indice immédiatement ?"
        description="Le minuteur sera court-circuité : tous les élèves de l'établissement verront immédiatement le 2ème indice explicite dans la mascotte."
        confirmLabel="Révéler l’indice"
        cancelLabel="Annuler"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => {
          setShowResetConfirm(false);
          setTargetResetEgg(null);
        }}
        onConfirm={handleResetEgg}
        title="Réinitialiser cette énigme ?"
        description={`Voulez-vous réinitialiser la progression de "${targetResetEgg?.title}" pour cette promotion ? Toutes les découvertes et points associés seront effacés.`}
        confirmLabel="Réinitialiser"
        cancelLabel="Annuler"
        variant="warning"
      />
    </div>
  );
}
