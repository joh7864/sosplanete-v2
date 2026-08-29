import React from 'react';
import { motion } from 'framer-motion';
import { getCategoryEmoji } from '../Portal2026';

interface OrbitalSectorRibbonProps {
  categories: string[];
  selectedSector: string | null;
  onSelect: (sector: string) => void;
}

export const OrbitalSectorRibbon: React.FC<OrbitalSectorRibbonProps> = ({
  categories,
  selectedSector,
  onSelect
}) => {
  if (!categories || categories.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowX: 'auto',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        padding: '2px 0',
        width: '100%'
      }}
    >
      <style>{`.ribbon-scroll::-webkit-scrollbar { display: none; }`}</style>
      
      {categories.map(category => {
        const isActive = category === selectedSector;
        return (
          <motion.button
            key={category}
            onClick={() => onSelect(category)}
            title={category}
            style={{
              background: isActive ? 'rgba(0, 255, 204, 0.22)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${isActive ? '#00ffcc' : 'rgba(255,255,255,0.1)'}`,
              color: isActive ? '#00ffcc' : 'rgba(255,255,255,0.6)',
              width: '34px',
              height: '34px',
              minWidth: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: isActive ? '0 0 10px rgba(0, 255, 204, 0.45)' : 'none',
              flexShrink: 0
            }}
            whileHover={{ scale: 1.08, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.92 }}
          >
            <span style={{ fontSize: '1.05rem', filter: isActive ? 'drop-shadow(0 0 4px #00ffcc)' : 'none' }}>
              {category === 'Défis' ? '⚔️' : getCategoryEmoji(category)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
