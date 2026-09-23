// Responsabilidad: cargar y mantener actualizado (poll cada
// INTERVALO_POLL_TICKER_MS) el catálogo de mensajes de la cinta contra el
// backend, y derivar el texto unido + la duración de la animación. Pura
// lógica/datos — el render vive en components/CintaMensajes.vue.
//
// Extraído de PanelEntrega.vue (estaba inline ahí) al mover la cinta a una
// franja propia a todo el ancho de la pantalla, fuera de cualquier columna
// — ver TurneroDisplayView.vue y layout.css. El comportamiento (fuente de
// datos, intervalo de poll, cálculo de duración) no cambió, solo dónde vive.
import { ref, computed, onUnmounted } from 'vue'
import { get } from '@/services/http'
import {
  INTERVALO_POLL_TICKER_MS,
  TICKER_CARACTERES_POR_SEGUNDO,
  TICKER_DURACION_MAX_S,
  TICKER_DURACION_MIN_S,
} from '../config/constantes'

interface MensajeTicker {
  id: number
  texto: string
  orden: number
  activo: boolean
}

interface TickerResponse {
  success?: boolean
  data?: MensajeTicker[]
}

export function useMensajesTicker() {
  const mensajesActivos = ref<MensajeTicker[]>([])

  // Separador con espacio de sobra a ambos lados: al repetir el texto dos
  // veces seguidas para el loop sin costura, este mismo separador es lo que
  // queda visible en el punto donde una copia termina y la otra empieza —
  // tiene que verse igual que entre dos mensajes cualquiera.
  const SEPARADOR = '   •   '

  const textoTicker = computed(() => {
    const activos = mensajesActivos.value.filter((m) => m.activo).sort((a, b) => a.orden - b.orden)
    if (!activos.length) return ''
    return activos.map((m) => m.texto).join(SEPARADOR) + SEPARADOR
  })

  // Duración proporcional al largo del texto: la velocidad de lectura se
  // siente constante sin importar cuántos mensajes estén activos.
  const duracionTickerS = computed(() => {
    const largo = textoTicker.value.length
    const segundos = largo / TICKER_CARACTERES_POR_SEGUNDO
    return Math.min(TICKER_DURACION_MAX_S, Math.max(TICKER_DURACION_MIN_S, segundos))
  })

  async function cargarTicker() {
    try {
      const resp = await get<TickerResponse>('/api/turnero/ticker')
      mensajesActivos.value = resp.data ?? []
    } catch (error) {
      console.error('[useMensajesTicker] Error al consultar /turnero/ticker:', error)
    }
  }

  cargarTicker()
  const intervalo = setInterval(cargarTicker, INTERVALO_POLL_TICKER_MS)
  onUnmounted(() => clearInterval(intervalo))

  return { textoTicker, duracionTickerS }
}
