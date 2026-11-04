import React, { useState } from 'react';
import type { CycleEggItem } from '../../../types/easterEgg';

export interface EggSelectorProps {
  visibleCycleEggs: CycleEggItem[];
  selectedEggIndex: number;
  onSelectEggIndex: (index: number) => void;
}

export const EggSelector: React.FC<EggSelectorProps> = ({
  visibleCycleEggs,
  selectedEggIndex,
  onSelectEggIndex,
}) => {
  const [hoveredEggIndex, setHoveredEggIndex] = useState<number | null>(null);

  if (visibleCycleEggs.length <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        marginBottom: '10px',
        paddingBottom: '4px',
        paddingTop: '2px',
      }}
    >
      {visibleCycleEggs.map((egg: CycleEggItem, idx: number) => {
        const isSelected = idx === selectedEggIndex;
        const isDone = !!egg.isDiscovered;
        const isLocked = egg.isInteractable === false && !isDone;
        const tooltipText = `#${idx + 1} : ${egg.title}${isDone ? ' (Résolu ✓)' : isLocked ? ' (Verrouillé 🔒)' : ' (À résoudre)'}`;

        return (
          <div key={egg.id} style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              onClick={() => onSelectEggIndex(idx)}
              title={tooltipText}
              onMouseEnter={() => setHoveredEggIndex(idx)}
              onMouseLeave={() => setHoveredEggIndex(null)}
              style={{
                width: '32px',
                height: '36px',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                border: isSelected
                  ? '2.5px solid #0284c7'
                  : isDone
                    ? '1.5px solid #10b981'
                    : isLocked
                      ? '1.5px solid #94a3b8'
                      : '1.5px solid #cbd5e1',
                background: isSelected
                  ? '#e0f2fe'
                  : isDone
                    ? '#ecfdf5'
                    : isLocked
                      ? '#f1f5f9'
                      : '#f8fafc',
                boxShadow: isSelected
                  ? '0 0 10px rgba(2, 132, 199, 0.45)'
                  : '0 1px 3px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isDone ? '0.85rem' : '0.95rem',
                transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                transition: 'all 0.18s ease',
                padding: 0,
                outline: 'none',
                opacity: isLocked ? 0.6 : 1,
              }}
            >
              <span>{isDone ? '✓' : isLocked ? '🔒' : '🥚'}</span>
            </button>

            {/* Tooltip au survol */}
            {hoveredEggIndex === idx && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '6px',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 50,
                  pointerEvents: 'none',
                }}
              >
                {tooltipText}
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    marginLeft: '-4px',
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: '4px solid #0f172a',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
