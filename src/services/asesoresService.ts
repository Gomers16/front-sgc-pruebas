// src/services/asesoresService.ts
import { get } from '@/services/http'

/* ===== Tipos que usa tu vista ===== */
export type TipoAsesor =
  | 'ASESOR_COMERCIAL'
  | 'ASESOR_CONVENIO'
  | 'ASESOR_TELEMERCADEO'

export interface Agente {
  id: number
  nombre: string
  tipo?: TipoAsesor | string | null
  telefono?: string | null
  docTipo?: 'CC' | 'NIT' | null
  docNumero?: string | null
  email?: string | null          // ← NUEVO
  correo?: string | null         // ← NUEVO
  correoPersonal?: string | null // ← NUEVO
  /** Bandera final calculada por el backend (true/false) */
  activo?: boolean
  created_at?: string | null
  updated_at?: string | null
}

/* ===== Tipos auxiliares ===== */
export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

export interface ResumenAsesor {
  convenios: {
    total: number
    vigentes: number
    asignaciones?: number
  }
  prospectos: {
    total: number
    vigentes?: number
    hoy: number
    mes: number
  }
}

export interface ProspectoLite {
  id: number
  placa?: string | null
  telefono?: string | null
  nombre?: string | null
  convenio_id?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ConvenioLite {
  id: number
  nombre: string
  establecimiento?: string | null
  vigencia_desde?: string | null
  vigencia_hasta?: string | null
}

/* ===== Normalizadores ===== */
function normalizeListShape<T = unknown>(
  r: unknown,
  fallback: { page?: number; perPage?: number } = {}
): ListResponse<T> {
  const rObj = r as Record<string, unknown>
  const data: T[] = Array.isArray(r) ? r : (rObj?.data ?? rObj?.items ?? rObj?.rows ?? []) as T[]
  const total = Array.isArray(r)
    ? data.length
    : Number(rObj?.total ?? (rObj?.meta as Record<string, unknown>)?.total ?? rObj?.totalItems ?? rObj?.count ?? data.length) || 0
  const page = Number(rObj?.page ?? (rObj?.meta as Record<string, unknown>)?.current_page ?? fallback.page ?? 1)
  const perPage = Number(rObj?.perPage ?? (rObj?.meta as Record<string, unknown>)?.per_page ?? fallback.perPage ?? 10)
  return { data, total, page, perPage }
}

function normalizeTipo(value?: string | null): TipoAsesor | string | null {
  if (!value) return value ?? null
  const v = String(value).toUpperCase()
  if (v === 'ASESOR_INTERNO' || v === 'INTERNO') return 'ASESOR_COMERCIAL'
  if (v === 'ASESOR_EXTERNO' || v === 'EXTERNO') return 'ASESOR_CONVENIO'
  if (v === 'TELEMERCADEO') return 'ASESOR_TELEMERCADEO'
  if (v === 'ASESOR_COMERCIAL' || v === 'ASESOR_CONVENIO' || v === 'ASESOR_TELEMERCADEO') {
    return v as TipoAsesor
  }
  return value
}

function normalizeBool(v: unknown): boolean {
  if (v === true || v === 1 || v === '1') return true
  if (v === false || v === 0 || v === '0') return false
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['true', 't', 'sí', 'si', 'activo', 'yes', 'y'].includes(s)) return true
    if (['false', 'f', 'no', 'inactivo', 'n'].includes(s)) return false
  }
  return false
}

function mapAgente(raw: unknown): Agente {
  const rawObj = raw as Record<string, unknown>
  const created = rawObj?.created_at ?? rawObj?.createdAt ?? null
  const updated = rawObj?.updated_at ?? rawObj?.updatedAt ?? null

  // ✅ PRIORIDAD:
  // 1) 'activo' ya calculado por el backend (boolean)
  // 2) 'activo_calc' que viene como 0/1
  // 3) variantes legacy (is_active / isActive)
  let activoFinal: boolean | undefined
  if (rawObj?.activo !== undefined) {
    activoFinal = normalizeBool(rawObj.activo)
  } else if (rawObj?.activo_calc !== undefined) {
    activoFinal = normalizeBool(rawObj.activo_calc)
  } else if (rawObj?.is_active !== undefined || rawObj?.isActive !== undefined) {
    activoFinal = normalizeBool(rawObj?.is_active ?? rawObj?.isActive)
  }

  // ✅ EXTRAER CORREO (prioridad: corporativo > personal)
  const email = (
    rawObj?.correo ||
    rawObj?.email ||
    rawObj?.correo_personal ||
    rawObj?.correoPersonal ||
    rawObj?.emailPersonal ||
    null
  ) as string | null

  const correoPersonal = (
    rawObj?.correo_personal ||
    rawObj?.correoPersonal ||
    rawObj?.emailPersonal ||
    null
  ) as string | null

  return {
    id: Number(rawObj?.id),
    nombre: String(rawObj?.nombre ?? ''),
    tipo: normalizeTipo((rawObj?.tipo ?? rawObj?.agente_tipo ?? null) as string | null),
    telefono: (rawObj?.telefono as string | null) ?? null,
    docTipo: (rawObj?.docTipo ?? rawObj?.doc_tipo ?? null) as 'CC' | 'NIT' | null,
    docNumero: (rawObj?.docNumero ?? rawObj?.doc_numero ?? null) as string | null,
    email,                    // ← NUEVO
    correo: email,            // ← NUEVO
    correoPersonal,           // ← NUEVO
    activo: activoFinal,
    created_at: typeof created === 'string' ? created : (created?.toString?.() ?? null),
    updated_at: typeof updated === 'string' ? updated : (updated?.toString?.() ?? null),
  }
}

function mapProspecto(raw: unknown): ProspectoLite {
  const rawObj = raw as Record<string, unknown>
  return {
    id: Number(rawObj?.id),
    placa: (rawObj?.placa as string | null) ?? null,
    telefono: (rawObj?.telefono as string | null) ?? null,
    nombre: (rawObj?.nombre as string | null) ?? null,
    convenio_id: (rawObj?.convenio_id ?? rawObj?.convenioId ?? null) as number | null,
    created_at: (rawObj?.created_at ?? rawObj?.createdAt ?? null) as string | null,
    updated_at: (rawObj?.updated_at ?? rawObj?.updatedAt ?? null) as string | null,
  }
}

function mapConvenio(raw: unknown): ConvenioLite {
  const rawObj = raw as Record<string, unknown>
  const pivot = rawObj?.pivot as Record<string, unknown> | undefined
  const asignacion = rawObj?.asignacion as Record<string, unknown> | undefined

  return {
    id: Number(rawObj?.id),
    nombre: String(rawObj?.nombre ?? ''),
    establecimiento: (rawObj?.establecimiento ?? null) as string | null,
    vigencia_desde:
      (rawObj?.vigencia_desde ??
      pivot?.fecha_inicio ??
      asignacion?.fecha_asignacion ??
      null) as string | null,
    vigencia_hasta:
      (rawObj?.vigencia_hasta ??
      pivot?.fecha_fin ??
      asignacion?.fecha_fin ??
      null) as string | null,
  }
}

/* ===== API base ===== */
const API = '/api'

/** Lista de asesores -> SIEMPRE retorna { data, total, page, perPage } */
export async function listAsesores(
  params: {
    q?: string
    tipo?: TipoAsesor | 'INTERNO' | 'EXTERNO' | 'TELEMERCADEO'
    activo?: '' | 0 | 1 | boolean
    page?: number
    perPage?: number
    sortBy?: string
    order?: 'asc' | 'desc'
  } = {}
): Promise<ListResponse<Agente>> {
  let tipoParam = params.tipo ? String(params.tipo).toUpperCase() : undefined
  if (tipoParam === 'INTERNO') tipoParam = 'ASESOR_COMERCIAL'
  if (tipoParam === 'EXTERNO') tipoParam = 'ASESOR_CONVENIO'
  if (tipoParam === 'TELEMERCADEO') tipoParam = 'ASESOR_TELEMERCADEO'

  const activoParam =
    params.activo === '' || params.activo === undefined
      ? undefined
      : (params.activo === true || params.activo === 1) ? 'true' : 'false'

  const resp = await get<unknown>(`${API}/agentes-captacion`, {
    params: {
      q: params.q,
      tipo: tipoParam,
      activo: activoParam,
      page: params.page,
      perPage: params.perPage,
      sortBy: params.sortBy,
      order: params.order,
    },
  })

  const norm = normalizeListShape<unknown>(resp, params)
  const mapped: Agente[] = (norm.data || []).map(mapAgente)
  return { ...norm, data: mapped }
}

/** Detalle de asesor */
export async function getAsesorById(id: number): Promise<Agente> {
  const r = await get<unknown>(`${API}/agentes-captacion/${id}`)
  return mapAgente(r)
}

/** 🆕 Obtener MI ficha (del usuario autenticado) */
export async function getMiFicha(): Promise<Agente> {
  const r = await get<unknown>(`${API}/agentes-captacion/me`)
  return mapAgente(r)
}

/** Resumen por asesor (conteos convenios y prospectos) */
export async function getResumenAsesor(id: number): Promise<ResumenAsesor> {
  const r = await get<unknown>(`${API}/agentes-captacion/${id}/resumen`)
  const rObj = r as Record<string, unknown>
  const convenios = rObj?.convenios as Record<string, unknown> | undefined
  const prospectos = rObj?.prospectos as Record<string, unknown> | undefined

  return {
    convenios: {
      total: Number(convenios?.total ?? convenios?.asignaciones ?? 0),
      vigentes: Number(convenios?.vigentes ?? 0),
      asignaciones: Number(convenios?.asignaciones ?? convenios?.total ?? 0),
    },
    prospectos: {
      total: Number(prospectos?.total ?? prospectos?.vigentes ?? 0),
      vigentes: prospectos?.vigentes !== undefined ? Number(prospectos?.vigentes) : undefined,
      hoy: Number(prospectos?.hoy ?? 0),
      mes: Number(prospectos?.mes ?? 0),
    },
  }
}

/** Prospectos del asesor (por defecto solo asignación vigente) */
export async function listProspectosDelAsesor(
  asesorId: number,
  params: { vigente?: '' | 0 | 1 | boolean; q?: string } = {}
): Promise<ProspectoLite[]> {
  const vigenteParam =
    params.vigente === '' || params.vigente === undefined
      ? 1
      : (params.vigente === true || params.vigente === 1) ? 1 : 0

  const r = await get<unknown>(`${API}/agentes-captacion/${asesorId}/prospectos`, {
    params: { vigente: vigenteParam, q: params.q },
  })
  const arr = Array.isArray(r) ? r : ((r as Record<string, unknown>)?.data ?? []) as unknown[]
  return arr.map(mapProspecto)
}

/** Convenios del asesor (por defecto solo vigentes) */
export async function listConveniosDelAsesor(
  asesorId: number,
  vigente = true
): Promise<ConvenioLite[]> {
  const r = await get<unknown>(`${API}/agentes-captacion/${asesorId}/convenios`, {
    params: { vigente: vigente ? 1 : 0 },
  })
  const arr = Array.isArray(r) ? r : ((r as Record<string, unknown>)?.data ?? []) as unknown[]
  return arr.map(mapConvenio)
}

/* Export default para compatibilidad con imports existentes */
const api = {
  listAsesores,
  getAsesorById,
  getMiFicha,
  getResumenAsesor,
  listProspectosDelAsesor,
  listConveniosDelAsesor,
}
export default api
