// entrada de un teclado midi con web midi. parseMidi es pura y se prueba aparte
export function parseMidi(data) {
  if (!data || data.length < 3) return null;
  const status = data[0] & 0xf0, note = data[1], vel = data[2];
  if (status === 0x90 && vel > 0) return { type: 'on', note, vel };
  if (status === 0x80 || (status === 0x90 && vel === 0)) return { type: 'off', note, vel: 0 };
  return null;
}

// pide acceso y llama onNote(nota) por cada tecla pulsada. devuelve los nombres de los dispositivos conectados
export async function connectMidi(onNote) {
  if (!navigator.requestMIDIAccess) throw new Error('este navegador no tiene web midi');
  const access = await navigator.requestMIDIAccess();
  const names = [];
  for (const input of access.inputs.values()) {
    names.push(input.name || 'dispositivo midi');
    input.onmidimessage = e => {
      const msg = parseMidi(e.data);
      if (msg && msg.type === 'on') onNote(msg.note);
    };
  }
  access.onstatechange = () => {};
  return names;
}
