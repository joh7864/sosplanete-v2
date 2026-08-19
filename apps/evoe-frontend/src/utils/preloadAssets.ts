import * as THREE from 'three';

let isPreloaded = false;

/**
 * Preloads heavy 3D assets & Earth textures in the background
 * during briefing video or initial app load.
 */
export function preloadEvoeAssets() {
  if (isPreloaded || typeof window === 'undefined') return;
  isPreloaded = true;

  try {
    // Pre-load 3D Earth textures into browser & GPU cache
    const loader = new THREE.TextureLoader();
    
    loader.load('/earth_texture.jpg', undefined, undefined, () => {
      loader.load('/earth_texture.png');
    });

    // Warm up image cache
    const img = new Image();
    img.src = '/earth_texture.jpg';
  } catch (err) {
    console.warn('[EVOE Preloader] Non-critical warning:', err);
  }
}
