/**
 * Générateur audio Web Audio API pour l'Easter Egg Disco Party
 * Riff disco funky inspiré de "Stayin' Alive" à 104 BPM
 * Synthétisé 100% en local sans asset externe
 */

export interface DiscoAudioController {
  stop: () => void;
}

export function startDiscoGroove(): DiscoAudioController {
  if (typeof window === 'undefined') {
    return { stop: () => {} };
  }

  let isPlaying = true;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let ctx: AudioContext | null = null;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return { stop: () => {} };

    ctx = new AudioCtx();
    if (ctx.state === 'suspended') void ctx.resume();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // 104 BPM -> 1 mesure (4 temps) = 2.307 secondes, 1 temps = 0.5769s
    const tempo = 104;
    const beatSec = 60 / tempo;
    const measureSec = beatSec * 4;

    // Buffer de bruit blanc pour les charlestons (Hi-hats)
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Joue un coup de grosse caisse (Kick 4-on-the-floor)
    const playKick = (time: number) => {
      if (!ctx || !isPlaying) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);
      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.16);
    };

    // Joue un charleston (Hi-hat disco)
    const playHiHat = (time: number, isOpen = false) => {
      if (!ctx || !isPlaying) return;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, time);
      const gain = ctx.createGain();
      const decay = isOpen ? 0.14 : 0.05;
      gain.gain.setValueAtTime(isOpen ? 0.28 : 0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(time);
      noise.stop(time + decay + 0.01);
    };

    // Joue une note de basse funky (Slap bass Stayin' Alive)
    const playBassNote = (freq: number, time: number, dur: number) => {
      if (!ctx || !isPlaying) return;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, time);
      filter.frequency.exponentialRampToValueAtTime(260, time + dur * 0.8);
      filter.Q.setValueAtTime(5, time);

      gain.gain.setValueAtTime(0.55, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    };

    // Joue un accord synthétique (Stab disco cuivré sur le contretemps)
    const playDiscoChord = (time: number) => {
      if (!ctx || !isPlaying) return;
      const chordFreqs = [349.23, 415.3, 523.25, 622.25]; // Fm7 (F4, Ab4, C5, Eb5)
      chordFreqs.forEach((freq) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + 0.2);
      });
    };

    // Séquenceur d'une mesure (Groove Stayin' Alive en F mineur)
    const scheduleMeasure = (startTime: number) => {
      // 1. Kick sur chaque temps (4-on-the-floor)
      for (let beat = 0; beat < 4; beat++) {
        playKick(startTime + beat * beatSec);
      }

      // 2. Charlestons sur les 8èmes de temps (charleston ouvert sur le contretemps)
      for (let eighth = 0; eighth < 8; eighth++) {
        const isOpen = eighth % 2 === 1;
        playHiHat(startTime + eighth * (beatSec / 2), isOpen);
      }

      // 3. Riff de basse culte inspiré de Stayin' Alive
      // F2 (87.3Hz) -> F2 -> Ab2 (103.8Hz) -> Bb2 (116.5Hz) -> C3 (130.8Hz) -> Bb2 -> Ab2 -> F2
      const step = beatSec / 2;
      const bassMotif = [
        { freq: 87.31, dur: 0.18 }, // F2
        { freq: 87.31, dur: 0.18 }, // F2
        { freq: 103.83, dur: 0.22 }, // Ab2
        { freq: 116.54, dur: 0.22 }, // Bb2
        { freq: 130.81, dur: 0.28 }, // C3
        { freq: 116.54, dur: 0.2 }, // Bb2
        { freq: 103.83, dur: 0.2 }, // Ab2
        { freq: 87.31, dur: 0.24 }, // F2
      ];

      bassMotif.forEach((note, idx) => {
        playBassNote(note.freq, startTime + idx * step, note.dur);
      });

      // 4. Stabs de cuivres disco sur les contretemps
      playDiscoChord(startTime + beatSec * 0.5);
      playDiscoChord(startTime + beatSec * 1.5);
      playDiscoChord(startTime + beatSec * 2.5);
      playDiscoChord(startTime + beatSec * 3.5);
    };

    // Planifier la première mesure immédiatement
    const initialTime = ctx.currentTime + 0.05;
    scheduleMeasure(initialTime);

    // Boucle continue toutes les mesures
    let nextMeasureTime = initialTime + measureSec;
    intervalId = setInterval(() => {
      if (!isPlaying || !ctx) return;
      scheduleMeasure(nextMeasureTime);
      nextMeasureTime += measureSec;
    }, measureSec * 1000 - 80);
  } catch (err) {
    console.warn('[DiscoGrooveAudio] Error starting disco audio:', err);
  }

  const stop = () => {
    isPlaying = false;
    if (intervalId) clearInterval(intervalId);
    if (ctx) {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }
  };

  return { stop };
}
