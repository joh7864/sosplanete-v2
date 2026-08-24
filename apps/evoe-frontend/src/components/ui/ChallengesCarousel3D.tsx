import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChallengeCard3D } from './ChallengeCard3D';

interface ChallengesCarousel3DProps {
  receivedChallenges: any[];
  sentChallenges: any[];
  missions: any[];
  loadingMissionId: number | null;
  onRespond: (id: number, accept: boolean) => void;
  onImpulse: (id: number) => void;
  onSendChallenge: () => void;
}

export const ChallengesCarousel3D: React.FC<ChallengesCarousel3DProps> = ({
  receivedChallenges,
  sentChallenges,
  missions,
  loadingMissionId,
  onRespond,
  onImpulse,
  onSendChallenge
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [filterType, setFilterType] = useState<'received' | 'sent'>('received');
  
  const allChallenges = filterType === 'received' 
    ? receivedChallenges.map(ch => ({ ...ch, type: 'received' }))
    : sentChallenges.map(ch => ({ ...ch, type: 'sent' }));
  
  // Si le tableau change et que l'index devient hors limites
  useEffect(() => {
    if (allChallenges.length > 0 && activeIndex >= allChallenges.length) {
      setActiveIndex(0);
    }
  }, [allChallenges.length, activeIndex]);

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
      if (deltaX < 0 && activeIndex < allChallenges.length - 1) {
        setActiveIndex(prev => prev + 1);
      } else if (deltaX > 0 && activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleNext = () => {
    if (activeIndex < allChallenges.length - 1) setActiveIndex(activeIndex + 1);
  };
  
  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

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
        paddingTop: '16px',
        paddingBottom: '16px',
        gap: '16px',
        overflow: 'hidden',
        perspective: '1000px',
        touchAction: 'pan-y'
      }}
    >
      {/* Background ambient light */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(0,255,204,0.1) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Top Floating Dock Menu (3 Icon Buttons with Tooltips) - Width aligned with Card */}
      <div style={{ zIndex: 100 }}>
        <div style={{
          width: 'min(330px, 86vw)',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4px',
          background: 'rgba(10, 15, 30, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 255, 204, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(0, 255, 204, 0.08)',
          borderRadius: '30px',
          padding: '4px 6px'
        }}>
          {/* Button 1: Reçus */}
          <button
            title={`Défis reçus (${receivedChallenges.length})`}
            onClick={() => { setFilterType('received'); setActiveIndex(0); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              flex: 1,
              background: filterType === 'received' ? 'rgba(0, 179, 255, 0.2)' : 'transparent',
              border: `1px solid ${filterType === 'received' ? '#00b3ff' : 'transparent'}`,
              color: filterType === 'received' ? '#00b3ff' : 'rgba(255,255,255,0.6)',
              padding: '5px 6px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              transition: 'all 0.3s ease',
              boxShadow: filterType === 'received' ? '0 0 10px rgba(0,179,255,0.4)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>📥</span>
            <span>Reçus</span>
            <span style={{
              background: filterType === 'received' ? '#00b3ff' : 'rgba(255,255,255,0.15)',
              color: filterType === 'received' ? '#000' : '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '8px'
            }}>
              {receivedChallenges.length}
            </span>
          </button>

          {/* Button 2: Envoyés */}
          <button
            title={`Défis envoyés (${sentChallenges.length})`}
            onClick={() => { setFilterType('sent'); setActiveIndex(0); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              flex: 1,
              background: filterType === 'sent' ? 'rgba(255, 59, 59, 0.2)' : 'transparent',
              border: `1px solid ${filterType === 'sent' ? '#ff3b3b' : 'transparent'}`,
              color: filterType === 'sent' ? '#ff3b3b' : 'rgba(255,255,255,0.6)',
              padding: '5px 6px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              transition: 'all 0.3s ease',
              boxShadow: filterType === 'sent' ? '0 0 10px rgba(255,59,59,0.4)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>📤</span>
            <span>Envoyés</span>
            <span style={{
              background: filterType === 'sent' ? '#ff3b3b' : 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '8px'
            }}>
              {sentChallenges.length}
            </span>
          </button>

          {/* Separator */}
          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 1px' }} />

          {/* Button 3: Lancer un défi */}
          <button
            title="Lancer un nouveau défi temporel"
            onClick={onSendChallenge}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.25), rgba(0, 179, 255, 0.25))',
              border: '1px solid #00ffcc',
              color: '#00ffcc',
              padding: '5px 10px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 10px rgba(0,255,204,0.3)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(0,255,204,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,204,0.3)';
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>⚔️</span>
            <span>+ Défi</span>
          </button>
        </div>
      </div>

      {allChallenges.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', zIndex: 10 }}>
          <p style={{ margin: 0, fontSize: '1rem' }}>
            {filterType === 'received' ? 'Aucun défi reçu pour le moment.' : 'Aucun défi envoyé pour le moment.'}
          </p>
          <button
            onClick={onSendChallenge}
            style={{
              background: 'rgba(0,255,204,0.15)',
              border: '1px solid #00ffcc',
              color: '#00ffcc',
              padding: '8px 20px',
              borderRadius: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🚀 Lancer un défi maintenant
          </button>
        </div>
      ) : (
        <>
          {/* Navigation Buttons (Desktop) */}
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
            disabled={activeIndex === allChallenges.length - 1}
            style={{
              position: 'absolute',
              right: '5%',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1001,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(0,255,204,0.3)',
              color: activeIndex === allChallenges.length - 1 ? 'rgba(255,255,255,0.2)' : '#00ffcc',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: activeIndex === allChallenges.length - 1 ? 'default' : 'pointer',
              boxShadow: activeIndex < allChallenges.length - 1 ? '0 0 15px rgba(0,255,204,0.2)' : 'none',
              transition: 'all 0.3s ease',
              fontSize: '1.5rem',
              pointerEvents: 'auto'
            }}
          >
            ❯
          </button>

          {/* Cards Container */}
          <div style={{ position: 'relative', width: '320px', height: 'min(460px, 66vh)', zIndex: 10 }}>
            <AnimatePresence initial={false}>
              {allChallenges.map((challenge, index) => {
                const isActive = index === activeIndex;
                const diff = index - activeIndex;
                
                // Calculs 3D
                const x = diff * 220; 
                const scale = isActive ? 1 : 0.85;
                const zIndex = 100 - Math.abs(diff);
                const opacity = Math.abs(diff) > 2 ? 0 : (isActive ? 1 : 0.5);
                const rotateY = diff * -15; 
                
                if (opacity === 0) return null;

                return (
                  <motion.div
                    key={challenge.id + challenge.type}
                    initial={{ opacity: 0, x: x + (diff > 0 ? 50 : -50) }}
                    animate={{ 
                      opacity, 
                      x, 
                      scale, 
                      rotateY,
                      zIndex
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      pointerEvents: isActive ? 'auto' : 'none'
                    }}
                  >
                    <ChallengeCard3D
                      challenge={challenge}
                      mission={missions.find(m => m.id === challenge.localActionId)}
                      isActive={isActive}
                      isImpulsing={loadingMissionId === challenge.localActionId}
                      onRespond={onRespond}
                      onImpulse={onImpulse}
                      onClick={() => {
                        if (!isActive) setActiveIndex(index);
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {/* HUD Paginator / Dots - Centered below cards with equal spacing */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 100 }}>
            {allChallenges.map((_, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveIndex(idx)}
                style={{
                  width: idx === activeIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === activeIndex ? '#00ffcc' : 'rgba(255,255,255,0.2)',
                  boxShadow: idx === activeIndex ? '0 0 10px #00ffcc' : 'none',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
