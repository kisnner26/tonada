import { palette, fold, scan, stateMap, cell, MONO } from './common.js';
import { isBlack } from './layout.js';

const lo = 48, hi = 107;          // do3 a si7, una fila por octava
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// pads de teclado de juguete: doce columnas (las notas) y una fila por octava, la más aguda arriba
export default {
  lo, hi,
  size: avail => ({ w: Math.max(avail, 760), h: 5 * 54 + 40 }),
  geo(w) {
    const pad = 20, cw = (w - pad * 2) / 12, ch = 46;
    const rect = m => {
      const oct = Math.floor((m - lo) / 12), col = (m - lo) % 12;
      return { x: pad + col * cw + 3, y: 16 + (4 - oct) * 54, w: cw - 6, h: ch };
    };
    return { rect };
  },
  xOf(m, w) { const r = this.geo(w).rect(fold(m, lo, hi)); return r.x + r.w / 2; },
  draw(g, w, h, ctx) {
    const pal = palette(g), { rect } = this.geo(w);
    const st = stateMap(scan(ctx, lo, hi));
    g.font = MONO;
    g.textAlign = 'center';
    for (let m = lo; m <= hi; m++) {
      const r = rect(m), s = st.get(m) || 'idle';
      cell(g, pal, r.x, r.y, r.w, r.h, s);
      const ink = s === 'now' ? pal.paper : pal.ink;
      if (isBlack(m) && s === 'idle') {   // las alteradas llevan una esquina marcada
        g.fillStyle = pal.ink;
        g.beginPath(); g.moveTo(r.x + 2, r.y + 2); g.lineTo(r.x + 16, r.y + 2); g.lineTo(r.x + 2, r.y + 16); g.closePath(); g.fill();
      }
      g.fillStyle = s === 'soon' ? pal.paper : ink;
      if (s === 'soon') { g.fillRect(r.x + r.w / 2 - 18, r.y + r.h / 2 - 9, 36, 18); g.fillStyle = pal.ink; }
      g.font = "700 13px 'Martian Mono', ui-monospace, monospace";
      g.fillText(NAMES[(m - lo) % 12], r.x + r.w / 2, r.y + r.h / 2 + 5);
      g.font = MONO;
      if (m % 12 === 0) g.fillText(String(Math.floor(m / 12) - 1), r.x + r.w - 10, r.y + 13);
    }
    g.textAlign = 'start';
  },
  hit(x, y, w) {
    const { rect } = this.geo(w);
    for (let m = lo; m <= hi; m++) {
      const r = rect(m);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return m;
    }
    return null;
  }
};
