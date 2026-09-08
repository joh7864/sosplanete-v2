import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { playMatrixDigitalSound } from '../../../utils/easterEggAudio';

interface MatrixRainEffectProps {
  duration?: number;
  onComplete?: () => void;
}

export const MatrixRainEffect: React.FC<MatrixRainEffectProps> = ({
  duration = 3500,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    playMatrixDigitalSound();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Caractères katakana, chiffres et symboles cybernétiques Matrix
    const glyphs = '0123456789アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンλπΩΨΣ⚡⌘';
    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));

    const draw = () => {
      // Arrière-plan semi-transparent pour l'effet de traînée lumineuse
      ctx.fillStyle = 'rgba(2, 6, 23, 0.08)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < drops.length; i++) {
        const char = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Tête de colonne blanche incandescente, traînée vert émeraude Matrix
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.fillText(char, x, y);

        // Glyphe précédent en vert néon
        if (drops[i] > 1) {
          const prevChar = glyphs[Math.floor(Math.random() * glyphs.length)];
          ctx.fillStyle = '#10b981';
          ctx.shadowColor = '#059669';
          ctx.shadowBlur = 4;
          ctx.fillText(prevChar, x, y - fontSize);
        }

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer);
    };
  }, [duration, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          filter: 'contrast(1.2) brightness(1.1)',
        }}
      />

      {/* Hologramme Cyber / Bannière HUD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 28px',
          background: 'rgba(2, 44, 34, 0.92)',
          border: '1.5px solid #10b981',
          borderRadius: '16px',
          boxShadow: '0 0 35px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.3)',
          backdropFilter: 'blur(12px)',
          fontFamily: 'monospace',
          textAlign: 'center',
        }}
      >
        <div style={{ color: '#6ee7b7', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '2px' }}>
          // SYSTÈME COMM-LINK PIRATÉ //
        </div>
        <div style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 900, textShadow: '0 0 14px #10b981' }}>
          PROTOCLE MATRIX V3 DÉPLOYÉ
        </div>
        <div style={{ color: '#a7f3d0', fontSize: '0.8rem' }}>
          Flux de données quantiques synchronisé
        </div>
      </motion.div>
    </div>
  );
};
