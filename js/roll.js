import { LOW, HIGH } from './keyboard.js';

export const LOOK = 2.2; // segundos de notas visibles sobre el teclado

const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// dibuja las notas que caen hacia el teclado. t = tiempo actual en segundos de la melodía
export function drawRoll(canvas, kb, notes, t, { shift = 0, emptyText = '' } = {}) {
  const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  g.clearRect(0, 0, W, H);

  // una línea por cada do
  g.fillStyle = css('--ink');
  g.globalAlpha = 0.28;
  for (let m = LOW; m <= HIGH; m++) if (m % 12 === 0) g.fillRect(kb.x(m), 0, 2, H);
  g.globalAlpha = 1;

  if (!notes.length) {
    if (emptyText) {
      const sc = canvas.parentElement.parentElement;
      g.fillStyle = css('--ink');
      g.font = "600 30px 'Caveat', cursive";
      g.textBaseline = 'middle';
      g.fillText(emptyText, sc.scrollLeft + 24, H / 2);
    }
    return;
  }

  const ink = css('--ink'), steel = css('--mid'), hot = css('--hot');
  for (const n of notes) {
    const m = fit(n.m + shift);
    const h = Math.max(7, (n.d / LOOK) * H);
    const top = H - ((n.t + n.d - t) / LOOK) * H;
    if (top > H || top + h < 0) continue;
    const active = t >= n.t && t <= n.t + n.d;
    const x = kb.x(m) + 2, w = kb.w(m) - 4;
    g.fillStyle = ink;
    g.fillRect(x + 3, top + 3, w, h);          // sombra dura
    g.fillStyle = active ? hot : steel;
    g.fillRect(x, top, w, h);
    g.strokeStyle = ink;
    g.lineWidth = 2;
    g.strokeRect(x + 1, top + 1, w - 2, h - 2);
  }
}

// lleva una nota al rango del teclado moviéndola por octavas
export function fit(m) {
  while (m < LOW) m += 12;
  while (m > HIGH) m -= 12;
  return m;
}
