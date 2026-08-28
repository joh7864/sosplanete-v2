import React from 'react';
import { motion } from 'framer-motion';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

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
  
  // Neon colors
  const neonColor = isCompleted ? '#10b981' : (mission.isChallengeActif ? '#ff3b3b' : '#00ffcc');
  const autoIT = 10 + Math.round((12 * (mission.co2 ?? 0)) + (4 * (mission.waste ?? 0)) + (0.04 * (mission.water ?? 0)));
  const itPoints = mission.evoeMission?.amplitude || mission.pointsIT || autoIT;

  // Extraction propre de la consigne et de l'objectif
  const rawDesc = (mission.evoeMission?.descriptionSF || mission.description || '').trim();
  let introText = rawDesc;
  let objectiveText = mission.label || 'Accomplir l\'action';

  if (rawDesc.includes('Objectif :')) {
    const parts = rawDesc.split('Objectif :');
    introText = parts[0].trim();
    objectiveText = parts[1].trim().replace(/\*\*/g, '');
  } else if (rawDesc.includes('ta mission est de :') || rawDesc.includes('ta mission est d\'accomplir')) {
    introText = rawDesc;
    objectiveText = mission.label;
  }

  // Si pas de texte d'intro, fallback élégant
  if (!introText || !isNaN(Number(introText))) {
    introText = "Directive prioritaire de l'Arche pour stabiliser la matrice :";
  }

  const rawIcon = mission.icon || mission.image || mission.icone;
  const isImageFile = Boolean(rawIcon && typeof rawIcon === 'string' && (
    rawIcon.includes('.') || rawIcon.startsWith('http') || rawIcon.startsWith('data:') || rawIcon.includes('/')
  ));
  const imgSrc = isImageFile
    ? (rawIcon.startsWith('http') || rawIcon.startsWith('data:')
        ? rawIcon
        : `${EVOE_IMG_URL}${rawIcon.startsWith('/') ? rawIcon.slice(1) : rawIcon}`)
    : null;
    
  return (
    <motion.div
      id={isActive ? "hud-active-mission-card" : undefined}
      onClick={onClick}
      style={{
        width: 'min(330px, 86vw)',
        height: 'min(490px, 72vh)',
        borderRadius: '24px',
        background: 'rgba(8, 14, 28, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1.5px solid ${isActive ? `${neonColor}80` : 'rgba(255, 255, 255, 0.1)'}`,
        boxShadow: isActive 
          ? `0 0 35px ${neonColor}40, inset 0 0 20px ${neonColor}20` 
          : '0 10px 30px rgba(0,0,0,0.6)',
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
      {/* Top subtle glow banner */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, #00ffcc, #d946ef)`,
        opacity: isActive ? 1 : 0.4
      }} />

      {/* 1. Haut : Titre + Badge IT */}
      <div style={{
        padding: '14px 16px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        borderBottom: '1px solid rgba(0, 255, 204, 0.15)',
        background: 'rgba(0, 255, 204, 0.03)'
      }}>
        <h3 style={{
          margin: 0,
          color: '#ffffff',
          fontSize: '0.98rem',
          fontWeight: 800,
          lineHeight: 1.25,
          letterSpacing: '0.3px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textShadow: isActive ? `0 0 10px rgba(0, 255, 204, 0.4)` : 'none'
        }}>
          {mission.evoeMission?.titreSF || mission.label}
        </h3>

        {/* Badge IT uniquement (logo IT + points) */}
        <div style={{
          padding: '4px 10px',
          borderRadius: '12px',
          background: 'rgba(217, 70, 239, 0.15)',
          border: '1px solid rgba(217, 70, 239, 0.5)',
          color: '#f0abfc',
          fontSize: '0.8rem',
          fontWeight: 900,
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          flexShrink: 0,
          boxShadow: '0 0 10px rgba(217, 70, 239, 0.2)'
        }}>
          <span style={{ fontSize: '0.9rem' }}>⚙️</span>
          <span>{itPoints} IT</span>
        </div>
      </div>

      {/* 2 & 3. Centre : Grand Portail Holographique Agrandie + Briefing & Objectif, parfaitement centrés en hauteur */}
      <div style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        gap: '10px'
      }}>
        {/* Grand Portail Holographique avec l'Illustration 3D Agrandie */}
        <div style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: '1.5px solid rgba(0, 255, 204, 0.35)',
          boxShadow: '0 0 32px rgba(0, 255, 204, 0.25), inset 0 0 22px rgba(0, 255, 204, 0.15)',
          background: 'radial-gradient(circle, rgba(0, 255, 204, 0.12) 0%, rgba(8, 14, 28, 0.8) 70%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {/* Ligne d'orbite rotative subtle */}
          <div style={{
            position: 'absolute',
            inset: '6px',
            borderRadius: '50%',
            border: '1px dashed rgba(0, 255, 204, 0.4)',
            pointerEvents: 'none'
          }} />

          {imgSrc && !imgError ? (
            <img 
              src={imgSrc} 
              alt={mission.label}
              onError={() => setImgError(true)}
              style={{
                width: '175px',
                height: '175px',
                objectFit: 'contain',
                zIndex: 2,
                filter: 'drop-shadow(0 0 16px rgba(0, 255, 204, 0.55))'
              }}
            />
          ) : (
            <span style={{ fontSize: '4.5rem', zIndex: 2 }}>{rawIcon || '⚡'}</span>
          )}
        </div>

        {/* Corps : Briefing & Objectif bien mis en valeur */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          textAlign: 'center',
          width: '100%'
        }}>
          <p style={{
            margin: 0,
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '0.82rem',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {introText}
          </p>

          <p style={{
            margin: 0,
            color: '#00ffcc',
            fontSize: '0.85rem',
            fontWeight: 700,
            lineHeight: 1.28,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 0 8px rgba(0, 255, 204, 0.3)'
          }}>
            Objectif : {objectiveText}
          </p>
        </div>
      </div>

      {/* 4. Bas : 3 Pilules d'Impacts & Bouton d'Action */}
      <div style={{
        padding: '6px 16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Les 3 Pilules d'impacts écologiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px'
        }}>
          {/* CO2 */}
          <div style={{
            background: 'rgba(0, 255, 204, 0.08)',
            border: '1px solid rgba(0, 255, 204, 0.35)',
            borderRadius: '12px',
            padding: '6px 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '0.85rem' }}>☁️</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>CO2</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#00ffcc' }}>{mission.co2 ?? '0'}kg</span>
            </div>
          </div>

          {/* Eau */}
          <div style={{
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(14, 165, 233, 0.35)',
            borderRadius: '12px',
            padding: '6px 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '0.85rem' }}>💧</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Eau</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8' }}>{mission.water ?? '0'}L</span>
            </div>
          </div>

          {/* Déchets */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '12px',
            padding: '6px 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '0.85rem' }}>🗑️</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Déchets</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b' }}>{mission.waste ?? '0'}kg</span>
            </div>
          </div>
        </div>

        {/* Bouton d'Action : Uniquement "IMPULSER" */}
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
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  fontSize: '0.85rem',
                  fontWeight: 900,
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
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00ffcc 0%, #00e5ff 100%)',
                  color: '#06101e',
                  fontSize: '0.92rem',
                  fontWeight: 900,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  cursor: isImpulsing ? 'wait' : 'pointer',
                  boxShadow: '0 0 25px rgba(0, 255, 204, 0.45)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {isImpulsing ? (
                  <span>⚡ ANALYSE EN COURS...</span>
                ) : (
                  <span>IMPULSER</span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

