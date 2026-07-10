// src/services/prospectosService.ts
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

/** Fuerza que la URL final quede con UN solo "/api" (ni doble ni ausente) */
function buildUrl(path: string) {
  const baseHasApi = /\/api\/?$/.test(RAW_BASE)
  const p = path.startsWith('/') ? path : `/${path}`
  const pathHasApi = /^\/api(\/|$)/.test(p)

  let finalPath = p
  if (baseHasApi && pathHasApi) finalPath = p.replace(/^\/api/, '')
  if (!baseHasApi && !pathHasApi) finalPath = `/api${p}`

  return `${RAW_BASE}${finalPath}`
}

function buildQuery(params?: Record<string, unknown>) {
  if (!params) return ''
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    q.append(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

/** Bearer desde session/localStorage (solo si existe) */
function getAuthHeader(): HeadersInit {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

async function apiFetch<T>(
  endpoint: string,
  opts: { method?: HttpMethod; body?: unknown; query?: Record<string, unknown>; headers?: HeadersInit } = {},
) {
  const url = `${buildUrl(endpoint)}${buildQuery(opts.query)}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(opts.headers || {}),
  }

  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const errorData = await res.json() as Record<string, unknown>
      msg = (errorData?.message as string) || msg
    } catch {}
    throw new Error(msg)
  }

  // Algunos endpoints pueden devolver 204 (sin cuerpo)
  try { return (await res.json()) as T } catch { return undefined as T }
}

/* ============================
   Tipos
============================ */
export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | 'TELEMERCADEO' | string
}

export interface ConvenioLight {
  id: number
  nombre: string
}

export type EstadoVigencia = 'vigente' | 'vencido' | 'sin_datos'

export interface ProspectoResumenVigencias {
  soat: { estado: EstadoVigencia, vencimiento: string | null, dias_restantes: number | null }
  rtm:  { estado: EstadoVigencia, vencimiento: string | null, dias_restantes: number | null }
  preventiva: { estado: EstadoVigencia, vencimiento: string | null, dias_restantes: number | null }
  peritaje:   { estado: 'sin_datos' | 'registrado', fecha: string | null }
}

export interface Prospecto {
  id: number

  // snake_case (compat vistas)
  placa?: string | null
  telefono?: string | null
  nombre?: string | null
  cedula?: string | null
  observaciones?: string | null
  soat_vigente?: boolean | null
  soat_vencimiento?: string | null
  tecno_vigente?: boolean | null
  tecno_vencimiento?: string | null
  preventiva_vigente?: boolean | null
  preventiva_vencimiento?: string | null
  peritaje_ultima_fecha?: string | null
  convenio_id?: number | null
  creado_por?: number | null
  origen?: 'IMPORT' | 'CAMPO' | 'EVENTO' | 'OTRO'
  created_at?: string | null
  updated_at?: string | null
  archivado?: boolean | null

  // camelCase (por serialize de Adonis)
  convenioId?: number | null
  soatVigente?: boolean | null
  soatVencimiento?: string | null
  tecnoVigente?: boolean | null
  tecnoVencimiento?: string | null
  preventivaVigente?: boolean | null
  preventivaVencimiento?: string | null
  peritajeUltimaFecha?: string | null
  creadoPor?: number | null
  createdAt?: string | null
  updatedAt?: string | null

  // computados (si el backend los expone)
  diasSoatRestantes?: number | null
  diasTecnoRestantes?: number | null
  diasPreventivaRestantes?: number | null
}

export interface Asignacion {
  id: number
  prospecto_id: number
  asesor: AgenteLight
  asignado_por?: string | number | null
  fecha_asignacion: string | null
  fecha_fin?: string | null
  motivo_fin?: string | null
  activo: boolean
}

export interface ProspectoDetail extends Prospecto {
  asignacion_activa?: Asignacion | null
  historial_asignaciones?: Asignacion[]
  resumenVigencias?: ProspectoResumenVigencias
}

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  lastPage: number
}

export interface ListParams {
  page?: number
  perPage?: number
  placa?: string
  telefono?: string
  nombre?: string
  cedula?: string
  convenioId?: number
  asesorId?: number
  vigente?: '' | 0 | 1 | boolean
  desde?: string
  hasta?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

/* ============================
   Helpers de fecha
============================ */
export function formatDate(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString() } catch { return d! }
}
export function formatDateTime(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return d! }
}

/* ============================
   Normalizadores
============================ */
function mapAsignacion(raw: unknown): Asignacion {
  const r = raw as Record<string, unknown>
  const asesorObj = r?.asesor as Record<string, unknown> | undefined

  return {
    id: Number(r?.id),
    prospecto_id: Number(r?.prospecto_id ?? r?.prospectoId),
    asesor: {
      id: Number(asesorObj?.id ?? r?.asesor_id ?? r?.asesorId),
      nombre: String(asesorObj?.nombre ?? r?.asesor_nombre ?? '—'),
      tipo: String(asesorObj?.tipo ?? r?.asesor_tipo ?? ''),
    },
    asignado_por: (r?.asignado_por ?? r?.asignadoPor ?? null) as string | number | null,
    fecha_asignacion:
      (r?.fecha_asignacion ??
      r?.fechaAsignacion ??
      r?.created_at ??
      r?.createdAt ??
      null) as string | null,
    fecha_fin: (r?.fecha_fin ?? r?.fechaFin ?? null) as string | null,
    motivo_fin: (r?.motivo_fin ?? r?.motivoFin ?? null) as string | null,
    activo: Boolean(r?.activo ?? (r?.fecha_fin == null)),
  }
}

/** Unifica snake_case y camelCase. Si vienen 'asignaciones', deriva asignacion_activa. */
function unifyProspecto(p: unknown): ProspectoDetail {
  const pObj = p as Record<string, unknown>
  const out: Record<string, unknown> = { ...pObj }

  // alias básicos
  out.cedula = out.cedula ?? null
  out.observaciones = out.observaciones ?? null
  out.soat_vigente       = out.soat_vigente       ?? out.soatVigente       ?? null
  out.soat_vencimiento   = out.soat_vencimiento   ?? out.soatVencimiento   ?? null
  out.tecno_vigente      = out.tecno_vigente      ?? out.tecnoVigente      ?? null
  out.tecno_vencimiento  = out.tecno_vencimiento  ?? out.tecnoVencimiento  ?? null
  out.preventiva_vigente = out.preventiva_vigente ?? out.preventivaVigente ?? null
  out.preventiva_vencimiento = out.preventiva_vencimiento ?? out.preventivaVencimiento ?? null
  out.peritaje_ultima_fecha  = out.peritaje_ultima_fecha  ?? out.peritajeUltimaFecha    ?? null

  out.convenio_id = out.convenio_id ?? out.convenioId ?? null
  out.creado_por  = out.creado_por  ?? out.creadoPor  ?? null
  out.created_at  = out.created_at  ?? out.createdAt  ?? null
  out.updated_at  = out.updated_at  ?? out.updatedAt  ?? null

  // archivado: forzamos boolean
  if (out.archivado === undefined || out.archivado === null) {
    out.archivado = false
  } else {
    out.archivado = !!out.archivado
  }

  // asignaciones → activa + historial
  if (!out.asignacion_activa && Array.isArray(out.asignaciones)) {
    const hist = (out.asignaciones as unknown[]).map(mapAsignacion)
    out.historial_asignaciones = hist
    out.asignacion_activa = hist.find((a: Asignacion) => a.activo && !a.fecha_fin) ?? null
  }

  return out as unknown as ProspectoDetail
}

function normalizeListShape<T = unknown>(r: unknown, fallback: ListParams): ListResponse<T> {
  const rObj = r as Record<string, unknown>
  const rawData: unknown[] = Array.isArray(r) ? r : (rObj?.data ?? rObj?.items ?? rObj?.rows ?? []) as unknown[]
  const data = rawData.map(unifyProspecto)
  const total = Array.isArray(r)
    ? data.length
    : Number(rObj?.total ?? (rObj?.meta as Record<string, unknown>)?.total ?? rObj?.totalItems ?? rObj?.count ?? data.length) || 0
  const page = Number(rObj?.page ?? (rObj?.meta as Record<string, unknown>)?.current_page ?? fallback.page ?? 1)
  const perPage = Number(rObj?.perPage ?? (rObj?.meta as Record<string, unknown>)?.per_page ?? fallback.perPage ?? 10)
  const lastPage = Array.isArray(r)
    ? 1
    : Number(
        rObj?.lastPage ??
        (rObj?.meta as Record<string, unknown>)?.last_page ??
        (total && perPage ? Math.ceil(total / perPage) : 1)
      ) || 1
  return { data: data as unknown as T[], total, page, perPage, lastPage }
}

/* ============================
   API
============================ */

/**
 * Lista prospectos con verificación automática de dateos vencidos
 *
 * 🔄 NUEVO: Antes de cargar la lista, verifica si hay dateos vencidos (>72h PENDIENTE)
 * y los revierte automáticamente a prospectos. Esto asegura que siempre veas
 * los prospectos más actualizados.
 *
 * @param params Filtros de búsqueda y paginación
 * @returns Lista paginada de prospectos
 */
export async function listProspectos(params: ListParams) {
  // 🔄 NUEVO: Verificar dateos vencidos ANTES de cargar lista
  try {
    await apiFetch<unknown>('/captacion-dateos/verificar-vencidos', { method: 'POST' })
  } catch (e) {
    console.warn('⚠️ No se pudo verificar dateos vencidos:', e)
    // No bloqueamos la carga de prospectos si falla la verificación
  }

  // Continúa con la carga normal (sin cambios)
  const vigenteBool =
    params.vigente === '' || params.vigente === undefined
      ? undefined
      : (params.vigente === true || params.vigente === 1)

  const query: Record<string, unknown> = {
    placa: params.placa || undefined,
    telefono: params.telefono || undefined,
    nombre: params.nombre || undefined,
    cedula: params.cedula || undefined,
    q: params.nombre || undefined,
    convenioId: params.convenioId || undefined,
    convenio_id: params.convenioId || undefined,
    asesorId: params.asesorId || undefined,
    asesor_id: params.asesorId || undefined,
    vigente: vigenteBool === undefined ? undefined : String(vigenteBool),
    vigente_num: vigenteBool === undefined ? undefined : (vigenteBool ? 1 : 0),
    desde: params.desde || undefined,
    hasta: params.hasta || undefined,
    page: params.page,
    perPage: params.perPage,
    sortBy: params.sortBy,
    order: params.order,
  }

  const r = await apiFetch<unknown>('/prospectos', { query })
  return normalizeListShape<ProspectoDetail>(r, params)
}

export async function getProspecto(id: number) {
  const r = await apiFetch<unknown>('/prospectos/' + id)
  return unifyProspecto(r as Record<string, unknown>)
}

// Alias por compatibilidad
export const getProspectoById = getProspecto

export async function createProspecto(payload: Partial<Prospecto>) {
  const r = await apiFetch<unknown>('/prospectos', { method: 'POST', body: payload })
  return unifyProspecto(r as Record<string, unknown>)
}

export async function patchProspecto(id: number, payload: Partial<Prospecto>) {
  const r = await apiFetch<unknown>('/prospectos/' + id, { method: 'PATCH', body: payload })
  return unifyProspecto(r as Record<string, unknown>)
}

export async function asignarAsesor(prospectoId: number, payload: { asesor_id: number }) {
  return apiFetch<{ ok?: boolean; message?: string; id?: number; asignacionId?: number }>(
    `/prospectos/${prospectoId}/asignar`,
    { method: 'POST', body: { asesor_id: payload.asesor_id, asesorId: payload.asesor_id } },
  )
}

export async function retirarAsesor(prospectoId: number, payload: { motivo?: string }) {
  return apiFetch<{ ok?: boolean; message?: string }>(`/prospectos/${prospectoId}/retirar`, {
    method: 'POST',
    body: { motivo: payload?.motivo },
  })
}

/**
 * ⭐ NUEVO: Convierte un prospecto en un dateo
 *
 * 🎯 COMPORTAMIENTO:
 * 1. Valida que el prospecto exista y no esté archivado
 * 2. Valida que tenga RTM vencida (regla de negocio opcional)
 * 3. Crea un dateo en estado PENDIENTE
 * 4. Archiva TODOS los prospectos con la misma placa (incluyendo duplicados)
 * 5. Los prospectos desaparecen de la lista de TODOS los asesores
 *
 * ⏰ VENCIMIENTO AUTOMÁTICO:
 * - Si el dateo no cambia de estado en 72 horas, se revierte automáticamente
 * - Los prospectos vuelven a estar disponibles para todos los asesores
 * - La reversión ocurre cuando alguien carga la lista de prospectos (listProspectos)
 *
 * @param prospectoId ID del prospecto a datear
 * @returns { message: string, dateo_id: number }
 *
 * @throws 404 - Prospecto no encontrado o ya archivado
 * @throws 400 - RTM no vencida / sin asesor asignado / agente no encontrado
 * @throws 500 - Error al crear dateo o archivar prospectos
 *
 * @example
 * // Uso en componente Vue
 * async function handleDatear(prospectoId: number) {
 *   try {
 *     const resultado = await datearProspecto(prospectoId)
 *     console.log(`✅ Dateo creado: ${resultado.dateo_id}`)
 *     // Recargar lista (el prospecto ya no aparecerá)
 *     await cargarProspectos()
 *   } catch (error) {
 *     alert(`❌ Error: ${error.message}`)
 *   }
 * }
 */
export async function datearProspecto(prospectoId: number) {
  return apiFetch<{ message?: string; dateo_id?: number }>(
    `/prospectos/${prospectoId}/datear`,
    { method: 'POST' },
  )
}

/* Catálogos */
export async function listAgentesCaptacion() {
  try {
    const res = await apiFetch<{ data: AgenteLight[] } | AgenteLight[]>('/agentes-captacion', {
      query: { activo: 1, perPage: 200, select: 'id,nombre,tipo' },
    })
    return Array.isArray(res) ? res : (res?.data ?? [])
  } catch { return [] }
}

export async function listConveniosLight() {
  try {
    const res = await apiFetch<{ data: ConvenioLight[] } | ConvenioLight[]>('/convenios', {
      query: { activo: 1, perPage: 200, select: 'id,nombre' },
    })
    return Array.isArray(res) ? res : (res?.data ?? [])
  } catch { return [] }
}
