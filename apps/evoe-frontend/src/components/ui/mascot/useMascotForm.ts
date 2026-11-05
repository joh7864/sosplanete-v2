import { useState, useRef, useCallback } from 'react';

interface UseMascotFormProps {
  currentEggId?: number;
  effectiveTriggerType?: string;
  onVerifyAnswer?: (answer: string, targetEggId?: number) => Promise<{ success: boolean; message?: string }>;
  onVerifyCommand?: (command: string, targetEggId?: number) => Promise<{ success: boolean; message?: string }>;
  onSuccess?: (targetEggId?: number) => void;
  resetTimer: () => void;
  setShowLightbox: (val: boolean) => void;
}

export function useMascotForm({
  currentEggId,
  effectiveTriggerType,
  onVerifyAnswer,
  onVerifyCommand,
  onSuccess,
  resetTimer,
  setShowLightbox,
}: UseMascotFormProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [commandInput, setCommandInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifyingCommand, setIsVerifyingCommand] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorShake, setShowErrorShake] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);
  const [isCryptexActive, setIsCryptexActive] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const lightboxInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const triggerShake = useCallback(() => {
    setShowErrorShake(true);
    setTimeout(() => setShowErrorShake(false), 600);
  }, []);

  const resetFormState = useCallback(() => {
    setDigits(['', '', '', '']);
    setCommandInput('');
    setErrorMessage(null);
    setLocalSuccess(false);
    setIsCryptexActive(false);
  }, []);

  const handleDigitChange = useCallback(
    (index: number, val: string, isLightbox = false) => {
      resetTimer();
      setErrorMessage(null);
      const targetRefs = isLightbox ? lightboxInputRefs : inputRefs;

      const cleanVal = val.replace(/\D/g, '');
      if (cleanVal.length === 0) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
        return;
      }

      if (cleanVal.length > 1) {
        const chars = cleanVal.slice(0, 4).split('');
        setDigits((prev) => {
          const next = [...prev];
          chars.forEach((c, idx) => {
            if (index + idx < 4) next[index + idx] = c;
          });
          return next;
        });
        const nextIdx = Math.min(3, index + chars.length);
        targetRefs[nextIdx]?.current?.focus();
        return;
      }

      setDigits((prev) => {
        const next = [...prev];
        next[index] = cleanVal[cleanVal.length - 1];
        return next;
      });

      if (index < 3 && cleanVal) {
        targetRefs[index + 1]?.current?.focus();
      }
    },
    [resetTimer, inputRefs, lightboxInputRefs],
  );

  const handleSubmitAnswer = useCallback(async () => {
    resetTimer();
    const answer = digits.join('');
    if (answer.length < 4) {
      setErrorMessage('Veuillez saisir les 4 chiffres du code.');
      triggerShake();
      return;
    }

    if (!onVerifyAnswer) return;

    try {
      setIsVerifying(true);
      setErrorMessage(null);
      const res = await onVerifyAnswer(answer, currentEggId);
      if (res.success) {
        setLocalSuccess(true);
        setIsCryptexActive(true);
        setShowLightbox(false);
        onSuccess?.(currentEggId);
      } else {
        setErrorMessage(res.message || 'Code erroné. Croisez bien les 5 règles du schéma !');
        triggerShake();
      }
    } catch {
      setErrorMessage('Erreur lors de la vérification.');
      triggerShake();
    } finally {
      setIsVerifying(false);
    }
  }, [digits, onVerifyAnswer, currentEggId, onSuccess, resetTimer, setShowLightbox, triggerShake]);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>, isLightbox = false) => {
      resetTimer();
      const targetRefs = isLightbox ? lightboxInputRefs : inputRefs;
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        targetRefs[index - 1]?.current?.focus();
      } else if (e.key === 'Enter') {
        handleSubmitAnswer();
      }
    },
    [digits, handleSubmitAnswer, inputRefs, lightboxInputRefs, resetTimer],
  );

  const handleCommandSubmit = useCallback(async () => {
    const raw = commandInput.trim();
    if (!raw) return;

    resetTimer();
    setErrorMessage(null);

    if (!onVerifyCommand) {
      setErrorMessage('Validation non disponible pour cette énigme');
      triggerShake();
      return;
    }

    try {
      setIsVerifyingCommand(true);
      const res = await onVerifyCommand(raw, currentEggId);
      if (res.success) {
        setLocalSuccess(true);
        if (effectiveTriggerType === 'RIDDLE_ANSWER_INPUT') {
          setIsCryptexActive(true);
        }
        setShowLightbox(false);
        onSuccess?.(currentEggId);
      } else {
        setErrorMessage(res.message || 'Mot-clé ou commande non reconnu.');
        triggerShake();
      }
    } catch {
      setErrorMessage('Erreur lors de la validation.');
      triggerShake();
    } finally {
      setIsVerifyingCommand(false);
    }
  }, [commandInput, onVerifyCommand, currentEggId, effectiveTriggerType, onSuccess, resetTimer, setShowLightbox, triggerShake]);

  return {
    digits,
    setDigits,
    commandInput,
    setCommandInput,
    isVerifying,
    isVerifyingCommand,
    errorMessage,
    setErrorMessage,
    showErrorShake,
    triggerShake,
    localSuccess,
    setLocalSuccess,
    isCryptexActive,
    setIsCryptexActive,
    inputRefs,
    lightboxInputRefs,
    handleDigitChange,
    handleKeyDown,
    handleSubmitAnswer,
    handleCommandSubmit,
    resetFormState,
  };
}
