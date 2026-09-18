// src/services/turneroMultimediaService.ts
import { get, post, patch, del } from './http'

export interface TurneroMultimediaItem {
  id: number
  tipo: 'imagen' | 'video'
  url: string
  duracionSegundos: number | null
  orden: number
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TurneroMultimediaResponse {
  success: boolean
  data?: TurneroMultimediaItem | TurneroMultimediaItem[]
  message?: string
}

export interface CrearMultimediaPayload {
  tipo: 'imagen' | 'video'
  url: string
  duracionSegundos?: number | null
  orden?: number
}

export interface ActualizarMultimediaPayload {
  duracionSegundos?: number | null
  orden?: number
  activo?: boolean
}

const turneroMultimediaService = {
  /** Todo (activos e inactivos) — la pantalla de configuración decide qué mostrar. */
  async getAll(): Promise<TurneroMultimediaResponse> {
    return get<TurneroMultimediaResponse>('/api/turnero/multimedia')
  },

  /** Solo registra metadata: el archivo ya se subió antes con uploadImage(). */
  async create(payload: CrearMultimediaPayload): Promise<TurneroMultimediaResponse> {
    return post<TurneroMultimediaResponse, CrearMultimediaPayload>('/api/turnero/multimedia', payload)
  },

  async update(id: number, payload: ActualizarMultimediaPayload): Promise<TurneroMultimediaResponse> {
    return patch<TurneroMultimediaResponse, ActualizarMultimediaPayload>(
      `/api/turnero/multimedia/${id}`,
      payload
    )
  },

  async delete(id: number): Promise<TurneroMultimediaResponse> {
    return del<TurneroMultimediaResponse>(`/api/turnero/multimedia/${id}`)
  },
}

export default turneroMultimediaService
