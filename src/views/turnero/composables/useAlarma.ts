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
// termina de sonar — o de inmediato si el navegador lo bloqueó, para que
// quien encadena algo después (ver useColaModales.ts: pitido + locución de
// voz) no se quede esperando un evento que nunca va a llegar.

import { ref } from 'vue'
import { RUTA_SONIDO_LLAMADO } from '../config/constantes'

export function useAlarma() {
  const audioBloqueado = ref(false)

  // Una sola instancia, precargada y reutilizada: crear un Audio nuevo en
  // cada llamado obliga al navegador a recargar el archivo cada vez.
  const audio = new Audio(RUTA_SONIDO_LLAMADO)
  audio.preload = 'auto'

  function reproducir(alTerminar?: () => void) {
    audio.currentTime = 0

    if (alTerminar) {
      audio.addEventListener('ended', alTerminar, { once: true })
    }

    audio.play().catch((error) => {
      audioBloqueado.value = true
      console.warn(
        '[useAlarma] El navegador bloqueó el sonido del llamado (política de ' +
          'autoplay: no hubo interacción previa del usuario, y esta pantalla no ' +
          'tiene ninguna). El turnero sigue funcionando visualmente. Para habilitar ' +
          'el audio, en el PC de recepción hay que permitir el sonido de este sitio ' +
          'desde la configuración del navegador.',
        error
      )
      if (alTerminar) {
        audio.removeEventListener('ended', alTerminar)
        alTerminar()
      }
    })
  }

  return { reproducir, audioBloqueado }
}
