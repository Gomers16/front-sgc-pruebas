// Responsabilidad: anunciar por voz el turno que se está llamando.
// Complementa el pitido corto de useAlarma.ts: el patrón es pitido de
// atención + locución inmediatamente después, igual que una cartelera
// digital real (ver useColaModales.ts, que encadena ambos).
//
// Primero con clips WAV pregrabados (useClipsAnuncio.ts): los TV de la sala
// (LG viejo, Roku) reproducen Audio pero no tienen speechSynthesis. Los clips
// suenan pegados en un solo WAV en memoria si ya se precargaron (la precarga
// arranca al instanciar este composable) y, si no, encadenados uno por uno.
// Si no se puede armar con clips (módulo fuera de los 6 fijos, placa sin
// letras ni dígitos, clip faltante) o fallan al sonar, se usa la Web Speech API
// (SpeechSynthesisUtterance) como respaldo. `vozBloqueada` queda en true solo
// si ninguna de las dos pudo sonar — es lo que prende el indicador "Sin
// sonido" de TurneroDisplayView.vue.
//
// Selección de voz (respaldo): no hay garantía de que Chrome/Edge en Windows
// tengan instalada una voz es-CO exacta. Se prueba en el orden de
// config/constantes.ts::PREFERENCIA_IDIOMA_VOZ (variante exacta de Colombia,
// luego variantes latinoamericanas, luego cualquier es-*). Si no se
// encuentra ninguna voz en español, se deja que el navegador use su propio
// criterio con `lang="es-CO"` puesto en el utterance, y se avisa en consola
// — mismo criterio de "nunca romper, solo avisar" que useAlarma.ts.
//
// Gotcha real de la API: `speechSynthesis.getVoices()` casi siempre devuelve
// un arreglo VACÍO en la primera llamada tras cargar la página — las voces
// se cargan de forma asíncrona y solo están completas cuando dispara el
// evento `voiceschanged`. Por eso la selección se recalcula cada vez que ese
// evento dispara, no una sola vez al arrancar.

import { ref } from 'vue'
import { PREFERENCIA_IDIOMA_VOZ } from '../config/constantes'
import {
  clipsAnuncio,
  urlsDeClips,
  useClipsAnuncio,
  type DatosAnuncio,
  type PrecargaClips,
} from './useClipsAnuncio'

// Texto de la locución — función pura, exportada para testearla sin la Web
// Speech API (ver __tests__/useVozTurno.spec.ts). Los clips dicen lo mismo
// (ver clipsAnuncio()). Siempre con el módulo real; solo cambia la
// instrucción (ver INSTRUCCION_LLAMADO_PREGUNTA):
//  - Llamado a módulo: "Turno con placa X, diríjase al Módulo N - …."
//  - Pregunta:         "Turno con placa X, por favor acérquese al Módulo N - …."
export function textoAnuncio(turno: DatosAnuncio): string {
  const instruccion = turno.tipoLlamado === 'pregunta' ? 'por favor acérquese al' : 'diríjase al'
  return `Turno con placa ${turno.placa}, ${instruccion} ${turno.modulo}.`
}

// Solo para la página de prueba (TurneroPruebaVozView.vue): forzar el
// camino de respaldo o el de "sin speechSynthesis" en un PC que sí la tiene.
export interface OpcionesVozTurno {
  simularSinSintesis?: () => boolean
  simularSinClips?: () => boolean
  // Forzar el encadenado por clips aunque estén precargados.
  simularSinWavUnico?: () => boolean
  // Solo tests: precarga propia en vez de la compartida (XMLHttpRequest).
  precarga?: PrecargaClips
}

// Camino por el que sonó (o está sonando) el último anuncio. 'ninguno' =
// "Sin sonido".
export type CaminoVoz = 'wav-unico' | 'encadenado' | 'speechSynthesis' | 'ninguno'

export function useVozTurno(opciones: OpcionesVozTurno = {}) {
  const vozBloqueada = ref(false)
  // true exactamente mientras suena la locución actual (clips o voz
  // sintética) — no cubre el pitido de useAlarma.ts, que termina antes de
  // que esto se prenda. Lo consume el panel derecho de
  // TurneroDisplayView.vue para el indicador visual de "hablando ahora" (ver
  // useColaModales.ts, que lo re-expone hacia arriba).
  const hablando = ref(false)

  const clips = useClipsAnuncio(undefined, opciones.precarga)
  // En segundo plano: no bloquea la pantalla; mientras no termine, los
  // llamados usan el encadenado.
  clips.precarga.iniciar()

  // Diagnóstico para la página de prueba (TurneroPruebaVozView.vue).
  const camino = ref<CaminoVoz | null>(null)
  const duracionWavMs = ref<number | null>(null)

  let vozPreferida: SpeechSynthesisVoice | null = null
  let vocesResueltas = false

  const sintesisInstalada = typeof window !== 'undefined' && 'speechSynthesis' in window

  function sintesisDisponible() {
    return sintesisInstalada && !opciones.simularSinSintesis?.()
  }

  function elegirVoz() {
    if (!sintesisInstalada) return
    const voces = window.speechSynthesis.getVoices()
    if (!voces.length) return // todavía no cargaron — se reintenta en 'voiceschanged'

    vocesResueltas = true

    for (const idioma of PREFERENCIA_IDIOMA_VOZ) {
      const exacta = voces.find((v) => v.lang.toLowerCase() === idioma.toLowerCase())
      if (exacta) {
        vozPreferida = exacta
        return
      }
    }

    const cualquierEspanol = voces.find((v) => v.lang.toLowerCase().startsWith('es'))
    if (cualquierEspanol) {
      vozPreferida = cualquierEspanol
      return
    }

    vozPreferida = null
    console.warn(
      '[useVozTurno] No se encontró ninguna voz en español instalada en este navegador. ' +
        'El anuncio usará la voz por defecto del sistema con lang="es-CO", lo que puede sonar ' +
        'con acento o idioma incorrecto. Para corregirlo, instala un paquete de voz en español ' +
        'en el sistema operativo del PC del kiosco (Windows: Configuración > Hora e idioma > Voz).'
    )
  }

  if (sintesisInstalada) {
    elegirVoz() // por si ya estaban cargadas (p. ej. otra pestaña las disparó antes)
    window.speechSynthesis.onvoiceschanged = elegirVoz
  }

  function hablarConSintesis(turno: DatosAnuncio) {
    camino.value = 'speechSynthesis'
    duracionWavMs.value = null
    if (!sintesisDisponible()) {
      camino.value = 'ninguno'
      vozBloqueada.value = true
      hablando.value = false
      console.warn(
        '[useVozTurno] Sin locución: no sonaron los clips y este navegador no soporta la ' +
          'Web Speech API (speechSynthesis).'
      )
      return
    }

    if (!vocesResueltas) elegirVoz() // último intento por si 'voiceschanged' nunca disparó

    const utterance = new SpeechSynthesisUtterance(textoAnuncio(turno))
    utterance.lang = 'es-CO'
    if (vozPreferida) utterance.voice = vozPreferida

    utterance.onstart = () => {
      hablando.value = true
      vozBloqueada.value = false
    }
    utterance.onend = () => {
      hablando.value = false
    }

    utterance.onerror = (evento) => {
      hablando.value = false
      // Cortada a propósito por un llamado nuevo (ver anunciar): no es un fallo.
      if (evento.error === 'interrupted' || evento.error === 'canceled') return
      camino.value = 'ninguno'
      vozBloqueada.value = true
      console.warn(
        '[useVozTurno] El navegador rechazó o falló la síntesis de voz (falta de interacción ' +
          'previa del usuario, política de autoplay, o error interno del motor de voz). El ' +
          'turnero sigue funcionando visualmente y con el pitido; solo falta la locución.',
        evento
      )
    }

    try {
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      camino.value = 'ninguno'
      vozBloqueada.value = true
      hablando.value = false
      console.warn('[useVozTurno] Excepción al invocar speechSynthesis.speak():', error)
    }
  }

  function anunciar(turno: DatosAnuncio) {
    // Un llamado nuevo corta el anterior (clips o voz sintética), sin solaparse.
    clips.cancelar()
    // Solo si está hablando: en Chrome, cancel() justo antes de speak() a
    // veces deja mudo el utterance siguiente.
    if (sintesisInstalada && window.speechSynthesis.speaking) window.speechSynthesis.cancel()
    hablando.value = false

    const nombres = opciones.simularSinClips?.() ? null : clipsAnuncio(turno)
    const urls = urlsDeClips(nombres)
    if (!nombres || !urls) {
      hablarConSintesis(turno)
      return
    }

    hablando.value = true
    clips.anunciar(nombres, urls, {
      alCambiarCamino: (nuevo, duracionMs) => {
        camino.value = nuevo
        duracionWavMs.value = duracionMs
      },
      alTerminar: () => {
        hablando.value = false
        vozBloqueada.value = false
      },
      alFallar: (motivo) => {
        hablando.value = false
        console.warn('[useVozTurno] Falló la locución por clips; se usa speechSynthesis.', motivo)
        hablarConSintesis(turno)
      },
    }, { sinWavUnico: opciones.simularSinWavUnico?.() })
  }

  return {
    anunciar,
    vozBloqueada,
    hablando,
    camino,
    duracionWavMs,
    clipsListos: clips.precarga.listos,
    clipsCargados: clips.precarga.cargados,
    clipsTotal: clips.precarga.total,
  }
}
