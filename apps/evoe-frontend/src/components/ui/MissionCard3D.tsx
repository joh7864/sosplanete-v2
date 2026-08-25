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
      id={isActive ? "hud-active-mission-card" : undefined}
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
        filter: 'blur(40px)',
        opacity: isActive ? 0.3 : 0.05,
        pointerEvents: 'none'
      }} />

      {/* Header : Image / Icon + Title */}
      <div style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        {/* Mission Icon/Image */}
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: 'rgba(0, 255, 204, 0.08)',
          border: `1px solid ${neonColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {mission.image && !imgError ? (
            <img 
              src={mission.image.startsWith('http') ? mission.image : `${EVOE_IMG_URL}${mission.image}`} 
              alt={mission.label}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '1.4rem' }}>{mission.icone || '⚡'}</span>
          )}
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0,
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 'bold',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: isActive ? `0 0 10px ${neonColor}60` : 'none'
          }}>
            {mission.evoeMission?.titreSF || mission.label}
          </h3>
        </div>
      </div>

      {/* Content : Description */}
      <div style={{
        padding: '16px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.88rem',
          lineHeight: 1.5,
          overflowY: 'auto',
          maxHeight: '160px',
          paddingRight: '4px',
          whiteSpace: 'pre-line'
        }}>
          {parseBold(desc)}
        </div>

        {/* Impact Indicators */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '8px 6px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CO2e</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00ffcc' }}>{mission.co2 ?? '0'} kg</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Eau</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00b3ff' }}>{mission.water ?? '0'} L</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Déchets</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f59e0b' }}>{mission.waste ?? '0'} kg</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HP</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ef4444' }}>+{mission.evoeMission?.amplitude || 10}</span>
          </div>
        </div>

        {/* Action Button */}
        {isActive && (
          <div>
            {isCompleted ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelConfirm(mission.evoeMission?.actionDoneId, mission.evoeMission?.titreSF || mission.label);
                }}
                disabled={isImpulsing}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: isImpulsing ? 'wait' : 'pointer',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
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
                id="btn-impulser-mission"
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
