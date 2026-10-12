import { palette, fold, scan, stateMap, MONO } from './common.js';
import { noteName } from '../pitch.js';

const lo = 48, hi = 96;           // do3 a do7

// peine de caja de música: las púas caen desde el cilindro sobre las láminas, más largas las graves
export default {
  lo, hi,
  size: avail => ({ w: Math.max(avail, 820), h: 270 }),
  geo(w, h) {
    const pad = 24, dx = (w - pad * 2) / (hi - lo + 1);
    const base = h - 56;                                  // arriba de la barra del peine
    const tine = m => {
      const len = 150 - ((m - lo) / (hi - lo)) * 78;
      return { x: pad + (m - lo + 0.5) * dx, tip: base - len, w: Math.max(6, dx * 0.5) };
    };
    return { tine, base, dx };
  },
  xOf(m, w, h) { return this.geo(w, h).tine(fold(m, lo, hi)).x; },
  draw(g, w, h, ctx) {
    const pal = palette(g), { tine, base } = this.geo(w, h);
    const marks = scan(ctx, lo, hi);
    const st = stateMap(marks);
    // cilindro: una banda con trama arriba
    g.fillStyle = pal.hatch;
    g.fillRect(8, 8, w - 16, 14);
    g.strokeStyle = pal.ink;
    g.lineWidth = 3;
    g.strokeRect(8, 8, w - 16, 14);
    // barra del peine
    g.fillStyle = pal.ink;
    g.fillRect(8, base, w - 16, 26);
    g.font = MONO;
    g.textAlign = 'center';
    for (let m = lo; m <= hi; m++) {
      const t = tine(m), s = st.get(m) || 'idle', top = t.tip;
      g.strokeStyle = pal.ink;
      g.globalAlpha = 0.18;
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(t.x, 24); g.lineTo(t.x, top); g.stroke();
      g.globalAlpha = 1;
      // la púa que vibra se dibuja dos veces, desfasada
      if (s === 'now') { g.fillStyle = pal.ink; g.fillRect(t.x - t.w / 2 + 3, top - 4, t.w, base - top + 4); }
      g.fillStyle = s === 'now' ? pal.ink : s === 'soon' ? pal.hatch : pal.paper;
      g.fillRect(t.x - t.w / 2, top, t.w, base - top + 2);
      g.strokeStyle = pal.ink;
      g.lineWidth = 2;
      g.strokeRect(t.x - t.w / 2 + 1, top + 1, t.w - 2, base - top);
      if (m % 12 === 0) { g.fillStyle = pal.paper; g.fillText(noteName(m), t.x, base + 17); }
    }
    // púas del cilindro cayendo hacia su lámina
    for (const n of marks) {
      if (n.now) continue;
      const t = tine(n.m), y = t.tip - 6 - n.frac * (t.tip - 40);
      g.beginPath();
      g.arc(t.x, y, 5, 0, Math.PI * 2);
      g.fillStyle = pal.ink;
      g.fill();
    }
    g.textAlign = 'start';
  },
  hit(x, y, w, h) {
    const { tine, base } = this.geo(w, h);
    if (y < 30 || y > base + 28) return null;
    let best = null, bestD = Infinity;
    for (let m = lo; m <= hi; m++) {
      const d = Math.abs(x - tine(m).x);
      if (d < bestD) { best = m; bestD = d; }
    }
    return bestD < 14 ? best : null;
  }
};
