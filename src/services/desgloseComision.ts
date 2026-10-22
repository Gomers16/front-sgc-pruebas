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
    /** Con convenio y descuento final: la comisión del convenio queda en cero. */
    convenioSinComision: boolean
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
 * Efecto de un descuento en la comisión, en general (cuando no se sabe el
 * caso del turno). Debe decir lo mismo que calcularComision() y
 * convenioSinComisionPorDescuento() del backend: ver comision_desglose_consistencia.
 */
export const TEXTO_EFECTO_DESCUENTO =
  'Con convenio, cualquier descuento deja la comisión del convenio en cero; el asesor comercial cobra su valor normal. ' +
  'Si el asesor convenio se datea a sí mismo, su comisión queda en cero. ' +
  'Sin convenio y con cliente nuevo, el asesor comercial pasa del valor nuevo directo al valor de recurrencia.'

export const TEXTO_DESCUENTO_CONVENIO =
  'Con convenio, cualquier descuento deja la comisión del convenio en cero; el asesor comercial cobra su valor normal.'
export const TEXTO_DESCUENTO_ASESOR_CONVENIO =
  'Con convenio, cualquier descuento deja en cero la comisión del asesor convenio (se dateó a sí mismo).'

/**
 * Aviso del descuento para caja y edición según el caso del turno; null si
 * no aplica (Caso 1 o caso desconocido: se usa TEXTO_EFECTO_DESCUENTO).
 * Manda el descuento final de la factura, sea cual sea su código o monto.
 *  - traiaDescuento: el dateo (caja) o la factura (edición) traía descuento.
 */
export function textoDescuentoConvenio(p: {
  caso: CasoComision | null
  hayDescuento: boolean
  traiaDescuento?: 'DATEO' | 'FACTURA' | null
}): string | null {
  if (!p.caso || p.caso === 'SIN_CONVENIO') return null
  const self = p.caso === 'CONVENIO_SELF'
  if (p.hayDescuento) return self ? TEXTO_DESCUENTO_ASESOR_CONVENIO : TEXTO_DESCUENTO_CONVENIO
  if (!p.traiaDescuento) return null
  const quien = self ? 'el asesor convenio' : 'el convenio'
  const donde = p.traiaDescuento === 'DATEO' ? 'El dateo' : 'La factura'
  return `${donde} traía descuento. Sin descuento, ${quien} cobra su comisión normal.`
}

/** Caso del turno con lo que ve la cajera (quién datea y si hay convenio). */
export function casoDelTurno(p: {
  tieneComercial: boolean
  tieneConvenio: boolean
}): CasoComision | null {
  if (p.tieneConvenio) return p.tieneComercial ? 'CONVENIO_COMERCIAL' : 'CONVENIO_SELF'
  return p.tieneComercial ? 'SIN_CONVENIO' : null
}
