// src/services/comisionesService.ts
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

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
  opts: { method?: HttpMethod; body?: unknown; query?: Record<string, unknown>; headers?: HeadersInit } = {}
) {
  const url = `${BASE}${endpoint}${buildQuery(opts.query)}`

  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) }

  // 🔐 Usar el MISMO almacenamiento que el http.ts
  const token =
    sessionStorage.getItem('token') || localStorage.getItem('token') // fallback por si algo aún quedó en local
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
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

/* ============================ Tipos (Front/UI) ============================ */

export type ComisionEstado = 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'ANULADA'

export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'INTERNO' | 'EXTERNO' | 'CONVENIO' | string
  medioPago?: string | null
  telefono?: string | null
}

export interface ConvenioLight {
  id: number
  nombre: string
  metodo_pago?: string | null
  numero_metodo_pago?: string | null
}

// 🆕 Ítem de convenio para autocomplete del filtro
export interface ConvenioItem {
  id: number
  nombre: string
}

// 🆕 Ítem de descuento para el filtro
export interface DescuentoItem {
  id: number
  codigo: string
  nombre: string
  valorCarro: number
  valorMoto: number
  activo: boolean
}

// Descuento informativo aplicado en el ticket
export interface DescuentoLight {
  id: number
  codigo: string
  nombre: string
}

// Usuario ligero para trazabilidad (cajero / autorizador)
export interface UsuarioLight {
  id: number
  nombre: string
}

export interface ServicioLight {
  id?: number
  codigo?: string
  nombre?: string
}

export interface TurnoLight {
  id: number
  numero?: string | number
  fecha?: string
  placa?: string
  servicio?: ServicioLight | null

  numero_global?: number | string
  numero_servicio?: number | string

  // Campos de recurrencia (3 estados)
  es_recurrente?: boolean
  es_recuperacion?: boolean
  meses_desde_ultima_visita?: number | null
  ultimo_turno_id?: number | null
  fecha_ultima_visita?: string | null

  rep_general_verificado?: boolean | null

  // Detalle de la visita anterior (solo viene en show(), no en list())
  ultima_visita?: {
    placa: string | null
    conductor_nombre: string | null
    vehiculo_descripcion: string | null
    fecha: string | null
  } | null
}

export interface ComisionListItem {
  base?: number | null
  descuento_monto_aplicado?: number | null
  tiene_desglose?: boolean
  desglose?: Record<string, unknown>[]
  id: number
  /** id del dateo en captacion_dateos (para enganchar con la tabla de dateos) */
  dateo_id?: number

  estado: ComisionEstado
  cantidad: number
  /** Comisión del ASESOR / CONVENIO */
  valor_unitario: number
  /** Comisión placa/cliente/convenio (16k / 20k o valor de base) */
  valor_cliente?: number | null
  /** Suma de asesor + placa */
  valor_total: number

  // ✅ Desglose real de montos (vienen del backend en lista Y en detalle)
  monto_asesor?: number | null
  monto_convenio?: number | null
  es_avance?: boolean | null

  // 🆕 tipo_vehiculo directo de la comisión (MOTO | VEHICULO | null)
  tipo_vehiculo?: 'MOTO' | 'VEHICULO' | null

  generado_at?: string
  asesor?: AgenteLight | null
  convenio?: ConvenioLight | null
  turno?: TurnoLight | null

  // Descuento informativo
  descuento?: DescuentoLight | null
  /** 'dateo' = pre-marcado por el comercial al crear el dateo
   *  'caja'  = aplicado manualmente por el cajero al confirmar el ticket */
 descuento_origen?: 'dateo' | 'caja' | null
  dateo_observacion?: string | null
}

export interface ComisionDetail extends ComisionListItem {
  aprobado_at?: string | null
  pagado_at?: string | null
  anulado_at?: string | null
  observacion?: string | null

  // Trazabilidad completa del descuento informativo
  /** Fecha en que se aplicó el descuento (= ticket.confirmado_at) */
  descuento_aplicado_at?: string | null
  /** Cajero que confirmó el ticket (quien procesó el descuento) */
  descuento_aplicado_por?: UsuarioLight | null
  /** Usuario que autorizó el descuento (solo cuando origen = 'caja') */
  descuento_autorizado_por?: UsuarioLight | null
}

export interface ListParams {
  page?: number
  perPage?: number
  desde?: string  // 'YYYY-MM-DD'
  hasta?: string  // 'YYYY-MM-DD'
  asesorId?: number
  convenioId?: number
  estado?: ComisionEstado | ''
  sortBy?: string
  order?: 'asc' | 'desc'
  tipoVehiculo?: 'MOTO' | 'VEHICULO' | ''
  placa?: string
}

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

/* ==================== Tipos para CONFIG de comisiones ==================== */

/**
 * Tipo de vehículo para las reglas/configuración de comisión
 */
export type TipoVehiculoComision = 'MOTO' | 'VEHICULO'

/**
 * DTO que devuelve el backend para una fila de configuración (es_config = true)
 * desde /api/comisiones/config
 */
export interface ComisionConfig {
  id: number
  es_config: true
  /** asesor o convenio (ambos están en agentes_captacions) */
  asesor_id: number | null
  tipo_vehiculo: TipoVehiculoComision | null
  valor_placa: number
  // incentivos específicos por tipo de vehículo (null = sin configurar, usa valor_placa)
  valor_placa_vehiculo: number | null
  valor_placa_moto: number | null
  valor_dateo: number
  // Dateo cliente nuevo SIN convenio ($17.200) — solo comercial directo
  valor_nuevo_directo: number
  fecha_calculo?: string | null
}

/**
 * Payload que se envía al backend para crear/actualizar una regla
 * vía /api/comisiones/config
 */
export interface ComisionConfigPayload {
  asesor_id?: number | null
  tipo_vehiculo: TipoVehiculoComision
  valor_placa: number
  // incentivos específicos por tipo de vehículo (null = sin configurar, usa valor_placa)
  valor_placa_vehiculo?: number | null
  valor_placa_moto?: number | null
  valor_dateo: number
  // Dateo cliente nuevo SIN convenio ($17.200)
  valor_nuevo_directo: number
}

/* =========== Tipos para Metas mensuales (resumen + config) =========== */

/**
 * Fila de metas mensuales devuelta por el backend.
 * Incluye tanto campos de CONFIG (meta_mensual, porcentaje_extra, valores RTM)
 * como posibles campos de RESUMEN (rtm_motos, rtm_vehiculos, meta_global_rtm, etc.)
 */
export interface MetaMensualRow {
  id?: number
  asesor_id?: number | null
  asesor_nombre?: string | null
  asesor_tipo?: string | null // tipo del agente (COMERCIAL / CONVENIO / etc.)
  mes?: string | null

  // Config meta
  tipo_vehiculo?: TipoVehiculoComision | null
  meta_mensual?: number
  porcentaje_extra?: number
  valor_rtm_moto?: number | null
  valor_rtm_vehiculo?: number | null
  fecha_actualizacion?: string | null

  // Campos de resumen (para la pestaña de metas en Comisiones.vue)
  rtm_motos?: number
  rtm_vehiculos?: number
  meta_rtm?: number | null
  meta_global_rtm?: number | null
  porcentaje_comision_meta?: number | null

  // Totales calculados por el backend (nueva lógica)
  total_rtm_motos?: number
  total_rtm_vehiculos?: number
  total_facturacion_motos?: number
  total_facturacion_vehiculos?: number
  total_facturacion_global?: number
}

/* ================= Helpers de mapeo (backend → UI) ================= */

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? Number(n) : 0
}

function mapServicio(apiServ: unknown): ServicioLight | null {
  if (!apiServ) return null
  const srv = apiServ as Record<string, unknown>
  return {
    id: (srv.id as number) ?? undefined,
    codigo: (srv.codigoServicio ?? srv.codigo) as string ?? undefined,
    nombre: (srv.nombreServicio ?? srv.nombre) as string ?? undefined,
  }
}

function mapTurno(api: unknown): TurnoLight | null {
  if (!api) return null
  const t = api as Record<string, unknown>
  const vehiculo = t.vehiculo as Record<string, unknown> | undefined

  // Mapear ultima_visita si viene del backend (solo en show())
  const ultimaVisitaRaw = t.ultima_visita as Record<string, unknown> | null | undefined
  const ultimaVisita = ultimaVisitaRaw
    ? {
        placa: (ultimaVisitaRaw.placa as string) ?? null,
        conductor_nombre: (ultimaVisitaRaw.conductor_nombre as string) ?? null,
        vehiculo_descripcion: (ultimaVisitaRaw.vehiculo_descripcion as string) ?? null,
        fecha: (ultimaVisitaRaw.fecha as string) ?? null,
      }
    : null

  return {
    id: (t.id ?? t.turno_id ?? t.numero ?? 0) as number,
    numero: (t.numero ?? t.id ?? t.turno_id) as string | number | undefined,
    fecha: (t.fecha ?? t.created_at ?? t.createdAt) as string | undefined,
    placa: (t.placa ?? vehiculo?.placa) as string | undefined,
    servicio: mapServicio(t.servicio),

    numero_global:
      (t.numero_global ?? t.numeroGlobal ?? t.turnoNumero) as number | string | undefined,
    numero_servicio:
      (t.numero_servicio ??
      t.numeroServicio ??
      t.turnoNumeroServicio ??
      t.turno_numero_servicio) as number | string | undefined,

    // Mapeo de campos de recurrencia (3 estados)
    es_recurrente: t.es_recurrente != null ? Boolean(t.es_recurrente) : undefined,
    es_recuperacion: t.es_recuperacion != null ? Boolean(t.es_recuperacion) : undefined,
    meses_desde_ultima_visita: t.meses_desde_ultima_visita != null ? Number(t.meses_desde_ultima_visita) : null,
    ultimo_turno_id: t.ultimo_turno_id != null ? Number(t.ultimo_turno_id) : null,
    fecha_ultima_visita: (t.fecha_ultima_visita as string) ?? null,
rep_general_verificado: t.rep_general_verificado != null
      ? Boolean(t.rep_general_verificado)
      : t.repGeneralVerificado != null
      ? Boolean(t.repGeneralVerificado)
      : false,
    // Detalle de la visita anterior
    ultima_visita: ultimaVisita,
  }
}

function mapAsesor(api: unknown): AgenteLight | null {
  if (!api) return null
  const a = api as Record<string, unknown>
  return {
    id: a.id as number,
    nombre: (a.nombre ?? a.nombre_completo ?? '—') as string,
    // dejamos que el backend marque tipo = 'CONVENIO' cuando aplique
    tipo: (a.tipo ?? a.tipo_agente ?? 'INTERNO') as string,
  }
}

function mapConvenio(api: unknown): ConvenioLight | null {
  if (!api) return null
  const c = api as Record<string, unknown>
  return {
    id: c.id as number,
    nombre: c.nombre as string,
    metodo_pago: (c.metodo_pago ?? c.metodoPago ?? null) as string | null,
    numero_metodo_pago: (c.numero_metodo_pago ?? c.numeroMetodoPago ?? null) as string | null,
  }
}

/** Helper para agentes de captación (listados y /me) */
function mapAgenteCaptacion(api: unknown): AgenteLight | null {
  if (!api) return null
  const a = api as Record<string, unknown>
  return {
    id: a.id as number,
    nombre: (a.nombre ?? a.nombre_completo ?? a.nombreCompleto ?? '—') as string,
    tipo: (a.tipo ?? a.tipo_agente ?? a.tipoAgente ?? 'INTERNO') as string,
    // Medio de pago: puede venir como medio_pago, nequi, cuenta_bancaria, etc.
    medioPago: (
      a.medio_pago ?? a.medioPago ??
      a.nequi ?? a.numeroNequi ?? a.numero_nequi ??
      a.cuenta ?? a.cuentaBancaria ?? a.cuenta_bancaria ??
      null
    ) as string | null,
    telefono: (a.telefono ?? a.celular ?? a.phone ?? null) as string | null,
  }
}

// Mapea un usuario ligero (cajero / autorizador)
function mapUsuarioLight(api: unknown): UsuarioLight | null {
  if (!api) return null
  const u = api as Record<string, unknown>
  const nombre = [u.nombres ?? u.nombre, u.apellidos]
    .filter(Boolean)
    .join(' ')
    .trim() || '—'
  return { id: u.id as number, nombre }
}

function mapComisionToListItem(api: unknown): ComisionListItem {
  const a = api as Record<string, unknown>
  // API ya trae valor_unitario (monto asesor), valor_cliente (base convenio) y valor_total
  const valor_unitario = num(a.valor_unitario ?? a.monto ?? 0)
  const valor_cliente = a.valor_cliente != null ? num(a.valor_cliente) : null
  const valor_total =
    a.valor_total !== undefined
      ? num(a.valor_total)
      : valor_unitario + (valor_cliente ?? 0)

  const generado = a.generado_at ?? a.fecha_calculo ?? a.created_at ?? a.createdAt

  const turno = a.turno ? mapTurno(a.turno) : null
  const asesor = a.asesor ?? null
  const convenio = a.convenio ?? null

  const dateoId =
    a.dateo_id ??
    a.captacion_dateo_id ??
    a.captacionDateoId ??
    a.dateoId ??
    null

  // Descuento informativo
  const descuentoRaw = a.descuento ?? a.descuento_info ?? null
  const descuento: DescuentoLight | null = descuentoRaw
    ? (() => {
        const d = descuentoRaw as Record<string, unknown>
        return {
          id: d.id as number,
          codigo: String(d.codigo ?? ''),
          nombre: String(d.nombre ?? ''),
        }
      })()
    : null
  const descuento_origen = (
    a.descuento_origen ?? a.descuentoOrigen ?? null
  ) as 'dateo' | 'caja' | null

  return {
    id: a.id as number,
    dateo_id: dateoId != null ? Number(dateoId) : undefined,

    // 🆕 tipo_vehiculo directo de la comisión
    tipo_vehiculo: (a.tipo_vehiculo ?? a.tipoVehiculo ?? null) as 'MOTO' | 'VEHICULO' | null,

    estado: (a.estado as ComisionEstado) ?? 'PENDIENTE',
    cantidad: num(a.cantidad ?? 1),
    valor_unitario,
    valor_cliente,
    valor_total,

    // FIX: monto_asesor y monto_convenio ahora se mapean en el listado también
    monto_asesor: a.monto_asesor != null
      ? num(a.monto_asesor)
      : a.montoAsesor != null
      ? num(a.montoAsesor)
      : null,
    monto_convenio: a.monto_convenio != null
      ? num(a.monto_convenio)
      : a.montoConvenio != null
      ? num(a.montoConvenio)
      : null,
    es_avance: a.es_avance != null
      ? Boolean(a.es_avance)
      : a.esAvance != null
      ? Boolean(a.esAvance)
      : null,

    // AVANCE: mapear base y descuento_monto_aplicado desde el backend
    base: a.base != null
      ? num(a.base)
      : a.baseIncentivo != null
      ? num(a.baseIncentivo)
      : null,
    descuento_monto_aplicado: a.descuento_monto_aplicado != null
      ? num(a.descuento_monto_aplicado)
      : a.descuentoMontoAplicado != null
      ? num(a.descuentoMontoAplicado)
      : null,

    generado_at: generado ? String(generado) : undefined,
    asesor: asesor
      ? mapAsesor(asesor)
      : a.asesor_id
      ? { id: a.asesor_id as number, nombre: '—', tipo: 'INTERNO' }
      : null,
    convenio: convenio
      ? mapConvenio(convenio)
      : a.convenio_id
      ? { id: a.convenio_id as number, nombre: '—' }
      : null,
    turno,
    descuento,
 descuento_origen,
    dateo_observacion: (a.dateo_observacion ?? a.dateoObservacion ?? null) as string | null,
  }
}

function mapComisionToDetail(api: unknown): ComisionDetail {
  // monto_asesor / monto_convenio / es_avance ya vienen del base (mapComisionToListItem)
  const base = mapComisionToListItem(api)
  const a = api as Record<string, unknown>
  return {
    ...base,
    aprobado_at: (a.aprobado_at as string) ?? null,
    pagado_at: (a.pagado_at as string) ?? null,
    anulado_at: (a.anulado_at as string) ?? null,
    observacion: (a.observacion as string) ?? null,
    // Trazabilidad descuento
    descuento_aplicado_at: (
      a.descuento_aplicado_at ??
      a.ticket_confirmado_at ??
      a.confirmado_at ??
      null
    ) as string | null,
    descuento_aplicado_por: mapUsuarioLight(
      a.descuento_aplicado_por ?? a.confirmed_by ?? a.confirmedBy ?? null
    ),
    descuento_autorizado_por: mapUsuarioLight(
      a.descuento_autorizado_por ?? a.autorizado_por ?? a.autorizadoPor ?? null
    ),
  }
}

/**
 * Mapea una fila de configuración (es_config = true) del backend
 * al tipo ComisionConfig del front.
 */
function mapConfigToUi(api: unknown): ComisionConfig {
  const a = api as Record<string, unknown>
  return {
    id: a.id as number,
    es_config: true,
    asesor_id: (a.asesor_id ?? a.asesorId ?? null) as number | null,
    tipo_vehiculo: (a.tipo_vehiculo ?? a.tipoVehiculo ?? null) as TipoVehiculoComision | null,
    valor_placa: num(a.valor_placa ?? a.base),
    valor_placa_vehiculo: a.valor_placa_vehiculo != null ? num(a.valor_placa_vehiculo) : null,
    valor_placa_moto: a.valor_placa_moto != null ? num(a.valor_placa_moto) : null,
    valor_dateo: num(a.valor_dateo ?? a.monto),
    // nuevo directo
    valor_nuevo_directo: num(a.valor_nuevo_directo ?? a.valorNuevoDirecto ?? 0),
    fecha_calculo:
      (a.fecha_calculo ??
      a.fechaCalculo ??
      a.created_at ??
      a.createdAt ??
      null) as string | null,
  }
}

/** Mapea una fila de meta mensual (config + posible resumen) */
function mapMetaMensual(api: unknown): MetaMensualRow {
  const a = api as Record<string, unknown>
  const rtmMotos =
    a.rtm_motos != null
      ? num(a.rtm_motos)
      : a.rtmMotos != null
      ? num(a.rtmMotos)
      : undefined

  const rtmVehiculos =
    a.rtm_vehiculos != null
      ? num(a.rtm_vehiculos)
      : a.rtmVehiculos != null
      ? num(a.rtmVehiculos)
      : undefined

  return {
    id: a.id as number,
    asesor_id: (a.asesor_id ?? a.asesorId ?? null) as number | null,
    asesor_nombre: (a.asesor_nombre ?? a.asesorNombre ?? null) as string | null,
    asesor_tipo: (a.asesor_tipo ?? a.asesorTipo ?? null) as string | null,
    mes: (a.mes ?? null) as string | null,

    // Config de meta
    tipo_vehiculo: (a.tipo_vehiculo ?? a.tipoVehiculo ?? null) as TipoVehiculoComision | null,
    meta_mensual: num(a.meta_mensual ?? a.metaMensual ?? a.meta_rtm ?? 0),
    porcentaje_extra: num(
      a.porcentaje_extra ??
        a.porcentajeExtra ??
        a.porcentaje_comision_meta ??
        0
    ),
    valor_rtm_moto:
      a.valor_rtm_moto != null
        ? num(a.valor_rtm_moto)
        : a.valorRtmMoto != null
        ? num(a.valorRtmMoto)
        : null,
    valor_rtm_vehiculo:
      a.valor_rtm_vehiculo != null
        ? num(a.valor_rtm_vehiculo)
        : a.valorRtmVehiculo != null
        ? num(a.valorRtmVehiculo)
        : null,
    fecha_actualizacion:
      (a.fecha_actualizacion ??
      a.fechaActualizacion ??
      a.updated_at ??
      a.updatedAt ??
      a.created_at ??
      a.createdAt ??
      null) as string | null,

    // Campos de resumen (cantidades)
    rtm_motos: rtmMotos,
    rtm_vehiculos: rtmVehiculos,
    meta_rtm: (a.meta_rtm ?? null) as number | null,
    meta_global_rtm: (a.meta_global_rtm ?? null) as number | null,
    porcentaje_comision_meta:
      (a.porcentaje_comision_meta ?? a.porcentaje_extra ?? null) as number | null,

    // Totales (cantidad y dinero) calculados por el backend
    total_rtm_motos:
      a.total_rtm_motos != null ? num(a.total_rtm_motos) : rtmMotos,
    total_rtm_vehiculos:
      a.total_rtm_vehiculos != null ? num(a.total_rtm_vehiculos) : rtmVehiculos,
    total_facturacion_motos:
      a.total_facturacion_motos != null
        ? num(a.total_facturacion_motos)
        : undefined,
    total_facturacion_vehiculos:
      a.total_facturacion_vehiculos != null
        ? num(a.total_facturacion_vehiculos)
        : undefined,
    total_facturacion_global:
      a.total_facturacion_global != null
        ? num(a.total_facturacion_global)
        : undefined,
  }
}

/* ============================= Funciones ============================= */

/* ===== Comisiones reales ===== */

export async function listComisiones(params: ListParams) {
  const raw = await apiFetch<unknown>('/comisiones', { query: params as Record<string, unknown> })
  const r = raw as Record<string, unknown>

  if (Array.isArray(r?.data)) {
    const mapped = (r.data as unknown[]).map(mapComisionToListItem)
    return {
      data: mapped,
      total: num(r.total ?? (r.meta as Record<string, unknown>)?.total ?? mapped.length),
      page: num(r.page ?? (r.meta as Record<string, unknown>)?.current_page ?? params.page ?? 1),
      perPage: num(r.perPage ?? (r.meta as Record<string, unknown>)?.per_page ?? params.perPage ?? 10),
    } as ListResponse<ComisionListItem>
  } else if (Array.isArray(raw)) {
    const mapped = (raw as unknown[]).map(mapComisionToListItem)
    return {
      data: mapped,
      total: mapped.length,
      page: 1,
      perPage: mapped.length,
    }
  } else {
    const one = mapComisionToListItem(raw)
    return { data: [one], total: 1, page: 1, perPage: 10 }
  }
}

export async function getComision(id: number) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}`)
  return mapComisionToDetail(raw)
}

export async function patchValores(
  id: number,
  payload: { cantidad: number; valor_unitario: number }
) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}/valores`, {
    method: 'PATCH',
    body: payload,
  })
  return mapComisionToDetail(raw)
}

export async function aprobarComision(id: number) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}/aprobar`, {
    method: 'POST',
  })
  return mapComisionToDetail(raw)
}

export async function pagarComision(id: number) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}/pagar`, {
    method: 'POST',
  })
  return mapComisionToDetail(raw)
}

export async function anularComision(id: number) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}/anular`, {
    method: 'POST',
  })
  return mapComisionToDetail(raw)
}

export async function pagarMasivoComisiones(payload: {
  ids: number[]
  accion: 'APROBAR' | 'PAGAR'
  fecha_pago?: string
}): Promise<{ actualizadas: number; ids_actualizadas: number[]; mensaje: string }> {
  return apiFetch('/comisiones/pagar-masivo', {
    method: 'POST',
    body: payload,
  })
}

export interface ResumenAsesorItem {
  asesor_id: number
  asesor_nombre: string
  asesor_tipo: string
  convenio_id: number | null
  convenio_nombre: string | null
  pendientes: number
  aprobadas: number
  pagadas: number
  total_por_pagar: number
  total_pendiente: number
  total_aprobada: number
}

export interface ResumenAsesorResponse {
  tipo: string
  asesores: ResumenAsesorItem[]
}

export async function getResumenPorAsesor(
  tipo: string,
  fechaInicio?: string,
  fechaFin?: string
): Promise<ResumenAsesorResponse> {
  return apiFetch('/comisiones/resumen-por-asesor', {
    query: { tipo, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  })
}

/* ===== Configuración de comisiones (es_config = true) ===== */

/**
 * Lista las reglas de configuración de comisiones
 * GET /api/comisiones/config
 */
export async function listConfigsComision(params?: {
  /** asesor / convenio */
  asesorId?: number
  tipoVehiculo?: TipoVehiculoComision
}) {
  const raw = await apiFetch<{ data: unknown[] }>('/comisiones/config', {
    query: {
      asesorId: params?.asesorId,
      tipoVehiculo: params?.tipoVehiculo,
    } as Record<string, unknown>,
  })

  const rows = Array.isArray(raw?.data) ? raw.data : []
  return rows.map(mapConfigToUi)
}

/**
 * Crea o actualiza (upsert) una regla:
 *  - combinación (asesor_id, tipo_vehiculo)
 * POST /api/comisiones/config
 */
export async function upsertConfigComision(payload: ComisionConfigPayload) {
  const raw = await apiFetch<unknown>('/comisiones/config', {
    method: 'POST',
    body: payload,
  })
  return mapConfigToUi(raw)
}

/**
 * Actualiza una regla existente por id
 * PATCH /api/comisiones/config/:id
 */
export async function updateConfigComision(
  id: number,
  payload: Partial<ComisionConfigPayload>
) {
  const raw = await apiFetch<unknown>(`/comisiones/config/${id}`, {
    method: 'PATCH',
    body: payload,
  })
  return mapConfigToUi(raw)
}

/**
 * Elimina una regla de configuración
 * DELETE /api/comisiones/config/:id
 */
export async function deleteConfigComision(id: number) {
  await apiFetch<unknown>(`/comisiones/config/${id}`, {
    method: 'DELETE',
  })
}

/* ===== Catálogo de agentes (asesores + convenios) ===== */

export async function listAgentesCaptacion(): Promise<AgenteLight[]> {
  const res = await apiFetch<{ data?: unknown[] }>(
    '/agentes-captacion/light',
    { query: { activos: 1, select: 'id,nombre,tipo' } }
  )
  const rows = Array.isArray(res?.data) ? res.data : []
  return rows.map(mapAgenteCaptacion).filter((a): a is AgenteLight => !!a)
}

// 🆕 Lista convenios para el autocomplete del filtro de convenio
export async function listConvenios(): Promise<ConvenioItem[]> {
  try {
    const raw = await apiFetch<{ data?: unknown[] } | unknown[]>('/convenios', {
      query: { perPage: 200, activos: 1 },
    })
    const r = raw as Record<string, unknown>
    const rows: unknown[] = Array.isArray(r?.data)
      ? r.data
      : Array.isArray(raw)
      ? raw as unknown[]
      : []
    return rows.map((row) => {
      const a = row as Record<string, unknown>
      return { id: a.id as number, nombre: String(a.nombre ?? '—') }
    })
  } catch (err) {
    console.error('Error cargando convenios:', err)
    return []
  }
}

// 🆕 Lista descuentos activos para el filtro de descuento
export async function listDescuentos(): Promise<DescuentoItem[]> {
  try {
    const raw = await apiFetch<{ data?: unknown[] } | unknown[]>('/descuentos', {
      query: { activos: 1, perPage: 100 },
    })
    const r = raw as Record<string, unknown>
    const rows: unknown[] = Array.isArray(r?.data)
      ? r.data
      : Array.isArray(raw)
      ? raw as unknown[]
      : []
    return rows.map((row) => {
      const a = row as Record<string, unknown>
      return {
        id: a.id as number,
        codigo: String(a.codigo ?? ''),
        nombre: String(a.nombre ?? '—'),
        valorCarro: Number(a.valor_carro ?? a.valorCarro ?? 0),
        valorMoto: Number(a.valor_moto ?? a.valorMoto ?? 0),
        activo: Boolean(a.activo ?? true),
      }
    })
  } catch (err) {
    console.error('Error cargando descuentos:', err)
    return []
  }
}

/* ===== Metas mensuales de asesores ===== */

/**
 * LISTADO:
 *
 * - Si envías `mes`: usa GET /api/comisiones/metas-mensuales (RESUMEN por mes).
 * - Si NO envías `mes`: usa GET /api/comisiones/metas (CONFIG de metas).
 *
 * En ambos casos devuelve un array de MetaMensualRow y también cuelga `.data`
 * para compatibilidad con las dos vistas:
 *  - Comisiones.vue        → usa `res.data`
 *  - ComisionesConfig.vue  → usa el array directamente
 */
export async function listMetasMensuales(params?: {
  asesorId?: number
  mes?: string
}) {
  const hasMes = !!params?.mes

  const endpoint = hasMes ? '/comisiones/metas-mensuales' : '/comisiones/metas'

  const raw = await apiFetch<{ data?: unknown[] } | unknown[]>(endpoint, {
    query: hasMes
      ? {
          asesorId: params?.asesorId,
          mes: params?.mes,
        }
      : {
          asesorId: params?.asesorId,
        },
  })

  const rawObj = raw as Record<string, unknown>
  const rowsRaw = Array.isArray(rawObj?.data)
    ? rawObj.data
    : Array.isArray(raw)
    ? raw as unknown[]
    : []

  const mapped = rowsRaw.map(mapMetaMensual)

  const arr: MetaMensualRow[] & { data: MetaMensualRow[] } = mapped as MetaMensualRow[] & { data: MetaMensualRow[] }
  arr.data = mapped // compatibilidad para la otra vista
  return arr
}

/**
 * Crea o actualiza (upsert) una meta mensual para un asesor.
 * POST /api/comisiones/metas
 */
export async function upsertMetaMensual(payload: {
  asesor_id: number
  tipo_vehiculo: TipoVehiculoComision | null
  meta_mensual: number
  porcentaje_extra: number
  valor_rtm_moto?: number
  valor_rtm_vehiculo?: number
}) {
  const raw = await apiFetch<unknown>('/comisiones/metas', {
    method: 'POST',
    body: payload,
  })
  return mapMetaMensual(raw)
}

/**
 * Actualiza una meta mensual existente por id.
 * PATCH /api/comisiones/metas/:id
 */
export async function updateMetaMensual(
  id: number,
  payload: Partial<{
    asesor_id: number
    tipo_vehiculo: TipoVehiculoComision | null
    meta_mensual: number
    porcentaje_extra: number
    valor_rtm_moto?: number
    valor_rtm_vehiculo?: number
  }>
) {
  const raw = await apiFetch<unknown>(`/comisiones/metas/${id}`, {
    method: 'PATCH',
    body: payload,
  })
  return mapMetaMensual(raw)
}

/**
 * Elimina una meta mensual.
 * DELETE /api/comisiones/metas/:id
 */
export async function deleteMetaMensual(id: number) {
  await apiFetch<unknown>(`/comisiones/metas/${id}`, {
    method: 'DELETE',
  })
}

/* ===== Configuración de Recurrencias ===== */

// CAMBIO 1: interfaz actualizada con los 4 campos nuevos (nullable = opcionales)
export interface ConfigRecurrenciaGlobal {
  meses_minimos: number
  valor_dateo_recurrencia: number
  valor_dateo_recuperacion: number
  valor_dateo_recurrencia_vehiculo?: number | null
  valor_dateo_recurrencia_moto?: number | null
  valor_dateo_recuperacion_vehiculo?: number | null
  valor_dateo_recuperacion_moto?: number | null
}

export interface ConfigRecurrenciaAsesor {
  id: number
  asesor_id: number
  asesor_nombre: string | null
  recurrencia_habilitada: boolean
  meses_minimos: number | null
  valor_dateo_recurrencia: number | null
  valor_dateo_recuperacion: number | null
  tipo_vehiculo: 'MOTO' | 'VEHICULO' | 'AMBOS'
}

export interface ConfigRecurrenciaAsesorPayload {
  asesor_id: number
  recurrencia_habilitada: boolean
  meses_minimos?: number | null
  valor_dateo_recurrencia?: number | null
  valor_dateo_recuperacion?: number | null
  tipo_vehiculo: 'MOTO' | 'VEHICULO' | 'AMBOS'
}

/**
 * GET /api/comisiones/recurrencia/config/global
 */
// CAMBIO 2: mapea los 4 campos nuevos desde el backend
export async function getConfigRecurrenciaGlobal(): Promise<ConfigRecurrenciaGlobal> {
  const raw = await apiFetch<unknown>('/comisiones/recurrencia/config/global')
  const r = raw as Record<string, unknown>
  return {
    meses_minimos: Number(r.meses_minimos ?? 24),
    valor_dateo_recurrencia: Number(r.valor_dateo_recurrencia ?? 4300),
    valor_dateo_recuperacion: Number(r.valor_dateo_recuperacion ?? 8600),
    valor_dateo_recurrencia_vehiculo:
      r.valor_dateo_recurrencia_vehiculo != null
        ? Number(r.valor_dateo_recurrencia_vehiculo)
        : null,
    valor_dateo_recurrencia_moto:
      r.valor_dateo_recurrencia_moto != null
        ? Number(r.valor_dateo_recurrencia_moto)
        : null,
    valor_dateo_recuperacion_vehiculo:
      r.valor_dateo_recuperacion_vehiculo != null
        ? Number(r.valor_dateo_recuperacion_vehiculo)
        : null,
    valor_dateo_recuperacion_moto:
      r.valor_dateo_recuperacion_moto != null
        ? Number(r.valor_dateo_recuperacion_moto)
        : null,
  }
}

/**
 * POST /api/comisiones/recurrencia/config/global
 */
// CAMBIO 3: acepta y retorna los 4 campos nuevos
export async function updateConfigRecurrenciaGlobal(
  payload: ConfigRecurrenciaGlobal
): Promise<ConfigRecurrenciaGlobal> {
  const raw = await apiFetch<unknown>('/comisiones/recurrencia/config/global', {
    method: 'POST',
    body: payload,
  })
  const r = raw as Record<string, unknown>
  return {
    meses_minimos: Number(r.meses_minimos ?? 24),
    valor_dateo_recurrencia: Number(r.valor_dateo_recurrencia ?? 4300),
    valor_dateo_recuperacion: Number(r.valor_dateo_recuperacion ?? 8600),
    valor_dateo_recurrencia_vehiculo:
      r.valor_dateo_recurrencia_vehiculo != null
        ? Number(r.valor_dateo_recurrencia_vehiculo)
        : null,
    valor_dateo_recurrencia_moto:
      r.valor_dateo_recurrencia_moto != null
        ? Number(r.valor_dateo_recurrencia_moto)
        : null,
    valor_dateo_recuperacion_vehiculo:
      r.valor_dateo_recuperacion_vehiculo != null
        ? Number(r.valor_dateo_recuperacion_vehiculo)
        : null,
    valor_dateo_recuperacion_moto:
      r.valor_dateo_recuperacion_moto != null
        ? Number(r.valor_dateo_recuperacion_moto)
        : null,
  }
}

/**
 * GET /api/comisiones/recurrencia/config/asesores
 */
export async function listConfigRecurrenciaAsesores(params?: { asesorId?: number }) {
  const raw = await apiFetch<{ data: unknown[] }>('/comisiones/recurrencia/config/asesores', {
    query: params as Record<string, unknown>,
  })
  const rows = Array.isArray(raw?.data) ? raw.data : []
  return rows.map((r) => {
    const a = r as Record<string, unknown>
    return {
      id: a.id as number,
      asesor_id: a.asesor_id as number,
      asesor_nombre: (a.asesor_nombre ?? null) as string | null,
      recurrencia_habilitada: Boolean(a.recurrencia_habilitada),
      meses_minimos: (a.meses_minimos ?? null) as number | null,
      valor_dateo_recurrencia: (a.valor_dateo_recurrencia ?? null) as number | null,
      valor_dateo_recuperacion: (a.valor_dateo_recuperacion ?? null) as number | null,
      tipo_vehiculo: (a.tipo_vehiculo ?? 'AMBOS') as 'MOTO' | 'VEHICULO' | 'AMBOS',
    }
  })
}

/**
 * POST /api/comisiones/recurrencia/config/asesores
 */
export async function upsertConfigRecurrenciaAsesor(payload: ConfigRecurrenciaAsesorPayload) {
  const raw = await apiFetch<unknown>('/comisiones/recurrencia/config/asesores', {
    method: 'POST',
    body: payload,
  })
  const r = raw as Record<string, unknown>
  return {
    id: r.id as number,
    asesor_id: r.asesor_id as number,
    asesor_nombre: (r.asesor_nombre ?? null) as string | null,
    recurrencia_habilitada: Boolean(r.recurrencia_habilitada),
    meses_minimos: (r.meses_minimos ?? null) as number | null,
    valor_dateo_recurrencia: (r.valor_dateo_recurrencia ?? null) as number | null,
    valor_dateo_recuperacion: (r.valor_dateo_recuperacion ?? null) as number | null,
    tipo_vehiculo: (r.tipo_vehiculo ?? 'AMBOS') as 'MOTO' | 'VEHICULO' | 'AMBOS',
  }
}

/**
 * DELETE /api/comisiones/recurrencia/config/asesores/:id
 */
export async function deleteConfigRecurrenciaAsesor(id: number) {
  await apiFetch<unknown>(`/comisiones/recurrencia/config/asesores/${id}`, {
    method: 'DELETE',
  })
}

/* ========================= Helpers generales ========================= */
export async function patchComisionEditar(
  id: number,
  payload: {
    asesor_id?: number | null
    convenio_id?: number | null
    monto_asesor?: number | null
    monto_convenio?: number | null
    tipo_cliente?: 'NUEVO' | 'RECURRENTE' | 'RECUPERACION' | null
    descuento_id?: number | null
    dateo_observacion?: string | null
  }
) {
  const raw = await apiFetch<unknown>(`/comisiones/${id}/editar`, {
    method: 'PATCH',
    body: payload,
  })
  return mapComisionToDetail(raw)
}
export async function listConveniosDeAsesor(asesorId: number): Promise<{ id: number; nombre: string }[]> {
  try {
    const raw = await apiFetch<{ data?: unknown[] } | unknown[]>(
      `/agentes-captacion/${asesorId}/convenios`
    )
    const r = raw as Record<string, unknown>
    const rows: unknown[] = Array.isArray(r?.data) ? r.data : Array.isArray(raw) ? (raw as unknown[]) : []
    return rows.map((row) => {
      const a = row as Record<string, unknown>
      const convenio = (a.convenio ?? a) as Record<string, unknown>
      return { id: convenio.id as number, nombre: String(convenio.nombre ?? '—') }
    })
  } catch {
    return []
  }
}
export interface TurnoParaComision {
  id: number
  turnoNumero?: number | null
  turno_numero?: number | null
  placa: string
  tipoVehiculo?: string
  tipo_vehiculo?: string
  fecha: string
  estado: string
  servicio?: { id?: number; codigoServicio?: string; codigo_servicio?: string } | null
  captacionDateoId?: number | null
  captacion_dateo_id?: number | null
  esRecurrente?: boolean
  esRecuperacion?: boolean
  es_recurrente?: boolean
  es_recuperacion?: boolean
}

export async function buscarTurnosParaComision(params: {
  placa?: string
  fechaInicio?: string
  fechaFin?: string
}): Promise<TurnoParaComision[]> {
  try {
    const res = await apiFetch<unknown>('/turnos-rtm', {
      query: {
        perPage: 30,
        ...(params.placa ? { placa: params.placa } : {}),
        ...(params.fechaInicio ? { fechaInicio: params.fechaInicio } : {}),
        ...(params.fechaFin ? { fechaFin: params.fechaFin } : {}),
      },
    })
    return Array.isArray(res) ? (res as TurnoParaComision[]) : []
  } catch {
    return []
  }
}

export async function createComision(payload: {
  turno_id: number
  asesor_id?: number | null
  convenio_id?: number | null
  monto_asesor: number
  monto_convenio: number
  tipo_cliente?: 'NUEVO' | 'RECURRENTE' | 'RECUPERACION'
  descuento_id?: number | null
  dateo_observacion?: string | null
  es_avance?: boolean
}): Promise<ComisionDetail> {
  const raw = await apiFetch<unknown>('/comisiones', {
    method: 'POST',
    body: payload,
  })
  return mapComisionToDetail(raw)
}
export function formatCOP(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}
