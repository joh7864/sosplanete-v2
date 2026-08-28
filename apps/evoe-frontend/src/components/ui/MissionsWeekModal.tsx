import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Droplet, Trash2, Cloud, CheckCircle2, RotateCcw } from 'lucide-react';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

interface MissionsWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: any[];
  childPseudo?: string;
  onCancelConfirm: (actionDoneId: number, label: string) => void;
}

export const MissionsWeekModal: React.FC<MissionsWeekModalProps> = ({
  isOpen,
  onClose,
  missions,
  childPseudo,
  onCancelConfirm
}) => {
  if (!isOpen) return null;

  // Filter impulsed missions
  const impulsedMissions = missions.filter((m) => m.evoeMission?.isImpulsed);

  // Totals computation
  const totalIT = impulsedMissions.reduce((sum, m) => {
    const autoIT = 10 + Math.round((12 * (m.co2 ?? 0)) + (4 * (m.waste ?? 0)) + (0.04 * (m.water ?? 0)));
    return sum + (m.evoeMission?.amplitude || m.pointsIT || autoIT);
  }, 0);

  const totalCO2 = impulsedMissions.reduce((sum, m) => sum + (m.co2 || 0), 0);
  const totalWater = impulsedMissions.reduce((sum, m) => sum + (m.water || 0), 0);
  const totalWaste = impulsedMissions.reduce((sum, m) => sum + (m.waste || 0), 0);

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 18, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'auto'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(780px, 96vw)',
            maxHeight: '90vh',
            background: 'rgba(8, 14, 28, 0.94)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1.5px solid rgba(0, 255, 204, 0.4)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 255, 204, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Top Neon Glow Bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #10b981 0%, #00ffcc 50%, #d946ef 100%)'
            }}
          />

          {/* Modal Header */}
          <div
            style={{
              padding: '18px 22px 14px',
              borderBottom: '1px solid rgba(0, 255, 204, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: 'rgba(0, 255, 204, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1.5px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)',
                  color: '#10b981'
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                  Mes Missions de la Semaine
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'rgba(0, 255, 204, 0.8)', fontWeight: 600 }}>
                  Agent Temporel {childPseudo ? `${childPseudo} — ` : ''}Période Active
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Synthesis Stats Ribbon */}
          {impulsedMissions.length > 0 && (
            <div
              style={{
                padding: '10px 22px',
                background: 'rgba(0, 255, 204, 0.04)',
                borderBottom: '1px solid rgba(0, 255, 204, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontSize: '0.78rem',
                    fontWeight: 800
                  }}
                >
                  {impulsedMissions.length} {impulsedMissions.length > 1 ? 'Missions Impulsées' : 'Mission Impulsée'}
                </span>

                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(217, 70, 239, 0.15)',
                    border: '1px solid rgba(217, 70, 239, 0.45)',
                    color: '#f0abfc',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Zap size={12} />
                  +{totalIT} IT
                </span>
              </div>

              {/* Eco totals */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
                {totalCO2 > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00ffcc' }}>
                    <Cloud size={13} /> {totalCO2.toFixed(1)}kg
                  </span>
                )}
                {totalWater > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
                    <Droplet size={13} /> {totalWater.toFixed(0)}L
                  </span>
                )}
                {totalWaste > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                    <Trash2 size={13} /> {totalWaste.toFixed(1)}kg
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Missions List / Content */}
          <div
            style={{
              padding: '16px 20px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '60vh'
            }}
          >
            {impulsedMissions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 15px rgba(0, 255, 204, 0.3))' }}>
                  🚀
                </div>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                  Aucune mission impulsée sur cette période
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '380px', lineHeight: 1.4 }}>
                  Explorez le Codex Temporel ou participez aux Défis pour stabiliser la matrice énergétique de l'Arche !
                </p>
              </div>
            ) : (
              impulsedMissions.map((mission) => {
                const autoIT = 10 + Math.round((12 * (mission.co2 ?? 0)) + (4 * (mission.waste ?? 0)) + (0.04 * (mission.water ?? 0)));
                const itPoints = mission.evoeMission?.amplitude || mission.pointsIT || autoIT;
                const title = mission.evoeMission?.titreSF || mission.label;

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
                    key={mission.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      background: 'rgba(10, 18, 36, 0.75)',
                      border: '1.5px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      flexWrap: 'wrap'
                    }}
                  >
                    {/* Left: Thumbnail + Title + Objective */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(0, 255, 204, 0.15) 0%, rgba(8, 14, 28, 0.9) 70%)',
                          border: '1px solid rgba(0, 255, 204, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={mission.label}
                            style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                          />
                        ) : (
                          <span style={{ fontSize: '1.4rem' }}>{rawIcon || '⚡'}</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                        <h4
                          style={{
                            margin: 0,
                            color: '#fff',
                            fontSize: '0.92rem',
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {title}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.76rem',
                            color: '#00ffcc',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          🎯 {mission.label}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Badges IT & Impact */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          background: 'rgba(217, 70, 239, 0.15)',
                          border: '1px solid rgba(217, 70, 239, 0.4)',
                          color: '#f0abfc',
                          fontSize: '0.78rem',
                          fontWeight: 800
                        }}
                      >
                        ⚙️ {itPoints} IT
                      </span>

                      {mission.co2 > 0 && (
                        <span
                          style={{
                            padding: '4px 6px',
                            borderRadius: '8px',
                            background: 'rgba(0, 255, 204, 0.08)',
                            border: '1px solid rgba(0, 255, 204, 0.25)',
                            color: '#00ffcc',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}
                        >
                          ☁️ {mission.co2}kg
                        </span>
                      )}
                    </div>

                    {/* Right: Bouton Désimpulser Premium */}
                    <button
                      type="button"
                      onClick={() => onCancelConfirm(mission.evoeMission?.actionDoneId, title)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1.5px solid rgba(239, 68, 68, 0.55)',
                        color: '#ff6b6b',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.45)';
                        e.currentTarget.style.transform = 'scale(1.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>Désimpulser</span>
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(0, 255, 204, 0.15)',
              background: 'rgba(0, 255, 204, 0.02)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
