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

  const ink = css('--ink'), paper = css('--paper-l'), hot = css('--hot');
  const hatch = g.createPattern(hatchTile(ink, paper), 'repeat');
  for (const n of notes) {
    const m = fit(n.m + shift);
    const h = Math.max(7, (n.d / LOOK) * H);
    const top = H - ((n.t + n.d - t) / LOOK) * H;
    if (top > H || top + h < 0) continue;
    const active = t >= n.t && t <= n.t + n.d;
    const x = kb.x(m) + 2, w = kb.w(m) - 4;
    g.fillStyle = ink;
    g.fillRect(x + 3, top + 3, w, h);          // sombra dura
    g.fillStyle = active ? hot : hatch;
    g.fillRect(x, top, w, h);
    g.strokeStyle = active ? paper : ink;      // la nota sonando lleva un filo interior
    g.lineWidth = 2;
    g.strokeRect(x + 1, top + 1, w - 2, h - 2);
  }
}

// baldosa de rayas diagonales: la trama de las notas que todavía no suenan
let tile = null, tileKey = '';
function hatchTile(ink, paper) {
  if (tile && tileKey === ink + paper) return tile;
  const c = document.createElement('canvas');
  c.width = c.height = 6;
  const t = c.getContext('2d');
  t.fillStyle = paper;
  t.fillRect(0, 0, 6, 6);
  t.strokeStyle = ink;
  t.lineWidth = 1.4;
  t.beginPath();
  t.moveTo(-1, 7); t.lineTo(7, -1);
  t.moveTo(-1, 1); t.lineTo(1, -1);
  t.moveTo(5, 7); t.lineTo(7, 5);
  t.stroke();
  tile = c; tileKey = ink + paper;
  return c;
}

// lleva una nota al rango del teclado moviéndola por octavas
export function fit(m) {
  while (m < LOW) m += 12;
  while (m > HIGH) m -= 12;
  return m;
}
