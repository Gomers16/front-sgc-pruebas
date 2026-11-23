import { get } from './http'

const base = 'api/servicios'

export interface ServicioActivo {
  id: number
  codigoServicio: string
  nombre: string
}

/** GET /api/servicios manda el código en `codigo` (no en `codigoServicio`). */
export function normalizarServicios(filas: unknown): ServicioActivo[] {
  if (!Array.isArray(filas)) return []
  return (filas as Array<{ id: number; nombre: string; codigo?: string; codigoServicio?: string }>).map(
    (s) => ({ ...s, codigoServicio: s.codigoServicio ?? s.codigo ?? '' }),
  )
}

/** Servicio que DateoCreate preselecciona. */
export const servicioRtm = (servicios: ServicioActivo[]): ServicioActivo | undefined =>
  servicios.find((s) => s.codigoServicio.toUpperCase() === 'RTM')

export default {
  async getActivos(): Promise<ServicioActivo[]> {
    return normalizarServicios(await get<unknown>(base))
  },
}
