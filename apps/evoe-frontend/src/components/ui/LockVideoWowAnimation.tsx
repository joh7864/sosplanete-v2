/* src/components/ui/LockVideoWowAnimation.tsx */
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './LockVideoWowAnimation.module.css';

export interface LockVideoWowAnimationProps {
  onClose?: () => void;
  videoSrc?: string;
}

export const LockVideoWowAnimation: React.FC<LockVideoWowAnimationProps> = ({
  onClose,
  videoSrc = '/uploads/easter-eggs/cryptex.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      onClose?.();
    }, 280);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.volume = 0.95;

    // Lancement de la vidéo avec audio
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Repli automatique sans son si la politique navigateur bloque l'autoplay audio
        video.muted = true;
        video.play().catch(e => {
          console.warn('[CryptexVideo] Autoplay blocked:', e);
        });
      });
    }

    // Sécurité de secours : si la vidéo dépasse 14s, fermer
    const fallbackTimer = setTimeout(() => {
      handleDismiss();
    }, 14000);

    return () => {
      clearTimeout(fallbackTimer);
      if (video) {
        try {
          video.pause();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={handleDismiss}
        >
          {/* Badge statut */}
          <motion.div
            className={styles.statusBadge}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            ⚙ TRANSMISSION DU CRYPTEX...
          </motion.div>

          {/* Conteneur vidéo flottant au centre avec fond noir transparentisé */}
          <motion.div
            className={styles.videoWrapper}
            initial={{ scale: 0.78, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              className={styles.video}
              autoPlay
              playsInline
              controls={false}
              onEnded={handleDismiss}
            />

            {/* Lueur d'ambiance dorée sous le cryptex */}
            <div className={styles.ambientGlow} />
          </motion.div>

          {/* Indication pour fermer */}
          <motion.p
            className={styles.hint}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            Appuyez n'importe où pour fermer
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LockVideoWowAnimation;
