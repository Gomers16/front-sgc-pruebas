import { AVISO_SOLO_LECTURA, cabecerasSede, frenarEscrituraEnTodas } from '@/services/sedeActiva'
// src/services/comprobantesService.ts
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
  opts: {
    method?: HttpMethod
    body?: unknown
    query?: Record<string, unknown>
    headers?: HeadersInit
  } = {}
): Promise<T> {
  const url = `${BASE}${endpoint}${buildQuery(opts.query)}`
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  const token = sessionStorage.getItem('token') || localStorage.getItem('token')
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`
  Object.assign(headers, cabecerasSede()) // multi-sede
  if (frenarEscrituraEnTodas(opts.method)) throw new Error(AVISO_SOLO_LECTURA)

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

/* ========================= Tipos ========================= */

export interface ComprobantePago {
  id: number
  numero: number
  periodo_desde: string | null
  periodo_hasta: string | null
  beneficiario_tipo: 'CONVENIO' | 'ASESOR'
  beneficiario_id: number | null
  beneficiario_nombre: string
  medio_pago: string | null
  telefono: string | null
  total_motos: number
  total_vehiculos: number
  total_dateo: number
  total_incentivo: number
  total_general: number
  comision_ids: number[]
  placas_snapshot: string | null
  filtro_estado: string | null
  filtro_tipo_vehiculo: string | null
  evidencia_url: string | null
  generado_por: number | null
  notas: string | null
  created_at: string | null
}

export interface ListComprobantesParams {
  page?: number
  perPage?: number
  q?: string
  numero?: number
  desde?: string
  hasta?: string
}

export interface CreateComprobantePayload {
  periodo_desde?: string
  periodo_hasta?: string
  filtro_estado?: string
  filtro_tipo_vehiculo?: string
  notas?: string
  groups: {
    beneficiario_tipo: 'CONVENIO' | 'ASESOR'
    beneficiario_id?: number | null
    beneficiario_nombre: string
    medio_pago?: string | null
    telefono?: string | null
    total_motos: number
    total_vehiculos: number
    total_dateo: number
    total_incentivo: number
    total_general: number
    comision_ids: number[]
    placas: string[]
  }[]
}

/* ========================= Mapeo ========================= */

function mapComprobante(raw: unknown): ComprobantePago {
  const a = raw as Record<string, unknown>
  return {
    id: a.id as number,
    numero: (a.numero ?? a.id) as number,
    periodo_desde: (a.periodo_desde ?? null) as string | null,
    periodo_hasta: (a.periodo_hasta ?? null) as string | null,
    beneficiario_tipo: (a.beneficiario_tipo ?? 'CONVENIO') as 'CONVENIO' | 'ASESOR',
    beneficiario_id: (a.beneficiario_id ?? null) as number | null,
    beneficiario_nombre: String(a.beneficiario_nombre ?? '—'),
    medio_pago: (a.medio_pago ?? null) as string | null,
    telefono: (a.telefono ?? null) as string | null,
    total_motos: Number(a.total_motos ?? 0),
    total_vehiculos: Number(a.total_vehiculos ?? 0),
    total_dateo: Number(a.total_dateo ?? 0),
    total_incentivo: Number(a.total_incentivo ?? 0),
    total_general: Number(a.total_general ?? 0),
    comision_ids: Array.isArray(a.comision_ids) ? a.comision_ids.map(Number) : [],
    placas_snapshot: (a.placas_snapshot ?? null) as string | null,
    filtro_estado: (a.filtro_estado ?? null) as string | null,
    filtro_tipo_vehiculo: (a.filtro_tipo_vehiculo ?? null) as string | null,
    evidencia_url: (a.evidencia_url ?? null) as string | null,
    generado_por: (a.generado_por ?? null) as number | null,
    notas: (a.notas ?? null) as string | null,
    created_at: (a.created_at ?? null) as string | null,
  }
}

/* ========================= API ========================= */

/**
 * POST /api/comprobantes-pago
 * Crea un comprobante por cada grupo. Devuelve array.
 */
export async function createComprobantes(
  payload: CreateComprobantePayload
): Promise<ComprobantePago[]> {
  const raw = await apiFetch<unknown>('/comprobantes-pago', {
    method: 'POST',
    body: payload,
  })
  const r = raw as Record<string, unknown>
  const rows = Array.isArray(r?.data) ? r.data as unknown[] : []
  return rows.map(mapComprobante)
}

/**
 * GET /api/comprobantes-pago
 */
export async function listComprobantes(params: ListComprobantesParams = {}): Promise<{
  data: ComprobantePago[]
  total: number
  page: number
  perPage: number
}> {
  const raw = await apiFetch<unknown>('/comprobantes-pago', {
    query: params as Record<string, unknown>,
  })
  const r = raw as Record<string, unknown>
  const rows = Array.isArray(r?.data) ? (r.data as unknown[]).map(mapComprobante) : []
  return {
    data: rows,
    total: Number(r.total ?? rows.length),
    page: Number(r.page ?? 1),
    perPage: Number(r.perPage ?? 20),
  }
}

/**
 * GET /api/comprobantes-pago/:id
 */
export async function getComprobante(id: number): Promise<ComprobantePago> {
  const raw = await apiFetch<unknown>(`/comprobantes-pago/${id}`)
  return mapComprobante(raw)
}

/**
 * PATCH /api/comprobantes-pago/:id/evidencia
 * Asocia una URL de imagen ya subida al comprobante.
 */
export async function subirEvidencia(
  id: number,
  evidenciaUrl: string
): Promise<ComprobantePago> {
  const raw = await apiFetch<unknown>(`/comprobantes-pago/${id}/evidencia`, {
    method: 'PATCH',
    body: { evidencia_url: evidenciaUrl },
  })
  return mapComprobante(raw)
}

/**
 * DELETE /api/comprobantes-pago/:id/evidencia
 */
export async function eliminarEvidencia(id: number): Promise<ComprobantePago> {
  const raw = await apiFetch<unknown>(`/comprobantes-pago/${id}/evidencia`, {
    method: 'DELETE',
  })
  return mapComprobante(raw)
}

/**
 * POST /api/uploads/images
 * Sube una imagen y devuelve la URL.
 */
export async function uploadImagen(file: File): Promise<string> {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  Object.assign(headers, cabecerasSede()) // multi-sede
  if (frenarEscrituraEnTodas('POST')) throw new Error(AVISO_SOLO_LECTURA)

  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${BASE}/uploads/images`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      msg = (err as Record<string, unknown>)?.message as string || JSON.stringify(err)
    } catch {}
    throw new Error(msg)
  }

  const data = await res.json() as Record<string, unknown>
  // El endpoint devuelve { url: '...' } o { path: '...' }
  const url = (data.url ?? data.path ?? data.file ?? '') as string
  if (!url) throw new Error('El servidor no devolvió una URL válida')
  return url
}

/* ========================= Helpers ========================= */

export function formatCOP(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

export function formatDateShort(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}