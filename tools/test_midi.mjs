import assert from 'node:assert/strict';
import { toMidi } from '../js/midi.js';

const bytes = toMidi([{ m: 60, t: 0, d: 0.5 }, { m: 64, t: 0.5, d: 0.25 }]);
const text = (a, n) => String.fromCharCode(...bytes.slice(a, a + n));

assert.equal(text(0, 4), 'MThd');
assert.equal(text(14, 4), 'MTrk');
assert.equal(((bytes[18] << 24) | (bytes[19] << 16) | (bytes[20] << 8) | bytes[21]) >>> 0, bytes.length - 22);
assert.deepEqual(Array.from(bytes.slice(12, 14)), [0x01, 0xe0]); // 480 pulsos por negra

// eventos: do on, do off y mi on en el mismo pulso 480, mi off, fin de pista
const track = Array.from(bytes.slice(22));
const find = (...seq) => track.join(',').includes(seq.join(','));
assert.ok(find(0x90, 60, 90));
assert.ok(find(0x80, 60, 0));
assert.ok(find(0x90, 64, 90));
assert.ok(find(0xff, 0x2f, 0));
// la nota se apaga antes de que empiece la siguiente (delta 0 entre off y on)
assert.ok(find(0x80, 60, 0, 0, 0x90, 64, 90));

console.log('midi: ok');
