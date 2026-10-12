import { palette, fold, scan, stateMap, MONO } from './common.js';
import { noteName } from '../pitch.js';

const lo = 60, hi = 84;           // do4 a do6, dos octavas

// flauta de pan: tubos cerrados por abajo con la boca alineada arriba. el largo sigue la física: la mitad de largo, una octava más aguda
export default {
  lo, hi,
  size: avail => ({ w: Math.max(avail, 760), h: 290 }),
  geo(w) {
    const pad = 28, dx = (w - pad * 2) / (hi - lo + 1), top = 30, longest = 210;
    const pipe = m => ({ x: pad + (m - lo) * dx + dx * 0.15, w: dx * 0.7, y: top, h: longest * Math.pow(2, -(m - lo) / 12) });
    return { pipe, top, dx, longest };
  },
  xOf(m, w) { const p = this.geo(w).pipe(fold(m, lo, hi)); return p.x + p.w / 2; },
  draw(g, w, h, ctx) {
    const pal = palette(g), { pipe, top, longest } = this.geo(w);
    const st = stateMap(scan(ctx, lo, hi));
    g.font = MONO;
    g.textAlign = 'center';
    for (let m = lo; m <= hi; m++) {
      const p = pipe(m), s = st.get(m) || 'idle';
      if (s !== 'idle') { g.fillStyle = pal.ink; g.fillRect(p.x + 3, p.y + 3, p.w, p.h); }
      g.fillStyle = s === 'now' ? pal.ink : s === 'soon' ? pal.hatch : pal.paper;
      g.fillRect(p.x, p.y, p.w, p.h);
      g.strokeStyle = pal.ink;
      g.lineWidth = 2;
      g.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
      // la boca del tubo
      g.beginPath();
      g.ellipse(p.x + p.w / 2, p.y + 1, p.w / 2 - 3, 4, 0, 0, Math.PI * 2);
      g.fillStyle = s === 'now' ? pal.paper : pal.ink;
      g.fill();
      if (m % 12 === 0) {
        g.fillStyle = pal.ink;
        g.fillText(noteName(m), p.x + p.w / 2, p.y + p.h + 18);
      }
    }
    // dos cintas que atan los tubos, solo donde el tubo llega hasta ellas
    const { dx } = this.geo(w);
    for (const y of [top + 48, top + 100]) {
      for (let m = lo; m <= hi; m++) {
        const p = pipe(m);
        if (p.h < y - top + 10) continue;
        g.fillStyle = pal.ink;
        g.fillRect(p.x - dx * 0.15, y, dx, 6);
      }
    }
    g.textAlign = 'start';
  },
  hit(x, y, w) {
    const { pipe } = this.geo(w);
    for (let m = lo; m <= hi; m++) {
      const p = pipe(m);
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return m;
    }
    return null;
  }
};
