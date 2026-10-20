// Reglas del diálogo "Editar descuento" de un ticket CONFIRMADA
// (FacturacionHistorico.vue). Funciones puras para probarlas sin la pantalla.
// El backend valida lo mismo (PATCH /facturacion/tickets/:id con motivo_edicion).

import type {
  EdicionDescuentoBody,
  ResultadoEdicionDescuento,
} from '@/services/facturacion_service'

export const ROLES_EDICION_DESCUENTO = ['SUPER_ADMIN', 'GERENCIA'] as const
export const MOTIVO_EDICION_MIN = 5

/** Lo que el diálogo deja cambiar (mismo bloque que el modal de confirmación). */
export interface FormEdicionDescuento {
  descuentoId: number | null
  monto: number
  autorizadoPorId: number | null
  observacion: string
  consecutivo: string
}

/** Ticket tal como lo devuelve GET /facturacion/tickets/:id (campos que se usan aquí). */
export interface TicketParaEditar {
  id: number
  estado: string
  descuentoId?: number | null
  descuentoMontoAplicado?: number | string | null
  autorizadoPorId?: number | null
  descuentoObservacion?: string | null
  consecutivoDescuento?: string | null
  total?: number | string | null
  totalFactura?: number | string | null
  totalSinDescuento?: number | string | null
}

const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v))

export function formInicialEdicion(t: TicketParaEditar): FormEdicionDescuento {
  return {
    descuentoId: t.descuentoId ?? null,
    monto: num(t.descuentoMontoAplicado) ?? 0,
    autorizadoPorId: t.autorizadoPorId ?? null,
    observacion: t.descuentoObservacion ?? '',
    consecutivo: t.consecutivoDescuento ?? '',
  }
}

/** Sin descuento no hay monto, autorizador, observación ni consecutivo. */
function normalizar(f: FormEdicionDescuento) {
  if (!f.descuentoId) {
    return { descuentoId: null, monto: 0, autorizadoPorId: null, observacion: '', consecutivo: '' }
  }
  return {
    descuentoId: f.descuentoId,
    monto: f.monto || 0,
    autorizadoPorId: f.autorizadoPorId ?? null,
    observacion: f.observacion.trim(),
    consecutivo: f.consecutivo.trim(),
  }
}

export function hayCambioEdicion(
  inicial: FormEdicionDescuento,
  actual: FormEdicionDescuento,
): boolean {
  const a = normalizar(inicial)
  const b = normalizar(actual)
  return (Object.keys(a) as Array<keyof typeof a>).some((k) => a[k] !== b[k])
}

export function motivoEdicionValido(motivo: string): boolean {
  return motivo.trim().length >= MOTIVO_EDICION_MIN
}

/** Un descuento nuevo (distinto al que tenía el ticket) lleva quién lo autorizó. */
export function requiereAutorizador(
  inicial: FormEdicionDescuento,
  actual: FormEdicionDescuento,
): boolean {
  return !!actual.descuentoId && actual.descuentoId !== inicial.descuentoId
}

/** Totales que mostrará el ticket (misma regla del backend: desde total_sin_descuento). */
export function totalesEdicion(t: TicketParaEditar, actual: FormEdicionDescuento) {
  const totalActual = num(t.totalFactura) ?? num(t.total) ?? 0
  const base = num(t.totalSinDescuento) ?? totalActual + (num(t.descuentoMontoAplicado) ?? 0)
  const monto = actual.descuentoId ? actual.monto || 0 : 0
  return { antes: totalActual, despues: monto > 0 ? Math.max(0, base - monto) : base }
}

export function bodyEdicion(
  actual: FormEdicionDescuento,
  motivo: string,
  confirmarComisionPagada = false,
): EdicionDescuentoBody {
  const f = normalizar(actual)
  const extra = confirmarComisionPagada ? { confirmar_comision_pagada: true } : {}
  if (!f.descuentoId) return { descuento_id: null, motivo_edicion: motivo.trim(), ...extra }
  return {
    ...extra,
    descuento_id: f.descuentoId,
    descuento_monto_aplicado: f.monto,
    autorizado_por_id: f.autorizadoPorId,
    descuento_observacion: f.observacion || null,
    consecutivo_descuento: f.consecutivo,
    motivo_edicion: motivo.trim(),
  }
}

type ComisionPrevia = ResultadoEdicionDescuento['comision']

const totalComision = (m: { montoAsesor: number; montoConvenio: number }) =>
  m.montoAsesor + m.montoConvenio

/** Qué se muestra en el diálogo sobre la comisión del dateo del turno. */
export function avisoComision(c: ComisionPrevia): {
  tipo: 'info' | 'warning' | 'success'
  texto: string
} {
  switch (c.accion) {
    case 'RECALCULADA':
      return {
        tipo: 'success',
        texto:
          c.mensaje ??
          `La comisión #${c.comisionId} (${c.estado}) se recalcula con el nuevo descuento.`,
      }
    case 'AJUSTADA_TRAS_PAGO':
    case 'NO_MODIFICADA':
    case 'SIN_CONTINUIDAD':
      return { tipo: 'warning', texto: c.mensaje ?? `La comisión #${c.comisionId} no se modifica.` }
    default:
      return { tipo: 'info', texto: 'El ticket no tiene comisión que recalcular.' }
  }
}

/**
 * Modal antes de guardar cuando la comisión cambia:
 *  - cambio (PENDIENTE / APROBADA): "La comisión #N (estado) cambiará de $X a $Y".
 *  - pagada (PAGADA o en liquidación): advertencia fuerte y casilla obligatoria.
 * null = se guarda sin modal (la comisión no cambia o no hay comisión).
 */
export function modalComision(
  c: ComisionPrevia,
  formatCOP: (n: number) => string,
): { tipo: 'cambio' | 'pagada'; titulo: string; texto: string; requiereCasilla: boolean } | null {
  if ((c.accion !== 'RECALCULADA' && c.accion !== 'AJUSTADA_TRAS_PAGO') || !c.antes || !c.despues) {
    return null
  }
  const cambio = `La comisión #${c.comisionId} (${c.estado}) cambiará de ${formatCOP(totalComision(c.antes))} a ${formatCOP(totalComision(c.despues))}.`
  if (!c.requiereConfirmacionPago) {
    return {
      tipo: 'cambio',
      titulo: 'Confirmar cambio de comisión',
      texto: cambio,
      requiereCasilla: false,
    }
  }
  const donde =
    c.estado === 'PAGADA'
      ? 'ya fue pagada'
      : `ya está en la liquidación #${c.liquidacionIds.join(', #')}`
  const signo = c.diferencia.total < 0 ? '−' : c.diferencia.total > 0 ? '+' : ''
  return {
    tipo: 'pagada',
    titulo:
      c.estado === 'PAGADA' ? 'Esta comisión ya fue pagada' : 'Esta comisión ya está liquidada',
    texto: `Esta comisión ${donde}. Se modificará el monto en el sistema, pero el dinero ya entregado no cambia. Diferencia: ${signo}${formatCOP(Math.abs(c.diferencia.total))}. ${cambio}`,
    requiereCasilla: true,
  }
}
