// src/services/turneroTickerService.ts
import { get, post, patch, del } from './http'

export interface TurneroMensajeTicker {
  id: number
  texto: string
  orden: number
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TurneroTickerResponse {
  success: boolean
  data?: TurneroMensajeTicker | TurneroMensajeTicker[]
  message?: string
}

export interface ActualizarMensajeTickerPayload {
  texto?: string
  orden?: number
  activo?: boolean
}

const turneroTickerService = {
  async getAll(): Promise<TurneroTickerResponse> {
    return get<TurneroTickerResponse>('/api/turnero/ticker')
  },

  async create(texto: string): Promise<TurneroTickerResponse> {
    return post<TurneroTickerResponse, { texto: string }>('/api/turnero/ticker', { texto })
  },

  async update(id: number, payload: ActualizarMensajeTickerPayload): Promise<TurneroTickerResponse> {
    return patch<TurneroTickerResponse, ActualizarMensajeTickerPayload>(
      `/api/turnero/ticker/${id}`,
      payload
    )
  },

  async delete(id: number): Promise<TurneroTickerResponse> {
    return del<TurneroTickerResponse>(`/api/turnero/ticker/${id}`)
  },
}

export default turneroTickerService
