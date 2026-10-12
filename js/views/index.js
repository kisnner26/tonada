// vista de cada timbre. null = el teclado de piano, que se arma con elementos html
const VIEWS = {};

export function viewFor(timbre) {
  return VIEWS[timbre] || null;
}
