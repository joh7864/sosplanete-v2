import React from 'react';
import { motion } from 'framer-motion';
import type { ActiveEasterEggResponse } from '../../types/easterEgg';

interface SciFiEggBadgeProps {
  eggData: ActiveEasterEggResponse | null;
  hasUnread?: boolean;
  hasSeenEnigma?: boolean;
  onClick: () => void;
}

export const SciFiEggBadge: React.FC<SciFiEggBadgeProps> = ({
  eggData,
  hasUnread = false,
  hasSeenEnigma = false,
  onClick,
}) => {
  if (!eggData || !eggData.enabled || !eggData.hasActiveEgg || !eggData.easterEgg) {
    return null;
  }

  const isInteractable = eggData.easterEgg.isInteractable !== false;
  const isDiscovered = !!eggData.playerProgress?.isDiscovered;
  const isTeamRewarded = !!eggData.teamProgress?.isTeamRewarded;
  // L'œuf passe en orange SEULEMENT si le joueur a cliqué et que les prérequis sont valides
  const isHunting = isInteractable && !isDiscovered && !isTeamRewarded && !!eggData.playerProgress?.firstInteractionAt;

  // Couleurs dynamiques selon les 3/4 états stricts :
  // 1. Initial : Bleuté (#38bdf8) - reste bleuté AVANT et APRÈS prérequis remplis tant que le joueur n'a pas cliqué
  let primaryColor = '#38bdf8';
  let secondaryColor = '#0284c7';
  let glowColor = 'rgba(56, 189, 248, 0.65)';

  if (isTeamRewarded) {
    primaryColor = '#fbbf24'; // Doré éclatant (Équipe récompensée)
    secondaryColor = '#d97706';
    glowColor = 'rgba(251, 191, 36, 0.85)';
  } else if (isDiscovered) {
    primaryColor = '#10b981'; // Vert émeraude (Résolu / découvert par le joueur)
    secondaryColor = '#059669';
    glowColor = 'rgba(16, 185, 129, 0.75)';
  } else if (isHunting) {
    primaryColor = '#f97316'; // Orange cyber (1er clic fait, message et 1er indice affichés)
    secondaryColor = '#c2410c';
    glowColor = 'rgba(249, 115, 22, 0.75)';
  }
  // Sinon : reste bleuté (#38bdf8) sans pastille d'alerte, rien n'indique le déblocage des prérequis

  return (
    <motion.button
      type="button"
      id="hud-easter-egg-badge"
      className="hud-easter-egg-badge"
      onClick={(e) => {
        e.stopPropagation();
        if (!isInteractable) return;
        onClick();
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: isInteractable ? 1 : 0.6,
        y: [0, -2.5, 0],
      }}
      transition={{
        y: {
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        scale: { duration: 0.3 },
      }}
      whileHover={isInteractable ? { scale: 1.22, filter: `drop-shadow(0 0 12px ${primaryColor})` } : {}}
      whileTap={isInteractable ? { scale: 0.92 } : {}}
      style={{
        position: 'relative',
        width: '26px',
        height: '30px',
        padding: 0,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        cursor: isInteractable ? 'pointer' : 'default',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* SVG Œuf de Pâques SF Holographique */}
      <svg
        viewBox="0 0 32 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          filter: `drop-shadow(0 0 6px ${glowColor})`,
        }}
      >
        <defs>
          <linearGradient
            id={`eggGrad-${primaryColor.replace('#', '')}`}
            x1="16"
            y1="2"
            x2="16"
            y2="36"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.95" />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a0f1d" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient
            id={`glowLine-${primaryColor.replace('#', '')}`}
            x1="4"
            y1="19"
            x2="28"
            y2="19"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.2" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Coque externe de l'œuf SF */}
        <path
          d="M16 2 C8 2 3 13 3 23 C3 30 8.5 36 16 36 C23.5 36 29 30 29 23 C29 13 24 2 16 2 Z"
          fill={`url(#eggGrad-${primaryColor.replace('#', '')})`}
          stroke={primaryColor}
          strokeWidth="1.6"
        />

        {/* Lignes de circuit imprimé holographique */}
        <path
          d="M8 20 Q16 15 24 20"
          stroke={`url(#glowLine-${primaryColor.replace('#', '')})`}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M10 26 Q16 22 22 26"
          stroke={primaryColor}
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.85"
        />

        {/* Lueur centrale */}
        <ellipse
          cx="16"
          cy="18"
          rx="5"
          ry="7"
          fill={primaryColor}
          opacity={isHunting ? 0.45 : 0.3}
        />

        {/* Étoile si récompensé équipe, ou point central (pas de coche) */}
        {isTeamRewarded ? (
          <path
            d="M16 7 L17.5 12 L22 12.5 L18.5 15.5 L19.5 20 L16 17.5 L12.5 20 L13.5 15.5 L10 12.5 L14.5 12 Z"
            fill="#ffffff"
            stroke="#fbbf24"
            strokeWidth="0.8"
          />
        ) : (
          <circle cx="16" cy="11" r="2.2" fill="#ffffff" opacity="0.9" />
        )}
      </svg>
    </motion.button>
  );
};
