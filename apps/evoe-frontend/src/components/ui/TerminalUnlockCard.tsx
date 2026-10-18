import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@fontsource/vt323';
import './TerminalUnlockCard.css';
import { playTerminalKeySound } from '../../utils/easterEggAudio';

export interface TerminalUnlockCardProps {
  eggTitle: string;
  lore: string;
  pseudo?: string;
  pointsIT: number;
  onClose: () => void;
  onPlayArcadeGame?: (gameKey: string) => void;
  arcadeGameKey?: string;
  arcadeGameTitle?: string;
  onOpenCommLink?: () => void;
  isTeamRewarded?: boolean;
}

const CHAR_DELAY_MS = 16;
const LINE_DELAY_MS = 140;
const SOUND_EVERY_N_CHARS = 2;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Écran de déblocage « Retro Level Up » en terminal phosphore vert (style WarGames).
 * Le texte s'écrit une seule fois, avec un son de frappe, puis le terminal attend
 * un clic sur une action (aucune fermeture automatique).
 */
export const TerminalUnlockCard: React.FC<TerminalUnlockCardProps> = ({
  eggTitle,
  lore,
  pseudo,
  pointsIT,
  onClose,
  onPlayArcadeGame,
  arcadeGameKey,
  arcadeGameTitle,
  onOpenCommLink,
  isTeamRewarded = false,
}) => {
  const logLines = useMemo(
    () => [
      '> SYSTÈME MIS À JOUR ........ OK',
      '> RETRO LEVEL UP !',
      '> MODE SYNTHWAVE 1980 ....... DÉBLOQUÉ',
    ],
    [],
  );

  const bodyLines = useMemo(
    () => [
      `ÉNIGME RÉSOLUE // ${eggTitle}`,
      '',
      `BIEN JOUÉ${pseudo ? ` ${pseudo}` : ''}.`,
      '',
      lore,
    ],
    [eggTitle, lore, pseudo],
  );

  const allLines = useMemo(() => [...logLines, ...bodyLines], [logLines, bodyLines]);

  const [typed, setTyped] = useState<string[]>(() =>
    prefersReducedMotion() ? allLines : allLines.map(() => ''),
  );
  const [done, setDone] = useState<boolean>(() => prefersReducedMotion());
  const skipRef = useRef(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    skipRef.current = true;
    setTyped(allLines);
    setDone(true);
  }, [allLines]);

  // Effet machine à écrire (une seule fois)
  useEffect(() => {
    if (prefersReducedMotion()) return;

    skipRef.current = false;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let lineIdx = 0;
    let charIdx = 0;
    let typedChars = 0;

    const tick = () => {
      if (cancelled || skipRef.current) return;
      if (lineIdx >= allLines.length) {
        setDone(true);
        return;
      }
      const line = allLines[lineIdx];
      if (charIdx >= line.length) {
        lineIdx += 1;
        charIdx = 0;
        timer = setTimeout(tick, LINE_DELAY_MS);
        return;
      }
      charIdx += 1;
      typedChars += 1;
      const current = line.slice(0, charIdx);
      const idx = lineIdx;
      setTyped((prev) => {
        const next = [...prev];
        next[idx] = current;
        return next;
      });
      if (typedChars % SOUND_EVERY_N_CHARS === 0 && line[charIdx - 1] !== ' ') {
        playTerminalKeySound();
      }
      timer = setTimeout(tick, CHAR_DELAY_MS);
    };

    timer = setTimeout(tick, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [allLines]);

  // Le terminal prend le focus à l'ouverture pour que le clavier lui soit dédié
  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  // Focus sur la première action une fois le texte affiché
  useEffect(() => {
    if (!done) return;
    actionsRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [done]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Isole le terminal des écouteurs globaux (code Konami, ouverture du chat sur Entrée, etc.)
    e.stopPropagation();
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (!done) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        finish();
      }
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const buttons = Array.from(
      actionsRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    );
    if (buttons.length === 0) return;
    e.preventDefault();
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const delta = e.key === 'ArrowDown' ? 1 : -1;
    const next = (current + delta + buttons.length) % buttons.length;
    buttons[next].focus();
  };

  const logCount = logLines.length;

  return (
    <div
      id="terminal-unlock-card"
      className="term-card"
      role="dialog"
      aria-modal="true"
      aria-label="Retro Level Up : terminal de déblocage"
      tabIndex={-1}
      ref={cardRef}
      onKeyDown={handleKeyDown}
      onKeyUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onClick={() => {
        if (!done) finish();
      }}
    >
      <div className="term-log" aria-live="polite">
        {typed.slice(0, logCount).map((line, i) => (
          <div className="term-line" key={`log-${i}`}>
            {line}
          </div>
        ))}
      </div>

      <div className="term-body">
        {typed.slice(logCount).map((line, i) =>
          bodyLines[i] === '' ? (
            <div className="term-gap" key={`body-${i}`} />
          ) : (
            <div className="term-line" key={`body-${i}`}>
              {line}
            </div>
          ),
        )}
      </div>

      {done && (
        <>
          <div className="term-score">
            <span>BONUS IT D’ÉQUIPE</span>
            <span className="term-score-leader" aria-hidden="true" />
            <span>+{pointsIT}</span>
          </div>

          <div className="term-hint">
            CHOISIS UNE ACTION AVEC LES FLÈCHES ET TAPE ENTER.
          </div>

          <div className="term-actions" ref={actionsRef}>
            {onPlayArcadeGame && arcadeGameKey && (
              <button
                type="button"
                id={`terminal-play-${arcadeGameKey}`}
                className="term-action term-action--primary"
                onClick={() => {
                  onClose();
                  onPlayArcadeGame(arcadeGameKey);
                }}
              >
                [ JOUER À {(arcadeGameTitle || arcadeGameKey).toUpperCase()} ]
              </button>
            )}
            {onOpenCommLink && (
              <button
                type="button"
                id="terminal-open-commlink"
                className="term-action"
                onClick={() => {
                  onClose();
                  onOpenCommLink();
                }}
              >
                {isTeamRewarded
                  ? '< PARTAGER LA VICTOIRE AU COMM-LINK ÉQUIPE >'
                  : '< ALERTER L’ÉQUIPE POUR DÉBLOQUER LES POINTS IT >'}
              </button>
            )}
            <button
              type="button"
              id="terminal-continue"
              className="term-action"
              onClick={onClose}
            >
              &lt; CONTINUER L’EXPLORATION &gt;
            </button>
          </div>

          <div className="term-prompt" aria-hidden="true">
            &gt;<span className="term-cursor" />
          </div>
        </>
      )}
    </div>
  );
};
