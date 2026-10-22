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

/** Suma de lo que cobran todos (después − antes); null si es estimado (no hay "antes"). */
export function diferenciaTotal(d: DesgloseComision): number | null {
  if (d.beneficiarios.some((b) => b.antes === null)) return null
  return d.beneficiarios.reduce((s, b) => s + b.despues - (b.antes ?? 0), 0)
}

export const totalDespues = (d: DesgloseComision) =>
  d.beneficiarios.reduce((s, b) => s + b.despues, 0)

/** Estado que muestra el chip: el de la comisión, o ESTIMADO si todavía no existe. */
export function estadoVisible(d: DesgloseComision, estado: string | null | undefined): string {
  return d.estimado || !estado ? 'ESTIMADO' : estado
}

export function colorEstadoComision(estado: string): string {
  return estado === 'PAGADA'
    ? 'red-darken-2'
    : estado === 'APROBADA'
      ? 'blue'
      : estado === 'ANULADA'
        ? 'grey'
        : estado === 'ESTIMADO'
          ? 'indigo'
          : 'orange-darken-2'
}

export interface AvisoCorto {
  codigo: CodigoAlertaComision | 'PAGADA' | 'EN_LIQUIDACION'
  tipo: 'info' | 'warning' | 'error'
  /** Una línea; el mensaje completo del backend queda en "Ver cómo se calculó". */
  texto: string
}

const TEXTO_AVISO: Partial<Record<CodigoAlertaComision, string>> = {
  CONFIG_EN_CERO: 'Valor en $0 por la configuración',
  SIN_COMISION_TICKET: 'Ticket aprobado «sin comisión»',
  SIN_CONTINUIDAD: 'Continuidad vacía: no se recalculó',
}

/**
 * Avisos que se ven sin abrir el detalle: configuración en $0, decisión de
 * ticket "sin comisión", comisión ya pagada (o en liquidación) y continuidad
 * vacía. Uno por tipo; los demás avisos del backend van dentro del panel.
 */
export function avisosVisibles(
  d: DesgloseComision,
  estado?: string | null,
  enLiquidacion = false,
): AvisoCorto[] {
  const out: AvisoCorto[] = []
  if (estado === 'PAGADA')
    out.push({ codigo: 'PAGADA', tipo: 'error', texto: 'Comisión ya pagada' })
  else if (enLiquidacion)
    out.push({ codigo: 'EN_LIQUIDACION', tipo: 'error', texto: 'Comisión ya en una liquidación' })
  for (const a of d.alertas) {
    const texto = TEXTO_AVISO[a.codigo]
    if (texto && !out.some((o) => o.codigo === a.codigo)) {
      out.push({ codigo: a.codigo, tipo: a.tipo === 'error' ? 'error' : 'warning', texto })
    }
  }
  return out
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
