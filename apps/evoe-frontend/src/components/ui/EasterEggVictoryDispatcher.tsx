import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, X, ShieldCheck, Zap, Globe, Compass, Radio } from 'lucide-react';
import { playUnlockCadenasSound, playConstellationChimeSound } from '../../utils/easterEggAudio';
import { MatrixRainEffect } from './easter-egg-effects/MatrixRainEffect';
import { CrtRetroSynthwaveEffect } from './easter-egg-effects/CrtRetroSynthwaveEffect';
import { AntigravityEffect } from './easter-egg-effects/AntigravityEffect';
import { RocketThrusterEffect } from './easter-egg-effects/RocketThrusterEffect';
import { Temporal1985Effect } from './easter-egg-effects/Temporal1985Effect';
import { DiscoPartyEffect } from './easter-egg-effects/DiscoPartyEffect';

export interface EasterEggVictoryDispatcherProps {
  isOpen: boolean;
  onClose: () => void;
  eggCode?: string;
  triggerType?: string;
  eggTitle?: string;
  pointsIT?: number;
  onOpenCommLink?: () => void;
  isTeamRewarded?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  duration: number;
  delay: number;
}

export const EasterEggVictoryDispatcher: React.FC<EasterEggVictoryDispatcherProps> = ({
  isOpen,
  onClose,
  eggCode = '',
  triggerType = '',
  eggTitle = 'Easter Egg Découvert',
  pointsIT = 60,
  onOpenCommLink,
  isTeamRewarded = false,
}) => {
  const [displayPoints, setDisplayPoints] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showCard, setShowCard] = useState(false);

  // Détermination du type d'effet WOOOW à afficher
  const effectType = (() => {
    const code = (eggCode || '').toUpperCase();
    const trigger = (triggerType || '').toUpperCase();

    if (code === 'EE_MATRIX_COMM_LINK' || code.includes('MATRIX')) return 'matrix';
    if (code === 'EE_KONAMI_80S' || trigger === 'KONAMI_CODE') return 'konami';
    if (code === 'EE_ANTIGRAVITY' || code.includes('ANTIGRAV')) return 'antigravity';
    if (code === 'EE_LOGO_ROCKET' || trigger === 'LOGO_HOLD') return 'rocket';
    if (code === 'EE_TEMPORAL_1985' || trigger === 'TIMELINE_WARP' || code.includes('1985')) return 'temporal1985';
    if (code === 'EE_PARTY_DISCO' || code.includes('PARTY')) return 'disco';
    if (code === 'EE_CADENAS_4CH_ARCHE' || trigger === 'RIDDLE_ANSWER_INPUT' || trigger === 'CODE_INPUT') return 'cadenas';
    if (code === 'EE_CONSTELLATION_3D' || trigger === 'SCREEN_EDGE') return 'constellation';
    return 'celestial';
  })();

  useEffect(() => {
    if (!isOpen) {
      setDisplayPoints(0);
      setParticles([]);
      setShowCard(false);
      return;
    }

    // Affichage de la carte de récompense après 1.2s d'immersion dans l'effet WOOOW
    // (ou immédiatement pour l'effet Cadenas)
    const cardDelay = effectType === 'cadenas' ? 0 : 1200;
    const cardTimer = setTimeout(() => {
      setShowCard(true);
    }, cardDelay);

    // Audio dédié
    if (effectType === 'cadenas') {
      playUnlockCadenasSound();
    } else if (effectType === 'constellation' || effectType === 'celestial') {
      playConstellationChimeSound();
    }

    // Particules de triomphe
    const colors = ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#38bdf8', '#c084fc', '#ffffff'];
    const newParticles: Particle[] = Array.from({ length: 48 }, (_, i) => {
      const angle = (i / 48) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const distance = 120 + Math.random() * 240;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 30,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 720 - 360,
        duration: 1.5 + Math.random() * 1.0,
        delay: Math.random() * 0.2,
      };
    });
    setParticles(newParticles);

    // Incrémentation dynamique des points IT
    let start = 0;
    const duration = 1200;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = pointsIT / steps;

    const pointsTimer = setInterval(() => {
      start += increment;
      if (start >= pointsIT) {
        setDisplayPoints(pointsIT);
        clearInterval(pointsTimer);
      } else {
        setDisplayPoints(Math.floor(start));
      }
    }, stepTime);

    return () => {
      clearTimeout(cardTimer);
      clearInterval(pointsTimer);
    };
  }, [isOpen, pointsIT, effectType]);

  if (!isOpen) return null;

  // Récit et message de déblocage selon l'énigme
  const getLoreDescription = () => {
    switch (effectType) {
      case 'cadenas':
        return 'Félicitations Détective ! Les 5 règles du schéma ont été résolues et le verrou quantique s’est ouvert.';
      case 'matrix':
        return 'Accès root obtenu ! Les lignes de code défilent et le Comm-Link est directement relié au mainframe de la station.';
      case 'konami':
        return 'Code d’arcade 1980s validé avec maestria ! L’esthétique rétro-futuriste vibre sur vos senseurs.';
      case 'antigravity':
        return 'Gravité terrestre temporairement suspendue ! Les modules de commande flottent en apesanteur spatiale.';
      case 'rocket':
        return 'Poussée maximale des réacteurs atteinte ! Le vaisseau EVOE fend l’espace sub-orbital à pleine puissance.';
      case 'temporal1985':
        return 'Vitesse de 88 MPH franchie ! Une boucle temporelle vers 1985 s’est ouverte à travers la passerelle.';
      case 'disco':
        return 'Fréquence festive synchronisée ! La boule à facettes orbitale illumine le pont de la station spatiale.';
      case 'constellation':
        return 'Triangle d’étoiles complété ! Les balises célestes se sont alignées pour révéler les coordonnées secrètes.';
      default:
        return 'Anomalie temporelle découverte et neutralisée avec succès ! Les données cryptées ont été décodées.';
    }
  };

  // Icône centrale de l'effet
  const renderCenterVisual = () => {
    if (effectType === 'cadenas') {
      return (
        <div
          style={{
            position: 'relative',
            width: '130px',
            height: '130px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Anneau gyroscopique rotatif */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              border: '2px dashed rgba(56, 189, 248, 0.5)',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.25)',
            }}
          />

          {/* Anse du cadenas qui s'ouvre */}
          <motion.div
            initial={{ y: 0, rotate: 0 }}
            animate={{ y: -22, rotate: -26 }}
            transition={{
              delay: 0.1,
              type: 'spring',
              stiffness: 280,
              damping: 14,
            }}
            style={{
              position: 'absolute',
              top: '12px',
              left: '32px',
              width: '56px',
              height: '58px',
              borderTop: '10px solid #e2e8f0',
              borderLeft: '10px solid #e2e8f0',
              borderRight: '10px solid #94a3b8',
              borderTopLeftRadius: '30px',
              borderTopRightRadius: '30px',
              boxShadow: '0 -4px 18px rgba(255, 255, 255, 0.45)',
              transformOrigin: 'bottom left',
              zIndex: 1,
            }}
          />

          {/* Corps massif du cadenas */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: [0.9, 1.05, 1] }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '10px',
              width: '88px',
              height: '72px',
              background: 'linear-gradient(145deg, #1e293b, #0f172a)',
              borderRadius: '16px',
              border: '3px solid #10b981',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.6), inset 0 0 15px rgba(52, 211, 153, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <motion.div
              animate={{
                boxShadow: ['0 0 10px #10b981', '0 0 24px #34d399', '0 0 10px #10b981'],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #34d399 20%, #059669 80%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={13} color="#ffffff" />
            </motion.div>
            <div
              style={{
                fontSize: '0.58rem',
                fontWeight: 900,
                color: '#34d399',
                letterSpacing: '1px',
                marginTop: '3px',
              }}
            >
              DÉVERROUILLÉ
            </div>
          </motion.div>
        </div>
      );
    }

    // Badge sphérique hologramme pour les autres Easter Eggs
    const visualIcons: Record<string, any> = {
      matrix: Zap,
      konami: Radio,
      antigravity: Globe,
      rocket: Sparkles,
      temporal1985: Zap,
      disco: Sparkles,
      constellation: Compass,
      celestial: Sparkles,
    };

    const VisualIcon = visualIcons[effectType] || Sparkles;

    return (
      <motion.div
        initial={{ scale: 0.4, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12 }}
        style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(56, 189, 248, 0.25))',
          border: '2px solid #38bdf8',
          boxShadow: '0 0 40px rgba(56, 189, 248, 0.5), inset 0 0 20px rgba(16, 185, 129, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '18px',
        }}
      >
        <VisualIcon size={44} color="#38bdf8" />
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      <div
        id="easter-egg-victory-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: showCard
            ? 'radial-gradient(circle at center, rgba(6, 78, 59, 0.7) 0%, rgba(2, 6, 23, 0.94) 80%)'
            : 'transparent',
          backdropFilter: showCard ? 'blur(16px)' : 'none',
          overflow: 'hidden',
          userSelect: 'none',
          transition: 'background 0.5s ease, backdrop-filter 0.5s ease',
        }}
      >
        {/* 1. L'Effet Visuel WOOOW Dédié */}
        {effectType === 'matrix' && <MatrixRainEffect />}
        {effectType === 'konami' && <CrtRetroSynthwaveEffect />}
        {effectType === 'antigravity' && <AntigravityEffect />}
        {effectType === 'rocket' && <RocketThrusterEffect />}
        {effectType === 'temporal1985' && <Temporal1985Effect />}
        {effectType === 'disco' && <DiscoPartyEffect />}

        {/* 2. Onde de choc céleste pour les énigmes cadenas / constellation / générique */}
        {(effectType === 'cadenas' || effectType === 'constellation' || effectType === 'celestial') && (
          <>
            <motion.div
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                border: '4px solid #10b981',
                boxShadow: '0 0 80px #10b981, inset 0 0 60px #34d399',
                pointerEvents: 'none',
              }}
            />
            <motion.div
              initial={{ scale: 0.1, opacity: 0.8 }}
              animate={{ scale: 3.2, opacity: 0 }}
              transition={{ duration: 1.6, delay: 0.15, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 60px #38bdf8',
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        {/* 3. Particules étincelantes jaillissantes */}
        {showCard && (
          <div
            style={{
              position: 'absolute',
              top: '42%',
              left: '50%',
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          >
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: p.x,
                  y: [0, p.y * 0.7, p.y + 110],
                  opacity: [1, 1, 0],
                  scale: [0, 1.3, 0.5],
                  rotate: p.rotation,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  borderRadius: '50%',
                  background: p.color,
                  boxShadow: `0 0 10px ${p.color}`,
                }}
              />
            ))}
          </div>
        )}

        {/* 4. Carte Triomphale de Récompense Contextualisée */}
        <AnimatePresence>
          {showCard && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 130, damping: 15 }}
              style={{
                position: 'relative',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                maxWidth: '520px',
                width: '90%',
                padding: '36px 32px',
                background: 'rgba(15, 23, 42, 0.92)',
                border: '2px solid rgba(16, 185, 129, 0.6)',
                borderRadius: '28px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(16, 185, 129, 0.35)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Bouton fermeture */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <X size={18} />
              </button>

              {/* Visuel central (Cadenas 3D animé ou Hologramme) */}
              {renderCenterVisual()}

              {/* Badge d'état */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1.5px solid #10b981',
                  color: '#34d399',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: '10px',
                }}
              >
                <ShieldCheck size={16} />
                Énigme Résolue // Données Déchiffrées
              </motion.div>

              {/* Titre Triomphal */}
              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '1.65rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.3px',
                  textShadow: '0 0 20px rgba(16, 185, 129, 0.45)',
                }}
              >
                {eggTitle} !
              </motion.h2>

              {/* Texte de Lore contextuel */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '0.9rem',
                  color: '#cbd5e1',
                  lineHeight: 1.45,
                }}
              >
                {getLoreDescription()}
              </motion.p>

              {/* Compteur de Points IT */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 12 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(16, 185, 129, 0.22))',
                  border: '2px solid #f59e0b',
                  boxShadow: '0 0 35px rgba(245, 158, 11, 0.35)',
                  marginBottom: '26px',
                }}
              >
                <Sparkles size={28} color="#fbbf24" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fde68a', textTransform: 'uppercase' }}>
                    Bonus IT d'Équipe
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fef3c7', lineHeight: 1 }}>
                    +{displayPoints} IT
                  </div>
                </div>
              </motion.div>

              {/* Actions : Partage Comm-Link & Fermer */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%',
                }}
              >
                {onOpenCommLink && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCommLink();
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                  >
                    <MessageSquare size={18} />
                    {isTeamRewarded
                      ? 'Partager la victoire au Comm-Link Équipe'
                      : 'Alerter l’équipe pour débloquer les points IT'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'transparent',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                  }}
                >
                  Continuer l’exploration
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
