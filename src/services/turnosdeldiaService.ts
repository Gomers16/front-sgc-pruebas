// src/services/turnosdeldiaService.ts
import { DateTime } from 'luxon'
import { get, post, put, patch, download } from './http'

/* ================= Tipos base ================= */
export type TipoVehiculoFrontend =
  | 'Liviano Particular'
  | 'Liviano Taxi'
  | 'Liviano Público'
  | 'Motocicleta'

export type MedioEnteroFront = 'redes_sociales' | 'call_center' | 'fachada' | 'asesor'

export type MedioEnteroFinalDB =
  | 'Redes Sociales'
  | 'Call Center'
  | 'Fachada'
  | 'Asesor Comercial'

export type CanalAtrib = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
export type ServicioCodigo = 'RTM' | 'PREV' | 'PERI' | 'SOAT'

/* ====== Mapas ====== */
export const MEDIO_MAP: Record<MedioEnteroFront, MedioEnteroFinalDB> = {
  redes_sociales: 'Redes Sociales',
  call_center: 'Call Center',
  fachada: 'Fachada',
  asesor: 'Asesor Comercial',
}

const MEDIO_TO_CANAL: Record<MedioEnteroFront, CanalAtrib> = {
  redes_sociales: 'REDES',
  call_center: 'TELE',
  fachada: 'FACHADA',
  asesor: 'ASESOR',
}

/* ========== Helpers ========== */
function normalizePlate(v?: string) {
  return v ? v.replace(/[\s-]/g, '').toUpperCase() : ''
}
function to24hFrom12(s?: string) {
  if (!s) return ''
  const clean = s.trim().replace(/\./g, ':').toUpperCase()
  const m = clean.match(/^(\d{1,2})(?::?(\d{2}))?(?::?(\d{2}))?\s*(AM|PM)$/i)
  if (!m) return s
  let h = Number(m[1])
  const mm = m[2] ?? '00'
  const ss = m[3] ?? '00'
  const ap = (m[4] || 'AM').toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${mm}:${ss}`
}

/* ================= Normalizador de canal ================= */
function normalizeCanal(input?: string | null, medio?: MedioEnteroFront | null): CanalAtrib | null {
  const v = (input || '').toString().trim().toUpperCase()

  if (['FACHADA', 'ASESOR', 'TELE', 'REDES'].includes(v)) return v as CanalAtrib
  if (v === 'ASESOR_COMERCIAL') return 'ASESOR'

  if (['REDES', 'REDES_SOCIALES', 'SOCIAL', 'SOCIALES', 'RRSS'].includes(v)) return 'REDES'
  if (
    [
      'CALLCENTER',
      'CALL_CENTER',
      'CALL-CENTER',
      'CALL',
      'TELEMERCADEO',
      'TELEMARKETING',
      'TELÉFONO',
      'TELEFONO',
      'TELE',
    ].includes(v)
  )
    return 'TELE'
  if (['FACHADA', 'PASO', 'PASEO', 'PUERTA'].includes(v)) return 'FACHADA'
  if (['ASESOR', 'ASESOR INTERNO', 'ASESOR EXTERNO', 'COMERCIAL'].includes(v)) return 'ASESOR'

  if (medio) return MEDIO_TO_CANAL[medio]
  return null
}

/* ================= Interfaces ================= */
interface SiguienteTurnoResponse {
  siguiente: number
  siguientePorServicio?: number | null
  sedeId: number
}

export interface ServicioCatalog {
  id: number
  codigo: ServicioCodigo | string
  nombre: string
}

interface ServicioEnTurno {
  id: number
  codigoServicio: string
  nombreServicio: string
}

interface UsuarioLite {
  id: number
  nombres: string
  apellidos: string
}

interface SedeLite {
  id: number
  nombre: string
}

export interface AgenteCaptacionLite {
  id: number
  nombre: string
  tipo: 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | 'ASESOR_TELEMERCADEO' | string
}

export interface ConductorLite {
  id: number
  nombre: string
  telefono?: string | null
}

export interface Turno {
  id: number
  turnoNumero: number
  /** Consecutivo por servicio (puede venir como turnoNumeroServicio/turno_numero_servicio) */
  turnoNumeroServicio?: number
  /** Código único del turno (ej: RTM-20241106123456) */
  turnoCodigo?: string

  placa: string
  tipoVehiculo: TipoVehiculoFrontend
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
  horaIngreso: string | null
  horaSalida: string | null
  fecha: string

  // medioEntero ahora puede venir null desde el back
  medioEntero: MedioEnteroFinalDB | null
  observaciones: string | null
  funcionarioId: number
  tiempoServicio: string | null

  servicioId?: number
  servicio?: ServicioEnTurno | null
  usuario?: UsuarioLite
  sede?: SedeLite
  canalAtribucion?: CanalAtrib
  agenteCaptacion?: AgenteCaptacionLite | null

  // 👇 NUEVO: bandera de facturación confirmada y hora
  tieneFacturacion?: boolean | null
  horaFacturacion?: string | null

  // 👇 NUEVO: al menos una certificación asociada
  tieneCertificacion?: boolean | null

  // 👇 NUEVO: conductor asociado al turno
  conductor?: ConductorLite | null

  reasignadoDeTurnoId?: number | null

  // 👇 NUEVO: semáforo de etapas, calculado en backend (turno_etapas_service)
  // única fuente de verdad — no recalcular esto en el frontend.
  etapasRequeridas?: number
  etapasCompletadas?: number
  estadoVisual?: EstadoVisual
}

/**
 * Estados del semáforo de turnos. Única fuente de verdad para este tipo en
 * el frontend — se importa acá desde cualquier vista/componente que lo
 * necesite (ej. TurnosDelDia.vue), no se redeclara localmente. El cálculo
 * real vive en el backend: app/services/turno_etapas_service.ts.
 */
export type EstadoVisual = 'cancelado' | 'en_proceso' | 'incompleto' | 'finalizado'

/* ========== Filtros exportación ========== */
export interface ExportFilters {
  fechaInicio: string
  fechaFin: string
  servicioCodigo?: ServicioCodigo
  servicioId?: number
  canalAtribucion?: CanalAtrib
  agenteId?: number
  agenteTipo?: 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | 'ASESOR_TELEMERCADEO'
}

export interface ExportFiltersMultiple {
  fechaInicio: string
  fechaFin: string
  serviciosSeleccionados?: ServicioCodigo[]
  mediosSeleccionados?: MedioEnteroFinalDB[]
}

/* ========== Payloads ========== */
export interface CreateTurnoPayload {
  placa: string
  tipoVehiculo: TipoVehiculoFrontend
  observaciones?: string | null
  fecha: string
  horaIngreso: string
  usuarioId: number
  servicioId?: number
  servicioCodigo?: ServicioCodigo
  canal?: CanalAtrib
  agenteCaptacionId?: number | null
  medioEntero?: MedioEnteroFront
  clienteNombre?: string
  clienteTelefono?: string
  clienteEmail?: string
  /** 👇 Para vincular/consumir un dateo existente */
  dateoId?: number | null

  /** 👇 NUEVO: datos de conductor */
  conductorId?: number | null
  conductorTelefono?: string
  conductorNombre?: string
   asesorDetectadoId?: number | null
}

export interface UpdateTurnoPayload {
  placa?: string
  tipoVehiculo?: TipoVehiculoFrontend
  observaciones?: string | null
  usuarioId: number
  horaSalida?: string | null
  tiempoServicio?: string | null
  estado?: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
  servicioId?: number
  servicioCodigo?: ServicioCodigo
  canal?: CanalAtrib
  agenteCaptacionId?: number | null

  /** 👇 NUEVO: datos de conductor */
  conductorId?: number | null
  conductorTelefono?: string
  conductorNombre?: string
}

/* ================= SERVICE ================= */
class TurnosDelDiaService {
  private static readonly BASE = '/api/turnos-rtm'
  private static readonly EXPORT_PATH = `${TurnosDelDiaService.BASE}/export-excel`

  /* ====== Catálogo ====== */
  public static obtenerServicios() {
    return get<ServicioCatalog[]>('/api/servicios', {
      headers: { Accept: 'application/json' },
    })
  }

  public static getServicios() {
    return this.obtenerServicios()
  }

  /* ====== Turnos ====== */
  public static fetchNextTurnNumber(usuarioId: number, servicioId?: number) {
    const params: Record<string, string | number> = { usuarioId }
    if (typeof servicioId === 'number') params.servicioId = servicioId
    return get<SiguienteTurnoResponse>(`${this.BASE}/siguiente-turno`, {
      params,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    })
  }

  public static async fetchTurnos(filters: Record<string, string | number | boolean> = {}) {
    if (
      filters.tipoVehiculo &&
      !['Liviano Particular', 'Liviano Taxi', 'Liviano Público', 'Motocicleta'].includes(
        filters.tipoVehiculo as string
      )
    ) {
      delete filters.tipoVehiculo
    }

    return get<Turno[]>(this.BASE, {
      params: filters,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    })
  }

 public static fetchTurnoById(id: number) {
  return get<Turno>(`${this.BASE}/${id}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  })
}

  /** Crear turno (POST /api/turnos-rtm) */
  public static async createTurno(payload: CreateTurnoPayload) {
    const canalNorm = normalizeCanal(payload.canal || null, payload.medioEntero || null)
    const placaOk = normalizePlate(payload.placa)
    const horaOk =
      /^\d{2}:\d{2}(:\d{2})?$/.test(String(payload.horaIngreso))
        ? payload.horaIngreso
        : to24hFrom12(String(payload.horaIngreso))

    const body: Record<string, unknown> = {
      placa: placaOk,
      tipoVehiculo: payload.tipoVehiculo,
      observaciones: payload.observaciones ?? null,
      fecha: payload.fecha,
      horaIngreso: horaOk || payload.horaIngreso,
      usuarioId: payload.usuarioId,

      ...(canalNorm ? { canal: canalNorm } : {}),

      ...(payload.servicioId ? { servicioId: payload.servicioId } : {}),
      ...(payload.servicioCodigo ? { servicioCodigo: payload.servicioCodigo } : {}),
      ...(payload.agenteCaptacionId !== undefined
        ? { agenteCaptacionId: payload.agenteCaptacionId }
        : {}),

      ...(payload.clienteNombre ? { clienteNombre: payload.clienteNombre } : {}),
      ...(payload.clienteTelefono ? { clienteTelefono: payload.clienteTelefono } : {}),
      ...(payload.clienteEmail ? { clienteEmail: payload.clienteEmail } : {}),
      ...(payload.dateoId ? { dateoId: payload.dateoId } : {}),

      // 👇 NUEVO: datos de conductor hacia el backend
      ...(payload.conductorId !== undefined ? { conductorId: payload.conductorId } : {}),
      ...(payload.conductorTelefono ? { conductorTelefono: payload.conductorTelefono } : {}),
      ...(payload.conductorNombre ? { conductorNombre: payload.conductorNombre } : {}),
       ...(payload.asesorDetectadoId !== undefined ? { asesorDetectadoId: payload.asesorDetectadoId } : {}),
    }

    try {
      return await post<Turno, typeof body>(this.BASE, body, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })
    } catch (err: unknown) {
      const msg = TurnosDelDiaService.extractServerMessage(err)
      console.error('createTurno() falló:', msg, err)
      throw new Error(msg)
    }
  }

  /* ===== Actualizaciones ===== */
 public static updateTurno(id: number, turnoData: UpdateTurnoPayload) {
  return put<Turno, UpdateTurnoPayload>(`${this.BASE}/${id}`, turnoData, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  })
}
  public static registrarSalida(id: number, usuarioId: number) {
    return put<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/salida`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    )
  }

  public static activarTurno(id: number, usuarioId: number) {
    return patch<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/activar`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    )
  }

  public static cancelarTurno(id: number, usuarioId: number, motivoCancelacion: string) {
    return patch<Turno, { usuarioId: number; motivoCancelacion: string }>(
      `${this.BASE}/${id}/cancelar`,
      { usuarioId, motivoCancelacion },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    )
  }

  public static inhabilitarTurno(id: number, usuarioId: number) {
    return patch<Turno, { usuarioId: number }>(
      `${this.BASE}/${id}/inhabilitar`,
      { usuarioId },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    )
  }

  /* ===== Exportar Excel ===== */
  public static async exportTurnosExcel(filters: ExportFilters) {
    const params: Record<string, string | number> = {}
    if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio
    if (filters.fechaFin) params.fechaFin = filters.fechaFin
    if (typeof filters.servicioId === 'number') params.servicioId = filters.servicioId
    else if (filters.servicioCodigo) params.servicioCodigo = filters.servicioCodigo
    if (filters.canalAtribucion) params.canalAtribucion = filters.canalAtribucion
    if (typeof filters.agenteId === 'number') params.agenteId = filters.agenteId
    if (filters.agenteTipo) params.agenteTipo = filters.agenteTipo

    try {
      const blob = await download(this.EXPORT_PATH, params)
      let filename = `reporte_turnos_${DateTime.local().toISODate()}`
      if (filters.servicioCodigo) filename += `_${filters.servicioCodigo}`
      if (filters.canalAtribucion) filename += `_${filters.canalAtribucion}`
      filename += '.xlsx'
      return { data: blob, filename }
    } catch (error) {
      console.error('Error en exportTurnosExcel:', error)
      throw error
    }
  }

  /* ===== Exportar Excel Múltiple (Personalizado) ===== */
 /* ===== Exportar Excel Múltiple (Personalizado) ===== */
public static async exportTurnosExcelMultiple(filters: ExportFiltersMultiple) {
  const params: Record<string, string> = {
    fechaInicio: filters.fechaInicio,
    fechaFin: filters.fechaFin,
  }

  // ✅ Enviar como servicioCodigo (CSV de códigos)
  if (filters.serviciosSeleccionados && filters.serviciosSeleccionados.length > 0) {
    params.servicioCodigo = filters.serviciosSeleccionados.join(',')
  }

  // ✅ Convertir medios a canales y enviar como canalAtribucion
  if (filters.mediosSeleccionados && filters.mediosSeleccionados.length > 0) {
    const canalMap: Record<MedioEnteroFinalDB, CanalAtrib> = {
      'Fachada': 'FACHADA',
      'Redes Sociales': 'REDES',
      'Call Center': 'TELE',
      'Asesor Comercial': 'ASESOR',
    }
    const canales = filters.mediosSeleccionados.map(m => canalMap[m])
    params.canalAtribucion = canales.join(',')
  }

  try {
    const blob = await download(this.EXPORT_PATH, params)
    let filename = `reporte_turnos_${DateTime.local().toISODate()}`

    if (filters.serviciosSeleccionados && filters.serviciosSeleccionados.length > 0) {
      filename += `_${filters.serviciosSeleccionados.join('-')}`
    }
    if (filters.mediosSeleccionados && filters.mediosSeleccionados.length > 0) {
      filename += `_medios`
    }

    filename += '.xlsx'
    return { data: blob, filename }
  } catch (error) {
    console.error('Error en exportTurnosExcelMultiple:', error)
    throw error
  }
}
  /* ===== Exportar por Servicio específico ===== */
  public static async exportTurnosByServicio(
    fechaInicio: string,
    fechaFin: string,
    servicioCodigo: ServicioCodigo
  ) {
    const params: Record<string, string> = {
      fechaInicio,
      fechaFin,
      servicioCodigo,
    }

    try {
      const blob = await download(this.EXPORT_PATH, params)
      const filename = `reporte_${servicioCodigo}_${DateTime.local().toISODate()}.xlsx`
      return { data: blob, filename }
    } catch (error) {
      console.error('Error en exportTurnosByServicio:', error)
      throw error
    }
  }

  /* ===== Exportar por Medio específico ===== */
  public static async exportTurnosByMedio(
    fechaInicio: string,
    fechaFin: string,
    medio: MedioEnteroFinalDB
  ) {
    // Convertir el medio a canal de atribución para el filtro
    const canalMap: Record<MedioEnteroFinalDB, CanalAtrib> = {
      'Fachada': 'FACHADA',
      'Redes Sociales': 'REDES',
      'Call Center': 'TELE',
      'Asesor Comercial': 'ASESOR',
    }

    const params: Record<string, string> = {
      fechaInicio,
      fechaFin,
      canalAtribucion: canalMap[medio],
    }

    try {
      const blob = await download(this.EXPORT_PATH, params)
      const medioSlug = medio.toLowerCase().replace(/\s+/g, '_')
      const filename = `reporte_${medioSlug}_${DateTime.local().toISODate()}.xlsx`
      return { data: blob, filename }
    } catch (error) {
      console.error('Error en exportTurnosByMedio:', error)
      throw error
    }
  }

  private static extractServerMessage(err: unknown): string {
    const maybe = err as { response?: { data?: unknown }; message?: string }
    const data = maybe?.response?.data
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>
      const msg =
        (typeof d.message === 'string' && d.message) ||
        (typeof d.error === 'string' && d.error)
      if (msg) return msg
    }
    return maybe?.message || 'Error desconocido'
  }
}

export default TurnosDelDiaService
