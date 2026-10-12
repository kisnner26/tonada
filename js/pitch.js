import { fft, hann } from './fft.js';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const midiToHz = m => 440 * Math.pow(2, (m - 69) / 12);
export const hzToMidi = f => 69 + 12 * Math.log2(f / 440);
export const noteName = m => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

export const DEFAULTS = {
  fmin: 150,        // hz, límite grave de la búsqueda
  fmax: 4000,       // hz, límite agudo
  gate: 0.02,       // fracción del volumen típico por debajo de la cual es silencio
  minMs: 90         // las notas más cortas se descartan como ruido
};

// promedia los canales en uno solo
export function mixToMono(channels) {
  if (channels.length === 1) return channels[0];
  const out = new Float32Array(channels[0].length);
  for (const ch of channels) for (let i = 0; i < out.length; i++) out[i] += ch[i] / channels.length;
  return out;
}

// frecuencia del pico del espectro con interpolación parabólica
function peakHz(mag, lo, hi, binHz) {
  let k = lo;
  for (let i = lo + 1; i <= hi; i++) if (mag[i] > mag[k]) k = i;
  if (k <= lo || k >= hi) return k * binHz;
  const a = Math.log(mag[k - 1] + 1e-12), b = Math.log(mag[k] + 1e-12), c = Math.log(mag[k + 1] + 1e-12);
  const d = a - 2 * b + c;
  return (k + (d === 0 ? 0 : (0.5 * (a - c)) / d)) * binHz;
}

// samples: Float32Array mono. devuelve { notes: [{ m, t, d }], duration }
// m = nota midi, t = inicio en segundos, d = duración en segundos
export function transcribe(samples, sr, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const win = 1 << Math.round(Math.log2(sr * 0.046));
  const hop = Math.round(sr * 0.0232);
  const size = win * 4;
  const binHz = sr / size;
  const lo = Math.max(1, Math.floor(o.fmin / binHz)), hi = Math.min(size / 2 - 1, Math.ceil(o.fmax / binHz));
  const w = hann(win);
  const re = new Float32Array(size), im = new Float32Array(size), mag = new Float32Array(size / 2);

  const frames = Math.max(0, Math.floor((samples.length - win) / hop) + 1);
  const rms = new Float32Array(frames);
  const midi = new Int16Array(frames);
  for (let f = 0; f < frames; f++) {
    const off = f * hop;
    let e = 0;
    for (let i = 0; i < win; i++) { const v = samples[off + i]; e += v * v; re[i] = v * w[i]; }
    rms[f] = Math.sqrt(e / win);
    re.fill(0, win); im.fill(0);
    fft(re, im);
    for (let i = lo - 1; i <= hi + 1; i++) mag[i] = Math.hypot(re[i], im[i]);
    midi[f] = Math.round(hzToMidi(peakHz(mag, lo, hi, binHz)));
  }

  const sorted = Array.from(rms).sort((a, b) => a - b);
  const ref = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;
  const floor = Math.max(1e-4, ref * o.gate);
  const minFrames = Math.max(1, Math.ceil(o.minMs / 1000 / (hop / sr)));

  const notes = [];
  let f = 0;
  while (f < frames) {
    if (rms[f] < floor) { f++; continue; }
    let g = f;
    while (g + 1 < frames && rms[g + 1] >= floor && midi[g + 1] === midi[f]) g++;
    const next = g + 1;
    // la ventana desborda los bordes de la nota: se recortan los cuadros con poca energía
    let peak = 0;
    for (let i = f; i <= g; i++) peak = Math.max(peak, rms[i]);
    while (f < g && rms[f] < peak * 0.5) f++;
    while (g > f && rms[g] < peak * 0.25) g--;
    if (g - f + 1 >= minFrames) {
      const start = (f * hop + win / 2 - hop / 2) / sr;
      notes.push({ m: midi[f], t: +Math.max(0, start).toFixed(3), d: +(((g - f + 1) * hop) / sr).toFixed(3) });
    }
    f = next;
  }
  return { notes, duration: samples.length / sr };
}
