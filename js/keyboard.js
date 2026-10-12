export const LOW = 36;   // C2
export const HIGH = 108; // C8

const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlack = m => BLACK.has(((m % 12) + 12) % 12);

// dibuja las teclas dentro de keysEl y las coloca según el ancho --kw del escenario
export function createKeyboard(stage, keysEl, canvas, onPress) {
  const pos = {}, els = {};
  let whites = 0, kw = 28;

  for (let m = LOW; m <= HIGH; m++) {
    const el = document.createElement('div');
    el.dataset.m = m;
    if (isBlack(m)) {
      el.className = 'key b';
      pos[m] = { black: true, before: whites };
    } else {
      el.className = 'key w';
      pos[m] = { black: false, idx: whites };
      if (m % 12 === 0) el.textContent = 'C' + (Math.floor(m / 12) - 1);
      whites++;
    }
    els[m] = el;
    keysEl.appendChild(el);
  }

  const x = m => (pos[m].black ? pos[m].before * kw - kw * 0.31 : pos[m].idx * kw);
  const w = m => (pos[m].black ? kw * 0.62 : kw);

  function layout() {
    kw = parseFloat(getComputedStyle(stage).getPropertyValue('--kw')) || 28;
    stage.style.width = whites * kw + 'px';
    canvas.width = whites * kw;
    for (let m = LOW; m <= HIGH; m++) els[m].style.left = x(m) + 'px';
  }

  function flash(m, ms) {
    const el = els[m];
    if (!el) return;
    el.classList.add('on');
    setTimeout(() => el.classList.remove('on'), ms);
  }

  function clear() { for (const el of Object.values(els)) el.classList.remove('on'); }

  keysEl.addEventListener('pointerdown', e => {
    const el = e.target.closest('.key');
    if (el) onPress(+el.dataset.m);
  });

  layout();
  addEventListener('resize', layout);
  return { x, w, flash, clear, layout, whites: () => whites };
}
