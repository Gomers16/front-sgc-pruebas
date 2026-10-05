// src/services/certificacion_service.ts
import { get, patch, post } from './http'

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

  /**
   * Corrige el resultado de un turno RTM/PREV ya certificado (solo
   * SUPER_ADMIN / GERENCIA; queda auditado con el motivo).
   *
   * PATCH /api/certificaciones/:turnoId/resultado
   */
  static async corregirResultado(
    turnoId: number,
    resultado: ResultadoCertificacion,
    motivo: string
  ) {
    return patch<CorreccionResultadoResp, { resultado: ResultadoCertificacion; motivo: string }>(
      `/api/certificaciones/${turnoId}/resultado`,
      { resultado, motivo }
    )
  }
}

export interface CorreccionResultadoResp {
  message: string
  turno: {
    id: number
    resultadoCertificacion: ResultadoCertificacion | null
    rechazadoAt: string | null
    ventanaSegundaVezHasta: string | null
    esSegundaVez: boolean
  }
}
