// Sección 8 del Súper Informe (vista previa): adapta la respuesta de
// GET /reportes-admin/super-informe/resumen-contable a la tabla y reutiliza
// textoRechazo() del resumen de Turnos del Día (src/views/rtm/resumenContable.ts).
import { textoRechazo } from '@/views/rtm/resumenContable'
import type { ResumenContableRechazo, ResumenContableResponse } from '@/services/reportesAdminService'

export interface FilaTablaResumenContable {
  servicio: string
  motos: number
  livianos: number
  otros: number
  total: number
  /** Subtotal RTM y TOTAL GENERAL: en negrita. */
  resaltada: boolean
}

export function filasTablaResumenContable(r: ResumenContableResponse): FilaTablaResumenContable[] {
  return r.filas.map((f) => ({
    servicio: f.etiqueta,
    motos: f.motos,
    livianos: f.livianos,
    otros: f.otros,
    total: f.total,
    resaltada: f.tipo !== 'detalle',
  }))
}

/** "15,0% (3 de 20)" o "—" (mismo formato que Turnos del Día). */
export function textoRechazoApi(r: ResumenContableRechazo): string {
  return textoRechazo({
    aprobadas: r.aprobadas,
    rechazadas: r.rechazadas,
    sinResultado: r.sin_resultado,
    porcentaje: r.porcentaje,
  })
}
