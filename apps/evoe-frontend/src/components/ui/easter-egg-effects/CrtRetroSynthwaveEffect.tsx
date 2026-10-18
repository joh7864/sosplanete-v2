import React, { useEffect } from 'react';
import { playRetroSynthwaveSound } from '../../../utils/easterEggAudio';

interface CrtRetroSynthwaveEffectProps {
  duration?: number;
  onComplete?: () => void;
}

/**
 * Mode « Terminal » : uniquement des bords carrés vert phosphore, des scanlines
 * très discrètes et une vignette sombre. Plus de grille, ni de néon rose/cyan.
 */
export const CrtRetroSynthwaveEffect: React.FC<CrtRetroSynthwaveEffectProps> = ({
  duration = 3500,
  onComplete,
}) => {
  useEffect(() => {
    playRetroSynthwaveSound();
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* 1. Scanlines horizontales très discrètes */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.18) 0px, rgba(0, 0, 0, 0.18) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* 2. Vignette sombre verdâtre */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 60%, rgba(0, 10, 0, 0.7) 100%)',
        }}
      />

      {/* 3. Bords du terminal : cadre carré double, phosphore vert */}
      <div
        style={{
          position: 'absolute',
          inset: '10px',
          border: '4px double #20c20e',
          borderRadius: 0,
          boxShadow: '0 0 18px rgba(32, 194, 14, 0.4), inset 0 0 40px rgba(32, 194, 14, 0.12)',
        }}
      />
    </div>
  );
};
