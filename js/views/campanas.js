import { palette, fold, scan, stateMap, MONO } from './common.js';
import { isBlack } from './layout.js';
import { noteName } from '../pitch.js';

const lo = 60, hi = 96;           // do4 a do7

// una hilera de campanas colgadas de una barra; las graves son más grandes y las alteradas cuelgan más bajo
export default {
  lo, hi,
  size: avail => ({ w: Math.max(avail, 900), h: 250 }),
  geo(w) {
    const pad = 28, dx = (w - pad * 2) / (hi - lo + 1);
    const bell = m => {
      const r = 17 - ((m - lo) / (hi - lo)) * 8;         // medio ancho
      const rim = 150 + (isBlack(m) ? 34 : 0);            // borde inferior
      return { x: pad + (m - lo + 0.5) * dx, r, rim, top: rim - r * 2.3 };
    };
    return { bell };
  },
  xOf(m, w) { return this.geo(w).bell(fold(m, lo, hi)).x; },
  draw(g, w, h, ctx) {
    const pal = palette(g), { bell } = this.geo(w);
    const st = stateMap(scan(ctx, lo, hi));
    // barra de la que cuelgan
    g.fillStyle = pal.ink;
    g.fillRect(8, 20, w - 16, 8);
    g.font = MONO;
    g.textAlign = 'center';
    for (let m = lo; m <= hi; m++) {
      const b = bell(m), s = st.get(m) || 'idle';
      g.strokeStyle = pal.ink;
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(b.x, 28); g.lineTo(b.x, b.top); g.stroke();
      // cuerpo de la campana
      const r = b.r, y0 = b.top, yb = b.rim;
      g.beginPath();
      g.moveTo(b.x - r, yb);
      g.bezierCurveTo(b.x - r, yb - r * 1.1, b.x - r * 0.45, y0 + r * 0.6, b.x - r * 0.45, y0 + r * 0.2);
      g.quadraticCurveTo(b.x, y0 - r * 0.25, b.x + r * 0.45, y0 + r * 0.2);
      g.bezierCurveTo(b.x + r * 0.45, y0 + r * 0.6, b.x + r, yb - r * 1.1, b.x + r, yb);
      g.closePath();
      if (s === 'now') { g.fillStyle = pal.ink; g.fill(); g.strokeStyle = pal.ink; g.lineWidth = 5; g.stroke(); g.strokeStyle = pal.paper; g.lineWidth = 2; g.stroke(); }
      else { g.fillStyle = s === 'soon' ? pal.hatch : pal.paper; g.fill(); g.strokeStyle = pal.ink; g.lineWidth = 2; g.stroke(); }
      // badajo
      g.beginPath();
      g.arc(b.x, yb + 3 + r * 0.25, Math.max(2.5, r * 0.26), 0, Math.PI * 2);
      g.fillStyle = pal.ink;
      g.fill();
      if (!isBlack(m) && m % 12 === 0) g.fillText(noteName(m), b.x, 236);
    }
    g.textAlign = 'start';
  },
  hit(x, y, w) {
    const { bell } = this.geo(w);
    let best = null, bestD = Infinity;
    for (let m = lo; m <= hi; m++) {
      const b = bell(m);
      if (y < 24 || y > b.rim + 14) continue;
      const d = Math.abs(x - b.x);
      if (d < b.r + 4 && d < bestD) { best = m; bestD = d; }
    }
    return best;
  }
};
