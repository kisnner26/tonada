// genera las capturas del readme con chrome headless: node tools/captura.mjs [url]
// requiere chrome y la página servida (npm start). sin dependencias, habla por el protocolo devtools
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.argv[2] || 'http://localhost:8080/';
const OUT = new URL('../docs/img/', import.meta.url).pathname;
const PORT = 9333;
const sleep = ms => new Promise(r => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'tonada-'))}`, 'about:blank'
], { stdio: 'ignore' });

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return new WebSocket(page.webSocketDebuggerUrl);
    } catch {}
    await sleep(200);
  }
  throw new Error('chrome no respondió');
}

const ws = await connect();
await new Promise(r => (ws.onopen = r));
let id = 0;
const waiting = new Map();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
};
const send = (method, params = {}) => new Promise(res => { waiting.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });
const run = async js => (await send('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true })).result.result.value;
const save = async (name, params) => {
  const r = await send('Page.captureScreenshot', { format: 'png', ...params });
  if (!r.result) throw new Error(`no pude capturar ${name}: ${JSON.stringify(r.error)}`);
  writeFileSync(OUT + name, Buffer.from(r.result.data, 'base64'));
  console.log('guardada', name);
};

async function open(width, height, mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile });
  await send('Page.navigate', { url: BASE + '#ejemplo' });
  // si la red tarda, la página puede quedar sin arrancar: se recarga hasta tres veces
  for (let intento = 0; intento < 3; intento++) {
    await sleep(800);
    await send('Page.reload');
    for (let i = 0; i < 40; i++) {
      if ((await run("document.getElementById('play') && !document.getElementById('play').disabled")) === true) { await sleep(500); return; }
      await sleep(250);
    }
  }
  throw new Error('la página no cargó el ejemplo');
}

async function pageSize() {
  return run('({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight })');
}
async function rect(sel) {
  return run(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; })()`);
}

// escritorio: la página entera y el piano mientras suena
await open(1100, 900, false);
const { h } = await pageSize();
await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: h, deviceScaleFactor: 2, mobile: false });
await sleep(300);
await save('escritorio.png', {});
await run("document.getElementById('play').click()");
await sleep(3700);
await save('piano.png', { clip: { ...(await rect('.card.piano')), scale: 1 } });

// modo guiado: la nota esperada pintada de negro, después de acertar las primeras
const tecla = code => run(`window.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true }))`);
await run("document.getElementById('play').textContent === 'detener' && document.getElementById('play').click()");
await sleep(300);
await run("document.getElementById('guideBtn').click()");
for (const c of ['KeyC', 'KeyC', 'KeyV']) { await tecla(c); await sleep(250); }
await sleep(900);
const a1 = await rect('.guide'), a2 = await rect('.card.piano');
await save('guiado.png', { clip: { x: a2.x, y: a1.y, width: a2.width, height: a2.y + a2.height - a1.y, scale: 1 } });
await run("document.getElementById('guideBtn').click()");

// un cuadro por instrumento con vista propia, mientras suena
await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 2600, deviceScaleFactor: 2, mobile: false });
await run("document.getElementById('play').textContent === 'detener' && document.getElementById('play').click()");
for (const id of ['guitarra', 'cuerdas', 'marimba', 'campanas', 'caja', 'juguete', 'flauta']) {
  await run(`(() => { const s = document.getElementById('timbre'); s.value = '${id}'; s.dispatchEvent(new Event('change')); })()`);
  await sleep(300);
  await run("document.getElementById('play').click()");
  await sleep(3200);
  await save(`instrumento-${id}.png`, { clip: { ...(await rect('.card.piano')), scale: 1 } });
  await run("document.getElementById('play').click()");
  await sleep(200);
}

// móvil
await open(390, 800, true);
const m = await pageSize();
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: m.h, deviceScaleFactor: 2, mobile: true });
await sleep(300);
console.log('móvil: ancho de la página', m.w, 'de 390');
await save('movil.png', {});

ws.close();
chrome.kill();
