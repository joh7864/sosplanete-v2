import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, AlertCircle, Terminal } from 'lucide-react';

export interface MascotInteractiveAreaProps {
  effectiveTriggerType?: string;
  digits: string[];
  inputRefs: React.RefObject<HTMLInputElement | null>[];
  handleDigitChange: (index: number, val: string) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  resetTimer: () => void;
  showErrorShake: boolean;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  handleSubmitAnswer: () => Promise<void> | void;
  isVerifying: boolean;
  commandInput: string;
  setCommandInput: (val: string) => void;
  handleCommandSubmit: () => Promise<void> | void;
  isVerifyingCommand: boolean;
}

export const MascotInteractiveArea: React.FC<MascotInteractiveAreaProps> = ({
  effectiveTriggerType,
  digits,
  inputRefs,
  handleDigitChange,
  handleKeyDown,
  resetTimer,
  showErrorShake,
  errorMessage,
  setErrorMessage,
  handleSubmitAnswer,
  isVerifying,
  commandInput,
  setCommandInput,
  handleCommandSubmit,
  isVerifyingCommand,
}) => {
  if (effectiveTriggerType === 'RIDDLE_ANSWER_INPUT') {
    /* Formulaire de saisie des 4 chiffres (Cadenas Cryptex conservé) */
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>
            <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
            CODE DU CADENAS (4 CHIFFRES)
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {digits.filter(Boolean).length}/4
          </span>
        </div>

        {/* Rangée des 4 cases de chiffres avec shake en cas d'erreur */}
        <motion.div
          animate={showErrorShake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '12px',
          }}
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onFocus={() => {
                resetTimer();
              }}
              style={{
                width: '46px',
                height: '52px',
                background: '#1e293b',
                border: `2px solid ${showErrorShake ? '#ef4444' : digit ? '#38bdf8' : '#475569'}`,
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 900,
                textAlign: 'center',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxShadow: digit ? '0 0 10px rgba(56, 189, 248, 0.3)' : 'none',
              }}
            />
          ))}
        </motion.div>

        {/* Message d'erreur */}
        {errorMessage && (
          <div
            style={{
              color: '#ef4444',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '10px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={14} />
            {errorMessage}
          </div>
        )}

        {/* Bouton Déverrouiller */}
        <button
          type="button"
          onClick={handleSubmitAnswer}
          disabled={isVerifying}
          style={{
            width: '100%',
            background: isVerifying
              ? '#475569'
              : 'linear-gradient(135deg, #0284c7, #0369a1)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: isVerifying ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isVerifying) e.currentTarget.style.filter = 'brightness(1.1)';
          }}
          onMouseLeave={(e) => {
            if (!isVerifying) e.currentTarget.style.filter = 'none';
          }}
        >
          <Unlock size={16} />
          {isVerifying ? 'Décodage temporel en cours...' : 'DÉVERROUILLER LE CADENAS'}
        </button>
      </div>
    );
  }

  /* Formulaire de saisie d'ordre / commande textuelle premium (COMM_LINK_COMMAND & KONAMI_CODE) */
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#38bdf8',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Terminal size={14} />
          COMMANDE OU MOT-CLÉ DIRECT
        </span>
        <span
          style={{
            fontSize: '0.70rem',
            color: '#38bdf8',
            background: 'rgba(56, 189, 248, 0.12)',
            padding: '2px 7px',
            borderRadius: '4px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            fontWeight: 700,
          }}
        >
          DIRECT PROTOCOL
        </span>
      </div>

      {/* Champ texte avec secousse en cas d'erreur */}
      <motion.div
        animate={showErrorShake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '12px' }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => {
              resetTimer();
              setErrorMessage(null);
              setCommandInput(e.target.value);
            }}
            onKeyDown={(e) => {
              resetTimer();
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCommandSubmit();
              }
            }}
            onFocus={() => {
              resetTimer();
            }}
            placeholder="Saisissez votre commande ou mot-clé (ex: /matrix)..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#1e293b',
              border: `2px solid ${showErrorShake ? '#ef4444' : commandInput ? '#38bdf8' : '#475569'}`,
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 600,
              padding: '10px 14px',
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              boxShadow: commandInput ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
            }}
          />
        </div>
      </motion.div>

      {/* Message d'erreur */}
      {errorMessage && (
        <div
          style={{
            color: '#ef4444',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '10px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={14} />
          {errorMessage}
        </div>
      )}

      {/* Bouton Valider Commande */}
      <button
        type="button"
        onClick={handleCommandSubmit}
        disabled={isVerifyingCommand || !commandInput.trim()}
        style={{
          width: '100%',
          background:
            isVerifyingCommand || !commandInput.trim()
              ? '#475569'
              : 'linear-gradient(135deg, #0284c7, #0369a1)',
          border: 'none',
          borderRadius: '10px',
          padding: '10px',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.88rem',
          cursor: isVerifyingCommand || !commandInput.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: commandInput.trim() ? '0 4px 12px rgba(2, 132, 199, 0.35)' : 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isVerifyingCommand && commandInput.trim()) e.currentTarget.style.filter = 'brightness(1.1)';
        }}
        onMouseLeave={(e) => {
          if (!isVerifyingCommand && commandInput.trim()) e.currentTarget.style.filter = 'none';
        }}
      >
        <Terminal size={16} />
        {isVerifyingCommand ? 'Vérification en cours...' : 'TRANSMETTRE LA COMMANDE'}
      </button>
    </div>
  );
};
