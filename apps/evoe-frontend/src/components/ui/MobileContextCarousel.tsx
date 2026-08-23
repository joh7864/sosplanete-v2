import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Droplet, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  BarChart3, 
  Radio,
  Globe
} from 'lucide-react';

interface ExtrapolationData {
  nbPlanetes: number;
  dateDepassement: string;
  dateDepassementSans: string;
  iceSavedKg?: number;
  co2RealTonnes?: number;
  forestFootballFields?: number;
  waterRealLitres?: number;
  waterOlympicPools?: number;
  wasteRealKg?: number;
  wasteGarbageTrucks?: number;
}

interface TeamData {
  id: string;
  name: string;
  color: string;
  icon?: string;
  propulsionType: string;
  position: number;
  co2: number;
  water: number;
  waste: number;
}

interface DashboardStatus {
  teams: TeamData[];
  schoolYear: string;
}

interface MobileContextCarouselProps {
  extrapolation: ExtrapolationData | null;
  dashboardStatus: DashboardStatus | null;
  showExtrapolation: boolean;
  setShowExtrapolation: (show: boolean) => void;
  showRadar: boolean;
  setShowRadar: (show: boolean) => void;
}

const fmtMassLocal = (kg: number): string => {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)} kt`;
  if (kg >= 1000)      return `${(kg / 1000).toFixed(1)} t`;
  return `${kg.toFixed(0)} kg`;
};

const fmtVolumeLocal = (litres: number): string => {
  if (litres >= 1_000_000) return `${(litres / 1_000_000).toFixed(1)} ML`;
  if (litres >= 1000)      return `${(litres / 1000).toFixed(1)} m³`;
  return `${litres.toFixed(0)} L`;
};

export default function MobileContextCarousel({
  extrapolation,
  dashboardStatus,
  setShowExtrapolation,
  setShowRadar
}: Omit<MobileContextCarouselProps, 'showExtrapolation' | 'showRadar'>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const totalCards = 2; // Card 1: Extrapolation, Card 2: Radar

  const handleDragEnd = (_: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      // Swipe left -> next card
      setActiveIndex((prev) => Math.min(prev + 1, totalCards - 1));
    } else if (info.offset.x > swipeThreshold) {
      // Swipe right -> prev card
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  // Trouver la team en tête
  const leadingTeam = dashboardStatus?.teams
    ? [...dashboardStatus.teams].sort((a, b) => b.position - a.position)[0]
    : null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '380px',
        zIndex: 1000,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Bouton de minimisation du carrousel */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        style={{
          alignSelf: 'center',
          background: 'rgba(10, 15, 30, 0.85)',
          border: '1px solid rgba(0, 255, 204, 0.3)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00ffcc',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          zIndex: 10
        }}
        title={isMinimized ? "Déployer le panneau" : "Réduire le panneau"}
      >
        {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      <AnimatePresence mode="wait">
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            style={{ width: '100%' }}
          >
            {/* Conteneur de carte draggable */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              style={{
                background: 'rgba(10, 15, 30, 0.8)',
                border: activeIndex === 0 ? '1.5px solid rgba(0, 255, 204, 0.4)' : '1.5px solid rgba(0, 179, 255, 0.4)',
                borderRadius: '16px',
                padding: '16px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: activeIndex === 0 
                  ? '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(0, 255, 204, 0.1)' 
                  : '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(0, 179, 255, 0.1)',
                color: '#fff',
                cursor: 'grab',
                touchAction: 'none'
              }}
              whileTap={{ cursor: 'grabbing' }}
            >
              {/* Carte 1 : Extrapolation */}
              {activeIndex === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00ffcc', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                      <Globe size={16} /> EXTRAPOLATION 2070
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      1 / 2
                    </span>
                  </div>

                  {extrapolation ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Section Terres / Jour dépassement */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,255,204,0.1)', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', color: '#a0aec0', textTransform: 'uppercase' }}>Planètes Requises</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#00ffcc', marginTop: '2px' }}>{extrapolation.nbPlanetes} 🌍</div>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,255,204,0.1)', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', color: '#a0aec0', textTransform: 'uppercase' }}>Jour de Dépassement</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#00ffcc', marginTop: '4px', textShadow: '0 0 5px rgba(0,255,204,0.3)' }}>{extrapolation.dateDepassement?.slice(0,5)}</div>
                        </div>
                      </div>

                      {/* Mini list of impacts */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aec0', padding: '4px 8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Shield size={12} color="#00ffcc" /> {fmtMassLocal(extrapolation.iceSavedKg || 0)} ❄️
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Droplet size={12} color="#00b3ff" /> {fmtVolumeLocal(extrapolation.waterRealLitres || 0)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={12} color="#ff9f43" /> {fmtMassLocal(extrapolation.wasteRealKg || 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#a0aec0', fontStyle: 'italic' }}>
                      Calcul de la projection temporelle...
                    </div>
                  )}

                  <button
                    onClick={() => setShowExtrapolation(true)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 255, 204, 0.15)',
                      border: '1px solid #00ffcc',
                      color: '#00ffcc',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 0 8px rgba(0,255,204,0.1)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <BarChart3 size={14} /> Voir le Rapport Complet
                  </button>
                </div>
              )}

              {/* Carte 2 : Radar / Vaisseaux */}
              {activeIndex === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00b3ff', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                      <Radio size={16} /> RADAR TEMPOREL
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      2 / 2
                    </span>
                  </div>

                  {leadingTeam ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,179,255,0.15)' }}>
                        <div style={{ fontSize: '0.65rem', color: '#a0aec0', textTransform: 'uppercase' }}>Vaisseau en Tête</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ color: leadingTeam.color || '#fff', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🚀 {leadingTeam.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#a0aec0', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                            {leadingTeam.propulsionType}
                          </span>
                        </div>
                      </div>

                      {/* Stats en tête */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aec0', padding: '4px 8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Shield size={12} color="#00ffcc" /> {fmtMassLocal(leadingTeam.co2 || 0)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Droplet size={12} color="#00b3ff" /> {fmtVolumeLocal(leadingTeam.water || 0)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={12} color="#ff9f43" /> {fmtMassLocal(leadingTeam.waste || 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#a0aec0', fontStyle: 'italic' }}>
                      Recherche des signatures thermiques...
                    </div>
                  )}

                  <button
                    onClick={() => setShowRadar(true)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 179, 255, 0.15)',
                      border: '1px solid #00b3ff',
                      color: '#00b3ff',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 0 8px rgba(0,179,255,0.1)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Radio size={14} /> Voir l'Avancement de la Flotte
                  </button>
                </div>
              )}
            </motion.div>

            {/* Indicateurs de pagination (Dots) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
              {Array.from({ length: totalCards }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    width: activeIndex === i ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    border: 'none',
                    background: activeIndex === i 
                      ? (i === 0 ? '#00ffcc' : '#00b3ff') 
                      : 'rgba(255,255,255,0.2)',
                    boxShadow: activeIndex === i 
                      ? (i === 0 ? '0 0 8px rgba(0,255,204,0.6)' : '0 0 8px rgba(0,179,255,0.6)') 
                      : 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
