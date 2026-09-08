import React from 'react';
import { motion } from 'framer-motion';
import type { ActiveEasterEggResponse } from '../../types/easterEgg';
import { getPeriodGlyph } from '../../utils/periodGlyphs2070';

interface SciFiEggBadgeProps {
  eggData: ActiveEasterEggResponse | null;
  hasUnread?: boolean;
  hasSeenEnigma?: boolean;
  onClick: () => void;
}

export const SciFiEggBadge: React.FC<SciFiEggBadgeProps> = ({
  eggData,
  hasUnread: _hasUnread = false,
  hasSeenEnigma: _hasSeenEnigma = false,
  onClick,
}) => {
  if (!eggData || !eggData.enabled || !eggData.hasActiveEgg || !eggData.easterEgg) {
    return null;
  }

  const isInteractable = eggData.easterEgg.isInteractable !== false;
  const isDiscovered = !!eggData.playerProgress?.isDiscovered;
  const isTeamRewarded = !!eggData.teamProgress?.isTeamRewarded;
  const isHunting =
    isInteractable && !isDiscovered && !isTeamRewarded && !!eggData.playerProgress?.firstInteractionAt;

  // Teinte de bordure selon l'état d'interaction
  let rimColor = '#38bdf8'; // Cyan d'origine
  let rimGlow = 'rgba(56, 189, 248, 0.5)';

  if (isTeamRewarded) {
    rimColor = '#fbbf24';
    rimGlow = 'rgba(251, 191, 36, 0.8)';
  } else if (isDiscovered) {
    rimColor = '#10b981';
    rimGlow = 'rgba(16, 185, 129, 0.7)';
  } else if (isHunting) {
    rimColor = '#f97316';
    rimGlow = 'rgba(249, 115, 22, 0.7)';
  }

  // Multi-Easter Eggs & Glyphe 2070 de la période
  const multiEgg = eggData.multiEggProgress;
  const totalCount = multiEgg?.total || 1;
  const solvedCount = multiEgg?.solved || (isDiscovered ? 1 : 0);
  const periodIndex = eggData.period?.periodIndex || 1;

  const glyphDef = React.useMemo(() => getPeriodGlyph(periodIndex), [periodIndex]);

  // Dévoilement progressif STRICT :
  // Si 0 œuf résolu : aucun segment n'est dévoilé (coque lisse et immaculée).
  // Si N œufs résolus : on dévoile exactement la proportion correspondante de bas en haut.
  const revealedSegmentsCount = React.useMemo(() => {
    if (solvedCount <= 0) return 0;
    const ratio = Math.min(1, solvedCount / totalCount);
    return Math.max(1, Math.round(ratio * glyphDef.segments.length));
  }, [solvedCount, totalCount, glyphDef.segments.length]);

  const activeSegments = glyphDef.segments.slice(0, revealedSegmentsCount);
  const isPeriodCompleted = solvedCount >= totalCount && totalCount > 0;

  return (
    <motion.button
      type="button"
      id="hud-easter-egg-badge"
      className="hud-easter-egg-badge"
      title=""
      onClick={(e) => {
        e.stopPropagation();
        if (!isInteractable) return;
        onClick();
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: isInteractable ? 1 : 0.65,
        y: [0, -3, 0],
      }}
      transition={{
        y: {
          duration: 2.6,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        scale: { duration: 0.3 },
      }}
      whileHover={
        isInteractable
          ? {
              scale: 1.25,
              filter: `drop-shadow(0 0 14px ${isPeriodCompleted ? '#fbbf24' : rimColor})`,
            }
          : {}
      }
      whileTap={isInteractable ? { scale: 0.92 } : {}}
      style={{
        position: 'relative',
        width: '28px',
        height: '34px',
        padding: 0,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        cursor: isInteractable ? 'pointer' : 'default',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 400,
      }}
    >
      {/* Rendu 3D Volumétrique de l'Œuf SF */}
      <svg
        viewBox="0 0 32 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          filter: `drop-shadow(0 2px 8px ${rimGlow})`,
        }}
      >
        <defs>
          {/* Dégradé volumétrique sphérique 3D de la coque (Titane / Céramique polie) */}
          <radialGradient
            id="egg3DShading"
            cx="35%"
            cy="28%"
            r="65%"
            fx="30%"
            fy="22%"
          >
            <stop offset="0%" stopColor="#475569" stopOpacity="1" />
            <stop offset="45%" stopColor="#1e293b" stopOpacity="1" />
            <stop offset="85%" stopColor="#0f172a" stopOpacity="1" />
            <stop offset="100%" stopColor="#050811" stopOpacity="1" />
          </radialGradient>

          {/* Reflet spéculaire zénithal 3D (lustre de surface polie) */}
          <radialGradient
            id="eggZenithHighlight"
            cx="32%"
            cy="24%"
            r="38%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#94a3b8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Lueur d'émission dorée pour les sillons gravés de 2070 */}
          <filter id="goldLaserGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Ombre portée douce 3D sous l'œuf */}
        <ellipse cx="16" cy="36.5" rx="10" ry="1.5" fill="#000000" opacity="0.45" />

        {/* 2. Coque ovoïde 3D en Titane Brossé Sombre */}
        <path
          d="M16 2 C8 2 3 13 3 23 C3 30 8.5 36 16 36 C23.5 36 29 30 29 23 C29 13 24 2 16 2 Z"
          fill="url(#egg3DShading)"
          stroke={rimColor}
          strokeWidth="1.2"
        />

        {/* 3. Reflet volumétrique de surface (courbure 3D) */}
        <path
          d="M16 2 C8 2 3 13 3 23 C3 30 8.5 36 16 36 C23.5 36 29 30 29 23 C29 13 24 2 16 2 Z"
          fill="url(#eggZenithHighlight)"
        />

        {/* 4. Fine rainure équatoriale de calibration cybernétique */}
        <path
          d="M6 23 Q16 20 26 23"
          stroke={rimColor}
          strokeWidth="0.6"
          strokeDasharray="2 3"
          opacity="0.35"
        />

        {/* 5. Gravure Progressive du Glyphe de 2070 (De bas en haut) */}
        {activeSegments.length > 0 && (
          <motion.g
            id="glyph-2070-carvings"
            filter="url(#goldLaserGlow)"
            animate={
              isPeriodCompleted
                ? { opacity: [0.85, 1, 0.85], scale: [1, 1.02, 1] }
                : { opacity: 0.95 }
            }
            transition={
              isPeriodCompleted
                ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                : {}
            }
          >
            {activeSegments.map((seg, idx) => (
              <g key={idx}>
                {/* Lueur externe dorée */}
                <path
                  d={seg.d}
                  stroke="#fbbf24"
                  strokeWidth="2.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.85"
                />
                {/* Cœur spéculaire blanc incandescent */}
                <path
                  d={seg.d}
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.95"
                />
                {/* Nœuds quantiques aux extrémités */}
                {seg.points?.map((pt, pIdx) => (
                  <g key={pIdx}>
                    <circle cx={pt.cx} cy={pt.cy} r="1.5" fill="#fbbf24" />
                    <circle cx={pt.cx} cy={pt.cy} r="0.6" fill="#ffffff" />
                  </g>
                ))}
              </g>
            ))}
          </motion.g>
        )}

        {/* 6. Étoile / Auréole si l'équipe a validé la récompense globale */}
        {isTeamRewarded && (
          <motion.path
            d="M16 4.5 L17.2 8 L20.5 8.5 L18 10.8 L18.8 14 L16 12.2 L13.2 14 L14 10.8 L11.5 8.5 L14.8 8 Z"
            fill="#ffffff"
            stroke="#fbbf24"
            strokeWidth="0.7"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        )}
      </svg>
    </motion.button>
  );
};
