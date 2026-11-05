import React from 'react';
import { RotateCcw } from 'lucide-react';

interface PortraitOrientationOverlayProps {
  show: boolean;
  onAllowPortrait: () => void;
}

export const PortraitOrientationOverlay: React.FC<PortraitOrientationOverlayProps> = ({
  show,
  onAllowPortrait,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(4, 8, 18, 0.97)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <RotateCcw size={64} color="#00ffcc" style={{ animation: 'spin 3s linear infinite' }} />
      <div>
        <h2
          style={{
            color: '#00ffcc',
            fontFamily: '"Courier New", monospace',
            fontSize: '1.1rem',
            margin: '0 0 8px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Mode Paysage Requis
        </h2>
        <p style={{ color: 'rgba(160,174,192,0.8)', fontSize: '0.875rem', margin: 0 }}>
          Tournez votre appareil pour accéder au portail temporel.
        </p>
      </div>
      <button
        type="button"
        onClick={onAllowPortrait}
        style={{
          marginTop: '8px',
          background: 'transparent',
          border: '1px solid rgba(160,174,192,0.35)',
          color: 'rgba(160,174,192,0.6)',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '0.75rem',
          cursor: 'pointer',
          letterSpacing: '0.05em',
        }}
      >
        Autoriser le mode Portrait
      </button>
    </div>
  );
};
