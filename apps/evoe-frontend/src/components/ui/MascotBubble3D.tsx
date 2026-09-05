import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MascotBubble3DProps {
  isOpen: boolean;
  onClose: () => void;
  crypticMessage: string;
  explicitHint?: string | null;
  showExplicitHint: boolean;
  mascotImageUrl?: string;
  mascotDurationSeconds?: number;
}

export const MascotBubble3D: React.FC<MascotBubble3DProps> = ({
  isOpen,
  onClose,
  crypticMessage,
  explicitHint,
  showExplicitHint,
  mascotImageUrl = '/images/robot-mascot.png',
  mascotDurationSeconds = 30,
}) => {
  const [displayedText, setDisplayedText] = useState('');

  const currentMessage =
    (showExplicitHint && explicitHint ? explicitHint : crypticMessage) ||
    "Une anomalie stellaire triangulaire clignote dans les coordonnees de l espace profond ... Dans le ciel, 3 etoiles scintillantes forment un triangle ...";

  useEffect(() => {
    if (!isOpen) {
      setDisplayedText('');
      return;
    }
    let i = 0;
    setDisplayedText('');
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + currentMessage.charAt(i));
      i++;
      if (i >= currentMessage.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [isOpen, currentMessage]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'auto',
          }}
        >
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            initial={{ x: -800, y: 280, opacity: 0, scale: 0.4 }}
            animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{
              x: { ease: 'linear', duration: 1.3 },
              y: { ease: 'easeOut', duration: 1.3 },
              opacity: { duration: 0.4 },
              scale: { type: 'spring', stiffness: 80, damping: 14 },
            }}
            onClick={onClose}
          >
            <motion.img
              src={mascotImageUrl}
              alt="Mascot"
              style={{
                width: '210px',
                height: 'auto',
                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))',
                cursor: 'pointer',
              }}
              animate={{ y: [0, -10, 0], rotateZ: [-2, 2, -2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.05 }}
            />

            <motion.div
              style={{
                background: '#ffffff',
                border: '3px solid #1a1a2e',
                borderRadius: '25px',
                padding: '15px 25px',
                color: '#1a1a2e',
                fontFamily: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive, sans-serif',
                fontSize: '1rem',
                fontWeight: 'bold',
                width: '400px',
                maxWidth: '90vw',
                boxShadow: '5px 5px 0px rgba(0,0,0,0.2)',
                marginTop: '12px',
                position: 'relative',
                lineHeight: 1.5,
                textAlign: 'center',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 130 }}
            >
              {displayedText}
              {displayedText.length < currentMessage.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >|</motion.span>
              )}
              <div style={{
                position: 'absolute', top: '-18px', left: '50%', marginLeft: '-12px',
                width: 0, height: 0,
                borderLeft: '12px solid transparent', borderRight: '12px solid transparent',
                borderBottom: '18px solid #ffffff', zIndex: 2,
              }} />
              <div style={{
                position: 'absolute', top: '-22px', left: '50%', marginLeft: '-15px',
                width: 0, height: 0,
                borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
                borderBottom: '22px solid #1a1a2e', zIndex: 1,
              }} />
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
