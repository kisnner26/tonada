import { palette, fold, scan, stateMap, cell, MONO } from './common.js';
import { pianoLayout, isBlack } from './layout.js';
import { noteName } from '../pitch.js';

const lo = 48, hi = 95;           // do3 a si6, cuatro octavas
const { white, count } = pianoLayout(lo, hi);

// láminas de madera en el orden del piano: las naturales abajo y las alteradas más arriba y más cortas
export default {
  lo, hi,
  size: avail => ({ w: Math.max(avail, 860), h: 270 }),
  geo(w) {
    const pad = 20, kw = (w - pad * 2) / count;
    // x del centro y alto de cada lámina; las agudas son más cortas
    const barH = m => 150 - ((m - lo) / (hi - lo)) * 64;
    const rect = m => {
      if (isBlack(m)) {
        const after = white[m - 1];
        return { x: pad + (after + 1) * kw - kw * 0.34, y: 14, w: kw * 0.68, h: barH(m) * 0.62 };
      }
      return { x: pad + white[m] * kw + 1.5, y: 112, w: kw - 3, h: barH(m) };
    };
    return { kw, rect };
  },
  xOf(m, w) { const r = this.geo(w).rect(fold(m, lo, hi)); return r.x + r.w / 2; },
  draw(g, w, h, ctx) {
    const pal = palette(g), { rect } = this.geo(w);
    const st = stateMap(scan(ctx, lo, hi));
    g.font = MONO;
    g.textAlign = 'center';
    const bars = [];
    for (let m = lo; m <= hi; m++) bars.push(m);
    // primero las naturales y encima las alteradas
    for (const pass of [false, true]) {
      for (const m of bars) {
        if (isBlack(m) !== pass) continue;
        const r = rect(m), s = st.get(m) || 'idle';
        cell(g, pal, r.x, r.y, r.w, r.h, s);
        // los dos cordones que sostienen la lámina
        g.fillStyle = s === 'now' ? pal.paper : pal.ink;
        for (const k of [0.2, 0.8]) {
          g.beginPath();
          g.arc(r.x + r.w / 2, r.y + r.h * k, 2.6, 0, Math.PI * 2);
          g.fill();
        }
        if (!pass && m % 12 === 0) {
          g.fillStyle = pal.ink;
          g.fillText(noteName(m), r.x + r.w / 2, r.y + r.h + 22);
        }
      }
    }
    g.textAlign = 'start';
  },
  hit(x, y, w) {
    const { rect } = this.geo(w);
    // las alteradas van encima, se prueban primero
    for (const pass of [true, false]) {
      for (let m = lo; m <= hi; m++) {
        if (isBlack(m) !== pass) continue;
        const r = rect(m);
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return m;
      }
    }
    return null;
  }
};
