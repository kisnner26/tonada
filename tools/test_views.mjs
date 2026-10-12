// las vistas por instrumento: mapeo de notas a posiciones y dibujo contra un contexto 2d falso
import assert from 'node:assert/strict';

// contexto 2d que rechaza coordenadas no finitas, la causa típica de un dibujo roto
function fake2d(log) {
  const props = {};
  return new Proxy(props, {
    get(t, k) {
      if (k === 'createPattern') return () => ({});
      if (k in t) return t[k];
      return (...args) => {
        for (const a of args) if (typeof a === 'number' && !Number.isFinite(a)) throw new Error(`${String(k)} con argumento no finito: ${args}`);
        log.push(String(k));
      };
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}
globalThis.document = { documentElement: {}, createElement: () => ({ width: 0, height: 0, getContext: () => fake2d([]) }) };
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '#000' });

const { neckPos } = await import('../js/views/neck.js');
const { fold, scan, stateMap } = await import('../js/views/common.js');
const { viewFor } = await import('../js/views/index.js');
const { TIMBRES } = await import('../js/synth.js');

// guitarra en afinación estándar: do, mi, la y límites del mástil
const G = [64, 59, 55, 50, 45, 40];
assert.deepEqual(neckPos(G, 19, 40), { s: 5, step: 0 });   // mi grave al aire
assert.deepEqual(neckPos(G, 19, 41), { s: 5, step: 1 });
assert.deepEqual(neckPos(G, 19, 45), { s: 4, step: 0 });   // la al aire
assert.deepEqual(neckPos(G, 19, 59), { s: 1, step: 0 });   // si al aire
assert.deepEqual(neckPos(G, 19, 64), { s: 0, step: 0 });   // mi agudo al aire
assert.deepEqual(neckPos(G, 19, 83), { s: 0, step: 19 });  // último traste
assert.equal(neckPos(G, 19, 84), null);
assert.equal(neckPos(G, 19, 39), null);

// violín
const V = [76, 69, 62, 55];
assert.deepEqual(neckPos(V, 14, 55), { s: 3, step: 0 });
assert.deepEqual(neckPos(V, 14, 74), { s: 1, step: 5 });
assert.deepEqual(neckPos(V, 14, 90), { s: 0, step: 14 });

// plegado por octavas
assert.equal(fold(30, 40, 83), 42);
assert.equal(fold(100, 40, 83), 76);
assert.equal(fold(60, 40, 83), 60);

// estados: suena, va a sonar pronto, o se ignora
const ctx = { notes: [{ m: 60, t: 1, d: 1 }, { m: 61, t: 2, d: 1 }, { m: 62, t: 2.8, d: 1 }, { m: 64, t: 9, d: 1 }], t: 1.5, shift: 0, pressed: [] };
const st = stateMap(scan(ctx, 40, 83));
assert.equal(st.get(60), 'now');
assert.equal(st.get(61), 'soon');
assert.equal(st.has(62), false);   // falta más que el aviso, pero se ve caer en las vistas con cilindro
assert.equal(st.has(64), false);
assert.equal(scan(ctx, 40, 83).find(n => n.m === 62).frac > 0.5, true);
// una nota pulsada con el dedo cuenta como sonando
assert.equal(stateMap(scan({ ...ctx, notes: [], pressed: [67] }, 40, 83)).get(67), 'now');

// cada vista dibuja sin errores, devuelve notas dentro de su rango al tocarla y centra el desplazamiento
const notes = [];
for (let m = 36; m <= 108; m += 3) notes.push({ m, t: (m - 36) / 10, d: 0.3 });
let probadas = 0;
for (const { id } of TIMBRES) {
  const view = viewFor(id);
  if (!view) continue;
  probadas++;
  const { w, h } = view.size(390);
  assert.ok(w >= 390 && h > 0, `${id}: tamaño`);
  for (const t of [0, 0.7, 2.2, 5, 30]) {
    for (const shift of [0, -12, -24]) {
      const log = [];
      view.draw(fake2d(log), w, h, { notes, t, shift, pressed: [60] });
      assert.ok(log.length > 20, `${id}: dibuja algo`);
    }
  }
  // el centro de cada nota cae dentro del lienzo
  for (let m = 30; m <= 110; m++) {
    const x = view.xOf(m, w, h);
    assert.ok(Number.isFinite(x) && x >= 0 && x <= w, `${id}: xOf(${m}) = ${x}`);
  }
  // tocar justo en el centro de una nota devuelve una nota del rango
  let hits = 0;
  for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) {
    const m = view.hit(x, y, w, h);
    if (m != null) { hits++; assert.ok(m >= view.lo && m <= view.hi, `${id}: hit fuera de rango ${m}`); }
  }
  assert.ok(hits > 20, `${id}: casi nada responde al toque (${hits})`);
}
assert.ok(probadas >= 7, 'faltan vistas');

console.log(`views: ok (${probadas} vistas)`);
