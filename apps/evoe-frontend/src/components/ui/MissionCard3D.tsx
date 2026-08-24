import React from 'react';
import { motion } from 'framer-motion';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

// Helper pour parser les **bold** en HTML
const parseBold = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

interface MissionCard3DProps {
  mission: any;
  isActive: boolean;
  isImpulsing: boolean;
  onImpulse: (id: number) => void;
  onCancelConfirm: (actionDoneId: number, label: string) => void;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const MissionCard3D: React.FC<MissionCard3DProps> = ({
  mission,
  isActive,
  isImpulsing,
  onImpulse,
  onCancelConfirm,
  onClick,
  style
}) => {
  const [imgError, setImgError] = React.useState(false);
  const isCompleted = mission.evoeMission?.isImpulsed;
  
  // Neon colors based on status
  const neonColor = isCompleted ? '#10b981' : (mission.isChallengeActif ? '#ff3b3b' : '#00ffcc');
  
  // Préparation de la description avec synthèse en gras
  let desc = mission.evoeMission?.descriptionSF || mission.description || '';
  // Si la description est vide ou est un nombre (ex: "28")
  if (!desc || !isNaN(Number(desc))) {
    desc = `Mission prioritaire : **${mission.label}**`;
  } else if (typeof desc === 'string' && !desc.includes('**')) {
    // S'il n'y a pas de gras, on ajoute le label en gras à la fin
    desc = `${desc}\n\nObjectif : **${mission.label}**`;
  }
  
  return (
    <motion.div
      onClick={onClick}
      style={{
        width: 'min(330px, 86vw)',
        height: 'min(460px, 66vh)',
        borderRadius: '20px',
        background: 'rgba(10, 15, 30, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        boxShadow: isActive 
          ? `0 0 30px ${neonColor}40, inset 0 0 20px ${neonColor}20` 
          : '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        ...style
      }}
      whileHover={isActive ? { scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Glow Effect Top */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '200px',
        height: '100px',
        background: neonColor,
        filter: 'blur(60px)',
        opacity: isActive ? 0.5 : 0.1,
        pointerEvents: 'none'
      }} />

      {/* Header / Image area */}
      <div style={{
        position: 'relative',
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
        padding: '12px 16px',
        overflow: 'hidden'
      }}>
        <div className="mission-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {mission.icon && !imgError && (
            <img 
              src={`${EVOE_IMG_URL}${mission.icon}`} 
              alt="" 
              className="mission-icon"
              onError={() => setImgError(true)}
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'contain',
                filter: `drop-shadow(0 0 5px ${neonColor})`,
              }} 
            />
          )}
          <h3 style={{ 
            color: '#fff', 
            margin: 0,
            fontSize: '1.05rem',
            lineHeight: '1.3',
            textShadow: '0 0 10px rgba(255,255,255,0.3)',
            flex: 1
          }}>
            {mission.evoeMission?.titreSF || mission.label}
          </h3>
        </div>
      </div>

      {/* Badges */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
        {mission.isChallengeActif && (
          <div style={{ background: '#ff3b3b', color: '#fff', fontSize: '0.65rem', padding: '3px 6px', borderRadius: '6px', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255,59,59,0.5)' }}>
            ⚔️ DÉFI
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '8px', paddingRight: '2px' }}>
          <p style={{ 
            color: 'rgba(255,255,255,0.85)', 
            fontSize: '0.82rem', 
            lineHeight: '1.4',
            margin: 0
          }}>
            {parseBold(desc)}
          </p>
        </div>

        {/* Bandes de Métriques / Impact */}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '8px 10px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', color: '#a0aec0', textTransform: 'uppercase' }}>CO2e</span>
            <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '0.8rem' }}>{mission.co2 ?? mission.savedCo2 ?? mission.co2e ?? mission.defaultCo2 ?? 0} kg</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', color: '#a0aec0', textTransform: 'uppercase' }}>Eau</span>
            <span style={{ color: '#00b3ff', fontWeight: 'bold', fontSize: '0.8rem' }}>{mission.water ?? mission.savedWater ?? mission.eau ?? mission.defaultWater ?? 0} L</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', color: '#a0aec0', textTransform: 'uppercase' }}>Déchets</span>
            <span style={{ color: '#ff9f43', fontWeight: 'bold', fontSize: '0.8rem' }}>{mission.waste ?? mission.savedWaste ?? mission.dechet ?? mission.defaultWaste ?? 0} kg</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            <span style={{ fontSize: '0.6rem', color: '#a0aec0', textTransform: 'uppercase' }}>HP</span>
            <span style={{ color: '#ff3b3b', fontWeight: 'bold', fontSize: '0.8rem' }}>+{(mission.hp || mission.pointsHP || mission.points || (mission.evoeMission?.amplitude || 10))}</span>
          </div>
        </div>

        {/* Action Button */}
        {isActive && (
          <div style={{ marginTop: '10px' }}>
            {isCompleted ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelConfirm(mission.evoeMission.actionDoneId, mission.label);
                }}
                disabled={isImpulsing}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${neonColor}`,
                  background: `rgba(16, 185, 129, 0.1)`,
                  color: '#10b981',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  cursor: isImpulsing ? 'wait' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isImpulsing ? <span>⚡ ANALYSE...</span> : <><span>✓</span> DÉJÀ IMPULSÉ</>}
              </button>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onImpulse(mission.id);
                }}
                disabled={isImpulsing}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${neonColor}`,
                  background: `rgba(0, 255, 204, 0.1)`,
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  cursor: isImpulsing ? 'wait' : 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: `0 0 20px ${neonColor}30`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isImpulsing ? (
                  <span>⚡ ANALYSE EN COURS...</span>
                ) : (
                  <>
                    <span>IMPULSER</span>
                    <span style={{ color: neonColor }}>+{mission.evoeMission?.amplitude || 10} IT</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
