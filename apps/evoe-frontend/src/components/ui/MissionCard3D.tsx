import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

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
  const [showFullBriefing, setShowFullBriefing] = React.useState(false);
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

  const fullMissionTitle = mission.evoeMission?.titreSF || mission.label;

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
        width: 'min(330px, 88vw)',
        height: 'min(490px, 74vh)',
        maxHeight: '520px',
        borderRadius: '24px',
        background: isCompleted 
          ? 'rgba(6, 10, 18, 0.8)' 
          : 'rgba(8, 14, 28, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: isCompleted
          ? '1.5px solid rgba(255, 255, 255, 0.12)'
          : `1.5px solid ${isActive ? `${neonColor}80` : 'rgba(255, 255, 255, 0.1)'}`,
        boxShadow: isCompleted
          ? '0 10px 30px rgba(0, 0, 0, 0.85)'
          : (isActive ? `0 0 35px ${neonColor}40, inset 0 0 20px ${neonColor}20` : '0 10px 30px rgba(0,0,0,0.6)'),
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        filter: isCompleted ? 'grayscale(100%) opacity(0.55)' : 'none',
        ...style
      }}
      whileHover={isActive && !isCompleted ? { scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Top subtle glow banner */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: isCompleted
          ? 'rgba(255, 255, 255, 0.08)'
          : `linear-gradient(90deg, #00ffcc, #d946ef)`,
        opacity: isActive ? 1 : 0.4
      }} />

      {/* 1. Haut : Titre + Badge IT épuré */}
      <div style={{
        padding: '10px 14px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        borderBottom: isCompleted ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 255, 204, 0.15)',
        background: isCompleted ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 255, 204, 0.03)',
        flexShrink: 0
      }}>
        <h3 style={{
          margin: 0,
          color: isCompleted ? 'rgba(255, 255, 255, 0.65)' : '#ffffff',
          fontSize: '0.92rem',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '0.3px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textShadow: isActive && !isCompleted ? `0 0 10px rgba(0, 255, 204, 0.4)` : 'none'
        }}>
          {fullMissionTitle}
        </h3>

        {/* Badge IT (Grisé sobre si accomplie, Violet sinon) */}
        <div style={{
          padding: '3px 8px',
          borderRadius: '10px',
          background: isCompleted ? 'rgba(255, 255, 255, 0.06)' : 'rgba(217, 70, 239, 0.15)',
          border: isCompleted ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(217, 70, 239, 0.5)',
          color: isCompleted ? 'rgba(255, 255, 255, 0.65)' : '#f0abfc',
          fontSize: '0.78rem',
          fontWeight: 900,
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexShrink: 0,
          boxShadow: 'none'
        }}>
          <span style={{ fontSize: '0.85rem' }}>{isCompleted ? '✓' : '⚙️'}</span>
          <span>{itPoints} IT</span>
        </div>
      </div>

      {/* 2 & 3. Centre : Grand Portail Holographique avec bouton "!" + Briefing & Objectif aérés */}
      <div style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 14px',
        gap: '6px',
        position: 'relative',
        overflowY: 'auto',
        minHeight: 0
      }}>
        {/* Bouton "!" Premium justifié à droite dans l'espace image */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowFullBriefing(true);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Briefing complet"
          style={{
            position: 'absolute',
            top: '2px',
            right: '8px',
            zIndex: 10,
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: isCompleted ? 'rgba(255, 255, 255, 0.08)' : 'rgba(8, 14, 28, 0.85)',
            border: isCompleted ? '1px solid rgba(255, 255, 255, 0.25)' : '1.5px solid #00ffcc',
            color: isCompleted ? 'rgba(255, 255, 255, 0.7)' : '#00ffcc',
            fontSize: '0.8rem',
            fontWeight: 900,
            fontFamily: 'monospace, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isCompleted ? 'none' : '0 0 14px rgba(0, 255, 204, 0.4), inset 0 0 8px rgba(0, 255, 204, 0.2)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          !
        </button>

        {/* Grand Portail Holographique avec dimensionnement dynamique */}
        <div style={{
          width: 'clamp(115px, 19vh, 180px)',
          height: 'clamp(115px, 19vh, 180px)',
          borderRadius: '50%',
          border: isCompleted ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid rgba(0, 255, 204, 0.35)',
          boxShadow: isCompleted 
            ? 'none' 
            : '0 0 28px rgba(0, 255, 204, 0.25), inset 0 0 18px rgba(0, 255, 204, 0.15)',
          background: isCompleted
            ? 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, rgba(6, 10, 18, 0.9) 70%)'
            : 'radial-gradient(circle, rgba(0, 255, 204, 0.12) 0%, rgba(8, 14, 28, 0.8) 70%)',
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
            inset: '5px',
            borderRadius: '50%',
            border: isCompleted ? '1px dashed rgba(255, 255, 255, 0.12)' : '1px dashed rgba(0, 255, 204, 0.4)',
            pointerEvents: 'none'
          }} />

          {imgSrc && !imgError ? (
            <img 
              src={imgSrc} 
              alt={mission.label}
              onError={() => setImgError(true)}
              style={{
                width: '85%',
                height: '85%',
                objectFit: 'contain',
                zIndex: 2,
                filter: isCompleted 
                  ? 'grayscale(100%) opacity(0.55)' 
                  : 'drop-shadow(0 0 14px rgba(0, 255, 204, 0.55))'
              }}
            />
          ) : (
            <span style={{ fontSize: 'clamp(2.4rem, 4.5vh, 3.8rem)', zIndex: 2 }}>{rawIcon || '⚡'}</span>
          )}
        </div>

        {/* Corps : Briefing & Objectif aérés (version épurée) */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setShowFullBriefing(true);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            textAlign: 'center',
            width: '100%',
            cursor: 'pointer'
          }}
        >
          <p style={{
            margin: 0,
            color: isCompleted ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.85)',
            fontSize: 'clamp(0.72rem, 1.35vh, 0.82rem)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {introText}
          </p>

          <p style={{
            margin: 0,
            color: isCompleted ? 'rgba(255, 255, 255, 0.65)' : '#00ffcc',
            fontSize: 'clamp(0.76rem, 1.45vh, 0.85rem)',
            fontWeight: 700,
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: isCompleted ? 'none' : '0 0 8px rgba(0, 255, 204, 0.3)'
          }}>
            Objectif : {objectiveText}
          </p>
        </div>
      </div>

      {/* 4. Bas : 3 Pilules d'Impacts & Bouton d'Action */}
      <div style={{
        padding: '4px 14px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flexShrink: 0
      }}>
        {/* Les 3 Pilules d'impacts écologiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px'
        }}>
          {/* CO2 */}
          <div style={{
            background: isCompleted ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 255, 204, 0.08)',
            border: isCompleted ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 255, 204, 0.35)',
            borderRadius: '12px',
            padding: '6px 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '0.85rem', opacity: isCompleted ? 0.6 : 1 }}>☁️</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.6rem', color: isCompleted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>CO2</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isCompleted ? 'rgba(255,255,255,0.6)' : '#00ffcc' }}>{mission.co2 ?? '0'}kg</span>
            </div>
          </div>

          {/* Eau */}
          <div style={{
            background: isCompleted ? 'rgba(255, 255, 255, 0.03)' : 'rgba(14, 165, 233, 0.08)',
            border: isCompleted ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(14, 165, 233, 0.35)',
            borderRadius: '12px',
            padding: '6px 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '0.85rem', opacity: isCompleted ? 0.6 : 1 }}>💧</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.6rem', color: isCompleted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Eau</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isCompleted ? 'rgba(255,255,255,0.6)' : '#38bdf8' }}>{mission.water ?? '0'}L</span>
            </div>
          </div>

          {/* Déchets */}
          <div style={{
            background: isCompleted ? 'rgba(255, 255, 255, 0.03)' : 'rgba(245, 158, 11, 0.08)',
            border: isCompleted ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '12px',
            padding: '6px 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '0.85rem', opacity: isCompleted ? 0.6 : 1 }}>🗑️</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.6rem', color: isCompleted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Déchets</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isCompleted ? 'rgba(255,255,255,0.6)' : '#f59e0b' }}>{mission.waste ?? '0'}kg</span>
            </div>
          </div>
        </div>

        {/* Bouton d'Action : "DÉSIMPULSER" ou "IMPULSER" */}
        {isActive && (
          <div>
            {isCompleted ? (
              <button 
                id="btn-desimpulser-mission"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelConfirm(mission.evoeMission?.actionDoneId, mission.evoeMission?.titreSF || mission.label);
                }}
                disabled={isImpulsing}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  cursor: isImpulsing ? 'wait' : 'pointer',
                  boxShadow: 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.color = '#ff6b6b';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                }}
              >
                <RotateCcw size={14} />
                <span>{isImpulsing ? 'ANNULATION...' : 'DÉSIMPULSER'}</span>
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

      {/* Full Holographic Briefing Overlay (Mobile Tap & Desktop Click on ! or text) */}
      <AnimatePresence>
        {showFullBriefing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowFullBriefing(false);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'rgba(4, 9, 20, 0.96)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: '24px',
              border: '1.5px solid rgba(0, 255, 204, 0.6)',
              boxShadow: '0 0 45px rgba(0, 255, 204, 0.35)',
            }}
          >
            {/* Header with Title and Close Button */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#00ffcc', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  📋 Briefing Stratégique Évoé
                </span>
                <h4 style={{ margin: '4px 0 0', color: '#fff', fontSize: '1.02rem', fontWeight: 800, lineHeight: 1.25 }}>
                  {fullMissionTitle}
                </h4>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullBriefing(false);
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Briefing Content */}
            <div style={{
              margin: '10px 0',
              padding: '12px',
              borderRadius: '14px',
              background: 'rgba(0, 255, 204, 0.04)',
              border: '1px solid rgba(0, 255, 204, 0.15)',
              maxHeight: '250px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                  Directive SF
                </span>
                <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.92)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                  {introText}
                </p>
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px dashed rgba(0, 255, 204, 0.2)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#00ffcc', textTransform: 'uppercase' }}>
                  🎯 Objectif Réel
                </span>
                <p style={{ margin: '3px 0 0', color: '#00ffcc', fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.35 }}>
                  {objectiveText}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullBriefing(false);
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '12px',
                background: 'rgba(0, 255, 204, 0.15)',
                border: '1px solid rgba(0, 255, 204, 0.5)',
                color: '#00ffcc',
                fontSize: '0.82rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
              }}
            >
              Fermer le Briefing
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

