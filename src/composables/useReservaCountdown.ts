// src/composables/useReservaCountdown.ts
import { DateTime } from 'luxon'

/**
 * Countdown de exclusividad de un dateo, compartido entre DateosList.vue y
 * FichaComercialAsesor.vue. Se recalcula desde created_at + horas_exclusividad
 * (no desde el campo bloqueadoHasta del modelo CaptacionDateo — ese sigue
 * usando el TTL viejo en días vía .env, ver nota en captacion_dateo.ts).
 */

export interface ReservaCountdown {
  /** false cuando el dateo ya tiene turno asociado: la exclusividad dejó de aplicar */
  aplica: boolean
  /** true mientras quede tiempo; false al llegar a 0 (sin haberse consumido) */
  vigente: boolean
  /** "58h 32min" mientras cuenta / "Re-datear" al llegar a 0 / "—" cuando no aplica */
  texto: string
}

interface DateoParaCountdown {
  created_at: string
  consumido_turno_id?: number | null
}

const SIN_APLICAR: ReservaCountdown = { aplica: false, vigente: false, texto: '—' }

export function calcularReservaCountdown(
  dateo: DateoParaCountdown,
  horasExclusividad: number | null
): ReservaCountdown {
  if (dateo.consumido_turno_id) return SIN_APLICAR
  if (!horasExclusividad || horasExclusividad <= 0) return SIN_APLICAR

  const creado = DateTime.fromISO(dateo.created_at)
  if (!creado.isValid) return SIN_APLICAR

  const bloqueaHasta = creado.plus({ hours: horasExclusividad })
  const minutosRestantes = Math.floor(bloqueaHasta.diff(DateTime.now(), 'minutes').minutes)

  if (minutosRestantes <= 0) {
    return { aplica: true, vigente: false, texto: 'Re-datear' }
  }

  const horas = Math.floor(minutosRestantes / 60)
  const minutos = minutosRestantes % 60

  return {
    aplica: true,
    vigente: true,
    texto: `${horas}h ${String(minutos).padStart(2, '0')}min`,
  }
}

export function useReservaCountdown() {
  return { calcularReservaCountdown }
}
