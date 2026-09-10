import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Globe, Rocket } from 'lucide-react';

export interface BirthdayCelebrationModalProps {
  isOpen: boolean;
  pseudo?: string;
  isCatchup?: boolean;
  onAcknowledge: () => void;
}

export const BirthdayCelebrationModal: React.FC<BirthdayCelebrationModalProps> = ({
  isOpen,
  pseudo = 'Agent',
  isCatchup = false,
  onAcknowledge,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10030,
            padding: '20px',
          }}
        >
          {/* Particules d'étoiles dorées en arrière-plan */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            {[...Array(18)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  x: `${(i * 5.5) % 100}vw`,
                  y: '-10vh',
                  scale: 0.4 + ((i % 5) * 0.15),
                }}
                animate={{
                  opacity: [0, 1, 0.8, 0],
                  y: '110vh',
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 4 + (i % 3) * 1.5,
                  repeat: Infinity,
                  delay: (i * 0.3) % 3,
                  ease: 'linear',
                }}
                style={{
                  position: 'absolute',
                  color: i % 2 === 0 ? '#ffd700' : '#00ffcc',
                  fontSize: `${14 + (i % 4) * 6}px`,
                  filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))',
                }}
              >
                {i % 3 === 0 ? '✨' : i % 3 === 1 ? '⭐' : '🎂'}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              width: '100%',
              maxWidth: '540px',
              background: 'linear-gradient(145deg, rgba(14, 24, 52, 0.98), rgba(6, 12, 28, 0.99))',
              border: '2px solid rgba(255, 215, 0, 0.65)',
              borderRadius: '26px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(255, 215, 0, 0.35)',
              color: '#ffffff',
              padding: '34px 30px 28px 30px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Lueur supérieure dorée */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '70%',
                height: '4px',
                background: 'linear-gradient(90deg, transparent, #ffd700, transparent)',
                boxShadow: '0 0 15px #ffd700',
              }}
            />

            {/* Icône Gâteau / Étoile centrale */}
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, -3, 3, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                width: '74px',
                height: '74px',
                margin: '0 auto 16px auto',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 215, 0, 0.28) 0%, rgba(255, 215, 0, 0.05) 70%)',
                border: '2px solid #ffd700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '34px',
                boxShadow: '0 0 25px rgba(255, 215, 0, 0.5), inset 0 0 12px rgba(255, 215, 0, 0.2)',
              }}
            >
              🎂
            </motion.div>

            {/* Titre Festif */}
            <h2
              style={{
                margin: '0 0 8px 0',
                fontSize: '1.6rem',
                fontWeight: '900',
                letterSpacing: '0.5px',
                background: 'linear-gradient(90deg, #ffffff 0%, #ffd700 50%, #ffea75 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
              }}
            >
              Joyeux Anniversaire {pseudo} !
            </h2>

            {/* Sous-titre immersif */}
            <p
              style={{
                margin: '0 0 22px 0',
                fontSize: '0.88rem',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.5',
              }}
            >
              {isCatchup
                ? "Le Nexus a capté ton cycle stellaire avec un léger décalage temporel ! Ton équipage et le Commandement célèbrent ta nouvelle révolution autour du Soleil !"
                : "Une révolution de plus autour du Soleil ! Le Commandement Temporel célèbre ta présence et ton engagement pour la planète !"}
            </p>

            {/* Grille des 3 Avantages Débloqués */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '26px',
                textAlign: 'left',
              }}
            >
              {/* Avantage 1 : Multiplicateur x2 */}
              <div
                style={{
                  background: 'rgba(255, 215, 0, 0.12)',
                  border: '1.2px solid rgba(255, 215, 0, 0.45)',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 215, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffd700',
                    flexShrink: 0,
                  }}
                >
                  <Zap size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#ffd700' }}>
                    Multiplicateur x2 Actif
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                    Tes <strong>3 prochaines missions impulsées</strong> aujourd'hui rapporteront le double d'Impact !
                  </div>
                </div>
              </div>

              {/* Avantage 2 : Badge Collector */}
              <div
                style={{
                  background: 'rgba(0, 255, 204, 0.1)',
                  border: '1.2px solid rgba(0, 255, 204, 0.4)',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(0, 255, 204, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00ffcc',
                    flexShrink: 0,
                  }}
                >
                  <Trophy size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#00ffcc' }}>
                    Badge « Voyageur Solaire » Débloqué
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                    Ce trophée commémoratif est désormais gravé sur ta fiche d'Agent Temporel.
                  </div>
                </div>
              </div>

              {/* Avantage 3 : Halo Doré 3D */}
              <div
                style={{
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1.2px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                    flexShrink: 0,
                  }}
                >
                  <Globe size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#c084fc' }}>
                    Halo Doré & Statut 🎂 sur le Globe
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                    Tous tes coéquipiers verront ton avatar 3D scintiller d'or pour toute la journée.
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton d'activation festive */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAcknowledge}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                border: 'none',
                borderRadius: '14px',
                padding: '13px 20px',
                color: '#050a16',
                fontSize: '0.98rem',
                fontWeight: '900',
                letterSpacing: '0.4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 4px 15px rgba(0, 0, 0, 0.4)',
              }}
            >
              <Rocket size={20} />
              <span>Enclencher ma journée festive !</span>
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
