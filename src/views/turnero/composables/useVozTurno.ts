// Responsabilidad: anunciar por voz el turno que se está llamando, con la
// Web Speech API del navegador (SpeechSynthesisUtterance) — sin archivos de
// audio grabados. Complementa el pitido corto de useAlarma.ts: el patrón es
// pitido de atención + locución inmediatamente después, igual que una
// cartelera digital real (ver useColaModales.ts, que encadena ambos).
//
// Selección de voz: no hay garantía de que Chrome/Edge en Windows tengan
// instalada una voz es-CO exacta. Se prueba en el orden de
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

export function useVozTurno() {
  const vozBloqueada = ref(false)
  // true exactamente mientras el motor de voz está pronunciando la locución
  // actual (entre onstart y onend del utterance) — no cubre el pitido de
  // useAlarma.ts, que termina antes de que esto se prenda. Lo consume el
  // panel derecho de TurneroDisplayView.vue para el indicador visual de
  // "hablando ahora" (ver useColaModales.ts, que lo re-expone hacia arriba).
  const hablando = ref(false)

  let vozPreferida: SpeechSynthesisVoice | null = null
  let vocesResueltas = false

  const disponible = typeof window !== 'undefined' && 'speechSynthesis' in window

  function elegirVoz() {
    if (!disponible) return
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

  if (disponible) {
    elegirVoz() // por si ya estaban cargadas (p. ej. otra pestaña las disparó antes)
    window.speechSynthesis.onvoiceschanged = elegirVoz
  }

  function anunciar(placa: string, modulo: string) {
    if (!disponible) {
      vozBloqueada.value = true
      console.warn('[useVozTurno] Este navegador no soporta la Web Speech API (speechSynthesis).')
      return
    }

    if (!vocesResueltas) elegirVoz() // último intento por si 'voiceschanged' nunca disparó

    const utterance = new SpeechSynthesisUtterance(
      `Turno con placa ${placa}, diríjase al ${modulo}.`
    )
    utterance.lang = 'es-CO'
    if (vozPreferida) utterance.voice = vozPreferida

    utterance.onstart = () => {
      hablando.value = true
    }
    utterance.onend = () => {
      hablando.value = false
    }

    utterance.onerror = (evento) => {
      vozBloqueada.value = true
      hablando.value = false
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
      vozBloqueada.value = true
      hablando.value = false
      console.warn('[useVozTurno] Excepción al invocar speechSynthesis.speak():', error)
    }
  }

  return { anunciar, vozBloqueada, hablando }
}
