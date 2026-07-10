// src/services/dateosService.ts
import { get, post, put, del, patch } from '@/services/http'

export type CanalCaptacion = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
export type ResultadoDateo = 'PENDIENTE' | 'EN_PROCESO' | 'EXITOSO' | 'NO_EXITOSO' | 'RE_DATEAR'
export type OrigenDateo = 'UI' | 'WHATSAPP' | 'IMPORT'

export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'INTERNO' | 'EXTERNO' | string
}

export interface ConvenioLight {
  id: number
  nombre: string
}

/** Metadatos de imagen que guardas en el dateo */
export interface DateoImagenMeta {
  imagen_url?: string | null
  imagen_mime?: string | null
  imagen_tamano_bytes?: number | null
  imagen_hash?: string | null
  imagen_origen_id?: string | number | null
}

/** Información del turno vinculado al dateo */
export interface TurnoInfo {
  id?: number
  fecha?: string
  numeroGlobal?: number
  numeroServicio?: number
  servicioCodigo?: string
  estado?: string
  es_recurrente?: boolean | null
  es_recuperacion?: boolean | null
  meses_desde_ultima_visita?: number | null
}

export interface Dateo extends DateoImagenMeta {
  id: number
  canal: CanalCaptacion
  created_at: string
  created_at_fmt?: string
  agente?: AgenteLight | null
  agente_id?: number | null
  convenio_id?: number | null
  convenio?: ConvenioLight | null
  placa?: string | null
  telefono?: string | null
  observacion?: string | null
  resultado?: ResultadoDateo
  consumido_turno_id?: number | null
  consumido_at?: string | null
  updated_at?: string
  origen?: OrigenDateo
  turnoInfo?: TurnoInfo | null
  descuento_id?: number | null
  descuento?: { id: number; codigo: string; nombre: string } | null
  es_avance?: boolean
  comprobante_avance_url?: string | null
}

export interface ListResponse<T> { data: T[]; total: number; page: number; perPage: number; lastPage: number }

export interface ListParams {
  page?: number
  perPage?: number
  placa?: string
  telefono?: string
  canal?: CanalCaptacion | ''
  convenioId?: number
  agenteId?: number
  resultado?: ResultadoDateo | ''
  desde?: string
  hasta?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

type BackendListEnvelope<T> =
  | { data: T[]; total?: number; page?: number; perPage?: number; lastPage?: number; meta?: { total?: number; current_page?: number; per_page?: number; last_page?: number } }
  | { items: T[]; total?: number; page?: number; perPage?: number; lastPage?: number; meta?: { total?: number; current_page?: number; per_page?: number; last_page?: number } }
  | { rows: T[]; total?: number; page?: number; perPage?: number; lastPage?: number; meta?: { total?: number; current_page?: number; per_page?: number; last_page?: number } }
  | { data: T[]; count?: number; totalItems?: number; page?: number; perPage?: number; lastPage?: number; meta?: { total?: number; current_page?: number; per_page?: number; last_page?: number } }

export function formatDateTime(d?: string | null): string {
  if (!d) return '—'
  if (/AM|PM|a\. m\.|p\. m\./i.test(d)) return d
  try {
    const dt = new Date(d)
    const out = dt.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    return out.replace(/\s*a\.?\s*m\.?/i, ' AM').replace(/\s*p\.?\s*m\.?/i, ' PM')
  } catch {
    return d!
  }
}

export async function listDateos(params: ListParams) {
  const r = await get<BackendListEnvelope<Dateo>>('/api/captacion-dateos', {
    params: {
      ...params,
      convenio_id: params.convenioId,
    },
  })

  const data =
    ('data' in r && Array.isArray(r.data) && r.data) ||
    ('items' in r && Array.isArray(r.items) && r.items) ||
    ('rows' in r && Array.isArray((r as { rows?: Dateo[] }).rows) && (r as { rows: Dateo[] }).rows) ||
    []

  const meta = ('meta' in r && r.meta) || undefined
  const total =
    Number(
      ('total' in r && r.total) ??
      (meta?.total) ??
      (('totalItems' in r && (r as { totalItems?: number }).totalItems)) ??
      (('count' in r && (r as { count?: number }).count)) ??
      data.length
    ) || 0

  const page = Number(
    ('page' in r && r.page) ??
    meta?.current_page ??
    params.page ??
    1
  )

  const perPage = Number(
    ('perPage' in r && r.perPage) ??
    meta?.per_page ??
    params.perPage ??
    10
  )

  const lastPage = Number(
    ('lastPage' in r && (r as { lastPage?: number }).lastPage) ??
    meta?.last_page ??
    (total && perPage ? Math.ceil(total / perPage) : 1)
  ) || 1

  return { data, total, page, perPage, lastPage } as ListResponse<Dateo>
}

export function getDateo(id: number) {
  return get<Dateo>(`/api/captacion-dateos/${id}`)
}

export function createDateo(payload: Partial<Dateo>) {
  return post<Dateo, Partial<Dateo>>('/api/captacion-dateos', payload)
}

export function updateDateo(id: number, payload: Partial<Dateo>) {
  return put<Dateo, Partial<Dateo>>(`/api/captacion-dateos/${id}`, payload)
}

export function deleteDateo(id: number) {
  return del<{ ok: boolean }>(`/api/captacion-dateos/${id}`)
}

export function toggleAvance(
  id: number,
  esAvance: boolean,
  comprobanteUrl?: string | null
) {
  return patch<Dateo, { es_avance: boolean; comprobante_avance_url: string | null }>(
    `/api/captacion-dateos/${id}/avance`,
    { es_avance: esAvance, comprobante_avance_url: comprobanteUrl ?? null }
  )
}

export function esDescuentoAvance(codigo?: string | null): boolean {
  return String(codigo || '').toUpperCase().includes('AVANCE')
}

export async function listAgentesCaptacion(): Promise<AgenteLight[]> {
  try {
    const PAGE_SIZE = 100
    let page = 1
    let allAgentes: AgenteLight[] = []

    while (true) {
      const r = await get<{ data: AgenteLight[]; total: number; lastPage?: number }>(
        `/api/agentes-captacion`,
        { params: { activos: 1, select: 'id,nombre,tipo', perPage: PAGE_SIZE, page } }
      )

      const chunk = Array.isArray(r?.data) ? r.data : []
      allAgentes = allAgentes.concat(chunk)

      const lastPage = r?.lastPage ?? Math.ceil((r?.total ?? 0) / PAGE_SIZE)

      if (page >= lastPage || chunk.length === 0) break
      page++
    }

    return allAgentes
  } catch {
    return []
  }
}
export async function listConveniosLight() {
  try {
    const r = await get<{ data: ConvenioLight[] }>(`/api/convenios`, {
      params: { activos: 1, select: 'id,nombre' },
    })
    const arr = Array.isArray(r?.data) ? r.data : []
    return [...arr].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  } catch {
    return []
  }
}

export function crearDateoAutoPorConvenio(payload: {
  placa?: string
  telefono?: string
  convenioId: number
}) {
  return post<unknown, typeof payload>('/api/captacion-dateos/auto-convenio', payload)
}

/* ══════════════════════════════════════════════════
   IMPORTACIÓN HISTÓRICO RTM
══════════════════════════════════════════════════ */

export interface HistoricoPreviewResponse {
  total_filas: number
  errores_parseo: number
  por_hoja: Record<string, {
    total: number
    aprobado: number
    dateo: number
    sinAsesor: number
  }>
}

export interface HistoricoImportarResponse {
  dry_run: boolean
  resumen: {
    total_filas: number
    creados: number
    skipped_duplicado: number
    skipped_sin_asesor: number
    errores_proceso: number
    errores_parseo: number
  }
  errores_detalle: Array<{
    hoja: string
    fila: number
    placa: string
    motivo: string
  }>
}

export async function previewHistoricoRtm(
  archivo: File,
  hojas?: string
): Promise<HistoricoPreviewResponse> {
  const form = new FormData()
  form.append('archivo', archivo)
  if (hojas?.trim()) form.append('hojas', hojas.trim())

  return post<HistoricoPreviewResponse, FormData>(
    '/api/historico-rtm/preview',
    form
  )
}

export async function importarHistoricoRtm(
  archivo: File,
  dryRun: boolean,
  hojas?: string
): Promise<HistoricoImportarResponse> {
  const form = new FormData()
  form.append('archivo', archivo)
  form.append('dry_run', dryRun ? 'true' : 'false')
  if (hojas?.trim()) form.append('hojas', hojas.trim())

  return post<HistoricoImportarResponse, FormData>(
    '/api/historico-rtm/importar',
    form
  )
}

export interface RtmVerificacion {
  rtm_vigente: boolean
  valido_hasta?: string | null
  puede_datear_desde?: string | null
  dentro_de_ventana?: boolean
  dias_restantes?: number
  fecha_rtm?: string | null
}

export async function verificarPlacaRtm(placa: string): Promise<RtmVerificacion> {
  return get<RtmVerificacion>('/api/captacion-dateos/verificar-placa', {
    params: { placa },
  })
}
