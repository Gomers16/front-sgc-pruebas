// src/services/ticketsService.ts
import { get, post, patch } from '@/services/http'

export type TicketEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'RESUELTO' | 'CERRADO'

export interface TipoTicketLight {
  id: number
  codigo: string
  nombre: string
  rolesCreador?: string[]
  rolesResuelve?: string[]
  requiereAprobacionFinanciera?: boolean
}

/**
 * GET /tipos-ticket — catálogo de tipos de ticket que el usuario autenticado
 * puede CREAR, ya filtrado server-side por roles_creador (ver
 * tickets_controller.ts::tiposIndex()). No hace falta volver a filtrar por
 * rol en el frontend.
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
  asignadoAId: number | null
  moduloRelacionado: string | null
  createdAt: string
  resueltoAt: string | null
  cerradoAt: string | null
  tipoTicket?: TipoTicketLight | null
  creadoPor?: UsuarioLight | null
  asignadoA?: UsuarioLight | null
  comentarios?: TicketComentario[]
  detalle?: TicketDetalleExcepcionDateo | null
}

export interface TicketDetalleExcepcionDateo {
  id: number
  ticketId: number
  turnoId: number
  placa: string
  comercialId: number
  convenioId: number | null
  horaIngreso: string
  horaIntentoDateo: string
  minutosTotales: number
  minutosExceso: number
  observacion: string
  evidenciaChatUrl: string
  evidenciaGrupoWhatsappUrl: string
  evidenciaBloqueoUrl: string
  evidenciaCalamidadUrl: string | null
  porcentajePenalizacion: string | null
  aprobadoPorId: number | null
  aprobadoAt: string | null
  motivoRechazo: string | null
  rechazadoPorId: number | null
  rechazadoAt: string | null
  turno?: Record<string, unknown> | null
  comercial?: { id: number; nombre: string; tipo: string } | null
  convenio?: { id: number; nombre: string } | null
  aprobadoPor?: UsuarioLight | null
  rechazadoPor?: UsuarioLight | null
}

export interface ListTicketsParams {
  tipo_ticket_id?: number
  estado?: TicketEstado
  creado_por_id?: number
  [key: string]: string | number | boolean | null | undefined
}

export function listTickets(params: ListTicketsParams = {}) {
  return get<{ data: Ticket[] }>('/api/tickets', { params }).then((r) => r.data)
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
  convenio_id?: number | null
  observacion: string
  evidencia_chat_url: string
  evidencia_grupo_whatsapp_url: string
  evidencia_bloqueo_url: string
  evidencia_calamidad_url?: string | null
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
  montoCargoPenalizacion: number
  saldoActual: number
}

export function aprobarTicketExcepcionDateo(id: number, porcentajePenalizacion: number) {
  return patch<AprobarTicketExcepcionDateoResponse, { porcentaje_penalizacion: number }>(
    `/api/tickets-excepcion-dateo/${id}/aprobar`,
    { porcentaje_penalizacion: porcentajePenalizacion }
  )
}

export function rechazarTicketExcepcionDateo(id: number, motivo: string) {
  return patch<{ ticket: Ticket; detalle: TicketDetalleExcepcionDateo }, { motivo: string }>(
    `/api/tickets-excepcion-dateo/${id}/rechazar`,
    { motivo }
  )
}

/* ===================== Saldo de penalizaciones ===================== */

export interface MovimientoPenalizacion {
  id: number
  asesorId: number
  tipo: 'CARGO' | 'ABONO'
  monto: string
  ticketId: number | null
  origenCobro: 'COMISION' | 'NOMINA' | null
  comisionId: number | null
  observacion: string | null
  saldoResultante: string
  creadoPorId: number
  createdAt: string
  ticket?: Ticket | null
  creadoPor?: UsuarioLight | null
}

export interface SaldoPenalizacionesResponse {
  asesorId: number
  saldoActual: number
  movimientos: MovimientoPenalizacion[]
}

export function getSaldoPenalizaciones(asesorId: number) {
  return get<SaldoPenalizacionesResponse>(`/api/saldo-penalizaciones/${asesorId}`)
}

export type MotivoCobroSinEfecto = 'META_NO_CUMPLIDA' | 'SIN_BOLSA_DISPONIBLE' | 'SALDO_EN_CERO'

export interface CobrarSaldoPayload {
  monto: number
  origen: 'COMISION' | 'NOMINA'
  mes?: number
  anio?: number
  observacion?: string
}

export interface CobrarSaldoResponse {
  montoSolicitado: number
  montoCobrado: number
  saldoActual: number
  saldoPendiente?: number
  bolsaDisponible?: number
  motivo?: MotivoCobroSinEfecto
  mensaje?: string
  comisionesTocadas?: { comisionId: number; montoDescontado: number }[]
}

export function cobrarSaldoPenalizaciones(asesorId: number, payload: CobrarSaldoPayload) {
  return post<CobrarSaldoResponse, CobrarSaldoPayload>(
    `/api/saldo-penalizaciones/${asesorId}/cobrar`,
    payload
  )
}
