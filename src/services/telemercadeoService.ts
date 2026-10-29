// src/services/telemercadeoService.ts
import { get } from '@/services/http'

export type ListaCola = 'POR_VENCER' | 'CLIENTES'
export type RangoPorVencer = 'PROXIMAS' | 'VENCIDAS'
export type RangoClientes = '0_1' | '2_5' | '6_11' | '12_23' | '24_MAS' | 'SIN_FECHA'
export type OrdenClientes = 'ANTIGUEDAD' | 'RECIENTE' | 'NOMBRE'
export type FuenteVisita = 'TURNO_CLIENTE' | 'TURNO_PLACA' | 'TICKET'

export interface FilaCola {
  clave: string
  cliente_id: number | null
  cliente_nombre: string | null
  telefono: string | null
  documento: string | null
  placa: string
  placas: string[]
  n_vehiculos: number | null
  ultima_visita: string | null
  fuente_ultima_visita: FuenteVisita | null
  servicio_ultima_visita: string | null
  meses_transcurridos: number | null
  rango: string | null
  // Solo POR_VENCER
  vence_el: string | null
  puede_datear_desde: string | null
  dias_para_vencer: number | null
}

export interface ContadoresCola {
  POR_VENCER: Record<RangoPorVencer | 'total', number>
  CLIENTES: Record<RangoClientes | 'total', number>
}

export interface ColaParams {
  lista: ListaCola
  rango?: string | null
  q?: string | null
  orden?: OrdenClientes
  page?: number
  perPage?: number
}

export interface ColaResponse {
  data: FilaCola[]
  total: number
  page: number
  perPage: number
  hoy: string | null
  contadores: ContadoresCola
}

const CONTADORES_VACIOS: ContadoresCola = {
  POR_VENCER: { total: 0, PROXIMAS: 0, VENCIDAS: 0 },
  CLIENTES: { total: 0, '0_1': 0, '2_5': 0, '6_11': 0, '12_23': 0, '24_MAS': 0, SIN_FECHA: 0 },
}

/* ===== Normalizador (tolera {data, meta} / {data, total} / array) ===== */
function normalizeListShape(r: unknown, fallback: { page: number; perPage: number }): ColaResponse {
  const rObj = (r ?? {}) as Record<string, unknown>
  const meta = (rObj.meta ?? {}) as Record<string, unknown>
  const data = (Array.isArray(r) ? r : (rObj.data ?? rObj.items ?? rObj.rows ?? [])) as FilaCola[]
  const contadores = (meta.contadores ?? {}) as Partial<ContadoresCola>
  return {
    data,
    total: Number(meta.total ?? rObj.total ?? data.length) || 0,
    page: Number(meta.current_page ?? rObj.page ?? fallback.page),
    perPage: Number(meta.per_page ?? rObj.perPage ?? fallback.perPage),
    hoy: typeof meta.hoy === 'string' ? meta.hoy : null,
    contadores: {
      POR_VENCER: { ...CONTADORES_VACIOS.POR_VENCER, ...contadores.POR_VENCER },
      CLIENTES: { ...CONTADORES_VACIOS.CLIENTES, ...contadores.CLIENTES },
    },
  }
}

/** GET /api/telemercadeo/cola — cola de trabajo de solo lectura. */
export async function getColaTelemercadeo(params: ColaParams, signal?: AbortSignal) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 25
  const resp = await get<unknown>('/api/telemercadeo/cola', {
    params: {
      lista: params.lista,
      rango: params.rango || undefined,
      q: params.q?.trim() || undefined,
      orden: params.lista === 'CLIENTES' ? params.orden : undefined,
      page,
      per_page: perPage,
    },
    signal,
  })
  return normalizeListShape(resp, { page, perPage })
}
