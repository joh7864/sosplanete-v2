import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, CheckCircle2, AlertTriangle, Loader2, KeyRound } from 'lucide-react';

interface TemporalTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onSuccessUnlock: () => void;
  onSubmitCode: (code: string) => Promise<{ success: boolean; message: string }>;
}

export const TemporalTerminalModal: React.FC<TemporalTerminalModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onSuccessUnlock,
  onSubmitCode,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res = await onSubmitCode(code.trim().toUpperCase());
      setFeedback(res);
      if (res.success) {
        onSuccessUnlock();
      }
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.message || 'Erreur lors de la validation du code temporel.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCharClick = (char: string) => {
    if (code.length < 15) {
      setCode((prev) => (prev + char).toUpperCase());
    }
  };

  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  const KEYBOARD_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 20000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '92vh',
            background: 'linear-gradient(175deg, rgba(15, 23, 42, 0.98) 0%, rgba(6, 12, 24, 0.99) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.45)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 45px rgba(16, 185, 129, 0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: '#f1f5f9',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(6, 78, 59, 0.3), rgba(15, 23, 42, 0.95))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6ee7b7',
                }}
              >
                <Terminal size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.03em', margin: 0 }}>
                    Terminal de Décryptage
                  </h2>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#6ee7b7',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    Console Oméga
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Saisie manuelle du mot de passe secret de l'Arche
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxSizing: 'border-box',
            }}
          >
            {isUnlocked ? (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1.5px solid rgba(16, 185, 129, 0.35)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    color: '#6ee7b7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={30} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#6ee7b7', margin: 0 }}>
                  Protocole Oméga Autorisé !
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                  L'Arche a validé votre accréditation. La fonctionnalité <strong>Vision 2050 (Avant / Après)</strong> est définitivement accessible depuis vos cartes de missions pour explorer l'impact futur de vos actions.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#cbd5e1' }}>
                    Code Secret Décrypté (Saisie Manuelle Obligatoire)
                  </label>
                  <div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="TAPEZ LE MOT DE PASSE..."
                      autoFocus
                      disabled={loading}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(3, 7, 18, 0.85)',
                        border: '1.5px solid rgba(16, 185, 129, 0.45)',
                        color: '#6ee7b7',
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: '1.2rem',
                        textAlign: 'center',
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
                      }}
                    />
                  </div>
                </div>

                {/* Clavier Virtuel Cybernétique (pour confort tactile/clic) */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(3, 7, 18, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>
                    Pavé d'Alphabet Temporel
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
                    {KEYBOARD_LETTERS.map((char) => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleCharClick(char)}
                        style={{
                          width: '32px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(30, 41, 59, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#f1f5f9',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.3)';
                          e.currentTarget.style.borderColor = '#10b981';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                      >
                        {char}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleBackspace}
                      style={{
                        padding: '0 12px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(244, 63, 94, 0.2)',
                        border: '1px solid rgba(244, 63, 94, 0.35)',
                        color: '#fda4af',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      Effacer
                    </button>
                  </div>
                </div>

                {/* Feedback message */}
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: feedback.success ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(244, 63, 94, 0.4)',
                      backgroundColor: feedback.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: feedback.success ? '#6ee7b7' : '#fda4af',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    {feedback.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{feedback.message}</span>
                  </motion.div>
                )}

                {/* Bouton de validation */}
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    backgroundColor: loading || !code.trim() ? 'rgba(16, 185, 129, 0.4)' : '#059669',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    boxShadow: '0 0 20px rgba(5, 150, 105, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Vérification Quantique...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={18} />
                      <span>Transmettre le Code à l'Arche</span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
