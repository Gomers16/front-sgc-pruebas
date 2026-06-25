// src/services/tramitesService.ts
import { get, post, put, upload } from './http'

export type TipoTramite =
  | 'MATRICULA_REGISTRO'
  | 'TRASPASO'
  | 'TRASLADO_MATRICULA_REGISTRO'
  | 'RADICADO_MATRICULA_REGISTRO'
  | 'CAMBIO_COLOR'
  | 'CAMBIO_SERVICIO'
  | 'REGRABAR_MOTOR'
  | 'REGRABAR_CHASIS'
  | 'TRANSFORMACION'
  | 'DUPLICADO_LICENCIA_TRANSITO'
  | 'INSCRIPCION_PRENDA'
  | 'LEVANTA_PRENDA'
  | 'CANCELACION_MATRICULA_REGISTRO'
  | 'CAMBIO_PLACAS'
  | 'DUPLICADO_PLACAS'
  | 'REMATRICULA'
  | 'CAMBIO_CARROCERIA'
  | 'OTROS'

export type EstadoTramite  = 'en_espera' | 'en_atencion' | 'completado' | 'cancelado'
export type EstadoPago     = 'pendiente' | 'pagado' | 'exento'
export type FormaPago      = 'Efectivo' | 'Transferencia' | 'Cheque' | 'Mixto'
export type FormaPagoCobro = 'Efectivo' | 'Transferencia' | 'Datáfono'

export interface PaginatedMeta {
  total: number
  currentPage: number
  lastPage: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginatedMeta
}

export interface Tramite {
  id: number
  turnoNumero: number
  turnoCodigo: string
  nombreCliente: string
  cedula: string
  telefono: string | null
  email: string | null
  tipoTramite: TipoTramite | null
  tipoVehiculo: 'automovil' | 'motocicleta' | null
  placa: string | null
  estado: EstadoTramite
  fecha: string
  horaIngreso: string
  horaAtencion: string | null
  horaFin: string | null
  tiempoAtencion: string | null
  observaciones: string | null
  resultado: string | null
  valorVehiculo: number | null
  formaPago: FormaPago | null
  fechaEntrega: string | null
  destrate: number | null
  valorLiquidado: number | null
  estadoPago: EstadoPago | null
  formaPagoCobro: FormaPagoCobro | null
  referenciaPago: string | null
  fechaPago: string | null
  evidenciaPagoUrl: string | null
  incluyeCompraventa: boolean | null
  funcionario?: { id: number; nombres: string; apellidos: string }
  sede?: { id: number; nombre: string }
  servicio?: { id: number; codigoServicio: string; nombreServicio: string }
  advertencia?: string
}

export interface CreateTramitePayload {
  usuarioId: number
  servicioId: number
  nombreCliente: string
  cedula: string
  telefono?: string
  email?: string
  placa?: string | null
  tipoTramite?: TipoTramite | null
  observaciones?: string
  fecha?: string
  horaIngreso?: string
}

export interface AgregarTramitePayload {
  usuarioId: number
  servicioId: number
  nombreCliente: string
  cedula: string
  telefono?: string
  email?: string
  placa?: string | null
  tipoTramite?: TipoTramite | null
  observaciones?: string
  fecha?: string
  horaIngreso?: string
}

export interface UpdateTramitePayload {
  usuarioId?: number
  tipoTramite?: TipoTramite | null
  tipoVehiculo?: 'automovil' | 'motocicleta' | null
  estado?: EstadoTramite
  observaciones?: string
  resultado?: string
  valorVehiculo?: number | null
  formaPago?: FormaPago | null
  fechaEntrega?: string | null
  destrate?: number | null
  valorLiquidado?: number | null
  estadoPago?: EstadoPago | null
  formaPagoCobro?: FormaPagoCobro | null
  referenciaPago?: string | null
  fechaPago?: string | null
  incluyeCompraventa?: boolean | null
}

export const TIPOS_TRAMITE_ITEMS: { title: string; value: TipoTramite }[] = [
  { title: '1.  Matrícula / Registro',              value: 'MATRICULA_REGISTRO' },
  { title: '2.  Traspaso',                          value: 'TRASPASO' },
  { title: '3.  Traslado Matrícula / Registro',     value: 'TRASLADO_MATRICULA_REGISTRO' },
  { title: '4.  Radicado Matrícula / Registro',     value: 'RADICADO_MATRICULA_REGISTRO' },
  { title: '5.  Cambio de Color',                   value: 'CAMBIO_COLOR' },
  { title: '6.  Cambio de Servicio',                value: 'CAMBIO_SERVICIO' },
  { title: '7.  Regrabar Motor',                    value: 'REGRABAR_MOTOR' },
  { title: '8.  Regrabar Chasis',                   value: 'REGRABAR_CHASIS' },
  { title: '9.  Transformación',                    value: 'TRANSFORMACION' },
  { title: '10. Duplicado Licencia de Tránsito',    value: 'DUPLICADO_LICENCIA_TRANSITO' },
  { title: '11. Inscripción Prenda',                value: 'INSCRIPCION_PRENDA' },
  { title: '12. Levanta Prenda',                    value: 'LEVANTA_PRENDA' },
  { title: '13. Cancelación Matrícula / Registro',  value: 'CANCELACION_MATRICULA_REGISTRO' },
  { title: '14. Cambio de Placas',                  value: 'CAMBIO_PLACAS' },
  { title: '15. Duplicado de Placas',               value: 'DUPLICADO_PLACAS' },
  { title: '16. Rematrícula',                       value: 'REMATRICULA' },
  { title: '17. Cambio de Carrocería',              value: 'CAMBIO_CARROCERIA' },
  { title: '18. Otros',                             value: 'OTROS' },
]

export const ESTADO_CONFIG: Record<EstadoTramite, { label: string; color: string; icon: string }> = {
  en_espera:   { label: 'En espera',   color: 'warning', icon: 'mdi-clock-outline' },
  en_atencion: { label: 'En atención', color: 'info',    icon: 'mdi-account-clock' },
  completado:  { label: 'Completado',  color: 'success', icon: 'mdi-check-circle' },
  cancelado:   { label: 'Cancelado',   color: 'error',   icon: 'mdi-close-circle' },
}

const BASE = '/api/tramites'

export const TramitesService = {
  getAll(filters: Record<string, string | number> = {}) {
    return get<PaginatedResponse<Tramite>>(BASE, { params: filters })
  },

  getById(id: number) {
    return get<Tramite>(`${BASE}/${id}`)
  },

  create(payload: CreateTramitePayload) {
    return post<Tramite, CreateTramitePayload>(BASE, payload)
  },

  update(id: number, payload: UpdateTramitePayload) {
    return put<Tramite, UpdateTramitePayload>(`${BASE}/${id}`, payload)
  },

  siguienteNumero(usuarioId: number) {
    return get<{ siguiente: number; sedeId: number }>(`${BASE}/siguiente-numero`, {
      params: { usuarioId },
    })
  },

  getTarifa(tipo: TipoTramite, clase?: string) {
    return get<{ valor: number | null }>('/api/tarifas/tramite', {
      params: { tipo, ...(clase ? { clase } : {}) },
    })
  },

  registrarPago(id: number, formData: FormData) {
    return upload<Tramite>(`${BASE}/${id}/pago`, formData)
  },

  agregarATurno(turnoNumero: number, payload: AgregarTramitePayload) {
    return post<Tramite, AgregarTramitePayload>(`${BASE}/${turnoNumero}/agregar`, payload)
  },
}