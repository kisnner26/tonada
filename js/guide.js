// modo guiado: la melodía como una lista de notas que hay que tocar en orden, esperando al jugador
const pc = m => ((m % 12) + 12) % 12;

export function createGuide() {
  let notes = [], i = 0, hits = 0, misses = 0;
  const wanted = shift => (i < notes.length ? notes[i].m + shift : null);

  return {
    load(list) { notes = list; i = 0; hits = 0; misses = 0; },
    reset() { i = 0; hits = 0; misses = 0; },
    // la siguiente nota esperada, o null si ya terminó
    expected: () => notes[i] || null,
    get index() { return i; },
    get total() { return notes.length; },
    get done() { return notes.length > 0 && i >= notes.length; },
    get hits() { return hits; },
    get misses() { return misses; },
    // intenta con la nota tocada. se acepta cualquier octava de la nota esperada
    // devuelve 'hit' (avanza), 'miss' (se queda) o 'done' (ya no hay nada que tocar)
    press(m, shift = 0) {
      const w = wanted(shift);
      if (w === null) return 'done';
      if (pc(m) === pc(w)) { i++; hits++; return 'hit'; }
      misses++;
      return 'miss';
    },
    // avanza sin comprobar nada: el modo de "cualquier tecla toca la nota"
    advance() {
      if (i >= notes.length) return null;
      const n = notes[i++];
      hits++;
      return n;
    },
    // salta una nota sin contarla como acierto ni fallo
    skip() { if (i < notes.length) i++; },
    // fracción recorrida, de 0 a 1
    get progress() { return notes.length ? i / notes.length : 0; }
  };
}
