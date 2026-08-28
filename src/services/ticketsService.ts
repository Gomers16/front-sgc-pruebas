// src/services/ticketsService.ts
import { get, post, patch, del } from '@/services/http'

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
  /** Snapshot calculado y persistido AL CREAR el ticket — no se recalcula. */
  dentroVentana: boolean
  observacion: string
  evidenciaChatUrl: string
  evidenciaGrupoWhatsappUrl: string
  evidenciaBloqueoUrl: string
  evidenciaCalamidadUrl: string | null
  /** Solo relevante fuera de ventana. Se llena al aprobar; null si dentroVentana. */
  conComision: boolean | null
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
  dentroVentana: boolean
  conComision: boolean | null
}

/**
 * conComision se ignora en el backend cuando el ticket está dentro de
 * ventana (detalle.dentroVentana === true) — se puede omitir en ese caso,
 * ver TicketExcepcionDateoDetail.vue.
 */
export function aprobarTicketExcepcionDateo(id: number, conComision?: boolean) {
  return patch<AprobarTicketExcepcionDateoResponse, { con_comision?: boolean }>(
    `/api/tickets-excepcion-dateo/${id}/aprobar`,
    conComision === undefined ? {} : { con_comision: conComision }
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

