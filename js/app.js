import { transcribe, mixToMono, noteName } from './pitch.js';
import { createKeyboard } from './keyboard.js';
import { drawRoll, fit } from './roll.js';
import { audioContext, createPlayer, preview } from './player.js';

const $ = id => document.getElementById(id);
const MAX_SECONDS = 300;

const state = { samples: null, sr: 44100, name: '', notes: [], duration: 0 };

const kb = createKeyboard($('stage'), $('keys'), $('roll'), m => {
  preview(m, $('timbre').value);
  kb.flash(m, 220);
});

const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

function say(text, err = false) {
  $('msg').textContent = text;
  $('msg').classList.toggle('err', err);
}

function setStatus(text, live) {
  $('statusText').textContent = text;
  $('status').classList.toggle('live', live);
}

function facts() {
  const box = $('facts');
  box.replaceChildren();
  const add = (text, cls = 'fact') => {
    const el = document.createElement('span');
    el.className = cls;
    el.textContent = text;
    box.appendChild(el);
  };
  if (!state.notes.length) {
    add(state.samples ? 'no encontré notas, baja la sensibilidad' : 'sin melodía todavía. carga un audio.', 'fact empty');
    return;
  }
  const ms = state.notes.map(n => n.m);
  add(state.notes.length + ' notas', 'fact hot');
  add(noteName(Math.min(...ms)) + ' a ' + noteName(Math.max(...ms)));
  add(fmt(state.duration));
}

const shift = () => +$('oct').value * 12;

function redraw(t = 0) {
  drawRoll($('roll'), kb, state.notes, t, { shift: shift(), emptyText: state.notes.length ? '' : 'sin melodía todavía' });
}

// reproducción
let raf = 0, follow = 0;
const player = createPlayer({
  onNote: (m, ms) => kb.flash(m, ms),
  onEnd: () => {
    cancelAnimationFrame(raf);
    kb.clear();
    $('play').textContent = 'reproducir';
    $('bar').style.width = '0';
    $('time').textContent = '0:00 / ' + fmt(state.duration);
    redraw();
  }
});

function frame() {
  if (!player.isPlaying()) return;
  const t = player.now();
  redraw(t);
  $('bar').style.width = Math.min(100, (t / state.duration) * 100) + '%';
  $('time').textContent = fmt(t) + ' / ' + fmt(state.duration);
  // el desplazamiento sigue a las notas que están por sonar
  let sum = 0, c = 0;
  for (const n of state.notes) if (n.t < t + 0.8 && n.t + n.d > t) { sum += kb.x(fit(n.m + shift())); c++; }
  if (c) {
    const sc = $('scroll');
    follow += (sum / c - sc.clientWidth / 2 - follow) * 0.08;
    sc.scrollLeft = follow;
  }
  raf = requestAnimationFrame(frame);
}

function togglePlay() {
  if (player.isPlaying()) return player.stop();
  if (!state.notes.length) return;
  player.start(state.notes, state.duration, { rate: +$('rate').value, shift: shift(), timbre: $('timbre').value });
  $('play').textContent = 'detener';
  follow = $('scroll').scrollLeft;
  frame();
}
$('play').addEventListener('click', togglePlay);
$('oct').addEventListener('change', () => { player.stop(); redraw(); });


// analiza las muestras guardadas con los ajustes actuales
function analyze() {
  if (!state.samples) return;
  const { notes, duration } = transcribe(state.samples, state.sr, {});
  state.notes = notes;
  state.duration = duration;
  facts();
  redraw();
  $('play').disabled = !notes.length;
  $('time').textContent = '0:00 / ' + fmt(duration);
  setStatus(state.name || 'listo', notes.length > 0);
  say(notes.length ? state.name + ' · ' + notes.length + ' notas' : 'no encontré notas en ' + state.name, !notes.length);
}

async function loadFile(file) {
  say('leyendo ' + file.name + '…');
  setStatus('analizando', false);
  try {
    const buf = await audioContext().decodeAudioData(await file.arrayBuffer());
    const len = Math.min(buf.length, Math.floor(buf.sampleRate * MAX_SECONDS));
    const chans = [];
    for (let c = 0; c < buf.numberOfChannels; c++) chans.push(buf.getChannelData(c).subarray(0, len));
    state.samples = mixToMono(chans);
    state.sr = buf.sampleRate;
    state.name = file.name;
    // deja pintar el estado antes de la parte pesada
    await new Promise(r => setTimeout(r, 30));
    analyze();
    if (buf.length > len) say($('msg').textContent + ' (solo los primeros ' + MAX_SECONDS / 60 + ' min)');
  } catch (e) {
    setStatus('sin audio', false);
    say('no pude leer ese archivo como audio. prueba con mp3, wav, m4a o mp4.', true);
  }
}

// archivo: botón y arrastrar
$('pick').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); e.target.value = ''; });
const drop = $('drop');
for (const ev of ['dragenter', 'dragover']) drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); });
for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); });
drop.addEventListener('drop', e => { if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });

facts();
redraw();
