import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MissionCard3D } from './MissionCard3D';

interface MissionsCarousel3DProps {
  missions: any[];
  loadingMissionId: number | null;
  onImpulse: (id: number) => void;
  onCancelConfirm: (actionDoneId: number, label: string) => void;
  onOpenMissionsWeek?: () => void;
  selectedSector: string;
  isSearchMode?: boolean;
  onClearSearch?: () => void;
}

export const MissionsCarousel3D: React.FC<MissionsCarousel3DProps> = ({
  missions,
  loadingMissionId,
  onImpulse,
  onCancelConfirm,
  onOpenMissionsWeek,
  selectedSector,
  isSearchMode = false,
  onClearSearch
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const searchMissionsLength = isSearchMode ? missions.length : 0;

  // Revenir à la 1ère fiche quand le secteur ou la recherche change
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedSector, searchMissionsLength]);

  // Swipe mobile
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - (touchStartY.current || 0);
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0 && activeIndex < missions.length - 1) {
        setActiveIndex(prev => prev + 1);
      } else if (deltaX > 0 && activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleDragEnd = (_e: any, { offset }: any) => {
    const swipeThreshold = 35;
    if (offset.x < -swipeThreshold && activeIndex < missions.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else if (offset.x > swipeThreshold && activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < missions.length - 1) setActiveIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex(prev => prev - 1);
  };

  // --- États vides ---
  if (!missions || missions.length === 0) {
    if (isSearchMode) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(0, 255, 204, 0.08)',
            border: '1.5px dashed rgba(0, 255, 204, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', boxShadow: '0 0 20px rgba(0, 255, 204, 0.15)'
          }}>
            📡
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px', color: '#ffffff', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              SCAN TEMPOREL : AUCUNE MISSION TROUVÉE
            </h4>
            <p style={{ margin: 0, color: 'rgba(160, 174, 192, 0.8)', fontSize: '0.82rem', maxWidth: '340px', lineHeight: 1.4 }}>
              Aucune éco-mission ne correspond à votre fréquence de recherche dans les archives de l'Arche.
            </p>
          </div>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              style={{
                marginTop: '4px', padding: '8px 18px', borderRadius: '16px',
                background: 'rgba(0, 255, 204, 0.15)', border: '1px solid #00ffcc',
                color: '#00ffcc', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 0 12px rgba(0, 255, 204, 0.25)', transition: 'all 0.2s ease'
              }}
            >
              Effacer la recherche
            </button>
          )}
        </div>
      );
    }
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#00ffcc', textShadow: '0 0 10px #00ffcc', fontSize: '1.2rem' }}>DÉTECTION : AUCUNE MISSION</p>
      </div>
    );
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        /* ─── STRUCTURE CLÉ ───
         * height: 100% remplit le parent (body div de la modale).
         * Le parent a une hauteur calculée (flex: 1 dans une modale à hauteur explicite).
         * Cette div est ensuite un flex-column : stage en haut, dots en bas.
         */
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        perspective: '1200px',
        touchAction: 'pan-y',
        boxSizing: 'border-box',
      }}
    >
      {/* Flèches Desktop positionnées dans la zone du stage */}
      <button
        className="desktop-only"
        onClick={handlePrev}
        disabled={activeIndex === 0}
        style={{
          position: 'absolute',
          left: '3%',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(0,255,204,0.3)',
          color: activeIndex === 0 ? 'rgba(255,255,255,0.2)' : '#00ffcc',
          width: '42px', height: '42px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: activeIndex === 0 ? 'default' : 'pointer',
          boxShadow: activeIndex > 0 ? '0 0 12px rgba(0,255,204,0.2)' : 'none',
          transition: 'all 0.3s ease', fontSize: '1.3rem', pointerEvents: 'auto'
        }}
      >❮</button>

      <button
        className="desktop-only"
        onClick={handleNext}
        disabled={activeIndex === missions.length - 1}
        style={{
          position: 'absolute',
          right: '3%',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(0,255,204,0.3)',
          color: activeIndex === missions.length - 1 ? 'rgba(255,255,255,0.2)' : '#00ffcc',
          width: '42px', height: '42px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: activeIndex === missions.length - 1 ? 'default' : 'pointer',
          boxShadow: activeIndex < missions.length - 1 ? '0 0 12px rgba(0,255,204,0.2)' : 'none',
          transition: 'all 0.3s ease', fontSize: '1.3rem', pointerEvents: 'auto'
        }}
      >❯</button>

      {/* ─── STAGE des cartes : flex:1 remplit la hauteur disponible ─── */}
      <motion.div
        ref={containerRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{
          position: 'relative',
          width: 'min(340px, 94vw)',
          flex: 1,           /* remplit l'espace restant dans le flex-column */
          minHeight: 0,      /* permet à flex de réduire si nécessaire */
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <AnimatePresence>
          {missions.map((mission, index) => {
            const isActive = index === activeIndex;
            const offset = index - activeIndex;
            const absOffset = Math.abs(offset);
            if (absOffset > 2) return null;

            const zIndex = 100 - absOffset;
            const scale = isActive ? 1 : 0.72 - (absOffset * 0.08);
            const xPos = offset * 215;
            const zPos = isActive ? 0 : -120 - (absOffset * 50);
            const rotateY = offset * -30;
            const opacity = isActive ? 1 : Math.max(0, 0.55 - absOffset * 0.2);

            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, scale: 0.6, y: 60 }}
                animate={{ opacity, scale, x: xPos, y: 0, z: zPos, rotateY, zIndex }}
                exit={{ opacity: 0, scale: 0.6, y: -60 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                style={{
                  position: 'absolute',
                  transformStyle: 'preserve-3d',
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
              >
                <MissionCard3D
                  mission={mission}
                  isActive={isActive}
                  isImpulsing={loadingMissionId === mission.id}
                  onImpulse={onImpulse}
                  onCancelConfirm={onCancelConfirm}
                  onOpenMissionsWeek={onOpenMissionsWeek}
                  onClick={() => { if (!isActive) setActiveIndex(index); }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* ─── Barre de navigation : ❮ dots ❯ — flexShrink:0 reste en bas ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', zIndex: 100, flexShrink: 0,
        padding: '8px 0 10px',
      }}>
        <button
          type="button" onClick={handlePrev} disabled={activeIndex === 0}
          style={{
            background: 'none', border: 'none',
            color: activeIndex === 0 ? 'rgba(255,255,255,0.12)' : '#00ffcc',
            cursor: activeIndex === 0 ? 'default' : 'pointer',
            padding: '4px 8px', fontSize: '1rem',
            display: 'flex', alignItems: 'center', transition: 'color 0.2s ease'
          }}
          aria-label="Précédent"
        >❮</button>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {missions.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setActiveIndex(idx)}
              style={{
                width: idx === activeIndex ? '20px' : '6px',
                height: '6px', borderRadius: '3px',
                background: idx === activeIndex ? '#00ffcc' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                boxShadow: idx === activeIndex ? '0 0 8px #00ffcc' : 'none',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>

        <button
          type="button" onClick={handleNext} disabled={activeIndex === missions.length - 1}
          style={{
            background: 'none', border: 'none',
            color: activeIndex === missions.length - 1 ? 'rgba(255,255,255,0.12)' : '#00ffcc',
            cursor: activeIndex === missions.length - 1 ? 'default' : 'pointer',
            padding: '4px 8px', fontSize: '1rem',
            display: 'flex', alignItems: 'center', transition: 'color 0.2s ease'
          }}
          aria-label="Suivant"
        >❯</button>
      </div>
    </div>
  );
};
