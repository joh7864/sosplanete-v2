import React from 'react';
import { ZoomIn } from 'lucide-react';

interface MascotSchemaThumbnailProps {
  currentImageUrl: string;
  onOpenLightbox: () => void;
}

export const MascotSchemaThumbnail: React.FC<MascotSchemaThumbnailProps> = ({
  currentImageUrl,
  onOpenLightbox,
}) => {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '2px dashed #cbd5e1',
        borderRadius: '12px',
        padding: '8px 10px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          onClick={onOpenLightbox}
          style={{
            width: '46px',
            height: '36px',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1.5px solid #94a3b8',
            cursor: 'pointer',
            background: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={currentImageUrl}
            alt="Schéma"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
            Schéma de Déduction 2070
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            5 règles d'exclusion cryptées
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenLightbox}
        style={{
          background: '#0284c7',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 10px',
          color: '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#0369a1')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#0284c7')}
      >
        <ZoomIn size={13} />
        Résoudre
      </button>
    </div>
  );
};
