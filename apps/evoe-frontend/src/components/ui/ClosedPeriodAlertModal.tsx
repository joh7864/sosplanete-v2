import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export interface ClosedPeriodAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClosedPeriodAlertModal: React.FC<ClosedPeriodAlertModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 10, 25, 0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10010,
            padding: '20px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            style={{
              background:
                'linear-gradient(135deg, rgba(18, 26, 48, 0.97), rgba(10, 16, 32, 0.99))',
              border: '1.5px solid rgba(245, 158, 11, 0.6)',
              borderRadius: '20px',
              padding: '28px 30px',
              maxWidth: '420px',
              width: '100%',
              boxShadow:
                '0 20px 50px rgba(0,0,0,0.85), 0 0 25px rgba(245, 158, 11, 0.25)',
              textAlign: 'center',
              color: '#fff',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1.5px solid #f59e0b',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)',
              }}
            >
              <AlertTriangle size={26} />
            </div>

            <h3
              style={{
                margin: '0 0 10px 0',
                fontSize: '1.2rem',
                color: '#f59e0b',
                fontWeight: 'bold',
                letterSpacing: '0.3px',
              }}
            >
              Période de jeu fermée
            </h3>

            <p
              style={{
                margin: '0 0 24px 0',
                fontSize: '0.92rem',
                color: '#e2e8f0',
                lineHeight: '1.5',
              }}
            >
              Aucune période ouverte, contactez votre administrateur.
            </p>

            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 32px',
                color: '#050a16',
                fontWeight: 'bold',
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              Compris
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
