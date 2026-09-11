import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './Dashboard2026Loader.module.css';

interface Dashboard2026LoaderProps {
  isReady: boolean;
  onComplete?: () => void;
  currentYear?: number;
  /** Durée maximale avant fermeture forcée, même si les données ne sont pas prêtes (ms). Défaut : 4000ms */
  maxDurationMs?: number;
}

export const Dashboard2026Loader: React.FC<Dashboard2026LoaderProps> = ({
  isReady,
  onComplete,
  currentYear = new Date().getFullYear(),
  maxDurationMs = 4000,
}) => {
  const [progress, setProgress] = useState(8);
  const [isCompleted, setIsCompleted] = useState(false);
  const isReadyRef = useRef(isReady);
  const isCompletedRef = useRef(false);
  isReadyRef.current = isReady;

  const triggerComplete = useRef(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setProgress(100);
    setTimeout(() => {
      setIsCompleted(true);
      setTimeout(() => {
        onComplete?.();
      }, 450);
    }, 400);
  });

  useEffect(() => {
    // Timeout maximum garanti : fermeture forcée après maxDurationMs
    const maxTimer = setTimeout(() => {
      triggerComplete.current();
    }, maxDurationMs);

    let current = 8;
    const interval = setInterval(() => {
      if (isCompletedRef.current) {
        clearInterval(interval);
        return;
      }
      if (isReadyRef.current) {
        // Données reçues : accélération fluide jusqu'à 100%
        current += (100 - current) * 0.22 + 1.2;
        if (current >= 99.8) {
          clearInterval(interval);
          clearTimeout(maxTimer);
          triggerComplete.current();
        } else {
          setProgress(Math.round(current));
        }
      } else {
        // En attente : progression constante avec ralentissement vers 88%
        if (current < 88) {
          const delta = (88 - current) * 0.045 + 0.3;
          current += delta;
          setProgress(Math.round(current));
        }
      }
    }, 45);

    return () => {
      clearInterval(interval);
      clearTimeout(maxTimer);
    };
  }, [onComplete, maxDurationMs]);

  // Message dynamique de transmission lore
  const getLoreStatus = () => {
    if (progress < 25) {
      return (
        <>
          Établissement du <span className={styles.highlightText}>relais quantique {currentYear}</span>...
        </>
      );
    }
    if (progress < 50) {
      return (
        <>
          Déchiffrement des secteurs du <span className={styles.highlightText}>Codex & éco-missions</span>...
        </>
      );
    }
    if (progress < 75) {
      return (
        <>
          Synchronisation des <span className={styles.highlightText}>avatars et métriques</span> d'équipe...
        </>
      );
    }
    if (progress < 99) {
      return (
        <>
          Alignement orbital et <span className={styles.highlightText}>calibration de la Terre {currentYear}</span>...
        </>
      );
    }
    return (
      <span style={{ color: '#00ffcc', fontWeight: 800 }}>
        Synchronisation réussie. Bienvenue au QG, Agent !
      </span>
    );
  };

  const packetsTransferred = Math.min(128, Math.max(8, Math.round(progress * 1.28)));

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.55, ease: 'easeInOut' } }}
    >
      <div className={styles.gridBg} />
      <div className={styles.scanlines} />

      <motion.div
        className={styles.card}
        initial={{ scale: 0.92, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: -10, opacity: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Coins cyberpunk */}
        <div className={styles.cornerTL} />
        <div className={styles.cornerTR} />
        <div className={styles.cornerBL} />
        <div className={styles.cornerBR} />

        {/* Gyroscope holographique rotatif */}
        <div className={styles.gyroscopeContainer}>
          <div className={styles.outerRing} />
          <div className={styles.middleRing} />
          <div className={styles.innerCore}>
            <div className={styles.pulseDot} />
          </div>
        </div>

        {/* Badge Lore */}
        <div className={styles.badge}>
          <div className={styles.liveIndicator} />
          <span>RELAIS SPATIO-TEMPOREL • ÉPOQUE {currentYear}</span>
        </div>

        {/* Titre */}
        <h2 className={styles.title}>Chargement du Dashboard</h2>

        {/* Statut Lore */}
        <div className={styles.loreContainer}>
          <p className={styles.loreText}>{getLoreStatus()}</p>
        </div>

        {/* Barre de Progression */}
        <div className={styles.progressSection}>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${Math.min(100, Math.max(4, progress))}%` }}
            >
              {progress < 100 && <div className={styles.progressSpark} />}
            </div>
          </div>
        </div>

        {/* Footer Télémétrie */}
        <div className={styles.footerTelemetry}>
          <span className={styles.dataRate}>
            PAQUETS : {packetsTransferred} / 128
          </span>
          <span className={styles.percentBadge}>
            [ {Math.min(100, progress)}% ]
          </span>
          <span className={styles.dataRate}>
            {isCompleted ? 'STABLE' : 'CALIBRATION'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
