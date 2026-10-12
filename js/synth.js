import { midiToHz } from './pitch.js';

// parciales del piano: [armónico, amplitud relativa]
const PIANO = [[1, 1], [2, 0.42], [3, 0.2], [4, 0.1], [5, 0.05]];

// cuánto resuena una nota: las graves duran más que las agudas
function ring(m, dur) {
  return Math.max(0.5, Math.min(2.2, 2.6 - (m - 48) * 0.03)) + dur * 0.4;
}

const timbres = {
  piano(ctx, m, when, dur, dest) {
    const f = midiToHz(m), len = ring(m, dur);
    const g = ctx.createGain();
    g.connect(dest);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.5, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.18, when + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    for (const [h, a] of PIANO) {
      if (f * h > 9000) continue;
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f * h;
      og.gain.value = a * 0.28;
      o.connect(og); og.connect(g);
      o.start(when); o.stop(when + len + 0.05);
    }
  }
};

export const TIMBRES = Object.keys(timbres);

export function playNote(ctx, timbre, m, when, dur, dest) {
  (timbres[timbre] || timbres.piano)(ctx, m, when, dur, dest);
}
