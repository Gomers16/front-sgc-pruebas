// src/services/tarifasServiciosService.ts
import { get, post, put } from '@/services/http'

export interface TarifaServicio {
  id: number
  servicio_id: number
  servicio_codigo: string
  servicio_nombre: string
  tipo_vehiculo: 'MOTO' | 'VEHICULO'
  valor_base: number
  valor_total: number
  descripcion: string | null
  activo: boolean
  vigencia_desde: string | null
}

export interface TarifaServicioPayload {
  servicio_id: number
  tipo_vehiculo: 'MOTO' | 'VEHICULO'
  valor_base: number
  valor_total: number
  descripcion?: string
  vigencia_desde?: string
  activo?: boolean
}

const BASE = '/api/tarifas-servicios'

export async function getTarifasServicios(): Promise<TarifaServicio[]> {
  return get<TarifaServicio[]>(BASE)
}

export async function upsertTarifaServicio(
  payload: TarifaServicioPayload
): Promise<TarifaServicio> {
  return post<TarifaServicio, TarifaServicioPayload>(BASE, payload)
}

export async function updateTarifaServicio(
  id: number,
  payload: Partial<TarifaServicioPayload>
): Promise<TarifaServicio> {
  return put<TarifaServicio, Partial<TarifaServicioPayload>>(`${BASE}/${id}`, payload)
}
