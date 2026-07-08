import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmCancelModalProps {
  cancelMissionConfirm: { actionDoneId: number; label: string } | null;
  setCancelMissionConfirm: (confirm: { actionDoneId: number; label: string } | null) => void;
  handleCancelMission: (actionDoneId: number) => void;
}

export function ConfirmCancelModal({
  cancelMissionConfirm,
  setCancelMissionConfirm,
  handleCancelMission
}: ConfirmCancelModalProps) {
  return (
    <AnimatePresence>
      {cancelMissionConfirm && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            pointerEvents: 'auto'
          }}
          onClick={() => setCancelMissionConfirm(null)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{
              background: 'rgba(15, 10, 20, 0.95)',
              border: '1px solid rgba(255, 59, 59, 0.4)',
              borderRadius: '16px',
              padding: '25px',
              width: '400px',
              maxWidth: '90vw',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,59,59,0.1)',
              color: '#fff',
              pointerEvents: 'auto',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: '#ff3b3b', fontSize: '2.5rem', marginBottom: '15px' }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '1.2rem', color: '#ff3b3b', textTransform: 'uppercase', margin: '0 0 10px 0', textShadow: '0 0 10px rgba(255, 59, 59, 0.3)' }}>
              Annuler l'Impulsion ?
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#a0aec0', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Voulez-vous vraiment annuler l'impulsion de la mission <strong style={{ color: '#fff' }}>"{cancelMissionConfirm.label}"</strong> ?
              Cela réduira les gains écologiques accumulés de l'Arche EVOE.
            </p>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => {
                  handleCancelMission(cancelMissionConfirm.actionDoneId);
                  setCancelMissionConfirm(null);
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ff3b3b, #ff7675)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 15px rgba(255,59,59,0.4)'
                }}
              >
                Confirmer
              </button>
              <button 
                onClick={() => setCancelMissionConfirm(null)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
