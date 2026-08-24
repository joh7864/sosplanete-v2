import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MissionCard3D } from './MissionCard3D';

interface MissionsCarousel3DProps {
  missions: any[];
  loadingMissionId: number | null;
  onImpulse: (id: number) => void;
  onCancelConfirm: (actionDoneId: number, label: string) => void;
  selectedSector: string;
}

export const MissionsCarousel3D: React.FC<MissionsCarousel3DProps> = ({
  missions,
  loadingMissionId,
  onImpulse,
  onCancelConfirm,
  selectedSector
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Centrer sur la fiche du milieu uniquement lorsque le secteur change
  useEffect(() => {
    if (missions && missions.length > 0) {
      setActiveIndex(Math.floor(missions.length / 2));
    } else {
      setActiveIndex(0);
    }
  }, [selectedSector]); // On ne dépend QUE du selectedSector pour ne pas reset au polling

  // Robust Mobile Touch Swipe Handling
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

  // Handle Swipe/Drag logic for Framer Motion
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

  if (!missions || missions.length === 0) {
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
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '20px',
        paddingBottom: '20px',
        gap: '20px',
        overflow: 'hidden',
        perspective: '1200px',
        touchAction: 'pan-y'
      }}
    >
      {/* Desktop Navigation Arrows */}
      <button 
        onClick={handlePrev}
        disabled={activeIndex === 0}
        style={{
          position: 'absolute',
          left: '5%',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(0,255,204,0.3)',
          color: activeIndex === 0 ? 'rgba(255,255,255,0.2)' : '#00ffcc',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: activeIndex === 0 ? 'default' : 'pointer',
          boxShadow: activeIndex > 0 ? '0 0 15px rgba(0,255,204,0.2)' : 'none',
          transition: 'all 0.3s ease',
          fontSize: '1.5rem',
          pointerEvents: 'auto'
        }}
      >
        ❮
      </button>

      <button 
        onClick={handleNext}
        disabled={activeIndex === missions.length - 1}
        style={{
          position: 'absolute',
          right: '5%',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(0,255,204,0.3)',
          color: activeIndex === missions.length - 1 ? 'rgba(255,255,255,0.2)' : '#00ffcc',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: activeIndex === missions.length - 1 ? 'default' : 'pointer',
          boxShadow: activeIndex < missions.length - 1 ? '0 0 15px rgba(0,255,204,0.2)' : 'none',
          transition: 'all 0.3s ease',
          fontSize: '1.5rem',
          pointerEvents: 'auto'
        }}
      >
        ❯
      </button>

      {/* Cards Container */}
      <motion.div
        ref={containerRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{
          position: 'relative',
          width: '320px',
          height: 'min(460px, 66vh)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}
      >
        <AnimatePresence>
          {missions.map((mission, index) => {
            const isActive = index === activeIndex;
            const offset = index - activeIndex;
            const absOffset = Math.abs(offset);
            
            // Cover flow math (central card focus, others in watermark)
            const zIndex = 100 - absOffset;
            const scale = isActive ? 1 : 0.7 - (absOffset * 0.1);
            const xPos = offset * 220; // Increased spacing for visibility
            const zPos = isActive ? 0 : -150 - (absOffset * 50); 
            const rotateY = offset * -35; 
            const opacity = isActive ? 1 : Math.max(0, 0.6 - absOffset * 0.2); // Watermark effect

            // Render up to 2 cards on each side
            if (absOffset > 2) return null;

            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, scale: 0.5, y: 100 }}
                animate={{ 
                  opacity,
                  scale,
                  x: xPos,
                  y: 0,
                  z: zPos,
                  rotateY,
                  zIndex
                }}
                exit={{ opacity: 0, scale: 0.5, y: -100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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
                  onClick={() => {
                    if (!isActive) setActiveIndex(index);
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
      
      {/* HUD Paginator / Dots - Centered with equal spacing */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 100 }}>
        {missions.map((_, idx) => (
          <div 
            key={idx}
            onClick={() => setActiveIndex(idx)}
            style={{
              width: idx === activeIndex ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: idx === activeIndex ? '#00ffcc' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
              boxShadow: idx === activeIndex ? '0 0 10px #00ffcc' : 'none',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
    </div>
  );
};
