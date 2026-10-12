// disposición de teclas de piano: usada por las vistas que copian ese orden (marimba)
const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlack = m => BLACK.has(((m % 12) + 12) % 12);

// índice de cada nota blanca y total de blancas entre lo y hi
export function pianoLayout(lo, hi) {
  const white = {};
  let n = 0;
  for (let m = lo; m <= hi; m++) if (!isBlack(m)) white[m] = n++;
  return { white, count: n };
}
