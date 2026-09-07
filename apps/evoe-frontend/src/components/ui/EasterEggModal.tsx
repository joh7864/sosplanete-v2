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
  Radio,
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
      setTimeout(() => setShareSent(false), 3500);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 18, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 99999,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(175deg, rgba(8, 16, 32, 0.98) 0%, rgba(3, 8, 18, 0.99) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            borderRadius: '24px',
            boxShadow: '0 30px 100px rgba(0, 0, 0, 0.95), 0 0 50px rgba(0, 240, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            color: '#e2e8f0',
            overflow: 'hidden',
          }}
        >
          {/* Ligne néon lumineuse supérieure */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00f0ff, transparent)',
              boxShadow: '0 0 18px #00f0ff',
              pointerEvents: 'none',
            }}
          />

          {/* ═════════════════════════════════════════════════════════════════════════
              1. EN-TÊTE PREMIUM AVEC OBJECTIF D'ÉQUIPE INTÉGRÉ
             ═════════════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              padding: '22px 26px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
              background: 'linear-gradient(180deg, rgba(0, 240, 255, 0.04) 0%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              {/* Titre & Hologramme */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '13px',
                    background: 'radial-gradient(circle, rgba(0, 240, 255, 0.2) 0%, rgba(6, 18, 38, 0.8) 100%)',
                    border: '1.5px solid rgba(0, 240, 255, 0.4)',
                    boxShadow: '0 0 18px rgba(0, 240, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00f0ff',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={22} />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px',
                        color: '#00f0ff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Radio size={10} style={{ animation: 'pulse 2s infinite' }} /> Transmission 2070
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        color: '#fbbf24',
                        background: 'rgba(251, 191, 36, 0.12)',
                        border: '1px solid rgba(251, 191, 36, 0.35)',
                        padding: '1px 7px',
                        borderRadius: '6px',
                      }}
                    >
                      +{egg.rewardPointsIT} IT
                    </span>
                    
                    {/* MINI-HUD PROGRESSION ÉQUIPE */}
                    {teamProg && (
                      <div
                        title={`Équipe ${teamProg.teamName} : ${teamProg.discoveredCount}/${teamProg.requiredPlayers} agents nécessaires`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: teamProg.isTeamRewarded ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 240, 255, 0.1)',
                          border: `1px solid ${teamProg.isTeamRewarded ? 'rgba(251, 191, 36, 0.3)' : 'rgba(0, 240, 255, 0.25)'}`,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.64rem',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: teamProg.isTeamRewarded ? '#fbbf24' : '#00f0ff',
                          marginLeft: '2px',
                        }}
                      >
                        <Users size={11} />
                        {teamProg.discoveredCount}/{teamProg.requiredPlayers}
                        {teamProg.isTeamRewarded && ' ✓'}
                      </div>
                    )}
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {egg.title}
                  </h2>
                </div>
              </div>

              {/* Bouton de Fermeture */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }}
              >
                <X size={17} />
              </button>
            </div>


          </div>

          {/* ═════════════════════════════════════════════════════════════════════════
              2. CORPS FLUIDE : LORE & INDICES SANS PANELS LOURDS
             ═════════════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 240, 255, 0.2) transparent',
            }}
          >
            {/* LORE NARRATIF (Design Épuré avec Accent Gauche Néon) */}
            <div
              style={{
                position: 'relative',
                paddingLeft: '18px',
                borderLeft: '3px solid #00f0ff',
                background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.05) 0%, transparent 100%)',
                paddingTop: '6px',
                paddingBottom: '6px',
                borderRadius: '0 8px 8px 0',
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  color: '#00f0ff',
                  marginBottom: '6px',
                }}
              >
                Message des Humains de l’Arche (2070)
              </div>
              <p
                style={{
                  margin: 0,
                  fontStyle: 'italic',
                  fontSize: '0.98rem',
                  lineHeight: '1.6',
                  color: '#e2e8f0',
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
              >
                "{egg.senderLore}"
              </p>
            </div>

            {/* SCHÉMA / IMAGE (Si présente) */}
            {egg.imageUrl && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '16px',
                  padding: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <img
                  src={egg.imageUrl}
                  alt="Schéma 2070"
                  style={{
                    maxHeight: isImageZoomed ? '400px' : '200px',
                    width: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => setIsImageZoomed(!isImageZoomed)}
                />
                <button
                  type="button"
                  onClick={() => setIsImageZoomed(!isImageZoomed)}
                  style={{
                    marginTop: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 600,
                  }}
                >
                  <Eye size={13} /> {isImageZoomed ? 'Réduire' : 'Agrandir le schéma'}
                </button>
              </div>
            )}

            {/* SAISIE DU CADENAS (Si énigme à code et non résolue) */}
            {isAnswerInput && !isDiscovered && (
              <form
                onSubmit={handleSubmitAnswer}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  paddingTop: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: '#fbbf24',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                    }}
                  >
                    <KeyRound size={15} /> Saisie du Code Cadenas :
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    4 CHIFFRES ATTENDUS
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Ex: 4207"
                    maxLength={10}
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1.5px solid rgba(251, 191, 36, 0.4)',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      fontFamily: 'monospace',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      letterSpacing: '3px',
                      color: '#fbbf24',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#fbbf24';
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(251, 191, 36, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />

                  <button
                    type="submit"
                    disabled={isVerifying || !answerInput.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0 22px',
                      color: '#020617',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      cursor: isVerifying || !answerInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: isVerifying || !answerInput.trim() ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
                    }}
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
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      background: verificationFeedback.success
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${
                        verificationFeedback.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
                      }`,
                      color: verificationFeedback.success ? '#6ee7b7' : '#fca5a5',
                    }}
                  >
                    {verificationFeedback.message}
                  </motion.div>
                )}
              </form>
            )}

            {/* STATUT RÉSOLU PAR L'AGENT */}
            {isDiscovered && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  borderLeft: '3px solid #10b981',
                }}
              >
                <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                    Énigme Résolue par vous !
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#6ee7b7', fontFamily: 'monospace' }}>
                    Vous avez découvert et validé le secret de cette transmission.
                  </div>
                </div>
              </div>
            )}

            {/* LISTE DES DÉTECTIVES DE L'ÉQUIPE (Déplacé depuis l'en-tête pour épurer) */}
            {teamProg && teamProg.discoveredPlayers?.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(0, 240, 255, 0.03)',
                  border: '1px solid rgba(0, 240, 255, 0.1)',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginRight: '4px' }}>
                  <Users size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                  Détectives ({teamProg.discoveredCount}/{teamProg.requiredPlayers}) :
                </div>
                {teamProg.discoveredPlayers.map((p) => (
                  <span
                    key={p.childId}
                    style={{
                      fontSize: '0.68rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(0, 240, 255, 0.1)',
                      color: '#00f0ff',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                    }}
                  >
                    ✓ @{p.pseudo}
                  </span>
                ))}
              </div>
            )}

            {/* ── SECTION DES INDICES (LIGNES ÉPURÉES SANS GROS CADRES) ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <HelpCircle size={14} style={{ color: '#fbbf24' }} /> Indices Détectés ({revealedClues.length} / {egg.clues?.length || 1})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(egg.clues || []).map((clue, idx) => {
                  const isRevealed = revealedClues.includes(idx);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isRevealed ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.25)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '0.86rem',
                        lineHeight: '1.5',
                        fontFamily: 'monospace',
                        color: isRevealed ? '#e2e8f0' : 'rgba(255, 255, 255, 0.35)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '5px',
                          background: isRevealed ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          color: isRevealed ? '#00f0ff' : 'rgba(255, 255, 255, 0.4)',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        #{idx + 1}
                      </span>

                      <div style={{ flex: 1 }}>
                        {isRevealed ? (
                          clue
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontStyle: 'italic' }}>Données chiffrées…</span>
                            <button
                              type="button"
                              onClick={() => handleRevealClue(idx)}
                              style={{
                                background: 'rgba(0, 240, 255, 0.12)',
                                border: '1px solid rgba(0, 240, 255, 0.3)',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                color: '#00f0ff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#00f0ff';
                                e.currentTarget.style.color = '#020617';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.12)';
                                e.currentTarget.style.color = '#00f0ff';
                              }}
                            >
                              <Unlock size={11} /> Décrypter
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PARTAGE POST-RÉSOLUTION DANS LE COMM-LINK */}
            {isDiscovered && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(10, 20, 40, 0.5) 100%)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: '#00f0ff',
                  }}
                >
                  <Share2 size={14} /> Partager dans le Comm-Link :
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '4px' }}>
                      Destinataire :
                    </label>
                    <select
                      value={shareTarget}
                      onChange={(e) => setShareTarget(e.target.value as any)}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    >
                      <option value="TEAM" style={{ background: '#0a1020', color: '#fff' }}>Mon Équipe</option>
                      <option value="ALL" style={{ background: '#0a1020', color: '#fff' }}>Canal Global</option>
                      <option value="PLAYER" style={{ background: '#0a1020', color: '#fff' }}>Agent Spécifique</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '4px' }}>
                      Contenu :
                    </label>
                    <select
                      value={shareType}
                      onChange={(e) => setShareType(e.target.value as any)}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    >
                      <option value="CLUE" style={{ background: '#0a1020', color: '#fff' }}>Indice Cryptique</option>
                      <option value="SOLUTION" style={{ background: '#0a1020', color: '#fff' }}>Solution / Code Déverrouillé</option>
                    </select>
                  </div>
                </div>

                {shareTarget === 'PLAYER' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '4px' }}>
                      Agent Récepteur :
                    </label>
                    <select
                      value={targetPlayerId}
                      onChange={(e) => setTargetPlayerId(e.target.value ? +e.target.value : '')}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    >
                      <option value="" style={{ background: '#0a1020', color: '#fff' }}>-- Choisir un agent --</option>
                      {players.map((p) => (
                        <option key={p.id || p.childId} value={p.childId || p.id} style={{ background: '#0a1020', color: '#fff' }}>
                          @{p.pseudo} ({p.teamName || 'Équipe'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#10b981' }}>
                    {shareSent ? '✓ Transmission envoyée !' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleSendShare}
                    style={{
                      background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 16px',
                      color: '#020617',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Send size={13} /> Émettre
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════════════════════
              3. PIED DE PAGE ÉPURÉ
             ═════════════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 26px',
              background: 'rgba(2, 6, 18, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              color: 'rgba(255, 255, 255, 0.4)',
              flexShrink: 0,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} /> Cycle Période #{eggData.period?.periodIndex}
            </span>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '6px 14px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.74rem',
                fontWeight: 600,
                fontFamily: 'monospace',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }}
            >
              Fermer le Terminal
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
