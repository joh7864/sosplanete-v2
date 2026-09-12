import { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

const globalTexturePromiseCache = new Map<string, Promise<THREE.Texture>>();

function getTexture(url: string): Promise<THREE.Texture> {
  if (globalTexturePromiseCache.has(url)) {
    return globalTexturePromiseCache.get(url)!;
  }
  const promise = new Promise<THREE.Texture>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(url, resolve, undefined, reject);
  });
  globalTexturePromiseCache.set(url, promise);
  return promise;
}

// Texture de halo blanc partagée par tous les avatars pour dessiner le cercle d'équipe
const haloTexture = (() => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

const bracketsTexture = (() => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  ctx.strokeStyle = '#00ffcc';
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 6;
  
  const pad = 24;
  const len = 45;
  
  // Top-left
  ctx.beginPath();
  ctx.moveTo(pad, pad + len);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + len, pad);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(size - pad, pad + len);
  ctx.lineTo(size - pad, pad);
  ctx.lineTo(size - pad - len, pad);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(pad, size - pad - len);
  ctx.lineTo(pad, size - pad);
  ctx.lineTo(pad + len, size - pad);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(size - pad, size - pad - len);
  ctx.lineTo(size - pad, size - pad);
  ctx.lineTo(size - pad - len, size - pad);
  ctx.stroke();
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

const greenDotTexture = (() => {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const r = 9;
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#00ffcc';
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.94)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

const blueDotTexture = (() => {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const r = 9;
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.94)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

const envelopeTexture = (() => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  
  ctx.fillStyle = '#ff3b3b';
  ctx.shadowColor = '#ff3b3b';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.94)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const w = 24;
  const h = 16;
  const x = cx - w / 2;
  const y = cy - h / 2 + 1;
  
  ctx.strokeRect(x, y, w, h);
  
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(cx, y + h * 0.55);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

const swordsTextureCache = new Map<string, THREE.Texture>();

function getSwordsTexture(color: string, count: number): THREE.Texture {
  const key = `${color}_${count}`;
  if (swordsTextureCache.has(key)) {
    return swordsTextureCache.get(key)!;
  }
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  
  // Fond circulaire avec la couleur d'équipe
  ctx.fillStyle = color || '#f59e0b';
  ctx.shadowColor = color || '#f59e0b';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  // Bordure foncée contrastée
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.94)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  // Épées croisées
  ctx.font = '22px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚔️', cx, cy + 4);
  
  // Nombre de défis positionné au sommet entre le haut des épées
  if (count > 0) {
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(String(count), cx, cy - 11);
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  swordsTextureCache.set(key, tex);
  return tex;
}

const missionsWeekTextureCache = new Map<string, THREE.Texture>();

function getMissionsWeekTexture(color: string, count: number): THREE.Texture {
  const key = `${color}_${count}`;
  if (missionsWeekTextureCache.has(key)) {
    return missionsWeekTextureCache.get(key)!;
  }
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  
  // Fond circulaire avec un gradient émeraude / cyan néon
  ctx.fillStyle = '#10b981';
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  // Bordure foncée contrastée
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.94)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  // Icône checkmark validation
  ctx.font = 'bold 22px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('✓', cx, cy + (count > 0 ? 4 : 0));
  
  // Nombre de missions positionné au sommet si > 0
  if (count > 0) {
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(String(count), cx, cy - 11);
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  missionsWeekTextureCache.set(key, tex);
  return tex;
}

/**
 * Texture Canvas HD pour le Médaillon d'anniversaire festif (Option 1) :
 * - Écrin sombre en verre cosmique profond (#0c1630 / #020408) pour contraste 100%
 * - Cerclage doré biseauté éclatant avec lueur néon et rivets d'or
 * - Plateau doré royal avec reflets spéculaires
 * - Double étage gourmand velouté crème/vanille avec coulis caramel ruisselant
 * - Perles de sucre dorées et nacrées le long des étages
 * - 3 bougies royales dorées avec flammes incandescentes ultra-lumineuses
 * - Étoiles et étincelles festives dorées
 */
const premiumBirthdayCakeTexture = (() => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 130;
  const r = 94;

  // 1. Halo lumineux doré d'ambiance externe doux
  const halo = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, 126);
  halo.addColorStop(0, 'rgba(255, 215, 0, 0.45)');
  halo.addColorStop(0.6, 'rgba(255, 170, 0, 0.15)');
  halo.addColorStop(1, 'rgba(255, 120, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, 126, 0, Math.PI * 2);
  ctx.fill();

  // 2. ÉCRIN SOMBRE : Médaillon en verre sombre cosmique profond pour contraste 100%
  const bgGrad = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, r);
  bgGrad.addColorStop(0, '#0c1630'); // bleu nuit sombre au centre
  bgGrad.addColorStop(0.6, '#060b18');
  bgGrad.addColorStop(1, '#020408'); // noir profond aux bords
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 3. CERCLAGE DORÉ BISEAUTÉ & LUMINEUX (Beveled Gold Neon Rim)
  ctx.save();
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 14;
  const rimGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  rimGrad.addColorStop(0, '#fffbe6');
  rimGrad.addColorStop(0.2, '#ffd700');
  rimGrad.addColorStop(0.45, '#aa7715');
  rimGrad.addColorStop(0.7, '#ffd700');
  rimGrad.addColorStop(1, '#664005');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
  ctx.stroke();

  // Filet de lumière interne sur le cerclage
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4.5, Math.PI * 0.75, Math.PI * 1.55);
  ctx.stroke();
  ctx.restore();

  // 4 Clous / Rivets d'or aux 4 points cardinaux
  [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(angle => {
    const rx = cx + Math.cos(angle) * (r - 2);
    const ry = cy + Math.sin(angle) * (r - 2);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rx, ry, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Helper pour tracer une ellipse remplie
  const fillEllipse = (x: number, y: number, rx: number, ry: number, fillStyle: string | CanvasGradient) => {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // 4. GÂTEAU ROYAL FESTIF
  // Plateau doré (Pedestal Stand)
  const footGrad = ctx.createLinearGradient(cx - 20, 204, cx + 20, 204);
  footGrad.addColorStop(0, '#8a580a');
  footGrad.addColorStop(0.3, '#ffd700');
  footGrad.addColorStop(0.5, '#fff2a8');
  footGrad.addColorStop(0.7, '#ffd700');
  footGrad.addColorStop(1, '#664005');
  ctx.fillStyle = footGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 15, 196);
  ctx.lineTo(cx - 22, 210);
  ctx.quadraticCurveTo(cx, 213, cx + 22, 210);
  ctx.lineTo(cx + 15, 196);
  ctx.closePath();
  ctx.fill();

  // Bord inférieur du plateau
  const plateUnderGrad = ctx.createLinearGradient(cx - 65, 192, cx + 65, 192);
  plateUnderGrad.addColorStop(0, '#664005');
  plateUnderGrad.addColorStop(0.3, '#b8860b');
  plateUnderGrad.addColorStop(0.5, '#ffd700');
  plateUnderGrad.addColorStop(0.8, '#b8860b');
  plateUnderGrad.addColorStop(1, '#523303');
  ctx.fillStyle = plateUnderGrad;
  ctx.beginPath();
  ctx.ellipse(cx, 196, 64, 10, 0, 0, Math.PI);
  ctx.fill();

  // Surface supérieure du plateau
  const plateTopGrad = ctx.createRadialGradient(cx, 191, 8, cx, 191, 62);
  plateTopGrad.addColorStop(0, '#fffbe6');
  plateTopGrad.addColorStop(0.4, '#ffd700');
  plateTopGrad.addColorStop(0.8, '#c69214');
  plateTopGrad.addColorStop(1, '#8a580a');
  fillEllipse(cx, 192, 63, 9, plateTopGrad);

  // Filet de lumière spéculaire
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, 192, 62, 8.5, 0, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  // 5. Étage Inférieur (Grand Étage Gourmand)
  const tier1BodyGrad = ctx.createLinearGradient(cx - 48, 168, cx + 48, 168);
  tier1BodyGrad.addColorStop(0, '#2e1910'); // chocolat velouté
  tier1BodyGrad.addColorStop(0.16, '#fff0db'); // crème vanille royale
  tier1BodyGrad.addColorStop(0.5, '#ffffff'); // blanc éclatant pur
  tier1BodyGrad.addColorStop(0.84, '#fff0db');
  tier1BodyGrad.addColorStop(1, '#3b2216');
  
  ctx.fillStyle = tier1BodyGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 48, 156);
  ctx.lineTo(cx - 48, 188);
  ctx.ellipse(cx, 188, 48, 8, 0, Math.PI, 0, true);
  ctx.lineTo(cx + 48, 156);
  ctx.ellipse(cx, 156, 48, 8, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();

  // Perles dorées au pied du 1er étage
  for (let i = 0; i < 9; i++) {
    const angle = Math.PI * (0.12 + i * 0.095);
    const px = cx + Math.cos(angle) * 46;
    const py = 188 + Math.sin(angle) * 7.5;
    const pearlGrad = ctx.createRadialGradient(px - 1, py - 1, 0.5, px, py, 2.5);
    pearlGrad.addColorStop(0, '#ffffff');
    pearlGrad.addColorStop(0.4, '#ffd700');
    pearlGrad.addColorStop(1, '#996515');
    ctx.fillStyle = pearlGrad;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glaçage caramel / coulis doré ruisselant (Drips)
  const dripGrad = ctx.createLinearGradient(cx - 48, 156, cx + 48, 156);
  dripGrad.addColorStop(0, '#996515');
  dripGrad.addColorStop(0.2, '#f59e0b');
  dripGrad.addColorStop(0.5, '#ffd700');
  dripGrad.addColorStop(0.8, '#f59e0b');
  dripGrad.addColorStop(1, '#784a08');
  
  ctx.fillStyle = dripGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 48, 156);
  ctx.bezierCurveTo(cx - 44, 172, cx - 36, 174, cx - 32, 161);
  ctx.bezierCurveTo(cx - 28, 177, cx - 18, 179, cx - 14, 162);
  ctx.bezierCurveTo(cx - 8, 180, cx, 182, cx + 4, 162);
  ctx.bezierCurveTo(cx + 10, 181, cx + 20, 178, cx + 24, 162);
  ctx.bezierCurveTo(cx + 28, 177, cx + 36, 175, cx + 40, 161);
  ctx.bezierCurveTo(cx + 44, 170, cx + 47, 168, cx + 48, 156);
  ctx.ellipse(cx, 156, 48, 8, 0, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();

  // Surface dessus de l'étage 1
  fillEllipse(cx, 156, 48, 8, plateTopGrad);

  // 6. Étage Supérieur (Second Étage Raffiné)
  const tier2BodyGrad = ctx.createLinearGradient(cx - 32, 130, cx + 32, 130);
  tier2BodyGrad.addColorStop(0, '#2e1910');
  tier2BodyGrad.addColorStop(0.18, '#fff3e0');
  tier2BodyGrad.addColorStop(0.5, '#ffffff');
  tier2BodyGrad.addColorStop(0.82, '#fff3e0');
  tier2BodyGrad.addColorStop(1, '#3b2216');

  ctx.fillStyle = tier2BodyGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 32, 126);
  ctx.lineTo(cx - 32, 152);
  ctx.ellipse(cx, 152, 32, 6, 0, Math.PI, 0, true);
  ctx.lineTo(cx + 32, 126);
  ctx.ellipse(cx, 126, 32, 6, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();

  // Perles d'or à la jonction du 2ème étage
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (0.15 + i * 0.12);
    const px = cx + Math.cos(angle) * 30;
    const py = 152 + Math.sin(angle) * 5.2;
    const pearlGrad = ctx.createRadialGradient(px - 0.8, py - 0.8, 0.4, px, py, 2.2);
    pearlGrad.addColorStop(0, '#ffffff');
    pearlGrad.addColorStop(0.4, '#ffd700');
    pearlGrad.addColorStop(1, '#996515');
    ctx.fillStyle = pearlGrad;
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Drips glaçage doré étage 2
  ctx.fillStyle = dripGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 32, 126);
  ctx.bezierCurveTo(cx - 28, 140, cx - 20, 142, cx - 17, 131);
  ctx.bezierCurveTo(cx - 12, 144, cx - 4, 145, cx, 131);
  ctx.bezierCurveTo(cx + 6, 145, cx + 14, 143, cx + 18, 131);
  ctx.bezierCurveTo(cx + 22, 141, cx + 28, 139, cx + 32, 126);
  ctx.ellipse(cx, 126, 32, 6, 0, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();

  // Surface supérieure de l'étage 2
  fillEllipse(cx, 126, 32, 6, plateTopGrad);

  // Rosaces de crème chantilly sur le dessus
  const drawRosette = (rx: number, ry: number) => {
    const roseGrad = ctx.createRadialGradient(rx - 1, ry - 1, 1, rx, ry, 4);
    roseGrad.addColorStop(0, '#ffffff');
    roseGrad.addColorStop(0.6, '#fffaed');
    roseGrad.addColorStop(1, '#e6c88b');
    ctx.fillStyle = roseGrad;
    ctx.beginPath();
    ctx.arc(rx, ry, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(rx, ry, 1, 0, Math.PI * 2);
    ctx.fill();
  };
  drawRosette(cx - 22, 126);
  drawRosette(cx - 11, 128);
  drawRosette(cx, 129);
  drawRosette(cx + 11, 128);
  drawRosette(cx + 22, 126);

  // 7. Bougies Royales Lumineuses (3 bougies dorées)
  const candles = [
    { x: cx - 17, yTop: 84, yBottom: 124, w: 6.5 },
    { x: cx,      yTop: 76, yBottom: 125, w: 7.5 },
    { x: cx + 17, yTop: 84, yBottom: 124, w: 6.5 },
  ];

  candles.forEach(({ x, yTop, yBottom, w }) => {
    const candleGrad = ctx.createLinearGradient(x - w / 2, yTop, x + w / 2, yTop);
    candleGrad.addColorStop(0, '#b8860b');
    candleGrad.addColorStop(0.2, '#ffd700');
    candleGrad.addColorStop(0.5, '#ffffff');
    candleGrad.addColorStop(0.8, '#ffd700');
    candleGrad.addColorStop(1, '#8a580a');

    ctx.fillStyle = candleGrad;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x - w / 2, yTop, w, yBottom - yTop, [2, 2, 0, 0]);
    } else {
      ctx.rect(x - w / 2, yTop, w, yBottom - yTop);
    }
    ctx.fill();

    // Spirales festives rubis
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let sy = yTop + 6; sy < yBottom - 4; sy += 8) {
      ctx.moveTo(x - w / 2, sy);
      ctx.lineTo(x + w / 2, sy + 3.5);
    }
    ctx.stroke();

    // Mèche
    ctx.strokeStyle = '#331100';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, yTop);
    ctx.lineTo(x, yTop - 5);
    ctx.stroke();

    // Halo lumineux intense de la flamme
    ctx.save();
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 18;

    // Flamme extérieure
    const flameGrad = ctx.createRadialGradient(x, yTop - 13, 1, x, yTop - 13, 8);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.25, '#ffe600');
    flameGrad.addColorStop(0.65, '#ff6600');
    flameGrad.addColorStop(1, 'rgba(255, 34, 0, 0)');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(x, yTop - 5);
    ctx.bezierCurveTo(x - 5.5, yTop - 10, x - 5.5, yTop - 19, x, yTop - 23);
    ctx.bezierCurveTo(x + 5.5, yTop - 19, x + 5.5, yTop - 10, x, yTop - 5);
    ctx.closePath();
    ctx.fill();

    // Flamme intérieure (Cœur blanc incandescent)
    const coreGrad = ctx.createRadialGradient(x, yTop - 12, 0.5, x, yTop - 12, 3.5);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.7, '#fff5a0');
    coreGrad.addColorStop(1, 'rgba(255, 200, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.ellipse(x, yTop - 12, 2.2, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  // 8. Étoiles étincelantes & Scintillements cosmiques sur fond sombre
  const drawSparkle = (sx: number, sy: number, radius: number) => {
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sx, sy - radius);
    ctx.quadraticCurveTo(sx, sy, sx + radius, sy);
    ctx.quadraticCurveTo(sx, sy, sx, sy + radius);
    ctx.quadraticCurveTo(sx, sy, sx - radius, sy);
    ctx.quadraticCurveTo(sx, sy, sx, sy - radius);
    ctx.closePath();
    ctx.fill();

    // Cœur doré
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(sx, sy, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawSparkle(cx - 52, 75, 10);
  drawSparkle(cx + 52, 75, 10);
  drawSparkle(cx - 65, 140, 7.5);
  drawSparkle(cx + 65, 138, 7.5);
  drawSparkle(cx, 44, 9);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
})();

/**
 * Halo lumineux doré éclatant pour faire ressortir le gâteau d'anniversaire :
 * - Étoile de rayons solaires dorés chauds
 * - Halo radial intense doré/ambre avec dégradé doux
 * - Anneau céleste lumineux
 */
const cakeHaloTexture = (() => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = 128;
  const cy = 128;

  // 1. Rayons solaires dorés (8 rayons doux en étoile)
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 8; i++) {
    ctx.rotate((Math.PI * 2) / 8);
    const rayGrad = ctx.createLinearGradient(0, 0, 0, 118);
    rayGrad.addColorStop(0, 'rgba(255, 235, 120, 0.65)');
    rayGrad.addColorStop(0.4, 'rgba(255, 190, 0, 0.28)');
    rayGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(0, 118);
    ctx.lineTo(16, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 2. Halo radial intense doré/ambre
  const halo = ctx.createRadialGradient(cx, cy, 15, cx, cy, 120);
  halo.addColorStop(0, 'rgba(255, 255, 240, 0.98)');
  halo.addColorStop(0.2, 'rgba(255, 225, 60, 0.88)');
  halo.addColorStop(0.48, 'rgba(255, 175, 0, 0.55)');
  halo.addColorStop(0.78, 'rgba(255, 120, 0, 0.2)');
  halo.addColorStop(1, 'rgba(255, 80, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.fill();

  // 3. Anneau doré fin avec lueur intense
  ctx.strokeStyle = 'rgba(255, 245, 180, 0.75)';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, 80, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
})();

interface PlayerAvatarProps {
  player: any;
  position: [number, number, number];
  avatarScale?: number;
  onSelectPlayer?: (p: any) => void;
  onSelectChallengeBadge?: (p: any) => void;
  onSelectMissionsWeek?: (p: any) => void;
  onSelectBirthdayCake?: (p: any) => void;
  isOnline?: boolean;
  hasUnread?: boolean;
  isStealthMode?: boolean;
  onToggleStealth?: () => void;
  challengeCount?: number;
  missionsWeekCount?: number;
  showHealth?: boolean;
  showChatIcon?: boolean;
  rankTag?: string;
  isSearchFocused?: boolean;
}

export function PlayerAvatar({ 
  player, 
  position, 
  avatarScale = 1, 
  onSelectPlayer, 
  onSelectChallengeBadge,
  onSelectMissionsWeek,
  onSelectBirthdayCake,
  isOnline = false,
  hasUnread = false,
  isStealthMode = false,
  onToggleStealth,
  challengeCount = 0,
  missionsWeekCount = 0,
  showHealth = true,
  showChatIcon = true,
  rankTag,
  isSearchFocused = false,
}: PlayerAvatarProps) {
  const color = player.color || '#40916C';
  const isMe = player.isCurrent;
  const isSelfStealth = isMe && isStealthMode;
  const initial = (player.pseudo || '?')[0].toUpperCase();

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const bracketsRef = useRef<THREE.Mesh>(null);

  // Détection du jour d'anniversaire de l'Agent pour le halo doré et le badge 3D (Option D)
  const isBirthday = useMemo(() => {
    // 1. Si c'est moi-même : affiché UNIQUEMENT si ma journée d'anniversaire est active
    if (isMe) {
      if (player?.isBirthdayActive !== undefined) {
        return !!player.isBirthdayActive;
      }
      if (player?.id) {
        const year = new Date().getFullYear();
        const celeb = localStorage.getItem(`evoe_birthday_celebrated_${player.id}_${year}`);
        if (celeb && new Date(celeb).toDateString() === new Date().toDateString()) {
          return true;
        }
      }
      return false;
    }

    // 2. Pour les AUTRES joueurs : STRICTEMENT le Jour J exact, même si le joueur fêté ne se connecte pas
    if (!player?.birthDate) return false;
    try {
      const bDate = new Date(player.birthDate);
      if (isNaN(bDate.getTime())) return false;
      const now = new Date();
      return (
        bDate.getUTCDate() === now.getDate() &&
        bDate.getUTCMonth() === now.getMonth()
      );
    } catch {
      return false;
    }
  }, [player?.birthDate, player?.isBirthdayActive, player?.id, isMe]);

  useEffect(() => {
    let isMounted = true;

    const loadStatic3DAvatar = () => {
      const pseudo = player.pseudo || 'default';
      
      // On utilise le pseudo pour générer un ID déterministe
      let hash = 0;
      for (let i = 0; i < pseudo.length; i++) {
        hash += pseudo.charCodeAt(i);
      }
      
      // Calcul de l'âge
      let age: number | null = null;
      if (player.birthDate) {
        const birthYear = new Date(player.birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        age = currentYear - birthYear;
      }

      // Détermination du genre
      let genre = '';
      if (player.gender === 'EF') {
        genre = 'EF';
      } else if (player.gender === 'EH') {
        genre = 'EH';
      } else if (player.gender === 'E' || (age !== null && age < 15)) {
        genre = (hash % 2 === 0) ? 'EF' : 'EH';
      } else if (player.gender === 'F') {
        genre = 'F';
      } else if (player.gender === 'M') {
        genre = 'H';
      } else {
        const genres = ['EF', 'EH', 'F', 'H'];
        genre = genres[hash % 4];
      }

      let file = '';
      if (genre === 'EF') {
        const idx = (hash % 3) + 1;
        file = `EF_avatar_0${idx}.png`;
      } else if (genre === 'EH') {
        const idx = (hash % 3) + 1;
        file = `EH_avatar_0${idx}.png`;
      } else if (genre === 'F') {
        const idx = (hash % 12) + 1;
        file = `F_avatar_${idx.toString().padStart(2, '0')}.png`;
      } else { // 'H'
        const idx = (hash % 21) + 1;
        file = `H_avatar_0${idx}.png`;
      }
      
      const avatarUrl = `${EVOE_IMG_URL}avatars_3D/${file}`;
      
      getTexture(avatarUrl)
        .then((tex) => { if (isMounted) setTexture(tex); })
        .catch(() => { if (isMounted) setTexture(null); });
    };

    if (player.avatar && player.avatar !== 'avatars/default.png') {
      getTexture(`${EVOE_IMG_URL}${player.avatar}`)
        .then((tex) => { if (isMounted) setTexture(tex); })
        .catch(() => { if (isMounted) loadStatic3DAvatar(); });
    } else {
      loadStatic3DAvatar();
    }

    return () => { isMounted = false; };
  }, [player.avatar, player.pseudo]);

  const haloScale = 0.7 * avatarScale;
  const avatarSpriteScale = 0.9 * avatarScale;
  const avatarYOffset = 0.12 * avatarScale;
  const fontSize = 0.18 * avatarScale;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      
      const center = new THREE.Vector3(0, 0, 0);
      const camDir = state.camera.position.clone().sub(center).normalize();
      const avatarDir = worldPos.clone().sub(center).normalize();
      
      const dot = avatarDir.dot(camDir);
      let scaleFactor = 1.0 + (dot * 0.4);
      if (isSearchFocused) {
        scaleFactor += 0.22 + Math.sin(t * 6.0) * 0.08;
      }
      
      groupRef.current.scale.lerp(new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor), 0.1);
    }
    if (bracketsRef.current) {
      const pulse = 1.0 + Math.sin(t * 5.0) * 0.04;
      bracketsRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position} 
      frustumCulled={false}
      onClick={(e) => {
        e.stopPropagation();
        onSelectPlayer?.(player);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
      }}
    >
      <pointLight 
        position={[0, 0.5, 0]} 
        color={isSearchFocused ? '#00ffcc' : (isBirthday ? '#ffd700' : color)} 
        intensity={isSearchFocused ? 2.8 : (isBirthday ? 1.8 : (isMe ? 1.2 : 0.3))} 
        distance={isSearchFocused ? 4.5 : (isBirthday ? 3 : 2)} 
      />
      
      <Billboard follow={true}>
        {/* Anneau holographique de focus recherche */}
        {isSearchFocused && (
          <mesh position={[0, 0, -0.015]} raycast={() => null}>
            <ringGeometry args={[haloScale * 0.55, haloScale * 0.72, 32]} />
            <meshBasicMaterial 
              color="#00ffcc" 
              transparent 
              opacity={0.88} 
              blending={THREE.AdditiveBlending} 
              depthWrite={false} 
            />
          </mesh>
        )}

        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[haloScale, haloScale]} />
          <meshBasicMaterial 
            map={haloTexture}
            color={isSearchFocused ? '#00ffcc' : (isSelfStealth ? '#38bdf8' : (isBirthday ? '#ffd700' : color))} 
            transparent={true} 
            opacity={isSearchFocused ? 1.0 : (isBirthday ? 0.95 : (isSelfStealth ? 0.4 : (isMe ? 0.9 : 0.6)))} 
            depthWrite={false} 
          />
        </mesh>

        {texture ? (
          <mesh position={[0, avatarYOffset, 0]}>
            <planeGeometry args={[avatarSpriteScale, avatarSpriteScale]} />
            <meshBasicMaterial 
              key={texture.uuid}
              map={texture} 
              transparent={true}
              opacity={isSelfStealth ? 0.55 : 1}
              depthWrite={false}
            />
          </mesh>
        ) : (
          <Text
            position={[0, 0, 0.01]}
            fontSize={haloScale * 0.6}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            material-depthWrite={false}
            material-transparent={true}
            material-opacity={isSelfStealth ? 0.55 : 1}
            frustumCulled={false}
          >
            {initial}
          </Text>
        )}

        {/* Médaillon d'anniversaire festif premium (Option 1) avec son halo lumineux dédié, centré par rapport à la photo de l'avatar */}
        {isBirthday && (
          <group 
            position={[0, -0.27 * avatarScale, 0.04]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBirthdayCake?.(player);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'auto';
            }}
          >
            {/* Halo lumineux doré éclatant en arrière-plan du médaillon pour le faire ressortir */}
            <mesh position={[0, 0, 0]} renderOrder={2400}>
              <planeGeometry args={[0.36 * avatarScale, 0.36 * avatarScale]} />
              <meshBasicMaterial 
                map={cakeHaloTexture}
                transparent={true}
                toneMapped={false}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>

            {/* Médaillon sombre et gâteau haute fidélité en avant-plan par-dessus le bas de l'avatar */}
            <mesh position={[0, 0, 0.005]} renderOrder={2500}>
              <planeGeometry args={[0.28 * avatarScale, 0.28 * avatarScale]} />
              <meshBasicMaterial 
                map={premiumBirthdayCakeTexture}
                transparent={true}
                toneMapped={false}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          </group>
        )}

        {/* Pastille de présence : Verte si connecté normal, Bleue (#38bdf8) si en mode furtif pour le joueur lui-même */}
        {((isOnline && !isSelfStealth) || isSelfStealth) && (
          <mesh 
            position={[avatarSpriteScale * 0.36, avatarYOffset + avatarSpriteScale * 0.36, 0.01]}
            onClick={(e) => {
              if (isMe && onToggleStealth) {
                e.stopPropagation();
                onToggleStealth();
              }
            }}
            onPointerOver={(e) => {
              if (isMe && onToggleStealth) {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }
            }}
            onPointerOut={(e) => {
              if (isMe && onToggleStealth) {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }
            }}
          >
            <planeGeometry args={[avatarSpriteScale * 0.24, avatarSpriteScale * 0.24]} />
            <meshBasicMaterial 
              map={isSelfStealth ? blueDotTexture : greenDotTexture}
              transparent={true}
              depthWrite={false}
            />
          </mesh>
        )}

        {showChatIcon && hasUnread && (
          <mesh position={[-avatarSpriteScale * 0.36, avatarYOffset + avatarSpriteScale * 0.36, 0.02]}>
            <planeGeometry args={[avatarSpriteScale * 0.24, avatarSpriteScale * 0.24]} />
            <meshBasicMaterial 
              map={envelopeTexture}
              transparent={true}
              depthWrite={false}
            />
          </mesh>
        )}

        {challengeCount > 0 && (
          <mesh 
            position={[-avatarSpriteScale * 0.36, avatarYOffset - avatarSpriteScale * 0.36, 0.02]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectChallengeBadge?.(player);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'auto';
            }}
          >
            <planeGeometry args={[avatarSpriteScale * 0.28, avatarSpriteScale * 0.28]} />
            <meshBasicMaterial 
              map={getSwordsTexture(player.color || '#f59e0b', challengeCount)}
              transparent={true}
              depthWrite={false}
            />
          </mesh>
        )}

        {missionsWeekCount > 0 && (
          <mesh 
            position={[avatarSpriteScale * 0.36, avatarYOffset - avatarSpriteScale * 0.36, 0.02]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectMissionsWeek?.(player);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'auto';
            }}
          >
            <planeGeometry args={[avatarSpriteScale * 0.28, avatarSpriteScale * 0.28]} />
            <meshBasicMaterial 
              map={getMissionsWeekTexture(player.color || '#10b981', missionsWeekCount)}
              transparent={true}
              depthWrite={false}
            />
          </mesh>
        )}
      </Billboard>

      {showHealth ? (
        <Billboard follow={true}>
          <group position={[0, -(haloScale * 0.5 + 0.08), 0.01]}>
            <mesh renderOrder={998}>
              <planeGeometry args={[0.5 * avatarScale, 0.065]} />
              <meshBasicMaterial 
                color="#ffffff" 
                transparent 
                opacity={0.25} 
                toneMapped={false} 
                depthWrite={false} 
                depthTest={false} 
              />
            </mesh>
            {player.health !== undefined && player.health > 0 && (
              <mesh 
                position={[-0.5 * avatarScale / 2 + (0.5 * avatarScale * (player.health / 100)) / 2, 0, 0.001]}
                renderOrder={999}
              >
                <planeGeometry args={[0.5 * avatarScale * (player.health / 100), 0.052]} />
                <meshBasicMaterial 
                  color={
                    player.health < 35 ? '#ff0055' 
                    : player.health < 70 ? '#ff7700' 
                    : '#00ff66'
                  }
                  transparent={true}
                  toneMapped={false}
                  depthWrite={false}
                  depthTest={false}
                />
              </mesh>
            )}
            {player.health !== undefined && player.health > 0 && (
              <mesh 
                position={[-0.5 * avatarScale / 2 + (0.5 * avatarScale * (player.health / 100)) / 2, 0.027, 0.002]}
                renderOrder={1000}
              >
                <planeGeometry args={[0.5 * avatarScale * (player.health / 100), 0.006]} />
                <meshBasicMaterial 
                  color="#ffffff"
                  transparent
                  opacity={0.8}
                  toneMapped={false}
                  depthWrite={false}
                  depthTest={false}
                />
              </mesh>
            )}
            {player.health !== undefined && (
              <Text
                position={[0, 0, 0.003]}
                fontSize={0.042}
                fontWeight="bold"
                color="#050a15"
                anchorX="center"
                anchorY="middle"
                material-depthTest={false}
                material-depthWrite={false}
                renderOrder={1001}
              >
                {`${player.health} IT`}
              </Text>
            )}
          </group>
        </Billboard>
      ) : (
        rankTag && (() => {
          const match = rankTag.match(/^(#\d+)\s*(?:[•\/\-]\s*)?(.*)$/);
          const rankPart = match ? match[1] : rankTag;
          const scorePart = match && match[2] ? `• ${match[2]}` : '';

          return (
            <Billboard follow={true}>
              <group position={[0, -(haloScale * 0.5 + 0.06), 0.01]}>
                {scorePart ? (
                  <group>
                    <Text
                      position={[-0.015, 0, 0]}
                      fontSize={fontSize * 0.58}
                      fontWeight="900"
                      letterSpacing={0.04}
                      color={color || '#ffd700'}
                      anchorX="right"
                      anchorY="middle"
                      outlineWidth={0.014}
                      outlineColor="#050a16"
                      material-depthWrite={false}
                      frustumCulled={false}
                    >
                      {rankPart}
                    </Text>
                    <Text
                      position={[0.015, 0, 0]}
                      fontSize={fontSize * 0.48}
                      fontWeight="400"
                      letterSpacing={0.02}
                      color="#94a3b8"
                      anchorX="left"
                      anchorY="middle"
                      outlineWidth={0.01}
                      outlineColor="#050a16"
                      material-depthWrite={false}
                      frustumCulled={false}
                    >
                      {scorePart}
                    </Text>
                  </group>
                ) : (
                  <Text
                    fontSize={fontSize * 0.58}
                    fontWeight="900"
                    letterSpacing={0.04}
                    color={color || '#ffd700'}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.014}
                    outlineColor="#050a16"
                    material-depthWrite={false}
                    frustumCulled={false}
                  >
                    {rankTag}
                  </Text>
                )}
              </group>
            </Billboard>
          );
        })()
      )}

      <Billboard follow={true}>
        <Text
          position={[0, -(haloScale * 0.5 + (rankTag && !showHealth ? 0.17 : 0.20)), 0]}
          fontSize={fontSize * 1.05}
          fontWeight="800"
          letterSpacing={0.03}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#000000"
          material-depthWrite={false}
          frustumCulled={false}
        >
          {player.pseudo}
        </Text>
      </Billboard>
      
      {isMe && (
        <Billboard follow={true}>
          <mesh 
            ref={bracketsRef} 
            position={[0, avatarYOffset / 2, 0.005]} 
            renderOrder={1001}
          >
            <planeGeometry args={[avatarScale * 1.15, avatarScale * 1.15]} />
            <meshBasicMaterial 
              map={bracketsTexture} 
              transparent={true} 
              toneMapped={false}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}
