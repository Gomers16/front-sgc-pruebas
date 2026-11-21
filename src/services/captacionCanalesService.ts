import { AVISO_SOLO_LECTURA, frenarEscrituraEnTodas, ponerCabeceraSede } from '@/services/sedeActiva'
// src/services/captacionCanalesService.ts
type Order = 'asc' | 'desc'
type OrderBy = 'orden' | 'codigo' | 'nombre' | 'created_at'

export interface CaptacionCanal {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  colorHex?: string | null
  activo: boolean
  orden: number
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface PaginationMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
  first_page: number
  first_page_url: string
  last_page_url: string
  next_page_url: string | null
  previous_page_url: string | null
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ListParams {
  q?: string
  activo?: boolean
  page?: number
  perPage?: number
  orderBy?: OrderBy
  order?: Order
}

export interface CreatePayload {
  codigo: string
  nombre: string
  descripcion?: string | null
  colorHex?: string | null
  activo?: boolean
  orden?: number
}

export interface UpdatePayload {
  codigo?: string
  nombre?: string
  descripcion?: string | null
  colorHex?: string | null
  activo?: boolean
  orden?: number
}

const DEFAULT_API_BASE = 'http://localhost:3333'
const API_BASE =
  ((() => {
    try {
      // Si usas Vite, esto existe en tiempo de build.
      const env = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env
      return env?.VITE_API_URL
    } catch {
      return undefined
    }
  })()) ?? DEFAULT_API_BASE

const BASE = '/api/captacion-canales'

function getAuthToken(): string | null {
  return localStorage.getItem('token')
}

/** Crea Headers sólidos y añade JSON + Bearer si aplica */
function buildHeaders(init?: HeadersInit, sendJson = true): Headers {
  const headers = new Headers(init)
  if (sendJson && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getAuthToken()
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
  ponerCabeceraSede(headers) // multi-sede
  return headers
}

/** Querystring genérica (acepta cualquier objeto) */
function toQuery<T extends object>(params?: T): string {
  const sp = new URLSearchParams()
  if (params) {
    for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
      if (v === undefined || v === null || v === '') continue
      sp.append(k, String(v))
    }
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/** Fetch wrapper tipado */
async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (frenarEscrituraEnTodas(init.method)) throw new Error(AVISO_SOLO_LECTURA)
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: buildHeaders(init.headers),
    credentials: init.credentials ?? 'include',
  })

  if (res.status === 204) return undefined as unknown as T

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const body: unknown = isJson ? await res.json().catch(() => ({})) : await res.text()

  if (!res.ok) {
    const message =
      isJson && typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message?: string }).message || res.statusText)
        : res.statusText
    throw new Error(message || `HTTP ${res.status}`)
  }

  return body as T
}

class CaptacionCanalesService {
  list(params: ListParams = {}) {
    return http<Paginated<CaptacionCanal>>(`${BASE}${toQuery<ListParams>(params)}`)
  }

  async listActivos() {
    const data = await http<Paginated<CaptacionCanal>>(
      `${BASE}?activo=true&orderBy=orden&order=asc&perPage=100`
    )
    return data.data
  }

  async getSelectItems() {
    const canales = await this.listActivos()
    return canales.map((c) => ({
      title: c.nombre,
      value: c.id,
      code: c.codigo,
      color: c.colorHex ?? undefined,
    }))
  }

  getById(id: number) {
    return http<CaptacionCanal>(`${BASE}/${id}`)
  }

  create(payload: CreatePayload) {
    return http<CaptacionCanal>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  update(id: number, payload: UpdatePayload) {
    return http<CaptacionCanal>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  remove(id: number) {
    return http<{ ok: true; message: string }>(`${BASE}/${id}`, { method: 'DELETE' })
  }

  restore(id: number) {
    return http<{ ok: true; message: string }>(`${BASE}/${id}/restore`, { method: 'POST' })
  }
}

export default new CaptacionCanalesService()
