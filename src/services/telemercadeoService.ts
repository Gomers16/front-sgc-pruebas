// src/services/telemercadeoService.ts
// Endpoints /api/telemercadeo/* (cola, gestiones, seguimiento, resumen,
// metas y configuración). Tipos fieles a telemercadeo_controller.ts y
// telemercadeo_gestion_service.ts / telemercadeo_resumen_service.ts del backend.
import { del, downloadConCabeceras, get, http, post, put, upload } from '@/services/http'

/* ═════════════════════════ Cola ═════════════════════════ */

export type ListaCola = 'POR_VENCER' | 'CLIENTES'
export type RangoPorVencer = 'PROXIMAS' | 'VENCIDAS'
export type RangoClientes = '0_1' | '2_5' | '6_11' | '12_23' | '24_MAS' | 'SIN_FECHA'
export type OrdenClientes = 'ANTIGUEDAD' | 'RECIENTE' | 'NOMBRE'
export type FuenteVisita = 'TURNO_CLIENTE' | 'TURNO_PLACA' | 'TICKET'

export type MedioGestion = 'LLAMADA' | 'WHATSAPP' | 'SMS' | 'CORREO'
export type ResultadoGestion =
  | 'SIN_RESPUESTA'
  | 'NUMERO_EQUIVOCADO'
  | 'VOLVER_A_LLAMAR'
  | 'INTERESADO'
  | 'NO_INTERESADO'
  | 'YA_REALIZADO'
  | 'DATEADO'
export type ResultadoElegible = Exclude<ResultadoGestion, 'DATEADO'>
export type MotivoCierreCiclo = 'DATEADO' | 'TURNO' | 'VENCIDO'
export type SemaforoColor = 'VERDE' | 'AMARILLO' | 'ROJO' | 'SIN_META'

/** Seguimiento de la placa con la gestión más reciente (seguimientoPorPlacas). */
export interface SeguimientoPlaca {
  placa: string
  /** Gestiones del ciclo vigente (0 si el ciclo ya cerró o vencería). */
  n: number
  limite: number
  ciclo_abierto: boolean
  ultima_gestion: {
    id: number
    fecha: string
    medio: MedioGestion
    resultado: ResultadoGestion
    agente_id: number
    agente_nombre: string | null
    servicio_id: number
  }
}

export interface RtmVigentePlaca {
  placa: string
  vence_el: string
  puede_datear_desde: string
}

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
  /** Solo CLIENTES: placas del cliente con RTM vigente. */
  rtm_vigentes: RtmVigentePlaca[]
  seguimiento: SeguimientoPlaca | null
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
export function normalizeListShape(
  r: unknown,
  fallback: { page: number; perPage: number },
): ColaResponse {
  const rObj = (r ?? {}) as Record<string, unknown>
  const meta = (rObj.meta ?? {}) as Record<string, unknown>
  const data = (Array.isArray(r) ? r : (rObj.data ?? rObj.items ?? rObj.rows ?? [])) as FilaCola[]
  const contadores = (meta.contadores ?? {}) as Partial<ContadoresCola>
  return {
    data: data.map((f) => ({
      ...f,
      rtm_vigentes: Array.isArray(f.rtm_vigentes) ? f.rtm_vigentes : [],
      seguimiento: f.seguimiento ?? null,
    })),
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

/** GET /api/telemercadeo/cola — cola de trabajo. */
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

/* ═════════════════════════ Catálogos ═════════════════════════ */

export interface OrigenTele {
  id: number
  codigo: string
  nombre: string
}

export interface CatalogosTele {
  origenes: OrigenTele[]
  medios: { value: MedioGestion; title: string }[]
  /** Solo los elegibles: DATEADO lo asigna el sistema al datear. */
  resultados: { value: ResultadoElegible; title: string }[]
}

/** Normaliza /catalogos y descarta DATEADO aunque llegara. */
export function normalizarCatalogos(r: unknown): CatalogosTele {
  const o = (r ?? {}) as Partial<{
    origenes: OrigenTele[]
    medios: CatalogosTele['medios']
    resultados: { value: ResultadoGestion; title: string }[]
  }>
  return {
    origenes: Array.isArray(o.origenes) ? o.origenes : [],
    medios: Array.isArray(o.medios) ? o.medios : [],
    resultados: (Array.isArray(o.resultados) ? o.resultados : []).filter(
      (x): x is { value: ResultadoElegible; title: string } => x.value !== 'DATEADO',
    ),
  }
}

/** GET /api/telemercadeo/catalogos */
export async function getCatalogosTele(): Promise<CatalogosTele> {
  return normalizarCatalogos(await get<unknown>('/api/telemercadeo/catalogos'))
}

/* ═════════════════════════ Gestiones ═════════════════════════ */

export interface SeguimientoGestion {
  ciclo_id: number
  numero_en_ciclo: number
  limite: number
  ciclo_abierto: boolean
  cerrado_motivo: MotivoCierreCiclo | null
}

export interface Gestion {
  id: number
  created_at: string | null
  agente_id: number
  agente_nombre: string | null
  placa: string
  telefono: string | null
  cliente_id: number | null
  cliente_nombre: string | null
  servicio_id: number
  servicio_codigo: string | null
  medio: MedioGestion
  origen_id: number
  origen_nombre: string | null
  resultado: ResultadoGestion
  observacion: string | null
  proximo_contacto_at: string | null
  captacion_dateo_id: number | null
  dateo_resultado: string | null
  evidencia_url: string
  seguimiento: SeguimientoGestion
}

export interface MetaPaginacion {
  total: number
  current_page: number
  per_page: number
  last_page: number
}

export interface GestionesFiltros {
  desde?: string | null
  hasta?: string | null
  placa?: string | null
  medio?: MedioGestion | null
  origen_id?: number | null
  resultado?: ResultadoGestion | null
  /** Solo SUPER_ADMIN/GERENCIA; un asesor siempre ve las suyas. */
  agente_id?: number | null
  pendientes?: boolean
  page?: number
  per_page?: number
}

/** { data, meta } del listado de gestiones, con valores por defecto seguros. */
export function normalizarPaginaGestiones(
  r: unknown,
  fallback: { page: number; perPage: number },
): { data: Gestion[]; meta: MetaPaginacion } {
  const o = (r ?? {}) as { data?: unknown; meta?: Partial<MetaPaginacion> }
  const perPage = Number(o.meta?.per_page ?? fallback.perPage) || fallback.perPage
  const total = Number(o.meta?.total ?? 0) || 0
  return {
    data: Array.isArray(o.data) ? (o.data as Gestion[]) : [],
    meta: {
      total,
      current_page: Number(o.meta?.current_page ?? fallback.page) || fallback.page,
      per_page: perPage,
      last_page: Number(o.meta?.last_page ?? Math.max(1, Math.ceil(total / perPage))),
    },
  }
}

/** GET /api/telemercadeo/gestiones → { data, meta } */
export async function listGestiones(f: GestionesFiltros, signal?: AbortSignal) {
  const page = f.page ?? 1
  const perPage = f.per_page ?? 25
  const r = await get<unknown>('/api/telemercadeo/gestiones', {
    params: {
      desde: f.desde || undefined,
      hasta: f.hasta || undefined,
      placa: f.placa?.trim() || undefined,
      medio: f.medio || undefined,
      origen_id: f.origen_id ?? undefined,
      resultado: f.resultado || undefined,
      agente_id: f.agente_id ?? undefined,
      pendientes: f.pendientes ? 1 : undefined,
      page,
      per_page: perPage,
    },
    signal,
  })
  return normalizarPaginaGestiones(r, { page, perPage })
}

/** GET /api/telemercadeo/gestiones/:id */
export function getGestion(id: number) {
  return get<Gestion>(`/api/telemercadeo/gestiones/${id}`)
}

/**
 * GET /api/telemercadeo/gestiones/:id/evidencia — imagen privada como Blob
 * (con Bearer). Quien la muestre debe revocar el object URL al cerrar.
 */
export function getEvidenciaBlob(id: number) {
  return http<Blob>(`/api/telemercadeo/gestiones/${id}/evidencia`, { expectJson: false })
}

export interface EvidenciaSubida {
  id: string
  url: null
  /** Ruta privada telemercadeo/AAAA/MM/<archivo>; va en evidencia_ruta. */
  ruta: string
  mime: string | null
  size: number
  hash: null
}

/**
 * POST /api/media/upload con carpeta=telemercadeo → devuelve `ruta` (no
 * una URL pública). uploadsService.uploadImage no manda la carpeta.
 */
export function subirEvidenciaTele(file: File) {
  const form = new FormData()
  form.append('file', file, file.name || 'evidencia')
  form.append('carpeta', 'telemercadeo')
  return upload<EvidenciaSubida>('/api/media/upload', form)
}

export interface EstadoSeguimiento {
  ciclo_id: number | null
  /** Gestiones ya hechas en el ciclo vigente (0 si no hay o si vencería). */
  n: number
  max: number
  extras_autorizados: number
  limite: number
  puede_registrar: boolean
}

export interface AvisosGestion {
  dateo_activo: {
    dateo_id: number
    agente_id: number | null
    es_propio: boolean
    bloquea_hasta: string | null
  } | null
  rtm_vigente: { vence_el: string; puede_datear_desde: string } | null
  /** Turno de hoy sin dateo: datear pedirá un ticket de Excepción de Dateo. */
  turno_hoy_sin_dateo?: {
    turno_id: number
    turno_numero: number | null
    hora_ingreso: string | null
  } | null
}

export interface RegistrarGestionBody {
  placa: string
  telefono?: string | null
  servicio_id?: number | null
  medio: MedioGestion
  origen_id: number
  resultado: ResultadoElegible
  evidencia_ruta: string
  observacion?: string | null
  /** AAAA-MM-DD */
  proximo_contacto_at?: string | null
  idempotency_key: string
}

export interface RegistrarGestionResp {
  gestion: Gestion
  seguimiento: EstadoSeguimiento
  avisos: AvisosGestion
  /** true = reenvío idempotente (200): la gestión ya existía. */
  repetida: boolean
}

/** POST /api/telemercadeo/gestiones — 201 nueva / 200 repetida. */
export function registrarGestion(body: RegistrarGestionBody) {
  return post<RegistrarGestionResp, RegistrarGestionBody>('/api/telemercadeo/gestiones', body)
}

/* ═════════════════════════ Seguimiento ═════════════════════════ */

export interface GestionCiclo {
  id: number
  numero_en_ciclo: number
  created_at: string | null
  medio: MedioGestion
  resultado: ResultadoGestion
  observacion: string | null
  agente_nombre: string | null
  origen_nombre: string | null
}

export interface SeguimientoResp {
  placa: string
  servicio_id: number
  vehiculo: { id: number; marca: string | null; linea: string | null; modelo: string | null } | null
  cliente: { id: number; nombre: string; telefono: string | null; documento: string | null } | null
  seguimiento: EstadoSeguimiento
  gestiones_ciclo: GestionCiclo[]
  avisos: AvisosGestion
}

/** GET /api/telemercadeo/seguimiento?placa=&servicio_id=&telefono= */
export function getSeguimiento(
  placa: string,
  opts: { servicio_id?: number | null; telefono?: string | null } = {},
  signal?: AbortSignal,
) {
  return get<SeguimientoResp>('/api/telemercadeo/seguimiento', {
    params: {
      placa,
      servicio_id: opts.servicio_id ?? undefined,
      telefono: opts.telefono || undefined,
    },
    signal,
  })
}

/* ═════════════════════════ Resumen y metas ═════════════════════════ */

export interface AvanceMeta {
  meta: number | null
  avance: number
  faltante: number | null
  /** % contra la meta completa. */
  pct: number | null
  /** % contra la meta prorrateada a hoy; decide el semáforo. */
  pct_ritmo: number | null
  semaforo: SemaforoColor
}

export type MetricaMeta = 'gestiones' | 'dateos' | 'exitosos'

export interface Embudo {
  gestiones: number
  dateos: number
  exitosos: number
  turnos: number
  tasa_dateo: number | null
  tasa_exito_sobre_dateos: number | null
  tasa_exito_sobre_gestiones: number | null
  tasa_turno_sobre_gestiones: number | null
}

export interface MiResumen extends Embudo {
  agente: { id: number; nombre: string }
  mes: number
  anio: number
  fraccion_transcurrida: number
  gestiones_hoy: number
  metas: Record<MetricaMeta, AvanceMeta>
  semaforo: SemaforoColor
}

/** GET /api/telemercadeo/mi-resumen?mes=&anio= */
export function getMiResumen(mes: number, anio: number) {
  return get<MiResumen>('/api/telemercadeo/mi-resumen', { params: { mes, anio } })
}

export interface ResumenAsesor extends Embudo {
  agente_id: number
  nombre: string
  activo: boolean
  metas: Record<MetricaMeta, AvanceMeta>
  semaforo: SemaforoColor
}

export interface ResumenTele {
  rango: { desde: string; hasta: string; fraccion_transcurrida: number }
  totales: Embudo
  por_medio: (Embudo & { medio: MedioGestion })[]
  por_resultado: { resultado: ResultadoGestion; gestiones: number }[]
  por_origen: (Embudo & { origen_id: number; codigo: string; nombre: string })[]
  por_asesor: ResumenAsesor[]
}

export interface RangoParams {
  desde?: string | null
  hasta?: string | null
  agente_id?: number | null
}

const paramsRango = (p: RangoParams) => ({
  desde: p.desde || undefined,
  hasta: p.hasta || undefined,
  agente_id: p.agente_id ?? undefined,
})

/** GET /api/telemercadeo/resumen */
export function getResumenTele(p: RangoParams, signal?: AbortSignal) {
  return get<ResumenTele>('/api/telemercadeo/resumen', { params: paramsRango(p), signal })
}

/** Nombre del archivo y aviso de truncado desde las cabeceras del Excel. */
export function leerCabecerasExcel(headers: Headers) {
  const disp = headers.get('content-disposition') || ''
  const nombre = /filename="?([^";]+)"?/i.exec(disp)?.[1] ?? 'Telemercadeo.xlsx'
  const t = Number(headers.get('x-detalle-truncado'))
  return { nombre, truncado: Number.isFinite(t) && t > 0 ? t : null }
}

/**
 * GET /api/telemercadeo/resumen/excel — Blob + nombre + `truncado` (tope de
 * filas del detalle si la cabecera X-Detalle-Truncado vino; si no, null).
 */
export async function descargarResumenExcel(p: RangoParams) {
  const { blob, headers } = await downloadConCabeceras(
    '/api/telemercadeo/resumen/excel',
    paramsRango(p),
  )
  return { blob, ...leerCabecerasExcel(headers) }
}

export interface AsesorTele {
  id: number
  nombre: string
  activo: boolean
  usuario_id: number | null
}

/** GET /api/telemercadeo/asesores */
export async function listAsesoresTele() {
  const r = await get<{ data?: AsesorTele[] }>('/api/telemercadeo/asesores')
  return r?.data ?? []
}

export interface MetaAsesorFila {
  asesor_id: number
  nombre: string
  activo: boolean
  meta_gestiones: number | null
  meta_dateos: number | null
  meta_exitosos: number | null
}

export interface MetasResp {
  mes: number
  anio: number
  data: MetaAsesorFila[]
}

export type MetaAsesorBody = Pick<
  MetaAsesorFila,
  'asesor_id' | 'meta_gestiones' | 'meta_dateos' | 'meta_exitosos'
>

/** GET /api/telemercadeo/metas?mes=&anio= */
export function getMetasTele(mes: number, anio: number) {
  return get<MetasResp>('/api/telemercadeo/metas', { params: { mes, anio } })
}

/** PUT /api/telemercadeo/metas — lote; las tres en null = sin meta (se borra). */
export function guardarMetasTele(mes: number, anio: number, metas: MetaAsesorBody[]) {
  return put<MetasResp>('/api/telemercadeo/metas', { mes, anio, metas })
}

export interface CopiarMetasBody {
  desde_mes: number
  desde_anio: number
  hacia_mes: number
  hacia_anio: number
  sobrescribir: boolean
}

/** POST /api/telemercadeo/metas/copiar */
export function copiarMetasTele(body: CopiarMetasBody) {
  return post<MetasResp & { copiadas: number; omitidas: number }, CopiarMetasBody>(
    '/api/telemercadeo/metas/copiar',
    body,
  )
}

export interface AutorizarExtraResp {
  ciclo_id: number
  extras_autorizados: number
  numero_gestiones: number
  autorizaciones: {
    id: number
    motivo: string
    created_at: string | null
    usuario_id: number
    usuario_nombre: string | null
  }[]
}

/** POST /api/telemercadeo/ciclos/:id/autorizar-extra { motivo } (5 a 500 caracteres) */
export function autorizarSeguimientoExtra(cicloId: number, motivo: string) {
  return post<AutorizarExtraResp>(`/api/telemercadeo/ciclos/${cicloId}/autorizar-extra`, {
    motivo,
  })
}

/* ═════════════════════════ Configuración ═════════════════════════ */

export interface ConfigSeguimientoTele {
  max_seguimientos: number
  dias_vigencia_ciclo: number
}

/** GET /api/telemercadeo/config/max-seguimientos */
export function getConfigSeguimientoTele() {
  return get<ConfigSeguimientoTele>('/api/telemercadeo/config/max-seguimientos')
}

/** POST /api/telemercadeo/config/max-seguimientos (1-50 y 1-365) */
export function guardarConfigSeguimientoTele(body: Partial<ConfigSeguimientoTele>) {
  return post<ConfigSeguimientoTele>('/api/telemercadeo/config/max-seguimientos', body)
}

export interface ConfigSeguimientoAsesor {
  id: number
  asesor_id: number
  asesor_nombre: string | null
  max_seguimientos: number | null
}

/** GET /api/telemercadeo/config/max-seguimientos/asesores */
export async function listConfigSeguimientoAsesores() {
  const r = await get<{ data?: ConfigSeguimientoAsesor[] }>(
    '/api/telemercadeo/config/max-seguimientos/asesores',
  )
  return r?.data ?? []
}

/** POST /api/telemercadeo/config/max-seguimientos/asesores (null = usa el global) */
export function guardarConfigSeguimientoAsesor(asesorId: number, max: number | null) {
  return post<Omit<ConfigSeguimientoAsesor, 'asesor_nombre'>>(
    '/api/telemercadeo/config/max-seguimientos/asesores',
    { asesor_id: asesorId, max_seguimientos: max },
  )
}

/** DELETE /api/telemercadeo/config/max-seguimientos/asesores/:id */
export function eliminarConfigSeguimientoAsesor(id: number) {
  return del<{ message: string }>(`/api/telemercadeo/config/max-seguimientos/asesores/${id}`)
}
