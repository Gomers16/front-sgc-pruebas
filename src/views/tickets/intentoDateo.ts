// src/views/tickets/intentoDateo.ts
//
// Intento de dateo que el backend rechazó con 409 REQUIERE_TICKET_DATEO
// (campo `intento` de la respuesta). DateoCreate.vue lo pasa a
// TicketExcepcionDateoCreate.vue por history.state y este lo envía a
// POST /api/tickets-excepcion-dateo, que lo vuelve a validar.

import type { HistoryState } from 'vue-router'
import type { CrearTicketExcepcionDateoPayload } from '@/services/ticketsService'

export interface IntentoDateo {
  canal: string | null
  agente_id: number | null
  agente_nombre: string | null
  convenio_id: number | null
  convenio_nombre: string | null
  convenio_establecimiento: string | null
  servicio_id: number | null
  servicio_nombre: string | null
  descuento_id: number | null
  descuento_nombre: string | null
  es_avance: boolean
  comprobante_avance_url: string | null
  telefono: string | null
}

const num = (v: unknown): number | null => {
  const n = Number(v)
  return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : null
}
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null)

/** Normaliza el intento del 409 (o de history.state). null si no hay uno usable. */
export function normalizarIntentoDateo(raw: unknown): IntentoDateo | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const intento: IntentoDateo = {
    canal: str(r.canal),
    agente_id: num(r.agente_id),
    agente_nombre: str(r.agente_nombre),
    convenio_id: num(r.convenio_id),
    convenio_nombre: str(r.convenio_nombre),
    convenio_establecimiento: str(r.convenio_establecimiento),
    servicio_id: num(r.servicio_id),
    servicio_nombre: str(r.servicio_nombre),
    descuento_id: num(r.descuento_id),
    descuento_nombre: str(r.descuento_nombre),
    es_avance: r.es_avance === true,
    comprobante_avance_url: str(r.comprobante_avance_url),
    telefono: str(r.telefono),
  }
  return intento.canal ? intento : null
}

/** Lee el intento que dejó DateoCreate.vue en history.state. */
export function leerIntentoDeHistorial(state: unknown): IntentoDateo | null {
  if (!state || typeof state !== 'object') return null
  return normalizarIntentoDateo((state as Record<string, unknown>).intento)
}

/** Copia plana (sin proxies reactivos) para guardar en history.state. */
export function intentoParaHistorial(intento: IntentoDateo): HistoryState {
  return JSON.parse(JSON.stringify(intento)) as HistoryState
}

type CamposIntento = Pick<
  CrearTicketExcepcionDateoPayload,
  | 'canal'
  | 'convenio_id'
  | 'servicio_id'
  | 'descuento_id'
  | 'es_avance'
  | 'comprobante_avance_url'
  | 'telefono'
>

/** Campos del intento para el body de crearTicketExcepcionDateo(). */
export function camposIntentoParaTicket(intento: IntentoDateo): CamposIntento {
  return {
    canal: intento.canal,
    convenio_id: intento.convenio_id,
    servicio_id: intento.servicio_id,
    descuento_id: intento.descuento_id,
    es_avance: intento.es_avance,
    comprobante_avance_url: intento.es_avance ? intento.comprobante_avance_url : null,
    telefono: intento.telefono,
  }
}

/** Sin intento (se entró por URL): solo convenio y teléfono, elegidos a mano. */
export function camposFallbackParaTicket(convenioId: number | null, telefono: string): CamposIntento {
  return {
    convenio_id: convenioId,
    telefono: telefono.trim() || null,
  }
}

/** Texto del canal para el resumen. */
export function etiquetaCanalIntento(canal: string | null): string {
  if (canal === 'ASESOR_CONVENIO') return 'Asesor convenio'
  if (canal === 'ASESOR_COMERCIAL') return 'Asesor comercial'
  return canal ?? '—'
}

/** ¿La respuesta de error es el 409 de turno de segunda vez? */
export function esConflictoSegundaVez(data: unknown): boolean {
  return !!data && typeof data === 'object' && (data as { code?: unknown }).code === 'TURNO_SEGUNDA_VEZ'
}
