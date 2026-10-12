import { hatchTile, LOOK } from '../roll.js';

export { LOOK };

const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// colores y trama actuales de la página, leídos del css
export function palette(g) {
  const ink = css('--ink'), paper = css('--paper-l');
  return { ink, paper, hatch: g.createPattern(hatchTile(ink, paper), 'repeat') };
}

// lleva una nota al rango [lo, hi] moviéndola por octavas
export function fold(m, lo, hi) {
  while (m < lo) m += 12;
  while (m > hi) m -= 12;
  return m;
}

// notas que importan en el instante t, ya plegadas al rango de la vista.
// now: está sonando. frac: 0 si suena ya, 1 si falta LOOK segundos. soon: empieza en menos de `soon` segundos
export function scan(ctx, lo, hi, soon = 0.8) {
  const out = [];
  for (const n of ctx.notes) {
    const d = n.t - ctx.t;
    const now = ctx.t >= n.t && ctx.t <= n.t + n.d;
    if (!now && (d <= 0 || d > LOOK)) continue;
    out.push({ m: fold(n.m + ctx.shift, lo, hi), now, soon: !now && d <= soon, frac: now ? 0 : d / LOOK });
  }
  for (const m of ctx.pressed || []) out.push({ m: fold(m, lo, hi), now: true, soon: false, frac: 0 });
  return out;
}

// estado de dibujo de una tecla o pieza: 'now' | 'soon' | 'idle'
export function stateMap(list) {
  const map = new Map();
  for (const n of list) {
    const was = map.get(n.m);
    if (n.now) map.set(n.m, 'now');
    else if (n.soon && was !== 'now') map.set(n.m, 'soon');
  }
  return map;
}

// rectángulo con borde y sombra dura según su estado
export function cell(g, pal, x, y, w, h, state, { shadow = true } = {}) {
  if (shadow && state !== 'idle') {
    g.fillStyle = pal.ink;
    g.fillRect(x + 3, y + 3, w, h);
  }
  g.fillStyle = state === 'now' ? pal.ink : state === 'soon' ? pal.hatch : pal.paper;
  g.fillRect(x, y, w, h);
  g.strokeStyle = state === 'now' ? pal.paper : pal.ink;
  g.lineWidth = 2;
  g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  if (state === 'now') {
    g.strokeStyle = pal.ink;
    g.strokeRect(x - 1, y - 1, w + 2, h + 2);
  }
}

// círculo con el mismo código de estados
export function dot(g, pal, x, y, r, state) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = state === 'now' ? pal.ink : state === 'soon' ? pal.hatch : pal.paper;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = state === 'now' ? pal.paper : pal.ink;
  g.stroke();
  if (state === 'now') {
    g.beginPath();
    g.arc(x, y, r + 2, 0, Math.PI * 2);
    g.strokeStyle = pal.ink;
    g.stroke();
  }
}

export const MONO = "600 10px 'Martian Mono', ui-monospace, monospace";
