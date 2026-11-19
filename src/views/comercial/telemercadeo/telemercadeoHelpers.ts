// Helpers puros de Telemercadeo (sin Vue ni red): etiquetas, formato del
// seguimiento, presentación de metas (avance / ritmo / sin meta), fechas en
// Bogotá y mensajes de error de los endpoints. Tests en __tests__/.
import type {
  AvanceMeta,
  Gestion,
  MedioGestion,
  ResultadoGestion,
  SeguimientoPlaca,
  SemaforoColor,
} from '@/services/telemercadeoService'

export const ZONA_BOGOTA = 'America/Bogota'
/** Máximo de la observación (OBSERVACION_MAX del backend). */
export const OBSERVACION_MAX = 2000
/** Extensiones que acepta el backend para la evidencia (RE_EVIDENCIA). */
export const EXT_EVIDENCIA = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] as const

/* ───────────── Etiquetas ───────────── */

export const MEDIO_LABEL: Record<MedioGestion, string> = {
  LLAMADA: 'Llamada',
  WHATSAPP: 'WhatsApp',
  SMS: 'Mensaje de texto',
  CORREO: 'Correo',
}

export const MEDIO_ICONO: Record<MedioGestion, string> = {
  LLAMADA: 'mdi-phone',
  WHATSAPP: 'mdi-whatsapp',
  SMS: 'mdi-message-text',
  CORREO: 'mdi-email',
}

export const RESULTADO_LABEL: Record<ResultadoGestion, string> = {
  SIN_RESPUESTA: 'Sin respuesta',
  NUMERO_EQUIVOCADO: 'Número equivocado',
  VOLVER_A_LLAMAR: 'Volver a llamar',
  INTERESADO: 'Interesado',
  NO_INTERESADO: 'No interesado',
  YA_REALIZADO: 'Ya lo realizó',
  DATEADO: 'Dateado',
}

export const RESULTADO_COLOR: Record<ResultadoGestion, string> = {
  SIN_RESPUESTA: 'grey',
  NUMERO_EQUIVOCADO: 'error',
  VOLVER_A_LLAMAR: 'warning',
  INTERESADO: 'info',
  NO_INTERESADO: 'blue-grey',
  YA_REALIZADO: 'secondary',
  DATEADO: 'success',
}

export const etiquetaMedio = (m: string | null | undefined) =>
  m ? (MEDIO_LABEL[m as MedioGestion] ?? m) : '—'

export const etiquetaResultado = (r: string | null | undefined) =>
  r ? (RESULTADO_LABEL[r as ResultadoGestion] ?? r) : '—'

export const colorResultado = (r: string | null | undefined) =>
  r ? (RESULTADO_COLOR[r as ResultadoGestion] ?? 'grey') : 'grey'

export const MOTIVO_CIERRE_LABEL: Record<string, string> = {
  DATEADO: 'Cerrado: dateado',
  TURNO: 'Cerrado: hizo turno',
  VENCIDO: 'Cerrado: venció',
}

/* ───────────── Seguimiento ───────────── */

/** "Seguimiento 2 de 3". */
export function textoSeguimiento(n: number | null | undefined, max: number | null | undefined) {
  return `Seguimiento ${Number(n ?? 0)} de ${Number(max ?? 0)}`
}

/** "2/3" para columnas angostas. */
export const fraccionSeguimiento = (n: number | null | undefined, max: number | null | undefined) =>
  `${Number(n ?? 0)}/${Number(max ?? 0)}`

/** ¿Llegó al límite? (n >= max con max > 0). */
export const seguimientoAgotado = (n: number, max: number) => max > 0 && n >= max

/**
 * Gestión con la que "Datear" desde la cola debe ir: la última de la placa,
 * solo si su ciclo sigue abierto, es del propio asesor (si no, el backend
 * respondería 403 GESTION_AJENA) y aún no tiene dateo.
 */
export function gestionIdParaDatear(
  seg: SeguimientoPlaca | null | undefined,
  placa: string,
  agenteId: number | null | undefined,
): number | null {
  if (!seg || !agenteId) return null
  if (!seg.ciclo_abierto) return null
  if (seg.placa !== placa) return null
  if (seg.ultima_gestion.agente_id !== agenteId) return null
  if (seg.ultima_gestion.resultado === 'DATEADO') return null
  return seg.ultima_gestion.id
}

/** Fila del listado donde gerencia puede autorizar un seguimiento extra. */
export const puedeAutorizarExtra = (g: Pick<Gestion, 'seguimiento'>) =>
  g.seguimiento.ciclo_abierto && g.seguimiento.numero_en_ciclo >= g.seguimiento.limite

/* ───────────── Metas: avance y ritmo ───────────── */

export const SEMAFORO_COLOR: Record<Exclude<SemaforoColor, 'SIN_META'>, string> = {
  VERDE: 'success',
  AMARILLO: 'warning',
  ROJO: 'error',
}

export const SEMAFORO_LABEL: Record<SemaforoColor, string> = {
  VERDE: 'Al día',
  AMARILLO: 'Cerca',
  ROJO: 'Atrasado',
  SIN_META: 'Sin meta definida',
}

export const fmtPct = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? '—' : `${v}%`

export interface PresentacionMeta {
  sinMeta: boolean
  /** Cifra principal: "5 de 20" o solo "5" sin meta. */
  cifra: string
  /** "Avance 25%" contra la meta completa (null sin meta). */
  avance: string | null
  /** "Ritmo 80%" contra lo que toca a hoy (null sin meta). */
  ritmo: string | null
  /** "Faltan 15" (null sin meta). */
  faltante: string | null
  /** Color Vuetify del semáforo; null sin meta (nunca semáforo). */
  color: string | null
  etiqueta: string
  /** Para la barra: % de avance acotado a 0..100; null sin meta. */
  barra: number | null
}

/**
 * Presentación de una meta. Sin meta definida (meta null o <= 0, o
 * semáforo SIN_META): "Sin meta definida", sin % ni semáforo (nunca 0%).
 */
export function presentarMeta(a: AvanceMeta | null | undefined): PresentacionMeta {
  const avance = Number(a?.avance ?? 0)
  const sinMeta = !a || a.meta === null || a.meta <= 0 || a.semaforo === 'SIN_META'
  if (sinMeta) {
    return {
      sinMeta: true,
      cifra: String(avance),
      avance: null,
      ritmo: null,
      faltante: null,
      color: null,
      etiqueta: SEMAFORO_LABEL.SIN_META,
      barra: null,
    }
  }
  const semaforo = a.semaforo as Exclude<SemaforoColor, 'SIN_META'>
  return {
    sinMeta: false,
    cifra: `${avance} de ${a.meta}`,
    avance: `Avance ${fmtPct(a.pct)}`,
    ritmo: `Ritmo ${fmtPct(a.pct_ritmo)}`,
    faltante: a.faltante === null ? null : a.faltante > 0 ? `Faltan ${a.faltante}` : 'Meta cumplida',
    color: SEMAFORO_COLOR[semaforo] ?? null,
    etiqueta: SEMAFORO_LABEL[semaforo] ?? semaforo,
    barra: a.pct === null ? 0 : Math.max(0, Math.min(100, a.pct)),
  }
}

/* ───────────── Fechas en Bogotá ───────────── */

/** AAAA-MM-DD de hoy en Bogotá (no la del navegador). */
export function hoyBogota(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_BOGOTA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora)
}

export function mesActualBogota(ahora: Date = new Date()) {
  const [anio, mes] = hoyBogota(ahora).split('-').map(Number)
  return { mes, anio }
}

export function mesAnterior(m: { mes: number; anio: number }) {
  return m.mes === 1 ? { mes: 12, anio: m.anio - 1 } : { mes: m.mes - 1, anio: m.anio }
}

/** Primer y último día del mes (AAAA-MM-DD). */
export function rangoDeMes(mes: number, anio: number) {
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
  const mm = String(mes).padStart(2, '0')
  return { desde: `${anio}-${mm}-01`, hasta: `${anio}-${mm}-${String(ultimo).padStart(2, '0')}` }
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
export const nombreMes = (mes: number, anio?: number) =>
  `${MESES[mes - 1] ?? mes}${anio ? ` ${anio}` : ''}`

/** dd/mm/aaaa desde AAAA-MM-DD o ISO. */
export function fmtFecha(iso: string | null | undefined) {
  if (!iso) return '—'
  const [y, m, d] = iso.substring(0, 10).split('-')
  return d && m && y ? `${d}/${m}/${y}` : '—'
}

/** dd/mm/aaaa hh:mm en Bogotá desde un ISO con zona. */
export function fmtFechaHora(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA_BOGOTA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

/* ───────────── Formulario ───────────── */

/** Clave de idempotencia (8-64 alfanuméricos, - o _): un UUID. */
export function nuevaIdempotencyKey(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c?.randomUUID) return c.randomUUID()
  const r = () => Math.random().toString(36).slice(2, 10)
  return `${Date.now().toString(36)}-${r()}-${r()}`
}

/** Placa como la normaliza el backend (sin espacios ni guiones, mayúsculas). */
export const normalizarPlaca = (v: string | null | undefined) =>
  String(v ?? '').replace(/[\s-]/g, '').toUpperCase()

export const placaValida = (v: string | null | undefined) => /^[A-Z0-9]{4,10}$/.test(normalizarPlaca(v))

export const normalizarTelefono = (v: string | null | undefined) =>
  String(v ?? '').replace(/\D/g, '')

export const esExtensionEvidencia = (nombre: string) => {
  const ext = nombre.split('.').pop()?.toLowerCase() ?? ''
  return (EXT_EVIDENCIA as readonly string[]).includes(ext)
}

/* ───────────── Errores ───────────── */

export interface ErrorApi {
  status?: number
  data?: unknown
  message?: string
}

const leerCode = (data: unknown) =>
  data && typeof data === 'object' && 'code' in data ? String((data as { code: unknown }).code) : null

const leerMensaje = (data: unknown) =>
  data && typeof data === 'object' && 'message' in data
    ? String((data as { message: unknown }).message)
    : null

/** Mensaje claro para los errores de registrar una gestión. */
export function mensajeErrorGestion(err: ErrorApi): string {
  const code = leerCode(err.data)
  const d = (err.data ?? {}) as { n?: number; limite?: number }
  switch (code) {
    case 'SEGUIMIENTO_LIMITE':
      return `Este cliente ya tiene ${d.n ?? '?'} de ${d.limite ?? '?'} seguimientos en el ciclo. No se puede registrar otro: pide a gerencia que autorice un seguimiento extra.`
    case 'NO_ES_ASESOR_TELEMERCADEO':
      return 'Tu usuario no es asesor de Telemercadeo: no puede registrar gestiones.'
    case 'EVIDENCIA_INVALIDA':
    case 'EVIDENCIA_NO_EXISTE':
      return 'La evidencia no es válida o no se subió. Vuelve a adjuntar la imagen.'
    case 'PLACA_INVALIDA':
      return 'La placa no es válida.'
    case 'OBSERVACION_LARGA':
      return `La observación admite máximo ${OBSERVACION_MAX} caracteres.`
  }
  if (err.status === 403) return 'No tienes permiso para esta acción.'
  return leerMensaje(err.data) || err.message || 'No se pudo registrar la gestión.'
}

/** Códigos de store() de dateos propios del dateo desde una gestión. */
export function mensajeErrorDateoGestion(code: string | null | undefined): string | null {
  switch (code) {
    case 'GESTION_YA_DATEADA':
      return 'Esta gestión ya tiene un dateo vinculado. No se puede datear dos veces desde la misma gestión.'
    case 'GESTION_AJENA':
      return 'La gestión es de otro asesor. Solo quien registró la gestión puede datear desde ella.'
    case 'GESTION_PLACA_DISTINTA':
      return 'La placa del dateo debe ser la misma de la gestión.'
    case 'GESTION_NO_ENCONTRADA':
      return 'La gestión ya no existe.'
    case 'NO_ES_ASESOR_TELEMERCADEO':
      return 'Solo un asesor de Telemercadeo puede datear desde una gestión.'
    default:
      return null
  }
}
