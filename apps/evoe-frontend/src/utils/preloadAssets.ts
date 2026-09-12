import { loadSharedEarthTexture } from './earthTexture';

let isPreloaded = false;

/**
 * Preloads heavy 3D assets & Earth textures in the background
 * during briefing video or initial app load.
 */
export function preloadEvoeAssets() {
  if (isPreloaded || typeof window === 'undefined') return;
  isPreloaded = true;

  try {
    // Pre-load 3D Earth texture into browser & GPU cache singleton
    loadSharedEarthTexture();

    // Warm up image cache
    const img = new Image();
    img.src = '/earth.webp';
  } catch (err) {
    console.warn('[EVOE Preloader] Non-critical warning:', err);
  }
}
