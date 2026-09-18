// ============================================================================
// ÚNICA PUERTA DE DATOS DE LA PANTALLA DEL TURNERO
// ============================================================================
// Responsabilidad: exponer `colaSeguimiento` y `ultimosLlamados`, los dos
// arreglos reactivos que consume el resto de la pantalla (ver
// app/controllers/turno_llamados_controller.ts::colaTurnero() en
// backend-sgc-pruebas para el contrato exacto).
//
// Autenticación: esta vista vive bajo el mismo origen que el resto de
// front-sgc-pruebas, así que usa el mismo mecanismo de auth normal (Bearer
// leído de localStorage por services/http.ts) — nada de sembrado manual de
// token aparte.
//
// IMPORTANTE — orden: `colaSeguimiento` y `ultimosLlamados` se pintan
// EXACTAMENTE en el orden del arreglo que entrega el back. Esta pantalla
// nunca ordena, filtra ni infiere "el siguiente turno".

import { ref, onUnmounted } from 'vue'
import { get } from '@/services/http'
import { INTERVALO_POLL_MS } from '../config/constantes'

export interface TurnoEnCola {
  id: string
  placa: string
  turno: string | null
  canal: string
  estado: string
}

export interface TurnoLlamado {
  id: string
  placa: string
  turno: string | null
  canal: string
  modulo: string
  llamadoEn: string
  // Se llamó pero el cliente no estaba — sigue en la lista (nunca desaparece
  // solo), PanelEntrega.vue lo pinta atenuado. Se apaga cuando alguien
  // presiona "Entregar" en TurnosParaLlamar.vue (ahí sí sale de la lista).
  noPresentado?: boolean
}

interface ColaTurneroResponse {
  colaSeguimiento?: TurnoEnCola[]
  ultimosLlamados?: TurnoLlamado[]
}

export function useTurnos() {
  const colaSeguimiento = ref<TurnoEnCola[]>([])
  const ultimosLlamados = ref<TurnoLlamado[]>([])

  // Se vuelve true la primera vez que un fetch SUCEDE (no en el primer
  // intento a secas, y nunca en un intento fallido). useColaModales.ts
  // depende de esta señal para saber en qué momento `ultimosLlamados` ya
  // contiene datos reales y no el arreglo vacío con el que arranca — sin
  // esto, la "carga inicial" que decide qué llamados NO deben anunciarse de
  // nuevo se captura antes de que la primera respuesta real haya llegado.
  const listo = ref(false)

  async function refrescar() {
    try {
      const datos = await get<ColaTurneroResponse>('/api/turnero/cola')
      colaSeguimiento.value = datos.colaSeguimiento ?? []
      ultimosLlamados.value = datos.ultimosLlamados ?? []
      if (!listo.value) listo.value = true
    } catch (error) {
      // Falla de red o de auth (backend caído, token vencido, etc.): no se
      // vacían los arreglos, se mantiene el último dato bueno en pantalla en
      // vez de caer a un estado de "sin turnos" engañoso. Tampoco se marca
      // `listo` aquí: si el primerísimo intento falla, se sigue esperando a
      // que un intento posterior sí traiga datos reales antes de fijar la
      // base de "qué llamados ya existían".
      console.error('[useTurnos] Error al consultar /turnero/cola:', error)
    }
  }

  refrescar()
  const intervalo = setInterval(refrescar, INTERVALO_POLL_MS)
  onUnmounted(() => clearInterval(intervalo))

  return { colaSeguimiento, ultimosLlamados, listo }
}
