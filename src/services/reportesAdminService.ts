// src/services/reportesAdminService.ts
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api'

function buildQuery(params?: Record<string, unknown>) {
  const q = new URLSearchParams()
  if (!params) return ''
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    q.append(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

async function apiFetch<T>(
  endpoint: string,
  opts: { query?: Record<string, unknown>; method?: 'GET' | 'POST'; body?: unknown } = {}
) {
  const url = `${BASE}${endpoint}${buildQuery(opts.query)}`

  const headers: HeadersInit = { 'Content-Type': 'application/json' }

  // 🔐 Usar el MISMO almacenamiento que el http.ts
  const token =
    sessionStorage.getItem('token') || localStorage.getItem('token')
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      msg = (err as Record<string, unknown>)?.message as string || JSON.stringify(err)
    } catch {}
    throw new Error(msg)
  }
  return (await res.json()) as T
}

/* ============================ Tipos ============================ */

export interface IngresoCanal {
  canal: string
  cantidad: number
  total_bruto: number
  total_neto: number
  promedio_ticket: number
}
export interface IngresosCanalResponse {
  fecha_inicio: string
  fecha_fin: string
  por_canal: IngresoCanal[]
  totales: IngresoCanal
}

export interface ProduccionLider {
  sede_nombre: string
  lider_nombre: string
  vehiculos: number
  total_bruto: number
  total_neto: number
  turnos_rtm: number
  turnos_soat: number
  turnos_prev: number
  turnos_peri: number
}
export interface ProduccionLiderResponse {
  fecha_inicio: string
  fecha_fin: string
  por_sede: ProduccionLider[]
}

export interface ReporteAsesor {
  agente_id: number
  nombre: string
  canal: string
  vehiculos_directos: number
  vehiculos_convenio: number
  total_vehiculos: number
  total_bruto: number
  total_neto: number
}
export interface ConvenioResumenAPI {
  convenio_nombre: string
  asesores: string
  total_vehiculos: number
  total_bruto: number
  total_neto: number
}
export interface ReporteAsesoresResponse {
  fecha_inicio: string
  fecha_fin: string
  asesores: ReporteAsesor[]
  convenios: ConvenioResumenAPI[]
}

/**
 * `subtotal` solo viene poblado en el detalle por asesor (detalle-asesor);
 * el detalle por canal (detalle-canal) no lo selecciona en el backend.
 * `tipo_vehiculo` es nullable en la tabla `facturacion_tickets`.
 */
export interface DetalleTicket {
  placa: string
  fecha: string
  total: number
  subtotal?: number
  tipo_vehiculo: string | null
  convenio_nombre: string | null
  agente_comercial_nombre?: string | null
  asesor_convenio_nombre?: string | null
  cliente_nombre?: string | null
  cliente_documento?: string | null
}

export interface DetalleAsesorResponse {
  agente_id: number
  nombre: string
  canal: string
  total_vehiculos: number
  total_bruto: number
  detalle: DetalleTicket[]
}

export interface DetalleCanalResponse {
  canal: string
  total_vehiculos: number
  total_bruto: number
  detalle: DetalleTicket[]
}

export interface ResumenRetencion {
  cantidad: number
  total_bruto: number
  porcentaje: number
}

export interface RetencionPorCanal {
  canal: string
  nuevos: number
  recurrentes: number
  recuperaciones: number
  total: number
  total_bruto: number
}

export interface RetencionPorMes {
  mes: string
  nuevos: number
  recurrentes: number
  recuperaciones: number
  total: number
}

export interface RetencionResponse {
  fecha_inicio: string
  fecha_fin: string
  meses_minimos: number
  resumen: {
    nuevos: ResumenRetencion
    recurrentes: ResumenRetencion
    recuperaciones: ResumenRetencion
    total: { cantidad: number; total_bruto: number }
  }
  por_canal: RetencionPorCanal[]
  por_mes: RetencionPorMes[]
}

/**
 * `asesor_convenio_nombre` no está en la especificación original del backend,
 * pero el endpoint sí lo devuelve (se necesita para la columna "Asesor/Convenio"
 * cuando el canal es ASESOR_CONVENIO, igual que en detalle-canal/detalle-asesor).
 */
export interface DetalleRetencionTicket {
  placa: string
  fecha: string
  tipo_vehiculo: string | null
  total: number
  captacion_canal: string
  agente_comercial_nombre: string | null
  asesor_convenio_nombre?: string | null
  convenio_nombre: string | null
  meses_desde_ultima_visita: number | null
  cliente_nombre: string | null
  cliente_documento: string | null
}

export interface DetalleRetencionResponse {
  categoria: string
  canal: string
  total_vehiculos: number
  total_bruto: number
  detalle: DetalleRetencionTicket[]
}

/* ============================ Helpers de fecha ============================ */

/** Formatea un Date a 'YYYY-MM-DD' */
export function formatFecha(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Devuelve { inicio, fin } del mes actual en formato 'YYYY-MM-DD' */
export function getRangoMesActual(): { inicio: string; fin: string } {
  const now = new Date()
  const primerDia = new Date(now.getFullYear(), now.getMonth(), 1)
  const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { inicio: formatFecha(primerDia), fin: formatFecha(ultimoDia) }
}

/* ============================ Funciones ============================ */

export async function getIngresosPorCanal(
  fechaInicio: string,
  fechaFin: string
): Promise<IngresosCanalResponse> {
  return apiFetch<IngresosCanalResponse>('/reportes-admin/ingresos-canal', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
}

export async function getProduccionPorLider(
  fechaInicio: string,
  fechaFin: string
): Promise<ProduccionLiderResponse> {
  return apiFetch<ProduccionLiderResponse>('/reportes-admin/produccion-lider', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
}

export async function getReporteAsesores(
  fechaInicio: string,
  fechaFin: string
): Promise<ReporteAsesoresResponse> {
  return apiFetch<ReporteAsesoresResponse>('/reportes-admin/asesores', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
}

export async function getDetalleAsesor(
  fechaInicio: string,
  fechaFin: string,
  agenteId: number,
  canal: string
): Promise<DetalleAsesorResponse> {
  return apiFetch<DetalleAsesorResponse>('/reportes-admin/detalle-asesor', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, agente_id: agenteId, canal },
  })
}

export async function getDetalleCanal(
  fechaInicio: string,
  fechaFin: string,
  canal: string
): Promise<DetalleCanalResponse> {
  return apiFetch<DetalleCanalResponse>('/reportes-admin/detalle-canal', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, canal },
  })
}

export async function getRetencionClientes(
  fechaInicio: string,
  fechaFin: string
): Promise<RetencionResponse> {
  return apiFetch<RetencionResponse>('/reportes-admin/retencion', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
}

export async function getDetalleRetencion(
  fechaInicio: string,
  fechaFin: string,
  categoria: string,
  canal?: string
): Promise<DetalleRetencionResponse> {
  return apiFetch<DetalleRetencionResponse>('/reportes-admin/detalle-retencion', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, categoria, canal },
  })
}

export interface ReporteServicioDetalle {
  codigo_servicio: string
  nombre_servicio: string
  tipo_vehiculo: string
  turnos: number
  valor_unitario: number
  total_generado: number
  total_neto: number
}

export interface ReporteServiciosResponse {
  fecha_inicio: string
  fecha_fin: string
  detalle: ReporteServicioDetalle[]
  totales: {
    turnos: number
    total_generado: number
    total_neto: number
  }
}

export async function getReporteServicios(
  fechaInicio: string,
  fechaFin: string
): Promise<ReporteServiciosResponse> {
  return apiFetch<ReporteServiciosResponse>('/reportes-admin/servicios', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
}

/* ======================= Reporte de descuentos ======================= */

export interface TotalesDescuentos {
  cantidad: number
  total_descuentos: number
}

export interface DescuentoPorTipo {
  codigo: string
  nombre: string
  cantidad: number
  total_descuentos: number
  promedio: number
}
export interface DescuentosPorTipoResponse {
  fecha_inicio: string
  fecha_fin: string
  por_tipo: DescuentoPorTipo[]
  totales: TotalesDescuentos
}

export interface DescuentoPorCanal {
  canal: string
  cantidad: number
  total_descuentos: number
  tipos_usados: number
}
export interface DescuentosPorCanalResponse {
  fecha_inicio: string
  fecha_fin: string
  por_canal: DescuentoPorCanal[]
  totales: TotalesDescuentos
}

export interface DescuentoPorAutorizador {
  usuario_id: number
  nombre: string
  cantidad: number
  total_descuentos: number
}
export interface DescuentosPorAutorizadorResponse {
  fecha_inicio: string
  fecha_fin: string
  por_autorizador: DescuentoPorAutorizador[]
  totales: TotalesDescuentos
}

export async function getDescuentosPorTipo(
  fechaInicio: string,
  fechaFin: string
): Promise<DescuentosPorTipoResponse> {
  return apiFetch<DescuentosPorTipoResponse>('/reportes-admin/descuentos-por-tipo', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
}

export async function getDescuentosPorCanal(
  fechaInicio: string,
  fechaFin: string
): Promise<DescuentosPorCanalResponse> {
  return apiFetch<DescuentosPorCanalResponse>('/reportes-admin/descuentos-por-canal', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
}

export async function getDescuentosPorAutorizador(
  fechaInicio: string,
  fechaFin: string
): Promise<DescuentosPorAutorizadorResponse> {
  return apiFetch<DescuentosPorAutorizadorResponse>('/reportes-admin/descuentos-por-autorizador', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
}

export interface DetalleDescuento {
  placa: string
  fecha: string
  captacion_canal: string
  tipo_vehiculo: string | null
  total: number
  total_sin_descuento: number
  descuento_monto_aplicado: number
  descuento_codigo: string
  descuento_nombre: string
  agente_comercial_nombre: string | null
  asesor_convenio_nombre: string | null
  convenio_nombre: string | null
  autorizador_nombre: string | null
  cliente_nombre: string | null
  cliente_documento: string | null
}

export interface DetalleDescuentosResponse {
  filtros: { tipo: string | null; canal: string | null }
  total_vehiculos: number
  total_descuentos: number
  detalle: DetalleDescuento[]
}

export async function getDetalleDescuentos(
  fechaInicio: string,
  fechaFin: string,
  tipo?: string,
  canal?: string
): Promise<DetalleDescuentosResponse> {
  return apiFetch<DetalleDescuentosResponse>('/reportes-admin/detalle-descuentos', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, tipo, canal },
  })
}

/* ======================= Reporte de comisiones y pagos ======================= */

export interface ComisionComercial {
  asesor_id: number
  asesor_nombre: string
  cantidad_vehiculos: number
  total_asesor: number
  estados: string
}

export interface ComisionAsesorConvenio {
  asesor_id: number
  asesor_nombre: string
  convenio_nombre: string | null
  cantidad_vehiculos: number
  total_asesor: number
  total_convenio: number
  total_comision: number
  estados: string
}

export interface ComisionConvenio {
  convenio_id: number
  convenio_nombre: string
  asesor_comercial_nombre: string
  cantidad_vehiculos: number
  total_convenio: number
  estados: string
}

export interface ComisionesResponse {
  fecha_inicio: string
  fecha_fin: string
  resumen: {
    total_comisiones: number
    total_monto: number
    por_estado: {
      PENDIENTE: { cantidad: number; monto: number }
      APROBADA: { cantidad: number; monto: number }
      PAGADA: { cantidad: number; monto: number }
      ANULADA: { cantidad: number; monto: number }
    }
  }
  comerciales: ComisionComercial[]
  asesores_convenio: ComisionAsesorConvenio[]
  convenios: ComisionConvenio[]
}

export interface DetalleComisionItem {
  placa: string
  fecha: string
  asesor_nombre: string
  estado: string
  monto_asesor: number
  monto_convenio: number
  total_comision: number
  convenio_nombre: string | null
  tipo_cliente: string | null
  pagado_at: string | null
  cliente_nombre: string | null
  cliente_documento: string | null
}

export interface DetalleComisionesResponse {
  asesor_id: number | null
  asesor_nombre: string | null
  convenio_id: number | null
  convenio_nombre: string | null
  total_vehiculos: number
  total_asesor: number
  total_convenio: number
  total_comision: number
  detalle: DetalleComisionItem[]
}

export async function getReporteComisiones(
  fechaInicio: string,
  fechaFin: string,
  estado?: string
): Promise<ComisionesResponse> {
  return apiFetch<ComisionesResponse>('/reportes-admin/comisiones', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, estado },
  })
}

export async function getDetalleComisiones(
  fechaInicio: string,
  fechaFin: string,
  asesorId: number,
  estado?: string
): Promise<DetalleComisionesResponse> {
  return apiFetch<DetalleComisionesResponse>('/reportes-admin/detalle-comisiones', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, asesor_id: asesorId, estado },
  })
}

export async function getDetalleComisionesPorConvenio(
  fechaInicio: string,
  fechaFin: string,
  convenioId: number
): Promise<DetalleComisionesResponse> {
  return apiFetch<DetalleComisionesResponse>('/reportes-admin/detalle-comisiones', {
    query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, convenio_id: convenioId },
  })
}

/* ======================= Reporte Meta Mensual ======================= */

export type FuenteMetaMensual = 'real' | 'historico' | 'sin_datos'
export type SemaforoColor = 'VERDE' | 'AMARILLO' | 'ROJO' | 'SIN_META'

export interface MetaMensualConfig {
  mes: number
  anio: number
  meta_livianos: number
  meta_motos: number
  meta_total: number
  pct_crecimiento_referencia: number
}

export interface MetaMensualKpi {
  meta: number
  avance: number
  pct_avance: number | null
  proyeccion_cierre: number
  pct_proyeccion: number | null
}

export interface MetaMensualResumenResponse {
  mes: number
  anio: number
  fuente_datos: FuenteMetaMensual
  dias_transcurridos: number
  dias_del_mes: number
  kpis: {
    total_general: MetaMensualKpi
    livianos: MetaMensualKpi
    motos: MetaMensualKpi
  }
  semaforo: {
    general: SemaforoColor
    diario: SemaforoColor
    semanal: SemaforoColor
    meta: SemaforoColor
    proyectado: SemaforoColor
  }
}

export interface MetaMensualDiarioDia {
  fecha: string
  livianos: number
  motos: number
  total: number
  acumulado_livianos: number
  acumulado_motos: number
  acumulado_total: number
  pct_vs_meta: number | null
  total_anio_anterior: number | null
  diferencia_vs_anio_anterior: number | null
}

export interface MetaMensualDiarioResponse {
  mes: number
  anio: number
  fuente_datos: FuenteMetaMensual
  fuente_datos_anio_anterior: FuenteMetaMensual
  meta_total: number
  dias: MetaMensualDiarioDia[]
}

export interface MetaMensualSemana {
  inicio: string
  fin: string
  livianos: number
  motos: number
  total: number
  pct_livianos: number | null
  pct_motos: number | null
}

export interface MetaMensualSemanalResponse {
  mes: number
  anio: number
  fuente_datos: FuenteMetaMensual
  meta_livianos: number
  meta_motos: number
  meta_total: number
  semanas: MetaMensualSemana[]
}

export interface MetaMensualProyectadoDia {
  fecha: string
  acumulado_livianos: number
  acumulado_motos: number
  promedio_diario_livianos: number
  promedio_diario_motos: number
  proyeccion_cierre_livianos: number
  proyeccion_cierre_motos: number
  proyeccion_cierre_total: number
}

export interface MetaMensualProyectadoResponse {
  mes: number
  anio: number
  fuente_datos: FuenteMetaMensual
  dias_transcurridos: number
  dias_del_mes: number
  meta_livianos: number
  meta_motos: number
  meta_total: number
  resumen: {
    promedio_diario_livianos: number
    promedio_diario_motos: number
    proyeccion_cierre_livianos: number
    proyeccion_cierre_motos: number
    proyeccion_cierre_total: number
    pct_proyeccion_total: number | null
  } | null
  dias: MetaMensualProyectadoDia[]
}

export async function getMetaMensualConfig(
  mes: number,
  anio: number
): Promise<MetaMensualConfig> {
  return apiFetch<MetaMensualConfig>('/reportes-admin/meta-mensual/config', {
    query: { mes, anio },
  })
}

export async function putMetaMensualConfig(payload: {
  mes: number
  anio: number
  meta_livianos: number
  meta_motos: number
  pct_crecimiento_referencia: number
}): Promise<MetaMensualConfig> {
  return apiFetch<MetaMensualConfig>('/reportes-admin/meta-mensual/config', {
    method: 'POST',
    body: payload,
  })
}

export async function getMetaMensualResumen(
  mes: number,
  anio: number
): Promise<MetaMensualResumenResponse> {
  return apiFetch<MetaMensualResumenResponse>('/reportes-admin/meta-mensual/resumen', {
    query: { mes, anio },
  })
}

export async function getMetaMensualDiario(
  mes: number,
  anio: number
): Promise<MetaMensualDiarioResponse> {
  return apiFetch<MetaMensualDiarioResponse>('/reportes-admin/meta-mensual/diario', {
    query: { mes, anio },
  })
}

export async function getMetaMensualSemanal(
  mes: number,
  anio: number
): Promise<MetaMensualSemanalResponse> {
  return apiFetch<MetaMensualSemanalResponse>('/reportes-admin/meta-mensual/semanal', {
    query: { mes, anio },
  })
}

export async function getMetaMensualProyectado(
  mes: number,
  anio: number
): Promise<MetaMensualProyectadoResponse> {
  return apiFetch<MetaMensualProyectadoResponse>('/reportes-admin/meta-mensual/proyectado', {
    query: { mes, anio },
  })
}

/* ======================= Meta Comercial por Asesor ======================= */
// Pesos ESTIMADOS con tarifa plana para meses históricos (antes de agosto/2026,
// ver nota del backend) — no es cálculo de nómina, solo comparación vs. meta.

export type FuenteMetaComercial = 'real' | 'historico'
export type FuenteMetaComercialDiario = 'real' | 'historico_sin_detalle_diario'

export interface MetaComercialAsesorResumen {
  asesor_id: number
  asesor_nombre: string
  fuente: FuenteMetaComercial
  es_estimado: boolean
  cantidad_convenio: number | null
  cantidad_comercial: number | null
  pesos_convenio: number
  pesos_comercial: number
  pesos_total: number
  meta_pesos: number | null
  pct_avance: number | null
  semaforo: SemaforoColor
}

export interface MetaComercialResumenResponse {
  mes: number
  anio: number
  fuente: FuenteMetaComercial
  nota: string | null
  asesores: MetaComercialAsesorResumen[]
}

export interface MetaComercialDiarioDia {
  fecha: string
  pesos_convenio: number
  pesos_comercial: number
  pesos_total: number
  acumulado_convenio: number
  acumulado_comercial: number
  acumulado_total: number
  pct_vs_meta: number | null
}

export interface MetaComercialDiarioResponse {
  mes: number
  anio: number
  asesor_id: number | null
  asesor_nombre: string | null
  fuente: FuenteMetaComercialDiario
  nota: string | null
  meta_pesos: number | null
  dias: MetaComercialDiarioDia[]
}

export interface MetaComercialSemana {
  inicio: string
  fin: string
  cantidad_convenio: number | null
  cantidad_comercial: number | null
  pesos_convenio: number
  pesos_comercial: number
  pesos_total: number
  pct_vs_meta: number | null
}

export interface MetaComercialSemanalResponse {
  mes: number
  anio: number
  asesor_id: number | null
  asesor_nombre: string | null
  fuente: FuenteMetaComercial
  es_estimado: boolean
  meta_pesos: number | null
  semanas: MetaComercialSemana[]
}

export interface MetaComercialProyectadoPeriodo {
  etiqueta: string
  acumulado: number
  promedio: number
  proyeccion: number
}

export interface MetaComercialProyectadoResponse {
  mes: number
  anio: number
  asesor_id: number | null
  asesor_nombre: string | null
  fuente: FuenteMetaComercial
  granularidad: 'diaria' | 'semanal'
  es_estimado?: boolean
  nota?: string | null
  meta_pesos: number | null
  periodos_transcurridos: number
  periodos_totales: number
  resumen: {
    promedio_por_periodo: number
    proyeccion_cierre: number
    pct_proyeccion: number | null
  } | null
  periodos: MetaComercialProyectadoPeriodo[]
}

export async function getMetaComercialResumen(
  mes: number,
  anio: number
): Promise<MetaComercialResumenResponse> {
  return apiFetch<MetaComercialResumenResponse>('/reportes-admin/meta-comercial/resumen', {
    query: { mes, anio },
  })
}

export async function getMetaComercialDiario(
  mes: number,
  anio: number,
  asesorId?: number | null
): Promise<MetaComercialDiarioResponse> {
  return apiFetch<MetaComercialDiarioResponse>('/reportes-admin/meta-comercial/diario', {
    query: { mes, anio, asesor_id: asesorId ?? undefined },
  })
}

export async function getMetaComercialSemanal(
  mes: number,
  anio: number,
  asesorId?: number | null
): Promise<MetaComercialSemanalResponse> {
  return apiFetch<MetaComercialSemanalResponse>('/reportes-admin/meta-comercial/semanal', {
    query: { mes, anio, asesor_id: asesorId ?? undefined },
  })
}

export async function getMetaComercialProyectado(
  mes: number,
  anio: number,
  asesorId?: number | null
): Promise<MetaComercialProyectadoResponse> {
  return apiFetch<MetaComercialProyectadoResponse>('/reportes-admin/meta-comercial/proyectado', {
    query: { mes, anio, asesor_id: asesorId ?? undefined },
  })
}
