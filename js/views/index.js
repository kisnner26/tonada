import { createNeck } from './neck.js';
import marimba from './marimba.js';
import campanas from './campanas.js';

// vista de cada timbre. lo que no está aquí usa el teclado de piano, que se arma con elementos html
const VIEWS = {
  // guitarra en afinación estándar, 19 trastes
  guitarra: createNeck({ strings: [64, 59, 55, 50, 45, 40], steps: 19, fretted: true, inlays: [3, 5, 7, 9, 12, 15, 17, 19], thickness: [2, 2.5, 3, 4, 5, 6] }),
  // violín: cuatro cuerdas sin trastes, primera a tercera posición
  cuerdas: createNeck({ strings: [76, 69, 62, 55], steps: 14, fretted: false, thickness: [1.5, 2, 3, 4] }),
  marimba,
  campanas
};

export function viewFor(timbre) {
  return VIEWS[timbre] || null;
}
