# tonada

audio o video a piano, en el navegador. sueltas un archivo, tonada saca la melodía como notas y las toca en un teclado con la estética risografía de [lumora](https://github.com/kisnner26/lumora), en una sola tinta: negro sobre papel blanco, trama de puntos y sombras duras.

**[probar en vivo](https://kisnner26.github.io/tonada/#ejemplo)**

![tonada](docs/img/escritorio.png)

## qué hace

- lee cualquier audio o video que el navegador sepa decodificar (mp3, wav, m4a, mp4)
- busca el tono dominante cada 23 ms con una fft, lo redondea a nota midi y junta los cuadros iguales en notas con inicio y duración
- las notas caen sobre el teclado y suenan con diez timbres: piano, juguete, caja de música, órgano, guitarra, marimba, flauta, cuerdas, campanas y sintetizador
- sensibilidad y nota mínima se pueden mover y la transcripción se rehace al instante
- se puede bajar una o dos octavas, tocar más lento y descargar la melodía como `.mid`
- nada se sube a ningún servidor, todo corre en tu equipo

![piano](docs/img/piano.png)

## usarlo

es una página estática sin build.

```bash
npm start
```

abre `http://localhost:8080`. por los módulos de javascript no funciona abriendo el `index.html` con doble clic.

en `examples/` hay un audio para probar. el botón "probar con el ejemplo" lo carga.

## pruebas

```bash
npm test
```

generan tonos sintéticos y comprueban que la transcripción devuelva las notas, los tiempos y las repeticiones correctas, que el midi tenga la estructura esperada y que cada timbre arme un grafo de audio válido (rampas, tiempos y conexiones) sobre un contexto falso. las capturas de arriba salen de `node tools/captura.mjs`.

## límites

- solo saca una nota a la vez, la más fuerte. acordes, batería y voces mezcladas dan notas inestables
- funciona mejor con melodías de un solo instrumento y poco ruido
- el rango de búsqueda es de 150 a 4000 hz
- analiza como máximo los primeros 5 minutos
- no detecta la dinámica ni el ritmo fino, todas las notas suenan con la misma fuerza

![móvil](docs/img/movil.png)

## estructura

```
js/fft.js        transformada rápida de fourier
js/pitch.js      de muestras a notas
js/synth.js      los diez timbres, con web audio
js/midi.js       escritor de archivos midi
js/keyboard.js   teclas y posiciones
js/roll.js       notas que caen
js/player.js     agenda y reproduce
js/app.js        une todo
css/             riso.css (tinta y trama) y piano.css
```

## licencia

mit
