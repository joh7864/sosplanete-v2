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

const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * 360;
  const dist = 160 + (i % 6) * 30;
  const colors = ['#FFD700', '#FF7F50', '#00FFCC', '#FFD700', '#FBBF24', '#34D399'];
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
    const t1 = setTimeout(() => setPhase(2), 1100);

    // Séquence d'ouverture / verrouillage : son du cryptex pendant la séquence
    const t2 = setTimeout(() => {
      setPhase(3);
      playCryptexSound();
    }, 3200);

    // Verrouillage successif des 4 roues avec clic métallique
    const lockDelays = [0, 750, 1500, 2250];
    const lockTimers = lockDelays.map((delay, idx) =>
      setTimeout(() => {
        setLockedWheels(prev => (prev.includes(idx) ? prev : [...prev, idx]));
        setWheelDigits(prev => {
          const next = [...prev];
          next[idx] = SECRET[idx];
          return next;
        });
        playWheelClickSound();
      }, 3200 + delay + 400)
    );

    // Phase 4: ouverture des embouts du Cryptex et libération
    const t3 = setTimeout(() => setPhase(4), 3200 + 2250 + 750);
    // Phase 5: célébration "DÉBLOQUÉ !"
    const t4 = setTimeout(() => setPhase(5), 3200 + 2250 + 1600);
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

  // Rotation ultra-rapide des roues encore non verrouillées
  useEffect(() => {
    if (phase !== 2 && phase !== 3) return;
    const id = setInterval(() => {
      setWheelDigits(prev =>
        prev.map((d, i) => (lockedWheels.includes(i) ? SECRET[i] : (d + 1) % 10))
      );
    }, 70);
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
          {/* Badge statut cryptographique */}
          <AnimatePresence mode="wait">
            {phase >= 2 && phase <= 3 && (
              <motion.div
                key="decrypting"
                className={styles.label}
                initial={{ opacity: 0, y: -10 }}
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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.55)', boxShadow: '0 0 24px rgba(52, 211, 153, 0.3)' }}
              >
                ✅ CODE 4-2-0-7 VALIDE
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ SCÈNE DU CRYPTEX ═══ */}
          <motion.div
            className={styles.cryptexScene}
            initial={{ scale: 0.25, opacity: 0, rotateY: -45, rotateX: 10 }}
            animate={phase >= 1 ? { scale: 1, opacity: 1, rotateY: 0, rotateX: 0 } : { scale: 0.25, opacity: 0, rotateY: -45, rotateX: 10 }}
            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
          >
            {/* Légère oscillation 3D pendant le décryptage */}
            <motion.div
              animate={phase === 2 || phase === 3 ? { rotateY: [-4, 4, -4], rotateX: [-2, 2, -2] } : { rotateY: 0, rotateX: 0 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className={styles.cryptex}>
                {/* Cœur interne visible lors de l'écartement des embouts */}
                {phase >= 4 && (
                  <motion.div
                    className={styles.innerCore}
                    initial={{ opacity: 0, scaleX: 0.6 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                )}

                {/* ── Embout gauche Da Vinci ── */}
                <motion.div
                  className={`${styles.cap} ${styles.capLeft}`}
                  animate={phase >= 4 ? { x: -80 } : { x: 0 }}
                  transition={{ type: 'spring', stiffness: 130, damping: 17 }}
                />

                {/* ── 4 Roues de code (4 - 2 - 0 - 7) ── */}
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
                        borderTopColor: isLocked ? 'rgba(255, 215, 0, 0.95)' : 'rgba(212, 175, 55, 0.85)',
                        borderBottomColor: isLocked ? 'rgba(255, 215, 0, 0.95)' : 'rgba(212, 175, 55, 0.85)',
                        boxShadow: isLocked
                          ? '0 0 32px rgba(255, 215, 0, 0.75), inset 0 0 16px rgba(255, 215, 0, 0.25)'
                          : '0 10px 22px rgba(0, 0, 0, 0.55)',
                      }}
                      animate={isLocked ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Chiffre supérieur */}
                      <div className={styles.digitAbove}>{prev}</div>

                      {/* Chiffre central actif */}
                      <div className={styles.digitCenterWrapper}>
                        <AnimatePresence mode="popLayout">
                          <motion.div
                            key={`${idx}-${digit}`}
                            className={styles.digitCenter}
                            style={{
                              color: isLocked ? '#FFE57F' : '#ffffff',
                              textShadow: isLocked
                                ? '0 0 18px rgba(255, 215, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.9)'
                                : '0 2px 6px rgba(0, 0, 0, 0.9)',
                            }}
                            initial={{ y: -30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 30, opacity: 0 }}
                            transition={{
                              duration: isLocked ? 0.26 : 0.065,
                              ease: 'easeOut',
                            }}
                          >
                            {digit}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Chiffre inférieur */}
                      <div className={styles.digitBelow}>{next}</div>

                      {/* Masques de courbure 3D */}
                      <div className={styles.maskTop} />
                      <div className={styles.maskBottom} />

                      {/* Lignes de visée dorées */}
                      <div className={styles.lineTop} />
                      <div className={styles.lineBottom} />

                      {/* Rayures mécaniques de préhension */}
                      <div className={styles.ribs} />
                    </motion.div>
                  );
                })}

                {/* ── Embout droit Da Vinci ── */}
                <motion.div
                  className={`${styles.cap} ${styles.capRight}`}
                  animate={phase >= 4 ? { x: 80 } : { x: 0 }}
                  transition={{ type: 'spring', stiffness: 130, damping: 17 }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Affichage des 4 chiffres du code sous le Cryptex */}
          {phase >= 1 && (
            <motion.div
              className={styles.codeDisplay}
              initial={{ opacity: 0, y: 12 }}
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
                      borderColor: isLocked ? 'rgba(255, 215, 0, 0.8)' : 'rgba(212, 175, 55, 0.35)',
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
