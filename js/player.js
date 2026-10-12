import { playNote } from './synth.js';
import { fit } from './roll.js';

let ctx = null;
export function audioContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// toca una sola tecla (para el teclado)
export function preview(m, timbre) {
  const c = audioContext();
  const out = c.createGain();
  out.gain.value = 0.9;
  out.connect(c.destination);
  playNote(c, timbre, m, c.currentTime, 0.3, out);
}

// reproductor de la melodía. onNote(m, ms) avisa cada nota; onEnd() al terminar o detener
export function createPlayer({ onNote, onEnd }) {
  let master = null, startAt = 0, rate = 1, playing = false, timers = [], endTimer = 0;

  function stop() {
    if (!playing) return;
    playing = false;
    timers.forEach(clearTimeout);
    clearTimeout(endTimer);
    timers = [];
    if (master) {
      const out = master, c = audioContext();
      out.gain.cancelScheduledValues(c.currentTime);
      out.gain.setTargetAtTime(0, c.currentTime, 0.03);
      setTimeout(() => out.disconnect(), 300);
      master = null;
    }
    onEnd();
  }

  function start(notes, duration, opts) {
    const c = audioContext();
    rate = opts.rate;
    master = c.createGain();
    master.gain.value = 0.9;
    master.connect(c.destination);
    startAt = c.currentTime + 0.15;
    playing = true;
    for (const n of notes) {
      const m = fit(n.m + opts.shift), when = startAt + n.t / rate;
      playNote(c, opts.timbre, m, when, n.d / rate, master);
      timers.push(setTimeout(() => onNote(m, Math.max(90, (n.d / rate) * 1000)), Math.max(0, (when - c.currentTime) * 1000)));
    }
    endTimer = setTimeout(stop, (duration / rate + 2.4) * 1000);
  }

  return {
    start,
    stop,
    isPlaying: () => playing,
    now: () => (playing ? Math.max(0, (audioContext().currentTime - startAt) * rate) : 0)
  };
}
