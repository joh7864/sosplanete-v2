import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Unlock,
  KeyRound,
  Share2,
  Users,
  Eye,
  CheckCircle2,
  HelpCircle,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react';
import type { ActiveEasterEggResponse } from '../../types/easterEgg';

interface EasterEggModalProps {
  isOpen: boolean;
  onClose: () => void;
  eggData: ActiveEasterEggResponse | null;
  onVerifyAnswer: (answer: string) => Promise<any>;
  onShare: (
    targetType: 'TEAM' | 'PLAYER' | 'ALL',
    shareType: 'CLUE' | 'SOLUTION',
    customText?: string,
    targetPlayerId?: number,
  ) => Promise<any>;
  players?: any[];
}

export const EasterEggModal: React.FC<EasterEggModalProps> = ({
  isOpen,
  onClose,
  eggData,
  onVerifyAnswer,
  onShare,
  players = [],
}) => {
  const [answerInput, setAnswerInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Indices dévoilés
  const [revealedClues, setRevealedClues] = useState<number[]>([0]);

  // Partage
  const [shareTarget, setShareTarget] = useState<'TEAM' | 'PLAYER' | 'ALL'>('TEAM');
  const [targetPlayerId, setTargetPlayerId] = useState<number | ''>('');
  const [shareType, setShareType] = useState<'CLUE' | 'SOLUTION'>('CLUE');
  const [shareSent, setShareSent] = useState(false);

  // Zoom image
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  if (!isOpen || !eggData?.easterEgg) return null;

  const egg = eggData.easterEgg;
  const isDiscovered = eggData.playerProgress?.isDiscovered;
  const teamProg = eggData.teamProgress;
  const isAnswerInput = egg.triggerType === 'RIDDLE_ANSWER_INPUT';

  const handleRevealClue = (index: number) => {
    if (!revealedClues.includes(index)) {
      setRevealedClues([...revealedClues, index]);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || isVerifying) return;

    setIsVerifying(true);
    setVerificationFeedback(null);

    const res = await onVerifyAnswer(answerInput.trim());
    setIsVerifying(false);

    if (res?.success) {
      setVerificationFeedback({
        success: true,
        message: res.message || 'Bravo ! Cadenas temporel déverrouillé !',
      });
      setAnswerInput('');
    } else {
      setVerificationFeedback({
        success: false,
        message: res?.message || 'Combinaison incorrecte. Analysez les indices.',
      });
    }
  };

  const handleSendShare = async () => {
    const res = await onShare(
      shareTarget,
      shareType,
      undefined,
      targetPlayerId ? +targetPlayerId : undefined,
    );
    if (res?.success) {
      setShareSent(true);
      setTimeout(() => setShareSent(false), 3000);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[600] flex items-center justify-center p-4"
        style={{
          backgroundColor: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(12px)',
        }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-slate-950/95 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{
            boxShadow: '0 0 40px rgba(56, 189, 248, 0.18)',
          }}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="relative border-b border-cyan-500/20 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-950">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded">
                    Transmission 2070
                  </span>
                  <span className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                    +{egg.rewardPointsIT} IT
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-100 mt-0.5 flex items-center gap-2">
                  {egg.title}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Lore Narratif 2070 */}
            <div className="relative rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 font-mono text-xs leading-relaxed text-cyan-200">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1.5 uppercase tracking-wider">
                <ShieldCheck size={14} /> Message des Humains de l’Arche (2070) :
              </div>
              <p className="italic text-slate-300">"{egg.senderLore}"</p>
            </div>

            {/* Image / Infographie Visuelle */}
            {egg.imageUrl && (
              <div className="relative rounded-xl border border-slate-700/60 bg-slate-900/60 p-2 overflow-hidden flex flex-col items-center">
                <img
                  src={egg.imageUrl}
                  alt="Schéma énigme 2070"
                  className="max-h-56 w-auto rounded-lg object-contain cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setIsImageZoomed(!isImageZoomed)}
                />
                <button
                  type="button"
                  onClick={() => setIsImageZoomed(!isImageZoomed)}
                  className="mt-2 text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Eye size={12} /> {isImageZoomed ? 'Réduire' : 'Agrandir le schéma'}
                </button>
              </div>
            )}

            {/* Saisie de Réponse / Cadenas à 4 Chiffres */}
            {isAnswerInput && !isDiscovered && (
              <form
                onSubmit={handleSubmitAnswer}
                className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900/40 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound size={15} /> Saisie du Code Cadenas (4 Chiffres) :
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Testez votre déduction
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Ex: 4207"
                    maxLength={10}
                    className="flex-1 rounded-lg border border-amber-500/40 bg-slate-950 px-4 py-2.5 font-mono text-base font-bold text-amber-300 placeholder-slate-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying || !answerInput.trim()}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 font-semibold text-slate-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all font-mono shadow-md"
                  >
                    {isVerifying ? (
                      'Analyse...'
                    ) : (
                      <>
                        <Unlock size={16} /> Déverrouiller
                      </>
                    )}
                  </button>
                </div>

                {verificationFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg p-2.5 text-xs font-mono ${
                      verificationFeedback.success
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {verificationFeedback.message}
                  </motion.div>
                )}
              </form>
            )}

            {/* Statut de découverte de l'agent */}
            {isDiscovered && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 flex items-center justify-between text-emerald-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/50">
                    <CheckCircle2 size={22} className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">
                      Anomalie Résolue par vous !
                    </h4>
                    <p className="text-xs text-emerald-400 font-mono">
                      Vous avez percé le secret de cette transmission 2070.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progression de l'Équipe */}
            {teamProg && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Objectif Équipe ({teamProg.teamName})
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {teamProg.discoveredCount} / {teamProg.requiredPlayers} joueurs requis
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5">
                  <motion.div
                    className={`h-full rounded-full ${
                      teamProg.isTeamRewarded
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_10px_#fbbf24]'
                        : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        100,
                        (teamProg.discoveredCount / teamProg.requiredPlayers) * 100,
                      )}%`,
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>

                {/* Statut Récompense */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>
                    Effectif total équipe : {teamProg.totalPlayers} agents
                  </span>
                  {teamProg.isTeamRewarded ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      🏆 Récompense validée (+{teamProg.awardedPointsIT} IT)
                    </span>
                  ) : (
                    <span className="text-cyan-400">
                      Encore {Math.max(0, teamProg.requiredPlayers - teamProg.discoveredCount)} découverte(s) pour propulser le vaisseau
                    </span>
                  )}
                </div>

                {/* Liste des découvreurs de l'équipe */}
                {teamProg.discoveredPlayers?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Détectives de l’escouade :
                    </span>
                    {teamProg.discoveredPlayers.map((p) => (
                      <span
                        key={p.childId}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 font-mono"
                      >
                        ✓ @{p.pseudo}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Indices Débloquables */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <HelpCircle size={15} className="text-amber-400" />
                Indices Détectés ({revealedClues.length} / {egg.clues?.length || 1}) :
              </div>

              <div className="space-y-2">
                {(egg.clues || []).map((clue, idx) => {
                  const isRevealed = revealedClues.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3.5 transition-all text-xs font-mono leading-relaxed ${
                        isRevealed
                          ? 'border-slate-700 bg-slate-900/60 text-slate-200'
                          : 'border-slate-800/80 bg-slate-950/40 text-slate-500'
                      }`}
                    >
                      {isRevealed ? (
                        <div>
                          <span className="font-bold text-cyan-400 mr-2">
                            [Indice #{idx + 1}]
                          </span>
                          {clue}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>[Indice #{idx + 1}] — Données chiffrées</span>
                          <button
                            type="button"
                            onClick={() => handleRevealClue(idx)}
                            className="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-slate-700 transition-colors"
                          >
                            Décrypter
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Partage Post-Découverte */}
            {isDiscovered && (
              <div className="rounded-xl border border-cyan-500/20 bg-slate-900/80 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  <Share2 size={15} /> Partager un indice ou le code dans le Comm-Link :
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Destinataire :
                    </label>
                    <select
                      value={shareTarget}
                      onChange={(e) => setShareTarget(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono text-xs focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="TEAM">Mon Équipe (Par défaut)</option>
                      <option value="ALL">Tous les Joueurs (Canal Global)</option>
                      <option value="PLAYER">Un Joueur Spécifique</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Contenu de la transmission :
                    </label>
                    <select
                      value={shareType}
                      onChange={(e) => setShareType(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono text-xs focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="CLUE">Indice Cryptique</option>
                      <option value="SOLUTION">Solution / Code déverrouillé</option>
                    </select>
                  </div>
                </div>

                {shareTarget === 'PLAYER' && (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Sélectionnez l'agent :
                    </label>
                    <select
                      value={targetPlayerId}
                      onChange={(e) => setTargetPlayerId(e.target.value ? +e.target.value : '')}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono text-xs focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="">-- Choisir un agent --</option>
                      {players.map((p) => (
                        <option key={p.id || p.childId} value={p.childId || p.id}>
                          @{p.pseudo} ({p.teamName || 'Équipe'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {shareSent ? '✓ Transmission envoyée au Comm-Link !' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleSendShare}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-500 transition-colors font-mono"
                  >
                    <Send size={14} /> Envoyer la Transmission
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800 px-6 py-3 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={12} /> Cycle en cours : Période #{eggData.period?.periodIndex}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Fermer le Terminal
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
