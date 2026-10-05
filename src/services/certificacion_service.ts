// src/services/certificacion_service.ts
import { get, post } from './http'

export type ResultadoCertificacion = 'APROBADA' | 'RECHAZADA'

/** Servicios con resultado Aprobada/Rechazada en Certificación ("Segunda vez"). */
export const SERVICIOS_CON_RESULTADO = ['RTM', 'PREV']

export class CertificacionService {
  /**
   * Sube la evidencia (pantallazo del FLUR) y crea la certificación.
   *
   * Backend (Adonis 6):
   *  - POST /api/certificaciones
   *  - Campos esperados:
   *      - turno_id: number
   *      - observaciones?: string
   *      - imagen: File
   *      - resultado?: 'APROBADA' | 'RECHAZADA' (obligatorio solo para RTM/PREV)
   */
  static async subirEvidencia(
    turnoId: number,
    file: File,
    observaciones?: string | null,
    resultado?: ResultadoCertificacion | null
  ) {
    const fd = new FormData()

    // 👈 mismos nombres que en CertificacionesController
    fd.append('turno_id', String(turnoId))
    fd.append('imagen', file)
    if (observaciones) {
      fd.append('observaciones', observaciones)
    }
    if (resultado) {
      fd.append('resultado', resultado)
    }

    // 👈 MUY IMPORTANTE: NO enviar Content-Type manual
    return post('/api/certificaciones', fd)
  }

  /**
   * Consulta la última certificación registrada para un turno.
   *
   * GET /api/certificaciones/turno/:turnoId
   */
  static async getByTurno(turnoId: number) {
    return get(`/api/certificaciones/turno/${turnoId}`)
  }
}
