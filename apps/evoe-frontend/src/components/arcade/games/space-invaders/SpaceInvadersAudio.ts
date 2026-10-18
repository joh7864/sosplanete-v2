/**
 * Synthétiseur procédural Web Audio 8-bit autonome pour Space Invaders
 * Zéro téléchargement d'asset audio externe, 100% procédural.
 */

class SpaceInvadersAudioEngine {
  private ctx: AudioContext | null = null;
  private ufoOscillator: OscillatorNode | null = null;
  private ufoGain: GainNode | null = null;
  private ufoLfo: OscillatorNode | null = null;
  private ufoLfoGain: GainNode | null = null;
  private hitNoiseBuffer: AudioBuffer | null = null;
  private explosionNoiseBuffer: AudioBuffer | null = null;
  private enabled: boolean = true;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopUfoSound();
    }
  }

  /**
   * Les 4 notes descendantes emblématiques de la marche des envahisseurs
   * noteIndex: 0, 1, 2, 3
   */
  public playMarchSound(noteIndex: number) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Fréquences rétro (B1, A#1, A1, G#1)
    const frequencies = [123.47, 116.54, 110.0, 103.83];
    const freq = frequencies[noteIndex % 4];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  /**
   * Tir laser du joueur
   */
  public playPlayerLaser() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  /**
   * Destruction d'un alien (crunch 8-bit)
   */
  public playAlienHit() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    if (!this.hitNoiseBuffer) {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.hitNoiseBuffer = buffer;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.hitNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.08);
  }

  /**
   * Explosion du joueur (impact mortel)
   */
  public playPlayerExplosion() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    if (!this.explosionNoiseBuffer) {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.explosionNoiseBuffer = buffer;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.explosionNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.45);
  }

  /**
   * Sirène oscillante du vaisseau mystère rouge (UFO)
   */
  public startUfoSound() {
    if (!this.enabled || this.ufoOscillator) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.ufoOscillator = this.ctx.createOscillator();
      this.ufoLfo = this.ctx.createOscillator();
      this.ufoLfoGain = this.ctx.createGain();
      this.ufoGain = this.ctx.createGain();

      this.ufoOscillator.type = 'sine';
      this.ufoOscillator.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.ufoLfo.type = 'sine';
      this.ufoLfo.frequency.setValueAtTime(5, this.ctx.currentTime); // 5 Hz modulation
      this.ufoLfoGain.gain.setValueAtTime(80, this.ctx.currentTime);

      // Chaîne modulation : LFO -> LfoGain -> Oscillator.frequency
      this.ufoLfo.connect(this.ufoLfoGain);
      this.ufoLfoGain.connect(this.ufoOscillator.frequency);

      this.ufoGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.ufoOscillator.connect(this.ufoGain);
      this.ufoGain.connect(this.ctx.destination);

      this.ufoLfo.start();
      this.ufoOscillator.start();
    } catch {
      // Ignorer si audio non démarré
    }
  }

  public stopUfoSound() {
    if (this.ufoLfo) {
      try {
        this.ufoLfo.stop();
        this.ufoLfo.disconnect();
      } catch {}
      this.ufoLfo = null;
    }
    if (this.ufoLfoGain) {
      try {
        this.ufoLfoGain.disconnect();
      } catch {}
      this.ufoLfoGain = null;
    }
    if (this.ufoOscillator) {
      try {
        this.ufoOscillator.stop();
        this.ufoOscillator.disconnect();
      } catch {}
      this.ufoOscillator = null;
    }
    if (this.ufoGain) {
      try {
        this.ufoGain.disconnect();
      } catch {}
      this.ufoGain = null;
    }
  }

  /**
   * Chime triomphal de fin de vague / Vague réussie
   */
  public playWaveCleared() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.18, this.ctx!.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.08 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + idx * 0.08);
      osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.22);
    });
  }

  /**
   * Jingle d'amélioration de canon (Power-up)
   */
  public playPowerUp() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [330, 440, 554, 660, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx!.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + idx * 0.05);
      osc.stop(this.ctx!.currentTime + idx * 0.05 + 0.15);
    });
  }

  /**
   * Son de réapparition et déploiement d'une nouvelle vie (Re-entry 8-bit)
   */
  public playPlayerRespawn() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Faisceau / sweep ascendant de matérialisation
    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(160, this.ctx.currentTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.22);

    sweepGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);
    sweepOsc.start(this.ctx.currentTime);
    sweepOsc.stop(this.ctx.currentTime + 0.22);

    // Arpège 8-bit triomphal de réarmement (C5, E5, G5, C6)
    const arpeggio = [523.25, 659.25, 783.99, 1046.5];
    arpeggio.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      const startTime = this.ctx!.currentTime + 0.08 + idx * 0.06;
      const duration = 0.12;

      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.16, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }
}

export const spaceInvadersAudio = new SpaceInvadersAudioEngine();
