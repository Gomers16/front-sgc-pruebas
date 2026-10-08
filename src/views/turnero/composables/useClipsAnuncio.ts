// Responsabilidad: locución del llamado con clips WAV pregrabados
// (assets/sonidos/voz/, generados con scripts/generar-clips-voz.py). Existe
// porque los navegadores de los TV de la sala (LG viejo, Roku) reproducen
// Audio — el pitido de useAlarma.ts suena — pero no tienen speechSynthesis.
// useVozTurno.ts lo usa primero y deja speechSynthesis como respaldo.
//
// Frase (misma que textoAnuncio() en useVozTurno.ts): "turno con placa" +
// cada letra/dígito de la placa + "diríjase al" | "por favor acérquese al" +
// módulo completo ("módulo cinco, caja RTM"). Sirve igual para placa de carro
// (ABC123) y de moto (ABC12D): se recorre carácter por carácter.
//
// Dos caminos, en este orden (ver anunciar()):
//  1. WAV único: al abrir el turnero se precargan los 45 clips en memoria
//     (XMLHttpRequest arraybuffer, ver crearPrecarga) y, al anunciar, se
//     pega el PCM de los clips con silencios exactos en UN solo WAV
//     (armarWav) que suena con un Audio — primero como Blob
//     (URL.createObjectURL) y, si no se puede o no suena (play() rechazado,
//     'error', o sin progreso en PROGRESO_WAV_TIMEOUT_MS), como data: URI
//     en base64.
//     Existe porque el LG viejo, al recargar el src en cada clip, tarda y se
//     come el arranque de cada uno (letras cortadas, locución lenta).
//  2. Encadenado: un clip por vez sobre el mismo Audio, avanzando en
//     'ended'. Se usa si falta precargar algún clip, si un clip no es PCM
//     mono 16 bit 22050 Hz, o si el WAV único no pudo sonar.
//
// Un solo Audio reutilizado (no uno por clip): los navegadores de TV tienen
// pocos decodificadores y un elemento que ya sonó sigue habilitado para
// autoplay. Si no llega 'ended' ni 'error' (pasa en motores viejos), un
// vigilante da el clip (o el WAV) por terminado.

import { ref } from 'vue'
import {
  CLIPS_VOZ_MODULO,
  CLIP_VOZ_TIMEOUT_MS,
  PRECARGA_CLIPS_MAX_RONDAS,
  PRECARGA_CLIPS_REINTENTO_MS,
  PRECARGA_CLIP_TIMEOUT_MS,
  PROGRESO_WAV_SONDEO_MS,
  PROGRESO_WAV_TIMEOUT_MS,
  SILENCIO_ANTES_INSTRUCCION_MS,
  SILENCIO_ENTRE_CLIPS_MS,
  SILENCIO_FINAL_MS,
  SILENCIO_INICIAL_MS,
  WAV_UNICO_MARGEN_MS,
} from '../config/constantes'
import type { TurnoLlamado } from './useTurnos'

export type DatosAnuncio = Pick<TurnoLlamado, 'placa' | 'modulo' | 'tipoLlamado'>

// Vite resuelve cada WAV a su URL con hash en el build. Clave: nombre del
// clip sin extensión ("letra-a", "modulo-5"...).
const ARCHIVOS_CLIPS = import.meta.glob('../assets/sonidos/voz/*.wav', {
  eager: true,
  import: 'default',
}) as Record<string, string>

export const URL_CLIPS: Record<string, string> = {}
for (const [ruta, url] of Object.entries(ARCHIVOS_CLIPS)) {
  URL_CLIPS[ruta.replace(/^.*\//, '').replace(/\.wav$/, '')] = url
}

// Clips de instrucción: llevan SILENCIO_ANTES_INSTRUCCION_MS delante.
const CLIPS_INSTRUCCION = ['dirijase-al', 'por-favor-acerquese-al']

// Nombres de clip en orden — función pura. null si no se puede armar con
// clips (módulo que no es uno de los 6 fijos, o placa sin letras ni
// dígitos): ahí se usa speechSynthesis. Ignora todo lo que no sea A-Z / 0-9
// (espacios, guiones, tildes).
export function clipsAnuncio(turno: DatosAnuncio): string[] | null {
  const clipModulo = (CLIPS_VOZ_MODULO as Record<string, string | undefined>)[turno.modulo]
  if (typeof clipModulo !== 'string') return null

  const clipsPlaca: string[] = []
  for (const caracter of (turno.placa || '').toUpperCase()) {
    if (caracter >= 'A' && caracter <= 'Z') clipsPlaca.push(`letra-${caracter.toLowerCase()}`)
    else if (caracter >= '0' && caracter <= '9') clipsPlaca.push(`digito-${caracter}`)
  }
  if (!clipsPlaca.length) return null

  const instruccion = turno.tipoLlamado === 'pregunta' ? CLIPS_INSTRUCCION[1] : CLIPS_INSTRUCCION[0]
  return ['turno-con-placa', ...clipsPlaca, instruccion, clipModulo]
}

// URLs de los clips, o null (con aviso en consola) si falta alguno.
export function urlsDeClips(
  nombres: string[] | null,
  urls: Record<string, string> = URL_CLIPS
): string[] | null {
  if (!nombres) return null
  const faltantes = nombres.filter((nombre) => !urls[nombre])
  if (faltantes.length) {
    console.warn(
      '[useClipsAnuncio] Faltan clips de voz en assets/sonidos/voz/ (regenerar con ' +
        'scripts/generar-clips-voz.py); se usa speechSynthesis:',
      faltantes
    )
    return null
  }
  return nombres.map((nombre) => urls[nombre])
}

// ---------------------------------------------------------------------------
// WAV en memoria (funciones puras)
// ---------------------------------------------------------------------------

// Único formato que se sabe pegar: el que escribe generar-clips-voz.py.
export const MUESTREO_CLIPS = 22050
const BYTES_POR_MUESTRA = 2 // 16 bit, mono
const TAMANO_ENCABEZADO = 44

function idChunk(vista: DataView, pos: number) {
  return String.fromCharCode(
    vista.getUint8(pos),
    vista.getUint8(pos + 1),
    vista.getUint8(pos + 2),
    vista.getUint8(pos + 3)
  )
}

// PCM (bytes del chunk 'data') de un WAV, o null si no es RIFF/WAVE PCM
// mono 16 bit 22050 Hz. Recorre los chunks en vez de asumir 44 bytes de
// encabezado: ffmpeg mete un chunk LIST entre 'fmt ' y 'data'.
export function pcmDeWav(datos: ArrayBuffer): Uint8Array | null {
  if (datos.byteLength < 12) return null
  const vista = new DataView(datos)
  if (idChunk(vista, 0) !== 'RIFF' || idChunk(vista, 8) !== 'WAVE') return null

  let formatoValido = false
  let pos = 12
  while (pos + 8 <= datos.byteLength) {
    const id = idChunk(vista, pos)
    const tamano = vista.getUint32(pos + 4, true)
    const inicio = pos + 8
    if (id === 'fmt ') {
      if (tamano < 16 || inicio + 16 > datos.byteLength) return null
      formatoValido =
        vista.getUint16(inicio, true) === 1 && // PCM
        vista.getUint16(inicio + 2, true) === 1 && // mono
        vista.getUint32(inicio + 4, true) === MUESTREO_CLIPS &&
        vista.getUint16(inicio + 14, true) === 16
      if (!formatoValido) return null
    } else if (id === 'data') {
      if (!formatoValido) return null // 'data' sin 'fmt ' antes
      // Un tamaño mayor que el archivo (WAV escrito en streaming) se recorta.
      const fin = Math.min(inicio + tamano, datos.byteLength)
      const largo = fin - inicio - ((fin - inicio) % BYTES_POR_MUESTRA)
      return new Uint8Array(datos, inicio, largo)
    }
    pos = inicio + tamano + (tamano % 2) // los chunks impares llevan un byte de relleno
  }
  return null
}

function bytesDeSilencio(ms: number) {
  return Math.round((ms * MUESTREO_CLIPS) / 1000) * BYTES_POR_MUESTRA
}

// Silencio que va ANTES del clip en la posición `indice`.
function silencioAntes(nombre: string, indice: number) {
  if (indice === 0) return SILENCIO_INICIAL_MS
  return CLIPS_INSTRUCCION.indexOf(nombre) >= 0 ? SILENCIO_ANTES_INSTRUCCION_MS : SILENCIO_ENTRE_CLIPS_MS
}

export function escribirEncabezadoWav(vista: DataView, bytesDatos: number) {
  const texto = (pos: number, valor: string) => {
    for (let i = 0; i < 4; i++) vista.setUint8(pos + i, valor.charCodeAt(i))
  }
  texto(0, 'RIFF')
  vista.setUint32(4, 36 + bytesDatos, true)
  texto(8, 'WAVE')
  texto(12, 'fmt ')
  vista.setUint32(16, 16, true)
  vista.setUint16(20, 1, true) // PCM
  vista.setUint16(22, 1, true) // mono
  vista.setUint32(24, MUESTREO_CLIPS, true)
  vista.setUint32(28, MUESTREO_CLIPS * BYTES_POR_MUESTRA, true) // bytes por segundo
  vista.setUint16(32, BYTES_POR_MUESTRA, true) // alineación de bloque
  vista.setUint16(34, 16, true)
  texto(36, 'data')
  vista.setUint32(40, bytesDatos, true)
}

export interface WavArmado {
  bytes: Uint8Array
  duracionMs: number
}

// UN WAV con el PCM de los clips en orden y los silencios de constantes.ts
// entre ellos, más SILENCIO_FINAL_MS al final (un TV que corta el final no
// se come "caja RTM"). null si falta algún clip o alguno no tiene el formato
// esperado — quien llama usa el encadenado.
export function armarWav(
  nombres: string[],
  buffers: Record<string, ArrayBuffer | undefined>
): WavArmado | null {
  const trozos: Array<{ silencio: number; pcm: Uint8Array }> = []
  let total = 0
  for (let i = 0; i < nombres.length; i++) {
    const datos = buffers[nombres[i]]
    const pcm = datos ? pcmDeWav(datos) : null
    if (!pcm) return null
    const silencio = bytesDeSilencio(silencioAntes(nombres[i], i))
    trozos.push({ silencio, pcm })
    total += silencio + pcm.length
  }
  if (!trozos.length) return null
  total += bytesDeSilencio(SILENCIO_FINAL_MS)

  // Uint8Array nuevo = todo en cero = silencio PCM; solo se copian los clips.
  const bytes = new Uint8Array(TAMANO_ENCABEZADO + total)
  escribirEncabezadoWav(new DataView(bytes.buffer), total)
  let pos = TAMANO_ENCABEZADO
  for (const trozo of trozos) {
    pos += trozo.silencio
    bytes.set(trozo.pcm, pos)
    pos += trozo.pcm.length
  }
  return { bytes, duracionMs: (total / BYTES_POR_MUESTRA / MUESTREO_CLIPS) * 1000 }
}

// Base64 por tramos: String.fromCharCode.apply con todo el arreglo revienta
// la pila en motores viejos.
export function base64DeBytes(bytes: Uint8Array): string {
  let binario = ''
  const TRAMO = 0x2000
  for (let i = 0; i < bytes.length; i += TRAMO) {
    binario += String.fromCharCode.apply(
      null,
      Array.prototype.slice.call(bytes.subarray(i, i + TRAMO)) as number[]
    )
  }
  return btoa(binario)
}

// ---------------------------------------------------------------------------
// Precarga de los clips en memoria
// ---------------------------------------------------------------------------

export type CargarArchivo = (
  url: string,
  alListo: (datos: ArrayBuffer) => void,
  alFallar: (motivo: unknown) => void
) => void

// XMLHttpRequest y no fetch: los navegadores de TV viejos pueden no tener
// fetch. responseType y timeout se ponen DESPUÉS de open() (algunos motores
// viejos lanzan si se ponen antes).
export const cargarConXhr: CargarArchivo = (url, alListo, alFallar) => {
  let resuelto = false
  const una = <T>(fn: (valor: T) => void) => (valor: T) => {
    if (resuelto) return
    resuelto = true
    fn(valor)
  }
  const listo = una(alListo)
  const fallar = una(alFallar)
  try {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'arraybuffer'
    xhr.timeout = PRECARGA_CLIP_TIMEOUT_MS
    xhr.onload = () => {
      const datos = xhr.response as ArrayBuffer | null
      // status 0: algunos TV lo dan con archivos locales que sí cargaron.
      if ((xhr.status === 200 || xhr.status === 0) && datos && datos.byteLength > 0) listo(datos)
      else fallar(`HTTP ${xhr.status}`)
    }
    xhr.onerror = () => fallar('error de red')
    xhr.ontimeout = () => fallar('timeout')
    xhr.onabort = () => fallar('abortado')
    xhr.send()
  } catch (error) {
    fallar(error)
  }
}

// Carga los clips uno por uno (para no saturar al TV mientras arranca la
// pantalla) y guarda cada ArrayBuffer. Los que fallan se reintentan en
// rondas; `listos` pasa a true cuando están todos.
export function crearPrecarga(
  urls: Record<string, string> = URL_CLIPS,
  cargar: CargarArchivo = cargarConXhr
) {
  const nombres = Object.keys(urls)
  const buffers: Record<string, ArrayBuffer | undefined> = {}
  const cargados = ref(0)
  const listos = ref(nombres.length === 0)
  let iniciada = false

  function ronda(numero: number) {
    const pendientes = nombres.filter((nombre) => !buffers[nombre])
    let i = 0
    const siguiente = () => {
      if (i >= pendientes.length) {
        const faltan = nombres.filter((nombre) => !buffers[nombre])
        if (!faltan.length) return
        if (numero < PRECARGA_CLIPS_MAX_RONDAS) {
          setTimeout(() => ronda(numero + 1), PRECARGA_CLIPS_REINTENTO_MS)
        } else {
          console.warn(
            `[useClipsAnuncio] No se pudieron precargar ${faltan.length} clips tras ` +
              `${numero} rondas; esos llamados usan el encadenado por clips:`,
            faltan
          )
        }
        return
      }
      const nombre = pendientes[i++]
      cargar(
        urls[nombre],
        (datos) => {
          if (!buffers[nombre]) {
            buffers[nombre] = datos
            cargados.value++
            if (cargados.value === nombres.length) listos.value = true
          }
          siguiente()
        },
        () => siguiente()
      )
    }
    siguiente()
  }

  function iniciar() {
    if (iniciada) return
    iniciada = true
    ronda(1)
  }

  return { iniciar, buffers, cargados, listos, total: nombres.length }
}

export type PrecargaClips = ReturnType<typeof crearPrecarga>

// Una sola precarga para toda la app (la pantalla y la página de prueba
// comparten los ArrayBuffer).
let precargaCompartida: PrecargaClips | null = null
export function precargaDeClips(): PrecargaClips {
  if (!precargaCompartida) precargaCompartida = crearPrecarga()
  return precargaCompartida
}

// ---------------------------------------------------------------------------
// Reproducción
// ---------------------------------------------------------------------------

export type CaminoClips = 'wav-unico' | 'encadenado'

interface Desenlace {
  // Se sonó la secuencia (aunque algún clip se haya saltado).
  alTerminar: () => void
  // Falló el primer clip o la mayoría: quien llama decide el respaldo.
  alFallar: (motivo: unknown) => void
  // Informativo (página de prueba): qué camino está sonando ahora.
  alCambiarCamino?: (camino: CaminoClips, duracionMs: number | null) => void
}

interface FuenteAudio {
  src: string
  liberar: () => void
}

// typeof en vez de `typeof Blob === 'function'`: en WebKit viejos los
// constructores nativos dan typeof 'object'.
function fuenteBlob(wav: WavArmado): FuenteAudio | null {
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return null
  const url = URL.createObjectURL(new Blob([wav.bytes.buffer as ArrayBuffer], { type: 'audio/wav' }))
  return {
    src: url,
    liberar: () => {
      try {
        URL.revokeObjectURL(url)
      } catch {
        // nada que liberar
      }
    },
  }
}

function fuenteDataUri(wav: WavArmado): FuenteAudio | null {
  if (typeof btoa === 'undefined') return null
  return { src: `data:audio/wav;base64,${base64DeBytes(wav.bytes)}`, liberar: () => {} }
}

export function useClipsAnuncio(
  crearAudio: () => HTMLAudioElement = () => new Audio(),
  precarga: PrecargaClips = precargaDeClips()
) {
  let audio: HTMLAudioElement | null = null
  let cancelarActual: (() => void) | null = null

  function elementoAudio() {
    if (!audio) {
      audio = crearAudio()
      audio.preload = 'auto'
    }
    return audio
  }

  // Corta lo que esté sonando (si hay) sin llamar a ninguno de sus
  // desenlaces: pausa y quita sus listeners y su vigilante.
  function cancelar() {
    if (cancelarActual) cancelarActual()
  }

  // Encadenado: un clip por vez sobre el mismo Audio.
  function reproducir(urls: string[], desenlace: Desenlace) {
    cancelar()
    const elemento = elementoAudio()

    let indice = -1
    let fallos = 0
    let activa = true
    let vigilante: ReturnType<typeof setTimeout> | undefined

    function soltar() {
      activa = false
      clearTimeout(vigilante)
      elemento.removeEventListener('ended', siguiente)
      elemento.removeEventListener('error', alErrorDeMedia)
      if (cancelarActual === cancelarEsta) cancelarActual = null
    }

    function siguiente() {
      if (!activa) return
      clearTimeout(vigilante)
      indice++
      if (indice >= urls.length) {
        soltar()
        if (fallos * 2 > urls.length) desenlace.alFallar(`fallaron ${fallos} de ${urls.length} clips`)
        else desenlace.alTerminar()
        return
      }

      const esteIndice = indice
      elemento.src = urls[esteIndice]
      vigilante = setTimeout(siguiente, CLIP_VOZ_TIMEOUT_MS)
      try {
        // play() devuelve undefined en motores viejos (Chrome < 50).
        const intento = elemento.play()
        if (intento && typeof intento.then === 'function') {
          intento.catch((error) => fallo(esteIndice, error))
        }
      } catch (error) {
        fallo(esteIndice, error)
      }
    }

    function fallo(enIndice: number, error: unknown) {
      if (!activa || enIndice !== indice) return // rechazo tardío de un clip ya superado
      fallos++
      console.warn(`[useClipsAnuncio] No se pudo reproducir el clip ${enIndice + 1}/${urls.length}:`, error)
      if (enIndice === 0) {
        soltar()
        desenlace.alFallar(error)
        return
      }
      siguiente()
    }

    function alErrorDeMedia() {
      fallo(indice, elemento.error)
    }

    function cancelarEsta() {
      soltar()
      elemento.pause()
    }

    elemento.addEventListener('ended', siguiente)
    elemento.addEventListener('error', alErrorDeMedia)
    cancelarActual = cancelarEsta
    siguiente()
  }

  // WAV único: prueba Blob y luego data: URI; si ninguno suena, alFallar.
  function reproducirWav(wav: WavArmado, desenlace: Pick<Desenlace, 'alTerminar' | 'alFallar'>) {
    cancelar()
    const elemento = elementoAudio()
    const fuentes = [fuenteBlob, fuenteDataUri]

    let intento = -1
    let activa = true
    let vigilante: ReturnType<typeof setTimeout> | undefined
    let liberar = () => {}
    // Comprobación de progreso de la fuente actual (ver vigilarProgreso).
    let sinProgreso: ReturnType<typeof setTimeout> | undefined
    let sondeo: ReturnType<typeof setInterval> | undefined
    let progresoConfirmado = false
    let tiempoInicial = 0

    function soltarProgreso() {
      clearTimeout(sinProgreso)
      clearInterval(sondeo)
      sinProgreso = undefined
      sondeo = undefined
    }

    function soltarFuente() {
      clearTimeout(vigilante)
      soltarProgreso()
      liberar()
      liberar = () => {}
    }

    function soltar() {
      activa = false
      soltarFuente()
      elemento.removeEventListener('ended', terminar)
      elemento.removeEventListener('error', alErrorDeMedia)
      elemento.removeEventListener('playing', confirmarProgreso)
      elemento.removeEventListener('timeupdate', alActualizarTiempo)
      if (cancelarActual === cancelarEsta) cancelarActual = null
    }

    // Reproducción muda: hay motores (LG viejo) que aceptan la fuente y
    // resuelven play() pero no suenan ni disparan 'error' ni 'ended'. Si en
    // PROGRESO_WAV_TIMEOUT_MS no llega 'playing', ni 'timeupdate' con
    // currentTime > 0, ni el sondeo (por si el motor no dispara eventos) ve
    // avanzar currentTime, esa fuente no sonó: se pasa a la siguiente. Con el
    // progreso confirmado arranca el vigilante de fin (duración + margen).
    function vigilarProgreso(enIntento: number) {
      progresoConfirmado = false
      tiempoInicial = elemento.currentTime || 0
      sondeo = setInterval(() => {
        if ((elemento.currentTime || 0) > tiempoInicial) confirmarProgreso()
      }, PROGRESO_WAV_SONDEO_MS)
      sinProgreso = setTimeout(
        () => fallo(enIntento, `sin progreso en ${PROGRESO_WAV_TIMEOUT_MS} ms (reproducción muda)`),
        PROGRESO_WAV_TIMEOUT_MS
      )
    }

    function confirmarProgreso() {
      if (!activa || progresoConfirmado || sinProgreso === undefined) return
      progresoConfirmado = true
      soltarProgreso()
      vigilante = setTimeout(terminar, wav.duracionMs + WAV_UNICO_MARGEN_MS)
    }

    function alActualizarTiempo() {
      if ((elemento.currentTime || 0) > 0) confirmarProgreso()
    }

    function terminar() {
      if (!activa) return
      soltar()
      desenlace.alTerminar()
    }

    function probarSiguiente(motivo: unknown) {
      while (activa) {
        soltarFuente()
        intento++
        if (intento >= fuentes.length) {
          soltar()
          desenlace.alFallar(motivo)
          return
        }
        let fuente: FuenteAudio | null = null
        try {
          fuente = fuentes[intento](wav)
        } catch (error) {
          motivo = error
        }
        if (!fuente) continue

        liberar = fuente.liberar
        const esteIntento = intento
        elemento.src = fuente.src
        vigilarProgreso(esteIntento)
        try {
          const promesa = elemento.play()
          if (promesa && typeof promesa.then === 'function') {
            promesa.catch((error) => fallo(esteIntento, error))
          }
        } catch (error) {
          fallo(esteIntento, error)
        }
        return
      }
    }

    function fallo(enIntento: number, error: unknown) {
      if (!activa || enIntento !== intento) return
      console.warn(
        `[useClipsAnuncio] No sonó el WAV único como ${enIntento === 0 ? 'Blob' : 'data: URI'}:`,
        error
      )
      probarSiguiente(error)
    }

    function alErrorDeMedia() {
      fallo(intento, elemento.error)
    }

    function cancelarEsta() {
      soltar()
      elemento.pause()
    }

    elemento.addEventListener('ended', terminar)
    elemento.addEventListener('error', alErrorDeMedia)
    elemento.addEventListener('playing', confirmarProgreso)
    elemento.addEventListener('timeupdate', alActualizarTiempo)
    cancelarActual = cancelarEsta
    probarSiguiente('sin Blob ni data: URI')
  }

  // Punto de entrada de useVozTurno.ts: WAV único si todos los clips ya
  // están en memoria y tienen el formato esperado; si no (o si no suena),
  // encadenado. `urls` son las de urlsDeClips(nombres).
  function anunciar(
    nombres: string[],
    urls: string[],
    desenlace: Desenlace,
    opciones: { sinWavUnico?: boolean } = {}
  ) {
    const encadenar = () => {
      desenlace.alCambiarCamino?.('encadenado', null)
      reproducir(urls, desenlace)
    }

    // Un clip sin precargar no se espera: el encadenado lo descarga al sonar.
    const enMemoria = nombres.every((nombre) => precarga.buffers[nombre])
    const wav = !opciones.sinWavUnico && enMemoria ? armarWav(nombres, precarga.buffers) : null
    if (!wav) {
      if (enMemoria && !opciones.sinWavUnico) {
        console.warn(
          '[useClipsAnuncio] Algún clip no es WAV PCM mono 16 bit 22050 Hz; se usa el encadenado.'
        )
      }
      encadenar()
      return
    }

    desenlace.alCambiarCamino?.('wav-unico', wav.duracionMs)
    reproducirWav(wav, {
      alTerminar: desenlace.alTerminar,
      alFallar: (motivo) => {
        console.warn('[useClipsAnuncio] Falló el WAV único; se usa el encadenado.', motivo)
        encadenar()
      },
    })
  }

  return { anunciar, reproducir, reproducirWav, cancelar, precarga }
}
