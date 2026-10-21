// Desglose de la comisión de un ticket tal como lo arma el backend
// (comision_ticket_service.ts::armarDesglose). Lo devuelven la
// previsualización de la edición de facturas (comision.desglose) y
// GET /comisiones/:id (desglose_motor). El frontend solo lo muestra: los
// montos, la regla y los avisos salen del mismo cálculo que se guarda.

export type CasoComision = 'SIN_CONVENIO' | 'CONVENIO_SELF' | 'CONVENIO_COMERCIAL'
export type RolBeneficiario = 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | 'CONVENIO'

export interface BeneficiarioComision {
  rol: RolBeneficiario
  id: number | null
  nombre: string | null
  tipo: string | null
  /** Para CONVENIO: quién recibe su parte. */
  cobraAsesorConvenio: { id: number; nombre: string } | null
  /** Monto guardado hoy (null = la comisión todavía no existe). */
  antes: number | null
  despues: number
}

export interface ValorConfigUsado {
  campo: string
  etiqueta: string
  valor: number
  fuente: 'FILA_PROPIA' | 'GLOBAL' | 'RESPALDO'
  tabla: string | null
  filaId: number | null
  asesorId: number | null
  tipoVehiculo: string | null
  columna: string
  usado: boolean
}

export type CodigoAlertaComision =
  | 'CONFIG_EN_CERO'
  | 'SIN_COMISION_TICKET'
  | 'AVANCE_HEREDADO'
  | 'SIN_CONTINUIDAD'
  | 'ESTIMADO'
  | 'NO_MODIFICADA'
  | 'DISTINTO_AL_MOTOR'

export interface AlertaComision {
  codigo: CodigoAlertaComision
  tipo: 'info' | 'warning' | 'error'
  mensaje: string
}

export interface DesgloseComision {
  estimado: boolean
  recalculado: boolean
  caso: CasoComision
  casoTexto: string
  escenario: 'NUEVO' | 'RECURRENTE' | 'RECUPERACION'
  escenarioTexto: string
  continuidad: { aplica: boolean; estado: string | null; texto: string }
  tipoVehiculo: 'MOTO' | 'VEHICULO' | null
  descuento: {
    codigo: string | null
    origen: 'DATEO' | 'CAJA' | null
    origenTexto: string
    esAvance: boolean
  }
  regla: string | null
  explicacion: string
  reglaGuardada: string | null
  beneficiarios: BeneficiarioComision[]
  configuracion: ValorConfigUsado[]
  alertas: AlertaComision[]
}

export const ETIQUETA_ROL: Record<RolBeneficiario, string> = {
  ASESOR_COMERCIAL: 'Asesor comercial',
  ASESOR_CONVENIO: 'Asesor convenio',
  CONVENIO: 'Convenio',
}

export const ETIQUETA_FUENTE: Record<ValorConfigUsado['fuente'], string> = {
  FILA_PROPIA: 'Fila propia',
  GLOBAL: 'Global',
  RESPALDO: 'Respaldo del código (sin fila)',
}

/** Texto de la fila de configuración de un valor (p. ej. "Global #2 · VEHICULO · base"). */
export function origenValorConfig(v: ValorConfigUsado): string {
  if (v.fuente === 'RESPALDO') return ETIQUETA_FUENTE.RESPALDO
  const fila = `${ETIQUETA_FUENTE[v.fuente]} #${v.filaId}`
  return [fila, v.tipoVehiculo, v.columna].filter(Boolean).join(' · ')
}

/** Diferencia de un beneficiario (null si no hay "antes": estimado). */
export function diferenciaBeneficiario(b: BeneficiarioComision): number | null {
  return b.antes === null ? null : b.despues - b.antes
}

/**
 * Efecto de un descuento en la comisión, en general (cuando no hay un
 * desglose del backend para el ticket, p. ej. la cajera al confirmar). Debe
 * decir lo mismo que calcularComision(): ver comision_desglose_consistencia.
 */
export const TEXTO_EFECTO_DESCUENTO =
  'Depende del caso del dateo. Sin convenio y cliente nuevo: el asesor comercial pasa del valor nuevo directo al valor de recurrencia. ' +
  'Asesor convenio que se datea a sí mismo: queda en $0 con avance o con un informativo especial puesto en caja. ' +
  'Comercial con convenio: el comercial cobra igual; el convenio queda en $0 con avance, o con un informativo especial puesto en caja si el cliente es nuevo. ' +
  'En los demás casos la comisión no cambia.'
