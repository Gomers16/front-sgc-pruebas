// src/views/tickets/decisionComision.ts
//
// Botones de aprobación de un ticket de Excepción de Dateo según el caso de
// comisión que manda el backend (GET /tickets/:id → caso_comision; la regla
// vive en decidirCasoComision() del backend, acá no se recalcula):
//  - dentro de ventana: un solo "Aprobar" (comisión completa, body vacío)
//  - Caso 1 (SIN_CONVENIO): con / sin comisión del asesor
//  - Caso 2 (CONVENIO_SELF): con / sin comisión — el asesor convenio es el
//    convenio, los dos flags van iguales
//  - Caso 3 (CONVENIO_COMERCIAL): las 4 combinaciones

import type { AprobarTicketBody, CasoComision } from '@/services/ticketsService'

export interface OpcionAprobacion {
  clave: 'aprobar' | 'con' | 'sin' | 'sin_asesor' | 'sin_convenio' | 'sin_ninguno'
  texto: string
  color: 'success' | 'warning' | 'error'
  body: AprobarTicketBody
  /** Título y mensaje del diálogo de confirmación: dicen quién pierde la comisión. */
  titulo: string
  mensaje: string
}

const AVISO =
  'Se crea el dateo y, si Facturación ya está confirmada, la comisión. No se puede deshacer.'

export function opcionesAprobacion(
  caso: CasoComision | null,
  dentroVentana: boolean,
): OpcionAprobacion[] {
  if (dentroVentana) {
    return [
      {
        clave: 'aprobar',
        texto: 'Aprobar',
        color: 'success',
        body: {},
        titulo: 'Aprobar con comisión completa',
        mensaje: `El ticket está dentro de ventana: nadie pierde la comisión. ${AVISO}`,
      },
    ]
  }

  if (caso === 'CONVENIO_COMERCIAL') {
    return [
      {
        clave: 'con',
        texto: 'Con comisión (asesor y convenio)',
        color: 'success',
        body: { con_comision_asesor: true, con_comision_convenio: true },
        titulo: 'Aprobar con comisión para el asesor y el convenio',
        mensaje: `Nadie pierde la comisión: el asesor y el convenio cobran su parte normal. ${AVISO}`,
      },
      {
        clave: 'sin_asesor',
        texto: 'Sin comisión para el asesor',
        color: 'warning',
        body: { con_comision_asesor: false, con_comision_convenio: true },
        titulo: 'Aprobar sin comisión para el asesor',
        mensaje: `El ASESOR pierde su comisión (queda en $0). El convenio cobra su parte normal. ${AVISO}`,
      },
      {
        clave: 'sin_convenio',
        texto: 'Sin comisión para el convenio',
        color: 'warning',
        body: { con_comision_asesor: true, con_comision_convenio: false },
        titulo: 'Aprobar sin comisión para el convenio',
        mensaje: `El CONVENIO pierde su comisión (queda en $0). El asesor cobra su parte normal. ${AVISO}`,
      },
      {
        clave: 'sin_ninguno',
        texto: 'Sin comisión para ninguno',
        color: 'error',
        body: { con_comision_asesor: false, con_comision_convenio: false },
        titulo: 'Aprobar sin comisión para nadie',
        mensaje: `El ASESOR y el CONVENIO pierden la comisión (ambos en $0). ${AVISO}`,
      },
    ]
  }

  // Caso 2: un solo beneficiario (el asesor convenio es el convenio).
  if (caso === 'CONVENIO_SELF') {
    return [
      {
        clave: 'con',
        texto: 'Aprobar con comisión',
        color: 'success',
        body: { con_comision_asesor: true, con_comision_convenio: true },
        titulo: 'Aprobar con comisión',
        mensaje: `El asesor convenio cobra su comisión normal. ${AVISO}`,
      },
      {
        clave: 'sin',
        texto: 'Aprobar sin comisión',
        color: 'warning',
        body: { con_comision_asesor: false, con_comision_convenio: false },
        titulo: 'Aprobar sin comisión',
        mensaje: `El ASESOR CONVENIO pierde la comisión (queda en $0): como asesor y como convenio son la misma persona. ${AVISO}`,
      },
    ]
  }

  // Caso 1 (o caso desconocido): solo el asesor, sin flag de convenio.
  return [
    {
      clave: 'con',
      texto: 'Aprobar con comisión',
      color: 'success',
      body: { con_comision_asesor: true },
      titulo: 'Aprobar con comisión',
      mensaje: `El asesor cobra su comisión normal (sin convenio). ${AVISO}`,
    },
    {
      clave: 'sin',
      texto: 'Aprobar sin comisión',
      color: 'warning',
      body: { con_comision_asesor: false },
      titulo: 'Aprobar sin comisión',
      mensaje: `El ASESOR pierde su comisión (queda en $0). El ticket no tiene convenio. ${AVISO}`,
    },
  ]
}

/**
 * Caso si gerencia corrige el convenio al aprobar. `undefined` = sin
 * corrección (el del backend). Solo se ofrece corregir a un comercial: el
 * asesor convenio siempre queda con su propio convenio.
 */
export function casoConConvenioCorregido(
  caso: CasoComision | null,
  convenioCorregido: number | null | undefined,
): CasoComision | null {
  if (convenioCorregido === undefined || caso === 'CONVENIO_SELF') return caso
  return convenioCorregido === null ? 'SIN_CONVENIO' : 'CONVENIO_COMERCIAL'
}

/** Mensaje claro para los errores conocidos de aprobar/rechazar. */
export function mensajeErrorResolucion(
  status: number | undefined,
  data: unknown,
  porDefecto: string,
): string {
  const d = (data && typeof data === 'object' ? data : {}) as { code?: string; message?: string }
  if (d.code === 'TICKET_YA_RESUELTO' || status === 409) {
    return 'Este ticket ya fue resuelto por otra persona. Se recargó con la decisión que quedó.'
  }
  if (d.code === 'COMBINACION_COMISION_INVALIDA') {
    return `La decisión de comisión no aplica a este ticket: ${d.message ?? 'combinación inválida'}.`
  }
  return d.message || porDefecto
}
