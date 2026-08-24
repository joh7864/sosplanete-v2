import React from 'react';
import { motion } from 'framer-motion';

const parseBold = (text: string) => {
  if (!text) return text;
  const parts = text.split(/\*(.*?)\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
};

const formatRemainingTime = (dateString: string) => {
  if (!dateString) return '';
  const diff = new Date(dateString).getTime() - new Date().getTime();
  if (diff <= 0) return 'Expiré';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}m`;
};

interface ChallengeCard3DProps {
  challenge: any;
  mission?: any;
  isActive: boolean;
  isImpulsing: boolean;
  onRespond: (id: number, accept: boolean) => void;
  onImpulse: (id: number) => void;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const ChallengeCard3D: React.FC<ChallengeCard3DProps> = ({
  challenge,
  mission,
  isActive,
  isImpulsing,
  onRespond,
  onImpulse,
  onClick,
  style
}) => {
  const isReceived = challenge.type === 'received';
  const teamColor = isReceived ? challenge.challengerTeamColor : challenge.targetTeamColor;
  const teamName = isReceived ? challenge.challengerTeamName : challenge.targetTeamName;
  
  // Couleurs de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#ffd700';
      case 'ACCEPTED': return '#00b3ff';
      case 'SUCCESS': return '#10b981';
      case 'FAILED': return '#ff3b3b';
      default: return '#fff';
    }
  };
  
  const statusColor = getStatusColor(challenge.status);
  
  // Neon colors based on status
  const neonColor = challenge.status === 'SUCCESS' ? '#10b981' : (challenge.status === 'FAILED' ? '#ff3b3b' : teamColor || '#00ffcc');
  
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
        top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, transparent, ${neonColor}, transparent)`
      }} />

      {/* Header avec badges intégrés */}
      <div style={{
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: '6px', zIndex: 10 }}>
          <div style={{ background: isReceived ? 'rgba(0, 179, 255, 0.2)' : 'rgba(255, 59, 59, 0.2)', color: isReceived ? '#00b3ff' : '#ff3b3b', border: `1px solid ${isReceived ? '#00b3ff' : '#ff3b3b'}`, fontSize: '0.6rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
            {isReceived ? '📥 REÇU' : '📤 ENVOYÉ'}
          </div>
          <div style={{ background: `rgba(0,0,0,0.5)`, color: statusColor, border: `1px solid ${statusColor}`, fontSize: '0.6rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
            {challenge.status} {challenge.isRetroactive && '✨'}
          </div>
        </div>

        <div className="mission-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ 
            color: '#fff', 
            margin: 0,
            fontSize: '1.05rem',
            textShadow: '0 0 10px rgba(255,255,255,0.3)',
            flex: 1,
            lineHeight: '1.3'
          }}>
            {mission ? (mission.evoeMission?.titreSF || mission.label) : challenge.actionLabel}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <p style={{ color: '#a0aec0', fontSize: '0.75rem', margin: 0 }}>
              {isReceived ? 'De :' : 'Cible :'} <strong style={{ color: teamColor }}>{teamName}</strong>
            </p>
            {challenge.expiresAt && (challenge.status === 'PENDING' || challenge.status === 'ACCEPTED') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#ffd700' }}>
                <span>⏳</span>
                <strong>{formatRemainingTime(challenge.expiresAt)}</strong>
              </div>
            )}
          </div>

          {mission && (
            <p style={{ 
              color: 'rgba(255,255,255,0.85)', 
              fontSize: '0.8rem', 
              lineHeight: '1.4',
              margin: '6px 0 0 0'
            }}>
              {parseBold(mission.evoeMission?.descriptionSF || mission.description || "")}
            </p>
          )}
          
          <div style={{ 
            background: 'rgba(255, 159, 67, 0.1)', 
            borderLeft: '3px solid #ff9f43',
            padding: '6px 10px',
            borderRadius: '0 6px 6px 0',
            marginTop: '8px'
          }}>
            <p style={{ 
              color: '#ff9f43', 
              fontSize: '0.8rem', 
              fontStyle: 'italic',
              margin: 0
            }}>
              <strong>Gage :</strong> {challenge.pledge}
            </p>
          </div>
        </div>

        {/* Bandes de Métriques / Impact */}
        {mission && (
          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '8px 10px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
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
              <span style={{ fontSize: '0.6rem', color: '#a0aec0', textTransform: 'uppercase' }}>HP (x2)</span>
              <span style={{ color: '#ff3b3b', fontWeight: 'bold', fontSize: '0.8rem' }}>+{(mission.hp || mission.pointsHP || mission.points || (mission.evoeMission?.amplitude || 10)) * 2}</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {isActive && (
          <div style={{ marginTop: '10px' }}>
            {isReceived && challenge.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onRespond(challenge.id, true); }}
                  style={{ flex: 1, padding: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  ACCEPTER
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onRespond(challenge.id, false); }}
                  style={{ flex: 1, padding: '10px', background: 'rgba(255, 59, 59, 0.15)', border: '1px solid #ff3b3b', color: '#ff3b3b', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  DÉCLINER
                </button>
              </div>
            )}
            
            {isReceived && challenge.status === 'ACCEPTED' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onImpulse(challenge.localActionId); }}
                disabled={isImpulsing}
                style={{ width: '100%', padding: '10px', background: 'rgba(0, 255, 204, 0.15)', border: '1px solid #00ffcc', color: '#00ffcc', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: isImpulsing ? 'wait' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {isImpulsing ? '⚡ IMPULSION...' : 'IMPULSER LA MISSION'}
              </button>
            )}
            
            {challenge.status === 'SUCCESS' && (
              <div style={{ width: '100%', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold' }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span> DÉFI RÉUSSI
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
