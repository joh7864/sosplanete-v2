/**
 * Utilitaire de restitution sonore haute fidélité pour les Easter Eggs
 * Charge le fichier SFX dédié stocké dans uploads/audio/unlock-cadenas.wav
 * Avec repli automatique Web Audio API en cas de déconnexion ou blocage.
 */

function getBackendOrigin(): string {
  try {
    const evoeUrl = import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe';
    const parsed = new URL(evoeUrl);
    return parsed.origin;
  } catch {
    return 'http://localhost:3011';
  }
}

// URLs audio candidates
export const UNLOCK_CADENAS_AUDIO_URL = `${getBackendOrigin()}/uploads/audio/unlock-cadenas.wav`;
export const UNLOCK_CADENAS_STATIC_URL = `${getBackendOrigin()}/static/audio/unlock-cadenas.wav`;

// Cache audio pour réactivité instantanée
let preloadedAudio: HTMLAudioElement | null = null;

export function preloadUnlockAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!preloadedAudio) {
      preloadedAudio = new Audio(UNLOCK_CADENAS_AUDIO_URL);
      preloadedAudio.preload = 'auto';
      preloadedAudio.load();
    }
  } catch (e) {
    console.warn('[EasterEgg Audio] Preload failed:', e);
  }
}

/**
 * Synthétiseur Web Audio API de secours (clic mécanique + carillon SF)
 * Garantit un son parfait même si le serveur backend est inaccessible
 */
function playFallbackSynthesis(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;

    // 1. Clic mécanique (tumbler snap)
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(1400, now);
    oscClick.frequency.exponentialRampToValueAtTime(180, now + 0.04);

    gainClick.gain.setValueAtTime(0.5, now);
    gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    oscClick.connect(gainClick);
    gainClick.connect(ctx.destination);
    oscClick.start(now);
    oscClick.stop(now + 0.06);

    // 2. Ressort métallique lourd (shackle release)
    const oscSpring = ctx.createOscillator();
    const gainSpring = ctx.createGain();
    oscSpring.type = 'sawtooth';
    oscSpring.frequency.setValueAtTime(680, now + 0.03);
    oscSpring.frequency.exponentialRampToValueAtTime(320, now + 0.12);

    gainSpring.gain.setValueAtTime(0, now);
    gainSpring.gain.setValueAtTime(0.4, now + 0.03);
    gainSpring.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    oscSpring.connect(gainSpring);
    gainSpring.connect(ctx.destination);
    oscSpring.start(now + 0.03);
    oscSpring.stop(now + 0.15);

    // 3. Carillon SF harmonieux ascendant (C5, E5, G5, B5, C6, E6)
    const notes = [
      { delay: 0.08, freq: 523.25 }, // C5
      { delay: 0.14, freq: 659.25 }, // E5
      { delay: 0.20, freq: 783.99 }, // G5
      { delay: 0.26, freq: 987.77 }, // B5
      { delay: 0.32, freq: 1046.5 }, // C6
      { delay: 0.40, freq: 1318.51 }, // E6
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.delay);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.3, now + n.delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.delay + 1.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.delay);
      osc.stop(now + n.delay + 1.7);
    });

    // 4. Impulsion Sub-Bass énergétique
    const oscSub = ctx.createOscillator();
    const gainSub = ctx.createGain();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(75, now + 0.06);
    oscSub.frequency.exponentialRampToValueAtTime(45, now + 0.45);

    gainSub.gain.setValueAtTime(0.35, now + 0.06);
    gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    oscSub.connect(gainSub);
    gainSub.connect(ctx.destination);
    oscSub.start(now + 0.06);
    oscSub.stop(now + 0.52);
  } catch (err) {
    console.warn('[EasterEgg Audio] Fallback audio error:', err);
  }
}

/**
 * Joue le son de déverrouillage de l'Easter Egg.
 * Tente d'abord de lire le fichier audio uploads/audio/unlock-cadenas.wav,
 * puis bascule sans interruption sur la route /static ou la synthèse Web Audio.
 */
export async function playUnlockCadenasSound(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const audio = new Audio(UNLOCK_CADENAS_AUDIO_URL);
    audio.volume = 0.9;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise;
    }
  } catch (audioErr) {
    try {
      const staticAudio = new Audio(UNLOCK_CADENAS_STATIC_URL);
      staticAudio.volume = 0.9;
      await staticAudio.play();
    } catch {
      playFallbackSynthesis();
    }
  }
}
