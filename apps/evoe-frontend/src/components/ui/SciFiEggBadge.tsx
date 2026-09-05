import React from 'react';
import { motion } from 'framer-motion';
import type { ActiveEasterEggResponse } from '../../types/easterEgg';

interface SciFiEggBadgeProps {
  eggData: ActiveEasterEggResponse | null;
  hasUnread?: boolean;
  onClick: () => void;
}

export const SciFiEggBadge: React.FC<SciFiEggBadgeProps> = ({
  eggData,
  hasUnread = false,
  onClick,
}) => {
  if (!eggData || !eggData.enabled || !eggData.hasActiveEgg || !eggData.easterEgg) {
    return null;
  }

  const isDiscovered = eggData.playerProgress?.isDiscovered;
  const isTeamRewarded = eggData.teamProgress?.isTeamRewarded;

  // Couleurs dynamiques selon l'état
  let primaryColor = '#38bdf8'; // Cyan futuriste
  let secondaryColor = '#0284c7';
  let glowColor = 'rgba(56, 189, 248, 0.6)';

  if (isTeamRewarded) {
    primaryColor = '#fbbf24'; // Doré éclatant
    secondaryColor = '#d97706';
    glowColor = 'rgba(251, 191, 36, 0.8)';
  } else if (isDiscovered) {
    primaryColor = '#10b981'; // Vert émeraude
    secondaryColor = '#059669';
    glowColor = 'rgba(16, 185, 129, 0.7)';
  }

  return (
    <motion.button
      type="button"
      id="hud-easter-egg-badge"
      className="hud-easter-egg-badge"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={
        isTeamRewarded
          ? `Énigme 2070 : Validée par votre équipe (+${eggData.teamProgress?.awardedPointsIT || eggData.easterEgg.rewardPointsIT} IT)`
          : isDiscovered
          ? 'Énigme 2070 : Découverte par vous (En attente de l’équipe)'
          : `Transmission 2070 : "${eggData.easterEgg.title}"`
      }
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
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
      whileHover={{ scale: 1.2, filter: `drop-shadow(0 0 10px ${primaryColor})` }}
      whileTap={{ scale: 0.92 }}
      style={{
        position: 'absolute',
        bottom: '-4px',
        right: '-6px',
        width: '24px',
        height: '28px',
        padding: 0,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
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
            id="eggGrad"
            x1="16"
            y1="2"
            x2="16"
            y2="36"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.95" />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient
            id="glowLine"
            x1="4"
            y1="19"
            x2="28"
            y2="19"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.2" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Coque externe de l'œuf SF */}
        <path
          d="M16 2 C8 2 3 13 3 23 C3 30 8.5 36 16 36 C23.5 36 29 30 29 23 C29 13 24 2 16 2 Z"
          fill="url(#eggGrad)"
          stroke={primaryColor}
          strokeWidth="1.6"
        />

        {/* Lignes de circuit imprimé holographique */}
        <path
          d="M8 20 Q16 15 24 20"
          stroke="url(#glowLine)"
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
        <circle cx="16" cy="11" r="2.2" fill="#ffffff" opacity="0.9" />

        {/* Lueur centrale */}
        <ellipse
          cx="16"
          cy="18"
          rx="5"
          ry="7"
          fill={primaryColor}
          opacity="0.35"
        />

        {/* Coche si résolu ou étoile si récompensé */}
        {isTeamRewarded ? (
          <path
            d="M16 7 L17.5 12 L22 12.5 L18.5 15.5 L19.5 20 L16 17.5 L12.5 20 L13.5 15.5 L10 12.5 L14.5 12 Z"
            fill="#ffffff"
            stroke="#fbbf24"
            strokeWidth="0.8"
          />
        ) : isDiscovered ? (
          <path
            d="M11 19 L14.5 23 L21 14"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>

      {/* Pastille '!' si énigme non lue */}
      {hasUnread && !isDiscovered && (
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            border: '1.5px solid #ffffff',
            boxShadow: '0 0 6px #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '7px',
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        >
          !
        </motion.div>
      )}
    </motion.button>
  );
};
