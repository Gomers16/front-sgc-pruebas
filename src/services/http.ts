// src/services/http.ts
// Motor central basado en fetch para TODOS tus services (sin "any")

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type ParamPrimitive = string | number | boolean | null | undefined
type Params = Record<string, ParamPrimitive>

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod
  body?: TBody
  params?: Params
  headers?: Record<string, string>
  // No usaremos cookies: por defecto 'omit'
  credentials?: RequestCredentials // 'include' | 'same-origin' | 'omit'
  // Forzar JSON (si false, devuelve Blob: útil para Excel/PDF/imagenes)
  expectJson?: boolean
  // Permite cancelar/abortar requests
  signal?: AbortSignal
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

// ===== Base URL desde .env (con fallback a same-origin) =====
// Deja VITE_API_BASE_URL vacío para usar SIEMPRE el mismo origen (recomendado en dev con proxy).
const ENV_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
const BASE_URL =
  ENV_BASE || (typeof window !== 'undefined' ? window.location.origin : '')

// ===== Helpers internos =====
function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData
}

function extractMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string') return data || fallback
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    if (typeof obj.message === 'string' && obj.message) return obj.message
    if (typeof obj.error === 'string' && obj.error) return obj.error
    try { return JSON.stringify(data) } catch { /* ignore */ }
  }
  return fallback
}

// src/services/http.ts

function makeHeaders(userHeaders?: Record<string, string>, body?: unknown) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(userHeaders || {}),
  }

  // Si el body no es FormData y no hay Content-Type, asumimos JSON
  if (body !== undefined && !isFormData(body) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  // 🔐 LEER TOKEN igual que en comisionesService
  let token =
    sessionStorage.getItem('token') ??
    localStorage.getItem('token') ??
    null

  // Evitar valores basura tipo "null", "undefined", ""
  if (token === 'null' || token === 'undefined' || token === '') {
    token = null
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

// Si llega una URL absoluta, preservamos host y agregamos parámetros
function buildAbsoluteUrlWithParams(abs: string, params?: Params) {
  const url = new URL(abs)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v))
      }
    })
  }
  return url.toString()
}

function buildUrl(path: string, params?: Params) {
  // Si alguien mandó una URL absoluta por error, la usamos tal cual
  if (/^https?:\/\//i.test(path)) return buildAbsoluteUrlWithParams(path, params)

  // Asegura que si path viene con "/", no duplica slashes al unir con BASE_URL
  const cleanPath = path.replace(/^\/+/, '')
  const base = `${BASE_URL}/`
  const url = new URL(cleanPath, base)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v))
      }
    })
  }
  return url.toString()
}

async function parseResponse(res: Response, expectJson: boolean): Promise<unknown> {
  if (res.status === 204) return null
  if (!expectJson) return res.blob() // Excel/PDF/imagen/etc.

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()

  try { return await res.json() } catch { return res.text() }
}

// ====== Función principal ======
export async function http<TResp = unknown, TBody = unknown>(
  path: string,
  {
    method = 'GET',
    body,
    params,
    headers,
    credentials = 'omit', // 👈 SIN cookies por defecto
    expectJson = true,
    signal,
  }: RequestOptions<TBody> = {}
): Promise<TResp> {
  const url = buildUrl(path, params)
  const init: RequestInit = {
    method,
    headers: makeHeaders(headers, body),
    credentials,
    signal,
  }

  if (body !== undefined && method !== 'GET') {
    init.body = isFormData(body) ? body : JSON.stringify(body)
  }

  const res = await fetch(url, init)

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`
    let errData: unknown
    try {
      errData = await parseResponse(res, true)
      errMsg = extractMessage(errData, errMsg)
    } catch { /* ignore */ }
    throw new HttpError(res.status, errMsg, errData)
  }

  return (await parseResponse(res, expectJson)) as TResp
}

// ===== Atajos cómodos =====
export const get = <T = unknown>(
  path: string,
  opts?: Omit<RequestOptions, 'method' | 'body'>
) => http<T>(path, { ...opts, method: 'GET' })

export const post = <T = unknown, B = unknown>(
  path: string,
  body?: B,
  opts?: Omit<RequestOptions<B>, 'method'>
) => http<T, B>(path, { ...opts, method: 'POST', body })

export const put = <T = unknown, B = unknown>(
  path: string,
  body?: B,
  opts?: Omit<RequestOptions<B>, 'method'>
) => http<T, B>(path, { ...opts, method: 'PUT', body })

export const patch = <T = unknown, B = unknown>(
  path: string,
  body?: B,
  opts?: Omit<RequestOptions<B>, 'method'>
) => http<T, B>(path, { ...opts, method: 'PATCH', body })

export const del = <T = unknown>(
  path: string,
  opts?: Omit<RequestOptions, 'method' | 'body'>
) => http<T>(path, { ...opts, method: 'DELETE' })

// ===== Casos comunes extra =====

// Subida de archivos (FormData)
export function upload<T = unknown>(
  path: string,
  form: FormData,
  opts?: Omit<RequestOptions<FormData>, 'method' | 'body'>
) {
  return http<T, FormData>(path, { ...opts, method: 'POST', body: form })
}

// Descargar como blob (PDF, Excel, imagen, etc.)
export function download(path: string, params?: Params) {
  return http<Blob>(path, { params, expectJson: false })
}


