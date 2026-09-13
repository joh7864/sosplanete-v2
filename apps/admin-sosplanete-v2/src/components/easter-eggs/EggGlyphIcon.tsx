'use client';

import React, { useId } from 'react';
import { getPeriodGlyph } from '@/utils/periodGlyphs2070';

interface EggGlyphIconProps {
  periodIndex?: number;
  easterEggId?: number;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  xs: { width: 22, height: 26, stroke: 1.4, dot: 1 },
  sm: { width: 28, height: 33, stroke: 1.6, dot: 1.2 },
  md: { width: 36, height: 42, stroke: 1.8, dot: 1.3 },
  lg: { width: 48, height: 57, stroke: 2, dot: 1.5 },
};

export function EggGlyphIcon({
  periodIndex,
  easterEggId,
  title,
  size = 'sm',
  className = '',
}: EggGlyphIconProps) {
  const reactId = useId().replace(/:/g, '_');
  const shadeId = `egg-shade-${reactId}`;
  const zenithId = `egg-zenith-${reactId}`;

  const glyphIdx = periodIndex ?? (easterEggId ? ((easterEggId - 1) % 12) + 1 : 1);
  const glyph = getPeriodGlyph(glyphIdx);
  const s = SIZE_MAP[size];

  const svgContent = (
    <svg
      viewBox="0 0 32 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: s.width, height: s.height }}
      className="shrink-0 drop-shadow-sm transition-transform duration-150 group-hover:scale-110"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={shadeId} cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="45%" stopColor="#1e293b" />
          <stop offset="85%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#050811" />
        </radialGradient>
        <radialGradient id={zenithId} cx="32%" cy="24%" r="38%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="40%" stopColor="#94a3b8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ombre portée */}
      <ellipse cx="16" cy="36.5" rx="10" ry="1.5" fill="#000000" opacity="0.3" />

      {/* Coque 3D */}
      <path
        d="M16 2 C8 2 3 13 3 23 C3 30 8.5 36 16 36 C23.5 36 29 30 29 23 C29 13 24 2 16 2 Z"
        fill={`url(#${shadeId})`}
        stroke="#fbbf24"
        strokeWidth="1.2"
      />

      {/* Reflet zénithal */}
      <path
        d="M16 2 C8 2 3 13 3 23 C3 30 8.5 36 16 36 C23.5 36 29 30 29 23 C29 13 24 2 16 2 Z"
        fill={`url(#${zenithId})`}
      />

      {/* Glyphe gravé doré */}
      <g style={{ filter: 'drop-shadow(0 0 2.5px rgba(251, 191, 36, 0.85))' }}>
        {glyph.segments.map((seg, sIdx) => (
          <g key={sIdx}>
            <path
              d={seg.d}
              stroke="#fbbf24"
              strokeWidth={s.stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d={seg.d}
              stroke="#ffffff"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {seg.points?.map((pt, pIdx) => (
              <circle key={pIdx} cx={pt.cx} cy={pt.cy} r={s.dot} fill="#fbbf24" />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );

  if (!title) {
    return <div className={`inline-flex items-center justify-center ${className}`}>{svgContent}</div>;
  }

  return (
    <div className={`relative group inline-flex items-center justify-center cursor-pointer ${className}`}>
      {svgContent}

      {/* Tooltip flottant haute lisibilité (sans doublon natif) */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 whitespace-nowrap z-30"
      >
        {title}
      </span>
    </div>
  );
}
