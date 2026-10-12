// prueba los timbres contra un contexto de audio falso que valida lo que web audio rechaza o suena mal
import assert from 'node:assert/strict';
import { TIMBRES, playNote } from '../js/synth.js';

function makeCtx() {
  const nodes = [];
  const errors = [];
  const param = (v = 0, owner = null) => {
    const p = { value: v, last: v, owner };
    const at = t => { if (!Number.isFinite(t) || t < 0) errors.push('tiempo inválido ' + t); };
    p.setValueAtTime = (x, t) => { at(t); p.last = x; };
    p.linearRampToValueAtTime = (x, t) => { at(t); p.last = x; };
    p.exponentialRampToValueAtTime = (x, t) => {
      at(t);
      if (!(x > 0)) errors.push('rampa exponencial hacia ' + x);
      if (!(p.last > 0) && !(p.value > 0 && p.last === p.value)) errors.push('rampa exponencial desde ' + p.last);
      p.last = x;
    };
    p.setTargetAtTime = (x, t) => at(t);
    p.cancelScheduledValues = () => {};
    return p;
  };
  const node = kind => {
    const n = { kind, out: [], connect(d) { n.out.push(d); return d; }, disconnect() {} };
    nodes.push(n);
    return n;
  };
  const ctx = {
    nodes, errors, currentTime: 0, sampleRate: 44100,
    createGain() { const n = node('gain'); n.gain = param(1, n); return n; },
    createOscillator() {
      const n = node('osc');
      n.frequency = param(440, n); n.detune = param(0, n); n.type = 'sine';
      n.start = t => { n.t0 = t; }; n.stop = t => { n.t1 = t; };
      return n;
    },
    createBiquadFilter() { const n = node('filter'); n.frequency = param(350, n); n.Q = param(1, n); n.gain = param(0, n); n.type = 'lowpass'; return n; },
    createBuffer(ch, len, sr) { return { length: len, sampleRate: sr, getChannelData: () => new Float32Array(len) }; },
    createBufferSource() { const n = node('src'); n.start = t => { n.t0 = t; }; n.stop = t => { n.t1 = t; }; return n; }
  };
  return ctx;
}

// una conexión hacia un parámetro (vibrato, tremolo) cuenta como llegar al nodo dueño de ese parámetro
const reaches = (n, dest, seen = new Set()) => n === dest || (!seen.has(n) && seen.add(n) && n.out.some(o => reaches(o.owner || o, dest, seen)));

for (const { id } of TIMBRES) {
  for (const m of [36, 48, 60, 72, 84, 96, 108]) {
    for (const dur of [0.05, 0.5, 3]) {
      const ctx = makeCtx();
      const dest = { kind: 'dest', out: [] };
      const when = 1.5;
      playNote(ctx, id, m, when, dur, dest);
      const where = `${id} m${m} d${dur}`;
      assert.deepEqual(ctx.errors, [], where);
      const sources = ctx.nodes.filter(n => n.kind === 'osc' || n.kind === 'src');
      assert.ok(sources.length > 0, `${where}: no hay fuentes de sonido`);
      for (const s of sources) {
        assert.ok(s.t0 >= when - 1e-9, `${where}: arranca antes de tiempo`);
        assert.ok(s.t1 > s.t0, `${where}: no se detiene o se detiene antes de empezar`);
        assert.ok(reaches(s, dest), `${where}: una fuente no llega a la salida`);
        if (s.kind === 'osc') {
          assert.ok(s.frequency.value > 0 && s.frequency.value < 20000, `${where}: frecuencia ${s.frequency.value}`);
        }
      }
    }
  }
}

// un timbre desconocido cae en el piano
const ctx = makeCtx();
playNote(ctx, 'no-existe', 60, 0, 0.3, { kind: 'dest', out: [] });
assert.ok(ctx.nodes.some(n => n.kind === 'osc'));

console.log('synth: ok (' + TIMBRES.length + ' timbres)');
