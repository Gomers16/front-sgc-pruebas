// src/views/tickets/decisionComision.ts
//
// Botones de aprobación de un ticket de Excepción de Dateo según el caso de
// comisión que manda el backend (GET /tickets/:id → caso_comision; la regla
// vive en decidirCasoComision() del backend, acá no se recalcula). La misma
// decisión dentro y fuera de ventana (la ventana solo informa), con
// interruptores "Cobra / No cobra":
//  - Caso 1 (SIN_CONVENIO): con / sin comisión del asesor
//  - Caso 2 (CONVENIO_SELF): con / sin comisión — el asesor convenio es el
//    convenio, los dos flags van iguales
//  - Caso 3 (CONVENIO_COMERCIAL): las 4 combinaciones

import type { AprobarTicketBody, CasoComision } from '@/services/ticketsService'

/** Riesgo de la decisión: todos cobran, uno pierde, nadie cobra. */
export type NivelDecision = 'todos' | 'parcial' | 'ninguno'

export interface DecisionAprobacion {
  body: AprobarTicketBody
  /** Línea resumen: quién cobra y quién pierde. */
  resumen: string
  nivel: NivelDecision
  /** Título del diálogo de confirmación. */
  titulo: string
  /** Mensaje del diálogo: repite el resumen y avisa qué se crea. */
  mensaje: string
}

const AVISO =
  'Se crea el dateo y, si Facturación ya está confirmada, la comisión. No se puede deshacer.'

/** Color (Vuetify) del resumen según el riesgo. */
export const COLOR_NIVEL: Record<NivelDecision, string> = {
  todos: 'blue-grey',
  parcial: 'warning',
  ninguno: 'error',
}

/**
 * Decisión a partir de los interruptores "Cobra / No cobra". El body es el
 * mismo que el backend espera por caso:
 *  - Caso 1: solo con_comision_asesor (no hay convenio)
 *  - Caso 2: un solo interruptor; los dos flags iguales (asesor = convenio)
 *  - Caso 3: los dos flags
 */
export function decisionAprobacion(
  caso: CasoComision | null,
  cobraAsesor: boolean,
  cobraConvenio: boolean,
): DecisionAprobacion {
  let body: AprobarTicketBody
  let resumen: string
  let nivel: NivelDecision
  if (caso === 'CONVENIO_COMERCIAL') {
    body = { con_comision_asesor: cobraAsesor, con_comision_convenio: cobraConvenio }
    nivel =
      cobraAsesor && cobraConvenio ? 'todos' : cobraAsesor || cobraConvenio ? 'parcial' : 'ninguno'
    resumen =
      cobraAsesor && cobraConvenio
        ? 'El asesor y el convenio cobran normal'
        : cobraConvenio
          ? 'El asesor pierde su comisión; el convenio cobra normal'
          : cobraAsesor
            ? 'El convenio pierde su comisión; el asesor cobra normal'
            : 'Ni el asesor ni el convenio cobran'
  } else if (caso === 'CONVENIO_SELF') {
    body = { con_comision_asesor: cobraAsesor, con_comision_convenio: cobraAsesor }
    nivel = cobraAsesor ? 'todos' : 'ninguno'
    resumen = cobraAsesor
      ? 'El asesor convenio cobra normal'
      : 'El asesor convenio pierde su comisión (como asesor y como convenio)'
  } else {
    body = { con_comision_asesor: cobraAsesor }
    nivel = cobraAsesor ? 'todos' : 'ninguno'
    resumen = cobraAsesor
      ? 'El asesor cobra normal (no hay convenio)'
      : 'El asesor pierde su comisión (no hay convenio)'
  }
  return {
    body,
    resumen,
    nivel,
    titulo: nivel === 'todos' ? 'Aprobar con comisión' : 'Aprobar con pérdida de comisión',
    mensaje: `${resumen}. ${AVISO}`,
  }
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
