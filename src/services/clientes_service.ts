import { get, post, put, del } from './http'

/**
 * CLIENTES
 * Endpoints:
 *  - GET    /api/clientes?page=&perPage=&q=
 *  - GET    /api/clientes/:id
 *  - POST   /api/clientes   { nombre?, doc_tipo?, doc_numero?, telefono, email?, ciudad_id? }
 *  - PUT    /api/clientes/:id { nombre?, doc_tipo?, doc_numero?, telefono?, email?, ciudad_id? }
 *  - DELETE /api/clientes/:id
 *  - GET    /api/clientes/:id/detalle
 *  - GET    /api/clientes/:id/historial?page=&perPage=&servicioId=&servicioCodigo=&sedeId=&placa=&desde=&hasta=&estado=
 */

const base = 'api/clientes'

/* ===== Tipos ===== */
export type Cliente = {
  id: number
  nombre: string | null
  docTipo: 'CC' | 'NIT' | 'CE' | 'PAS' | null
  docNumero: string | null
  telefono: string
  email: string | null
  ciudadId: number | null
}

type ResumenMetricas = {
  vehiculos_count: number
  visitas_count: number
  ultima_visita_at: string | null
  dias_desde_ultima_visita: string | null
  servicios_top: Array<{ servicio_id: number; cnt: number }>
}

export type ClienteDetalle = {
  cliente: Cliente
  vehiculos: Array<{
    id: number
    placa: string
    marca?: string | null
    linea?: string | null
    modelo?: number | null
    clase?: { id: number; nombre?: string }
  }>
  /** backend nuevo */
  metricas?: ResumenMetricas
  /** compat: backend viejo */
  kpis?: ResumenMetricas
  visitas_recientes?: Array<{
    id: number
    fecha: string
    placa: string
    estado: string
    servicioNombre?: string | null
    sedeNombre?: string | null
    asesorNombre?: string | null
convenioNombre?: string | null
convenioEstablecimiento?: string | null
esRecurrente?: boolean | null
esRecuperacion?: boolean | null
  }>
}

export type ClienteHistorialItem = {
  id: number
  fecha: string
  horaIngreso: string | null
  horaSalida: string | null
  tiempoServicio: string | null
  turnoNumero: number
  turnoNumeroServicio: number | null
  turnoCodigo: string
  placa: string
  tipoVehiculo: string | null
  estado: 'activo' | 'cancelado' | 'finalizado'
  medioEntero: string | null
  canalAtribucion: string | null
  observaciones: string | null
  servicioCodigo: string | null
  servicioNombre: string | null
  sedeNombre: string | null
  asesorNombre?: string | null
  convenioNombre?: string | null
  convenioEstablecimiento?: string | null
  esRecurrente?: boolean | null
esRecuperacion?: boolean | null
}

export type Paginated<T> = {
  data: T[]
  page: number
  perPage: number
  total: number
  lastPage: number
}

/* ===== Service ===== */
export const ClientesService = {
  list(params?: { page?: number; perPage?: number; q?: string }) {
    return get(`${base}`, { params })
  },

  getById(id: number | string) {
    return get(`${base}/${id}`)
  },

  create(body: {
    nombre?: string | null
    doc_tipo?: 'CC' | 'NIT' | 'CE' | 'PAS' | null
    doc_numero?: string | null
    telefono: string
    email?: string | null
    ciudad_id?: number | null
  }) {
    return post(`${base}`, body)
  },

  update(
    id: number | string,
    body: {
      nombre?: string | null
      doc_tipo?: 'CC' | 'NIT' | 'CE' | 'PAS' | null
      doc_numero?: string | null
      telefono?: string
      email?: string | null
      ciudad_id?: number | null
    }
  ) {
    return put(`${base}/${id}`, body)
  },

  remove(id: number | string) {
    return del(`${base}/${id}`)
  },

  /** KPIs/Metricas + vehículos del cliente */
  detalle(id: number | string) {
    return get<ClienteDetalle>(`${base}/${id}/detalle`)
  },

  /** Trazabilidad paginada del cliente */
  historial(
    id: number | string,
    params?: {
      page?: number
      perPage?: number
      servicioId?: number
      servicioCodigo?: string
      sedeId?: number
      placa?: string
      desde?: string // YYYY-MM-DD
      hasta?: string // YYYY-MM-DD
      estado?: 'activo' | 'cancelado' | 'finalizado' | 'inactivo'
    }
  ) {
    return get<Paginated<ClienteHistorialItem>>(`${base}/${id}/historial`, { params })
  },
}
