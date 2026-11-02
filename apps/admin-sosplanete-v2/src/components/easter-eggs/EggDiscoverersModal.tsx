'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock, Award, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { getAssetUrl, resolvePlayerAvatar } from '@/utils/assets';
import { IconButtonWithTooltip } from '@/components/ui/IconButtonWithTooltip';
import { EggDiscoverer, EggTeamCompleted, DiscoveryLogItem } from '@/utils/easterEggApi';

interface EggDiscoverersModalProps {
  isOpen: boolean;
  onClose: () => void;
  egg: {
    eggId: number;
    code: string;
    title: string;
    rewardPointsIT: number;
    discoverers?: EggDiscoverer[];
    teamsCompleted?: EggTeamCompleted[];
  } | null;
  individualDiscoveries?: DiscoveryLogItem[];
  requiredPlayersPerTeam?: number;
}

function resolveTeamLogo(icon: string | null | undefined): string | null {
  if (!icon) return null;
  const filename = icon.split('/').pop();
  if (!filename) return null;
  return getAssetUrl(`teams/${filename}`);
}

function formatTime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m} min ${s} s`;
  return `${s} s`;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const dateStr = d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
  const timeStr = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr} à ${timeStr}`;
}

export const EggDiscoverersModal: React.FC<EggDiscoverersModalProps> = ({
  isOpen,
  onClose,
  egg,
  individualDiscoveries = [],
  requiredPlayersPerTeam = 2,
}) => {
  if (!isOpen || !egg) return null;

  const discoverers = egg.discoverers || [];
  const discoverersCount = discoverers.length;

  // Grouper par équipe
  const groupedByTeam = Object.values(
    discoverers.reduce((acc, d) => {
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
      acc[key].players.push(d);
      return acc;
    }, {} as Record<string | number, { teamId?: number; teamName: string; teamColor: string; teamIcon?: string | null; players: EggDiscoverer[] }>)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-white border-b border-purple-100 flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black text-slate-800 tracking-tight truncate">
                  {egg.title}
                </h3>
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0">
                  +{egg.rewardPointsIT} IT
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-purple-600" />
                  <strong>{discoverersCount}</strong> joueur{discoverersCount > 1 ? 's' : ''} déclencheur{discoverersCount > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <strong>{egg.teamsCompleted?.length || 0}</strong> équipe{egg.teamsCompleted && egg.teamsCompleted.length > 1 ? 's' : ''} validée{egg.teamsCompleted && egg.teamsCompleted.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <IconButtonWithTooltip
              tooltip="Fermer (Échap)"
              tooltipPosition="left"
              variant="default"
              size="md"
              onClick={onClose}
            >
              <X size={18} className="text-slate-600" />
            </IconButtonWithTooltip>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {discoverersCount === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Users size={40} className="mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-semibold">Aucun joueur n’a encore découvert cette énigme.</p>
                <p className="text-xs text-slate-400">
                  Dès qu’un joueur résout ou déclenche l’énigme, son nom et son temps de résolution apparaîtront ici.
                </p>
              </div>
            ) : (
              groupedByTeam.map((teamGroup, tIdx) => {
                const teamCompleted = egg.teamsCompleted?.find((tc) => tc.teamId === teamGroup.teamId);
                const isTeamValidated = !!teamCompleted;
                const playersCount = teamGroup.players.length;

                return (
                  <div
                    key={tIdx}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3"
                  >
                    {/* En-tête équipe */}
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        {teamGroup.teamIcon ? (
                          <img
                            src={resolveTeamLogo(teamGroup.teamIcon)!}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: teamGroup.teamColor || '#10b981' }}
                          />
                        )}
                        <span className="font-black text-sm text-slate-800">
                          {teamGroup.teamName}
                        </span>
                      </div>

                      {/* Statut équipe */}
                      {isTeamValidated ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Validé</span>
                          <span className="font-mono font-black text-emerald-900">
                            +{teamCompleted.awardedPointsIT} IT
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200/70 text-slate-700">
                          <Clock size={12} className="text-slate-500" />
                          <span>{playersCount} / {requiredPlayersPerTeam} joueur{requiredPlayersPerTeam > 1 ? 's' : ''}</span>
                        </span>
                      )}
                    </div>

                    {/* Liste des joueurs de cette équipe */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {teamGroup.players.map((player) => {
                        // Trouver log de résolution si disponible
                        const log = individualDiscoveries.find(
                          (l) =>
                            l.childId === player.childId &&
                            (l.easterEggId === egg.eggId || l.easterEggCode === egg.code)
                        );
                        const resolutionSec = log?.resolutionTimeSeconds;

                        return (
                          <div
                            key={player.childId}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow"
                          >
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 relative overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-600">
                              <span>{player.pseudo.slice(0, 2).toUpperCase()}</span>
                              <img
                                src={resolvePlayerAvatar(player.avatar, player.pseudo, player.gender)}
                                alt={player.pseudo}
                                className="w-full h-full object-cover absolute inset-0 z-10"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>

                            {/* Info joueur */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-800 truncate">
                                  @{player.pseudo}
                                </span>
                                {resolutionSec && resolutionSec > 0 && (
                                  <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 shrink-0">
                                    {formatTime(resolutionSec)}
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                <Clock size={12} className="shrink-0 text-slate-400" />
                                <span>{formatDateTime(player.discoveredAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
