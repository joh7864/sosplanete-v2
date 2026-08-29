import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface MissionSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  isMobile?: boolean;
  isOpenMobile?: boolean;
  onToggleMobile?: (open: boolean) => void;
  resultsCount?: number;
  placeholder?: string;
}

export const MissionSearchBar: React.FC<MissionSearchBarProps> = ({
  value,
  onChange,
  isMobile = false,
  isOpenMobile = false,
  onToggleMobile,
  resultsCount,
  placeholder = 'Rechercher une mission...'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when opened on mobile
  useEffect(() => {
    if (isMobile && isOpenMobile && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isOpenMobile]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (value) {
        onChange('');
      } else if (isMobile && onToggleMobile) {
        onToggleMobile(false);
      }
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  // --- RENDU MOBILE : Bouton loupe rétractable (Option A) ---
  if (isMobile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          {!isOpenMobile ? (
            <motion.button
              key="search-btn-mobile"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggleMobile?.(true)}
              title="Rechercher une mission"
              style={{
                background: value ? 'rgba(0, 255, 204, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                border: `1.5px solid ${value ? '#00ffcc' : 'rgba(0, 255, 204, 0.35)'}`,
                color: '#00ffcc',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: value ? '0 0 12px rgba(0, 255, 204, 0.5)' : '0 0 8px rgba(0, 255, 204, 0.15)',
                transition: 'all 0.25s ease'
              }}
            >
              <Search size={17} />
            </motion.button>
          ) : (
            <motion.div
              key="search-input-mobile-overlay"
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(8, 14, 28, 0.98)',
                backdropFilter: 'blur(20px)',
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: '8px'
              }}
            >
              {/* Champ de saisie mobile */}
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: '#00ffcc',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 255, 204, 0.08)',
                    border: '1.5px solid rgba(0, 255, 204, 0.4)',
                    borderRadius: '20px',
                    padding: '8px 12px 8px 36px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxShadow: '0 0 10px rgba(0, 255, 204, 0.2)'
                  }}
                />
                {/* Badge compteur si recherche active - intégré dans le champ */}
                {value && resultsCount !== undefined && (
                  <span
                    style={{
                      position: 'absolute',
                      right: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: resultsCount > 0 ? '#00ffcc' : '#ff6b6b',
                      background: resultsCount > 0 ? 'rgba(0, 255, 204, 0.12)' : 'rgba(255, 107, 107, 0.12)',
                      border: `1px solid ${resultsCount > 0 ? 'rgba(0, 255, 204, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      pointerEvents: 'none'
                    }}
                  >
                    {resultsCount}
                  </span>
                )}
              </div>

              {/* Bouton croix pour fermer directement le mode recherche */}
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  onToggleMobile?.(false);
                }}
                style={{
                  background: 'rgba(255, 100, 100, 0.1)',
                  border: '1px solid rgba(255,100,100,0.4)',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  color: '#ff6666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                title="Fermer la recherche"
              >
                <X size={17} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- RENDU DESKTOP : Barre compacte intégrée ---
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '210px',
        transition: 'width 0.3s ease'
      }}
    >
      <Search
        size={15}
        style={{
          position: 'absolute',
          left: '10px',
          color: value ? '#00ffcc' : 'rgba(0, 255, 204, 0.6)',
          pointerEvents: 'none',
          filter: value ? 'drop-shadow(0 0 4px #00ffcc)' : 'none',
          transition: 'all 0.2s ease'
        }}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: value ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          border: `1.5px solid ${value ? '#00ffcc' : 'rgba(0, 255, 204, 0.25)'}`,
          borderRadius: '18px',
          padding: '6px 30px 6px 32px',
          color: '#ffffff',
          fontSize: '0.8rem',
          fontFamily: 'inherit',
          outline: 'none',
          boxShadow: value ? '0 0 14px rgba(0, 255, 204, 0.35)' : 'none',
          transition: 'all 0.25s ease'
        }}
      />

      {value && (
        <div style={{ position: 'absolute', right: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {resultsCount !== undefined && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: resultsCount > 0 ? '#00ffcc' : '#ff6b6b',
                background: resultsCount > 0 ? 'rgba(0, 255, 204, 0.15)' : 'rgba(255, 107, 107, 0.15)',
                padding: '1px 5px',
                borderRadius: '8px'
              }}
            >
              {resultsCount}
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'all 0.2s'
            }}
            title="Effacer la recherche"
          >
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  );
};
