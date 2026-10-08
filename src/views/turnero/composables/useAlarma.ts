// Responsabilidad: reproducir el pitido corto de llamado. Devuelve
// `reproducir(alTerminar?)` y `audioBloqueado` (true si el navegador rechazó
// el sonido).
//
// Los navegadores bloquean `play()` sin interacción previa del usuario, y
// esta pantalla no tiene ninguna interacción por diseño — esa condición
// nunca se va a cumplir sola. Por eso el rechazo se captura, se registra en
// consola con un mensaje que explica la causa real, y la pantalla sigue
// funcionando igual: el modal se muestra en silencio, nunca se rompe por esto.
//
// `alTerminar` (opcional): se invoca exactamente una vez, cuando el pitido
// termina de sonar — o de inmediato si el navegador lo bloqueó, o pasado
// PITIDO_TIMEOUT_MS si 'ended' nunca llega (navegadores de TV viejos), para
// que quien encadena algo después (ver useColaModales.ts: pitido + locución
// de voz) no se quede esperando un evento que nunca va a llegar.
//
// Compatibilidad con motores viejos: sin `{ once: true }` (antes de Chrome 55
// se toma como useCapture y el listener nunca se quita: cada pitido volvería
// a disparar los anuncios anteriores) y sin asumir que play() devuelve una
// promesa (antes de Chrome 50 devuelve undefined).

import { ref } from 'vue'
import { PITIDO_TIMEOUT_MS, RUTA_SONIDO_LLAMADO } from '../config/constantes'

export function useAlarma() {
  const audioBloqueado = ref(false)

  // Una sola instancia, precargada y reutilizada: crear un Audio nuevo en
  // cada llamado obliga al navegador a recargar el archivo cada vez.
  const audio = new Audio(RUTA_SONIDO_LLAMADO)
  audio.preload = 'auto'

  function reproducir(alTerminar?: () => void) {
    let terminado = false
    function terminar() {
      if (terminado) return
      terminado = true
      clearTimeout(vigilante)
      audio.removeEventListener('ended', terminar)
      if (alTerminar) alTerminar()
    }

    audio.addEventListener('ended', terminar)
    const vigilante = setTimeout(terminar, PITIDO_TIMEOUT_MS)

    function bloqueado(error: unknown) {
      audioBloqueado.value = true
      console.warn(
        '[useAlarma] El navegador bloqueó el sonido del llamado (política de ' +
          'autoplay: no hubo interacción previa del usuario, y esta pantalla no ' +
          'tiene ninguna). El turnero sigue funcionando visualmente. Para habilitar ' +
          'el audio, en el PC de recepción hay que permitir el sonido de este sitio ' +
          'desde la configuración del navegador.',
        error
      )
      terminar()
    }

    try {
      audio.currentTime = 0
      const intento = audio.play()
      if (intento && typeof intento.then === 'function') {
        intento.then(() => {
          audioBloqueado.value = false
        }, bloqueado)
      }
    } catch (error) {
      bloqueado(error)
    }
  }

  return { reproducir, audioBloqueado }
}
