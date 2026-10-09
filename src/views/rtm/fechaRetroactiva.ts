// src/views/rtm/fechaRetroactiva.ts
//
// Crear turno con fecha anterior a hoy (backend: fecha_turno_service.ts).
// Solo SUPER_ADMIN y GERENCIA ven el selector de fecha (máximo = hoy) y la
// hora editable; el resto sigue con fecha y hora fijas. El backend revalida
// siempre (403 FECHA_RETROACTIVA_NO_AUTORIZADA / 422 FECHA_FUTURA).

import { DateTime } from 'luxon'

export const ROLES_FECHA_RETROACTIVA = ['SUPER_ADMIN', 'GERENCIA'] as const

const ZONA = 'America/Bogota'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const HORA_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

/** Hoy (YYYY-MM-DD) en Bogotá. */
export function hoyBogotaISO(ahora: DateTime = DateTime.now()): string {
  return ahora.setZone(ZONA).toISODate() ?? ''
}

/** ¿La fecha es anterior a hoy? (YYYY-MM-DD, comparables como texto) */
export function esFechaRetroactiva(fechaISO: string | null | undefined, hoyISO: string): boolean {
  return !!fechaISO && ISO_DATE.test(fechaISO) && fechaISO < hoyISO
}

/** Regla de Vuetify para el selector de fecha. */
export function reglaFechaTurno(
  fechaISO: string | null | undefined,
  hoyISO: string,
  puedeRetroactiva: boolean,
): true | string {
  if (!fechaISO || !ISO_DATE.test(fechaISO)) return 'La fecha es requerida'
  if (fechaISO > hoyISO) return 'No se puede crear un turno con fecha futura'
  if (fechaISO < hoyISO && !puedeRetroactiva) {
    return 'Solo SUPER_ADMIN o GERENCIA pueden crear turnos con fecha anterior a hoy'
  }
  return true
}

/** Regla de Vuetify para la hora de ingreso editable (HH:mm). */
export function reglaHoraIngreso(hora: string | null | undefined): true | string {
  return !!hora && HORA_HHMM.test(hora) ? true : 'Hora de ingreso inválida (HH:mm)'
}
