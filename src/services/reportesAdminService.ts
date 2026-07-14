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
  opts: { query?: Record<string, unknown> } = {}
) {
  const url = `${BASE}${endpoint}${buildQuery(opts.query)}`

  const headers: HeadersInit = { 'Content-Type': 'application/json' }

  // 🔐 Usar el MISMO almacenamiento que el http.ts
  const token =
    sessionStorage.getItem('token') || localStorage.getItem('token')
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'GET', headers })

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
