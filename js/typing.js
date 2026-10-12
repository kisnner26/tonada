// teclado de la computadora como piano. se usa la posición física de la tecla (code), así sirve con cualquier distribución
// fila de abajo: z s x d c v g b h n j m , l . ñ -   fila de arriba: q 2 w 3 e r 5 t 6 y 7 u i 9 o 0 p
const LOWER = {
  KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11,
  Comma: 12, KeyL: 13, Period: 14, Semicolon: 15, Slash: 16
};
const UPPER = {
  KeyQ: 12, Digit2: 13, KeyW: 14, Digit3: 15, KeyE: 16, KeyR: 17, Digit5: 18, KeyT: 19, Digit6: 20, KeyY: 21,
  Digit7: 22, KeyU: 23, KeyI: 24, Digit9: 25, KeyO: 26, Digit0: 27, KeyP: 28
};
const LABEL = c => (c.startsWith('Key') ? c.slice(3) : c.startsWith('Digit') ? c.slice(5) : c === 'Comma' ? ',' : c === 'Period' ? '.' : c === 'Semicolon' ? ';' : '/');

export const BASE_MIN = 24, BASE_MAX = 84, BASE_DEFAULT = 60;

// semitonos sobre la nota base de una tecla, o undefined si no es del piano
export const offsetOf = code => (code in UPPER ? UPPER[code] : LOWER[code]);

// la nota que toca una tecla con la octava base elegida
export const noteFor = (code, base) => (offsetOf(code) === undefined ? null : base + offsetOf(code));

// letra de cada nota dentro del alcance del teclado: Map nota -> letra. la fila de arriba gana donde se solapan
export function lettersFor(base) {
  const map = new Map();
  for (const [code, off] of Object.entries(LOWER)) map.set(base + off, LABEL(code));
  for (const [code, off] of Object.entries(UPPER)) map.set(base + off, LABEL(code));
  return map;
}

// qué tecla pulsar para una nota (se acepta cualquier octava de la misma nota): letra y nota exacta
export function hintFor(midi, base) {
  const pc = ((midi % 12) + 12) % 12;
  for (const row of [LOWER, UPPER]) {
    for (const [code, off] of Object.entries(row)) {
      if (((base + off) % 12 + 12) % 12 === pc) return { label: LABEL(code), midi: base + off };
    }
  }
  return null;
}

// octava base que deja la melodía a mano: el registro mediano queda en medio del alcance
export function baseFor(notes) {
  if (!notes.length) return BASE_DEFAULT;
  const ms = notes.map(n => n.m).sort((a, b) => a - b);
  const mid = ms[Math.floor(ms.length / 2)];
  const base = Math.round((mid - 12) / 12) * 12;
  return Math.min(BASE_MAX, Math.max(BASE_MIN, base));
}
