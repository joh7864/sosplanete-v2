import React from 'react';

export const DEDUCTION_CLUES = [
  {
    digits: '4839',
    strikethrough: false,
    parts: [
      { text: '1', color: '#10b981' },
      { text: ' bien placé, ', color: '#94a3b8' },
      { text: '1', color: '#f59e0b' },
      { text: ' mal placé', color: '#94a3b8' },
    ],
  },
  {
    digits: '7921',
    strikethrough: false,
    parts: [
      { text: '2', color: '#f59e0b' },
      { text: ' mal placés', color: '#94a3b8' },
    ],
  },
  {
    digits: '3514',
    strikethrough: false,
    parts: [
      { text: '2', color: '#10b981' },
      { text: ' bien placés', color: '#94a3b8' },
    ],
  },
  {
    digits: '8406',
    strikethrough: false,
    parts: [
      { text: '1', color: '#f59e0b' },
      { text: ' mal placé', color: '#94a3b8' },
    ],
  },
  {
    digits: '1752',
    strikethrough: true,
    parts: [
      { text: 'Aucun chiffre', color: '#ef4444' },
      { text: ' correct', color: '#94a3b8' },
    ],
  },
];

export const PadlockSvg: React.FC<{ size?: number }> = ({ size = 76 }) => {
  const height = Math.round(size * (84 / 76));
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 84 94"
      fill="none"
      style={{ filter: 'drop-shadow(0 4px 14px rgba(245, 158, 11, 0.4))' }}
    >
      <defs>
        <linearGradient id="shackleGradSide" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="25%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="lockBodyGradSide" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      <path
        d="M 23 38 V 20 C 23 10 31 3 42 3 C 53 3 61 10 61 20 V 38"
        stroke="url(#shackleGradSide)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      <rect
        x="8"
        y="30"
        width="68"
        height="54"
        rx="13"
        fill="url(#lockBodyGradSide)"
        stroke="rgba(254, 240, 138, 0.8)"
        strokeWidth="1.2"
      />

      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${14 + i * 14.5}, 38)`}>
          <rect width="11" height="38" rx="3.5" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          <polygon points="5.5,2.5 2.5,6 8.5,6" fill="#fde047" />
          <text
            x="5.5"
            y="22"
            fill="#ffffff"
            fontSize="9.5"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            ?
          </text>
          <polygon points="5.5,35.5 2.5,32 8.5,32" fill="#fde047" />
        </g>
      ))}
    </svg>
  );
};
