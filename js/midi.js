// escritor mínimo de archivos midi (formato 0, una pista)
const TPQ = 480;   // pulsos por negra
const BPM = 120;   // a 120 bpm un segundo son dos negras

function varLen(n) {
  const out = [n & 0x7f];
  while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
  return out;
}
const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u16 = n => [(n >> 8) & 255, n & 255];

// notes: [{ m, t, d }] en segundos. devuelve Uint8Array
export function toMidi(notes) {
  const tick = s => Math.round((s * BPM * TPQ) / 60);
  const ev = [];
  for (const n of notes) {
    const on = tick(n.t), off = Math.max(on + 1, tick(n.t + n.d));
    ev.push([on, 1, n.m], [off, 0, n.m]);
  }
  // en el mismo pulso, primero se apagan las notas y luego se encienden
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const body = [0, 0xff, 0x51, 3, ...[60000000 / BPM >> 16, (60000000 / BPM >> 8) & 255, (60000000 / BPM) & 255]];
  let last = 0;
  for (const [t, on, m] of ev) {
    body.push(...varLen(t - last), on ? 0x90 : 0x80, m & 0x7f, on ? 90 : 0);
    last = t;
  }
  body.push(0, 0xff, 0x2f, 0);
  return Uint8Array.from([
    0x4d, 0x54, 0x68, 0x64, ...u32(6), ...u16(0), ...u16(1), ...u16(TPQ),
    0x4d, 0x54, 0x72, 0x6b, ...u32(body.length), ...body
  ]);
}
