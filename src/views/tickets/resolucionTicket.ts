// src/views/tickets/resolucionTicket.ts
//
// Texto de la decisión de comisión de un ticket de Excepción de Dateo ya
// APROBADO. con_comision y dentro_ventana son TINYINT(1): el backend los
// manda como 0/1/null (o boolean recién aprobado), nunca se comparan con
// === true/false.

export type ResolucionComision = 'CON_COMISION' | 'SIN_COMISION' | 'DENTRO_VENTANA' | 'REGIMEN_ANTERIOR'

type Flag = boolean | number | null | undefined

export function resolucionComision(d: { conComision: Flag; dentroVentana: Flag }): ResolucionComision {
  if (d.conComision !== null && d.conComision !== undefined) {
    return Boolean(d.conComision) ? 'CON_COMISION' : 'SIN_COMISION'
  }
  // con_comision NULL: dentro de ventana es lo normal; fuera de ventana solo
  // pasa en tickets aprobados antes de que existiera la decisión de gerencia.
  return Boolean(d.dentroVentana) ? 'DENTRO_VENTANA' : 'REGIMEN_ANTERIOR'
}

export const TEXTO_RESOLUCION_COMISION: Record<ResolucionComision, string> = {
  CON_COMISION: 'Aprobado con comisión',
  SIN_COMISION: 'Aprobado sin comisión',
  DENTRO_VENTANA: 'Comisión completa (dentro de ventana)',
  REGIMEN_ANTERIOR: 'Aprobado (régimen anterior)',
}
