const fs = require('fs');
const path = require('path');

function generateWav(filename) {
  const sampleRate = 44100;
  const duration = 2.2; // 2.2 seconds
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 2; // stereo
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Layer 1: Mechanical Lock Click (0 to 0.12s)
    let click = 0;
    if (t < 0.04) {
      // Tumbler catch ping
      const freq = 1800 - t * 25000;
      const env = Math.exp(-t * 90);
      click += Math.sin(2 * Math.PI * Math.max(200, freq) * t) * env * 0.45;
      // High frequency snap noise
      click += (Math.random() * 2 - 1) * env * 0.35;
    }
    if (t >= 0.035 && t < 0.12) {
      // Heavy metallic shackle spring release
      const tShackle = t - 0.035;
      const shackleEnv = Math.exp(-tShackle * 45);
      const ringFreq = 720;
      click += Math.sin(2 * Math.PI * ringFreq * tShackle) * shackleEnv * 0.6;
      click += Math.sin(2 * Math.PI * 1440 * tShackle) * shackleEnv * 0.3;
      click += (Math.random() * 2 - 1) * Math.exp(-tShackle * 120) * 0.3;
    }

    // Layer 2: Futuristic Sci-Fi Chime Arpeggio & Harmonic Chord
    // Notes: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), C6 (1046.50)
    let chimeLeft = 0;
    let chimeRight = 0;

    const notes = [
      { start: 0.08, freq: 523.25, pan: -0.3, amp: 0.35 }, // C5
      { start: 0.14, freq: 659.25, pan: 0.2, amp: 0.35 },  // E5
      { start: 0.20, freq: 783.99, pan: -0.2, amp: 0.38 }, // G5
      { start: 0.26, freq: 987.77, pan: 0.3, amp: 0.35 },  // B5
      { start: 0.32, freq: 1046.5, pan: 0.0, amp: 0.45 },  // C6 (Triumph)
      { start: 0.40, freq: 1318.51, pan: 0.1, amp: 0.25 }, // E6 sparkle
      { start: 0.45, freq: 1567.98, pan: -0.1, amp: 0.2 }, // G6 sparkle
    ];

    notes.forEach(note => {
      if (t >= note.start) {
        const noteT = t - note.start;
        // Exponential decay envelope
        const env = Math.exp(-noteT * 2.1);
        // Subtle shimmer vibrato
        const mod = Math.sin(2 * Math.PI * 6 * noteT) * 3;
        const fundamental = Math.sin(2 * Math.PI * (note.freq + mod) * noteT);
        // 2nd and 3rd harmonics for bell warmth
        const harm2 = Math.sin(2 * Math.PI * (note.freq * 2) * noteT) * 0.35;
        const harm3 = Math.sin(2 * Math.PI * (note.freq * 3) * noteT) * 0.15;
        const sample = (fundamental + harm2 + harm3) * env * note.amp;

        // Stereo panning
        const leftGain = 0.5 * (1 - note.pan);
        const rightGain = 0.5 * (1 + note.pan);
        chimeLeft += sample * leftGain;
        chimeRight += sample * rightGain;
      }
    });

    // Layer 3: Warm sub-bass pulse on unlock (0.05 to 0.6s)
    let subBass = 0;
    if (t >= 0.05 && t < 0.8) {
      const subT = t - 0.05;
      const subEnv = Math.exp(-subT * 4.5);
      subBass = Math.sin(2 * Math.PI * 65 * subT) * subEnv * 0.35;
    }

    let left = click + chimeLeft + subBass;
    let right = click + chimeRight + subBass;

    // Master limiting & soft clipping
    left = Math.tanh(left * 0.95);
    right = Math.tanh(right * 0.95);

    const intLeft = Math.max(-32768, Math.min(32767, Math.floor(left * 32767)));
    const intRight = Math.max(-32768, Math.min(32767, Math.floor(right * 32767)));

    buffer.writeInt16LE(intLeft, offset);
    buffer.writeInt16LE(intRight, offset + 2);
    offset += 4;
  }

  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename} (${buffer.length} bytes)`);
}

const outDir = path.resolve('c:/Users/User/Documents/Sync Pcloud/Professionnel/Dev/sosplanete-v2/uploads/audio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

generateWav(path.join(outDir, 'unlock-cadenas.wav'));
