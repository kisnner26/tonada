import { midiToHz } from './pitch.js';

// parciales del piano: [armónico, amplitud relativa]
const PIANO = [[1, 1], [2, 0.42], [3, 0.2], [4, 0.1], [5, 0.05]];

// cuánto resuena una nota: las graves duran más que las agudas
function ring(m, dur) {
  return Math.max(0.5, Math.min(2.2, 2.6 - (m - 48) * 0.03)) + dur * 0.4;
}

// vibrato: un oscilador lento que mueve la frecuencia de osc, desde start hasta end
function vibrato(ctx, osc, depthHz, start, end, rate) {
  const lfo = ctx.createOscillator(), amt = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = rate;
  amt.gain.value = depthHz;
  lfo.connect(amt); amt.connect(osc.frequency);
  lfo.start(start); lfo.stop(end);
}

// soplido: un golpe corto de ruido filtrado alrededor de hz
function breath(ctx, hz, when, len, dest) {
  const n = Math.max(1, Math.floor(ctx.sampleRate * len));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf;
  bp.type = 'bandpass';
  bp.frequency.value = Math.min(8000, hz);
  g.gain.value = 0.12;
  src.connect(bp); bp.connect(g); g.connect(dest);
  src.start(when); src.stop(when + len);
}

const timbres = {
  piano: { label: 'piano', play(ctx, m, when, dur, dest) {
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
  } },

  // zumbador de juguete: onda cuadrada sin caída, como el chip de un peluche musical
  juguete: { label: 'juguete', play(ctx, m, when, dur, dest) {
    const f = midiToHz(m), len = Math.max(0.08, dur);
    const g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5000;
    lp.connect(dest);
    g.connect(lp);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.16, when + 0.004);
    g.gain.setValueAtTime(0.16, when + len * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len + 0.03);
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = f;
    o.connect(g);
    o.start(when); o.stop(when + len + 0.05);
  } },

  // caja de música: láminas metálicas con parciales inarmónicos
  caja: { label: 'caja de música', play(ctx, m, when, dur, dest) {
    const f = midiToHz(m), len = 1.4 + dur * 0.3;
    const g = ctx.createGain();
    g.connect(dest);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.4, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    for (const [h, a] of [[1, 1], [2.76, 0.35], [5.4, 0.12]]) {
      if (f * h > 9000) continue;
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f * h;
      og.gain.value = a * 0.3;
      o.connect(og); og.connect(g);
      o.start(when); o.stop(when + len + 0.05);
    }
  } },

  // órgano: barras de armónicos que se sostienen mientras dura la nota
  organo: { label: 'órgano', play(ctx, m, when, dur, dest) {
    const f = midiToHz(m), len = Math.max(0.12, dur);
    const g = ctx.createGain();
    g.connect(dest);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.22, when + 0.012);
    g.gain.setValueAtTime(0.22, when + len);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len + 0.09);
    for (const [h, a] of [[1, 1], [2, 0.7], [3, 0.45], [4, 0.3], [6, 0.15]]) {
      if (f * h > 12000) continue;
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f * h;
      og.gain.value = a * 0.4;
      o.connect(og); og.connect(g);
      o.start(when); o.stop(when + len + 0.12);
    }
  } },

  // guitarra: diente de sierra con un filtro que se cierra rápido, como una cuerda pulsada
  guitarra: { label: 'guitarra', play(ctx, m, when, dur, dest) {
    const f = midiToHz(m), len = 0.9 + dur * 0.3;
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(9000, f * 7), when);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.4), when + 0.3);
    lp.connect(g);
    g.connect(dest);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.32, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.connect(lp);
    o.start(when); o.stop(when + len + 0.05);
  } },

  // marimba: fundamental y cuarta octava con caída corta, más larga en los graves
  marimba: { label: 'marimba', play(ctx, m, when, dur, dest) {
    const f = midiToHz(m), len = 0.3 + 0.7 * (1 - Math.min(1, Math.max(0, (m - 36) / 72)));
    const g = ctx.createGain();
    g.connect(dest);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.5, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    for (const [h, a] of [[1, 1], [4, 0.28]]) {
      if (f * h > 12000) continue;
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f * h;
      og.gain.value = a * 0.5;
      o.connect(og); og.connect(g);
      o.start(when); o.stop(when + len + 0.05);
    }
  } },

  // flauta: seno con vibrato tardío y un soplido corto al atacar
  flauta: { label: 'flauta', play(ctx, m, when, dur, dest) {
    const f = midiToHz(m), len = Math.max(0.2, dur);
    const g = ctx.createGain();
    g.connect(dest);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.3, when + 0.06);
    g.gain.setValueAtTime(0.3, when + len);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len + 0.14);
    for (const [h, a] of [[1, 1], [2, 0.14]]) {
      if (f * h > 12000) continue;
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f * h;
      og.gain.value = a;
      o.connect(og); og.connect(g);
      vibrato(ctx, o, f * h * 0.006, when + 0.15, when + len + 0.16, 5.4);
      o.start(when); o.stop(when + len + 0.16);
    }
    breath(ctx, f * 2, when, 0.12, g);
  } },

  // cuerdas: dos dientes de sierra desafinados, ataque lento y vibrato
  cuerdas: { label: 'cuerdas', play(ctx, m, when, dur, dest) {
    const f = midiToHz(m), len = Math.max(0.3, dur);
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(8000, f * 5);
    lp.connect(g);
    g.connect(dest);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.2, when + 0.09);
    g.gain.setValueAtTime(0.2, when + len);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len + 0.22);
    for (const cents of [-7, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = cents;
      o.connect(lp);
      vibrato(ctx, o, f * 0.005, when + 0.2, when + len + 0.24, 5.2);
      o.start(when); o.stop(when + len + 0.24);
    }
  } }
};

export const TIMBRES = Object.entries(timbres).map(([id, t]) => ({ id, label: t.label }));

export function playNote(ctx, timbre, m, when, dur, dest) {
  (timbres[timbre] || timbres.piano).play(ctx, m, when, dur, dest);
}
