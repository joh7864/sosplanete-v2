import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EvoeRadarMeterProps {
  value: number;
  label: string;
  color: string;
  id: string;
  tooltipTitle?: string;
  tooltipText?: string;
  tooltip?: string;
  displayValue?: string;
}

export function EvoeRadarMeter({
  value,
  label,
  color,
  id,
  tooltipTitle,
  tooltipText,
  tooltip,
  displayValue
}: EvoeRadarMeterProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const angle = -135 + (normalizedValue / 100) * 270;
  const strokeDashOffset = 400.5 - (400.5 * normalizedValue) / 100;

  const title = tooltipTitle || (label === 'REGEN.' ? 'Régénération Planétaire' : 'Bio-Stabilité Temporelle');
  const text = tooltipText || tooltip;

  return (
    <div 
      className="evoe-radar-meter-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ 
        width: '90px', 
        height: '90px', 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        cursor: text ? 'help' : 'default'
      }}
    >
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Arc de fond */}
        <path
          d="M 40 160 A 85 85 0 1 1 160 160"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Arc actif animé */}
        <motion.path
          d="M 40 160 A 85 85 0 1 1 160 160"
          fill="none"
          stroke={`url(#grad-${id})`}
          strokeWidth="12"
          strokeLinecap="round"
          filter={`url(#glow-${id})`}
          strokeDasharray="400.5"
          initial={{ strokeDashoffset: 400.5 }}
          animate={{ strokeDashoffset: strokeDashOffset }}
          transition={{ duration: 2.0, ease: "easeOut" }}
        />

        {/* Aiguille rotative */}
        <g transform="translate(100, 100)">
          <motion.g
            initial={{ rotate: -135 }}
            animate={{ rotate: angle }}
            transition={{ duration: 2.0, ease: "easeOut" }}
          >
            {/* Cercle invisible forçant le transform-origin à rester au centre exact (0,0) */}
            <circle cx="0" cy="0" r="85" fill="none" stroke="none" />
            <polygon points="-2,0 2,0 0,-85" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }} />
            <circle cx="0" cy="0" r="6" fill="#111827" stroke="#ffffff" strokeWidth="2" />
          </motion.g>
        </g>

        {/* Pourcentage au centre */}
        <text
          x="100"
          y="68"
          fill="#ffffff"
          fontSize="36"
          fontWeight="bold"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          textAnchor="middle"
          style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}
        >
          {displayValue !== undefined ? displayValue : `${Math.round(value)}%`}
        </text>

        {/* Label sous l'aiguille */}
        <text
          x="100"
          y="152"
          fill={color}
          fontSize="14"
          fontWeight="900"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="1.5"
          style={{ textShadow: `0 0 8px ${color}55` }}
        >
          {label}
        </text>
      </svg>

      {/* Tooltip HUD Cyberpunk Multi-Lignes */}
      <AnimatePresence>
        {showTooltip && text && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="evoe-radar-hud-tooltip"
            style={{
              borderColor: `${color}60`,
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.8), 0 0 14px ${color}30`
            }}
          >
            <div className="evoe-radar-hud-title" style={{ color }}>
              <span className="hud-indicator-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              {title}
            </div>
            <div className="evoe-radar-hud-desc">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
