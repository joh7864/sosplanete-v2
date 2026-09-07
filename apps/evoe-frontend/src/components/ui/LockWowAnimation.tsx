/* src/components/ui/LockWowAnimation.tsx */
import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playCryptexSound, playWheelClickSound, stopCryptexSound } from '../../utils/easterEggAudio';
import styles from './LockWowAnimation.module.css';

export interface LockWowAnimationHandles {
  replay: () => void;
}

export interface LockWowAnimationProps {
  onClose?: () => void;
}

const LOCK_DURATION = 12;
const SECRET = [4, 2, 0, 7];

const PARTICLES = Array.from({ length: 32 }, (_, i) => {
  const angle = (i / 32) * 360;
  const dist = 170 + (i % 6) * 32;
  const colors = ['#FFD700', '#FF8C00', '#00FFCC', '#FFD700', '#FBBF24', '#34D399', '#FFE082'];
  return { id: i, angle, dist, color: colors[i % colors.length], size: 6 + (i % 4) * 3 };
});

const LockWowAnimation = forwardRef<LockWowAnimationHandles, LockWowAnimationProps>(({ onClose }, ref) => {
  const [show, setShow] = useState(true);
  // 0=off 1=appear 2=spinning 3=locking 4=opening 5=celebrate
  const [phase, setPhase] = useState(0);
  const [lockedWheels, setLockedWheels] = useState<number[]>([]);
  const [wheelDigits, setWheelDigits] = useState([3, 7, 5, 1]);

  const doReset = () => {
    stopCryptexSound();
    setPhase(0);
    setLockedWheels([]);
    setWheelDigits([3, 7, 5, 1]);
  };

  useImperativeHandle(ref, () => ({
    replay() {
      setShow(false);
      doReset();
      setTimeout(() => setShow(true), 80);
    },
  }));

  const handleClose = () => {
    stopCryptexSound();
    setShow(false);
    onClose?.();
  };

  useEffect(() => {
    if (!show) {
      stopCryptexSound();
      return;
    }

    const t0 = setTimeout(() => setPhase(1), 300);
    
    // Début de la rotation des roues : lancement immédiat du son mécanique synchronisé
    const t1 = setTimeout(() => {
      setPhase(2);
      playCryptexSound();
    }, 1100);

    // Phase 3: amorce du verrouillage successif
    const t2 = setTimeout(() => {
      setPhase(3);
    }, 3000);

    // Verrouillage successif des 4 roues : 4 puis 2 puis 0 puis 7 avec le son de cran mécanique ("clic-clac")
    const lockDelays = [0, 850, 1700, 2550];
    const lockTimers = lockDelays.map((delay, idx) =>
      setTimeout(() => {
        setLockedWheels(prev => (prev.includes(idx) ? prev : [...prev, idx]));
        setWheelDigits(prev => {
          const next = [...prev];
          next[idx] = SECRET[idx];
          return next;
        });
        playWheelClickSound();
      }, 3000 + delay + 400)
    );

    // Phase 4: ouverture mécanique des embouts Da Vinci et libération du cœur doré
    const t3 = setTimeout(() => setPhase(4), 3000 + 2550 + 850);
    // Phase 5: célébration "DÉBLOQUÉ !"
    const t4 = setTimeout(() => setPhase(5), 3000 + 2550 + 1750);
    // Fermeture automatique
    const tEnd = setTimeout(() => {
      stopCryptexSound();
      setShow(false);
      onClose?.();
    }, LOCK_DURATION * 1000);

    return () => {
      stopCryptexSound();
      [t0, t1, t2, t3, t4, tEnd, ...lockTimers].forEach(clearTimeout);
    };
  }, [show]);

  // Rotation des roues non verrouillées
  useEffect(() => {
    if (phase !== 2 && phase !== 3) return;
    const id = setInterval(() => {
      setWheelDigits(prev =>
        prev.map((d, i) => (lockedWheels.includes(i) ? SECRET[i] : (d + 1) % 10))
      );
    }, 65);
    return () => clearInterval(id);
  }, [phase, lockedWheels]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={handleClose}
        >
          {/* Badge statut cryptographique Da Vinci */}
          <AnimatePresence mode="wait">
            {phase >= 2 && phase <= 3 && (
              <motion.div
                key="decrypting"
                className={styles.label}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                ⚙ DÉCRYPTAGE DU CRYPTEX...
              </motion.div>
            )}
            {phase >= 4 && (
              <motion.div
                key="accepted"
                className={styles.label}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  color: '#34d399',
                  borderColor: 'rgba(52, 211, 153, 0.55)',
                  boxShadow: '0 0 26px rgba(52, 211, 153, 0.35)',
                }}
              >
                ✅ CODE 4-2-0-7 VALIDE
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ SCÈNE 3D DU CRYPTEX ═══ */}
          <motion.div
            className={styles.cryptexScene}
            initial={{ scale: 0.2, opacity: 0, rotateY: -35, rotateX: 15 }}
            animate={phase >= 1 ? { scale: 1, opacity: 1, rotateY: 0, rotateX: 0 } : { scale: 0.2, opacity: 0, rotateY: -35, rotateX: 15 }}
            transition={{ type: 'spring', stiffness: 130, damping: 18 }}
          >
            {/* Inclinaison 3D caractéristique de la photo de référence */}
            <motion.div
              className={styles.cryptexTilt}
              animate={
                phase === 2 || phase === 3
                  ? { rotateZ: [-6, -4, -6], rotateY: [-8, -4, -8] }
                  : { rotateZ: -5, rotateY: -6 }
              }
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className={styles.cryptex}>
                {/* Cœur interne (parchemin / tube doré) révélé à l'ouverture */}
                {phase >= 4 && (
                  <motion.div
                    className={styles.innerCore}
                    initial={{ opacity: 0, scaleX: 0.5 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.45 }}
                  >
                    <span className={styles.innerCoreRune}>✦ 4 ✦ 2 ✦ 0 ✦ 7 ✦</span>
                    <span className={styles.innerCoreRune}>DA VINCI CIPHER</span>
                  </motion.div>
                )}

                {/* ── Embout gauche Da Vinci (avec finial conique et flèche ▶) ── */}
                <motion.div
                  style={{ display: 'flex', alignItems: 'center', zIndex: 6 }}
                  animate={phase >= 4 ? { x: -95 } : { x: 0 }}
                  transition={{ type: 'spring', stiffness: 130, damping: 17 }}
                >
                  <div className={styles.finialLeft} />
                  <div className={`${styles.cap} ${styles.capLeft}`}>
                    <div className={styles.capFiligree} />
                    <div className={styles.capArrowLeft}>▶</div>
                  </div>
                </motion.div>

                {/* ── 4 Roues de code rotatives (4 - 2 - 0 - 7) ── */}
                {[0, 1, 2, 3].map(idx => {
                  const isLocked = lockedWheels.includes(idx);
                  const digit = wheelDigits[idx];
                  const prev = (digit - 1 + 10) % 10;
                  const next = (digit + 1) % 10;
                  return (
                    <motion.div
                      key={idx}
                      className={styles.wheel}
                      style={{
                        borderTopColor: isLocked ? 'rgba(255, 215, 0, 0.98)' : 'rgba(212, 175, 55, 0.9)',
                        borderBottomColor: isLocked ? 'rgba(255, 215, 0, 0.98)' : 'rgba(212, 175, 55, 0.9)',
                        boxShadow: isLocked
                          ? '0 0 35px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.3)'
                          : '0 12px 26px rgba(0, 0, 0, 0.65)',
                      }}
                      animate={isLocked ? { scale: [1, 1.09, 1] } : {}}
                      transition={{ duration: 0.32 }}
                    >
                      {/* Facette supérieure */}
                      <div className={styles.facetSlot}>
                        <div className={styles.digitAbove}>{prev}</div>
                      </div>

                      {/* Facette centrale active (Ligne d'alignement Da Vinci) */}
                      <div className={styles.digitCenterWrapper}>
                        <AnimatePresence mode="popLayout">
                          <motion.div
                            key={`${idx}-${digit}`}
                            className={styles.digitCenter}
                            style={{
                              color: isLocked ? '#FFE885' : '#ffffff',
                              textShadow: isLocked
                                ? '0 0 20px rgba(255, 215, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.95)'
                                : '0 2px 6px rgba(0, 0, 0, 0.95)',
                            }}
                            initial={{ y: -32, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 32, opacity: 0 }}
                            transition={{
                              duration: isLocked ? 0.28 : 0.065,
                              ease: 'easeOut',
                            }}
                          >
                            {digit}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Facette inférieure */}
                      <div className={styles.facetSlot}>
                        <div className={styles.digitBelow}>{next}</div>
                      </div>

                      {/* Masques de courbure cylindrique 3D */}
                      <div className={styles.maskTop} />
                      <div className={styles.maskBottom} />

                      {/* Lignes de visée dorées d'alignement */}
                      <div className={styles.lineTop} />
                      <div className={styles.lineBottom} />

                      {/* Nervures de préhension métalliques */}
                      <div className={styles.ribs} />
                    </motion.div>
                  );
                })}

                {/* ── Embout droit Da Vinci (avec flèche ◀ et finial conique) ── */}
                <motion.div
                  style={{ display: 'flex', alignItems: 'center', zIndex: 6 }}
                  animate={phase >= 4 ? { x: 95 } : { x: 0 }}
                  transition={{ type: 'spring', stiffness: 130, damping: 17 }}
                >
                  <div className={`${styles.cap} ${styles.capRight}`}>
                    <div className={styles.capFiligree} />
                    <div className={styles.capArrowRight}>◀</div>
                  </div>
                  <div className={styles.finialRight} />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Affichage des 4 chiffres du code sous le Cryptex */}
          {phase >= 1 && (
            <motion.div
              className={styles.codeDisplay}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.45 }}
            >
              {[0, 1, 2, 3].map(idx => {
                const isLocked = lockedWheels.includes(idx);
                return (
                  <motion.span
                    key={idx}
                    className={styles.codeDigit}
                    style={{
                      color: isLocked ? '#FFD700' : 'rgba(255, 255, 255, 0.25)',
                      textShadow: isLocked ? '0 0 24px rgba(255, 215, 0, 0.95)' : 'none',
                      borderColor: isLocked ? 'rgba(255, 215, 0, 0.85)' : 'rgba(212, 175, 55, 0.45)',
                    }}
                    animate={isLocked ? { scale: [1, 1.35, 1] } : {}}
                    transition={{ duration: 0.32 }}
                  >
                    {isLocked ? SECRET[idx] : '?'}
                  </motion.span>
                );
              })}
            </motion.div>
          )}

          {/* Éclatement de particules lors de l'ouverture */}
          {phase >= 4 &&
            PARTICLES.map(p => (
              <motion.div
                key={p.id}
                className={styles.particle}
                style={{
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 2.5}px ${p.color}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.dist,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            ))}

          {/* Bannière "DÉBLOQUÉ !" */}
          <AnimatePresence>
            {phase >= 5 && (
              <motion.div
                className={styles.unlockText}
                initial={{ scale: 0.2, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
              >
                🔓 DÉBLOQUÉ !
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sous-texte */}
          {phase >= 5 && (
            <motion.div
              className={styles.subText}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Code 4-2-0-7 · Anomalie temporelle neutralisée
            </motion.div>
          )}

          {/* Indication de fermeture */}
          <motion.p
            className={styles.hint}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ delay: 1.8, duration: 1 }}
          >
            Appuyez n'importe où pour fermer
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

LockWowAnimation.displayName = 'LockWowAnimation';
export { LockWowAnimation };
export default LockWowAnimation;
