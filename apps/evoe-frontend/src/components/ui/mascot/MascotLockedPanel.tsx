import React from 'react';
import { Lock } from 'lucide-react';

interface MascotLockedPanelProps {
  currentPrereqDesc?: string | null;
}

export const MascotLockedPanel: React.FC<MascotLockedPanelProps> = ({ currentPrereqDesc }) => {
  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: '14px',
        padding: '20px 16px',
        color: '#ffffff',
        border: '2px dashed #475569',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          color: '#f87171',
        }}
      >
        <Lock size={22} />
      </div>
      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f87171', marginBottom: '6px' }}>
        Énigme Actuellement Verrouillée
      </div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
        {currentPrereqDesc
          ? `Conditions de déblocage : ${currentPrereqDesc}`
          : 'Accomplissez vos missions prioritaires dans le jeu pour débloquer l’accès à cette énigme.'}
      </p>
    </div>
  );
};
