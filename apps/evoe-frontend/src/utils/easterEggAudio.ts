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

// Instance active du son cryptex pour permettre l'arrêt immédiat à la fermeture
let activeCryptexAudio: HTMLAudioElement | null = null;

/**
 * Arrête immédiatement la lecture sonore du Cryptex si active.
 */
export function stopCryptexSound(): void {
  if (activeCryptexAudio) {
    try {
      activeCryptexAudio.pause();
      activeCryptexAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeCryptexAudio = null;
  }
}

/**
 * Joue le son officiel du Cryptex (uploads/easter-eggs/cryptex.wav)
 * Détecte dynamiquement la durée réelle du fichier audio et applique un cache-busting
 * pour permettre à l'utilisateur de remplacer le fichier à chaud.
 * @returns La durée du fichier audio en secondes
 */
export async function playCryptexSound(): Promise<number> {
  if (typeof window === 'undefined') return 7.0;
  stopCryptexSound();

  // Cache-busting timestamp pour recharger instantanément si l'utilisateur change le fichier
  const t = Date.now();
  const candidateUrls = [
    `${getBackendOrigin()}/uploads/easter-eggs/cryptex.wav?t=${t}`,
    `/uploads/easter-eggs/cryptex.wav?t=${t}`,
  ];

  for (const url of candidateUrls) {
    try {
      const audio = new Audio(url);
      audio.volume = 0.9;
      activeCryptexAudio = audio;

      // Détection de la durée réelle du fichier audio
      const durationPromise = new Promise<number>((resolve) => {
        if (!isNaN(audio.duration) && audio.duration > 0) {
          resolve(audio.duration);
          return;
        }
        audio.addEventListener(
          'loadedmetadata',
          () => {
            resolve(audio.duration && !isNaN(audio.duration) ? audio.duration : 7.0);
          },
          { once: true }
        );
        // Timeout de sécurité au cas où les métadonnées tardent
        setTimeout(() => {
          resolve(audio.duration && !isNaN(audio.duration) ? audio.duration : 7.0);
        }, 250);
      });

      const playPromise = audio.play();
      const [duration] = await Promise.all([durationPromise, playPromise]);
      return duration;
    } catch {
      // Essayer le candidat suivant
    }
  }

  // Si le fichier audio est inaccessible, utiliser la synthèse Web Audio API
  playFallbackSynthesis();
  return 7.0;
}

/**
 * Joue le son réaliste d'un cran mécanique de Cryptex qui s'enclenche ("clic-clac").
 * Synthèse Web Audio API à double impact métallique (cliquet + encoche laiton).
 */
export function playWheelClickSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Fonction interne pour générer un impact mécanique réaliste (bruit filtré + résonance métallique)
    const playMechanicalImpact = (time: number, centerFreq: number, q: number, bodyFreq: number, duration: number, vol: number) => {
      // 1. Choc métallique (bruit blanc sculpté avec atténuation exponentielle)
      const sampleCount = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleCount * 0.22));
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(centerFreq, time);
      bandpass.Q.setValueAtTime(q, time);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(vol, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(time);
      noiseSource.stop(time + duration);

      // 2. Choc sourd du corps en laiton (onde triangulaire basse et courte)
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(bodyFreq, time);
      bodyOsc.frequency.exponentialRampToValueAtTime(bodyFreq * 0.45, time + duration * 0.9);

      bodyGain.gain.setValueAtTime(vol * 0.75, time);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 1.2);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(ctx.destination);

      bodyOsc.start(time);
      bodyOsc.stop(time + duration * 1.3);
    };

    // 1er temps ("CLIC") : Le ressort propulse le cliquet contre la roue (hautes fréquences métalliques)
    playMechanicalImpact(now, 3800, 5.0, 720, 0.022, 0.5);

    // 2ème temps ("CLAC") à +28ms : Le cran s'enclenche dans la gorge en laiton (impact plus lourd et sourd)
    playMechanicalImpact(now + 0.028, 2100, 3.5, 240, 0.042, 0.65);

  } catch (err) {
    console.warn('[EasterEgg Audio] Wheel click error:', err);
  }
}

/**
 * Sons d'ambiance et effets pour les victoires "WOOOW" (Chantier 3.2)
 */

// Son 1 : Pluie de code Matrix (Flux binaire numérique rapide)
export function playMatrixDigitalSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    for (let i = 0; i < 18; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = i * 0.08 + Math.random() * 0.04;
      const freq = 1200 + Math.random() * 2400;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + delay + 0.07);

      gain.gain.setValueAtTime(0.08, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.08);
    }
  } catch (e) {
    console.warn('[EasterEgg Audio] Matrix SFX error:', e);
  }
}

// Son 2 : Rétro Synthwave 80s (Arcade power-up arpeggio)
export function playRetroSynthwaveSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [220, 277.18, 329.63, 440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.06;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch (e) {
    console.warn('[EasterEgg Audio] Synthwave SFX error:', e);
  }
}

// Son 3 : Apesanteur Zéro-G (Sub-bass drone + vortex ascendant)
export function playAntigravitySound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 1.8);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.1);
  } catch (e) {
    console.warn('[EasterEgg Audio] Antigravity SFX error:', e);
  }
}

// Son 4 : Propulsion Réacteurs (Rugissement de plasma)
export function playRocketThrusterSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const sampleCount = Math.floor(ctx.sampleRate * 2.2);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleCount * 0.45));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + 2.0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(now);
    source.stop(now + 2.2);
  } catch (e) {
    console.warn('[EasterEgg Audio] Rocket SFX error:', e);
  }
}

// Son 5 : Flash Temporel 1985 (Charge d'énergie supraluminique + étincelles)
export function playTemporal1985Sound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.8);
    osc.frequency.exponentialRampToValueAtTime(88, now + 1.8);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.0);
  } catch (e) {
    console.warn('[EasterEgg Audio] Temporal 1985 SFX error:', e);
  }
}

// Son 6 : Disco Party (Arpège disco funky)
export function playDiscoPartySound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const bassLine = [130.81, 164.81, 196.00, 261.63, 196.00, 164.81, 130.81, 261.63];
    bassLine.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  } catch (e) {
    console.warn('[EasterEgg Audio] Disco party SFX error:', e);
  }
}

// Son 7 : Constellation Céleste (Carillon cristallin)
export function playConstellationChimeSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const freqs = [880, 1174.66, 1396.91, 1760];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.8);
    });
  } catch (e) {
    console.warn('[EasterEgg Audio] Constellation chime SFX error:', e);
  }
}

/**
 * Son rétro 8-bit pour chaque étape validée du Konami Code
 */
export function playKonamiStepSound(stepIndex: number): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const baseFreq = 380 + Math.min(stepIndex, 10) * 55;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {
    console.warn('[EasterEgg Audio] Konami step sound error:', e);
  }
}

/**
 * Son d'erreur / échec de la séquence Konami
 */
export function playKonamiErrorSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {
    console.warn('[EasterEgg Audio] Konami error sound error:', e);
  }
}

/**
 * Son de succès complet du Konami Code (Fanfare 8-bit NES rétro)
 */
export function playKonamiSuccessSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [
      { freq: 440, delay: 0 },
      { freq: 554.37, delay: 0.08 },
      { freq: 659.25, delay: 0.16 },
      { freq: 880, delay: 0.24 },
      { freq: 1108.73, delay: 0.36 },
      { freq: 1318.51, delay: 0.48 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + n.delay;

      osc.type = 'square';
      osc.frequency.setValueAtTime(n.freq, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  } catch (e) {
    console.warn('[EasterEgg Audio] Konami victory sound error:', e);
  }
}

