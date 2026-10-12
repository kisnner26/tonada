import assert from 'node:assert/strict';
import { transcribe, hzToMidi, midiToHz, noteName, mixToMono } from '../js/pitch.js';

const SR = 44100;
function render(parts, total) {
  const x = new Float32Array(Math.round(total * SR));
  for (const [midi, t, d, amp = 0.5] of parts) {
    const f = midiToHz(midi), a = Math.round(t * SR), b = Math.round((t + d) * SR);
    for (let i = a; i < b && i < x.length; i++) {
      const env = Math.min(1, (i - a) / 200, (b - i) / 200);
      x[i] += amp * env * Math.sin((2 * Math.PI * f * i) / SR);
    }
  }
  return x;
}

// conversiones
assert.equal(Math.round(hzToMidi(440)), 69);
assert.equal(noteName(60), 'C4');
assert.equal(noteName(103), 'G7');

// secuencia que cruza graves y agudos, con silencios entre notas
const score = [[57, 0.0, 0.3], [64, 0.5, 0.3], [91, 1.0, 0.25], [104, 1.5, 0.4], [72, 2.2, 0.2]];
const { notes, duration } = transcribe(render(score, 3), SR);
assert.deepEqual(notes.map(n => n.m), score.map(s => s[0]));
assert.ok(Math.abs(duration - 3) < 0.01);
notes.forEach((n, i) => {
  assert.ok(Math.abs(n.t - score[i][1]) < 0.06, `inicio de la nota ${i}: ${n.t}`);
  assert.ok(Math.abs(n.d - score[i][2]) < 0.08, `duración de la nota ${i}: ${n.d}`);
});

// una nota más corta que minMs se descarta
const short = transcribe(render([[69, 0.2, 0.05]], 1), SR);
assert.equal(short.notes.length, 0);

// silencio y ruido muy bajo no producen notas
assert.equal(transcribe(new Float32Array(SR), SR).notes.length, 0);

// el volumen de la nota no cambia el resultado (compuerta relativa)
const quiet = transcribe(render([[76, 0.2, 0.4, 0.02]], 1), SR);
assert.deepEqual(quiet.notes.map(n => n.m), [76]);

// otra tasa de muestreo
const sr2 = 22050, x2 = new Float32Array(sr2);
for (let i = 0; i < sr2 * 0.5; i++) x2[i] = 0.5 * Math.sin((2 * Math.PI * 1976 * i) / sr2);
assert.deepEqual(transcribe(x2, sr2).notes.map(n => n.m), [95]);

// mezcla estéreo
const L = new Float32Array([1, 0]), R = new Float32Array([0, 1]);
assert.deepEqual(Array.from(mixToMono([L, R])), [0.5, 0.5]);

console.log('pitch: ok');
