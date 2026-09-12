import * as THREE from 'three';

let cachedTexture: THREE.Texture | null = null;
let loadPromise: Promise<THREE.Texture> | null = null;

/**
 * Charge ou retourne la texture partagée de la Terre (GPU VRAM singleton).
 * Évite le rechargement et la duplication de textures lors du switch 2026/2070.
 */
export function loadSharedEarthTexture(onLoaded?: (tex: THREE.Texture) => void): THREE.Texture | null {
  if (cachedTexture) {
    if (onLoaded) onLoaded(cachedTexture);
    return cachedTexture;
  }

  if (!loadPromise) {
    const loader = new THREE.TextureLoader();
    loadPromise = new Promise((resolve) => {
      loader.load('/earth.webp', (tex) => {
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        cachedTexture = tex;
        resolve(tex);
      });
    });
  }

  loadPromise.then((tex) => {
    if (onLoaded) onLoaded(tex);
  });

  return cachedTexture;
}
