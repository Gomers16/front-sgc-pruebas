// src/views/tickets/decisionConvenio.ts
//
// Decisión del convenio en un ticket de Excepción de Dateo: al crear y al
// aprobar hay que elegir un convenio o "Sin convenio (directo)". Misma regla
// que el backend (app/services/convenio_ticket_service.ts):
//  - crear: convenio_id o sin_convenio=true; el asesor convenio no elige.
//  - aprobar: si queda sin convenio y nadie lo decidió al crear
//    (sinConvenioExplicito distinto de true), se manda confirmar_sin_convenio.

import { etiquetaConvenio } from '@/services/conveniosService'
import type { CasoComision, ComisionTicketResumen } from '@/services/ticketsService'

/** undefined = todavía no eligió; null = "Sin convenio (directo)". */
export type ConvenioElegido = number | null | undefined

export function convenioElegido(seleccionadoId: number | null | undefined, sinConvenio: boolean): ConvenioElegido {
  if (sinConvenio) return null
  return seleccionadoId ?? undefined
}

/** Campos del body de crear(); null = falta decidir (no se puede enviar). */
export function camposConvenioCrear(
  elegido: ConvenioElegido,
  esAsesorConvenio: boolean,
): { convenio_id?: number | null; sin_convenio?: boolean } | null {
  if (esAsesorConvenio) return {}
  if (elegido === undefined) return null
  return elegido === null ? { convenio_id: null, sin_convenio: true } : { convenio_id: elegido }
}

const esVerdadero = (v: unknown) => v === true || v === 1 || v === '1'

/** ¿Alguien decidió "sin convenio" al crear? (TINYINT: 0/1/null) */
export function sinConvenioDecidido(sinConvenioExplicito: unknown): boolean {
  return esVerdadero(sinConvenioExplicito)
}

/**
 * Campos del convenio para el body de aprobar(); null = falta decidir.
 * Caso 2: el convenio es el del asesor convenio, no se envía nada.
 */
export function camposConvenioAprobar(p: {
  caso: CasoComision | null
  convenioActual: number | null
  elegido: ConvenioElegido
  sinConvenioExplicito: unknown
}): { convenio_id?: number | null; confirmar_sin_convenio?: boolean } | null {
  if (p.caso === 'CONVENIO_SELF') return {}
  if (p.elegido === undefined) return null
  const out: { convenio_id?: number | null; confirmar_sin_convenio?: boolean } = {}
  if (p.elegido !== p.convenioActual) out.convenio_id = p.elegido
  if (p.elegido === null && !sinConvenioDecidido(p.sinConvenioExplicito)) {
    out.confirmar_sin_convenio = true
  }
  return out
}

/** La observación menciona un convenio ("convenio", "CONVENÍOS"…). */
export function observacionMencionaConvenio(texto: string | null | undefined): boolean {
  if (!texto) return false
  return /convenio/i.test(texto.normalize('NFD').replace(/[̀-ͯ]/g, ''))
}

/** Aviso: la observación dice "convenio" y el ticket queda (o está) sin convenio. */
export function avisoConvenioEnObservacion(
  mencionaConvenio: boolean,
  elegido: ConvenioElegido,
): boolean {
  return mencionaConvenio && (elegido === null || elegido === undefined)
}

export function etiquetaOpcionConvenio(c: {
  nombre: string
  establecimiento?: string | null
  asignado?: boolean
}): string {
  const base = etiquetaConvenio(c)
  return c.asignado === false ? `${base} · no asignado` : base
}

/**
 * Regla del motor que se muestra (no se cambia): con convenio, cualquier
 * descuento en la factura final deja en $0 la comisión del convenio (en el
 * Caso 2, la del asesor convenio). Avance solo decide el monto de avance.
 */
export function textoReglaDescuentoConvenio(caso: CasoComision | null): string | null {
  if (caso === 'CONVENIO_COMERCIAL') {
    return 'Con convenio, si la factura final lleva cualquier descuento (incluido Avance), la comisión del convenio queda en $0, aunque se elija "Cobra".'
  }
  if (caso === 'CONVENIO_SELF') {
    return 'Con convenio, si la factura final lleva cualquier descuento (incluido Avance), la comisión del asesor convenio queda en $0.'
  }
  return null
}

/* ═══════════ Corrección del convenio después de aprobar ═══════════ */

/**
 * ¿Se puede corregir el convenio de un ticket aprobado? Solo con la comisión
 * PENDIENTE y fuera de liquidaciones, o sin comisión todavía (mismo criterio
 * que PATCH /tickets-excepcion-dateo/:id/convenio).
 */
export function puedeCorregirConvenio(
  c: ComisionTicketResumen | null | undefined,
): { puede: boolean; motivo: string | null } {
  if (!c) return { puede: false, motivo: 'El ticket no tiene dateo vinculado.' }
  if (c.id === null) return { puede: true, motivo: null }
  if (c.en_liquidacion) {
    return { puede: false, motivo: 'La comisión ya está en una liquidación: requiere un ajuste aparte.' }
  }
  if (c.estado !== 'PENDIENTE') {
    return { puede: false, motivo: `La comisión está ${c.estado}: requiere un ajuste aparte.` }
  }
  return { puede: true, motivo: null }
}

/** Decisión guardada al aprobar como interruptor: null (dentro de ventana sin decisión) = Cobra. */
export function cobraGuardado(v: unknown): boolean {
  if (v === null || v === undefined) return true
  return v === true || v === 1 || v === '1'
}

/** Caso al que pasa el ticket con el convenio elegido (el backend lo confirma). */
export function casoTrasCorreccion(elegido: ConvenioElegido): CasoComision | null {
  if (elegido === undefined) return null
  return elegido === null ? 'SIN_CONVENIO' : 'CONVENIO_COMERCIAL'
}

/**
 * ¿El convenio que trae el dateo está asignado al asesor? Según la búsqueda
 * por su nombre en GET /convenios/asignados: si aparece, su `asignado`; si no
 * aparece y la búsqueda era solo de asignados (COMERCIAL), no lo está; si
 * incluía los no asignados (gerencia) y no aparece, no se sabe (null).
 */
export function asignadoSegunBusqueda(
  id: number,
  filas: { id: number; asignado: boolean }[],
  incluyeNoAsignados: boolean,
): boolean | null {
  const fila = filas.find((c) => c.id === id)
  if (fila) return fila.asignado
  return incluyeNoAsignados ? null : false
}
