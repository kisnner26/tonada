import { noteName } from '../pitch.js';
import { palette, fold, scan, stateMap, dot, MONO } from './common.js';

// cuerda y casilla de una nota: la cuerda más aguda que todavía queda por debajo lleva el dedo más cerca de la cabeza
export function neckPos(strings, steps, m) {
  let best = null;
  strings.forEach((open, s) => {
    const step = m - open;
    if (step >= 0 && step <= steps && (!best || step < best.step)) best = { s, step };
  });
  return best;
}

// mástil de un instrumento de cuerda. strings: nota al aire de cada cuerda, de arriba (aguda) a abajo (grave)
// fretted: con trastes el dedo cae entre dos trastes; sin trastes (violín) cae sobre la cuerda
export function createNeck({ strings, steps, fretted, inlays = [], thickness }) {
  const lo = Math.min(...strings), hi = Math.max(...strings) + steps;
  const span = 1 - Math.pow(2, -steps / 12);

  function geo(w, h) {
    const left = 64, right = w - 24, top = 40, bottom = h - 44;
    const len = right - left;
    const edge = n => left + (len * (1 - Math.pow(2, -n / 12))) / span;   // posición del traste n
    const y = s => top + (s * (bottom - top)) / (strings.length - 1);
    const cx = n => (n === 0 ? left - 24 : fretted ? (edge(n - 1) + edge(n)) / 2 : edge(n));
    return { left, right, top, bottom, edge, y, cx };
  }

  function draw(g, w, h, ctx) {
    const pal = palette(g), G = geo(w, h);
    const marks = scan(ctx, lo, hi);

    // tabla
    g.fillStyle = pal.paper;
    g.fillRect(G.left, G.top - 14, G.right - G.left, G.bottom - G.top + 28);
    g.strokeStyle = pal.ink;
    g.lineWidth = 3;
    g.strokeRect(G.left, G.top - 14, G.right - G.left, G.bottom - G.top + 28);

    // trastes, o marcas de semitono en el violín
    g.fillStyle = pal.ink;
    g.font = MONO;
    g.textAlign = 'center';
    for (let n = 1; n <= steps; n++) {
      const x = G.edge(n);
      if (fretted) {
        g.fillRect(x - 1, G.top - 14, 2, G.bottom - G.top + 28);
        g.fillText(String(n), (G.edge(n - 1) + x) / 2, G.bottom + 34);
      } else {
        g.fillRect(x - 1, G.top - 14, 2, 8);
        g.fillRect(x - 1, G.bottom + 6, 2, 8);
      }
    }
    g.fillRect(G.left - 3, G.top - 14, 6, G.bottom - G.top + 28);   // cejuela

    // incrustaciones de puntos
    for (const n of inlays) {
      const x = (G.edge(n - 1) + G.edge(n)) / 2, mid = (G.top + G.bottom) / 2;
      const ys = n === 12 ? [mid - (G.bottom - G.top) * 0.28, mid + (G.bottom - G.top) * 0.28] : [mid];
      for (const yy of ys) {
        g.beginPath();
        g.arc(x, yy, 4.5, 0, Math.PI * 2);
        g.fillStyle = pal.ink;
        g.fill();
      }
    }

    // cuerdas y su nota al aire
    g.textAlign = 'right';
    strings.forEach((open, s) => {
      g.fillStyle = pal.ink;
      g.fillRect(G.left, G.y(s) - thickness[s] / 2, G.right - G.left, thickness[s]);
      g.fillText(noteName(open), G.left - 40, G.y(s) + 4);
    });

    // dedos
    const st = stateMap(marks);
    for (const [m, state] of st) {
      const p = neckPos(strings, steps, m);
      if (p) dot(g, pal, G.cx(p.step), G.y(p.s), 11, state);
    }
    g.textAlign = 'start';
  }

  function hit(x, y, w, h) {
    const G = geo(w, h);
    if (y < G.top - 22 || y > G.bottom + 22) return null;
    const gap = (G.bottom - G.top) / (strings.length - 1);
    const s = Math.min(strings.length - 1, Math.max(0, Math.round((y - G.top) / gap)));
    let step = 0;
    if (x >= G.left) {
      let best = Infinity;
      for (let n = 1; n <= steps; n++) {
        const d = Math.abs(x - G.cx(n));
        if (d < best) { best = d; step = n; }
      }
    }
    return strings[s] + step;
  }

  return {
    lo, hi,
    size: avail => ({ w: Math.max(avail, 820), h: 250 }),
    xOf: (m, w, h) => {
      const p = neckPos(strings, steps, fold(m, lo, hi));
      return p ? geo(w, h).cx(p.step) : 0;
    },
    draw, hit
  };
}
