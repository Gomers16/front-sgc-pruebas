// src/services/ticketsService.ts
import { get, post, patch, del, download } from '@/services/http'

// RESUELTO y CERRADO existen en el ENUM de la BD pero ningún flujo los asigna.
export type TicketEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'

export interface TipoTicketLight {
  id: number
  codigo: string
  nombre: string
  rolesCreador?: string[]
  rolesResuelve?: string[]
  /** El rol puede crear este tipo (roles_creador). */
  puedeCrear?: boolean
  /** El rol puede resolverlo (roles_resuelve o SUPER_ADMIN/GERENCIA). */
  puedeResolver?: boolean
}

/**
 * GET /tipos-ticket — tipos que el usuario puede CREAR o RESOLVER, con
 * puedeCrear/puedeResolver por tipo (ver tickets_controller.ts::tiposIndex()).
 */
export function listTiposTicket() {
  return get<{ data: TipoTicketLight[] }>('/api/tipos-ticket').then((r) => r.data)
}

export interface UsuarioLight {
  id: number
  nombres?: string
  apellidos?: string
  correo?: string
}

export interface TicketComentario {
  id: number
  ticketId: number
  usuarioId: number
  mensaje: string
  createdAt: string
  usuario?: UsuarioLight | null
}

export interface Ticket {
  id: number
  tipoTicketId: number
  titulo: string
  estado: TicketEstado
  creadoPorId: number
  moduloRelacionado: string | null
  createdAt: string
  resueltoAt: string | null
  tipoTicket?: TipoTicketLight | null
  creadoPor?: UsuarioLight | null
  comentarios?: TicketComentario[]
  detalle?: TicketDetalleExcepcionDateo | null
  /** Solo en GET /tickets/:id de EXCEPCION_DATEO: caso que aplica (o aplicó) aprobar(). */
  caso_comision?: CasoComision | null
  /** Solo en GET /tickets/:id: línea de tiempo. */
  eventos?: EventoTicket[]
  /** Solo en GET /tickets (bandeja). */
  resumen?: ResumenTicket
}

export type CasoComision = 'SIN_CONVENIO' | 'CONVENIO_SELF' | 'CONVENIO_COMERCIAL'

export type DecisionComision = 'con' | 'sin_asesor' | 'sin_convenio' | 'sin_ninguno' | 'regimen_anterior'

/** Fila de la bandeja: datos del detalle sin cargar el ticket completo. */
export interface ResumenTicket {
  placa: string | null
  /** Id interno (turnos_rtms.id). */
  turnoId: number | null
  /** Número visible del turno (el del día, se repite cada día). */
  turnoNumero: number | null
  /** YYYY-MM-DD */
  turnoFecha: string | null
  servicioCodigo: string | null
  comercialId: number | null
  comercialNombre: string | null
  convenioId: number | null
  convenioNombre: string | null
  convenioEstablecimiento: string | null
  dentroVentana: boolean | null
  minutosExceso: number | null
  decisionComision: DecisionComision | null
}

export type TipoEventoTicket = 'CREADO' | 'APROBADO' | 'RECHAZADO' | 'COMENTARIO' | 'CONVENIO_CORREGIDO'

export interface EventoTicket {
  id: number | null
  tipo: TipoEventoTicket
  usuarioId: number | null
  usuarioNombre: string | null
  fecha: string | null
  datos: Record<string, unknown> | null
  /** No estaba guardado: se armó desde el ticket (p. ej. lo resolvió producción local). */
  sintetico: boolean
}

export interface TicketDetalleExcepcionDateo {
  id: number
  ticketId: number
  turnoId: number
  placa: string
  comercialId: number
  convenioId: number | null
  /** Convenio con el que se pidió el ticket (si gerencia lo corrige, convenioId cambia). */
  convenioIdOriginal: number | null
  /** Intento de dateo; null en tickets anteriores a 2026-10. */
  canal: string | null
  servicioId: number | null
  descuentoId: number | null
  esAvance: boolean | number
  telefono: string | null
  horaIngreso: string
  horaIntentoDateo: string
  minutosTotales: number
  minutosExceso: number
  /** Snapshot calculado y persistido AL CREAR el ticket — no se recalcula. */
  dentroVentana: boolean
  observacion: string
  evidenciaChatUrl: string
  evidenciaGrupoWhatsappUrl: string
  evidenciaBloqueoUrl: string
  evidenciaCalamidadUrl: string | null
  /** Formato anterior (= flag del asesor). TINYINT: 0/1/null, nunca comparar con === true/false. */
  conComision: boolean | number | null
  /** Decisión separada (null = dentro de ventana, pendiente o sin convenio). TINYINT 0/1/null. */
  conComisionAsesor?: boolean | number | null
  conComisionConvenio?: boolean | number | null
  /** Foto del valor calculado antes de forzar a $0 (DECIMAL, llega como string). */
  montoAsesorCalculado?: string | null
  montoConvenioCalculado?: string | null
  aprobadoPorId: number | null
  aprobadoAt: string | null
  motivoRechazo: string | null
  rechazadoPorId: number | null
  rechazadoAt: string | null
  turno?: TurnoDelTicket | null
  comercial?: { id: number; nombre: string; tipo: string } | null
  convenio?: { id: number; nombre: string; establecimiento?: string | null } | null
  aprobadoPor?: UsuarioLight | null
  rechazadoPor?: UsuarioLight | null
}

/** Turno del detalle (GET /tickets/:id), con su servicio. */
export interface TurnoDelTicket {
  id: number
  turnoNumero: number | null
  fecha: string | null
  servicio?: { codigoServicio: string; nombreServicio?: string } | null
  [key: string]: unknown
}

/** Query params de GET /tickets, /estadisticas y /exportar (ver filtrosTickets.ts). */
export interface ListTicketsParams {
  tipo_ticket_id?: number
  estado?: TicketEstado
  creado_por_id?: number
  fecha_desde?: string
  fecha_hasta?: string
  comercial_id?: number
  convenio_id?: number
  ventana?: 'dentro' | 'fuera'
  placa?: string
  turno_id?: number
  /** Número visible del turno; combinarlo con fecha_desde/fecha_hasta. */
  turno_numero?: number
  decision?: DecisionComision
  page?: number
  per_page?: number
  [key: string]: string | number | boolean | null | undefined
}

export interface MetaPaginacion {
  total: number
  current_page: number
  per_page: number
  last_page: number
}

/** GET /tickets — bandeja paginada server-side. */
export function listTickets(params: ListTicketsParams = {}) {
  return get<{ data: Ticket[]; meta: MetaPaginacion }>('/api/tickets', { params })
}

/** GET /tickets/pendientes/contador (SUPER_ADMIN, GERENCIA). */
export function getContadorPendientesTickets() {
  return get<{ pendientes: number; por_tipo: Record<string, number> }>(
    '/api/tickets/pendientes/contador'
  )
}

export interface MontosTicket {
  asesor: number
  convenio: number
  tickets: number
}

export interface BloqueEstadisticasTickets {
  creados: number
  dentro_ventana: number
  fuera_ventana: number
  aprobados: {
    total: number
    con: number
    sin_asesor: number
    sin_convenio: number
    sin_ninguno: number
    regimen_anterior: number
  }
  rechazados: number
  pendientes: number
  tasa_aprobacion: number | null
  tiempo_promedio_resolucion_min: number | null
  dinero: {
    comision_real: MontosTicket & { por_estado: Record<string, MontosTicket> }
    en_proceso: MontosTicket
    dejado_de_pagar: MontosTicket & { exacto: MontosTicket; estimado: MontosTicket }
  }
}

export interface EstadisticasTickets {
  totales: BloqueEstadisticasTickets
  por_asesor: (BloqueEstadisticasTickets & { comercial_id: number; comercial_nombre: string | null })[]
  meta: {
    calculados_por_ticket: number
    calculo_truncado: boolean
    tope_aplicado: boolean
    limite_calculo_por_ticket: number
  }
}

/** GET /tickets/estadisticas (SUPER_ADMIN, GERENCIA). */
export function getEstadisticasTickets(params: ListTicketsParams = {}) {
  return get<EstadisticasTickets>('/api/tickets/estadisticas', { params })
}

/** GET /tickets/exportar (SUPER_ADMIN, GERENCIA) — Excel con los filtros; requiere Bearer. */
export function exportarTicketsExcel(params: ListTicketsParams = {}) {
  return download('/api/tickets/exportar', params)
}

export function getTicket(id: number) {
  return get<Ticket>(`/api/tickets/${id}`)
}

export function agregarComentario(ticketId: number, mensaje: string) {
  return post<TicketComentario, { ticket_id: number; mensaje: string }>('/api/tickets/comentarios', {
    ticket_id: ticketId,
    mensaje,
  })
}

/* ===================== Excepción de Dateo ===================== */

export interface CrearTicketExcepcionDateoPayload {
  turno_id: number
  comercial_id?: number
  observacion: string
  evidencia_chat_url: string
  evidencia_grupo_whatsapp_url: string
  evidencia_bloqueo_url: string
  evidencia_calamidad_url?: string | null
  // Intento de dateo (409 REQUIERE_TICKET_DATEO → history.state). El backend
  // lo vuelve a validar con la misma regla del dateo.
  canal?: string | null
  convenio_id?: number | null
  servicio_id?: number | null
  descuento_id?: number | null
  es_avance?: boolean
  comprobante_avance_url?: string | null
  telefono?: string | null
}

export function crearTicketExcepcionDateo(payload: CrearTicketExcepcionDateoPayload) {
  return post<{ ticket: Ticket; detalle: TicketDetalleExcepcionDateo }, CrearTicketExcepcionDateoPayload>(
    '/api/tickets-excepcion-dateo',
    payload
  )
}

export interface AprobarTicketExcepcionDateoResponse {
  ticket: Ticket
  detalle: TicketDetalleExcepcionDateo
  dateoId: number
  comisionId: number | null
  caso: CasoComision
  dentroVentana: boolean
  conComision: boolean | null
  conComisionAsesor: boolean | null
  conComisionConvenio: boolean | null
  convenioCorregido: boolean
}

/**
 * Body de PATCH /aprobar. Fuera de ventana: con_comision_asesor siempre y
 * con_comision_convenio en Caso 2/3 (ver decisionComision.ts). Dentro de
 * ventana se manda vacío. convenio_id solo si gerencia corrige el convenio
 * (null = sin convenio).
 */
export interface AprobarTicketBody {
  con_comision_asesor?: boolean
  con_comision_convenio?: boolean
  convenio_id?: number | null
}

export function aprobarTicketExcepcionDateo(id: number, body: AprobarTicketBody = {}) {
  return patch<AprobarTicketExcepcionDateoResponse, AprobarTicketBody>(
    `/api/tickets-excepcion-dateo/${id}/aprobar`,
    body
  )
}

/* ===================== Config: ventana de ticket sin penalización ===================== */

export function getVentanaTicketGlobal() {
  return get<{ minutos_ventana: number }>('/api/tickets/config/ventana')
}

export function setVentanaTicketGlobal(minutosVentana: number) {
  return post<{ minutos_ventana: number }, { minutos_ventana: number }>(
    '/api/tickets/config/ventana',
    { minutos_ventana: minutosVentana }
  )
}

export interface VentanaTicketAsesorRow {
  id: number
  asesor_id: number
  asesor_nombre: string | null
  minutos_ventana: number | null
}

export function getVentanaTicketAsesores(asesorId?: number) {
  return get<{ data: VentanaTicketAsesorRow[] }>('/api/tickets/config/ventana/asesores', {
    params: asesorId ? { asesorId } : {},
  })
}

export function setVentanaTicketAsesor(asesorId: number, minutosVentana: number | null) {
  return post<
    { id: number; asesor_id: number; minutos_ventana: number | null },
    { asesor_id: number; minutos_ventana: number | null }
  >('/api/tickets/config/ventana/asesores', { asesor_id: asesorId, minutos_ventana: minutosVentana })
}

export function deleteVentanaTicketAsesor(id: number) {
  return del<{ message: string }>(`/api/tickets/config/ventana/asesores/${id}`)
}

export function rechazarTicketExcepcionDateo(id: number, motivo: string) {
  return patch<{ ticket: Ticket; detalle: TicketDetalleExcepcionDateo }, { motivo: string }>(
    `/api/tickets-excepcion-dateo/${id}/rechazar`,
    { motivo }
  )
}

