// Responsabilidad: locución del llamado con clips WAV pregrabados
// (assets/sonidos/voz/, generados con scripts/generar-clips-voz.py),
// encadenados con un solo elemento Audio. Existe porque los navegadores de
// los TV de la sala (LG viejo, Roku) reproducen Audio — el pitido de
// useAlarma.ts suena — pero no tienen speechSynthesis. useVozTurno.ts lo usa
// primero y deja speechSynthesis como respaldo.
//
// Frase (misma que textoAnuncio() en useVozTurno.ts): "turno con placa" +
// cada letra/dígito de la placa + "diríjase al" | "por favor acérquese al" +
// módulo completo ("módulo cinco, caja RTM"). Sirve igual para placa de carro
// (ABC123) y de moto (ABC12D): se recorre carácter por carácter.
//
// Un solo Audio reutilizado (no uno por clip): los navegadores de TV tienen
// pocos decodificadores y un elemento que ya sonó sigue habilitado para
// autoplay. Cada clip avanza con 'ended'; si no llega 'ended' ni 'error'
// (pasa en motores viejos), un vigilante salta al siguiente.

import { CLIPS_VOZ_MODULO, CLIP_VOZ_TIMEOUT_MS } from '../config/constantes'
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

  const instruccion = turno.tipoLlamado === 'pregunta' ? 'por-favor-acerquese-al' : 'dirijase-al'
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

interface Desenlace {
  // Se sonó la secuencia (aunque algún clip se haya saltado).
  alTerminar: () => void
  // Falló el primer clip o la mayoría: quien llama decide el respaldo.
  alFallar: (motivo: unknown) => void
}

export function useClipsAnuncio(crearAudio: () => HTMLAudioElement = () => new Audio()) {
  let audio: HTMLAudioElement | null = null
  let cancelarActual: (() => void) | null = null

  // Corta la secuencia en curso (si hay) sin llamar a ninguno de sus
  // desenlaces: pausa y quita sus listeners y su vigilante.
  function cancelar() {
    if (cancelarActual) cancelarActual()
  }

  function reproducir(urls: string[], desenlace: Desenlace) {
    cancelar()
    if (!audio) {
      audio = crearAudio()
      audio.preload = 'auto'
    }
    const elemento = audio

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

  return { reproducir, cancelar }
}
