import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Trophy, Zap, MessageSquare, Rocket } from 'lucide-react';
import { playConstellationChimeSound } from '../../utils/easterEggAudio';

export interface GribouilleBirthdayBubbleProps {
  isOpen: boolean;
  player: {
    id?: number | string;
    pseudo?: string;
    birthDate?: string;
    color?: string;
    avatar?: string;
  } | null;
  isMe: boolean;
  boostsRemaining?: number;
  isCatchup?: boolean;
  isLate?: boolean;
  wishes?: any[];
  onClose: () => void;
  onShareWithTeam?: () => void;
  onWishTeammate?: (targetPseudo: string) => void;
}

export const GribouilleBirthdayBubble: React.FC<GribouilleBirthdayBubbleProps> = ({
  isOpen,
  player,
  isMe,
  boostsRemaining = 3,
  isCatchup = false,
  isLate = false,
  wishes = [],
  onClose,
  onShareWithTeam,
  onWishTeammate,
}) => {
  const pseudo = player?.pseudo || 'Agent';

  // Son céleste à l'apparition de la mascotte
  useEffect(() => {
    if (isOpen) {
      try {
        playConstellationChimeSound();
      } catch (e) {
        console.warn('[GribouilleBirthday] Audio chime failed:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen || !player) return null;

  return (
    <AnimatePresence>
      <div
        id="birthday-mascot-overlay"
        style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'auto',
          maxWidth: '92vw',
        }}
      >
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ x: -800, y: 280, opacity: 0, scale: 0.4 }}
          animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.3 } }}
          transition={{
            x: { ease: 'linear', duration: 1.1 },
            y: { ease: 'easeOut', duration: 1.1 },
            opacity: { duration: 0.3 },
            scale: { type: 'spring', stiffness: 85, damping: 14 },
          }}
        >
          {/* Mascotte 3D sur hoverboard (cliquer dessus ferme la bulle) */}
          <motion.img
            src="/images/robot-mascot.png"
            alt="Mascotte Gribouille"
            onClick={onClose}
            title="Cliquer sur la mascotte pour fermer"
            style={{
              width: '185px',
              height: 'auto',
              filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.65))',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            animate={{ y: [0, -8, 0], rotateZ: [-2, 2, -2] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          />

          {/* Bulle Ultra-Premium : Verre Céleste nacré, contour doré soigné & reflets spéculaires */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(168deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 254, 0.96) 55%, rgba(243, 246, 255, 0.98) 100%)',
              backdropFilter: 'blur(24px)',
              border: '2px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '26px',
              padding: '24px 26px',
              color: '#0f172a',
              width: '470px',
              maxWidth: '92vw',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.48), 0 0 35px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 1)',
              marginTop: '8px',
              position: 'relative',
              lineHeight: 1.45,
              textAlign: 'left',
              overflow: 'hidden',
            }}
            initial={{ opacity: 0, scale: 0.88, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 150, damping: 16 }}
          >
            {/* Lueur d'aurore dorée très douce en haut de la bulle */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                background: 'radial-gradient(ellipse at 50% -20%, rgba(254, 240, 138, 0.45) 0%, rgba(254, 215, 170, 0.15) 50%, transparent 80%)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* Flèche BD pointant vers le hoverboard - avec bordure dorée coordonnée */}
            <div
              style={{
                position: 'absolute',
                top: '-18px',
                left: '50%',
                marginLeft: '-13px',
                width: 0,
                height: 0,
                borderLeft: '13px solid transparent',
                borderRight: '13px solid transparent',
                borderBottom: '18px solid rgba(255, 255, 255, 0.98)',
                zIndex: 2,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-22px',
                left: '50%',
                marginLeft: '-15px',
                width: 0,
                height: 0,
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderBottom: '22px solid rgba(245, 158, 11, 0.55)',
                zIndex: 1,
              }}
            />

            {/* En-tête de la bulle : Titre & Badges avec typographie ciselée */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '14px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                {isMe ? (
                  isLate ? (
                    <>
                      <span>Bon Anniversaire en Retard</span>
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {pseudo}
                      </span>
                      <span>! 🎂⏳</span>
                    </>
                  ) : (
                    <>
                      <span>Joyeux Anniversaire</span>
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {pseudo}
                      </span>
                      <span>! 🎂🎉</span>
                    </>
                  )
                ) : (
                  <>
                    <span>C'est l'anniversaire de</span>
                    <span
                      style={{
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {pseudo}
                    </span>
                    <span>! 🎂🎉</span>
                  </>
                )}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    color: '#92400e',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    padding: '4px 11px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.18)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Sparkles size={12} color="#b45309" />
                  {isMe ? (isLate ? 'RETARD (> 7J)' : (isCatchup ? 'RATTRAPAGE' : 'JOUR J')) : 'FÊTE'}
                </span>

                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(15, 23, 42, 0.05)',
                    border: '1px solid rgba(15, 23, 42, 0.1)',
                    cursor: 'pointer',
                    width: '30px',
                    height: '30px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)';
                  }}
                  title="Fermer"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Bandeau d'indice / alerte festif or chaleureux */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.92) 0%, rgba(254, 215, 170, 0.8) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '16px',
                padding: '10px 16px',
                color: '#92400e',
                fontWeight: 800,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                marginBottom: '16px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  background: '#f59e0b',
                  borderRadius: '50%',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)',
                }}
              >
                <Sparkles size={14} />
              </div>
              <span style={{ letterSpacing: '-0.01em' }}>
                {isLate ? 'Décalage Spatio-Temporel Détecté (> 7 jours) ⏳' : 'Révolution Solaire Détectée dans la Station ! 🚀'}
              </span>
            </div>

            {/* Texte narratif de la mascotte */}
            <p
              style={{
                fontSize: '14px',
                color: '#334155',
                lineHeight: 1.6,
                margin: '0 0 18px 0',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {isMe ? (
                isLate ? (
                  <>
                    <strong style={{ color: '#0f172a' }}>Transmission avec décalage temporel :</strong> Bon anniversaire avec un peu de retard de plus de 7 jours ! L'Alliance et toute la station spatiale célèbrent ta nouvelle révolution solaire. Malheureusement, la fenêtre temporelle des 3 impulsions x2 s'est refermée pour cette année... Mais tes camarades ont pensé à toi !
                  </>
                ) : isCatchup ? (
                  <>
                    <strong style={{ color: '#0f172a' }}>Transmission spéciale :</strong> Même avec un léger décalage spatio-temporel, l'Alliance tenait à célébrer ta nouvelle révolution solaire ! Le Commandement t'active tes privilèges d'Agent d'élite pour la journée :
                  </>
                ) : (
                  <>
                    <strong style={{ color: '#0f172a' }}>Transmission prioritaire :</strong> Toute l'Alliance célèbre aujourd'hui ta nouvelle révolution autour du soleil ! Le Commandement a activé tes privilèges d'Agent d'élite pour la journée :
                  </>
                )
              ) : (
                <>
                  <strong style={{ color: '#0f172a' }}>Transmission d'équipage :</strong> Notre camarade <strong style={{ color: '#0f172a' }}>{pseudo}</strong> célèbre sa révolution solaire aujourd'hui ! L'Alliance lui a octroyé ses honneurs spatiaux. C'est le moment idéal de lui envoyer de la force !
                </>
              )}
            </p>

            {/* Cartes des privilèges pour le joueur fêté (uniquement si dans la période festive, non expirée) */}
            {isMe && !isLate && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* Badge Voyageur Solaire */}
                <div
                  style={{
                    background: 'linear-gradient(150deg, #fffef9 0%, #fef8e8 100%)',
                    border: '1.5px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '18px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: '0 6px 16px -4px rgba(245, 158, 11, 0.15), inset 0 1px 0 #ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 3px 8px rgba(245, 158, 11, 0.35)',
                      }}
                    >
                      <Trophy size={16} />
                    </div>
                    <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#92400e' }}>
                      Badge Débloqué
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                    « Voyageur Solaire » gravé sur ton profil !
                  </span>
                </div>

                {/* Boost Cosmique x2 */}
                <div
                  style={{
                    background: 'linear-gradient(150deg, #f7fee7 0%, #ecfdf5 100%)',
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '18px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: '0 6px 16px -4px rgba(16, 185, 129, 0.15), inset 0 1px 0 #ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 3px 8px rgba(16, 185, 129, 0.35)',
                      }}
                    >
                      <Zap size={16} />
                    </div>
                    <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#065f46' }}>
                      Score x2 Boost
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                    3 missions doublées ({boostsRemaining}/3 restant{boostsRemaining > 1 ? 's' : ''})
                  </span>
                </div>
              </div>
            )}

            {/* Boîte des vœux reçus des camarades (conservés pendant 3 périodes) */}
            {isMe && wishes && wishes.length > 0 && (
              <div
                style={{
                  background: 'rgba(241, 245, 249, 0.85)',
                  border: '1.5px solid rgba(203, 213, 225, 0.9)',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  marginBottom: '18px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    💌 Messages de tes camarades ({wishes.length})
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>visibles pendant 3 périodes</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {wishes.map((w: any) => (
                    <div
                      key={w.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid rgba(226, 232, 240, 0.9)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <strong style={{ fontSize: '12px', color: w.senderTeamColor || '#0284c7' }}>
                          @{w.senderPseudo}
                        </strong>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {new Date(w.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.4 }}>
                        {w.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Carte de notification pour les coéquipiers */}
            {!isMe && (
              <div
                style={{
                  background: 'linear-gradient(150deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1.5px solid rgba(14, 165, 233, 0.35)',
                  borderRadius: '18px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  boxShadow: '0 6px 18px -4px rgba(14, 165, 233, 0.15), inset 0 1px 0 #ffffff',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.35)',
                  }}
                >
                  <Rocket size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#0c4a6e', marginBottom: '2px' }}>
                    Propulsion Cosmique Active
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                    {pseudo} bénéficie d'un multiplicateur x2 sur ses prochaines missions pour propulser l'équipage !
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'Action Premium */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {isMe ? (
                isLate ? (
                  <button
                    onClick={onClose}
                    style={{
                      flex: '1 1 100%',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 60%, #0369a1 100%)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      borderRadius: '16px',
                      padding: '12px 18px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 22px -4px rgba(2, 132, 199, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(2, 132, 199, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 8px 22px -4px rgba(2, 132, 199, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
                    }}
                  >
                    J'ai compris, merci Gribouille ! ✨
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onShareWithTeam}
                      style={{
                        flex: '1 1 190px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #b45309 100%)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                        borderRadius: '16px',
                        padding: '12px 18px',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        letterSpacing: '0.01em',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 8px 22px -4px rgba(217, 119, 6, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(217, 119, 6, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 8px 22px -4px rgba(217, 119, 6, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>Partager avec l'Équipe</span>
                    </button>

                    <button
                      onClick={onClose}
                      style={{
                        flex: '1 1 130px',
                        background: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
                        color: '#334155',
                        border: '1.5px solid rgba(203, 213, 225, 0.9)',
                        borderRadius: '16px',
                        padding: '12px 18px',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 #ffffff',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.background = '#e2e8f0';
                        e.currentTarget.style.color = '#0f172a';
                        e.currentTarget.style.boxShadow = '0 8px 18px rgba(0, 0, 0, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.background = 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)';
                        e.currentTarget.style.color = '#334155';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 #ffffff';
                      }}
                    >
                      Merci Gribouille ! ✨
                    </button>
                  </>
                )
              ) : (
                <>
                  <button
                    onClick={() => onWishTeammate?.(pseudo)}
                    style={{
                      flex: '1 1 200px',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 60%, #0369a1 100%)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      borderRadius: '16px',
                      padding: '12px 18px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      letterSpacing: '0.01em',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 22px -4px rgba(2, 132, 199, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(2, 132, 199, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 8px 22px -4px rgba(2, 132, 199, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
                    }}
                  >
                    <MessageSquare size={16} />
                    <span>Lui souhaiter en direct 💬</span>
                  </button>

                  <button
                    onClick={onClose}
                    style={{
                      flex: '1 1 100px',
                      background: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
                      color: '#334155',
                      border: '1.5px solid rgba(203, 213, 225, 0.9)',
                      borderRadius: '16px',
                      padding: '12px 18px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 #ffffff',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.background = '#e2e8f0';
                      e.currentTarget.style.color = '#0f172a';
                      e.currentTarget.style.boxShadow = '0 8px 18px rgba(0, 0, 0, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.background = 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)';
                      e.currentTarget.style.color = '#334155';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 #ffffff';
                    }}
                  >
                    Fermer
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
