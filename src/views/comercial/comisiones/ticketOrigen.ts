// src/views/comercial/comisiones/ticketOrigen.ts
//
// Comisiones que vienen de un ticket de Excepción de Dateo: la marca "sin
// comisión" y el 409 MONTO_CONTRADICE_TICKET_SIN_COMISION que devuelve el
// backend cuando se intenta poner un monto contra la decisión del ticket
// (editar, valores, crear a mano). Solo SUPER_ADMIN/GERENCIA pueden confirmar.

import { ApiError, type TicketOrigenComision } from '@/services/comisionesService'

export const CODIGO_CONFLICTO = 'MONTO_CONTRADICE_TICKET_SIN_COMISION'
export const CODIGO_NO_PERMITIDO = 'CONFIRMACION_SIN_COMISION_NO_PERMITIDA'

export interface ConflictoSinComision {
  ticketId: number
  sinAsesor: boolean
  sinConvenio: boolean
  campos: ('monto_asesor' | 'monto_convenio')[]
  puedeConfirmar: boolean
  /** 403: alguien sin permiso intentó confirmar. */
  noPermitido: boolean
  mensaje: string
}

/** El error es el 409/403 de "sin comisión por ticket"? (si no, null). */
export function conflictoSinComision(err: unknown): ConflictoSinComision | null {
  if (!(err instanceof ApiError) || !err.data) return null
  const d = err.data as {
    code?: string
    message?: string
    ticket_id?: number
    decision?: { sin_comision_asesor?: boolean; sin_comision_convenio?: boolean }
    campos?: ConflictoSinComision['campos']
    puede_confirmar?: boolean
  }
  if (d.code !== CODIGO_CONFLICTO && d.code !== CODIGO_NO_PERMITIDO) return null
  return {
    ticketId: Number(d.ticket_id),
    sinAsesor: Boolean(d.decision?.sin_comision_asesor),
    sinConvenio: Boolean(d.decision?.sin_comision_convenio),
    campos: Array.isArray(d.campos) ? d.campos : [],
    puedeConfirmar: Boolean(d.puede_confirmar),
    noPermitido: d.code === CODIGO_NO_PERMITIDO,
    mensaje: String(d.message ?? err.message),
  }
}

/** "El ticket #841 decidió sin comisión para el convenio." */
export function textoDecisionTicket(
  c: Pick<ConflictoSinComision, 'ticketId' | 'sinAsesor' | 'sinConvenio'>,
) {
  const quien =
    c.sinAsesor && c.sinConvenio
      ? 'el asesor y el convenio'
      : c.sinAsesor
        ? 'el asesor'
        : 'el convenio'
  return `El ticket #${c.ticketId} decidió sin comisión para ${quien}.`
}

/** "el monto del convenio" / "los montos del asesor y del convenio". */
export function textoCampos(campos: ConflictoSinComision['campos']) {
  const a = campos.includes('monto_asesor')
  const c = campos.includes('monto_convenio')
  if (a && c) return 'los montos del asesor y del convenio'
  return a ? 'el monto del asesor' : 'el monto del convenio'
}

/**
 * Llama sin confirmar; si el backend responde el 409 de "sin comisión por
 * ticket", pide confirmación (`pedir`) y, si la dan, repite con
 * confirmar_excepcion=true. null = el usuario canceló (no se escribió nada).
 * Cualquier otro error se propaga igual que antes.
 */
export async function conConfirmacionSinComision<T>(
  llamar: (confirmar: boolean) => Promise<T>,
  pedir: (c: ConflictoSinComision) => Promise<boolean>,
): Promise<T | null> {
  try {
    return await llamar(false)
  } catch (err) {
    const c = conflictoSinComision(err)
    if (!c) throw err
    const ok = await pedir(c)
    if (!ok || !c.puedeConfirmar) return null
    return llamar(true)
  }
}

/** Texto del valor dejado de pagar del detalle (exacto o estimado). */
export function textoDejadoDePagar(
  d: NonNullable<TicketOrigenComision['dejado_de_pagar']>,
  cop: (v: number) => string,
): string {
  const partes: string[] = []
  if (d.asesor) partes.push(`asesor ${cop(d.asesor)}`)
  if (d.convenio) partes.push(`convenio ${cop(d.convenio)}`)
  if (d.convenio === null) partes.push('convenio: sin estimado')
  const total = (d.asesor || 0) + (d.convenio || 0)
  return `${cop(total)}${partes.length ? ` (${partes.join(' · ')})` : ''} — ${d.exacto ? 'exacto' : 'estimado'}`
}
