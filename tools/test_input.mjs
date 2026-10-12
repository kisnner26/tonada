import assert from 'node:assert/strict';
import { offsetOf, noteFor, lettersFor, hintFor, baseFor, BASE_MIN, BASE_MAX } from '../js/typing.js';
import { createGuide } from '../js/guide.js';
import { parseMidi } from '../js/midiin.js';

// teclado de la computadora: la fila de abajo es una octava de do a si con las alteradas en la de arriba
assert.equal(noteFor('KeyZ', 60), 60);   // do
assert.equal(noteFor('KeyS', 60), 61);   // do#
assert.equal(noteFor('KeyX', 60), 62);   // re
assert.equal(noteFor('KeyM', 60), 71);   // si
assert.equal(noteFor('Comma', 60), 72);  // do de la octava siguiente
assert.equal(noteFor('KeyQ', 60), 72);   // la fila de arriba empieza en el mismo do
assert.equal(noteFor('Digit2', 60), 73);
assert.equal(noteFor('KeyP', 60), 88);
assert.equal(noteFor('Enter', 60), null);
assert.equal(offsetOf('KeyA'), undefined);

// letras visibles sobre el piano
const L = lettersFor(60);
assert.equal(L.get(60), 'Z');
assert.equal(L.get(61), 'S');
assert.equal(L.get(72), 'Q');   // donde se solapan gana la fila de arriba
assert.equal(L.get(88), 'P');
assert.equal(L.has(59), false);

// qué tecla pulsar para una nota: sirve cualquier octava
assert.deepEqual(hintFor(60, 60), { label: 'Z', midi: 60 });
assert.deepEqual(hintFor(79, 60), { label: 'B', midi: 67 });   // sol de cualquier octava -> B
assert.deepEqual(hintFor(61, 48), { label: 'S', midi: 49 });

// octava base según la melodía
assert.equal(baseFor([]), 60);
assert.equal(baseFor([{ m: 76 }, { m: 78 }, { m: 74 }]), 60);
assert.equal(baseFor([{ m: 40 }]), BASE_MIN);
assert.equal(baseFor([{ m: 120 }]), BASE_MAX);

// modo guiado
const g = createGuide();
g.load([{ m: 72, t: 0, d: 0.3 }, { m: 74, t: 0.5, d: 0.3 }, { m: 72, t: 1, d: 0.3 }]);
assert.equal(g.total, 3);
assert.equal(g.expected().m, 72);
assert.equal(g.press(60), 'hit');           // do de otra octava vale
assert.equal(g.index, 1);
assert.equal(g.press(61), 'miss');          // do# no es re
assert.equal(g.index, 1);
assert.equal(g.misses, 1);
assert.equal(g.press(62), 'hit');
assert.equal(g.done, false);
assert.equal(g.press(84), 'hit');
assert.equal(g.done, true);
assert.equal(g.hits, 3);
assert.equal(g.press(60), 'done');
assert.equal(g.expected(), null);
assert.equal(g.progress, 1);
g.reset();
assert.equal(g.index, 0);
assert.equal(g.hits, 0);
// con la octava elegida cambia la nota esperada
assert.equal(g.press(60, -12), 'hit');
assert.equal(g.press(62, -12), 'hit');
// cualquier tecla toca la nota
g.reset();
assert.equal(g.advance().m, 72);
assert.equal(g.advance().m, 74);
assert.equal(g.advance().m, 72);
assert.equal(g.advance(), null);
g.reset(); g.skip();
assert.equal(g.index, 1);
assert.equal(g.misses, 0);
// una lista vacía nunca cuenta como terminada
g.load([]);
assert.equal(g.done, false);
assert.equal(g.progress, 0);

// mensajes midi
assert.deepEqual(parseMidi([0x90, 60, 100]), { type: 'on', note: 60, vel: 100 });
assert.deepEqual(parseMidi([0x93, 64, 1]), { type: 'on', note: 64, vel: 1 });   // cualquier canal
assert.deepEqual(parseMidi([0x90, 60, 0]), { type: 'off', note: 60, vel: 0 });   // nota encendida con velocidad 0 = apagada
assert.deepEqual(parseMidi([0x80, 60, 64]), { type: 'off', note: 60, vel: 0 });
assert.equal(parseMidi([0xb0, 7, 100]), null);
assert.equal(parseMidi([0x90]), null);
assert.equal(parseMidi(null), null);

console.log('input: ok');
