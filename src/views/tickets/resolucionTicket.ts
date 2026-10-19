// src/views/tickets/resolucionTicket.ts
//
// Texto de la decisión de comisión de un ticket de Excepción de Dateo ya
// APROBADO. Misma regla que el backend (tickets_consulta_service.ts::
// sqlDecisionComision): flag del asesor = con_comision_asesor ?? con_comision
// (producción local solo escribe con_comision) y, si las columnas nuevas
// están vacías, el convenio cobra. Los flags son TINYINT(1): llegan como
// 0/1/null (o boolean recién aprobado), nunca se comparan con === true/false.

import type { CasoComision } from '@/services/ticketsService'

export type ResolucionComision =
  | 'CON_COMISION'
  | 'SIN_COMISION_ASESOR'
  | 'SIN_COMISION_CONVENIO'
  | 'SIN_COMISION_NINGUNO'
  | 'DENTRO_VENTANA'
  | 'REGIMEN_ANTERIOR'

type Flag = boolean | number | null | undefined

const vacio = (v: Flag) => v === null || v === undefined

export function resolucionComision(d: {
  conComision: Flag
  conComisionAsesor?: Flag
  conComisionConvenio?: Flag
  dentroVentana: Flag
  convenioId?: number | null
}): ResolucionComision {
  const nuevasVacias = vacio(d.conComisionAsesor) && vacio(d.conComisionConvenio)
  const asesor = vacio(d.conComisionAsesor) ? d.conComision : d.conComisionAsesor
  // Sin decisión guardada (aprobado antes de que se decidiera siempre): dentro
  // de ventana era comisión completa; fuera, el régimen anterior. Con decisión
  // guardada manda la decisión, dentro o fuera.
  if (vacio(asesor)) return Boolean(d.dentroVentana) ? 'DENTRO_VENTANA' : 'REGIMEN_ANTERIOR'

  let convenio: Flag = d.conComisionConvenio
  if (nuevasVacias) convenio = d.convenioId === null ? null : 1

  const sinAsesor = Boolean(asesor) === false
  const sinConvenio = !vacio(convenio) && Boolean(convenio) === false
  if (sinAsesor && sinConvenio) return 'SIN_COMISION_NINGUNO'
  if (sinAsesor) return 'SIN_COMISION_ASESOR'
  if (sinConvenio) return 'SIN_COMISION_CONVENIO'
  return 'CON_COMISION'
}

export const TEXTO_RESOLUCION_COMISION: Record<ResolucionComision, string> = {
  CON_COMISION: 'Aprobado con comisión',
  SIN_COMISION_ASESOR: 'Aprobado sin comisión para el asesor',
  SIN_COMISION_CONVENIO: 'Aprobado sin comisión para el convenio',
  SIN_COMISION_NINGUNO: 'Aprobado sin comisión para el asesor ni el convenio',
  DENTRO_VENTANA: 'Comisión completa (dentro de ventana)',
  REGIMEN_ANTERIOR: 'Aprobado (régimen anterior)',
}

/**
 * Texto según el caso: en Caso 1 no hay convenio y en Caso 2 asesor y
 * convenio son la misma persona, así que "sin comisión" no se desglosa.
 */
export function textoResolucion(r: ResolucionComision, caso?: CasoComision | null): string {
  const sin =
    r === 'SIN_COMISION_ASESOR' || r === 'SIN_COMISION_CONVENIO' || r === 'SIN_COMISION_NINGUNO'
  if (sin && (caso === 'SIN_CONVENIO' || caso === 'CONVENIO_SELF')) return 'Aprobado sin comisión'
  return TEXTO_RESOLUCION_COMISION[r]
}
