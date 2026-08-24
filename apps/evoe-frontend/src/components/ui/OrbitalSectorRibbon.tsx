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
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      justifyContent: 'center',
      overflowX: 'auto',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      <style>{`.ribbon-scroll::-webkit-scrollbar { display: none; }`}</style>
      
      {categories.map(category => {
        const isActive = category === selectedSector;
        return (
          <motion.button
            key={category}
            onClick={() => onSelect(category)}
            title={category} // Native tooltip
            style={{
              background: isActive ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isActive ? '#00ffcc' : 'transparent'}`,
              color: isActive ? '#00ffcc' : 'rgba(255,255,255,0.6)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isActive ? '0 0 10px rgba(0, 255, 204, 0.4)' : 'none'
            }}
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
          >
            <span style={{ fontSize: '1.2rem', filter: isActive ? 'drop-shadow(0 0 5px #00ffcc)' : 'none' }}>
              {category === 'Défis' ? '⚔️' : getCategoryEmoji(category)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
