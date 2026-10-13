import { get, post, patch } from '@/services/http'

const API = '/api'

/* ===== Tipos ===== */
export interface Convenio {
  id: number
  nombre: string
  codigo?: string | null
  tipo?: 'PERSONA' | 'TALLER' | 'PARQUEADERO' | 'LAVADERO' | null
  activo?: boolean | 0 | 1
  establecimiento?: string | null
  docTipo?: string | null
  docNumero?: string | null
  telefono?: string | null
  whatsapp?: string | null
  email?: string | null
  ciudadId?: number | null
  direccion?: string | null
  notas?: string | null
  metodoPago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE' | null
  numeroMetodoPago?: string | null
  asesorConvenioId?: number | null
  vigencia_desde?: string | null
  vigencia_hasta?: string | null
  fechaApertura?: string | null
  agente_captacion_id?: number | null
  created_at?: string
  updated_at?: string
  // 🆕 Ruta y gestión
  ruta?: string | null
  subRuta?: string | null
  periodicidad?: 'DIARIA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | null
  reporta?: string | null
  estado?: 'ACTIVO' | 'INACTIVO' | 'PROSPECTO' | null
}

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

export interface ListParams {
  page?: number
  perPage?: number
  texto?: string
  activo?: '' | 0 | 1 | boolean
  // 🆕 Filtros nuevos
  estado?: string
  ruta?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

export interface AgenteLight {
  id: number
  nombre: string
  tipo: 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | 'ASESOR_TELEMERCADEO' | string
}

export interface AsesorActivoResp {
  convenio_id?: number
  convenioId?: number
  activo?: boolean
  asesor: { id: number; nombre: string; tipo?: string } | null
  asignado_at?: string | null
  desde?: string | null
  asignacion_id?: number | null
}

export interface ConvenioSimple {
  id: number
  nombre: string
  establecimiento?: string | null
}

/** Ítem de los desplegables de convenio (GET /api/convenios/light) */
export interface ConvenioLight {
  id: number
  nombre: string
  establecimiento?: string | null
  codigo?: string | null
}

export interface AsignarAsesorPayload {
  asesor_id: number
  asesorId: number
  agente_captacion_id: number
  agenteCaptacionId: number
}

export interface RetirarAsesorPayload {
  motivo?: string
}

export interface CrearDateoAutoInput {
  convenio_id: number
  placa?: string | null
  telefono?: string | null
  origen?: 'UI' | 'IMPORT' | 'WHATSAPP'
  canal?: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
  agente_id?: number | null
  observacion?: string | null
}

export interface CrearDateoPayload {
  canal: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
  origen: 'UI' | 'IMPORT' | 'WHATSAPP'
  agente_id: number | null
  placa: string | null
  telefono: string | null
  observacion: string | null
  detectado_por_convenio: number
}

export interface UpdateConvenioPayload {
  nombre?: string
  tipo?: 'PERSONA' | 'TALLER' | 'PARQUEADERO' | 'LAVADERO'
  codigo?: string | null
  establecimiento?: string | null
  doc_tipo?: string | null
  doc_numero?: string | null
  telefono?: string | null
  whatsapp?: string | null
  email?: string | null
  ciudad_id?: number | null
  direccion?: string | null
  notas?: string | null
  metodo_pago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE' | null
  numero_metodo_pago?: string | null
  fecha_apertura?: string | null
  activo?: boolean
  // 🆕 Ruta y gestión
  ruta?: string | null
  sub_ruta?: string | null
  periodicidad?: 'DIARIA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | null
  reporta?: string | null
  estado?: 'ACTIVO' | 'INACTIVO' | 'PROSPECTO' | null
}

/* ===== Helpers ===== */
function normalizeListShape<T = unknown>(r: unknown, fallback: ListParams): ListResponse<T> {
  const rObj = r as Record<string, unknown>
  const data: T[] = Array.isArray(r) ? r : (rObj?.data ?? rObj?.items ?? rObj?.rows ?? []) as T[]
  const total = Array.isArray(r)
    ? data.length
    : Number(rObj?.total ?? (rObj?.meta as Record<string, unknown>)?.total ?? rObj?.totalItems ?? rObj?.count ?? data.length) || 0
  const page = Number(rObj?.page ?? (rObj?.meta as Record<string, unknown>)?.current_page ?? fallback.page ?? 1)
  const perPage = Number(rObj?.perPage ?? (rObj?.meta as Record<string, unknown>)?.per_page ?? fallback.perPage ?? 10)
  return { data, total, page, perPage }
}

export function formatDate(d?: string | Date | null) {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return isNaN(dt.getTime()) ? String(d ?? '') : dt.toLocaleDateString()
}

export function formatDateTime(d?: string | Date | null) {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return isNaN(dt.getTime()) ? String(d ?? '') : dt.toLocaleString()
}

/* ===== Etiqueta de convenio: "NOMBRE · NEGOCIO" ===== */
export interface ConvenioEtiquetable {
  nombre?: string | null
  establecimiento?: string | null
  codigo?: string | null
}

/**
 * Texto único para mostrar un convenio en toda la app: "NOMBRE · NEGOCIO".
 * Sin negocio, o si el nombre ya lo contiene (sin tildes ni mayúsculas, p. ej.
 * "ALVARO SANCHEZ / PARQUEADERO DAWTAWN" con negocio "PARQUEADERO DAWTAWN"),
 * queda solo el nombre, sin separador colgando.
 */
export function etiquetaConvenio(c?: ConvenioEtiquetable | null): string {
  if (!c) return ''
  const nombre = String(c.nombre ?? '').trim()
  const negocio = String(c.establecimiento ?? '').trim()
  if (!negocio) return nombre
  if (!nombre) return negocio
  const comparable = (s: string) => normalizarBusqueda(s).replace(/\s+/g, ' ')
  if (comparable(nombre).includes(comparable(negocio))) return nombre
  return `${nombre} · ${negocio}`
}

/** Igual que etiquetaConvenio con el código delante: "CÓDIGO — NOMBRE · NEGOCIO" (sin SIN-COD) */
export function etiquetaConvenioConCodigo(c?: ConvenioEtiquetable | null): string {
  if (!c) return ''
  const etiqueta = etiquetaConvenio(c)
  const codigo = String(c.codigo ?? '').trim().toUpperCase()
  return codigo && codigo !== 'SIN-COD' ? `${codigo} — ${etiqueta}` : etiqueta
}

function normalizarBusqueda(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * custom-filter de v-autocomplete para convenios: busca en nombre Y negocio,
 * sin tildes ni mayúsculas; cada palabra de la búsqueda debe aparecer.
 */
export function filtroConvenio(value: string, query: string, item?: { raw?: unknown }): boolean {
  const palabras = normalizarBusqueda(String(query ?? '')).split(/\s+/).filter(Boolean)
  if (!palabras.length) return true
  const raw = (item?.raw ?? null) as ConvenioEtiquetable | null
  const texto = normalizarBusqueda(
    [value, raw?.nombre, raw?.establecimiento].filter(Boolean).join(' ')
  )
  return palabras.every((p) => texto.includes(p))
}

/* ===== Convenios: catálogo para desplegables ===== */
/** Todos los convenios activos (sin paginar), ordenados por nombre */
export async function listConveniosLight(): Promise<ConvenioLight[]> {
  const r = await get<unknown>(`${API}/convenios/light`, {
    params: { select: 'id,nombre,establecimiento,codigo' },
  })
  const rObj = r as Record<string, unknown>
  const arr = Array.isArray(r) ? r : Array.isArray(rObj?.data) ? rObj.data : []
  return arr as ConvenioLight[]
}

/* ===== Convenios: LIST ===== */
export async function listConvenios(params: ListParams = {}) {
  const activoParam =
    params.activo === '' || params.activo === undefined
      ? undefined
      : params.activo === true || params.activo === 1
        ? 'true'
        : 'false'

  const vigenteParam = params.activo === undefined ? undefined : params.activo ? 'true' : 'false'

  const r = await get<unknown>(`${API}/convenios`, {
    params: {
      q: params.texto || undefined,
      activo: activoParam,
      page: params.page,
      perPage: params.perPage,
      sortBy: params.sortBy,
      order: params.order,
      vigente: vigenteParam,
      // 🆕
      estado: params.estado || undefined,
      ruta: params.ruta || undefined,
    },
  })
  return normalizeListShape<Convenio>(r, params)
}

export async function getConvenio(id: number) {
  return get<Convenio>(`${API}/convenios/${id}`)
}

export async function updateConvenio(id: number, payload: UpdateConvenioPayload) {
  return patch<Convenio, UpdateConvenioPayload>(`${API}/convenios/${id}`, payload)
}

/* ===== Catálogo de Agentes ===== */
export async function listAgentesCaptacion(tipo?: string) {
  try {
    const r = await get<{ data?: AgenteLight[] } | AgenteLight[]>(`${API}/agentes-captacion/light`, {
      params: {
        activos: 1,
        select: 'id,nombre,tipo',
        tipo: tipo || undefined,
      },
    })

    const agentes = Array.isArray(r) ? r : (r?.data ?? [])
    return agentes
  } catch (error) {
    console.error('Error cargando agentes:', error)
    return []
  }
}

/* ===== Asesor activo del convenio ===== */
export async function getAsesorActivo(convenioId: number): Promise<AsesorActivoResp> {
  const r = await get<unknown>(`${API}/convenios/${convenioId}/asesor-activo`)
  const rObj = r as Record<string, unknown>
  return {
    convenio_id: (rObj?.convenio_id ?? rObj?.convenioId ?? convenioId) as number,
    activo: (rObj?.activo ?? Boolean(rObj?.asesor)) as boolean,
    asesor: (rObj?.asesor ?? null) as { id: number; nombre: string; tipo?: string } | null,
    asignado_at: (rObj?.asignado_at ?? rObj?.desde ?? null) as string | null,
    desde: (rObj?.desde ?? rObj?.asignado_at ?? null) as string | null,
    asignacion_id: (rObj?.asignacion_id ?? rObj?.asignacionId ?? null) as number | null,
  }
}

/* ===== Vincular / desvincular asesor activo ===== */
export async function asignarAsesorConvenio(convenioId: number, payload: { asesor_id: number }) {
  return post<unknown, AsignarAsesorPayload>(`${API}/convenios/${convenioId}/asignar`, {
    asesor_id: payload.asesor_id,
    asesorId: payload.asesor_id,
    agente_captacion_id: payload.asesor_id,
    agenteCaptacionId: payload.asesor_id,
  })
}

export async function retirarAsesorConvenio(convenioId: number, payload?: { motivo?: string }) {
  return post<unknown, RetirarAsesorPayload>(`${API}/convenios/${convenioId}/retirar`, {
    motivo: payload?.motivo,
  })
}

/* ===== Crear dateo auto por convenio ===== */
export async function crearDateoAutoPorConvenio(body: CrearDateoAutoInput) {
  const payload: CrearDateoPayload = {
    canal: body.canal ?? 'ASESOR',
    origen: body.origen ?? 'UI',
    agente_id: body.agente_id ?? null,
    placa: body.placa ?? null,
    telefono: body.telefono ?? null,
    observacion: body.observacion ?? null,
    detectado_por_convenio: body.convenio_id,
  }
  return post<unknown, CrearDateoPayload>(`${API}/captacion-dateos`, payload)
}

/* ===== Convenios asignados a un asesor comercial ===== */
export async function listConveniosAsignados(asesorId: number): Promise<ConvenioSimple[]> {
  if (!asesorId) return []

  const r = await get<unknown>(`${API}/convenios/asignados`, {
    params: { asesor_id: asesorId },
  })

  if (Array.isArray(r)) return r as ConvenioSimple[]
  const rObj = r as Record<string, unknown>
  if (Array.isArray(rObj?.data)) return rObj.data as ConvenioSimple[]
  return []
}
